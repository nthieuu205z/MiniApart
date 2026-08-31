package com.prj1.ccm.toanha;

import com.prj1.ccm.billing.calc.TinhMucTieuThuCongTo;
import com.prj1.ccm.nguoithue.AnhDinhKemService;
import com.prj1.ccm.nguoithue.NhatKyThaoTacRepository;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Objects;

@Service
public class ChiSoDichVuService {
    private static final String THONG_BAO_CHI_SO_LUI = "Chỉ số mới không được nhỏ hơn chỉ số cũ (%s). Nếu vừa thay công tơ, hãy chọn 'Thay công tơ'.";
    private static final String THONG_BAO_THIEU_ANH_CONG_TO = "Toà nhà này yêu cầu ảnh công tơ trước khi lưu chỉ số.";
    private static final String THONG_BAO_CANH_BAO_TIEU_THU = "Mức tiêu thụ kỳ này là %s, trung bình ba kỳ trước là %s, gấp %s lần.";
    private static final String THONG_BAO_KY_DA_CHOT = "Kỳ thanh toán đã chốt, không thể lưu thêm chỉ số bằng chức năng ghi mới.";
    private static final String THONG_BAO_KY_CHUA_CHOT = "Kỳ thanh toán chưa chốt, hãy dùng chức năng ghi chỉ số đang mở.";
    private static final String THONG_BAO_LY_DO_BAT_BUOC = "Cần nhập lý do khi chỉnh sửa chỉ số của kỳ đã chốt.";
    private static final String HANH_DONG_CAP_NHAT_CHI_SO = "CAP_NHAT_CHI_SO";
    private static final String DOI_TUONG_CHI_SO_DICH_VU = "CHI_SO_DICH_VU";

    private final PhanQuyenToaService phanQuyenToaService;
    private final KyThanhToanRepository kyThanhToanRepository;
    private final ChiSoDichVuRepository chiSoDichVuRepository;
    private final NhatKyThaoTacRepository nhatKyThaoTacRepository;
    private final AnhDinhKemService anhDinhKemService;
    private final Clock clock;
    private final BigDecimal nguongCanhBaoTieuThu;

    public ChiSoDichVuService(
            PhanQuyenToaService phanQuyenToaService,
            KyThanhToanRepository kyThanhToanRepository,
            ChiSoDichVuRepository chiSoDichVuRepository,
            NhatKyThaoTacRepository nhatKyThaoTacRepository,
            AnhDinhKemService anhDinhKemService,
            Clock clock,
            @Value("${app.toa-nha.canh-bao-tieu-thu-nguong:1.50}") BigDecimal nguongCanhBaoTieuThu
    ) {
        this.phanQuyenToaService = phanQuyenToaService;
        this.kyThanhToanRepository = kyThanhToanRepository;
        this.chiSoDichVuRepository = chiSoDichVuRepository;
        this.nhatKyThaoTacRepository = nhatKyThaoTacRepository;
        this.anhDinhKemService = anhDinhKemService;
        this.clock = clock;
        this.nguongCanhBaoTieuThu = nguongCanhBaoTieuThu;
    }

    /**
     * FR-MTR-01 loads the mobile meter-reading list for one visible building and payment period.
     * FR-MTR-04 supplies same-room history and the configured anomaly-warning context for each service.
     *
     * @param toaNhaId the building identifier
     * @param kyId the payment-period identifier
     * @param nguoiDung the authenticated user
     * @return the room/service reading grid
     */
    public ThongTinGhiChiSo danhSachChiSo(Long toaNhaId, Long kyId, NguoiDung nguoiDung) {
        ToaNha toaNha = kiemTraQuyen(nguoiDung, toaNhaId);
        KyThanhToan kyHienTai = layKyThanhToan(toaNha.id(), kyId);
        Long kyTruocId = layKyTruocId(toaNha.id(), kyHienTai);

        List<ChiSoDichVuRepository.DongChiSo> dongDuLieu = chiSoDichVuRepository.findChoNhap(
                toaNha.id(),
                kyHienTai.id(),
                kyTruocId
        );

        LinkedHashMap<Long, ThongTinGhiChiSo.PhongChiSo> phongTheoId = new LinkedHashMap<>();
        LinkedHashMap<Long, Boolean> phongDaGhi = new LinkedHashMap<>();
        for (ChiSoDichVuRepository.DongChiSo dong : dongDuLieu) {
            ThongTinGhiChiSo.PhongChiSo phong = phongTheoId.computeIfAbsent(
                    dong.phongId(),
                    ignore -> new ThongTinGhiChiSo.PhongChiSo(
                            dong.phongId(),
                            dong.soPhong(),
                            dong.tang(),
                            new java.util.ArrayList<>()
                    )
            );
            phong.dichVu().add(chuyenThanhDichVu(dong));
            phongDaGhi.put(
                    phong.id(),
                    phongDaGhi.getOrDefault(phong.id(), Boolean.TRUE) && dong.chiSoCuoi() != null
            );
        }

        long daGhi = phongDaGhi.values().stream().filter(Boolean::booleanValue).count();
        return new ThongTinGhiChiSo(dongDuLieu.stream().map(ChiSoDichVuRepository.DongChiSo::phongId).distinct().count(), daGhi, List.copyOf(phongTheoId.values()));
    }

    /**
     * FR-MTR-02 saves one room/service meter reading for one visible building and payment period.
     * FR-MTR-03 rejects readings lower than the previous reading unless the replacement-meter flag is explicitly declared.
     * FR-MTR-04 requires acknowledgement before saving an anomalously high consumption reading.
     * FR-MTR-09 calculates replacement-meter consumption from both meter segments.
     *
     * @param toaNhaId the building identifier
     * @param kyId the payment-period identifier
     * @param yeuCau the submitted reading
     * @param nguoiDung the authenticated user
     * @return the saved reading summary
     */
    @Transactional
    public ThongTinKetQuaGhiChiSo ghiChiSo(Long toaNhaId, Long kyId, YeuCauGhiChiSo yeuCau, NguoiDung nguoiDung) {
        return ghiChiSo(toaNhaId, kyId, yeuCau, null, nguoiDung);
    }

    @Transactional
    public ThongTinKetQuaGhiChiSo ghiChiSo(
            Long toaNhaId,
            Long kyId,
            YeuCauGhiChiSo yeuCau,
            MultipartFile tep,
            NguoiDung nguoiDung
    ) {
        ToaNha toaNha = kiemTraQuyen(nguoiDung, toaNhaId);
        KyThanhToan kyHienTai = layKyThanhToan(toaNha.id(), kyId);
        if (kyHienTai.trangThai() == TrangThaiKy.DA_CHOT) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_KY_DA_CHOT);
        }
        if (yeuCau == null || yeuCau.phongId() == null || yeuCau.dichVuId() == null || yeuCau.chiSoCuoi() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Yêu cầu ghi chỉ số không hợp lệ.");
        }

        ChiSoDichVuRepository.DongChiSo dong = chiSoDichVuRepository.findChoNhap(toaNha.id(), kyHienTai.id(), layKyTruocId(toaNha.id(), kyHienTai))
                .stream()
                .filter(item -> Objects.equals(item.phongId(), yeuCau.phongId()) && Objects.equals(item.dichVuId(), yeuCau.dichVuId()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        BigDecimal chiSoDau = dong.chiSoDau() == null ? BigDecimal.ZERO : dong.chiSoDau();
        BigDecimal chiSoCuoi = yeuCau.chiSoCuoi().setScale(2, RoundingMode.UNNECESSARY);
        boolean coThayCongTo = Boolean.TRUE.equals(yeuCau.coThayCongTo());
        BigDecimal chiSoCuoiCongToCu = chuanHoaChiSoThayCongTo(yeuCau.chiSoCuoiCongToCu());
        BigDecimal chiSoDauCongToMoi = chuanHoaChiSoThayCongTo(yeuCau.chiSoDauCongToMoi());
        if (coThayCongTo && (chiSoCuoiCongToCu == null || chiSoDauCongToMoi == null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần nhập chỉ số cuối công tơ cũ và chỉ số đầu công tơ mới.");
        }
        if (!coThayCongTo && (chiSoCuoiCongToCu != null || chiSoDauCongToMoi != null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ nhập chỉ số thay công tơ khi đã chọn 'Thay công tơ'.");
        }
        if (!coThayCongTo && chiSoCuoi.compareTo(chiSoDau) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, thongBaoChiSoLui(chiSoDau));
        }
        BigDecimal mucTieuThu = TinhMucTieuThuCongTo.tinh(
                chiSoDau, chiSoCuoi, chiSoCuoiCongToCu, chiSoDauCongToMoi
        ).setScale(2, RoundingMode.UNNECESSARY);
        ThongTinXacNhanCanhBaoTieuThu canhBaoTieuThuBatThuong = taoThongTinXacNhanCanhBao(dong, mucTieuThu);
        boolean daXacNhanCanhBaoChoBanGhiHienTai = dong.daXacNhanCanhBao()
                && cungGiaTriBanGhiHienTai(dong, chiSoCuoi, coThayCongTo, chiSoCuoiCongToCu, chiSoDauCongToMoi, mucTieuThu);
        if (canhBaoTieuThuBatThuong != null
                && !Boolean.TRUE.equals(yeuCau.xacNhanCanhBao())
                && !daXacNhanCanhBaoChoBanGhiHienTai) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, canhBaoTieuThuBatThuong.thongBaoCanhBao());
        }
        boolean coAnhMoi = tep != null && !tep.isEmpty();
        if (toaNha.batBuocAnhCongTo() && !coAnhMoi) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_THIEU_ANH_CONG_TO);
        }

        Long chiSoId = chiSoDichVuRepository.upsert(new ChiSoDichVu(
                null,
                kyHienTai.id(),
                yeuCau.phongId(),
                yeuCau.dichVuId(),
                chiSoDau.setScale(2, RoundingMode.UNNECESSARY),
                chiSoCuoi,
                chiSoCuoiCongToCu,
                chiSoDauCongToMoi,
                coThayCongTo,
                nguoiDung.id(),
                LocalDateTime.now(clock)
        ));
        Long anhCongToId = coAnhMoi
                ? anhDinhKemService.taiLenAnhChiSoDichVu(chiSoId, tep)
                : anhDinhKemService.layAnhMoiNhatIdChoChiSoDichVu(chiSoId);

        if (canhBaoTieuThuBatThuong != null && !daXacNhanCanhBaoChoBanGhiHienTai) {
            chiSoDichVuRepository.insertXacNhanCanhBao(new ChiSoDichVuRepository.XacNhanCanhBaoChiSo(
                    chiSoId,
                    nguoiDung.id(),
                    canhBaoTieuThuBatThuong.mucTieuThuKyNayAsBigDecimal(),
                    canhBaoTieuThuBatThuong.trungBinhBaKyTruocAsBigDecimal(),
                    canhBaoTieuThuBatThuong.gapTrungBinhAsBigDecimal(),
                    LocalDateTime.now(clock)
            ));
        }

        return new ThongTinKetQuaGhiChiSo(
                yeuCau.phongId(),
                yeuCau.dichVuId(),
                chiSoDau.setScale(2, RoundingMode.UNNECESSARY).toPlainString(),
                chiSoCuoi.toPlainString(),
                mucTieuThu.toPlainString(),
                coThayCongTo,
                dinhDangChiSoThayCongTo(chiSoCuoiCongToCu),
                dinhDangChiSoThayCongTo(chiSoDauCongToMoi),
                anhCongToId,
                canhBaoTieuThuBatThuong
        );
    }

    private boolean cungGiaTriBanGhiHienTai(
            ChiSoDichVuRepository.DongChiSo dong,
            BigDecimal chiSoCuoi,
            boolean coThayCongTo,
            BigDecimal chiSoCuoiCongToCu,
            BigDecimal chiSoDauCongToMoi,
            BigDecimal mucTieuThu
    ) {
        return bangNhau(dong.chiSoCuoi(), chiSoCuoi)
                && dong.coThayCongTo() == coThayCongTo
                && bangNhau(dong.chiSoCuoiCongToCu(), chiSoCuoiCongToCu)
                && bangNhau(dong.chiSoDauCongToMoi(), chiSoDauCongToMoi)
                && bangNhau(tinhMucTieuThuChoDong(dong), mucTieuThu);
    }

    private BigDecimal tinhMucTieuThuChoDong(ChiSoDichVuRepository.DongChiSo dong) {
        if (dong.chiSoCuoi() == null) {
            return null;
        }
        return TinhMucTieuThuCongTo.tinh(
                dong.chiSoDau(),
                dong.chiSoCuoi(),
                dong.chiSoCuoiCongToCu(),
                dong.chiSoDauCongToMoi()
        ).setScale(2, RoundingMode.UNNECESSARY);
    }

    private boolean bangNhau(BigDecimal benTrai, BigDecimal benPhai) {
        if (benTrai == null || benPhai == null) {
            return benTrai == benPhai;
        }
        return benTrai.compareTo(benPhai) == 0;
    }

    /**
     * FR-MTR-10 allows only the assigned owner to revise a closed-period meter reading and requires an audit reason.
     * FR-MTR-09 keeps replacement-meter fields consistent when the closed-period reading is revised.
     *
     * @param toaNhaId the building identifier
     * @param kyId the closed payment-period identifier
     * @param yeuCau the submitted closed-period revision
     * @param nguoiDung the authenticated user
     * @return the revised reading summary
     */
    @Transactional
    public ThongTinKetQuaGhiChiSo capNhatChiSoDaChot(
            Long toaNhaId,
            Long kyId,
            YeuCauCapNhatChiSoDaChot yeuCau,
            NguoiDung nguoiDung
    ) {
        ToaNha toaNha = kiemTraQuyenCapNhatKyDaChot(nguoiDung, toaNhaId);
        KyThanhToan kyThanhToan = layKyThanhToan(toaNha.id(), kyId);
        if (kyThanhToan.trangThai() != TrangThaiKy.DA_CHOT) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_KY_CHUA_CHOT);
        }
        if (yeuCau == null || yeuCau.phongId() == null || yeuCau.dichVuId() == null || yeuCau.chiSoCuoi() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Yêu cầu ghi chỉ số không hợp lệ.");
        }
        if (yeuCau.lyDo() == null || yeuCau.lyDo().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_LY_DO_BAT_BUOC);
        }

        ChiSoDichVu chiSoHienTai = chiSoDichVuRepository.findByKyPhongDichVu(kyThanhToan.id(), yeuCau.phongId(), yeuCau.dichVuId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        BigDecimal chiSoDau = chiSoHienTai.chiSoDau().setScale(2, RoundingMode.UNNECESSARY);
        BigDecimal chiSoCuoi = yeuCau.chiSoCuoi().setScale(2, RoundingMode.UNNECESSARY);
        boolean coThayCongTo = yeuCau.coThayCongTo() != null ? yeuCau.coThayCongTo() : chiSoHienTai.coThayCongTo();
        BigDecimal chiSoCuoiCongToCu = resolveChiSoThayCongTo(
                coThayCongTo,
                yeuCau.coThayCongTo(),
                yeuCau.chiSoCuoiCongToCu(),
                chiSoHienTai.chiSoCuoiCongToCu()
        );
        BigDecimal chiSoDauCongToMoi = resolveChiSoThayCongTo(
                coThayCongTo,
                yeuCau.coThayCongTo(),
                yeuCau.chiSoDauCongToMoi(),
                chiSoHienTai.chiSoDauCongToMoi()
        );
        if (coThayCongTo && (chiSoCuoiCongToCu == null || chiSoDauCongToMoi == null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần nhập chỉ số cuối công tơ cũ và chỉ số đầu công tơ mới.");
        }
        if (!coThayCongTo && (yeuCau.chiSoCuoiCongToCu() != null || yeuCau.chiSoDauCongToMoi() != null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ nhập chỉ số thay công tơ khi đã chọn 'Thay công tơ'.");
        }
        if (!coThayCongTo && chiSoCuoi.compareTo(chiSoDau) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, thongBaoChiSoLui(chiSoDau));
        }

        BigDecimal mucTieuThu = TinhMucTieuThuCongTo.tinh(
                chiSoDau, chiSoCuoi, chiSoCuoiCongToCu, chiSoDauCongToMoi
        ).setScale(2, RoundingMode.UNNECESSARY);
        LocalDateTime thoiDiemCapNhat = LocalDateTime.now(clock);
        ChiSoDichVu chiSoCapNhat = new ChiSoDichVu(
                chiSoHienTai.id(),
                chiSoHienTai.kyId(),
                chiSoHienTai.phongId(),
                chiSoHienTai.dichVuId(),
                chiSoDau,
                chiSoCuoi,
                chiSoCuoiCongToCu,
                chiSoDauCongToMoi,
                coThayCongTo,
                chiSoHienTai.nguoiGhiId(),
                chiSoHienTai.thoiDiemGhi()
        );
        chiSoDichVuRepository.capNhat(chiSoCapNhat);
        nhatKyThaoTacRepository.ghi(
                nguoiDung.id(),
                HANH_DONG_CAP_NHAT_CHI_SO,
                DOI_TUONG_CHI_SO_DICH_VU,
                dinhDangGiaTriNhatKy(chiSoHienTai),
                dinhDangGiaTriNhatKy(chiSoCapNhat),
                chiSoCapNhat.phongId(),
                chiSoCapNhat.dichVuId(),
                yeuCau.lyDo().trim(),
                thoiDiemCapNhat
        );

        return new ThongTinKetQuaGhiChiSo(
                chiSoCapNhat.phongId(),
                chiSoCapNhat.dichVuId(),
                chiSoDau.toPlainString(),
                chiSoCuoi.toPlainString(),
                mucTieuThu.toPlainString(),
                coThayCongTo,
                dinhDangChiSoThayCongTo(chiSoCuoiCongToCu),
                dinhDangChiSoThayCongTo(chiSoDauCongToMoi),
                null,
                null
        );
    }

    private ToaNha kiemTraQuyen(NguoiDung nguoiDung, Long toaNhaId) {
        if (nguoiDung == null || (nguoiDung.vaiTro() != VaiTro.CHU
                && nguoiDung.vaiTro() != VaiTro.QUAN_LY)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, toaNhaId);
    }

    private ToaNha kiemTraQuyenCapNhatKyDaChot(NguoiDung nguoiDung, Long toaNhaId) {
        if (nguoiDung == null || nguoiDung.vaiTro() != VaiTro.CHU) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, toaNhaId);
    }

    private KyThanhToan layKyThanhToan(Long toaNhaId, Long kyId) {
        return kyThanhToanRepository.findByIdAndToaNhaId(kyId, toaNhaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private Long layKyTruocId(Long toaNhaId, KyThanhToan kyHienTai) {
        return kyThanhToanRepository.findByToaNhaId(toaNhaId).stream()
                .filter(ky -> ky.ngayKetThuc().isBefore(kyHienTai.ngayBatDau()))
                .findFirst()
                .map(KyThanhToan::id)
                .orElse(null);
    }

    private ThongTinGhiChiSo.DichVuChiSo chuyenThanhDichVu(ChiSoDichVuRepository.DongChiSo dong) {
        BigDecimal chiSoDau = dong.chiSoDau() == null ? BigDecimal.ZERO : dong.chiSoDau();
        String chiSoCuoi = dong.chiSoCuoi() == null ? null : dong.chiSoCuoi().setScale(2, RoundingMode.UNNECESSARY).toPlainString();
        String mucTieuThu = dong.chiSoCuoi() == null ? null : TinhMucTieuThuCongTo.tinh(
                chiSoDau, dong.chiSoCuoi(), dong.chiSoCuoiCongToCu(), dong.chiSoDauCongToMoi()
        ).setScale(2, RoundingMode.UNNECESSARY).toPlainString();
        return new ThongTinGhiChiSo.DichVuChiSo(
                dong.dichVuId(),
                dong.tenDichVu(),
                dong.donVi(),
                chiSoDau.setScale(2, RoundingMode.UNNECESSARY).toPlainString(),
                chiSoCuoi,
                mucTieuThu,
                dong.coThayCongTo(),
                dinhDangChiSoThayCongTo(dong.chiSoCuoiCongToCu()),
                dinhDangChiSoThayCongTo(dong.chiSoDauCongToMoi()),
                dong.anhCongToId(),
                dong.daXacNhanCanhBao(),
                taoThongTinCanhBao(dong)
        );
    }

    private String thongBaoChiSoLui(BigDecimal chiSoDau) {
        return THONG_BAO_CHI_SO_LUI.formatted(chiSoDau.setScale(2, RoundingMode.UNNECESSARY).toPlainString());
    }

    private BigDecimal chuanHoaChiSoThayCongTo(BigDecimal chiSo) {
        return chiSo == null ? null : chiSo.setScale(2, RoundingMode.UNNECESSARY);
    }

    private BigDecimal resolveChiSoThayCongTo(
            boolean coThayCongTo,
            Boolean coThayCongToTrongYeuCau,
            BigDecimal giaTriYeuCau,
            BigDecimal giaTriHienTai
    ) {
        if (!coThayCongTo) {
            return null;
        }
        if (giaTriYeuCau != null) {
            return chuanHoaChiSoThayCongTo(giaTriYeuCau);
        }
        if (Boolean.TRUE.equals(coThayCongToTrongYeuCau) || coThayCongToTrongYeuCau == null) {
            return giaTriHienTai == null ? null : giaTriHienTai.setScale(2, RoundingMode.UNNECESSARY);
        }
        return null;
    }

    private String dinhDangChiSoThayCongTo(BigDecimal chiSo) {
        return chiSo == null ? null : chiSo.toPlainString();
    }

    private String dinhDangGiaTriNhatKy(ChiSoDichVu chiSoDichVu) {
        return """
                {"chiSoDau":"%s","chiSoCuoi":"%s","coThayCongTo":%s,"chiSoCuoiCongToCu":%s,"chiSoDauCongToMoi":%s}
                """.formatted(
                chiSoDichVu.chiSoDau().setScale(2, RoundingMode.UNNECESSARY).toPlainString(),
                chiSoDichVu.chiSoCuoi().setScale(2, RoundingMode.UNNECESSARY).toPlainString(),
                chiSoDichVu.coThayCongTo(),
                giaTriJsonNullable(chiSoDichVu.chiSoCuoiCongToCu()),
                giaTriJsonNullable(chiSoDichVu.chiSoDauCongToMoi())
        ).replace("\n", "");
    }

    private String giaTriJsonNullable(BigDecimal giaTri) {
        if (giaTri == null) {
            return "null";
        }
        return "\"%s\"".formatted(giaTri.setScale(2, RoundingMode.UNNECESSARY).toPlainString());
    }

    private ThongTinCanhBaoTieuThu taoThongTinCanhBao(ChiSoDichVuRepository.DongChiSo dong) {
        if (dong.soKyLichSu() == null || dong.soKyLichSu() < 3 || dong.trungBinhBaKyTruoc() == null) {
            return null;
        }
        return new ThongTinCanhBaoTieuThu(
                dong.soKyLichSu(),
                dong.trungBinhBaKyTruoc().setScale(2, RoundingMode.HALF_UP).toPlainString(),
                nguongCanhBaoTieuThu.setScale(2, RoundingMode.HALF_UP).toPlainString()
        );
    }

    private ThongTinXacNhanCanhBaoTieuThu taoThongTinXacNhanCanhBao(ChiSoDichVuRepository.DongChiSo dong, BigDecimal mucTieuThu) {
        if (dong.soKyLichSu() == null || dong.soKyLichSu() < 3 || dong.trungBinhBaKyTruoc() == null) {
            return null;
        }
        BigDecimal trungBinh = dong.trungBinhBaKyTruoc().setScale(2, RoundingMode.HALF_UP);
        if (trungBinh.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }
        BigDecimal nguong = trungBinh.multiply(nguongCanhBaoTieuThu);
        if (mucTieuThu.compareTo(nguong) <= 0) {
            return null;
        }

        BigDecimal gap = mucTieuThu.divide(trungBinh, 2, RoundingMode.HALF_UP);
        return new ThongTinXacNhanCanhBaoTieuThu(
                true,
                THONG_BAO_CANH_BAO_TIEU_THU.formatted(
                        mucTieuThu.setScale(2, RoundingMode.HALF_UP).toPlainString(),
                        trungBinh.toPlainString(),
                        gap.toPlainString()
                ),
                mucTieuThu.setScale(2, RoundingMode.HALF_UP).toPlainString(),
                trungBinh.toPlainString(),
                gap.toPlainString(),
                nguongCanhBaoTieuThu.setScale(2, RoundingMode.HALF_UP).toPlainString()
        );
    }
}
