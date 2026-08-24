package com.prj1.ccm.auth;

import java.io.IOException;
import java.util.List;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Turns a bearer token into an authenticated request, or leaves the request anonymous.
 *
 * <p>The version check is the point of this filter. A signed, unexpired token is not enough:
 * the account's {@code phienBanToken} must still match the value stamped into the token. That
 * is what makes revocation take effect immediately rather than whenever the token happens to
 * expire — see ADR-0001.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	private static final String PREFIX_BEARER = "Bearer ";

	private final JwtService jwtService;
	private final NguoiDungRepository nguoiDungRepository;

	JwtAuthenticationFilter(JwtService jwtService, NguoiDungRepository nguoiDungRepository) {
		this.jwtService = jwtService;
		this.nguoiDungRepository = nguoiDungRepository;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
			FilterChain filterChain) throws ServletException, IOException {

		String token = layToken(request);
		if (token != null) {
			xacThuc(token);
		}
		filterChain.doFilter(request, response);
	}

	private void xacThuc(String token) {
		Claims claims = jwtService.docToken(token);
		if (claims == null) {
			return;
		}

		NguoiDung nguoiDung = nguoiDungRepository.findById(Long.valueOf(claims.getSubject()))
				.orElse(null);
		if (nguoiDung == null || !nguoiDung.dangHoatDong()) {
			return;
		}

		Integer phienBanTrongToken = claims.get(JwtService.CLAIM_PHIEN_BAN_TOKEN, Integer.class);
		if (phienBanTrongToken == null || phienBanTrongToken != nguoiDung.getPhienBanToken()) {
			// The account was locked, had its access revoked, or changed password after this
			// token was issued. The token is authentic but no longer valid.
			return;
		}

		var quyen = List.of(new SimpleGrantedAuthority("ROLE_" + nguoiDung.getVaiTro().name()));
		var xacThuc = new UsernamePasswordAuthenticationToken(nguoiDung, null, quyen);
		SecurityContextHolder.getContext().setAuthentication(xacThuc);
	}

	private static String layToken(HttpServletRequest request) {
		String header = request.getHeader("Authorization");
		if (header == null || !header.startsWith(PREFIX_BEARER)) {
			return null;
		}
		String token = header.substring(PREFIX_BEARER.length()).trim();
		return token.isEmpty() ? null : token;
	}
}
