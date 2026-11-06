package com.prj1.ccm.dashboard;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.stubbing.Answer;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DoiSoatDienNuocServiceTest {

    private DiemDoDungChungRepository diemDoRepository;
    private JdbcTemplate jdbcTemplate;
    private DoiSoatDienNuocService service;

    // Test fixtures
    private BigDecimal mockTieuThuTong = BigDecimal.valueOf(1570.00);
    private int mockTongPhong = 10;
    private int mockPhongDaGhi = 10;
    private BigDecimal mockTieuThuPhong = BigDecimal.valueOf(1006.00);
    private List<DoiSoatDienNuocService.ChiTietKhuVucDungChung> mockKhuVucChung = new ArrayList<>();
    private BigDecimal mockNguongThatThoat = BigDecimal.valueOf(150000.00);
    private BigDecimal mockDonGiaMua = BigDecimal.valueOf(2400.00);

    @BeforeEach
    void setUp() {
        diemDoRepository = mock(DiemDoDungChungRepository.class);
        jdbcTemplate = mock(JdbcTemplate.class);
        service = new DoiSoatDienNuocService(diemDoRepository, jdbcTemplate);

        // Default: 3 common area meters summing to 555 kWh (Hành lang 120, Thang máy 350, Bơm 85)
        mockKhuVucChung = new ArrayList<>(List.of(
                new DoiSoatDienNuocService.ChiTietKhuVucDungChung(1L, "CT-HL", "Hành lang", "HANH_LANG", "kWh", BigDecimal.valueOf(2400), BigDecimal.valueOf(120), BigDecimal.valueOf(288000), null, null),
                new DoiSoatDienNuocService.ChiTietKhuVucDungChung(2L, "CT-TM", "Thang máy", "THANG_MAY", "kWh", BigDecimal.valueOf(2400), BigDecimal.valueOf(350), BigDecimal.valueOf(840000), null, null),
                new DoiSoatDienNuocService.ChiTietKhuVucDungChung(3L, "CT-BOM", "Máy bơm", "MAY_BOM", "kWh", BigDecimal.valueOf(2400), BigDecimal.valueOf(85), BigDecimal.valueOf(204000), null, null)
        ));

        // Setup generic mock for jdbcTemplate.query
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), any(Object[].class))).thenAnswer((Answer<List<?>>) invocation -> {
            String sql = invocation.getArgument(0);
            if (sql.contains("KY_THANH_TOAN WHERE id = ?")) {
                // Return 1 KyInfo
                RowMapper<?> mapper = invocation.getArgument(1);
                var rs = mock(java.sql.ResultSet.class);
                when(rs.getLong("id")).thenReturn(4L);
                when(rs.getLong("toa_nha_id")).thenReturn(3L);
                when(rs.getInt("nam")).thenReturn(2026);
                when(rs.getInt("thang")).thenReturn(10);
                when(rs.getDate("ngay_bat_dau")).thenReturn(java.sql.Date.valueOf(LocalDate.of(2026, 10, 1)));
                when(rs.getDate("ngay_ket_thuc")).thenReturn(java.sql.Date.valueOf(LocalDate.of(2026, 10, 31)));
                return List.of(mapper.mapRow(rs, 0));
            }
            if (sql.contains("loai_diem_do = 'TONG'") && sql.contains("CHI_SO_DUNG_CHUNG")) {
                return mockTieuThuTong != null ? List.of(mockTieuThuTong) : List.of();
            }
            if (sql.contains("tong_phong") && sql.contains("phong_da_ghi")) {
                RowMapper<?> mapper = invocation.getArgument(1);
                var rs = mock(java.sql.ResultSet.class);
                when(rs.getInt("tong_phong")).thenReturn(mockTongPhong);
                when(rs.getInt("phong_da_ghi")).thenReturn(mockPhongDaGhi);
                when(rs.getBigDecimal("tieu_thu")).thenReturn(mockTieuThuPhong);
                return List.of(mapper.mapRow(rs, 0));
            }
            if (sql.contains("loai_diem_do = 'KHU_VUC_CHUNG'") && sql.contains("DIEM_DO_DUNG_CHUNG")) {
                return mockKhuVucChung;
            }
            if (sql.contains("nguong_that_thoat FROM TOA_NHA")) {
                return mockNguongThatThoat != null ? List.of(mockNguongThatThoat) : List.of();
            }
            if (sql.contains("don_gia_mua") && sql.contains("DIEM_DO_DUNG_CHUNG")) {
                return mockDonGiaMua != null ? List.of(mockDonGiaMua) : List.of();
            }
            return List.of();
        });
    }

    @Test
    @DisplayName("R01 & R03: Missing main meter reading returns CHUA_DU_DU_LIEU")
    void testMissingMainMeterReading() {
        mockTieuThuTong = null;
        var result = service.doiSoatKy(3L, 4L, "DIEN");
        assertThat(result.trangThai()).isEqualTo("CHUA_DU_DU_LIEU");
        assertThat(result.ghiChu()).contains("Chưa ghi nhận số đo công tơ tổng");
    }

    @Test
    @DisplayName("R03: Incomplete room reading coverage returns CHUA_DU_DU_LIEU with progress count")
    void testIncompleteRoomReadingCoverage() {
        mockTongPhong = 10;
        mockPhongDaGhi = 7;
        mockTieuThuPhong = BigDecimal.valueOf(700.00);

        var result = service.doiSoatKy(3L, 4L, "DIEN");
        assertThat(result.trangThai()).isEqualTo("CHUA_DU_DU_LIEU");
        assertThat(result.ghiChu()).contains("Mới ghi nhận số đo của 7/10 phòng");
    }

    @Test
    @DisplayName("R03: Unrecorded common meter reading returns CHUA_DU_DU_LIEU")
    void testUnrecordedCommonMeterReading() {
        mockKhuVucChung.add(new DoiSoatDienNuocService.ChiTietKhuVucDungChung(
                4L, "CT-MOI", "Khu giặt là", "GIAT_LA", "kWh", BigDecimal.valueOf(2400),
                null, null, null, null
        ));

        var result = service.doiSoatKy(3L, 4L, "DIEN");
        assertThat(result.trangThai()).isEqualTo("CHUA_DU_DU_LIEU");
        assertThat(result.ghiChu()).contains("Còn điểm đo khu vực chung chưa ghi nhận");
    }

    @Test
    @DisplayName("R01: Missing purchase price returns CHUA_DU_DU_LIEU without fake fallback")
    void testMissingPurchasePrice() {
        mockDonGiaMua = null;

        var result = service.doiSoatKy(3L, 4L, "DIEN");
        assertThat(result.trangThai()).isEqualTo("CHUA_DU_DU_LIEU");
        assertThat(result.ghiChu()).contains("Chưa cấu hình đơn giá mua công tơ");
    }

    @Test
    @DisplayName("R03: Child meter of another common meter is not double-counted in reconciliation")
    void testParentChildCommonMeterNotDoubleCounted() {
        // Tổng: 1570, Phòng: 1006.
        // Chung cha (Bơm): 85 kWh. Thêm Bơm con: 25 kWh (cha là KHU_VUC_CHUNG).
        // Bơm con không được cộng thêm vào tieuThuChungDoRieng (vì đã nằm trong 85 kWh của Bơm cha).
        mockKhuVucChung.add(new DoiSoatDienNuocService.ChiTietKhuVucDungChung(
                4L, "CT-BOM-CON", "Bơm tăng áp con", "MAY_BOM", "kWh",
                BigDecimal.valueOf(2400), BigDecimal.valueOf(25), BigDecimal.valueOf(60000),
                3L, "KHU_VUC_CHUNG"
        ));

        var result = service.doiSoatKy(3L, 4L, "DIEN");
        // tieuThuChungDoRieng = 120 + 350 + 85 = 555 (không phải 555 + 25 = 580)
        assertThat(result.mucChungDoRieng()).isEqualByComparingTo("555.00");
        // Chênh lệch = 1570 - 1006 - 555 = 9.00
        assertThat(result.chenhLech()).isEqualByComparingTo("9.00");
        assertThat(result.trangThai()).isEqualTo("KHOP_DOI_SOAT");
    }

    @Test
    @DisplayName("R01 & R04: Difference within threshold returns KHOP_DOI_SOAT")
    void testReconciliationMatches() {
        // Tổng: 1570, Phòng: 1006, Chung: 555 => Chênh lệch = 9 kWh.
        // Ngưỡng: 150000 / 2400 = 62.5 kWh. 9 <= 62.5 => KHOP_DOI_SOAT
        var result = service.doiSoatKy(3L, 4L, "DIEN");
        assertThat(result.trangThai()).isEqualTo("KHOP_DOI_SOAT");
        assertThat(result.chenhLech()).isEqualByComparingTo("9.00");
        assertThat(result.vuotNguong()).isFalse();
        assertThat(result.ghiChu()).contains("nằm trong ngưỡng sai số");
    }

    @Test
    @DisplayName("R03: Difference exceeding threshold returns CANH_BAO_THAT_THOAT")
    void testReconciliationExceedsThreshold() {
        // Tổng: 1700, Phòng: 1006, Chung: 555 => Chênh lệch = 139 kWh > 62.5 kWh
        mockTieuThuTong = BigDecimal.valueOf(1700.00);

        var result = service.doiSoatKy(3L, 4L, "DIEN");
        assertThat(result.trangThai()).isEqualTo("CANH_BAO_THAT_THOAT");
        assertThat(result.chenhLech()).isEqualByComparingTo("139.00");
        assertThat(result.vuotNguong()).isTrue();
        assertThat(result.ghiChu()).contains("vượt ngưỡng cho phép");
    }

    @Test
    @DisplayName("R03: Negative difference (Tổng < Phòng + Chung) returns LECH_AM_BAT_THUONG")
    void testReconciliationNegativeDifference() {
        // Tổng: 1500, Phòng: 1006, Chung: 555 => Chênh lệch = -61 kWh
        mockTieuThuTong = BigDecimal.valueOf(1500.00);

        var result = service.doiSoatKy(3L, 4L, "DIEN");
        assertThat(result.trangThai()).isEqualTo("LECH_AM_BAT_THUONG");
        assertThat(result.chenhLech()).isEqualByComparingTo("-61.00");
        assertThat(result.vuotNguong()).isTrue();
        assertThat(result.ghiChu()).contains("Chênh lệch âm bất thường");
    }

    @Test
    @DisplayName("R05: Anomaly check compares strictly against 3 prior periods")
    void testAnomalyCheckComparesAgainst3PriorPeriods() {
        // Current period: 180 kWh (high consumption)
        var kyHienTai = new DiemDoDungChungRepository.ChiSoDungChungRecord(
                10L, 1L, 4L, BigDecimal.valueOf(1000), BigDecimal.valueOf(1180), BigDecimal.valueOf(180),
                false, null, null, 1L, null, 3L, "CT-BOM", "Máy bơm", "DIEN", "kWh", "KHU_VUC_CHUNG", "MAY_BOM", BigDecimal.valueOf(2400)
        );
        when(diemDoRepository.findChiSoByDiemDoVaKy(1L, 4L)).thenReturn(Optional.of(kyHienTai));

        // 3 prior periods averaging 85 kWh
        var cacKyTruoc = List.of(
                new DiemDoDungChungRepository.ChiSoDungChungRecord(9L, 1L, 3L, BigDecimal.valueOf(915), BigDecimal.valueOf(1000), BigDecimal.valueOf(85), false, null, null, 1L, null, 3L, "CT-BOM", "Máy bơm", "DIEN", "kWh", "KHU_VUC_CHUNG", "MAY_BOM", BigDecimal.valueOf(2400)),
                new DiemDoDungChungRepository.ChiSoDungChungRecord(8L, 1L, 2L, BigDecimal.valueOf(828), BigDecimal.valueOf(915), BigDecimal.valueOf(87), false, null, null, 1L, null, 3L, "CT-BOM", "Máy bơm", "DIEN", "kWh", "KHU_VUC_CHUNG", "MAY_BOM", BigDecimal.valueOf(2400)),
                new DiemDoDungChungRepository.ChiSoDungChungRecord(7L, 1L, 1L, BigDecimal.valueOf(745), BigDecimal.valueOf(828), BigDecimal.valueOf(83), false, null, null, 1L, null, 3L, "CT-BOM", "Máy bơm", "DIEN", "kWh", "KHU_VUC_CHUNG", "MAY_BOM", BigDecimal.valueOf(2400))
        );
        when(diemDoRepository.findChiSoCacKyTruoc(1L, 4L, 3)).thenReturn(cacKyTruoc);

        var result = service.kiemTraBatThuongDiemDo(1L, 4L);
        assertThat(result.batThuong()).isTrue();
        assertThat(result.tyLeTang()).isGreaterThanOrEqualTo(BigDecimal.valueOf(1.50));
        assertThat(result.lyDo()).contains("gấp");
    }

    @Test
    @DisplayName("R05: Anomaly check returns chuaDuLichSu when fewer than 3 prior periods exist")
    void testAnomalyCheckFewerThan3PriorPeriods() {
        var kyHienTai = new DiemDoDungChungRepository.ChiSoDungChungRecord(
                10L, 1L, 4L, BigDecimal.valueOf(1000), BigDecimal.valueOf(1180), BigDecimal.valueOf(180),
                false, null, null, 1L, null, 3L, "CT-BOM", "Máy bơm", "DIEN", "kWh", "KHU_VUC_CHUNG", "MAY_BOM", BigDecimal.valueOf(2400)
        );
        when(diemDoRepository.findChiSoByDiemDoVaKy(1L, 4L)).thenReturn(Optional.of(kyHienTai));
        when(diemDoRepository.findChiSoCacKyTruoc(1L, 4L, 3)).thenReturn(List.of());

        var result = service.kiemTraBatThuongDiemDo(1L, 4L);
        assertThat(result.batThuong()).isFalse();
        assertThat(result.lyDo()).contains("Chưa đủ 3 kỳ lịch sử");
    }
}
