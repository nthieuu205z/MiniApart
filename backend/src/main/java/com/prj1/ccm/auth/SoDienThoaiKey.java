package com.prj1.ccm.auth;

public final class SoDienThoaiKey {
    private SoDienThoaiKey() {
    }

    public static String tu(String soDienThoai) {
        if (soDienThoai == null) {
            return "";
        }
        return soDienThoai.replaceAll("\\s+", "");
    }
}
