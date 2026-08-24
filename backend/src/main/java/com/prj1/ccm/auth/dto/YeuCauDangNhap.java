package com.prj1.ccm.auth.dto;

import jakarta.validation.constraints.NotBlank;

/** FR-AUT-01. What the login form sends. */
public record YeuCauDangNhap(
		@NotBlank(message = "Chưa nhập số điện thoại") String soDienThoai,
		@NotBlank(message = "Chưa nhập mật khẩu") String matKhau) {
}
