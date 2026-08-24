package com.prj1.ccm.architecture;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Applies the architectural conventions to the production code. A red run here means
 * someone wrote code that violates convention 1 or 2, and the build stops.
 */
class ArchitectureRulesTest {

	/** Production classes only: the deliberately broken fixtures live in test sources. */
	private static final JavaClasses PRODUCTION_CLASSES = new ClassFileImporter()
			.withImportOption(new ImportOption.DoNotIncludeTests())
			.importPackages("com.prj1.ccm");

	/**
	 * Guards against the worst failure mode these rules have: passing because they looked at
	 * nothing.
	 *
	 * <p>This is not hypothetical. Built on Java 26, every rule here reported green while
	 * importing zero classes, because the ASM version bundled with ArchUnit 1.4.1 reads class
	 * files only up to Java 25 and skips newer ones without complaint. A misspelled package
	 * name would do the same. Either way the project would run for months believing it had
	 * a guard rail it did not have.
	 */
	@Test
	@DisplayName("ArchUnit that su co doc duoc ma nguon, khong phai soi vao hu khong")
	void rulesActuallySeeTheProductionCode() {
		assertThat(PRODUCTION_CLASSES.size())
				.as("ArchUnit nhap duoc 0 lop - moi luat kien truc deu dang bao xanh gia. "
						+ "Thuong la do phien ban Java moi hon muc ASM cua ArchUnit doc duoc")
				.isGreaterThan(0);
	}

	@Test
	@DisplayName("Quy uoc 1 - khong truong tien nao trong billing dung double hay float")
	void moneyNeverUsesFloatingPoint() {
		ArchitectureRules.MONEY_NEVER_USES_FLOATING_POINT.check(PRODUCTION_CLASSES);
	}

	@Test
	@DisplayName("Quy uoc 2 - billing.calc khong phu thuoc Spring hay JPA")
	void billingCalcStaysPure() {
		ArchitectureRules.BILLING_CALC_STAYS_PURE.check(PRODUCTION_CLASSES);
	}
}
