package com.prj1.ccm.auth;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Issues and reads access tokens.
 *
 * <p>Every token carries the account's token version (claim {@code ver}) as well as the
 * usual subject and expiry. Validating a token therefore has two halves: this class proves
 * the token is authentic and unexpired, and {@link JwtAuthenticationFilter} proves the
 * version still matches the database. See ADR-0001 for why.
 */
@Service
public class JwtService {

	static final String CLAIM_PHIEN_BAN_TOKEN = "ver";
	static final String CLAIM_VAI_TRO = "vaiTro";

	private final SecretKey khoaKy;
	private final Duration thoiHan;

	JwtService(
			@Value("${app.jwt.secret}") String secret,
			@Value("${app.jwt.thoi-han-phut}") long thoiHanPhut) {
		byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
		if (bytes.length < 32) {
			// HS256 needs at least 256 bits. Failing at startup beats failing per-request.
			throw new IllegalStateException(
					"app.jwt.secret phai dai it nhat 32 ky tu, dang co " + bytes.length);
		}
		this.khoaKy = Keys.hmacShaKeyFor(bytes);
		this.thoiHan = Duration.ofMinutes(thoiHanPhut);
	}

	/** Issues an access token for an account, stamped with its current token version. */
	public String phatToken(NguoiDung nguoiDung) {
		Instant bayGio = Instant.now();
		return Jwts.builder()
				.subject(String.valueOf(nguoiDung.getId()))
				.claim(CLAIM_VAI_TRO, nguoiDung.getVaiTro().name())
				.claim(CLAIM_PHIEN_BAN_TOKEN, nguoiDung.getPhienBanToken())
				.issuedAt(Date.from(bayGio))
				.expiration(Date.from(bayGio.plus(thoiHan)))
				.signWith(khoaKy)
				.compact();
	}

	/**
	 * Reads the claims of an authentic, unexpired token.
	 *
	 * @return the claims, or empty if the token is missing, malformed, tampered with, or expired
	 */
	public Claims docToken(String token) {
		try {
			return Jwts.parser()
					.verifyWith(khoaKy)
					.build()
					.parseSignedClaims(token)
					.getPayload();
		}
		catch (JwtException | IllegalArgumentException khongHopLe) {
			// Every failure mode is treated the same on purpose: telling a caller whether a
			// token was expired, forged, or malformed hands them information they can use.
			return null;
		}
	}

	/** How long a freshly issued token lasts. Reported to the client so it can plan ahead. */
	public Duration getThoiHan() {
		return thoiHan;
	}
}
