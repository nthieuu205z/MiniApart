package com.prj1.ccm.billing.calc;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;

class TienTeTest {

    @Test
    void FR_INV_02_tienTeNormalizesScaleAndComparesByNumericValue() {
        TienTe motChamKhong = new TienTe(new BigDecimal("1.0"));
        TienTe motChamKhongKhong = new TienTe(new BigDecimal("1.00"));

        assertThat(motChamKhong.giaTri()).isEqualByComparingTo("1.00");
        assertThat(motChamKhong.giaTri().scale()).isEqualTo(2);
        assertThat(motChamKhong).isEqualTo(motChamKhongKhong);
        assertThat(motChamKhong.hashCode()).isEqualTo(motChamKhongKhong.hashCode());
    }

    @Test
    void FR_INV_02_tienTeSupportsCongTruNhanAndNegativeValues() {
        TienTe ketQua = new TienTe(new BigDecimal("1000.10"))
                .cong(new TienTe(new BigDecimal("20.05")))
                .tru(new TienTe(new BigDecimal("1500.40")))
                .nhan(new BigDecimal("2"));

        assertThat(ketQua.giaTri()).isEqualByComparingTo("-960.50");
        assertThat(ketQua.am()).isTrue();
    }

    @Test
    void FR_INV_02_tienTePublicApiDoesNotExposeFloatingPointTypesOrImplicitDivision() {
        assertThat(Arrays.stream(TienTe.class.getMethods()))
                .filteredOn(method -> method.getDeclaringClass() == TienTe.class)
                .extracting(Method::getName)
                .doesNotContain("chia");

        assertThat(Arrays.stream(TienTe.class.getMethods()))
                .filteredOn(method -> method.getDeclaringClass() == TienTe.class)
                .allSatisfy(this::assertKhongDungKieuDauPhayDong);
    }

    private void assertKhongDungKieuDauPhayDong(Method method) {
        assertThat(method.getReturnType())
                .isNotIn(double.class, float.class, Double.class, Float.class);
        assertThat(method.getParameterTypes())
                .doesNotContain(double.class, float.class, Double.class, Float.class);
    }
}
