package com.prj1.ccm.auth;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class AuthenticationIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Test
    void FR_AUT_01_schemaSeedsFiveRolesTwoBuildingsAndOneManagerAssignment() {
        Integer nguoiDungCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM NGUOI_DUNG", Integer.class);
        Integer toaNhaCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM TOA_NHA", Integer.class);
        Integer phanQuyenToaCount =
                jdbcTemplate.queryForObject("SELECT COUNT(*) FROM PHAN_QUYEN_TOA", Integer.class);
        Integer vaiTroCount =
                jdbcTemplate.queryForObject("SELECT COUNT(DISTINCT vai_tro) FROM NGUOI_DUNG", Integer.class);
        Integer managerAssignments = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM PHAN_QUYEN_TOA p "
                        + "JOIN NGUOI_DUNG n ON n.id = p.nguoi_dung_id "
                        + "WHERE n.vai_tro = 'QUAN_LY'",
                Integer.class
        );

        assertThat(nguoiDungCount).isEqualTo(5);
        assertThat(toaNhaCount).isEqualTo(2);
        assertThat(phanQuyenToaCount).isEqualTo(1);
        assertThat(vaiTroCount).isEqualTo(5);
        assertThat(managerAssignments).isEqualTo(1);
    }

    @Test
    void FR_AUT_01_phoneNumberMustStayUniqueAtTheDatabaseLayer() {
        assertThatThrownBy(() -> jdbcTemplate.update(
                "INSERT INTO NGUOI_DUNG(id, ho_ten, so_dien_thoai, mat_khau_hash, vai_tro, trang_thai, "
                        + "phien_ban_token, so_lan_sai) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                99L,
                "Ban sao",
                "0900000003",
                "$2a$10$abcdefghijklmnopqrstuv",
                "THO",
                "HOAT_DONG",
                0,
                0
        )).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void FR_AUT_01_loginReturnsJwtAndCurrentUserForValidPhoneAndPassword() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"soDienThoai":"0900000003","matKhau":"MatKhau@123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", org.hamcrest.Matchers.startsWith(MediaType.APPLICATION_JSON_VALUE)))
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.thoiHanGiay").value(1800))
                .andExpect(jsonPath("$.nguoiDung.id").value(3))
                .andExpect(jsonPath("$.nguoiDung.hoTen").value("Quản lý Toà A"))
                .andExpect(jsonPath("$.nguoiDung.soDienThoai").value("0900000003"))
                .andExpect(jsonPath("$.nguoiDung.vaiTro").value("QUAN_LY"))
                .andExpect(jsonPath("$.nguoiDung.tenVaiTro").value("Quản lý toà nhà"));
    }

    @Test
    void FR_AUT_01_loginRejectsUnknownPhoneAndWrongPasswordWithTheExactSameMessage() throws Exception {
        String wrongPasswordBody = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"soDienThoai":"0900000003","matKhau":"SaiMatKhau@123"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.thongBao").value("Số điện thoại hoặc mật khẩu không đúng"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String unknownPhoneBody = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"soDienThoai":"0900999999","matKhau":"SaiMatKhau@123"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.thongBao").value("Số điện thoại hoặc mật khẩu không đúng"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        assertThat(unknownPhoneBody).isEqualTo(wrongPasswordBody);
    }

    @Test
    void FR_AUT_01_meReturnsTheCurrentUserWhenTheTokenIsValid() throws Exception {
        String token = loginAndExtractToken();

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.hoTen").value("Quản lý Toà A"))
                .andExpect(jsonPath("$.soDienThoai").value("0900000003"))
                .andExpect(jsonPath("$.vaiTro").value("QUAN_LY"))
                .andExpect(jsonPath("$.tenVaiTro").value("Quản lý toà nhà"));
    }

    @Test
    void FR_AUT_01_meReturns401WhenTheTokenVersionHasBeenRevoked() throws Exception {
        String token = loginAndExtractToken();

        jdbcTemplate.update("UPDATE NGUOI_DUNG SET phien_ban_token = phien_ban_token + 1 WHERE id = ?", 3L);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void FR_AUT_01_meReturns401WhenTheRequestHasNoToken() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    private String loginAndExtractToken() throws Exception {
        String responseBody = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"soDienThoai":"0900000003","matKhau":"MatKhau@123"}
                                """))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        int tokenValueStart = responseBody.indexOf("\"token\":\"") + 9;
        int tokenValueEnd = responseBody.indexOf('"', tokenValueStart);
        return responseBody.substring(tokenValueStart, tokenValueEnd);
    }
}
