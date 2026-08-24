package com.prj1.ccm.auth;

import java.util.Map;

import com.prj1.ccm.auth.dto.PhanHoiDangNhap;
import com.prj1.ccm.auth.dto.ThongTinNguoiDung;
import com.prj1.ccm.auth.dto.YeuCauDangNhap;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** FR-AUT-01. Signing in, and reading back who is signed in. */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final DangNhapService dangNhapService;

	AuthController(DangNhapService dangNhapService) {
		this.dangNhapService = dangNhapService;
	}

	/** FR-AUT-01: sign in with a phone number and a password. */
	@PostMapping("/login")
	public PhanHoiDangNhap dangNhap(@Valid @RequestBody YeuCauDangNhap yeuCau) {
		return dangNhapService.dangNhap(yeuCau);
	}

	/** Who the bearer token belongs to. The frontend calls this after a page reload. */
	@GetMapping("/me")
	public ThongTinNguoiDung toiLaAi(@AuthenticationPrincipal NguoiDung nguoiDung) {
		return ThongTinNguoiDung.tu(nguoiDung);
	}

	@ExceptionHandler(DangNhapService.DangNhapThatBaiException.class)
	ResponseEntity<Map<String, String>> xuLyDangNhapThatBai(
			DangNhapService.DangNhapThatBaiException loi) {
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
				.body(Map.of("thongBao", loi.getMessage()));
	}

	@ExceptionHandler(DangNhapService.TaiKhoanBiKhoaException.class)
	ResponseEntity<Map<String, String>> xuLyTaiKhoanBiKhoa(
			DangNhapService.TaiKhoanBiKhoaException loi) {
		return ResponseEntity.status(HttpStatus.FORBIDDEN)
				.body(Map.of("thongBao", loi.getMessage()));
	}
}
