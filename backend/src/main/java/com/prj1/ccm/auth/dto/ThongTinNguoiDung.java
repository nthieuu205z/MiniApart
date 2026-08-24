package com.prj1.ccm.auth.dto;

import com.prj1.ccm.auth.NguoiDung;

/**
 * What the client is told about the signed-in person.
 *
 * <p>Note what is absent: the password hash, the failed-attempt counters, the token version.
 * A dedicated response type keeps them absent by construction rather than by remembering to
 * strip them.
 */
public record ThongTinNguoiDung(Long id, String hoTen, String soDienThoai, String vaiTro,
		String tenVaiTro) {

	public static ThongTinNguoiDung tu(NguoiDung nguoiDung) {
		return new ThongTinNguoiDung(
				nguoiDung.getId(),
				nguoiDung.getHoTen(),
				nguoiDung.getSoDienThoai(),
				nguoiDung.getVaiTro().name(),
				nguoiDung.getVaiTro().getTenHienThi());
	}
}
