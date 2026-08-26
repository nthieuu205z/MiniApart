package com.prj1.ccm.auth;

import com.prj1.ccm.nguoidung.NguoiDung;
import org.springframework.stereotype.Service;

@Service
public class XacThucService {
    private final NguoiDungRepository nguoiDungRepository;
    private final PasswordHasher passwordHasher;
    private final JwtTokenService jwtTokenService;
    private final String dummyPasswordHash;

    public XacThucService(
            NguoiDungRepository nguoiDungRepository,
            PasswordHasher passwordHasher,
            JwtTokenService jwtTokenService
    ) {
        this.nguoiDungRepository = nguoiDungRepository;
        this.passwordHasher = passwordHasher;
        this.jwtTokenService = jwtTokenService;
        this.dummyPasswordHash = passwordHasher.hash("timing-only-dummy-password");
    }

    public DangNhapResponse dangNhap(DangNhapRequest request) {
        NguoiDung nguoiDung = nguoiDungRepository.findBySoDienThoai(request.soDienThoai()).orElse(null);
        String hashToCheck = nguoiDung == null ? dummyPasswordHash : nguoiDung.matKhauHash();
        boolean passwordMatches = passwordHasher.matches(request.matKhau(), hashToCheck);

        if (nguoiDung == null || !passwordMatches || !nguoiDung.hoatDong()) {
            throw new DangNhapThatBaiException();
        }

        ThongTinNguoiDung thongTinNguoiDung = ThongTinNguoiDung.tuNguoiDung(nguoiDung);
        String token = jwtTokenService.createToken(thongTinNguoiDung, nguoiDung.phienBanToken());

        return new DangNhapResponse(token, jwtTokenService.tokenTtlSeconds(), thongTinNguoiDung);
    }
}
