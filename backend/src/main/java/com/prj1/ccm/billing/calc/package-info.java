/**
 * The billing rules BR-01 to BR-19: the heart of the project.
 *
 * <p>Two constraints hold here, both enforced by ArchUnit rather than by memory:
 *
 * <ul>
 *   <li>No money ever touches {@code double} or {@code float}. A single floating-point
 *       multiplication of unit price by quantity can yield 203000.00000000003, which no
 *       one spots by eye on an invoice and which only surfaces when the period totals are
 *       reconciled - by then the wrong amounts have already been billed to real tenants.
 *   <li>Nothing here depends on Spring, JPA, or the database. Values come in as arguments
 *       and results go out as return values; nothing is read or written. That is what lets
 *       hundreds of test cases run in milliseconds instead of standing up a database each time.
 * </ul>
 *
 * <p>Empty until Vertical Slice 4, which is where the rules are actually implemented.
 * The package exists from Slice 0 so the guard rails are armed before there is anything
 * to guard.
 */
package com.prj1.ccm.billing.calc;
