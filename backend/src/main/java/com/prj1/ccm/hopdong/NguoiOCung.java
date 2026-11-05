package com.prj1.ccm.hopdong;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record NguoiOCung(
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
        String lyDoRoiDi
) {
    public NguoiOCung(
            Long id,
            Long hopDongId,
            Long nguoiThueId,
            String hoTenNguoiThue,
            String quanHe,
            LocalDate tuNgay,
            LocalDate denNgay
    ) {
        this(id, hopDongId, nguoiThueId, hoTenNguoiThue, quanHe, tuNgay, denNgay, "NGUOI_O", "DA_DUYET", null, LocalDateTime.now(), null, null, null, null);
    }
}
