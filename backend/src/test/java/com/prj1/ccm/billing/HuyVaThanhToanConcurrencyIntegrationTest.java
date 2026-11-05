package com.prj1.ccm.billing;

import com.prj1.ccm.billing.calc.TrangThaiHoaDon;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.TrangThaiNguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicReference;

import com.prj1.ccm.auth.AuthInterceptor;
import org.springframework.mock.web.MockHttpServletRequest;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class HuyVaThanhToanConcurrencyIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new com.prj1.ccm.support.TestPostgres("postgres:17-alpine");

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private HuyHoaDonNhapService huyHoaDonNhapService;

    @Autowired
    private ThanhToanService thanhToanService;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Autowired
    private ThayTheHoaDonController thayTheHoaDonController;

    private Long kyId;
    private Long hoaDonId;

    private final NguoiDung chuSoHuu = new NguoiDung(
            2L, "Chủ nhà", "0900000002", "hash", VaiTro.CHU, TrangThaiNguoiDung.HOAT_DONG, 0, null
    );
    private final NguoiDung quanLy = new NguoiDung(
            3L, "Quản lý", "0900000003", "hash", VaiTro.QUAN_LY, TrangThaiNguoiDung.HOAT_DONG, 0, null
    );

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @BeforeEach
    void resetDatabase() {
        jdbcTemplate.update("DELETE FROM SO_DU_KHA_DUNG");
        jdbcTemplate.update("DELETE FROM THANH_TOAN");
        jdbcTemplate.update("DELETE FROM CHI_TIET_HOA_DON_BAC_THANG");
        jdbcTemplate.update("DELETE FROM CHI_TIET_HOA_DON");
        jdbcTemplate.update("DELETE FROM HOA_DON");
        jdbcTemplate.update("DELETE FROM CHI_SO_DICH_VU");
        jdbcTemplate.update("DELETE FROM KY_THANH_TOAN");
        jdbcTemplate.update("DELETE FROM KHOAN_PHAT_SINH");
        jdbcTemplate.update("DELETE FROM YEU_CAU_SUA_CHUA");
        jdbcTemplate.update("DELETE FROM CHI_TIET_BIEN_BAN_TAI_SAN");
        jdbcTemplate.update("DELETE FROM BIEN_BAN_BAN_GIAO_TAI_SAN");
        jdbcTemplate.update("DELETE FROM TAI_SAN_PHONG");
        jdbcTemplate.update("DELETE FROM LICH_HEN_XEM_PHONG");
        jdbcTemplate.update("DELETE FROM HOP_DONG_DICH_VU");
        jdbcTemplate.update("DELETE FROM HOP_DONG");
        jdbcTemplate.update("DELETE FROM NGUOI_THUE");
        jdbcTemplate.update("DELETE FROM BANG_GIA_BAC_THANG");
        jdbcTemplate.update("DELETE FROM BANG_GIA");
        jdbcTemplate.update("DELETE FROM DICH_VU");
        jdbcTemplate.update("DELETE FROM PHONG");
        jdbcTemplate.update("DELETE FROM NHAT_KY_THAO_TAC");
        jdbcTemplate.update("DELETE FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id IN (2, 3, 4, 5)");
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (2, 1), (3, 1) ON CONFLICT DO NOTHING");

        Long phongId = jdbcTemplate.queryForObject(
                """
                        INSERT INTO PHONG (toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai)
                        VALUES (1, '101', 1, 25.00, 4, 3500000.00, 'Studio', 'DANG_THUE')
                        RETURNING id
                        """,
                Long.class
        );
        Long nguoiThueId = jdbcTemplate.queryForObject(
                """
                        INSERT INTO NGUOI_THUE (ho_ten, ngay_sinh, so_dien_thoai, so_giay_to, que_quan)
                        VALUES ('Nguoi thue test', DATE '1990-01-01', '0905000101', 'CC500101', 'Ha Noi')
                        RETURNING id
                        """,
                Long.class
        );
        Long hopDongId = jdbcTemplate.queryForObject(
                """
                        INSERT INTO HOP_DONG (phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai)
                        VALUES (?, ?, DATE '2026-07-01', DATE '2026-09-30', 3500000.00, 3500000.00, 30, 'HIEU_LUC')
                        RETURNING id
                        """,
                Long.class,
                phongId,
                nguoiThueId
        );
        kyId = jdbcTemplate.queryForObject(
                """
                        INSERT INTO KY_THANH_TOAN (toa_nha_id, nam, thang, ngay_bat_dau, ngay_ket_thuc, trang_thai)
                        VALUES (1, 2026, 8, DATE '2026-07-02', DATE '2026-08-01', 'DA_CHOT')
                        RETURNING id
                        """,
                Long.class
        );
        hoaDonId = jdbcTemplate.queryForObject(
                """
                        INSERT INTO HOA_DON (ma_hoa_don, ky_id, hop_dong_id, ngay_phat_hanh, han_thanh_toan, tong_tien, da_thu, trang_thai)
                        VALUES ('TN-A-101-202608', ?, ?, CURRENT_DATE, CURRENT_DATE + 10, 1888000.00, 0.00, 'DA_PHAT_HANH')
                        RETURNING id
                        """,
                Long.class,
                kyId,
                hopDongId
        );
    }

    @Test
    void thuTienTruoc_huySau_biChanBangConflictVaBaoToanTienThu() throws Exception {
        CountDownLatch thuTienDaKhoa = new CountDownLatch(1);
        CountDownLatch huyBatDauCho = new CountDownLatch(1);
        CountDownLatch thuTienDuocPhepCommit = new CountDownLatch(1);
        AtomicReference<Exception> loiHuy = new AtomicReference<>();

        ExecutorService executor = Executors.newFixedThreadPool(2);

        // Thread 1: Thực hiện thu tiền trong transaction, giữ khóa dòng HOA_DON
        Future<?> futureThuTien = executor.submit(() -> {
            TransactionTemplate tt = new TransactionTemplate(transactionManager);
            tt.execute(status -> {
                // Ghi nhận thanh toán 500,000 đ
                thanhToanService.ghiNhan(
                        1L, kyId, hoaDonId,
                        new YeuCauThanhToan(new BigDecimal("500000.00"), HinhThucThanhToan.CHUYEN_KHOAN, LocalDate.of(2026, 8, 5), false),
                        quanLy
                );
                thuTienDaKhoa.countDown();
                try {
                    // Chờ Thread 2 bắt đầu gọi huỷ và bị block bởi lock
                    huyBatDauCho.await(5, TimeUnit.SECONDS);
                    Thread.sleep(200); // Đảm bảo Thread 2 đang chờ khóa trên database
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                return null;
            });
        });

        // Thread 2: Gọi huỷ hoá đơn
        Future<?> futureHuy = executor.submit(() -> {
            try {
                thuTienDaKhoa.await(5, TimeUnit.SECONDS);
                huyBatDauCho.countDown();
                // Khi gọi huỷ, timHoaDonTrongPhamVi(..., true) sẽ bị block cho tới khi Thread 1 commit
                huyHoaDonNhapService.huy(
                        1L, kyId, hoaDonId,
                        new YeuCauHuyHoaDon("Huỷ trong race condition"),
                        chuSoHuu
                );
            } catch (Exception e) {
                loiHuy.set(e);
            }
        });

        futureThuTien.get(10, TimeUnit.SECONDS);
        futureHuy.get(10, TimeUnit.SECONDS);
        executor.shutdown();

        // Kiểm chứng Thread 2 bị quăng lỗi 409 CONFLICT vì đã có tiền thực thu
        assertThat(loiHuy.get())
                .isNotNull()
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Lập bút toán đối ứng cho các khoản đã thu trước khi huỷ hoá đơn.");

        // Kiểm chứng trạng thái DB: Hoá đơn vẫn DA_PHAT_HANH, tiền thu đúng 500,000 đ, không mất tiền
        String trangThai = jdbcTemplate.queryForObject("SELECT trang_thai FROM HOA_DON WHERE id = ?", String.class, hoaDonId);
        BigDecimal daThu = jdbcTemplate.queryForObject("SELECT da_thu FROM HOA_DON WHERE id = ?", BigDecimal.class, hoaDonId);
        BigDecimal tongThanhToan = jdbcTemplate.queryForObject("SELECT COALESCE(SUM(so_tien), 0) FROM THANH_TOAN WHERE hoa_don_id = ?", BigDecimal.class, hoaDonId);

        assertThat(trangThai).isNotEqualTo("DA_HUY");
        assertThat(daThu).isEqualByComparingTo(new BigDecimal("500000.00"));
        assertThat(tongThanhToan).isEqualByComparingTo(new BigDecimal("500000.00"));
    }

    @Test
    void huyTruoc_thuTienSau_biChanBangConflict() throws Exception {
        CountDownLatch huyDaKhoa = new CountDownLatch(1);
        CountDownLatch thuBatDauCho = new CountDownLatch(1);
        AtomicReference<Exception> loiThu = new AtomicReference<>();

        ExecutorService executor = Executors.newFixedThreadPool(2);

        // Thread 1: Huỷ hoá đơn trong transaction
        Future<?> futureHuy = executor.submit(() -> {
            TransactionTemplate tt = new TransactionTemplate(transactionManager);
            tt.execute(status -> {
                huyHoaDonNhapService.huy(
                        1L, kyId, hoaDonId,
                        new YeuCauHuyHoaDon("Huỷ trước thu"),
                        chuSoHuu
                );
                huyDaKhoa.countDown();
                try {
                    thuBatDauCho.await(5, TimeUnit.SECONDS);
                    Thread.sleep(200);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                return null;
            });
        });

        // Thread 2: Cố gắng thu tiền
        Future<?> futureThu = executor.submit(() -> {
            try {
                huyDaKhoa.await(5, TimeUnit.SECONDS);
                thuBatDauCho.countDown();
                thanhToanService.ghiNhan(
                        1L, kyId, hoaDonId,
                        new YeuCauThanhToan(new BigDecimal("200000.00"), HinhThucThanhToan.TIEN_MAT, LocalDate.of(2026, 8, 5), false),
                        quanLy
                );
            } catch (Exception e) {
                loiThu.set(e);
            }
        });

        futureHuy.get(10, TimeUnit.SECONDS);
        futureThu.get(10, TimeUnit.SECONDS);
        executor.shutdown();

        // Kiểm chứng Thread 2 bị chặn với 409 CONFLICT vì hoá đơn đã huỷ
        assertThat(loiThu.get())
                .isNotNull()
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Hoá đơn đã huỷ không được ghi nhận thanh toán");

        // Kiểm chứng DB: Hoá đơn ở trạng thái DA_HUY, không có bản ghi THANH_TOAN nào
        String trangThai = jdbcTemplate.queryForObject("SELECT trang_thai FROM HOA_DON WHERE id = ?", String.class, hoaDonId);
        Integer soBanGhiThanhToan = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM THANH_TOAN WHERE hoa_don_id = ?", Integer.class, hoaDonId);

        assertThat(trangThai).isEqualTo("DA_HUY");
        assertThat(soBanGhiThanhToan).isEqualTo(0);
    }

    @Test
    void doiUngXong_choPhepChuyenDaHuy() {
        // Thu 500,000 đ
        ThongTinThanhToan thanhToan = thanhToanService.ghiNhan(
                1L, kyId, hoaDonId,
                new YeuCauThanhToan(new BigDecimal("500000.00"), HinhThucThanhToan.CHUYEN_KHOAN, LocalDate.of(2026, 8, 5), false),
                quanLy
        );

        // Lập bút toán đối ứng âm 500,000 đ
        thanhToanService.ghiNhanDoiUng(
                thanhToan.thanhToanId(),
                new YeuCauDoiUng(new BigDecimal("500000.00"), "Bút toán đối ứng"),
                chuSoHuu
        );

        // Bây giờ daThu ròng = 0 -> Huỷ thành công!
        huyHoaDonNhapService.huy(
                1L, kyId, hoaDonId,
                new YeuCauHuyHoaDon("Huỷ sau khi đã đối ứng sạch tiền thu"),
                chuSoHuu
        );

        String trangThai = jdbcTemplate.queryForObject("SELECT trang_thai FROM HOA_DON WHERE id = ?", String.class, hoaDonId);
        assertThat(trangThai).isEqualTo("DA_HUY");
    }

    @Test
    void thayTheHoaDon_daThuTien_nemLoiConflict() {
        // Thu tiền 500,000 đ
        thanhToanService.ghiNhan(
                1L, kyId, hoaDonId,
                new YeuCauThanhToan(new BigDecimal("500000.00"), HinhThucThanhToan.CHUYEN_KHOAN, LocalDate.of(2026, 8, 5), false),
                quanLy
        );

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE, chuSoHuu);

        assertThatThrownBy(() -> thayTheHoaDonController.thayThe(
                1L, kyId, hoaDonId,
                new YeuCauHuyHoaDon("Thay thế hoá đơn sai"),
                request
        ))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Lập bút toán đối ứng cho các khoản đã thu trước khi thay thế hoá đơn.");
    }

    @Test
    void thayTheHoaDon_chuaThuTien_thayTheThanhCongVaKhongLapKhoanPhaiThu() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE, chuSoHuu);

        ThayTheHoaDonController.KetQua ketQua = thayTheHoaDonController.thayThe(
                1L, kyId, hoaDonId,
                new YeuCauHuyHoaDon("Thay thế hoá đơn chưa thu tiền"),
                request
        );

        assertThat(ketQua).isNotNull();
        assertThat(ketQua.hoaDonCuId()).isEqualTo(hoaDonId);
        assertThat(ketQua.hoaDonMoiId()).isNotNull().isNotEqualTo(hoaDonId);

        // Kiểm chứng: Hoá đơn cũ chuyển DA_HUY
        String trangThaiCu = jdbcTemplate.queryForObject("SELECT trang_thai FROM HOA_DON WHERE id = ?", String.class, hoaDonId);
        assertThat(trangThaiCu).isEqualTo("DA_HUY");

        // Kiểm chứng: Hoá đơn mới ở trạng thái NHAP/DA_PHAT_HANH và chỉ có duy nhất 1 hoá đơn active cho kỳ này
        Integer soHoaDonActive = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM HOA_DON WHERE ky_id = ? AND trang_thai <> 'DA_HUY'",
                Integer.class,
                kyId
        );
        assertThat(soHoaDonActive).isEqualTo(1);
    }
}
