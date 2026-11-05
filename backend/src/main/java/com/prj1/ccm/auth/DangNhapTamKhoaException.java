package com.prj1.ccm.auth;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

public class DangNhapTamKhoaException extends RuntimeException {
    private static final DateTimeFormatter THOI_GIAN_MO_KHOA =
            DateTimeFormatter.ofPattern("HH:mm 'ngày' dd/MM/yyyy", Locale.forLanguageTag("vi-VN"));

    public DangNhapTamKhoaException(Instant khoaDen, ZoneId zoneId) {
        super("Đăng nhập tạm thời bị khoá. Vui lòng thử lại sau "
                + THOI_GIAN_MO_KHOA.withZone(zoneId).format(khoaDen));
    }
}
