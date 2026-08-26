package com.prj1.ccm.architecture;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ArchitectureRulesTest {
    private static final String PRODUCTION_PACKAGE = "com.prj1.ccm";

    @Test
    void frInv02RulesActuallySeeTheProductionCode() {
        JavaClasses productionClasses = importProductionClasses();

        assertThat(productionClasses.size()).isGreaterThan(0);
    }

    @Test
    void frInv02ProductionCodeMustRejectFloatingPointFieldsInBilling() {
        ArchitectureRules.noFloatingPointFieldsInBilling().check(importProductionClasses());
    }

    @Test
    void frInv02ProductionCodeMustKeepBillingCalculationFrameworkFree() {
        ArchitectureRules.billingCalculationMustBeFrameworkFree().check(importProductionClasses());
    }

    private static JavaClasses importProductionClasses() {
        return new ClassFileImporter()
                .withImportOption(new ImportOption.DoNotIncludeTests())
                .importPackages(PRODUCTION_PACKAGE);
    }
}
