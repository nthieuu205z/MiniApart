package com.prj1.ccm.toanha;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.Method;
import java.sql.SQLException;
import java.time.DateTimeException;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;

@Service
public class KyThanhToanService {
    static final String CONSTRAINT_TRUNG_NAM_THANG = "uq_ky_thanhtoan_toa_nam_thang";
    static final String CONSTRAINT_MOT_KY_MO = "uq_ky_thanhtoan_toa_dang_mo";
    private static final String THONG_BAO_YEU_CAU_KHONG_HOP_LE = "Yêu cầu mở kỳ thanh toán không hợp lệ.";
    private static final String THONG_BAO_TRUNG_KY = "Toà nhà đã có kỳ thanh toán cho tháng này.";
    private static final String THONG_BAO_DANG_CO_KY_MO = "Toà nhà đang có một kỳ thanh toán mở.";
    private static final String THONG_BAO_KY_KHONG_MO = "Kỳ thanh toán không còn ở trạng thái mở.";
    private static final String THONG_BAO_XUNG_DOT_CHOT_KY = "Không thể chốt kỳ do xung đột dữ liệu.";
    private static final String THONG_BAO_XUNG_DOT_DU_LIEU = "Không thể mở kỳ thanh toán do xung đột dữ liệu.";

    private final PhanQuyenToaService phanQuyenToaService;
    private final KyThanhToanRepository kyThanhToanRepository;
    private final ChiSoDichVuRepository chiSoDichVuRepository;

    public KyThanhToanService(
            PhanQuyenToaService phanQuyenToaService,
            KyThanhToanRepository kyThanhToanRepository,
            ChiSoDichVuRepository chiSoDichVuRepository
    ) {
        this.phanQuyenToaService = phanQuyenToaService;
        this.kyThanhToanRepository = kyThanhToanRepository;
        this.chiSoDichVuRepository = chiSoDichVuRepository;
    }

    public List<ThongTinKyThanhToan> danhSachKyThanhToan(Long toaNhaId, NguoiDung nguoiDung) {
        ToaNha toaNha = kiemTraQuyen(toaNhaId, nguoiDung);
        return kyThanhToanRepository.findByToaNhaId(toaNha.id())
                .stream()
                .map(ThongTinKyThanhToan::tuKyThanhToan)
                .toList();
    }

    public List<ThongTinPhongChuaGhiChiSo> danhSachPhongChuaGhiChiSo(Long toaNhaId, Long kyId, NguoiDung nguoiDung) {
        ToaNha toaNha = kiemTraQuyen(toaNhaId, nguoiDung);
        KyThanhToan kyHienTai = layKyThanhToan(toaNha.id(), kyId);
        return timPhongChuaGhiChiSo(toaNha.id(), kyHienTai);
    }

    @Transactional
    public ThongTinKyThanhToan moKyThanhToan(Long toaNhaId, YeuCauMoKyThanhToan yeuCau, NguoiDung nguoiDung) {
        ToaNha toaNha = kiemTraQuyen(toaNhaId, nguoiDung);
        if (yeuCau == null || yeuCau.nam() == null || yeuCau.thang() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE);
        }

        LocalDate ngayKetThuc;
        try {
            ngayKetThuc = LocalDate.of(yeuCau.nam(), yeuCau.thang(), toaNha.ngayChotSo());
        } catch (DateTimeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE, exception);
        }

        if (kyThanhToanRepository.existsByToaNhaIdAndNamThang(toaNha.id(), yeuCau.nam(), yeuCau.thang())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_TRUNG_KY);
        }

        if (kyThanhToanRepository.existsDangMoByToaNhaId(toaNha.id())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_DANG_CO_KY_MO);
        }

        KyThanhToan kyThanhToan = new KyThanhToan(
                null,
                toaNha.id(),
                yeuCau.nam(),
                yeuCau.thang(),
                ngayKetThuc.minusMonths(1).plusDays(1),
                ngayKetThuc,
                TrangThaiKy.DANG_MO
        );
        try {
            Long kyId = kyThanhToanRepository.insert(kyThanhToan);
            return ThongTinKyThanhToan.tuKyThanhToan(
                    new KyThanhToan(
                            kyId,
                            kyThanhToan.toaNhaId(),
                            kyThanhToan.nam(),
                            kyThanhToan.thang(),
                            kyThanhToan.ngayBatDau(),
                            kyThanhToan.ngayKetThuc(),
                            kyThanhToan.trangThai()
                    )
            );
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, thongBaoXungDotTuRangBuoc(exception), exception);
        }
    }

    @Transactional
    public KetQuaChotKy chotKyThanhToan(Long toaNhaId, Long kyId, NguoiDung nguoiDung) {
        ToaNha toaNha = kiemTraQuyen(toaNhaId, nguoiDung);
        KyThanhToan kyHienTai = layKyThanhToan(toaNha.id(), kyId);
        if (kyHienTai.trangThai() != TrangThaiKy.DANG_MO) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_KY_KHONG_MO);
        }

        List<ThongTinPhongChuaGhiChiSo> phongThieuChiSo = timPhongChuaGhiChiSo(toaNha.id(), kyHienTai);
        if (!phongThieuChiSo.isEmpty()) {
            return new KetQuaChotKy(
                    ThongTinKyThanhToan.tuKyThanhToan(kyHienTai),
                    phongThieuChiSo
            );
        }

        int soDongCapNhat = kyThanhToanRepository.updateTrangThaiDaChot(kyHienTai.id(), toaNha.id());
        if (soDongCapNhat != 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_KY_KHONG_MO);
        }

        KyThanhToan kyKeTiep = taoKyKeTiep(toaNha, kyHienTai);
        try {
            kyThanhToanRepository.insert(kyKeTiep);
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_XUNG_DOT_CHOT_KY, exception);
        }

        return new KetQuaChotKy(
                ThongTinKyThanhToan.tuKyThanhToan(new KyThanhToan(
                        kyHienTai.id(),
                        kyHienTai.toaNhaId(),
                        kyHienTai.nam(),
                        kyHienTai.thang(),
                        kyHienTai.ngayBatDau(),
                        kyHienTai.ngayKetThuc(),
                        TrangThaiKy.DA_CHOT
                )),
                List.of()
        );
    }

    static String thongBaoXungDotTuRangBuoc(DataIntegrityViolationException exception) {
        String tenRangBuoc = timTenRangBuoc(exception);
        if (CONSTRAINT_TRUNG_NAM_THANG.equals(tenRangBuoc)) {
            return THONG_BAO_TRUNG_KY;
        }
        if (CONSTRAINT_MOT_KY_MO.equals(tenRangBuoc)) {
            return THONG_BAO_DANG_CO_KY_MO;
        }
        return THONG_BAO_XUNG_DOT_DU_LIEU;
    }

    private static String timTenRangBuoc(Throwable exception) {
        Throwable hienTai = exception;
        while (hienTai != null) {
            String tenRangBuoc = docTenRangBuocBangReflection(hienTai);
            if (tenRangBuoc != null && !tenRangBuoc.isBlank()) {
                return tenRangBuoc;
            }
            if (hienTai instanceof SQLException sqlException
                    && "23505".equals(sqlException.getSQLState())) {
                String tenTuThongBao = timTenRangBuocTrongThongBao(sqlException.getMessage());
                if (tenTuThongBao != null) {
                    return tenTuThongBao;
                }
            }
            hienTai = hienTai.getCause();
        }
        return null;
    }

    private static String docTenRangBuocBangReflection(Throwable exception) {
        try {
            Method layServerError = exception.getClass().getMethod("getServerErrorMessage");
            Object serverError = layServerError.invoke(exception);
            if (serverError == null) {
                return null;
            }
            Method layConstraint = serverError.getClass().getMethod("getConstraint");
            Object tenRangBuoc = layConstraint.invoke(serverError);
            return tenRangBuoc instanceof String chuoi && !chuoi.isBlank() ? chuoi : null;
        } catch (ReflectiveOperationException ignored) {
            return null;
        }
    }

    private static String timTenRangBuocTrongThongBao(String thongBao) {
        if (thongBao == null || thongBao.isBlank()) {
            return null;
        }
        if (thongBao.contains(CONSTRAINT_TRUNG_NAM_THANG)) {
            return CONSTRAINT_TRUNG_NAM_THANG;
        }
        if (thongBao.contains(CONSTRAINT_MOT_KY_MO)) {
            return CONSTRAINT_MOT_KY_MO;
        }
        return null;
    }

    private List<ThongTinPhongChuaGhiChiSo> timPhongChuaGhiChiSo(Long toaNhaId, KyThanhToan kyHienTai) {
        Long kyTruocId = layKyTruocId(toaNhaId, kyHienTai);
        LinkedHashMap<Long, ThongTinPhongChuaGhiChiSo> phongTheoId = new LinkedHashMap<>();

        for (ChiSoDichVuRepository.DongChiSo dong : chiSoDichVuRepository.findChoNhap(toaNhaId, kyHienTai.id(), kyTruocId)) {
            if (dong.chiSoCuoi() != null) {
                continue;
            }
            phongTheoId.putIfAbsent(
                    dong.phongId(),
                    new ThongTinPhongChuaGhiChiSo(dong.phongId(), dong.soPhong(), dong.tang())
            );
        }

        return List.copyOf(phongTheoId.values());
    }

    private KyThanhToan taoKyKeTiep(ToaNha toaNha, KyThanhToan kyHienTai) {
        LocalDate ngayBatDauMoi = kyHienTai.ngayKetThuc().plusDays(1);
        LocalDate thangKetThucMoi = ngayBatDauMoi.getDayOfMonth() <= toaNha.ngayChotSo()
                ? ngayBatDauMoi
                : ngayBatDauMoi.plusMonths(1);
        LocalDate ngayKetThucMoi = LocalDate.of(
                thangKetThucMoi.getYear(),
                thangKetThucMoi.getMonthValue(),
                toaNha.ngayChotSo()
        );
        return new KyThanhToan(
                null,
                toaNha.id(),
                ngayKetThucMoi.getYear(),
                ngayKetThucMoi.getMonthValue(),
                ngayBatDauMoi,
                ngayKetThucMoi,
                TrangThaiKy.DANG_MO
        );
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

    private ToaNha kiemTraQuyen(Long toaNhaId, NguoiDung nguoiDung) {
        if (nguoiDung == null || (nguoiDung.vaiTro() != VaiTro.QTHT
                && nguoiDung.vaiTro() != VaiTro.CHU
                && nguoiDung.vaiTro() != VaiTro.QUAN_LY)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return phanQuyenToaService.layToaNhaNeuNguoiDungDuocXem(nguoiDung, toaNhaId);
    }
}
