package com.prj1.ccm.auth;

import com.prj1.ccm.nguoidung.NguoiDung;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

@Service
public class XacThucService {
    static final int SO_LAN_SAI_TOI_DA = 5;
    static final Duration CUA_SO_SAI = Duration.ofMinutes(15);
    static final Duration THOI_GIAN_KHOA = Duration.ofMinutes(15);

    private final NguoiDungRepository nguoiDungRepository;
    private final PasswordHasher passwordHasher;
    private final JwtTokenService jwtTokenService;
    private final Clock clock;
    private final String dummyPasswordHash;

    public XacThucService(
            NguoiDungRepository nguoiDungRepository,
            PasswordHasher passwordHasher,
            JwtTokenService jwtTokenService,
            Clock clock
    ) {
        this.nguoiDungRepository = nguoiDungRepository;
        this.passwordHasher = passwordHasher;
        this.jwtTokenService = jwtTokenService;
        this.clock = clock;
        this.dummyPasswordHash = passwordHasher.hash("timing-only-dummy-password");
    }

    @Transactional(noRollbackFor = {DangNhapThatBaiException.class, DangNhapTamKhoaException.class})
    public DangNhapResponse dangNhap(DangNhapRequest request) {
        Instant now = clock.instant();
        NguoiDungDangNhap nguoiDung = nguoiDungRepository.findBySoDienThoaiChoDangNhap(request.soDienThoai()).orElse(null);
        String hashToCheck = nguoiDung == null ? dummyPasswordHash : nguoiDung.matKhauHash();
        boolean passwordMatches = passwordHasher.matches(request.matKhau(), hashToCheck);

        if (nguoiDung == null) {
            throw new DangNhapThatBaiException();
        }

        if (dangBiKhoa(nguoiDung, now)) {
            throw new DangNhapTamKhoaException(nguoiDung.khoaDen(), clock.getZone());
        }

        if (!nguoiDung.hoatDong()) {
            throw new DangNhapThatBaiException();
        }

        if (!passwordMatches) {
            xuLyDangNhapSai(nguoiDung, now);
            throw new DangNhapThatBaiException();
        }

        nguoiDungRepository.datLaiTrangThaiDangNhap(nguoiDung.id());

        ThongTinNguoiDung thongTinNguoiDung = ThongTinNguoiDung.tuNguoiDung(toNguoiDung(nguoiDung));
        String token = jwtTokenService.createToken(thongTinNguoiDung, nguoiDung.phienBanToken());

        return new DangNhapResponse(token, jwtTokenService.tokenTtlSeconds(), thongTinNguoiDung);
    }

    private boolean dangBiKhoa(NguoiDungDangNhap nguoiDung, Instant now) {
        if (nguoiDung.khoaDen() == null) {
            return false;
        }
        if (!now.isBefore(nguoiDung.khoaDen())) {
            nguoiDungRepository.datLaiTrangThaiDangNhap(nguoiDung.id());
            return false;
        }
        return true;
    }

    private void xuLyDangNhapSai(NguoiDungDangNhap nguoiDung, Instant now) {
        Instant batDauCuaSo = now.minus(CUA_SO_SAI);
        nguoiDungRepository.xoaLanDangNhapSaiTruoc(nguoiDung.id(), batDauCuaSo);
        nguoiDungRepository.ghiNhanLanDangNhapSai(nguoiDung.id(), now);

        int soLanSai = nguoiDungRepository.demLanDangNhapSaiTu(nguoiDung.id(), batDauCuaSo);
        Instant lanSaiDauTien = nguoiDungRepository.timLanDangNhapSaiSomNhatTu(nguoiDung.id(), batDauCuaSo);
        if (soLanSai >= SO_LAN_SAI_TOI_DA) {
            nguoiDungRepository.khoaTamDangNhap(nguoiDung.id(), soLanSai, lanSaiDauTien, now.plus(THOI_GIAN_KHOA));
            return;
        }
        nguoiDungRepository.capNhatDangNhapSai(nguoiDung.id(), soLanSai, lanSaiDauTien);
    }

    private NguoiDung toNguoiDung(NguoiDungDangNhap nguoiDungDangNhap) {
        return new NguoiDung(
                nguoiDungDangNhap.id(),
                nguoiDungDangNhap.hoTen(),
                nguoiDungDangNhap.soDienThoai(),
                nguoiDungDangNhap.matKhauHash(),
                nguoiDungDangNhap.vaiTro(),
                nguoiDungDangNhap.trangThai(),
                nguoiDungDangNhap.phienBanToken()
        );
    }
}
