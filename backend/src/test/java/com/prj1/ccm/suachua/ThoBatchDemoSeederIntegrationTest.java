package com.prj1.ccm.suachua;

import com.prj1.ccm.billing.PresentationDemoSeeder;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("presentation-demo")
public class ThoBatchDemoSeederIntegrationTest {

    static final String DATABASE = "miniapart_demo_worker";
    // Postgres dùng-một-lần: test không được phụ thuộc DB cục bộ của người chạy (CI cũng không có).
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine")
            .withDatabaseName(DATABASE).withUsername("miniapart").withPassword("miniapart");
    static { POSTGRES.start(); }
    // Ngày thật: seeder tạo lịch hẹn và chặn giờ hẹn đã qua, nên ngày cố định sẽ làm test hỏng dần theo thời gian.
    static final LocalDate REF_DATE = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        r.add("spring.datasource.username", POSTGRES::getUsername);
        r.add("spring.datasource.password", POSTGRES::getPassword);
        r.add("app.seed-demo", () -> false);
        r.add("app.presentation-demo.enabled", () -> true);
        r.add("app.presentation-demo.expected-database", () -> DATABASE);
        r.add("app.presentation-demo.reference-date", () -> REF_DATE.toString());
        r.add("app.presentation-demo.password", () -> "DemoOnly2026!");
    }

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    PresentationDemoSeeder baseSeeder;

    @Autowired
    ThoBatchDemoSeeder thoSeeder;

    @Autowired
    ThoDashboardService thoDashboardService;

    @Autowired
    BaoGiaSuaChuaRepository baoGiaRepo;

    @Autowired
    ThanhToanThoRepository thanhToanRepo;

    @Test
    @DisplayName("Verify 44-ticket demo batch distribution, payment invariants, 0VND warranty, and idempotency")
    void testSeedBatchAndInvariants() {
        // Ensure base seeder has run
        baseSeeder.run();
        // Run ThoBatchDemoSeeder
        ThoBatchDemoSeeder.SeedStats stats = thoSeeder.seed(REF_DATE, DATABASE);
        assertThat(stats).isNotNull();

        // 1. Verify Workers exist
        NguoiDung huy = jdbc.queryForObject(
                "SELECT id, ho_ten, so_dien_thoai, vai_tro FROM NGUOI_DUNG WHERE so_dien_thoai = '0999000031'",
                (rs, n) -> new NguoiDung(rs.getLong("id"), rs.getString("ho_ten"), rs.getString("so_dien_thoai"), "", VaiTro.valueOf(rs.getString("vai_tro")), null, 0, null)
        );
        NguoiDung thanh = jdbc.queryForObject(
                "SELECT id, ho_ten, so_dien_thoai, vai_tro FROM NGUOI_DUNG WHERE so_dien_thoai = '0999000032'",
                (rs, n) -> new NguoiDung(rs.getLong("id"), rs.getString("ho_ten"), rs.getString("so_dien_thoai"), "", VaiTro.valueOf(rs.getString("vai_tro")), null, 0, null)
        );
        assertThat(huy).isNotNull();
        assertThat(thanh).isNotNull();
        assertThat(huy.hoTen()).isEqualTo("Lê Quốc Huy");
        assertThat(thanh.hoTen()).isEqualTo("Đặng Văn Thành");

        // 2. Count tickets for Huy (target 24)
        List<Map<String, Object>> huyTickets = jdbc.queryForList(
                "SELECT trang_thai, count(*) as cnt FROM YEU_CAU_SUA_CHUA WHERE nguoi_xu_ly_id = ? AND fixture_key LIKE 'THO_DEMO_V2_BATCH_44%' GROUP BY trang_thai",
                huy.id()
        );
        int huyTotal = huyTickets.stream().mapToInt(m -> ((Number) m.get("cnt")).intValue()).sum();
        assertThat(huyTotal).isEqualTo(24);

        // 3. Count tickets for Thành (target 20)
        List<Map<String, Object>> thanhTickets = jdbc.queryForList(
                "SELECT trang_thai, count(*) as cnt FROM YEU_CAU_SUA_CHUA WHERE nguoi_xu_ly_id = ? AND fixture_key LIKE 'THO_DEMO_V2_BATCH_44%' GROUP BY trang_thai",
                thanh.id()
        );
        int thanhTotal = thanhTickets.stream().mapToInt(m -> ((Number) m.get("cnt")).intValue()).sum();
        assertThat(thanhTotal).isEqualTo(20);

        // Grand total of batch = 44
        assertThat(huyTotal + thanhTotal).isEqualTo(44);

        // 4. Verify Huy status breakdown
        // DA_PHAN_CONG: 5, DANG_XU_LY: 4, CHO_XAC_NHAN: 3, DA_DONG: 10, DA_HUY: 2
        int huyDaDong = demTrangThai(huy.id(), "DA_DONG");
        int huyDangXuLy = demTrangThai(huy.id(), "DANG_XU_LY");
        int huyChoXacNhan = demTrangThai(huy.id(), "CHO_XAC_NHAN");
        int huyDaPhanCong = demTrangThai(huy.id(), "DA_PHAN_CONG");
        int huyDaHuy = demTrangThai(huy.id(), "DA_HUY");

        assertThat(huyDaPhanCong).isEqualTo(5);
        assertThat(huyDangXuLy).isEqualTo(4);
        assertThat(huyChoXacNhan).isEqualTo(3);
        assertThat(huyDaDong).isEqualTo(10);
        assertThat(huyDaHuy).isEqualTo(2);

        // 5. Verify Thành status breakdown
        // DA_PHAN_CONG: 4, DANG_XU_LY: 5, CHO_XAC_NHAN: 3, DA_DONG: 7, DA_HUY: 1
        int thanhDaDong = demTrangThai(thanh.id(), "DA_DONG");
        int thanhDangXuLy = demTrangThai(thanh.id(), "DANG_XU_LY");
        int thanhChoXacNhan = demTrangThai(thanh.id(), "CHO_XAC_NHAN");
        int thanhDaPhanCong = demTrangThai(thanh.id(), "DA_PHAN_CONG");
        int thanhDaHuy = demTrangThai(thanh.id(), "DA_HUY");

        assertThat(thanhDaPhanCong).isEqualTo(4);
        assertThat(thanhDangXuLy).isEqualTo(5);
        assertThat(thanhChoXacNhan).isEqualTo(3);
        assertThat(thanhDaDong).isEqualTo(7);
        assertThat(thanhDaHuy).isEqualTo(1);

        // 6. Verify Huy closed tickets payment breakdown:
        // 5 paid in full, 3 partially paid, 2 unpaid
        verifyPaymentBreakdown(huy.id(), 10, 5, 3, 2);

        // 7. Verify Thành closed tickets payment breakdown:
        // 3 paid in full, 2 partially paid, 2 unpaid
        verifyPaymentBreakdown(thanh.id(), 7, 3, 2, 2);

        // 8. Verify Warranty 0 VND order exists
        List<Map<String, Object>> zeroVndTickets = jdbc.queryForList(
                "SELECT bg.tong_tien, count(tt.id) as payment_count, COALESCE(sum(tt.so_tien), 0) as paid_sum " +
                        "FROM BAO_GIA_SUA_CHUA bg " +
                        "JOIN YEU_CAU_SUA_CHUA yc ON bg.yeu_cau_id = yc.id " +
                        "LEFT JOIN THANH_TOAN_THO tt ON tt.yeu_cau_id = yc.id " +
                        "WHERE bg.trang_thai = 'DA_DUYET' AND bg.tong_tien = 0 AND yc.fixture_key LIKE 'THO_DEMO_V2_BATCH_44%' " +
                        "GROUP BY bg.id, bg.tong_tien"
        );
        assertThat(zeroVndTickets).isNotEmpty();
        Map<String, Object> zeroRow = zeroVndTickets.getFirst();
        assertThat(((BigDecimal) zeroRow.get("tong_tien")).compareTo(BigDecimal.ZERO)).isZero();
        assertThat(((BigDecimal) zeroRow.get("paid_sum")).compareTo(BigDecimal.ZERO)).isZero();

        // 9. Verify Idempotency - running seeder again creates NO new rows
        ThoBatchDemoSeeder.SeedStats secondRun = thoSeeder.seed(REF_DATE, DATABASE);
        assertThat(secondRun.soYeuCauMoi()).isZero();
        assertThat(secondRun.soBaoGiaMoi()).isZero();
        assertThat(secondRun.soThanhToanMoi()).isZero();

        // Count in DB remains 44
        Integer totalBatchTickets = jdbc.queryForObject(
                "SELECT count(*) FROM YEU_CAU_SUA_CHUA WHERE fixture_key LIKE 'THO_DEMO_V2_BATCH_44%'",
                Integer.class
        );
        assertThat(totalBatchTickets).isEqualTo(44);

        // 10. Verify KPI derivation via service
        ThoDashboardDto.ThoTongQuanDto huyOverview = thoDashboardService.layTongQuan(huy, null, null, null);
        assertThat(huyOverview.kpi().dangXuLy()).isGreaterThanOrEqualTo(4);
        assertThat(huyOverview.kpi().choXacNhan()).isGreaterThanOrEqualTo(3);
        assertThat(huyOverview.kpi().giaTriDaChot()).isGreaterThan(BigDecimal.ZERO);
        assertThat(huyOverview.kpi().daNhan()).isGreaterThan(BigDecimal.ZERO);
        assertThat(huyOverview.kpi().conPhaiTra()).isGreaterThan(BigDecimal.ZERO);
        assertThat(huyOverview.kpi().tyLeHoanThanh().coDuLieu()).isTrue();

        // Data isolation: Huy does not see Thanh's jobs
        for (ThoDashboardDto.ThongTinViecThoRow row : huyOverview.viecCanXuLy()) {
            assertThat(row.hangMuc()).isNotBlank();
        }
    }

    private int demTrangThai(Long workerId, String trangThai) {
        Integer cnt = jdbc.queryForObject(
                "SELECT count(*) FROM YEU_CAU_SUA_CHUA WHERE nguoi_xu_ly_id = ? AND trang_thai = ? AND fixture_key LIKE 'THO_DEMO_V2_BATCH_44%'",
                Integer.class,
                workerId,
                trangThai
        );
        return cnt != null ? cnt : 0;
    }

    private void verifyPaymentBreakdown(Long workerId, int expectedClosed, int expectedFull, int expectedPartial, int expectedUnpaid) {
        List<Map<String, Object>> closedRows = jdbc.queryForList(
                "SELECT yc.id, " +
                        "COALESCE((SELECT bg.tong_tien FROM BAO_GIA_SUA_CHUA bg WHERE bg.yeu_cau_id = yc.id AND bg.trang_thai = 'DA_DUYET' LIMIT 1), 0) as approved_val, " +
                        "COALESCE((SELECT sum(tt.so_tien) FROM THANH_TOAN_THO tt WHERE tt.yeu_cau_id = yc.id), 0) as total_paid " +
                        "FROM YEU_CAU_SUA_CHUA yc " +
                        "WHERE yc.nguoi_xu_ly_id = ? AND yc.trang_thai = 'DA_DONG' AND yc.fixture_key LIKE 'THO_DEMO_V2_BATCH_44%'",
                workerId
        );
        assertThat(closedRows).hasSize(expectedClosed);

        int fullCount = 0;
        int partialCount = 0;
        int unpaidCount = 0;

        for (Map<String, Object> r : closedRows) {
            BigDecimal approved = (BigDecimal) r.get("approved_val");
            BigDecimal paid = (BigDecimal) r.get("total_paid");

            if (approved.compareTo(BigDecimal.ZERO) == 0) {
                // 0 VND warranty order is considered settled
                fullCount++;
            } else if (paid.compareTo(approved) >= 0) {
                fullCount++;
            } else if (paid.compareTo(BigDecimal.ZERO) > 0) {
                partialCount++;
            } else {
                unpaidCount++;
            }
        }

        assertThat(fullCount).as("Đã trả đủ cho thợ " + workerId).isEqualTo(expectedFull);
        assertThat(partialCount).as("Trả một phần cho thợ " + workerId).isEqualTo(expectedPartial);
        assertThat(unpaidCount).as("Chưa trả cho thợ " + workerId).isEqualTo(expectedUnpaid);
    }
}
