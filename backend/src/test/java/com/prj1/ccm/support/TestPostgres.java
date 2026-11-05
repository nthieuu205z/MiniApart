package com.prj1.ccm.support;

import org.testcontainers.containers.PostgreSQLContainer;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.UUID;

/**
 * Uses Testcontainers by default. An explicitly configured local PostgreSQL creates
 * a disposable database per test class; the existing application database is never used.
 */
public final class TestPostgres extends PostgreSQLContainer<TestPostgres> {
    private final String adminUrl = System.getenv("MINIAPART_TEST_JDBC_URL");
    private String localUrl;
    private String database;
    public TestPostgres(String image) { super(image); }

    @Override
    public synchronized void start() {
        if (adminUrl == null || adminUrl.isBlank()) { super.start(); return; }
        if (localUrl != null) return;
        if (!adminUrl.startsWith("jdbc:postgresql://")) throw new IllegalArgumentException("MINIAPART_TEST_JDBC_URL phải là PostgreSQL JDBC URL quản trị.");
        database = "miniapart_test_" + UUID.randomUUID().toString().replace("-", "");
        int query = adminUrl.indexOf('?');
        String base = query < 0 ? adminUrl : adminUrl.substring(0, query);
        String options = query < 0 ? "" : adminUrl.substring(query);
        int slash = base.lastIndexOf('/');
        if (slash <= "jdbc:postgresql://".length()) throw new IllegalArgumentException("JDBC URL phải có tên database quản trị.");
        try (var conn = DriverManager.getConnection(adminUrl, getUsername(), getPassword()); var statement = conn.createStatement()) {
            statement.executeUpdate("CREATE DATABASE \"" + database + "\"");
            localUrl = base.substring(0, slash + 1) + database + options;
        } catch (SQLException ex) { throw new IllegalStateException("Không thể tạo database kiểm thử riêng.", ex); }
    }

    @Override public String getJdbcUrl() { return adminUrl == null || adminUrl.isBlank() ? super.getJdbcUrl() : localUrl; }
    @Override public String getUsername() { return adminUrl == null || adminUrl.isBlank() ? super.getUsername() : env("MINIAPART_TEST_USERNAME", "miniapart"); }
    @Override public String getPassword() { return adminUrl == null || adminUrl.isBlank() ? super.getPassword() : env("MINIAPART_TEST_PASSWORD", "miniapart"); }

    @Override
    public synchronized void stop() {
        if (adminUrl == null || adminUrl.isBlank()) { super.stop(); return; }
        if (localUrl == null) return;
        if (database == null || !database.matches("miniapart_test_[a-f0-9]{32}")) throw new IllegalStateException("Từ chối xoá database ngoài phạm vi kiểm thử.");
        try (var conn = DriverManager.getConnection(adminUrl, getUsername(), getPassword()); var statement = conn.createStatement()) {
            statement.executeUpdate("DROP DATABASE \"" + database + "\" WITH (FORCE)");
            localUrl = null;
        } catch (SQLException ex) { throw new IllegalStateException("Không thể dọn database kiểm thử " + database, ex); }
    }
    private String env(String key, String fallback) { String value = System.getenv(key); return value == null ? fallback : value; }
}
