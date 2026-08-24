package com.prj1.ccm.auth;

/**
 * FR-AUT-04. The five roles the system recognises.
 *
 * <p>Names match the class diagram in chapter 3 and the CHECK constraint on
 * {@code NGUOI_DUNG.vai_tro}; changing one without the others breaks the other two.
 */
public enum VaiTro {

	/** Quan tri he thong: sees everything, manages accounts. */
	QTHT("Quản trị hệ thống"),

	/** Chu so huu: owns buildings, sees every building they own. */
	CHU("Chủ sở hữu"),

	/** Quan ly toa nha: day-to-day operation of the buildings assigned to them. */
	QUAN_LY("Quản lý toà nhà"),

	/** Tho sua chua: maintenance jobs only. */
	THO("Thợ sửa chữa"),

	/** Nguoi thue: their own room, their own invoices, nothing else. */
	NGUOI_THUE("Người thuê");

	private final String tenHienThi;

	VaiTro(String tenHienThi) {
		this.tenHienThi = tenHienThi;
	}

	/** Vietnamese label with diacritics, for the user interface. */
	public String getTenHienThi() {
		return tenHienThi;
	}
}
