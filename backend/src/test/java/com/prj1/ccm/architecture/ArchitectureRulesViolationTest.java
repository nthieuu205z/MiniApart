package com.prj1.ccm.architecture;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ArchitectureRulesViolationTest {
    private static final String FIXTURE_PACKAGE = "com.prj1.ccm.architecture.fixture.billing.calc";

    @Test
    void frInv02FloatingPointRuleMustRejectIntentionalViolation() {
        assertThatThrownBy(() -> ArchitectureRules.noFloatingPointInBilling().check(importFixtures()))
                .isInstanceOf(AssertionError.class)
                .hasMessageContaining("HoaDonDungDouble.tongTien")
                .hasMessageContaining("Tien phai dung BigDecimal");
    }

    @Test
    void frInv02FloatingPointRuleMustRejectMethodReturnTypeViolation() {
        assertThatThrownBy(() -> ArchitectureRules.noFloatingPointInBilling().check(importFixtures()))
                .isInstanceOf(AssertionError.class)
                .hasMessageContaining("HoaDonDungDouble.tinhTien()");
    }

    @Test
    void frInv02FloatingPointRuleMustRejectMethodParameterViolation() {
        assertThatThrownBy(() -> ArchitectureRules.noFloatingPointInBilling().check(importFixtures()))
                .isInstanceOf(AssertionError.class)
                .hasMessageContaining("HoaDonNhanDouble.apDung(double)");
    }

    @Test
    void frInv02FrameworkRuleMustRejectIntentionalViolation() {
        assertThatThrownBy(() -> ArchitectureRules.billingCalculationMustBeFrameworkFree().check(importFixtures()))
                .isInstanceOf(AssertionError.class)
                .hasMessageContaining("TinhTienGoiSpring")
                .hasMessageContaining("billing.calc");
    }

    private static JavaClasses importFixtures() {
        return new ClassFileImporter().importPackages(FIXTURE_PACKAGE);
    }
}
