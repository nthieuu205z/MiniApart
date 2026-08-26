package com.prj1.ccm.auth;

import com.prj1.ccm.nguoidung.TrangThaiNguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class XacThucServiceTest {

    @Test
    void FR_AUT_02_lockExpiresAndAllowsLoginAgainWithoutSleeping() {
        MutableClock clock = new MutableClock(Instant.parse("2026-08-26T07:00:00Z"), ZoneId.of("Asia/Ho_Chi_Minh"));
        PasswordHasher passwordHasher = new PasswordHasher();
        String runtimePassword = taoMatKhauRuntime();
        TestNguoiDungRepository repository = new TestNguoiDungRepository(taoNguoiDungDangNhap(passwordHasher, runtimePassword));
        JwtTokenService jwtTokenService = mock(JwtTokenService.class);
        when(jwtTokenService.createToken(any(), eq(1))).thenReturn("token-sau-khi-mo-khoa");
        when(jwtTokenService.tokenTtlSeconds()).thenReturn(1800L);
        XacThucService service = new XacThucService(repository, passwordHasher, jwtTokenService, clock);

        for (int phut = 0; phut < 5; phut++) {
            clock.dat(Instant.parse("2026-08-26T07:%02d:00Z".formatted(phut)));
            assertThatThrownBy(() -> service.dangNhap(new DangNhapRequest("0900000003", runtimePassword + "-sai")))
                    .isInstanceOf(DangNhapThatBaiException.class);
        }

        clock.dat(Instant.parse("2026-08-26T07:05:00Z"));
        assertThatThrownBy(() -> service.dangNhap(new DangNhapRequest("0900000003", runtimePassword)))
                .isInstanceOf(DangNhapTamKhoaException.class)
                .hasMessageStartingWith("Đăng nhập tạm thời bị khoá. Vui lòng thử lại sau ");

        clock.dat(Instant.parse("2026-08-26T07:21:00Z"));
        DangNhapResponse response = service.dangNhap(new DangNhapRequest("0900000003", runtimePassword));

        assertThat(response.token()).isEqualTo("token-sau-khi-mo-khoa");
        assertThat(repository.trangThai()).extracting(
                        NguoiDungDangNhap::soLanSai,
                        NguoiDungDangNhap::lanSaiDauTien,
                        NguoiDungDangNhap::khoaDen,
                        NguoiDungDangNhap::phienBanToken
                )
                .containsExactly(0, null, null, 1);
        assertThat(repository.soLanDangNhapSai()).isZero();
    }

    @Test
    void FR_AUT_02_countsWrongPasswordsInTheSlidingWindowInsteadOfAcrossTheWholeAccountLifetime() {
        MutableClock clock = new MutableClock(Instant.parse("2026-08-26T07:00:00Z"), ZoneId.of("Asia/Ho_Chi_Minh"));
        PasswordHasher passwordHasher = new PasswordHasher();
        String runtimePassword = taoMatKhauRuntime();
        TestNguoiDungRepository repository = new TestNguoiDungRepository(taoNguoiDungDangNhap(passwordHasher, runtimePassword));
        JwtTokenService jwtTokenService = mock(JwtTokenService.class);
        XacThucService service = new XacThucService(repository, passwordHasher, jwtTokenService, clock);

        String[] cacMocSai = {
                "2026-08-26T07:00:00Z",
                "2026-08-26T07:10:00Z",
                "2026-08-26T07:11:00Z",
                "2026-08-26T07:12:00Z",
                "2026-08-26T07:16:00Z",
                "2026-08-26T07:17:00Z"
        };

        for (String mocSai : cacMocSai) {
            clock.dat(Instant.parse(mocSai));
            assertThatThrownBy(() -> service.dangNhap(new DangNhapRequest("0900000003", runtimePassword + "-sai")))
                    .isInstanceOf(DangNhapThatBaiException.class);
        }

        clock.dat(Instant.parse("2026-08-26T07:18:00Z"));
        assertThatThrownBy(() -> service.dangNhap(new DangNhapRequest("0900000003", runtimePassword)))
                .isInstanceOf(DangNhapTamKhoaException.class);

        assertThat(repository.trangThai().soLanSai()).isEqualTo(5);
        assertThat(repository.trangThai().phienBanToken()).isEqualTo(1);
        assertThat(repository.trangThai().lanSaiDauTien()).isEqualTo(Instant.parse("2026-08-26T07:10:00Z"));
    }

    @Test
    void FR_AUT_02_successfulLoginResetsTheFailureCounter() {
        MutableClock clock = new MutableClock(Instant.parse("2026-08-26T07:00:00Z"), ZoneId.of("Asia/Ho_Chi_Minh"));
        PasswordHasher passwordHasher = new PasswordHasher();
        String runtimePassword = taoMatKhauRuntime();
        TestNguoiDungRepository repository = new TestNguoiDungRepository(taoNguoiDungDangNhap(passwordHasher, runtimePassword));
        JwtTokenService jwtTokenService = mock(JwtTokenService.class);
        when(jwtTokenService.createToken(any(), eq(0))).thenReturn("token-hop-le");
        when(jwtTokenService.tokenTtlSeconds()).thenReturn(1800L);
        XacThucService service = new XacThucService(repository, passwordHasher, jwtTokenService, clock);

        assertThatThrownBy(() -> service.dangNhap(new DangNhapRequest("0900000003", runtimePassword + "-sai")))
                .isInstanceOf(DangNhapThatBaiException.class);
        clock.dat(Instant.parse("2026-08-26T07:01:00Z"));
        assertThatThrownBy(() -> service.dangNhap(new DangNhapRequest("0900000003", runtimePassword + "-sai")))
                .isInstanceOf(DangNhapThatBaiException.class);

        clock.dat(Instant.parse("2026-08-26T07:02:00Z"));
        DangNhapResponse response = service.dangNhap(new DangNhapRequest("0900000003", runtimePassword));

        assertThat(response.token()).isEqualTo("token-hop-le");
        assertThat(repository.trangThai().soLanSai()).isZero();
        assertThat(repository.soLanDangNhapSai()).isZero();
    }

    private NguoiDungDangNhap taoNguoiDungDangNhap(PasswordHasher passwordHasher, String runtimePassword) {
        return new NguoiDungDangNhap(
                3L,
                "Quan ly Toa A",
                "0900000003",
                passwordHasher.hash(runtimePassword),
                VaiTro.QUAN_LY,
                TrangThaiNguoiDung.HOAT_DONG,
                0,
                0,
                null,
                null
        );
    }

    private String taoMatKhauRuntime() {
        return "runtime-" + UUID.randomUUID();
    }

    private static final class MutableClock extends Clock {
        private Instant instant;
        private final ZoneId zoneId;

        private MutableClock(Instant instant, ZoneId zoneId) {
            this.instant = instant;
            this.zoneId = zoneId;
        }

        private void dat(Instant instant) {
            this.instant = instant;
        }

        @Override
        public ZoneId getZone() {
            return zoneId;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return new MutableClock(instant, zone);
        }

        @Override
        public Instant instant() {
            return instant;
        }
    }

    private static final class TestNguoiDungRepository extends NguoiDungRepository {
        private NguoiDungDangNhap nguoiDungDangNhap;
        private final List<Instant> cacLanDangNhapSai = new ArrayList<>();

        private TestNguoiDungRepository(NguoiDungDangNhap nguoiDungDangNhap) {
            super(null);
            this.nguoiDungDangNhap = nguoiDungDangNhap;
        }

        @Override
        public Optional<NguoiDungDangNhap> findBySoDienThoaiChoDangNhap(String soDienThoai) {
            if (!nguoiDungDangNhap.soDienThoai().equals(soDienThoai)) {
                return Optional.empty();
            }
            return Optional.of(nguoiDungDangNhap);
        }

        @Override
        public void xoaLanDangNhapSaiTruoc(Long nguoiDungId, Instant mocThoiGian) {
            cacLanDangNhapSai.removeIf(instant -> instant.isBefore(mocThoiGian));
        }

        @Override
        public void ghiNhanLanDangNhapSai(Long nguoiDungId, Instant thoiDiem) {
            cacLanDangNhapSai.add(thoiDiem);
        }

        @Override
        public int demLanDangNhapSaiTu(Long nguoiDungId, Instant mocThoiGian) {
            return (int) cacLanDangNhapSai.stream().filter(instant -> !instant.isBefore(mocThoiGian)).count();
        }

        @Override
        public Instant timLanDangNhapSaiSomNhatTu(Long nguoiDungId, Instant mocThoiGian) {
            return cacLanDangNhapSai.stream()
                    .filter(instant -> !instant.isBefore(mocThoiGian))
                    .min(Comparator.naturalOrder())
                    .orElse(null);
        }

        @Override
        public void capNhatDangNhapSai(Long nguoiDungId, int soLanSai, Instant lanSaiDauTien) {
            nguoiDungDangNhap = capNhat(soLanSai, lanSaiDauTien, null, nguoiDungDangNhap.phienBanToken());
        }

        @Override
        public void khoaTamDangNhap(Long nguoiDungId, int soLanSai, Instant lanSaiDauTien, Instant khoaDen) {
            nguoiDungDangNhap = capNhat(soLanSai, lanSaiDauTien, khoaDen, nguoiDungDangNhap.phienBanToken() + 1);
        }

        @Override
        public void datLaiTrangThaiDangNhap(Long nguoiDungId) {
            cacLanDangNhapSai.clear();
            nguoiDungDangNhap = capNhat(0, null, null, nguoiDungDangNhap.phienBanToken());
        }

        private NguoiDungDangNhap capNhat(int soLanSai, Instant lanSaiDauTien, Instant khoaDen, int phienBanToken) {
            return new NguoiDungDangNhap(
                    nguoiDungDangNhap.id(),
                    nguoiDungDangNhap.hoTen(),
                    nguoiDungDangNhap.soDienThoai(),
                    nguoiDungDangNhap.matKhauHash(),
                    nguoiDungDangNhap.vaiTro(),
                    nguoiDungDangNhap.trangThai(),
                    phienBanToken,
                    soLanSai,
                    lanSaiDauTien,
                    khoaDen
            );
        }

        private NguoiDungDangNhap trangThai() {
            return nguoiDungDangNhap;
        }

        private int soLanDangNhapSai() {
            return cacLanDangNhapSai.size();
        }
    }
}
