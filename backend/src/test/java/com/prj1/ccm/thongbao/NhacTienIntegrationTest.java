package com.prj1.ccm.thongbao;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Import(NhacTienIntegrationTest.FixedClockConfiguration.class)
class NhacTienIntegrationTest {
    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @BeforeEach
    void resetDatabase() {
        xoaNeuBangTonTai("NHAT_KY_NHAC_TIEN");
        xoaNeuBangTonTai("NHAC_TIEN_MOC");
        jdbcTemplate.execute("DROP TRIGGER IF EXISTS trg_fail_nhac_tien ON THONG_BAO");
        jdbcTemplate.execute("DROP FUNCTION IF EXISTS fail_nhac_tien_insert()");
        jdbcTemplate.update("DELETE FROM THONG_BAO");
        jdbcTemplate.update("DELETE FROM ANH_DINH_KEM");
        jdbcTemplate.update("DELETE FROM SO_DU_KHA_DUNG");
        jdbcTemplate.update("DELETE FROM THANH_TOAN");
        jdbcTemplate.update("DELETE FROM CHI_TIET_HOA_DON_BAC_THANG");
        jdbcTemplate.update("DELETE FROM CHI_TIET_HOA_DON");
        jdbcTemplate.update("DELETE FROM HOA_DON");
        jdbcTemplate.update("DELETE FROM HOP_DONG_DICH_VU");
        jdbcTemplate.update("DELETE FROM HOP_DONG");
        jdbcTemplate.update("DELETE FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id > 5");
        jdbcTemplate.update("UPDATE NGUOI_DUNG SET nguoi_thue_id = NULL WHERE nguoi_thue_id IS NOT NULL");
        jdbcTemplate.update("DELETE FROM NGUOI_THUE");
        jdbcTemplate.update("DELETE FROM NGUOI_DUNG WHERE id > 5");
        jdbcTemplate.update("DELETE FROM PHONG");
        jdbcTemplate.update("DELETE FROM KY_THANH_TOAN");
        jdbcTemplate.update("DELETE FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id IN (2, 3, 4, 5)");
        jdbcTemplate.update(
                "UPDATE NGUOI_DUNG SET phien_ban_token = 0, so_lan_sai = 0, lan_sai_dau_tien = NULL, khoa_den = NULL, trang_thai = 'HOAT_DONG' WHERE id IN (1, 2, 3, 4, 5)"
        );
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (2, 1), (3, 1)");
    }

    @AfterEach
    void removeFailureTrigger() {
        jdbcTemplate.execute("DROP TRIGGER IF EXISTS trg_fail_nhac_tien ON THONG_BAO");
        jdbcTemplate.execute("DROP FUNCTION IF EXISTS fail_nhac_tien_insert()");
    }

    @Test
    void FR_NTF_04_FR_NTF_05_FR_NTF_07_sendsExactMilestonesAndManagersAtPlusFive() {
        Long hoaDonId = taoHoaDon("TN-A-101-202609", LocalDate.of(2026, 9, 10), "DA_PHAT_HANH");
        Long quanLyThuHaiId = taoQuanLyThuHai();
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (?, 1)", quanLyThuHaiId);

        xuLyKhongThamSo();
        assertThat(mocDaGui(hoaDonId)).containsExactly(-3);
        assertThat(nguoiNhanCuaThongBao(hoaDonId)).containsExactly(5L);

        xuLy(LocalDate.of(2026, 9, 11));
        assertThat(mocDaGuiCuaNguoiNhan(hoaDonId, 5L)).containsExactly(-3, 1);

        xuLy(LocalDate.of(2026, 9, 15));
        assertThat(mocDaGuiCuaNguoiNhan(hoaDonId, 5L)).containsExactly(-3, 1, 5);
        assertThat(mocDaGuiCuaNguoiNhan(hoaDonId, quanLyThuHaiId)).containsExactly(5);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM THONG_BAO WHERE doi_tuong_loai = 'HOA_DON' AND doi_tuong_id = ?",
                Integer.class,
                hoaDonId
        )).isEqualTo(5);
    }

    @Test
    void FR_NTF_04_skipsDraftCancelledAndFullyPaidInvoicesUsingLedger() {
        Long nhapId = taoHoaDon("TN-A-101-202610", LocalDate.of(2026, 10, 10), "NHAP");
        Long huyId = taoHoaDon("TN-A-101-202611", LocalDate.of(2026, 11, 10), "DA_HUY");
        Long daThanhToanId = taoHoaDon("TN-A-101-202612", LocalDate.of(2026, 12, 10), "DA_PHAT_HANH");
        jdbcTemplate.update(
                "INSERT INTO THANH_TOAN (hoa_don_id, so_tien, loai, hinh_thuc, ngay_thu, nguoi_thu_id) VALUES (?, ?, 'THU', 'TIEN_MAT', ?, 3)",
                daThanhToanId,
                new BigDecimal("100.00"),
                java.sql.Date.valueOf("2026-09-01")
        );

        xuLy(LocalDate.of(2026, 12, 7));

        assertThat(soThongBao(nhapId)).isZero();
        assertThat(soThongBao(huyId)).isZero();
        assertThat(soThongBao(daThanhToanId)).isZero();
    }

    @Test
    void FR_NTF_05_paymentCommitBeforeReminderReReadsLockedLedgerAndSkipsFutureReminder() throws Exception {
        Long hoaDonId = taoHoaDon("TN-A-101-202609", LocalDate.of(2026, 9, 10), "DA_PHAT_HANH");
        TransactionTemplate paymentTransaction = new TransactionTemplate(transactionManager);
        CountDownLatch paymentLockedInvoice = new CountDownLatch(1);
        CountDownLatch allowPaymentCommit = new CountDownLatch(1);
        ExecutorService workers = Executors.newFixedThreadPool(2);
        try {
            Future<?> payment = workers.submit(() -> paymentTransaction.executeWithoutResult(status -> {
                jdbcTemplate.queryForObject("SELECT id FROM HOA_DON WHERE id = ? FOR UPDATE", Long.class, hoaDonId);
                paymentLockedInvoice.countDown();
                await(allowPaymentCommit);
                ghiThanhToan(hoaDonId, new BigDecimal("100.00"));
            }));
            assertThat(paymentLockedInvoice.await(10, TimeUnit.SECONDS)).isTrue();

            Future<?> reminder = workers.submit(() -> xuLy(LocalDate.of(2026, 9, 11)));
            allowPaymentCommit.countDown();
            payment.get(20, TimeUnit.SECONDS);
            reminder.get(20, TimeUnit.SECONDS);
        } finally {
            workers.shutdownNow();
        }

        assertThat(soThongBao(hoaDonId)).isZero();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(so_tien), 0.00) FROM THANH_TOAN WHERE hoa_don_id = ?",
                BigDecimal.class,
                hoaDonId
        )).isEqualByComparingTo("100.00");
    }

    @Test
    void FR_NTF_04_FR_NTF_05_FR_NTF_07_rerunAndConcurrentWorkersCreateOneStatePerRecipientAndMilestone() throws Exception {
        Long hoaDonId = taoHoaDon("TN-A-101-202609", LocalDate.of(2026, 9, 10), "DA_PHAT_HANH");
        Long quanLyThuHaiId = taoQuanLyThuHai();
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (?, 1)", quanLyThuHaiId);

        xuLy(LocalDate.of(2026, 9, 15));
        xuLy(LocalDate.of(2026, 9, 15));

        ExecutorService workers = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        try {
            Future<?> first = workers.submit(() -> xuLySauTinHieu(start, LocalDate.of(2026, 9, 15)));
            Future<?> second = workers.submit(() -> xuLySauTinHieu(start, LocalDate.of(2026, 9, 15)));
            start.countDown();
            first.get(20, TimeUnit.SECONDS);
            second.get(20, TimeUnit.SECONDS);
        } finally {
            workers.shutdownNow();
        }

        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM THONG_BAO WHERE doi_tuong_loai = 'HOA_DON' AND doi_tuong_id = ?",
                Integer.class,
                hoaDonId
        )).isEqualTo(3);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM NHAC_TIEN_MOC WHERE hoa_don_id = ?",
                Integer.class,
                hoaDonId
        )).isEqualTo(3);
        assertThat(mocDaGuiCuaNguoiNhan(hoaDonId, quanLyThuHaiId)).containsExactly(5);
    }

    @Test
    void FR_NTF_05_paymentBeforeReminderAndAvailableBalanceDoNotReopenSentMilestoneButOffsetAllowsLaterOne() {
        Long paidBeforeId = taoHoaDon("TN-A-101-202609", LocalDate.of(2026, 9, 10), "DA_PHAT_HANH");
        ghiThanhToan(paidBeforeId, new BigDecimal("100.00"));
        xuLy(LocalDate.of(2026, 9, 11));
        assertThat(soThongBao(paidBeforeId)).isZero();

        Long balanceOnlyId = taoHoaDon("TN-A-101-202611", LocalDate.of(2026, 11, 10), "DA_PHAT_HANH");
        jdbcTemplate.update(
                "INSERT INTO SO_DU_KHA_DUNG (hop_dong_id, so_tien, nguon_hoa_don_id, ngay_phat_sinh) SELECT hop_dong_id, 25.00, ?, DATE '2026-11-08' FROM HOA_DON WHERE id = ?",
                balanceOnlyId,
                balanceOnlyId
        );
        xuLy(LocalDate.of(2026, 11, 11));
        assertThat(mocDaGuiCuaNguoiNhan(balanceOnlyId, 5L)).containsExactly(1);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM SO_DU_KHA_DUNG WHERE nguon_hoa_don_id = ? AND hoa_don_su_dung_id IS NULL",
                Integer.class,
                balanceOnlyId
        )).isEqualTo(1);

        Long hoaDonId = taoHoaDon("TN-A-101-202610", LocalDate.of(2026, 10, 10), "DA_PHAT_HANH");
        xuLy(LocalDate.of(2026, 10, 7));
        ghiThanhToan(hoaDonId, new BigDecimal("100.00"));
        jdbcTemplate.update(
                "INSERT INTO SO_DU_KHA_DUNG (hop_dong_id, so_tien, nguon_hoa_don_id, ngay_phat_sinh) SELECT hop_dong_id, 25.00, ?, DATE '2026-10-08' FROM HOA_DON WHERE id = ?",
                hoaDonId,
                hoaDonId
        );
        xuLy(LocalDate.of(2026, 10, 11));
        assertThat(mocDaGuiCuaNguoiNhan(hoaDonId, 5L)).containsExactly(-3);

        jdbcTemplate.update(
                "INSERT INTO THANH_TOAN (hoa_don_id, so_tien, loai, dieu_chinh_cho_id, ly_do, nguoi_thu_id) SELECT ?, -100.00, 'DOI_UNG', id, 'Hoan tra de tao lai cong no', 3 FROM THANH_TOAN WHERE hoa_don_id = ? AND loai = 'THU'",
                hoaDonId,
                hoaDonId
        );
        xuLy(LocalDate.of(2026, 10, 15));
        assertThat(mocDaGuiCuaNguoiNhan(hoaDonId, 5L)).containsExactly(-3, 5);
        assertThat(mocDaGuiCuaNguoiNhan(hoaDonId, 3L)).containsExactly(5);
        assertThat(soThongBao(hoaDonId)).isEqualTo(3);
    }

    @Test
    void FR_NTF_07_downtimeSelectsOnlyNearestDueMilestoneAndDoesNotRepeatIt() {
        Long hoaDonId = taoHoaDon("TN-A-101-202609", LocalDate.of(2026, 9, 10), "DA_PHAT_HANH");

        xuLy(LocalDate.of(2026, 9, 20));
        assertThat(mocDaGuiCuaNguoiNhan(hoaDonId, 5L)).as("first downtime processing").containsExactly(5);
        xuLy(LocalDate.of(2026, 9, 20));

        assertThat(mocDaGuiCuaNguoiNhan(hoaDonId, 5L)).containsExactly(5);
        assertThat(mocDaGuiCuaNguoiNhan(hoaDonId, 3L)).containsExactly(5);
        assertThat(soThongBao(hoaDonId)).isEqualTo(2);
    }

    @Test
    void FR_NTF_04_withoutActiveTenantAccountDoesNotInventTenantNotification() {
        Long hoaDonId = taoHoaDon("TN-A-101-202609", LocalDate.of(2026, 9, 10), "DA_PHAT_HANH");
        jdbcTemplate.update("UPDATE NGUOI_DUNG SET nguoi_thue_id = NULL WHERE id = 5");

        xuLy(LocalDate.of(2026, 9, 15));

        assertThat(nguoiNhanCuaThongBao(hoaDonId)).containsExactly(3L);
        assertThat(mocDaGuiCuaNguoiNhan(hoaDonId, 5L)).isEmpty();
        assertThat(mocDaGuiCuaNguoiNhan(hoaDonId, 3L)).containsExactly(5);
    }

    @Test
    void FR_NTF_07_recordsFailureAndRetriesThroughTheRealProcessorEntryPoint() {
        Long hoaDonId = taoHoaDon("TN-A-101-202609", LocalDate.of(2026, 9, 10), "DA_PHAT_HANH");
        jdbcTemplate.execute("""
                CREATE OR REPLACE FUNCTION fail_nhac_tien_insert() RETURNS trigger
                LANGUAGE plpgsql AS $$
                BEGIN
                    RAISE EXCEPTION 'forced reminder failure';
                END;
                $$
                """);
        jdbcTemplate.execute("""
                CREATE TRIGGER trg_fail_nhac_tien
                BEFORE INSERT ON THONG_BAO
                FOR EACH ROW EXECUTE FUNCTION fail_nhac_tien_insert()
                """);

        assertThatCode(() -> xuLy(LocalDate.of(2026, 9, 11))).doesNotThrowAnyException();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM NHAT_KY_NHAC_TIEN WHERE hoa_don_id = ? AND trang_thai = 'THAT_BAI'",
                Integer.class,
                hoaDonId
        )).isEqualTo(1);
        assertThat(soThongBao(hoaDonId)).isZero();

        jdbcTemplate.execute("DROP TRIGGER trg_fail_nhac_tien ON THONG_BAO");
        jdbcTemplate.execute("DROP FUNCTION fail_nhac_tien_insert()");
        xuLy(LocalDate.of(2026, 9, 11));

        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM NHAT_KY_NHAC_TIEN WHERE hoa_don_id = ? AND trang_thai = 'THANH_CONG'",
                Integer.class,
                hoaDonId
        )).isEqualTo(1);
        assertThat(soThongBao(hoaDonId)).isEqualTo(1);
    }

    private void xuLy(LocalDate ngayNghiepVu) {
        invoke("xuLy", new Class<?>[]{LocalDate.class}, ngayNghiepVu);
    }

    private void xuLyKhongThamSo() {
        invoke("xuLy", new Class<?>[0]);
    }

    private void xuLySauTinHieu(CountDownLatch start, LocalDate ngayNghiepVu) {
        try {
            start.await();
            xuLy(ngayNghiepVu);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(exception);
        }
    }

    private void await(CountDownLatch latch) {
        try {
            if (!latch.await(10, TimeUnit.SECONDS)) {
                throw new IllegalStateException("Timed out waiting for payment test transaction");
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(exception);
        }
    }

    private void invoke(String methodName, Class<?>[] parameterTypes, Object... arguments) {
        assertThat(applicationContext.containsBean("nhacTienService"))
                .as("deterministic reminder processor bean must exist")
                .isTrue();
        Object service = applicationContext.getBean("nhacTienService");
        try {
            Method method = service.getClass().getMethod(methodName, parameterTypes);
            method.invoke(service, arguments);
        } catch (InvocationTargetException exception) {
            Throwable cause = exception.getCause();
            if (cause instanceof RuntimeException runtimeException) {
                throw runtimeException;
            }
            throw new IllegalStateException(cause);
        } catch (ReflectiveOperationException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private Long taoHoaDon(String maHoaDon, LocalDate hanThanhToan, String trangThai) {
        String digits = maHoaDon.replaceAll("\\D", "");
        Long phongId = jdbcTemplate.queryForObject(
                "INSERT INTO PHONG (toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai) VALUES (1, ?, 1, 25.00, 4, 3500000.00, 'Studio', 'DANG_THUE') RETURNING id",
                Long.class,
                digits.substring(0, 3) + digits.substring(digits.length() - 2)
        );
        Long nguoiThueId = jdbcTemplate.queryForObject(
                "INSERT INTO NGUOI_THUE (ho_ten, ngay_sinh, so_dien_thoai, so_giay_to, que_quan) VALUES (?, DATE '1990-01-01', ?, ?, 'Ha Noi') RETURNING id",
                Long.class,
                "Nguoi thue " + maHoaDon,
                "0905" + digits,
                "CC" + digits
        );
        Long hopDongId = jdbcTemplate.queryForObject(
                "INSERT INTO HOP_DONG (phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai) VALUES (?, ?, DATE '2026-01-01', DATE '2026-12-31', 3500000.00, 3500000.00, 30, 'HIEU_LUC') RETURNING id",
                Long.class,
                phongId,
                nguoiThueId
        );
        jdbcTemplate.update("UPDATE NGUOI_DUNG SET nguoi_thue_id = ? WHERE id = 5", nguoiThueId);
        Long kyId = jdbcTemplate.queryForObject(
                "INSERT INTO KY_THANH_TOAN (toa_nha_id, nam, thang, ngay_bat_dau, ngay_ket_thuc, trang_thai) VALUES (1, 2026, ?, ?, ?, 'DA_CHOT') RETURNING id",
                Long.class,
                hanThanhToan.getMonthValue(),
                java.sql.Date.valueOf(hanThanhToan.minusDays(40)),
                java.sql.Date.valueOf(hanThanhToan.minusDays(10))
        );
        return jdbcTemplate.queryForObject(
                "INSERT INTO HOA_DON (ma_hoa_don, ky_id, hop_dong_id, ngay_phat_hanh, han_thanh_toan, tong_tien, da_thu, trang_thai) VALUES (?, ?, ?, ?, ?, 100.00, 0.00, ?) RETURNING id",
                Long.class,
                maHoaDon,
                kyId,
                hopDongId,
                java.sql.Date.valueOf(hanThanhToan.minusDays(20)),
                java.sql.Date.valueOf(hanThanhToan),
                trangThai
        );
    }

    private Long taoQuanLyThuHai() {
        return jdbcTemplate.queryForObject(
                "INSERT INTO NGUOI_DUNG (ho_ten, so_dien_thoai, mat_khau_hash, vai_tro, trang_thai) VALUES ('Quan ly Toa A hai', '0900000099', 'test', 'QUAN_LY', 'HOAT_DONG') RETURNING id",
                Long.class
        );
    }

    private void ghiThanhToan(Long hoaDonId, BigDecimal soTien) {
        jdbcTemplate.update(
                "INSERT INTO THANH_TOAN (hoa_don_id, so_tien, loai, hinh_thuc, ngay_thu, nguoi_thu_id) VALUES (?, ?, 'THU', 'TIEN_MAT', DATE '2026-09-01', 3)",
                hoaDonId,
                soTien
        );
    }

    private List<Integer> mocDaGui(Long hoaDonId) {
        return jdbcTemplate.queryForList(
                "SELECT moc_ngay FROM NHAC_TIEN_MOC WHERE hoa_don_id = ? ORDER BY moc_ngay, nguoi_nhan_id",
                Integer.class,
                hoaDonId
        );
    }

    private List<Integer> mocDaGuiCuaNguoiNhan(Long hoaDonId, Long nguoiNhanId) {
        return jdbcTemplate.queryForList(
                "SELECT moc_ngay FROM NHAC_TIEN_MOC WHERE hoa_don_id = ? AND nguoi_nhan_id = ? ORDER BY moc_ngay",
                Integer.class,
                hoaDonId,
                nguoiNhanId
        );
    }

    private List<Long> nguoiNhanCuaThongBao(Long hoaDonId) {
        return jdbcTemplate.queryForList(
                "SELECT nguoi_nhan_id FROM THONG_BAO WHERE doi_tuong_loai = 'HOA_DON' AND doi_tuong_id = ? ORDER BY nguoi_nhan_id",
                Long.class,
                hoaDonId
        );
    }

    private int soThongBao(Long hoaDonId) {
        return jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM THONG_BAO WHERE doi_tuong_loai = 'HOA_DON' AND doi_tuong_id = ?",
                Integer.class,
                hoaDonId
        );
    }

    private void xoaNeuBangTonTai(String tenBang) {
        Boolean tonTai = jdbcTemplate.queryForObject(
                "SELECT to_regclass(?) IS NOT NULL",
                Boolean.class,
                tenBang.toLowerCase()
        );
        if (Boolean.TRUE.equals(tonTai)) {
            jdbcTemplate.update("DELETE FROM " + tenBang);
        }
    }

    @TestConfiguration
    static class FixedClockConfiguration {
        @Bean
        @Primary
        Clock fixedClock() {
            return Clock.fixed(Instant.parse("2026-09-06T17:00:00Z"), ZoneOffset.UTC);
        }
    }
}
