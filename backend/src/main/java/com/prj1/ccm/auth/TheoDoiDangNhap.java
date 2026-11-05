package com.prj1.ccm.auth;

import java.time.Instant;

public record TheoDoiDangNhap(
        String soDienThoaiKey,
        int soLanSai,
        Instant lanSaiDauTien,
        Instant khoaDen
) {
    public boolean dangBiKhoa(Instant now) {
        return khoaDen != null && now.isBefore(khoaDen);
    }
}
