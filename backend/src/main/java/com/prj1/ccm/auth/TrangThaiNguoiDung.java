package com.prj1.ccm.auth;

/**
 * FR-AUT-06. An account is either usable or locked.
 *
 * <p>There is deliberately no DELETED state: accounts are referenced by meter readings,
 * payments and the audit log, so removing one would tear a hole in the history. Locking
 * keeps the person out while leaving the record intact.
 */
public enum TrangThaiNguoiDung {
	HOAT_DONG,
	BI_KHOA
}
