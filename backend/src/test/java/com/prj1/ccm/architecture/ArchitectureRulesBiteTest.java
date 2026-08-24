package com.prj1.ccm.architecture;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.lang.EvaluationResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Proves the architectural rules actually bite.
 *
 * <p>A rule that passes tells you nothing on its own: a misspelled package pattern also
 * passes, silently, forever. So each rule is run here against a class written specifically
 * to break it, and is required to report a violation naming the offender.
 *
 * <p>This replaces the manual check of pasting a {@code double} into the code, watching the
 * build go red, and removing it again. Same evidence, except it re-runs on every build
 * instead of once.
 */
class ArchitectureRulesBiteTest {

	/** The deliberately broken specimens, imported on their own. */
	private static final JavaClasses FIXTURES = new ClassFileImporter()
			.importPackages("com.prj1.ccm.architecture.fixture");

	@Test
	@DisplayName("Cac lop chuyen de vi pham that su duoc nhap vao")
	void fixturesAreActuallyImported() {
		assertThat(FIXTURES.size())
				.as("khong nhap duoc lop chuyen de nao thi hai phep thu duoi day vo nghia")
				.isGreaterThan(0);
	}

	@Test
	@DisplayName("Quy uoc 1 phat hien duoc mot truong double trong billing")
	void moneyRuleCatchesADoubleField() {
		EvaluationResult ketQua = ArchitectureRules.MONEY_NEVER_USES_FLOATING_POINT.evaluate(FIXTURES);
		assertThat(ketQua.hasViolation())
				.as("luat cam double phai bat duoc HoaDonDungDouble.tongTien")
				.isTrue();
		assertThat(ketQua.getFailureReport().toString())
				.contains("HoaDonDungDouble")
				.contains("tongTien")
				// The message must say why, not merely that a rule failed.
				.contains("203000.00000000003");
	}

	@Test
	@DisplayName("Quy uoc 2 phat hien duoc billing.calc phu thuoc Spring")
	void purityRuleCatchesASpringDependency() {
		EvaluationResult ketQua = ArchitectureRules.BILLING_CALC_STAYS_PURE.evaluate(FIXTURES);

		assertThat(ketQua.hasViolation())
				.as("luat cam phu thuoc phai bat duoc TinhTienGoiSpring")
				.isTrue();
		assertThat(ketQua.getFailureReport().toString())
				.contains("TinhTienGoiSpring")
				.contains("org.springframework")
				.contains("mili giay");
	}
}
