package com.prj1.ccm.thongbao;

import com.prj1.ccm.nguoithue.AnhDinhKemService;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

@Service
public class ThongBaoService {
    private static final String THONG_BAO_KHONG_HOP_LE = "Thông báo không còn hợp lệ";
    private static final String THONG_BAO_YEU_CAU_MOI = "Yêu cầu sửa chữa mới";
    private static final String THONG_BAO_PHAN_CONG = "Việc sửa chữa mới được phân công";
    private static final String THONG_BAO_HOA_DON = "Hoá đơn mới";
    private static final String LOI_TIEU_DE_TRONG = "Tiêu đề thông báo không được để trống";
    private static final String LOI_NOI_DUNG_TRONG = "Nội dung thông báo không được để trống";
    private static final String LOI_PHAM_VI = "Chỉ được chọn một phạm vi: toàn toà, tầng hoặc phòng";
    private static final String LOI_HET_HAN = "Hạn kết thúc phải sau thời điểm gửi";
    private static final String LOI_KHOA_THIEU = "Thiếu khoá chống gửi lặp";
    private static final String LOI_KHOA_KHAC = "Khoá chống gửi lặp đã được dùng cho yêu cầu khác";
    private static final String LOI_PHONG_KHAC_TOA = "Phòng được chọn không thuộc toà nhà";
    private static final String LOI_PHONG_TRONG = "Phải chọn ít nhất một phòng";
    private static final String LOI_PHAM_VI_KHONG_HOP_LE = "Phạm vi thông báo không hợp lệ";
    private static final String LOI_TANG_KHONG_HOP_LE = "Tầng phải lớn hơn 0";
    private static final String LOI_TIEU_DE_QUA_DAI = "Tiêu đề thông báo không được vượt quá 255 ký tự";
    private static final String LOI_KHOA_QUA_DAI = "Khoá chống gửi lặp không được vượt quá 255 ký tự";
    private static final ZoneId ZONE_KINH_DOANH = ZoneId.of("Asia/Ho_Chi_Minh");

    private final ThongBaoRepository thongBaoRepository;
    private final PhanQuyenToaService phanQuyenToaService;
    private final AnhDinhKemService anhDinhKemService;
    private final Clock clock;

    public ThongBaoService(ThongBaoRepository thongBaoRepository,
                           PhanQuyenToaService phanQuyenToaService,
                           AnhDinhKemService anhDinhKemService,
                           Clock clock) {
        this.thongBaoRepository = thongBaoRepository;
        this.phanQuyenToaService = phanQuyenToaService;
        this.anhDinhKemService = anhDinhKemService;
        this.clock = clock;
    }

    /** FR-MNT-02, FR-MNT-04 and FR-INV-08 return only the authenticated user's active inbox and unread count. */
    @Transactional(readOnly = true)
    public ThongTinHopThongBao danhSach(NguoiDung nguoiDung) {
        kiemTraQuyen(nguoiDung);
        return hopThongBao(thongBaoRepository.findAllByNguoiNhan(nguoiDung.id(), clock.instant(), false));
    }

    /** FR-NTF-02 and FR-NTF-07 return expired notifications from the recipient's immutable archive. */
    @Transactional(readOnly = true)
    public ThongTinHopThongBao luuTru(NguoiDung nguoiDung) {
        kiemTraQuyen(nguoiDung);
        List<ThongBao> danhSach = thongBaoRepository.findAllByNguoiNhan(nguoiDung.id(), clock.instant(), true);
        return new ThongTinHopThongBao(
                danhSach.stream().map(this::thongTin).toList(),
                0
        );
    }

    /** FR-MNT-02, FR-MNT-04 and FR-INV-08 return one notification only to its recipient. */
    @Transactional(readOnly = true)
    public ThongTinThongBao chiTiet(String thongBaoThamChieu, NguoiDung nguoiDung) {
        ThongBao thongBao = thongBaoCuaNguoiDung(thongBaoThamChieu, nguoiDung);
        kiemTraDoiTuong(thongBao);
        return thongTin(thongBao);
    }

    /** FR-MNT-02, FR-MNT-04 and FR-INV-08 mark one owned notification as read without deleting it. */
    @Transactional
    public ThongTinThongBao danhDauDaDoc(String thongBaoThamChieu, NguoiDung nguoiDung) {
        ThongBao thongBao = thongBaoCuaNguoiDung(thongBaoThamChieu, nguoiDung);
        kiemTraDoiTuong(thongBao);
        ThongBao daCapNhat = thongBaoRepository.markAsRead(thongBao.maThamChieu(), nguoiDung.id(), clock.instant())
                .orElseGet(() -> thongBaoRepository.findByMaThamChieu(thongBao.maThamChieu()).orElseThrow());
        kiemTraDoiTuong(daCapNhat);
        return thongTin(daCapNhat);
    }

    /** FR-NTF-02 and FR-NTF-07 preview the snapshot recipient counts before a common notification is sent. */
    @Transactional(readOnly = true)
    public ThongTinXemTruocThongBaoChung xemTruoc(YeuCauThongBaoChung yeuCau, NguoiDung nguoiDung) {
        kiemTraQuyenGuiThongBaoChung(yeuCau, nguoiDung);
        return thongBaoRepository.snapshotNguoiNhan(yeuCau, ngayNghiepVu()).thongTin();
    }

    /** FR-NTF-02 and FR-NTF-07 send one scoped, idempotent common notification and snapshot its recipients. */
    @Transactional
    public KetQuaGuiThongBaoChung gui(YeuCauThongBaoChung yeuCau, String khoaChongLap, MultipartFile tep, NguoiDung nguoiDung) {
        if (khoaChongLap == null || khoaChongLap.isBlank()) {
            throw loi(HttpStatus.BAD_REQUEST, LOI_KHOA_THIEU);
        }
        if (khoaChongLap.length() > 255) {
            throw loi(HttpStatus.BAD_REQUEST, LOI_KHOA_QUA_DAI);
        }
        ThongBaoRepository.NguoiNhanSnapshot snapshot = kiemTraVaXemTruoc(yeuCau, nguoiDung);
        String dauVaoHash = dauVaoHash(yeuCau, tep);
        var daCo = thongBaoRepository.findCommonByKey(nguoiDung.id(), khoaChongLap);
        if (daCo.isPresent()) {
            if (!Objects.equals(daCo.get().dauVaoHash(), dauVaoHash)) {
                throw loi(HttpStatus.CONFLICT, LOI_KHOA_KHAC);
            }
            return new KetQuaGuiThongBaoChung(thongTinGui(daCo.get()), false);
        }

        String phamVi = phamVi(yeuCau);
        String phongIds = phongIdsCanon(yeuCau);
        var daTao = thongBaoRepository.insertCommon(
                nguoiDung.id(), yeuCau, phamVi, phongIds, khoaChongLap, dauVaoHash, snapshot.thongTin()
        );
        if (daTao.isEmpty()) {
            var daCoSauTranhChap = thongBaoRepository.findCommonByKey(nguoiDung.id(), khoaChongLap)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, LOI_KHOA_KHAC));
            if (!Objects.equals(daCoSauTranhChap.dauVaoHash(), dauVaoHash)) {
                throw loi(HttpStatus.CONFLICT, LOI_KHOA_KHAC);
            }
            return new KetQuaGuiThongBaoChung(thongTinGui(daCoSauTranhChap), false);
        }

        ThongBaoRepository.ThongBaoChung thongBaoChung = daTao.get();
        Instant taoLuc = clock.instant();
        for (Long nguoiNhanId : snapshot.nguoiNhanIds()) {
            thongBaoRepository.insert(new ThongBao(
                    null,
                    null,
                    nguoiNhanId,
                    LoaiDoiTuongThongBao.THONG_BAO_CHUNG,
                    thongBaoChung.id(),
                    yeuCau.tieuDe().trim(),
                    yeuCau.noiDung().trim(),
                    false,
                    null,
                    taoLuc,
                    yeuCau.hetHanLuc(),
                    List.of()
            ));
        }
        if (tep != null && !tep.isEmpty()) {
            anhDinhKemService.taiLenAnhThongBaoChung(thongBaoChung.id(), tep);
        }
        return new KetQuaGuiThongBaoChung(thongTinGui(thongBaoChung), true);
    }

    /** FR-MNT-02 creates an in-app notification for every active manager assigned to the repair building. */
    @Transactional
    public void taoKhiTaoYeuCau(Long yeuCauId) {
        ThongBaoRepository.YeuCauSuaChuaThongBao yeuCau = yeuCau(yeuCauId);
        for (Long nguoiNhanId : thongBaoRepository.findNguoiQuanLyIdTheoToa(toaNhaId(yeuCauId))) {
            thongBaoRepository.insert(new ThongBao(
                    null,
                    null,
                    nguoiNhanId,
                    LoaiDoiTuongThongBao.YEU_CAU_SUA_CHUA,
                    yeuCauId,
                    THONG_BAO_YEU_CAU_MOI,
                    "Phòng %s báo hỏng: %s — %s".formatted(yeuCau.soPhong(), yeuCau.moTa(), tenMucDo(yeuCau.mucDo())),
                    false,
                    null,
                    clock.instant()
            ));
        }
    }

    /** FR-MNT-04 creates an in-app notification for the exact worker assigned to the repair. */
    @Transactional
    public void taoKhiPhanCong(Long yeuCauId) {
        ThongBaoRepository.YeuCauSuaChuaThongBao yeuCau = yeuCau(yeuCauId);
        if (yeuCau.nguoiXuLyId() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_KHONG_HOP_LE);
        }
        thongBaoRepository.insert(new ThongBao(
                null,
                null,
                yeuCau.nguoiXuLyId(),
                LoaiDoiTuongThongBao.YEU_CAU_SUA_CHUA,
                yeuCauId,
                THONG_BAO_PHAN_CONG,
                "Bạn được phân công sửa chữa phòng %s: %s — %s".formatted(
                        yeuCau.soPhong(), yeuCau.moTa(), tenMucDo(yeuCau.mucDo())
                ),
                false,
                null,
                clock.instant()
        ));
    }

    /** FR-INV-08 creates an in-app notification when a published invoice has a tenant account to notify. */
    @Transactional
    public void taoKhiPhatHanhHoaDon(Long hoaDonId) {
        if (!thongBaoRepository.existsDoiTuong(LoaiDoiTuongThongBao.HOA_DON, hoaDonId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_KHONG_HOP_LE);
        }
        ThongBaoRepository.HoaDonThongBao hoaDon = thongBaoRepository.findHoaDonThongBao(hoaDonId).orElse(null);
        if (hoaDon == null) {
            return;
        }
        String ky = hoaDon.nam() == null || hoaDon.thang() == null
                ? ""
                : " kỳ %02d/%d".formatted(hoaDon.thang(), hoaDon.nam());
        thongBaoRepository.insert(new ThongBao(
                null,
                null,
                hoaDon.nguoiNhanId(),
                LoaiDoiTuongThongBao.HOA_DON,
                hoaDonId,
                THONG_BAO_HOA_DON,
                "Hoá đơn phòng %s%s đã được phát hành.".formatted(hoaDon.soPhong(), ky),
                false,
                null,
                clock.instant()
        ));
    }

    private ThongTinHopThongBao hopThongBao(List<ThongBao> danhSach) {
        return new ThongTinHopThongBao(
                danhSach.stream().map(this::thongTin).toList(),
                (int) danhSach.stream().filter(thongBao -> !thongBao.daDoc()).count()
        );
    }

    private ThongTinThongBao thongTin(ThongBao thongBao) {
        kiemTraDoiTuong(thongBao);
        return ThongTinThongBao.tu(thongBao, clock.instant());
    }

    private ThongTinGuiThongBaoChung thongTinGui(ThongBaoRepository.ThongBaoChung thongBao) {
        return new ThongTinGuiThongBaoChung(
                thongBao.maThamChieu().toString(),
                thongBao.soNguoiNhan(),
                thongBao.soPhongNhan(),
                thongBao.soPhongKhongCoTaiKhoan()
        );
    }

    private ThongBaoRepository.NguoiNhanSnapshot kiemTraVaXemTruoc(YeuCauThongBaoChung yeuCau, NguoiDung nguoiDung) {
        kiemTraQuyenGuiThongBaoChung(yeuCau, nguoiDung);
        return thongBaoRepository.snapshotNguoiNhan(yeuCau, ngayNghiepVu());
    }

    private void kiemTraQuyenGuiThongBaoChung(YeuCauThongBaoChung yeuCau, NguoiDung nguoiDung) {
        if (nguoiDung == null || (nguoiDung.vaiTro() != VaiTro.CHU && nguoiDung.vaiTro() != VaiTro.QUAN_LY)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        if (yeuCau == null || yeuCau.toaNhaId() == null) {
            throw loi(HttpStatus.BAD_REQUEST, "Toà nhà là bắt buộc");
        }
        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, yeuCau.toaNhaId());
        if (isBlank(yeuCau.tieuDe())) {
            throw loi(HttpStatus.BAD_REQUEST, LOI_TIEU_DE_TRONG);
        }
        if (yeuCau.tieuDe().trim().length() > 255) {
            throw loi(HttpStatus.BAD_REQUEST, LOI_TIEU_DE_QUA_DAI);
        }
        if (isBlank(yeuCau.noiDung())) {
            throw loi(HttpStatus.BAD_REQUEST, LOI_NOI_DUNG_TRONG);
        }
        String phamVi = phamVi(yeuCau);
        if (!List.of("TOA_NHA", "TANG", "PHONG").contains(phamVi)) {
            throw loi(HttpStatus.BAD_REQUEST, LOI_PHAM_VI_KHONG_HOP_LE);
        }
        if (yeuCau.tang() != null && yeuCau.tang() <= 0) {
            throw loi(HttpStatus.BAD_REQUEST, LOI_TANG_KHONG_HOP_LE);
        }
        boolean coTang = yeuCau.tang() != null;
        boolean coPhong = !yeuCau.phongIds().isEmpty();
        if ("TOA_NHA".equals(phamVi) && (coTang || coPhong)
                || "TANG".equals(phamVi) && (!coTang || coPhong)
                || "PHONG".equals(phamVi) && coTang) {
            throw loi(HttpStatus.BAD_REQUEST, LOI_PHAM_VI);
        }
        if ("PHONG".equals(phamVi) && !coPhong) {
            throw loi(HttpStatus.BAD_REQUEST, LOI_PHONG_TRONG);
        }
        if (yeuCau.hetHanLuc() == null || !yeuCau.hetHanLuc().isAfter(clock.instant())) {
            throw loi(HttpStatus.BAD_REQUEST, LOI_HET_HAN);
        }
        if (!yeuCau.phongIds().isEmpty()
                && thongBaoRepository.countRoomsBelongingToBuilding(yeuCau.toaNhaId(), yeuCau.phongIds())
                != yeuCau.phongIds().size()) {
            throw loi(HttpStatus.BAD_REQUEST, LOI_PHONG_KHAC_TOA);
        }
    }

    private String phamVi(YeuCauThongBaoChung yeuCau) {
        if (!isBlank(yeuCau.phamVi())) {
            return yeuCau.phamVi().trim().toUpperCase(Locale.ROOT);
        }
        if (yeuCau.tang() != null) {
            return "TANG";
        }
        if (!yeuCau.phongIds().isEmpty()) {
            return "PHONG";
        }
        return "TOA_NHA";
    }

    private String phongIdsCanon(YeuCauThongBaoChung yeuCau) {
        return yeuCau.phongIds().stream().distinct().sorted().map(String::valueOf).reduce((a, b) -> a + "," + b).orElse("");
    }

    private String dauVaoHash(YeuCauThongBaoChung yeuCau, MultipartFile tep) {
        String canonical = String.join("|",
                String.valueOf(yeuCau.toaNhaId()),
                phamVi(yeuCau),
                String.valueOf(yeuCau.tang()),
                phongIdsCanon(yeuCau),
                yeuCau.tieuDe().trim(),
                yeuCau.noiDung().trim(),
                yeuCau.hetHanLuc().toString(),
                dauVanTep(tep)
        );
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(canonical.getBytes(StandardCharsets.UTF_8));
            StringBuilder result = new StringBuilder(64);
            for (byte value : digest) {
                result.append("%02x".formatted(value));
            }
            return result.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is required", exception);
        }
    }

    private String dauVanTep(MultipartFile tep) {
        if (tep == null) {
            return "KHONG_CO_TEP";
        }
        try {
            byte[] bytes = tep.getBytes();
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(bytes);
            StringBuilder result = new StringBuilder(64);
            for (byte value : digest) {
                result.append("%02x".formatted(value));
            }
            return result.toString();
        } catch (IOException | NoSuchAlgorithmException exception) {
            throw loi(HttpStatus.BAD_REQUEST, "Không thể đọc ảnh đính kèm");
        }
    }

    private LocalDate ngayNghiepVu() {
        return LocalDate.now(clock.withZone(ZONE_KINH_DOANH));
    }

    private ThongBao thongBaoCuaNguoiDung(String thongBaoThamChieu, NguoiDung nguoiDung) {
        kiemTraQuyen(nguoiDung);
        UUID maThamChieu = parseMaThamChieu(thongBaoThamChieu);
        ThongBao thongBao = thongBaoRepository.findByMaThamChieu(maThamChieu)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!Objects.equals(thongBao.nguoiNhanId(), nguoiDung.id())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return thongBao;
    }

    private UUID parseMaThamChieu(String value) {
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException | NullPointerException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
    }

    private ThongBaoRepository.YeuCauSuaChuaThongBao yeuCau(Long yeuCauId) {
        if (!thongBaoRepository.existsDoiTuong(LoaiDoiTuongThongBao.YEU_CAU_SUA_CHUA, yeuCauId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_KHONG_HOP_LE);
        }
        return thongBaoRepository.findYeuCauSuaChuaThongBao(yeuCauId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_KHONG_HOP_LE));
    }

    private Long toaNhaId(Long yeuCauId) {
        return thongBaoRepository.findToaNhaIdCuaYeuCau(yeuCauId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_KHONG_HOP_LE));
    }

    private void kiemTraDoiTuong(ThongBao thongBao) {
        if (!thongBaoRepository.existsDoiTuong(thongBao.doiTuongLoai(), thongBao.doiTuongId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_KHONG_HOP_LE);
        }
    }

    private String tenMucDo(String mucDo) {
        return switch (mucDo) {
            case "KHAN_CAP" -> "Khẩn cấp";
            case "GAP" -> "Gấp";
            default -> "Thường";
        };
    }

    private void kiemTraQuyen(NguoiDung nguoiDung) {
        if (nguoiDung == null || nguoiDung.vaiTro() == VaiTro.QTHT) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private ResponseStatusException loi(HttpStatus status, String message) {
        return new ResponseStatusException(status, message);
    }

    public record KetQuaGuiThongBaoChung(ThongTinGuiThongBaoChung thongTin, boolean taoMoi) {
    }
}
