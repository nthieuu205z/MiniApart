package com.prj1.ccm.auth;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** Explicitly opted-in local demo outbox. Codes are never logged or stored in plaintext in the database. */
final class LocalMaXacThucDelivery implements KichHoatTaiKhoanDelivery {
    private final Clock clock;
    private final Map<String, Ma> kichHoat = new ConcurrentHashMap<>();
    private final Map<String, Ma> datLai = new ConcurrentHashMap<>();
    LocalMaXacThucDelivery(Clock clock) { this.clock = clock; }

    @Override public void guiMaKichHoat(String so, String ma) { luu(kichHoat, so, ma, Duration.ofMinutes(30)); }
    @Override public void guiMaDatLaiMatKhau(String so, String ma) { luu(datLai, so, ma, Duration.ofMinutes(5)); }

    private void luu(Map<String, Ma> hop, String so, String ma, Duration ttl) {
        hop.entrySet().removeIf(e -> !e.getValue().hetHan().isAfter(clock.instant()));
        hop.put(SoDienThoaiKey.tu(so), new Ma(ma, clock.instant().plus(ttl)));
    }

    ThongTinMa lay(String so) { return new ThongTinMa(lay(kichHoat, so), lay(datLai, so)); }
    private String lay(Map<String, Ma> hop, String so) {
        Ma ma = hop.get(SoDienThoaiKey.tu(so));
        return ma != null && ma.hetHan().isAfter(clock.instant()) ? ma.giaTri() : null;
    }
    record ThongTinMa(String kichHoat, String datLaiMatKhau) {}
    private record Ma(String giaTri, Instant hetHan) {}
}
