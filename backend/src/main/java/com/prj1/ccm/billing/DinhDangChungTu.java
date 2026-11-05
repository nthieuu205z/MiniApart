package com.prj1.ccm.billing;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/** Shared NFR-USA-06 display formatting for server-generated billing documents. */
@Component
class DinhDangChungTu {
    private static final Locale TIENG_VIET = Locale.forLanguageTag("vi-VN");
    private static final DateTimeFormatter NGAY = DateTimeFormatter.ofPattern("dd/MM/yyyy", TIENG_VIET);

    String tien(String value) {
        return tien(new BigDecimal(value));
    }

    String tien(BigDecimal value) {
        DecimalFormat format = new DecimalFormat("#,##0.##", DecimalFormatSymbols.getInstance(TIENG_VIET));
        return format.format(value) + " đ";
    }

    String ngay(String value) {
        return ngay(LocalDate.parse(value));
    }

    String ngay(LocalDate value) {
        return value == null ? "Không lưu" : NGAY.format(value);
    }
}
