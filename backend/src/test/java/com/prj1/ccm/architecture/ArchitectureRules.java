package com.prj1.ccm.architecture;

import com.tngtech.archunit.base.DescribedPredicate;
import com.tngtech.archunit.core.domain.JavaCodeUnit;
import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.domain.JavaField;
import com.tngtech.archunit.core.domain.JavaMember;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noMembers;

final class ArchitectureRules {
    private static final String BILLING_PACKAGE = "..billing..";
    private static final String BILLING_CALC_PACKAGE = "..billing.calc..";
    private static final String MONEY_RULE_REASON =
            "mot phep nhan don gia voi so luong bang double co the ra 203000.00000000003; "
                    + "sai so nay khong lam chuong trinh bao loi va khong nhin thay bang mat tren hoa don, "
                    + "chi lo ra khi doi chieu tong cuoi ky. Tien phai dung BigDecimal (Java) va NUMERIC(15,2) (Postgres)";
    private static final String BILLING_CALC_RULE_REASON =
            "billing.calc cai dat BR-01..BR-19 va phai chay duoc ma khong can Spring, khong can co so du lieu";

    private ArchitectureRules() {
    }

    static ArchRule noFloatingPointInBilling() {
        return noMembers()
                .that(haveFloatingPointType())
                .should().beDeclaredInClassesThat().resideInAPackage(BILLING_PACKAGE)
                .because(MONEY_RULE_REASON)
                .allowEmptyShould(true);
    }

    private static DescribedPredicate<JavaMember> haveFloatingPointType() {
        return new DescribedPredicate<>("have a floating-point field, return type, or parameter") {
            @Override
            public boolean test(JavaMember member) {
                if (member instanceof JavaField field) {
                    return isFloatingPoint(field.getRawType());
                }
                if (member instanceof JavaCodeUnit codeUnit) {
                    return isFloatingPoint(codeUnit.getRawReturnType())
                            || codeUnit.getRawParameterTypes().stream().anyMatch(ArchitectureRules::isFloatingPoint);
                }
                return false;
            }
        };
    }

    private static boolean isFloatingPoint(JavaClass type) {
        return type.isEquivalentTo(double.class)
                || type.isEquivalentTo(float.class)
                || type.isEquivalentTo(Double.class)
                || type.isEquivalentTo(Float.class);
    }

    static ArchRule billingCalculationMustBeFrameworkFree() {
        return noClasses()
                .that().resideInAPackage(BILLING_CALC_PACKAGE)
                .should().dependOnClassesThat()
                .resideInAnyPackage(
                        "org.springframework..",
                        "jakarta.persistence..",
                        "javax.persistence.."
                )
                .because(BILLING_CALC_RULE_REASON)
                .allowEmptyShould(true);
    }
}
