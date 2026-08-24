package com.prj1.ccm.auth;

import com.prj1.ccm.auth.dto.PhanHoiDangNhap;
import com.prj1.ccm.auth.dto.ThongTinNguoiDung;
import com.prj1.ccm.auth.dto.YeuCauDangNhap;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * FR-AUT-01. Checks a phone number and password and issues a token.
 *
 * <p>Every rejection raises the same {@link DangNhapThatBaiException} with the same message.
 * A system that says "no such account" for one phone number and "wrong password" for another
 * lets anyone enumerate who has an account here, which for a residential building means
 * confirming who lives there.
 */
@Service
public class DangNhapService {

	private final NguoiDungRepository nguoiDungRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;

	DangNhapService(NguoiDungRepository nguoiDungRepository, PasswordEncoder passwordEncoder,
			JwtService jwtService) {
		this.nguoiDungRepository = nguoiDungRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
	}

	@Transactional(readOnly = true)
	public PhanHoiDangNhap dangNhap(YeuCauDangNhap yeuCau) {
		NguoiDung nguoiDung = nguoiDungRepository
				.findBySoDienThoai(yeuCau.soDienThoai().trim())
				.orElse(null);

		if (nguoiDung == null) {
			// Hash the supplied password anyway. Returning immediately would make a request
			// for an unknown phone number measurably faster than one for a known account,
			// which is enough to enumerate accounts with a stopwatch.
			passwordEncoder.matches(yeuCau.matKhau(), MA_BAM_GIA);
			throw new DangNhapThatBaiException();
		}

		if (!passwordEncoder.matches(yeuCau.matKhau(), nguoiDung.getMatKhauHash())) {
			throw new DangNhapThatBaiException();
		}

		if (!nguoiDung.dangHoatDong()) {
			throw new TaiKhoanBiKhoaException();
		}

		return new PhanHoiDangNhap(
				jwtService.phatToken(nguoiDung),
				jwtService.getThoiHan().toSeconds(),
				ThongTinNguoiDung.tu(nguoiDung));
	}

	/**
	 * A real bcrypt hash of an unguessable value, used only to burn the same amount of time
	 * as a genuine check when the account does not exist.
	 */
	private static final String MA_BAM_GIA =
			"$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

	/** Wrong phone number, wrong password: the caller is never told which. */
	public static class DangNhapThatBaiException extends RuntimeException {

		public DangNhapThatBaiException() {
			super("Số điện thoại hoặc mật khẩu không đúng");
		}
	}

	/** Credentials were right, but the account is locked. FR-AUT-06. */
	public static class TaiKhoanBiKhoaException extends RuntimeException {

		public TaiKhoanBiKhoaException() {
			super("Tài khoản đã bị khoá. Liên hệ quản trị viên để được mở lại.");
		}
	}
}
