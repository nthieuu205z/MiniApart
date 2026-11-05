package com.prj1.ccm.billing;

import com.prj1.ccm.auth.PasswordHasher;
import com.prj1.ccm.hopdong.HopDongPdfService;
import com.prj1.ccm.nguoidung.*;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.DriverManager;
import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.*;

/** Explicit local admin URL creates NEW databases only; intentionally never drops databases. */
@SpringBootTest
@org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
@ActiveProfiles("presentation-demo")
@EnabledIfEnvironmentVariable(named="MINIAPART_TEST_JDBC_URL", matches="jdbc:postgresql://.+")
class PresentationDemoSeederIntegrationTest {
    static final String DATABASE="miniapart_demo_verify_"+UUID.randomUUID().toString().replace("-", "");
    static final String PASSWORD="DemoOnly2026!";
    static final String URL=createDatabase(DATABASE);
    static final String REF=LocalDate.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh")).toString();
    @Autowired JdbcTemplate jdbc;
    @Autowired PresentationDemoSeeder seeder;
    @Autowired PasswordHasher hasher;
    @Autowired PhanQuyenToaService permissions;
    @Autowired HopDongPdfService pdf;
    @Autowired com.prj1.ccm.hopdong.NguoiOCungRepository residents;
    @Autowired org.springframework.test.web.servlet.MockMvc mvc;

    static String username() { return System.getenv().getOrDefault("MINIAPART_TEST_USERNAME","miniapart"); }
    static String password() { return System.getenv().getOrDefault("MINIAPART_TEST_PASSWORD","miniapart"); }
    static String createDatabase(String name) {
        String admin=System.getenv("MINIAPART_TEST_JDBC_URL");
        if(admin==null || !admin.startsWith("jdbc:postgresql://") || !name.matches("miniapart_demo_[a-z0-9_]+"))
            throw new IllegalStateException("Supply MINIAPART_TEST_JDBC_URL to create an isolated demo database.");
        try(var c=DriverManager.getConnection(admin,username(),password());var statement=c.createStatement()) {
            statement.executeUpdate("CREATE DATABASE \""+name+"\"");
        } catch(Exception ex) { throw new IllegalStateException("Cannot create isolated demo database",ex); }
        int query=admin.indexOf('?');
        String base=query<0?admin:admin.substring(0,query);
        return base.substring(0,base.lastIndexOf('/')+1)+name+(query<0?"":admin.substring(query));
    }
    @DynamicPropertySource static void datasource(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url",()->URL);
        r.add("spring.datasource.username",PresentationDemoSeederIntegrationTest::username);
        r.add("spring.datasource.password",PresentationDemoSeederIntegrationTest::password);
        r.add("app.seed-demo",()->false);
        r.add("app.presentation-demo.enabled",()->true);
        r.add("app.presentation-demo.expected-database",()->DATABASE);
        r.add("app.presentation-demo.reference-date",()->REF);
        r.add("app.presentation-demo.password",()->PASSWORD);
    }
    @Test void datasetHasRealLinkedScenariosAndReconciles() throws Exception {
        assertThat(count("PHONG")).isEqualTo(72);
        assertThat(count("NGUOI_THUE")).isEqualTo(96);
        assertThat(count("HOP_DONG")).isEqualTo(66);
        assertThat(count("TAI_SAN_PHONG")).isEqualTo(216);
        assertThat(count("BIEN_BAN_BAN_GIAO_TAI_SAN")).isEqualTo(48);
        assertThat(count("YEU_CAU_SUA_CHUA")).isEqualTo(30);
        assertThat(count("LICH_HEN_XEM_PHONG")).isEqualTo(30);
        assertThat(count("HOA_DON")).isBetween(240L,260L);
        assertThat(count("THANH_TOAN")).isBetween(150L,300L);
        assertZero("SELECT count(*) FROM HOA_DON i WHERE i.da_thu <> COALESCE((SELECT sum(t.so_tien) FROM THANH_TOAN t WHERE t.hoa_don_id=i.id),0)");
        assertZero("SELECT count(*) FROM HOA_DON i WHERE i.tong_tien <> COALESCE((SELECT sum(c.thanh_tien) FROM CHI_TIET_HOA_DON c WHERE c.hoa_don_id=i.id),0)");
        assertZero("SELECT count(*) FROM HOP_DONG a JOIN HOP_DONG b ON a.phong_id=b.phong_id AND a.id<b.id WHERE a.trang_thai<>'DA_THANH_LY' AND b.trang_thai<>'DA_THANH_LY' AND daterange(a.ngay_bat_dau,a.ngay_ket_thuc,'[]') && daterange(b.ngay_bat_dau,b.ngay_ket_thuc,'[]')");
        assertZero("SELECT count(*) FROM CHI_SO_DICH_VU WHERE chi_so_cuoi<chi_so_dau");
        assertZero("SELECT count(*) FROM BIEN_BAN_BAN_GIAO_TAI_SAN b JOIN HOP_DONG h ON h.id=b.hop_dong_id WHERE b.phong_id<>h.phong_id");
        assertZero("SELECT count(*) FROM CHI_TIET_BIEN_BAN_TAI_SAN c JOIN BIEN_BAN_BAN_GIAO_TAI_SAN b ON b.id=c.bien_ban_id JOIN TAI_SAN_PHONG a ON a.id=c.tai_san_id WHERE a.phong_id<>b.phong_id");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM HOP_DONG WHERE trang_thai='DA_THANH_LY'",Long.class)).isEqualTo(6);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM GIAO_DICH_COC WHERE loai='HOAN_COC'",Long.class)).isEqualTo(6);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM PHONG WHERE trang_thai='DANG_SUA'",Long.class)).isPositive();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM CHI_TIET_HOA_DON_BAC_THANG",Long.class)).isPositive();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM HOA_DON WHERE da_thu>0 AND da_thu<tong_tien",Long.class)).isPositive();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM HOA_DON WHERE da_thu=0 AND han_thanh_toan<CURRENT_DATE",Long.class)).isPositive();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM PCCC_THIET_BI WHERE han_kiem_dinh<CURRENT_DATE",Long.class)).isPositive();
        NguoiDung manager=manager();
        var visible=permissions.danhSachToaNhaNguoiDungDuocXem(manager);
        assertThat(visible).hasSize(1);
        Long other=jdbc.queryForObject("SELECT id FROM TOA_NHA WHERE ma_toa='DEMO-P2'",Long.class);
        assertThatThrownBy(()->permissions.layToaNhaNeuNhanVienDuocXem(manager,other)).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        assertThat(hasher.matches(PASSWORD,manager.matKhauHash())).isTrue();
        Long contract=jdbc.queryForObject("SELECT min(h.id) FROM HOP_DONG h JOIN PHONG p ON p.id=h.phong_id JOIN TOA_NHA t ON t.id=p.toa_nha_id WHERE t.ma_toa='DEMO-P1' AND h.trang_thai='HIEU_LUC'",Long.class);
        byte[] document=pdf.xuat(contract,manager);
        assertThat(document).startsWith((byte)'%',(byte)'P',(byte)'D',(byte)'F');
        Files.createDirectories(Path.of("build"));
        Files.write(Path.of("build/presentation-demo-contract.pdf"),document);
        StringBuilder report=new StringBuilder("database="+DATABASE+"\nreference="+REF+"\n");
        for(String table:tables()) report.append(table).append('=').append(count(table)).append('\n');
        Files.writeString(Path.of("build/presentation-demo-verification.txt"),report.toString());
    }
    @Test void repeatSeedDoesNotChangeCountsOrMoney() {
        Map<String,Long> before=new LinkedHashMap<>();
        for(String table:tables()) before.put(table,count(table));
        var total=jdbc.queryForObject("SELECT sum(so_tien) FROM THANH_TOAN",java.math.BigDecimal.class);
        seeder.run();
        for(String table:tables()) assertThat(count(table)).as(table).isEqualTo(before.get(table));
        assertThat(jdbc.queryForObject("SELECT sum(so_tien) FROM THANH_TOAN",java.math.BigDecimal.class)).isEqualByComparingTo(total);
        assertThat(org.springframework.aop.support.AopUtils.isAopProxy(seeder)).isTrue();
    }
    @Test void primaryResidencyIsNotCountedTwiceForRoomCapacity() {
        Long contract=jdbc.queryForObject("SELECT min(id) FROM HOP_DONG WHERE trang_thai='HIEU_LUC'",Long.class);
        assertThat(residents.countApprovedOccupantsInInterval(contract,LocalDate.parse(REF),null,null)).isEqualTo(1);
        Long room=jdbc.queryForObject("SELECT phong_id FROM HOP_DONG WHERE id=?",Long.class,contract);
        assertThat(residents.countByPhongIdAndNgay(room,LocalDate.parse(REF))).isEqualTo(2);
    }
    @Test void demoAccountsCanLoginAndApiScopeIsEnforced() throws Exception {
        var mapper=new tools.jackson.databind.ObjectMapper();
        String managerToken=null;
        for(String phone:List.of("0999000001","0999000011","0999000020","0999000031","0999100001")) {
            var response=mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/auth/login")
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(Map.of("soDienThoai",phone,"matKhau",PASSWORD))))
                    .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk())
                    .andReturn().getResponse();
            String token=mapper.readTree(response.getContentAsString()).path("token").asText();
            assertThat(token).isNotBlank();
            mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/auth/me").header("Authorization","Bearer "+token))
                    .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk());
            if(phone.equals("0999000020")) managerToken=token;
        }
        Long own=jdbc.queryForObject("SELECT id FROM TOA_NHA WHERE ma_toa='DEMO-P1'",Long.class);
        Long other=jdbc.queryForObject("SELECT id FROM TOA_NHA WHERE ma_toa='DEMO-P2'",Long.class);
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/toa-nha/"+own+"/phong").header("Authorization","Bearer "+managerToken))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/toa-nha/"+other+"/phong").header("Authorization","Bearer "+managerToken))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isForbidden());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/public/phong"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk());
    }
    @Test void lateFailureRollsBackTheWholeDataset() throws Exception {
        String failedName="miniapart_demo_rollback_"+UUID.randomUUID().toString().replace("-", "");
        String failedUrl=createDatabase(failedName);
        org.flywaydb.core.Flyway.configure().dataSource(failedUrl,username(),password()).load().migrate();
        var ds=new org.springframework.jdbc.datasource.DriverManagerDataSource(failedUrl,username(),password());
        JdbcTemplate failed=new JdbcTemplate(ds);
        failed.execute("CREATE FUNCTION reject_demo_appointment() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Injected late seed failure'; END $$");
        failed.execute("CREATE TRIGGER reject_demo_appointment BEFORE INSERT ON LICH_HEN_XEM_PHONG FOR EACH ROW EXECUTE FUNCTION reject_demo_appointment()");
        assertThatThrownBy(()-> {
            try(var context=new org.springframework.boot.builder.SpringApplicationBuilder(com.prj1.ccm.MiniApartApplication.class)
                    .web(org.springframework.boot.WebApplicationType.NONE).profiles("presentation-demo")
                    .run("--spring.datasource.url="+failedUrl,"--spring.datasource.username="+username(),
                            "--spring.datasource.password="+password(),"--app.seed-demo=false",
                            "--app.presentation-demo.enabled=true","--app.presentation-demo.expected-database="+failedName,
                            "--app.presentation-demo.reference-date="+REF,"--app.presentation-demo.password="+PASSWORD)) { }
        }).hasStackTraceContaining("Injected late seed failure");
        for(String table:List.of("PHONG","NGUOI_THUE","HOP_DONG","HOA_DON","THANH_TOAN","GIAO_DICH_COC","TAI_SAN_PHONG","NHAT_KY_THAO_TAC"))
            assertThat(failed.queryForObject("SELECT count(*) FROM "+table,Long.class)).as("rollback "+table).isZero();
        assertThat(failed.queryForObject("SELECT count(*) FROM TOA_NHA",Long.class)).isEqualTo(2);
    }
    static List<String> tables() { return List.of("TOA_NHA","PHONG","NGUOI_DUNG","NGUOI_THUE","HOP_DONG","HOP_DONG_HO_SO","DICH_VU","BANG_GIA","BANG_GIA_BAC_THANG","CHI_SO_DICH_VU","HOA_DON","CHI_TIET_HOA_DON","CHI_TIET_HOA_DON_BAC_THANG","THANH_TOAN","GIAO_DICH_COC","TAI_SAN_PHONG","BIEN_BAN_BAN_GIAO_TAI_SAN","YEU_CAU_SUA_CHUA","LICH_HEN_XEM_PHONG","PCCC_THIET_BI","PCCC_KIEM_TRA","NHAT_KY_THAO_TAC"); }
    long count(String table) { return jdbc.queryForObject("SELECT count(*) FROM "+table,Long.class); }
    void assertZero(String sql) { assertThat(jdbc.queryForObject(sql,Long.class)).as(sql).isZero(); }
    NguoiDung manager() { return jdbc.queryForObject("SELECT * FROM NGUOI_DUNG WHERE so_dien_thoai='0999000020'",(r,n)->new NguoiDung(r.getLong("id"),r.getString("ho_ten"),r.getString("so_dien_thoai"),r.getString("mat_khau_hash"),VaiTro.QUAN_LY,TrangThaiNguoiDung.HOAT_DONG,0,null)); }
}
