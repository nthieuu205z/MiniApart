package com.prj1.ccm;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * MiniApart — He thong Quan ly va Van hanh Chung cu mini (PRJ1-CCM).
 *
 * <p>Module layout follows the business modules of the plan, not technical layers.
 * See {@code Doc/PRJ1_Ke-hoach-trien-khai.md} section 3.
 */
@SpringBootApplication
public class CcmApplication {

	public static void main(String[] args) {
		SpringApplication.run(CcmApplication.class, args);
	}
}
