package com.prj1.ccm.architecture;

import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noFields;

/**
 * The two architectural conventions the whole project rests on, stated once so that both
 * the production check and the proof that they bite use the identical rule.
 *
 * <p>See {@code AGENTS.md} conventions 1 and 2, and chapter 4.4 of the report.
 */
final class ArchitectureRules {

	/**
	 * Convention 1. Money is {@code BigDecimal}, never a floating-point type.
	 *
	 * <p>The boxed types are banned alongside the primitives: a {@code Double} field loses
	 * precision in exactly the same way, and only differs in being nullable.
	 */
	static final ArchRule MONEY_NEVER_USES_FLOATING_POINT = noFields()
			.that().haveRawType(double.class)
			.or().haveRawType(float.class)
			.or().haveRawType(Double.class)
			.or().haveRawType(Float.class)
			.should().beDeclaredInClassesThat().resideInAPackage("..billing..")
			.because("mot phep nhan don gia voi so luong bang double co the ra "
					+ "203000.00000000003; sai so nay khong lam chuong trinh bao loi va "
					+ "khong nhin thay bang mat tren hoa don, chi lo ra khi doi chieu tong "
					+ "cuoi ky. Tien phai dung BigDecimal (Java) va NUMERIC(15,2) (Postgres)")
			// Empty until Vertical Slice 4 implements BR-01..BR-19. The rule stands guard
			// from Slice 0 so the first line of billing code is already covered.
			.allowEmptyShould(true);

	/**
	 * Convention 2. The calculation package stays a pure function of its arguments.
	 *
	 * <p>Breaking this does not break the build's behaviour, it breaks its testability:
	 * the moment a calculation reaches for a repository, every test of it needs a database.
	 */
	static final ArchRule BILLING_CALC_STAYS_PURE = noClasses()
			.that().resideInAPackage("..billing.calc..")
			.should().dependOnClassesThat()
			.resideInAnyPackage("org.springframework..", "jakarta.persistence..", "javax.persistence..")
			.because("billing.calc cai dat BR-01..BR-19 va phai chay duoc ma khong can "
					+ "Spring, khong can co so du lieu. Nho vay hang tram ca kiem thu cho "
					+ "phan tinh tien chay trong mili giay thay vi phai dung lai CSDL moi ca")
			.allowEmptyShould(true);

	private ArchitectureRules() {
	}
}
