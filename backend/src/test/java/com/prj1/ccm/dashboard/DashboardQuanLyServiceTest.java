package com.prj1.ccm.dashboard;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
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

class DashboardQuanLyServiceTest {
    private final Clock clock = Clock.fixed(Instant.parse("2026-11-06T00:00:00Z"), ZoneId.of("Asia/Ho_Chi_Minh"));

    static class FakeQuanLyRepository extends DashboardQuanLyRepository {
        public FakeQuanLyRepository() { super(null); }
        @Override
        public CongToChuaGhiTongHop layCongToChuaGhi(Long nguoiDungId, Long toaNhaId) {
            return new CongToChuaGhiTongHop(9L, "Kỳ 10/2026", 24, 17, 7, List.of());
        }
        @Override
        public List<LichHenRecord> findLichHenSapToi(Long nguoiDungId, Long toaNhaId) {
            return List.of();
        }
    }

    static class FakeChuRepoForQuanLy extends DashboardChuRepository {
        public FakeChuRepoForQuanLy() { super(null); }
        @Override
        public TuoiNoRecord layTuoiNo(Long nguoiDungId, Long toaNhaId, LocalDate ngayTinh) {
            return new TuoiNoRecord(
                    new NhomTuoiNo(2, BigDecimal.valueOf(10000000)),
                    new NhomTuoiNo(1, BigDecimal.valueOf(5000000)),
                    new NhomTuoiNo(0, BigDecimal.ZERO),
                    new NhomTuoiNo(0, BigDecimal.ZERO)
            );
        }
        @Override
        public CoCauPhongRecord layCoCauPhong(Long nguoiDungId, Long toaNhaId, LocalDate ngayTinh) {
            return new CoCauPhongRecord(
                    12, 9, BigDecimal.valueOf(75), 2, BigDecimal.valueOf(16.67),
                    0, BigDecimal.ZERO, 1, BigDecimal.valueOf(8.33), 0, BigDecimal.ZERO
            );
        }
        @Override
        public int demSoSuCoDangMo(Long nguoiDungId, Long toaNhaId) {
            return 2;
        }
    }

    static class FakeCanhBaoRepo extends CanhBaoTieuThuRepository {
        public FakeCanhBaoRepo() { super(null); }
        @Override
        public List<CanhBaoRecord> findCanhBao(Long nguoiDungId, Long toaNhaId, String trangThai) {
            return List.of();
        }
        @Override
        public int demCanhBaoDangMo(Long nguoiDungId, Long toaNhaId) {
            return 1;
        }
    }

    static class FakeDoiSoatQL extends DoiSoatDienNuocService {
        public FakeDoiSoatQL() { super(null, null); }
        @Override
        public KetQuaDoiSoat doiSoatKy(Long toaNhaId, Long kyId, String loaiDichVu) {
            return KetQuaDoiSoat.chuaDuDuLieu("kWh", "Thiếu");
        }
    }

    static class FakeKyRepoForQL extends com.prj1.ccm.toanha.KyThanhToanRepository {
        public FakeKyRepoForQL() { super(null); }
        @Override
        public List<com.prj1.ccm.toanha.KyThanhToan> findByToaNhaId(Long toaNhaId) {
            return List.of();
        }
    }

    private final FakeQuanLyRepository repository = new FakeQuanLyRepository();
    private final FakeChuRepoForQuanLy chuRepository = new FakeChuRepoForQuanLy();
    private final FakeCanhBaoRepo canhBaoRepository = new FakeCanhBaoRepo();
    private final FakeDoiSoatQL doiSoatService = new FakeDoiSoatQL();
    private final FakeKyRepoForQL kyRepository = new FakeKyRepoForQL();

    private final DashboardQuanLyService service = new DashboardQuanLyService(
            repository,
            chuRepository,
            canhBaoRepository,
            doiSoatService,
            kyRepository,
            null,
            clock
    );

    @Test
    @DisplayName("Worker or Tenant cannot access Manager dashboard")
    void testTenantForbidden() {
        NguoiDung tho = new NguoiDung(9L, "Worker", "0999000031", "hash", VaiTro.THO, com.prj1.ccm.nguoidung.TrangThaiNguoiDung.HOAT_DONG, 1, null);
        assertThatThrownBy(() -> service.layDashboard(null, tho))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("403");
    }

    @Test
    @DisplayName("Manager gets operational metrics scoped to assigned building")
    void testManagerScoped() {
        NguoiDung quanLy = new NguoiDung(21L, "Manager", "0999000021", "hash", VaiTro.QUAN_LY, com.prj1.ccm.nguoidung.TrangThaiNguoiDung.HOAT_DONG, 1, null);

        var result = service.layDashboard(null, quanLy);
        assertThat(result.kpi().khoanConPhaiThu()).isEqualByComparingTo("15000000.00");
        assertThat(result.kpi().soHoaDonQuaHan()).isEqualTo(1);
        assertThat(result.kpi().tienQuaHan()).isEqualByComparingTo("5000000.00");
        assertThat(result.kpi().soCongToChuaGhi()).isEqualTo(7);
        assertThat(result.kpi().soCanhBaoDienNuocDangMo()).isEqualTo(1);
        assertThat(result.kpi().soSuCoCanXuLy()).isEqualTo(2);
    }
}
