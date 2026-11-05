package com.prj1.ccm.auth;

import com.prj1.ccm.nguoidung.TrangThaiNguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import java.time.*;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class DatLaiMatKhauServiceTest {
    private final MutableClock clock = new MutableClock();
    private final NguoiDungRepository users = mock(NguoiDungRepository.class);
    private final MemoryCodes codes = new MemoryCodes();
    private final PasswordHasher hasher = new PasswordHasher();
    private final Delivery delivery = new Delivery();
    private final DatLaiMatKhauService service = new DatLaiMatKhauService(users, codes, hasher, delivery, clock);

    DatLaiMatKhauServiceTest() {
        when(users.findBySoDienThoaiChoDangNhap("0900000003")).thenReturn(Optional.of(new NguoiDungDangNhap(
                3L, "Quản lý", "0900000003", "unused", VaiTro.QUAN_LY, TrangThaiNguoiDung.HOAT_DONG, 2, null, 0, null, null)));
    }

    @Test void otpExpiresAtFiveMinutesAndCannotBeReused() {
        service.yeuCau("0900000003");
        assertThat(delivery.last).matches("[0-9]{6}");
        assertThat(codes.value.hash()).doesNotContain(delivery.last);
        String first = delivery.last;
        clock.now = clock.now.plusSeconds(300);
        assertThatThrownBy(() -> service.xacNhan("0900000003", first, "mat-khau-moi-123")).isInstanceOf(DatLaiMatKhauService.MaKhongHopLe.class);
        service.yeuCau("0900000003");
        service.xacNhan("0900000003", delivery.last, "mat-khau-moi-123");
        assertThatThrownBy(() -> service.xacNhan("0900000003", delivery.last, "mat-khau-moi-456")).isInstanceOf(DatLaiMatKhauService.MaKhongHopLe.class);
        ArgumentCaptor<String> hash = ArgumentCaptor.forClass(String.class);
        verify(users).capNhatMatKhauSauKichHoat(eq(3L), hash.capture());
        assertThat(hasher.matches("mat-khau-moi-123", hash.getValue())).isTrue();
        verify(users).xoaMaKichHoat(3L);
    }

    @Test void fiveWrongAttemptsBlockEvenTheCorrectCode() {
        service.yeuCau("0900000003");
        String wrong = "000000".equals(delivery.last) ? "000001" : "000000";
        for (int i = 0; i < 5; i++) assertThatThrownBy(() -> service.xacNhan("0900000003", wrong, "mat-khau-moi-123")).isInstanceOf(DatLaiMatKhauService.MaKhongHopLe.class);
        assertThat(codes.value.soLanThu()).isEqualTo(5);
        assertThatThrownBy(() -> service.xacNhan("0900000003", delivery.last, "mat-khau-moi-123")).isInstanceOf(DatLaiMatKhauService.MaKhongHopLe.class);
        verify(users, never()).capNhatMatKhauSauKichHoat(anyLong(), anyString());
    }

    @Test void sendCooldownAndWindowLimitDoNotReplaceValidCode() {
        service.yeuCau("0900000003");
        String original = delivery.last;
        service.yeuCau("0900000003");
        assertThat(delivery.count).isEqualTo(1);
        assertThat(delivery.last).isEqualTo(original);
        for (int i = 0; i < 4; i++) { clock.now = clock.now.plusSeconds(60); service.yeuCau("0900000003"); }
        clock.now = clock.now.plusSeconds(60);
        service.yeuCau("0900000003");
        assertThat(delivery.count).isEqualTo(5);
        clock.now = clock.now.plusSeconds(600);
        service.yeuCau("0900000003");
        assertThat(delivery.count).isEqualTo(6);
    }

    @Test void unknownAccountDoesNotSendOrPersistCode() {
        service.yeuCau("0900999999");
        assertThat(delivery.count).isZero();
        assertThat(codes.value).isNull();
    }

    private static class Delivery implements KichHoatTaiKhoanDelivery {
        String last; int count;
        public void guiMaKichHoat(String so, String ma) { last = ma; count++; }
    }
    private static class MutableClock extends Clock {
        Instant now = Instant.parse("2026-11-04T00:00:00Z");
        public ZoneId getZone() { return ZoneOffset.UTC; }
        public Clock withZone(ZoneId zone) { return this; }
        public Instant instant() { return now; }
    }
    private static class MemoryCodes extends DatLaiMatKhauRepository {
        MaDatLai value;
        MemoryCodes() { super(null); }
        public Optional<MaDatLai> khoa(Long id) { return Optional.ofNullable(value); }
        public void luu(Long id, String hash, Instant hetHan, Instant guiLuc, Instant cuaSo, int soLanGui) { value = new MaDatLai(hash, hetHan, 0, guiLuc, cuaSo, soLanGui, false); }
        public void ghiSai(Long id) { value = new MaDatLai(value.hash(), value.hetHan(), value.soLanThu()+1, value.guiLuc(), value.cuaSoGuiLuc(), value.soLanGui(), value.daDung()); }
        public void dung(Long id) { value = new MaDatLai(value.hash(), value.hetHan(), value.soLanThu(), value.guiLuc(), value.cuaSoGuiLuc(), value.soLanGui(), true); }
    }
}
