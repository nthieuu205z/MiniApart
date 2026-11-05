package com.prj1.ccm.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** Prevents production from starting with public development keys or a superuser application login. */
@Component
public class ProductionConfigurationGuard implements ApplicationRunner {
    private final Environment env;
    private final JdbcTemplate jdbc;
    public ProductionConfigurationGuard(Environment env, JdbcTemplate jdbc) { this.env = env; this.jdbc = jdbc; }
    @Override
    public void run(ApplicationArguments args) {
        if (!env.acceptsProfiles(Profiles.of("prod", "production"))) return;
        kiemTraKhoa(env.getProperty("app.auth.jwt-secret"), "JWT_SECRET");
        kiemTraKhoa(env.getProperty("app.anh.link-secret", env.getProperty("ANH_LINK_SECRET")), "ANH_LINK_SECRET");
        Boolean superuser = jdbc.queryForObject("SELECT rolsuper FROM pg_roles WHERE rolname=CURRENT_USER", Boolean.class);
        if (Boolean.TRUE.equals(superuser)) throw new IllegalStateException("Production phải dùng tài khoản database ứng dụng không có quyền superuser.");
    }
    private void kiemTraKhoa(String value, String name) {
        if (value == null || value.length() < 32 || value.startsWith("dev-only") || value.contains("change-me")) {
            throw new IllegalStateException(name + " phải là khoá riêng tối thiểu 32 ký tự trước khi chạy production.");
        }
    }
}
