package com.prj1.ccm.auth;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A login account. Matches the {@code NguoiDung} class in the chapter 3 class diagram
 * and the {@code NGUOI_DUNG} table.
 *
 * <p>Separate from {@code NguoiThue} (the tenant) because not every tenant has an account:
 * see CR-001, which adds the link between the two in Vertical Slice 2.
 */
@Entity
@Table(name = "nguoi_dung")
public class NguoiDung {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String hoTen;

	/** The login identity. Unique, enforced by the database, not just by application code. */
	@Column(nullable = false, unique = true)
	private String soDienThoai;

	/** bcrypt hash. The plaintext password never exists outside the login request. */
	@Column(nullable = false)
	private String matKhauHash;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private VaiTro vaiTro;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private TrangThaiNguoiDung trangThai = TrangThaiNguoiDung.HOAT_DONG;

	/**
	 * ADR-0001. Every access token carries this value; the server compares them on each
	 * request. Raising it by one invalidates every token already issued to this person,
	 * which is how FR-AUT-07 is satisfied.
	 */
	@Column(nullable = false)
	private int phienBanToken;

	/** FR-AUT-02, used from ticket 04 onwards. */
	@Column(nullable = false)
	private int soLanSai;

	private Instant lanSaiDauTien;

	private Instant khoaDen;

	@Column(nullable = false)
	private Instant taoLuc = Instant.now();

	@Column(nullable = false)
	private Instant suaLuc = Instant.now();

	protected NguoiDung() {
		// for JPA
	}

	/** True when the account may currently sign in. */
	public boolean dangHoatDong() {
		return trangThai == TrangThaiNguoiDung.HOAT_DONG;
	}

	/** Invalidates every token already issued to this account. */
	public void thuHoiMoiToken() {
		this.phienBanToken++;
		this.suaLuc = Instant.now();
	}

	public Long getId() {
		return id;
	}

	public String getHoTen() {
		return hoTen;
	}

	public String getSoDienThoai() {
		return soDienThoai;
	}

	public String getMatKhauHash() {
		return matKhauHash;
	}

	public VaiTro getVaiTro() {
		return vaiTro;
	}

	public TrangThaiNguoiDung getTrangThai() {
		return trangThai;
	}

	public int getPhienBanToken() {
		return phienBanToken;
	}

	public int getSoLanSai() {
		return soLanSai;
	}

	public Instant getLanSaiDauTien() {
		return lanSaiDauTien;
	}

	public Instant getKhoaDen() {
		return khoaDen;
	}
}
