package com.prj1.ccm.billing;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

final class VietQrPayloadBuilder {
    private static final String GUID_VIET_QR = "A000000727";
    private static final String MA_DICH_VU_CHUYEN_KHOAN = "QRIBFTTA";

    private VietQrPayloadBuilder() {
    }

    static String tao(String maNganHang, String taiKhoanNganHang, BigDecimal soTien, String maHoaDon) {
        String thongTinTaiKhoan = tlv("00", maNganHang) + tlv("01", taiKhoanNganHang);
        String thongTinTaiKhoanThuHuong = tlv("00", GUID_VIET_QR)
                + tlv("01", thongTinTaiKhoan)
                + tlv("02", MA_DICH_VU_CHUYEN_KHOAN);
        String thongTinThem = tlv("08", maHoaDon);
        String payloadKhongCrc = tlv("00", "01")
                + tlv("01", "12")
                + tlv("38", thongTinTaiKhoanThuHuong)
                + tlv("53", "704")
                + tlv("54", soTien.toPlainString())
                + tlv("58", "VN")
                + tlv("62", thongTinThem)
                + "6304";
        return payloadKhongCrc + crc16Ccitt(payloadKhongCrc);
    }

    private static String tlv(String tag, String value) {
        int length = value.getBytes(StandardCharsets.UTF_8).length;
        return tag + String.format(Locale.ROOT, "%02d", length) + value;
    }

    private static String crc16Ccitt(String value) {
        int crc = 0xFFFF;
        for (byte current : value.getBytes(StandardCharsets.UTF_8)) {
            crc ^= (current & 0xFF) << 8;
            for (int bit = 0; bit < 8; bit++) {
                crc = (crc & 0x8000) != 0 ? (crc << 1) ^ 0x1021 : crc << 1;
                crc &= 0xFFFF;
            }
        }
        return String.format(Locale.ROOT, "%04X", crc);
    }
}
