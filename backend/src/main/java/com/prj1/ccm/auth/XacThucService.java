package com.prj1.ccm.auth;

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
        String soDienThoaiKey = SoDienThoaiKey.tu(request.soDienThoai());
        nguoiDungRepository.taoTheoDoiDangNhapNeuChuaCo(soDienThoaiKey);
        TheoDoiDangNhap theoDoiDangNhap = nguoiDungRepository.findTheoDoiDangNhapChoDangNhap(soDienThoaiKey)
                .orElseThrow(() -> new IllegalStateException("Theo doi dang nhap khong ton tai"));
        NguoiDungDangNhap nguoiDung = nguoiDungRepository.findBySoDienThoaiChoDangNhap(soDienThoaiKey).orElse(null);
        String hashToCheck = nguoiDung == null ? dummyPasswordHash : nguoiDung.matKhauHash();
        boolean passwordMatches = passwordHasher.matches(request.matKhau(), hashToCheck);

        if (dangBiKhoa(theoDoiDangNhap, nguoiDung, soDienThoaiKey, now)) {
            throw new DangNhapTamKhoaException(theoDoiDangNhap.khoaDen(), clock.getZone());
        }

        if (!passwordMatches) {
            xuLyDangNhapSai(soDienThoaiKey, nguoiDung, now);
            throw new DangNhapThatBaiException();
        }

        if (nguoiDung == null || !nguoiDung.hoatDong()) {
            throw new DangNhapThatBaiException();
        }

        nguoiDungRepository.datLaiTrangThaiDangNhap(soDienThoaiKey, nguoiDung.id());

        ThongTinNguoiDung thongTinNguoiDung = ThongTinNguoiDung.tuNguoiDung(nguoiDung.toNguoiDung());
        String token = jwtTokenService.createToken(thongTinNguoiDung, nguoiDung.phienBanToken());

        return new DangNhapResponse(token, jwtTokenService.tokenTtlSeconds(), thongTinNguoiDung);
    }

    private boolean dangBiKhoa(
            TheoDoiDangNhap theoDoiDangNhap,
            NguoiDungDangNhap nguoiDung,
            String soDienThoaiKey,
            Instant now
    ) {
        if (theoDoiDangNhap.khoaDen() == null) {
            return false;
        }
        if (!theoDoiDangNhap.dangBiKhoa(now)) {
            nguoiDungRepository.datLaiTrangThaiDangNhap(soDienThoaiKey, nguoiDung == null ? null : nguoiDung.id());
            return false;
        }
        return true;
    }

    private void xuLyDangNhapSai(String soDienThoaiKey, NguoiDungDangNhap nguoiDung, Instant now) {
        Instant batDauCuaSo = now.minus(CUA_SO_SAI);
        nguoiDungRepository.xoaLanDangNhapSaiTruoc(soDienThoaiKey, batDauCuaSo);
        nguoiDungRepository.ghiNhanLanDangNhapSai(soDienThoaiKey, nguoiDung == null ? null : nguoiDung.id(), now);

        int soLanSai = nguoiDungRepository.demLanDangNhapSaiTu(soDienThoaiKey, batDauCuaSo);
        Instant lanSaiDauTien = nguoiDungRepository.timLanDangNhapSaiSomNhatTu(soDienThoaiKey, batDauCuaSo);
        if (soLanSai >= SO_LAN_SAI_TOI_DA) {
            Instant khoaDen = now.plus(THOI_GIAN_KHOA);
            nguoiDungRepository.capNhatTheoDoiDangNhap(soDienThoaiKey, soLanSai, lanSaiDauTien, khoaDen);
            if (nguoiDung != null) {
                nguoiDungRepository.khoaTamDangNhap(nguoiDung.id(), soLanSai, lanSaiDauTien, khoaDen);
            }
            return;
        }
        nguoiDungRepository.capNhatTheoDoiDangNhap(soDienThoaiKey, soLanSai, lanSaiDauTien, null);
        if (nguoiDung != null) {
            nguoiDungRepository.capNhatDangNhapSai(nguoiDung.id(), soLanSai, lanSaiDauTien);
        }
    }
}
