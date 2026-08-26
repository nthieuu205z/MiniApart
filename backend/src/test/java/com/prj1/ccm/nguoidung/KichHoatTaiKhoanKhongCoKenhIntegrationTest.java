package com.prj1.ccm.nguoidung;

import com.prj1.ccm.auth.PasswordHasher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class KichHoatTaiKhoanKhongCoKenhIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordHasher passwordHasher;

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @BeforeEach
    void resetDatabaseState() {
        jdbcTemplate.update("DELETE FROM LAN_DANG_NHAP_SAI");
        jdbcTemplate.update("DELETE FROM THEO_DOI_DANG_NHAP");
        jdbcTemplate.update("DELETE FROM KICH_HOAT_TAI_KHOAN");
        jdbcTemplate.update("DELETE FROM PHAN_QUYEN_TOA");
        jdbcTemplate.update("DELETE FROM NGUOI_DUNG");
        jdbcTemplate.update(
                """
                        INSERT INTO NGUOI_DUNG(
                            id, ho_ten, so_dien_thoai, mat_khau_hash, vai_tro, trang_thai,
                            phien_ban_token, so_lan_sai, lan_sai_dau_tien, khoa_den
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                1L, "Quản trị hệ thống", "0900000001", passwordHasher.hash("mat-khau-quan-tri"),
                "QTHT", "HOAT_DONG", 0, 0, null, null
        );
    }

    @Test
    void FR_AUT_06_taoTaiKhoanKhongCoKenhKichHoatThatBaiVaHoanTacGiaoDich() throws Exception {
        String soDienThoai = "0901" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);

        mockMvc.perform(post("/api/nguoi-dung")
                        .header("Authorization", "Bearer " + tokenQuanTri())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "hoTen": "Không có kênh kích hoạt",
                                  "soDienThoai": "%s",
                                  "vaiTro": "THO",
                                  "toaNhaIds": [1]
                                }
                                """.formatted(soDienThoai)))
                .andExpect(status().isServiceUnavailable());

        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM NGUOI_DUNG WHERE so_dien_thoai = ?",
                Integer.class,
                soDienThoai
        )).isZero();
    }

    private String tokenQuanTri() throws Exception {
        String responseBody = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"soDienThoai\":\"0900000001\",\"matKhau\":\"mat-khau-quan-tri\"}"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        int tokenValueStart = responseBody.indexOf("\"token\":\"") + 9;
        int tokenValueEnd = responseBody.indexOf('"', tokenValueStart);
        return responseBody.substring(tokenValueStart, tokenValueEnd);
    }
}
