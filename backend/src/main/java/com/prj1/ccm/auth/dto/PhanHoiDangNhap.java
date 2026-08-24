package com.prj1.ccm.auth.dto;

/** FR-AUT-01. The access token plus enough about the account to draw the first screen. */
public record PhanHoiDangNhap(String token, long thoiHanGiay, ThongTinNguoiDung nguoiDung) {
}
