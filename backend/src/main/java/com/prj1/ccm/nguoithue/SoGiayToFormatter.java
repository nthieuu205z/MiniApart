package com.prj1.ccm.nguoithue;

final class SoGiayToFormatter {
    private SoGiayToFormatter() {
    }

    static String chuanHoa(String soGiayTo) {
        if (soGiayTo == null) {
            return "";
        }
        return soGiayTo.replaceAll("\\s+", "");
    }

    static String che(String soGiayTo) {
        if (soGiayTo == null || soGiayTo.isBlank()) {
            return "";
        }
        String daChuanHoa = chuanHoa(soGiayTo);
        if (daChuanHoa.length() <= 4) {
            return daChuanHoa;
        }
        return "*".repeat(daChuanHoa.length() - 4) + daChuanHoa.substring(daChuanHoa.length() - 4);
    }
}
