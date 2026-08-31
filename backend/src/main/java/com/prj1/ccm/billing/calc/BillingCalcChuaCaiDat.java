package com.prj1.ccm.billing.calc;

final class BillingCalcChuaCaiDat {
    private BillingCalcChuaCaiDat() {
    }

    static UnsupportedOperationException loi(String tenThanhPhan) {
        return new UnsupportedOperationException(tenThanhPhan + " chua cai dat");
    }
}
