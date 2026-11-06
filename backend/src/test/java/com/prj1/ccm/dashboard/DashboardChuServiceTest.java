package com.prj1.ccm.dashboard;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import com.prj1.ccm.toanha.ToaNha;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DashboardChuServiceTest {
    private final Clock clock = Clock.fixed(Instant.parse("2026-11-06T00:00:00Z"), ZoneId.of("Asia/Ho_Chi_Minh"));

    static class FakeRepository extends DashboardChuRepository {
        public FakeRepository() { super(null); }
        @Override
        public List<TaiChinhThangRecord> findTaiChinhTheoThang(Long nguoiDungId, Long toaNhaId, LocalDate tuNgay, LocalDate denNgay) {
            return List.of(
                    new TaiChinhThangRecord(
                            LocalDate.of(2026, 10, 1),
                            BigDecimal.valueOf(100000000),
                            BigDecimal.valueOf(80000000),
                            BigDecimal.valueOf(80000000),
                            BigDecimal.valueOf(20000000)
                    )
            );
        }
        @Override
        public CoCauPhongRecord layCoCauPhong(Long nguoiDungId, Long toaNhaId, LocalDate ngayTinh) {
            return new CoCauPhongRecord(
                    10, 8, BigDecimal.valueOf(80), 1, BigDecimal.valueOf(10),
                    0, BigDecimal.ZERO, 1, BigDecimal.valueOf(10), 0, BigDecimal.ZERO
            );
        }
        @Override
        public TuoiNoRecord layTuoiNo(Long nguoiDungId, Long toaNhaId, LocalDate ngayTinh) {
            return new TuoiNoRecord(
                    new NhomTuoiNo(5, BigDecimal.valueOf(15000000)),
                    new NhomTuoiNo(1, BigDecimal.valueOf(2000000)),
                    new NhomTuoiNo(1, BigDecimal.valueOf(3000000)),
                    new NhomTuoiNo(0, BigDecimal.ZERO)
            );
        }
        @Override
        public List<SoSanhToaNhaRecord> laySoSanhToaNha(Long nguoiDungId, LocalDate tuNgay, LocalDate denNgay, LocalDate ngayTinh) {
            return List.of(
                    new SoSanhToaNhaRecord(
                            3L, "An Nhiên", BigDecimal.valueOf(100000000), BigDecimal.valueOf(80000000),
                            BigDecimal.valueOf(20000000), BigDecimal.valueOf(80), 10, 8, BigDecimal.ZERO
                    )
            );
        }
        @Override
        public List<ChiPhiBaoTriThangRecord> layChiPhiBaoTriTheoThang(Long nguoiDungId, Long toaNhaId, LocalDate tuNgay, LocalDate denNgay) {
            return List.of();
        }
        @Override
        public List<TieuThuThangRecord> layTieuThuTheoThang(Long nguoiDungId, Long toaNhaId, LocalDate tuNgay, LocalDate denNgay, boolean laDien) {
            return List.of();
        }
        @Override
        public List<LichSuLapDayThangRecord> layLichSuLapDay(Long nguoiDungId, Long toaNhaId, LocalDate tuNgay, LocalDate denNgay) {
            return List.of();
        }
        @Override
        public int demSoSuCoDangMo(Long nguoiDungId, Long toaNhaId) {
            return 2;
        }
    }

    static class FakeKyRepository extends com.prj1.ccm.toanha.KyThanhToanRepository {
        public FakeKyRepository() { super(null); }
        @Override
        public List<com.prj1.ccm.toanha.KyThanhToan> findByToaNhaId(Long toaNhaId) {
            return List.of();
        }
    }

    static class FakeDoiSoatService extends DoiSoatDienNuocService {
        public FakeDoiSoatService() { super(null, null); }
        @Override
        public KetQuaDoiSoat doiSoatKy(Long toaNhaId, Long kyId, String loaiDichVu) {
            return KetQuaDoiSoat.chuaDuDuLieu("kWh", "Chưa đủ dữ liệu đối soát");
        }
    }

    private final FakeRepository repository = new FakeRepository();
    private final FakeKyRepository kyRepository = new FakeKyRepository();
    private final FakeDoiSoatService doiSoatService = new FakeDoiSoatService();
    private final DashboardChuService service = new DashboardChuService(
            repository,
            null,
            doiSoatService,
            kyRepository,
            clock
    );

    @Test
    @DisplayName("Non-CHU user cannot access CHU dashboard")
    void testNonChuForbidden() {
        NguoiDung quanLy = new NguoiDung(2L, "Manager", "0999000021", "hash", VaiTro.QUAN_LY, com.prj1.ccm.nguoidung.TrangThaiNguoiDung.HOAT_DONG, 1, null);
        assertThatThrownBy(() -> service.layDashboard(null, null, null, quanLy))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("403");
    }

    @Test
    @DisplayName("CHU user gets aggregated metrics across scoped buildings")
    void testChuAggregated() {
        NguoiDung chu = new NguoiDung(1L, "Owner", "0999000011", "hash", VaiTro.CHU, com.prj1.ccm.nguoidung.TrangThaiNguoiDung.HOAT_DONG, 1, null);

        var dashboard = service.layDashboard(null, "2026-10-01", "2026-11-06", chu);
        assertThat(dashboard.kpi().doanhThuPhatHanh()).isEqualByComparingTo("100000000.00");
        assertThat(dashboard.kpi().thucThu()).isEqualByComparingTo("80000000.00");
        assertThat(dashboard.kpi().soHoaDonQuaHan()).isEqualTo(2); // 1 + 1 + 0
        assertThat(dashboard.kpi().tyLeLapDay()).isEqualByComparingTo("80.00");
        assertThat(dashboard.kpi().tongSoPhong()).isEqualTo(10);
        assertThat(dashboard.kpi().soSuCoDangMo()).isEqualTo(2);
    }
}
