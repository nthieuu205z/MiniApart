package com.prj1.ccm.architecture;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ArchitectureRulesBiteTest {
    private static final String FIXTURE_PACKAGE = "com.prj1.ccm.architecture.fixture.billing.calc";

    @Test
    void floatingPointRuleMustRejectItsIntentionalViolation() {
        assertThatThrownBy(() -> ArchitectureRules.noFloatingPointFieldsInBilling().check(importFixtures()))
                .isInstanceOf(AssertionError.class)
                .hasMessageContaining("HoaDonDungDouble.tongTien")
                .hasMessageContaining("Tien phai dung BigDecimal");
    }

    @Test
    void frameworkRuleMustRejectItsIntentionalViolation() {
        assertThatThrownBy(() -> ArchitectureRules.billingCalculationMustBeFrameworkFree().check(importFixtures()))
                .isInstanceOf(AssertionError.class)
                .hasMessageContaining("TinhTienGoiSpring")
                .hasMessageContaining("billing.calc");
    }

    private static JavaClasses importFixtures() {
        return new ClassFileImporter().importPackages(FIXTURE_PACKAGE);
    }
}
