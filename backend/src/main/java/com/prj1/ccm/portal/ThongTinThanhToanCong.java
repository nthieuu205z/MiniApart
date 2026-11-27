package com.prj1.ccm.portal;

/** Dữ liệu chuyển khoản của toà người thuê đang ở; chỉ gồm trường cần để chuyển tiền/QR. */
public record ThongTinThanhToanCong(
        Long toaNhaId,
        String tenToaNha,
        String maNganHang,
        String tenNganHang,
        String soTaiKhoan,
        String chuTaiKhoan,
        String noiDungMau
) {
}
