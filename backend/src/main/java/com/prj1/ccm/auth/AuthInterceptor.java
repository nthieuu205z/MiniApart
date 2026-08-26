package com.prj1.ccm.auth;

import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.util.Optional;

@Component
public class AuthInterceptor implements HandlerInterceptor {
    public static final String CURRENT_USER_ATTRIBUTE = AuthInterceptor.class.getName() + ".CURRENT_USER";

    private final JwtTokenService jwtTokenService;
    private final NguoiDungRepository nguoiDungRepository;
    private final AuthErrorWriter authErrorWriter;

    public AuthInterceptor(
            JwtTokenService jwtTokenService,
            NguoiDungRepository nguoiDungRepository,
            AuthErrorWriter authErrorWriter
    ) {
        this.jwtTokenService = jwtTokenService;
        this.nguoiDungRepository = nguoiDungRepository;
        this.authErrorWriter = authErrorWriter;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws IOException {
        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            authErrorWriter.write(response, HttpStatus.UNAUTHORIZED.value(), "Phiên đăng nhập không hợp lệ hoặc đã hết hạn");
            return false;
        }

        String token = authorization.substring("Bearer ".length()).trim();
        Optional<JwtTokenService.TokenClaims> tokenClaims = jwtTokenService.parse(token);
        if (tokenClaims.isEmpty()) {
            authErrorWriter.write(response, HttpStatus.UNAUTHORIZED.value(), "Phiên đăng nhập không hợp lệ hoặc đã hết hạn");
            return false;
        }

        JwtTokenService.TokenClaims claims = tokenClaims.get();
        Optional<NguoiDung> nguoiDung = nguoiDungRepository.findById(claims.nguoiDungId());
        if (nguoiDung.isEmpty()
                || !nguoiDung.get().hoatDong()
                || nguoiDung.get().phienBanToken() != claims.phienBanToken()) {
            authErrorWriter.write(response, HttpStatus.UNAUTHORIZED.value(), "Phiên đăng nhập không hợp lệ hoặc đã hết hạn");
            return false;
        }

        request.setAttribute(CURRENT_USER_ATTRIBUTE, nguoiDung.get());
        return true;
    }
}
