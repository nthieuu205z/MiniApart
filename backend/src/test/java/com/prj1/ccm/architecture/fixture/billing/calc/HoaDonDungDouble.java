package com.prj1.ccm.architecture.fixture.billing.calc;

/**
 * Deliberately violates convention 1, so {@code ArchitectureRulesBiteTest} can prove the
 * rule catches it. Never copy this: it is a specimen, not an example.
 *
 * <p>Lives under test sources and in a package the production check excludes, so it can
 * sit here permanently without ever making the real build red.
 */
public class HoaDonDungDouble {

	/** Exactly the mistake convention 1 exists to catch. */
	private double tongTien;

	public double getTongTien() {
		return tongTien;
	}
}
