package com.prj1.ccm.nguoidung;

import java.util.List;

public record YeuCauQuanLyNguoiDung(
        String hoTen,
        String soDienThoai,
        VaiTro vaiTro,
        Long nguoiThueId,
        List<Long> toaNhaIds
) {
}
