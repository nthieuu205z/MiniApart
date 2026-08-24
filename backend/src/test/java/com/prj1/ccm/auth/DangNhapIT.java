package com.prj1.ccm.auth;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

// Spring Boot 4 ships Jackson 3, whose package is tools.jackson, not com.fasterxml.
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * FR-AUT-01: signing in with a phone number and a password.
 *
 * <p>Runs against a real PostgreSQL with the real Flyway migrations, so the demo accounts
 * under test are the same rows the running system has.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class DangNhapIT {

	/** From V2__du_lieu_mau.sql. */
	private static final String SDT_QUAN_LY_TOA_A = "0900000003";
	private static final String MAT_KHAU_DUNG = "MatKhau@123";

	@Container
	@ServiceConnection
	static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

	@Autowired
	MockMvc mockMvc;

	@Autowired
	ObjectMapper objectMapper;

	@Test
	@DisplayName("FR-AUT-01: dang nhap dung thi nhan token va thong tin tai khoan")
	void dangNhapThanhCong() throws Exception {
		mockMvc.perform(dangNhap(SDT_QUAN_LY_TOA_A, MAT_KHAU_DUNG))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.token").isNotEmpty())
				.andExpect(jsonPath("$.nguoiDung.hoTen").value("Quan ly Toa A"))
				.andExpect(jsonPath("$.nguoiDung.vaiTro").value("QUAN_LY"))
				.andExpect(jsonPath("$.nguoiDung.tenVaiTro").value("Quản lý toà nhà"));
	}

	@Test
	@DisplayName("FR-AUT-01: phan hoi khong bao gio chua ma bam mat khau")
	void phanHoiKhongLoMatKhau() throws Exception {
		String than = mockMvc.perform(dangNhap(SDT_QUAN_LY_TOA_A, MAT_KHAU_DUNG))
				.andReturn().getResponse().getContentAsString();

		assertThat(than)
				.as("ma bam bcrypt bat dau bang $2 - khong duoc xuat hien trong phan hoi")
				.doesNotContain("$2")
				.doesNotContain("matKhau");
	}

	@Test
	@DisplayName("FR-AUT-01: sai mat khau va sai so dien thoai bao y het nhau")
	void haiKieuSaiKhongPhanBietDuoc() throws Exception {
		MvcResult saiMatKhau = mockMvc.perform(dangNhap(SDT_QUAN_LY_TOA_A, "SaiBet@999"))
				.andExpect(status().isUnauthorized())
				.andReturn();

		MvcResult khongCoTaiKhoan = mockMvc.perform(dangNhap("0911111111", MAT_KHAU_DUNG))
				.andExpect(status().isUnauthorized())
				.andReturn();

		// Neu hai thong bao khac nhau thi bat ky ai cung do duoc so dien thoai nao co
		// tai khoan trong he thong - voi mot khu tro, do la do duoc ai dang o day.
		assertThat(saiMatKhau.getResponse().getContentAsString())
				.isEqualTo(khongCoTaiKhoan.getResponse().getContentAsString());
	}

	@Test
	@DisplayName("FR-AUT-01: token phat ra dung duoc de goi API can xac thuc")
	void tokenDungDuocChoApiKhac() throws Exception {
		String token = layToken(SDT_QUAN_LY_TOA_A, MAT_KHAU_DUNG);

		mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.soDienThoai").value(SDT_QUAN_LY_TOA_A));
	}

	@Test
	@DisplayName("Quy uoc 3: khong co token thi API can xac thuc tra 401")
	void khongCoTokenThiBiTuChoi() throws Exception {
		mockMvc.perform(get("/api/auth/me"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	@DisplayName("Quy uoc 3: token bia dat bi tu choi")
	void tokenBiaDatBiTuChoi() throws Exception {
		mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer khong-phai-token"))
				.andExpect(status().isUnauthorized());
	}

	private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder dangNhap(
			String soDienThoai, String matKhau) throws Exception {
		return post("/api/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(
						java.util.Map.of("soDienThoai", soDienThoai, "matKhau", matKhau)));
	}

	private String layToken(String soDienThoai, String matKhau) throws Exception {
		String than = mockMvc.perform(dangNhap(soDienThoai, matKhau))
				.andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString();
		JsonNode json = objectMapper.readTree(than);
		return json.get("token").asText();
	}
}
