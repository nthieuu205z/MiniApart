package com.prj1.ccm.thongbao;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class ThongBaoService {
    private static final String THONG_BAO_KHONG_HOP_LE = "Thông báo không còn hợp lệ";
    private static final String THONG_BAO_YEU_CAU_MOI = "Yêu cầu sửa chữa mới";
    private static final String THONG_BAO_PHAN_CONG = "Việc sửa chữa mới được phân công";
    private static final String THONG_BAO_HOA_DON = "Hoá đơn mới";

    private final ThongBaoRepository thongBaoRepository;
    private final Clock clock;

    public ThongBaoService(ThongBaoRepository thongBaoRepository, Clock clock) {
        this.thongBaoRepository = thongBaoRepository;
        this.clock = clock;
    }

    /** FR-MNT-02, FR-MNT-04 and FR-INV-08 return only the authenticated user's inbox and unread count. */
    @Transactional(readOnly = true)
    public ThongTinHopThongBao danhSach(NguoiDung nguoiDung) {
        kiemTraQuyen(nguoiDung);
        List<ThongBao> danhSach = thongBaoRepository.findAllByNguoiNhan(nguoiDung.id());
        danhSach.forEach(this::kiemTraDoiTuong);
        return new ThongTinHopThongBao(
                danhSach.stream().map(ThongTinThongBao::tu).toList(),
                (int) danhSach.stream().filter(thongBao -> !thongBao.daDoc()).count()
        );
    }

    /** FR-MNT-02, FR-MNT-04 and FR-INV-08 return one notification only to its recipient. */
    @Transactional(readOnly = true)
    public ThongTinThongBao chiTiet(String thongBaoThamChieu, NguoiDung nguoiDung) {
        ThongBao thongBao = thongBaoCuaNguoiDung(thongBaoThamChieu, nguoiDung);
        kiemTraDoiTuong(thongBao);
        return ThongTinThongBao.tu(thongBao);
    }

    /** FR-MNT-02, FR-MNT-04 and FR-INV-08 mark one owned notification as read without deleting it. */
    @Transactional
    public ThongTinThongBao danhDauDaDoc(String thongBaoThamChieu, NguoiDung nguoiDung) {
        ThongBao thongBao = thongBaoCuaNguoiDung(thongBaoThamChieu, nguoiDung);
        kiemTraDoiTuong(thongBao);
        ThongBao daCapNhat = thongBaoRepository.markAsRead(thongBao.maThamChieu(), nguoiDung.id(), clock.instant())
                .orElseGet(() -> thongBaoRepository.findByMaThamChieu(thongBao.maThamChieu()).orElseThrow());
        kiemTraDoiTuong(daCapNhat);
        return ThongTinThongBao.tu(daCapNhat);
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
}
