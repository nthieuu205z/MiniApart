package com.prj1.ccm.auth;

import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final XacThucService xacThucService;

    public AuthController(XacThucService xacThucService) {
        this.xacThucService = xacThucService;
    }

    /**
     * FR-AUT-01 lets users sign in with a phone number and password.
     * FR-AUT-02 temporarily locks sign-in for fifteen minutes after five wrong passwords in the sliding window.
     *
     * @param request the submitted phone number and password
     * @return a JWT access token plus the signed-in user's profile
     */
    @PostMapping("/login")
    public DangNhapResponse dangNhap(@RequestBody DangNhapRequest request) {
        return xacThucService.dangNhap(request);
    }

    /**
     * FR-AUT-01 returns the signed-in user's profile so the UI can restore the session after reload.
     *
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the signed-in user's profile
     */
    @GetMapping("/me")
    public ThongTinNguoiDung thongTinNguoiDung(HttpServletRequest request) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        return ThongTinNguoiDung.tuNguoiDung(nguoiDung);
    }
}
