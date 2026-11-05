package com.prj1.ccm.hopdong;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record ThongTinNguoiOCung(
        Long id,
        Long hopDongId,
        Long nguoiThueId,
        String hoTenNguoiThue,
        String quanHe,
        LocalDate tuNgay,
        LocalDate denNgay,
        String vaiTro,
        String trangThai,
        Long nguoiDeNghiId,
        LocalDateTime thoiDiemDeNghi,
        Long nguoiDuyetId,
        LocalDateTime thoiDiemDuyet,
        String lyDoTuChoi,
        String lyDoRoiDi,
        String soDienThoai,
        String soGiayToChe,
        Boolean coTaiKhoan
) {
    public Boolean coTaiKhoan() {
        return coTaiKhoan != null && coTaiKhoan;
    }

    public ThongTinNguoiOCung(
            Long id,
            Long hopDongId,
            Long nguoiThueId,
            String hoTenNguoiThue,
            String quanHe,
            LocalDate tuNgay,
            LocalDate denNgay
    ) {
        this(id, hopDongId, nguoiThueId, hoTenNguoiThue, quanHe, tuNgay, denNgay, "NGUOI_O", "DA_DUYET", null, null, null, null, null, null, null, null, Boolean.FALSE);
    }

    public static ThongTinNguoiOCung tu(NguoiOCung nguoiOCung) {
        return new ThongTinNguoiOCung(
                nguoiOCung.id(),
                nguoiOCung.hopDongId(),
                nguoiOCung.nguoiThueId(),
                nguoiOCung.hoTenNguoiThue(),
                nguoiOCung.quanHe(),
                nguoiOCung.tuNgay(),
                nguoiOCung.denNgay(),
                nguoiOCung.vaiTro(),
                nguoiOCung.trangThai(),
                nguoiOCung.nguoiDeNghiId(),
                nguoiOCung.thoiDiemDeNghi(),
                nguoiOCung.nguoiDuyetId(),
                nguoiOCung.thoiDiemDuyet(),
                nguoiOCung.lyDoTuChoi(),
                nguoiOCung.lyDoRoiDi(),
                null,
                null,
                false
        );
    }

    public static ThongTinNguoiOCung tu(NguoiOCung nguoiOCung, String soDienThoai, String soGiayToChe, boolean coTaiKhoan) {
        return new ThongTinNguoiOCung(
                nguoiOCung.id(),
                nguoiOCung.hopDongId(),
                nguoiOCung.nguoiThueId(),
                nguoiOCung.hoTenNguoiThue(),
                nguoiOCung.quanHe(),
                nguoiOCung.tuNgay(),
                nguoiOCung.denNgay(),
                nguoiOCung.vaiTro(),
                nguoiOCung.trangThai(),
                nguoiOCung.nguoiDeNghiId(),
                nguoiOCung.thoiDiemDeNghi(),
                nguoiOCung.nguoiDuyetId(),
                nguoiOCung.thoiDiemDuyet(),
                nguoiOCung.lyDoTuChoi(),
                nguoiOCung.lyDoRoiDi(),
                soDienThoai,
                soGiayToChe,
                coTaiKhoan
        );
    }
}
