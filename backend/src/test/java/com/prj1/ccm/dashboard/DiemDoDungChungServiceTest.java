package com.prj1.ccm.dashboard;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.TrangThaiNguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.nguoithue.NhatKyThaoTacRepository;
import com.prj1.ccm.toanha.KyThanhToan;
import com.prj1.ccm.toanha.KyThanhToanRepository;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import com.prj1.ccm.toanha.ToaNha;
import com.prj1.ccm.toanha.TrangThaiKy;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DiemDoDungChungServiceTest {

    static class FakeDiemDoRepo extends DiemDoDungChungRepository {
        final List<ChiSoDungChungRecord> chiSoList = new ArrayList<>();
        BigDecimal chiSoCuoiKyTruoc = null;
        public FakeDiemDoRepo() { super(null); }

        @Override
        public Optional<BigDecimal> findChiSoCuoiKyTruoc(Long diemDoId, Long kyId) {
            return Optional.ofNullable(chiSoCuoiKyTruoc);
        }

        @Override
        public Optional<DiemDoRecord> findById(Long id) {
            if (id == 1L) {
                // Điểm đo toà 3
                return Optional.of(new DiemDoRecord(
                        1L, 3L, "CT-TONG-P1", "Công tơ tổng điện", "DIEN", "kWh",
                        "TONG", "TONG_TOA_NHA", null, BigDecimal.valueOf(2400), true, LocalDate.of(2026, 1, 1)
                ));
            }
            if (id == 2L) {
                // Điểm đo toà 4
                return Optional.of(new DiemDoRecord(
                        2L, 4L, "CT-TONG-P2", "Công tơ tổng điện", "DIEN", "kWh",
                        "TONG", "TONG_TOA_NHA", null, BigDecimal.valueOf(2400), true, LocalDate.of(2026, 1, 1)
                ));
            }
            return Optional.empty();
        }

        @Override
        public List<ChiSoDungChungRecord> findChiSoByKy(Long kyId) {
            return chiSoList.stream().filter(cs -> cs.kyId().equals(kyId)).toList();
        }

        @Override
        public void luuChiSo(
                Long diemDoId, Long kyId, BigDecimal chiSoDau, BigDecimal chiSoCuoi,
                BigDecimal mucTieuThu, boolean coThayCongTo, BigDecimal chiSoCuoiCongToCu,
                BigDecimal chiSoDauCongToMoi, Long nguoiGhiId, String ghiChu
        ) {
            chiSoList.add(new ChiSoDungChungRecord(
                    100L, diemDoId, kyId, chiSoDau, chiSoCuoi, mucTieuThu,
                    coThayCongTo, chiSoCuoiCongToCu, chiSoDauCongToMoi,
                    nguoiGhiId, ghiChu,
                    3L, "CT-TONG-P1", "Công tơ tổng điện", "DIEN", "kWh",
                    "TONG", "TONG_TOA_NHA", BigDecimal.valueOf(2400)
            ));
        }
    }

    static class FakeKyRepo extends KyThanhToanRepository {
        public FakeKyRepo() { super(null); }

        @Override
        public Optional<KyThanhToan> findById(Long id) {
            if (id == 4L) {
                // Kỳ 4 thuộc toà 3
                return Optional.of(new KyThanhToan(4L, 3L, 2026, 10, LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31), TrangThaiKy.DANG_MO));
            }
            if (id == 9L) {
                // Kỳ 9 thuộc toà 4
                return Optional.of(new KyThanhToan(9L, 4L, 2026, 10, LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31), TrangThaiKy.DANG_MO));
            }
            if (id == 99L) {
                // Kỳ đã chốt
                return Optional.of(new KyThanhToan(99L, 3L, 2026, 9, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30), TrangThaiKy.DA_CHOT));
            }
            return Optional.empty();
        }
    }

    static class FakeCanhBaoRepo extends CanhBaoTieuThuRepository {
        final List<String> canhBaoList = new ArrayList<>();
        final List<String> resolvedList = new ArrayList<>();
        public FakeCanhBaoRepo() { super(null); }

        @Override
        public void taoCanhBaoNeuChuaCo(Long toaNhaId, Long diemDoId, Long phongId, Long kyId, String loaiDichVu, String loaiCanhBao, BigDecimal mucTieuThuKyNay, BigDecimal mucThamChieu, BigDecimal mucTang, BigDecimal tyLeTang, String lyDo) {
            canhBaoList.add(toaNhaId + "-" + diemDoId + "-" + loaiCanhBao);
        }

        @Override
        public void taoHoacCapNhatCanhBao(Long toaNhaId, Long diemDoId, Long phongId, Long kyId, String loaiDichVu, String loaiCanhBao, BigDecimal mucTieuThuKyNay, BigDecimal mucThamChieu, BigDecimal mucTang, BigDecimal tyLeTang, String lyDo) {
            canhBaoList.add(toaNhaId + "-" + diemDoId + "-" + loaiCanhBao);
        }

        @Override
        public void giaiQuyetCanhBaoKhiChiSoVeBinhThuong(Long diemDoId, Long kyId) {
            resolvedList.add(diemDoId + "-" + kyId);
        }
    }

    static class FakeDoiSoat extends DoiSoatDienNuocService {
        boolean triggerAnomaly = false;
        public FakeDoiSoat() { super(null, null); }

        @Override
        public KiemTraBatThuong kiemTraBatThuongDiemDo(Long diemDoId, Long kyId) {
            if (triggerAnomaly) {
                return new KiemTraBatThuong(true, BigDecimal.valueOf(100), BigDecimal.valueOf(40), BigDecimal.valueOf(60), BigDecimal.valueOf(2.5), "Tăng cao");
            }
            return KiemTraBatThuong.binhThuong();
        }

        @Override
        public KetQuaDoiSoat doiSoatKy(Long toaNhaId, Long kyId, String loaiDichVu) {
            return new KetQuaDoiSoat("KHOP_DOI_SOAT", BigDecimal.valueOf(100), BigDecimal.valueOf(80), BigDecimal.valueOf(15), BigDecimal.valueOf(5), "kWh", BigDecimal.valueOf(10), false, "Khớp", List.of(), BigDecimal.ZERO);
        }
    }

    static class FakeAuditRepo extends NhatKyThaoTacRepository {
        final List<String> audits = new ArrayList<>();
        public FakeAuditRepo() { super(null); }

        @Override
        public void ghiTrongToa(Long toaNhaId, Long nguoiDungId, String hanhDong, String doiTuong, String giaTriTruoc, String giaTriSau) {
            audits.add(toaNhaId + ":" + hanhDong);
        }
    }

    static class FakePhanQuyenService extends PhanQuyenToaService {
        public FakePhanQuyenService() { super(null); }

        @Override
        public ToaNha layToaNhaNeuNhanVienDuocXem(NguoiDung nguoiDung, Long toaNhaId) {
            // Quản lý 21 chỉ quản lý toà 4
            if (nguoiDung.id() == 21L && toaNhaId != 4L) {
                throw new ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Không có quyền toà nhà này.");
            }
            // Người thuê 100 không có quyền nhân viên trên bất kỳ toà nào
            if (nguoiDung.vaiTro() == VaiTro.NGUOI_THUE) {
                throw new ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Chỉ nhân viên mới được xem.");
            }
            return new ToaNha(toaNhaId, "DEMO-" + toaNhaId, "Toà " + toaNhaId, "HN", 10, 25, 5, "MB", "123456", BigDecimal.valueOf(150000), false);
        }
    }

    private final FakeDiemDoRepo diemDoRepo = new FakeDiemDoRepo();
    private final FakeKyRepo kyRepo = new FakeKyRepo();
    private final FakeCanhBaoRepo canhBaoRepo = new FakeCanhBaoRepo();
    private final FakeDoiSoat doiSoatService = new FakeDoiSoat();
    private final FakePhanQuyenService phanQuyenService = new FakePhanQuyenService();
    private final FakeAuditRepo auditRepo = new FakeAuditRepo();

    private final DiemDoDungChungService service = new DiemDoDungChungService(
            diemDoRepo,
            doiSoatService,
            canhBaoRepo,
            kyRepo,
            phanQuyenService,
            auditRepo
    );

    private final NguoiDung chu = new NguoiDung(7L, "Phúc", "0999000011", "hash", VaiTro.CHU, TrangThaiNguoiDung.HOAT_DONG, 1, null);
    private final NguoiDung quanLyToa4 = new NguoiDung(21L, "Anh", "0999000021", "hash", VaiTro.QUAN_LY, TrangThaiNguoiDung.HOAT_DONG, 1, null);
    private final NguoiDung nguoiThue = new NguoiDung(100L, "Thành", "0999100001", "hash", VaiTro.NGUOI_THUE, TrangThaiNguoiDung.HOAT_DONG, 1, null);

    @Test
    @DisplayName("F01: Tenant cannot read common meter readings")
    void testTenantCannotReadMeterReadings() {
        assertThatThrownBy(() -> service.layChiSoTheoKy(nguoiThue, 4L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("403");
    }

    @Test
    @DisplayName("F01: Manager of building 4 cannot read common meter readings of building 3 (kyId=4)")
    void testManagerCannotReadOtherBuildingMeterReadings() {
        assertThatThrownBy(() -> service.layChiSoTheoKy(quanLyToa4, 4L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("403");
    }

    @Test
    @DisplayName("F01: Owner can read meter readings of their scoped building")
    void testOwnerCanReadMeterReadings() {
        var result = service.layChiSoTheoKy(chu, 4L);
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("F01: Recording meter with mismatching building-period relation returns 400")
    void testMismatchingBuildingPeriodRejected() {
        // Điểm đo 1 thuộc toà 3, nhưng gửi kỳ 9 thuộc toà 4
        var yeuCau = new DiemDoDungChungController.YeuCauGhiChiSo(
                1L, 9L, BigDecimal.valueOf(100), BigDecimal.valueOf(150),
                false, null, null, "Ghi test"
        );
        assertThatThrownBy(() -> service.ghiChiSo(chu, yeuCau))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400")
                .hasMessageContaining("Kỳ thanh toán không thuộc cùng toà nhà");
    }

    @Test
    @DisplayName("F01: Recording meter on closed period returns 400")
    void testClosedPeriodRejected() {
        var yeuCau = new DiemDoDungChungController.YeuCauGhiChiSo(
                1L, 99L, BigDecimal.valueOf(100), BigDecimal.valueOf(150),
                false, null, null, "Ghi test"
        );
        assertThatThrownBy(() -> service.ghiChiSo(chu, yeuCau))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400")
                .hasMessageContaining("đã chốt");
    }

    @Test
    @DisplayName("F01: Negative index or final < initial without replacement returns 400")
    void testInvalidIndexRejected() {
        var yeuCauAm = new DiemDoDungChungController.YeuCauGhiChiSo(
                1L, 4L, BigDecimal.valueOf(-10), BigDecimal.valueOf(150),
                false, null, null, "Ghi test"
        );
        assertThatThrownBy(() -> service.ghiChiSo(chu, yeuCauAm))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400");

        var yeuCauCuoiNhoHonDau = new DiemDoDungChungController.YeuCauGhiChiSo(
                1L, 4L, BigDecimal.valueOf(150), BigDecimal.valueOf(100),
                false, null, null, "Ghi test"
        );
        assertThatThrownBy(() -> service.ghiChiSo(chu, yeuCauCuoiNhoHonDau))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400")
                .hasMessageContaining("không được nhỏ hơn");
    }

    @Test
    @DisplayName("F01 & F07: Valid meter recording saves reading, writes audit log, and triggers anomaly alert")
    void testValidRecordingTriggersAuditAndAlert() {
        doiSoatService.triggerAnomaly = true;

        var yeuCau = new DiemDoDungChungController.YeuCauGhiChiSo(
                1L, 4L, BigDecimal.valueOf(1000), BigDecimal.valueOf(1100),
                false, null, null, "Ghi chuẩn"
        );
        service.ghiChiSo(chu, yeuCau);

        assertThat(diemDoRepo.chiSoList).hasSize(1);
        assertThat(auditRepo.audits).contains("3:GHI_CHI_SO_DUNG_CHUNG");
        assertThat(canhBaoRepo.canhBaoList).contains("3-1-TIEU_THU_TANG_CAO");
    }

    @Test
    @DisplayName("F01: Reconciliation endpoint verifies building-period relation")
    void testReconciliationVerifiesBuildingPeriodRelation() {
        // Toà 3 nhưng kỳ 9 (của toà 4)
        assertThatThrownBy(() -> service.doiSoat(chu, 3L, 9L, "DIEN"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400")
                .hasMessageContaining("không thuộc toà nhà");

        // Toà 3 với kỳ 4 hợp lệ
        var kqua = service.doiSoat(chu, 3L, 4L, "DIEN");
        assertThat(kqua.trangThai()).isEqualTo("KHOP_DOI_SOAT");
    }

    @Test
    @DisplayName("R02: Inherit previous closing index when chiSoDau is null")
    void testInheritPreviousClosingIndexWhenNull() {
        diemDoRepo.chiSoCuoiKyTruoc = BigDecimal.valueOf(950);
        var yeuCau = new DiemDoDungChungController.YeuCauGhiChiSo(
                1L, 4L, null, BigDecimal.valueOf(1050),
                false, null, null, "Kế thừa kỳ trước"
        );
        service.ghiChiSo(chu, yeuCau);

        assertThat(diemDoRepo.chiSoList).hasSize(1);
        var recorded = diemDoRepo.chiSoList.get(0);
        assertThat(recorded.chiSoDau()).isEqualByComparingTo("950");
        assertThat(recorded.chiSoCuoi()).isEqualByComparingTo("1050");
        assertThat(recorded.mucTieuThu()).isEqualByComparingTo("100");
    }

    @Test
    @DisplayName("R02: Reject when chiSoDau is null and no previous history exists")
    void testRejectWhenNullInitialIndexAndNoHistory() {
        diemDoRepo.chiSoCuoiKyTruoc = null;
        var yeuCau = new DiemDoDungChungController.YeuCauGhiChiSo(
                1L, 4L, null, BigDecimal.valueOf(1050),
                false, null, null, "Không có lịch sử"
        );
        assertThatThrownBy(() -> service.ghiChiSo(chu, yeuCau))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400")
                .hasMessageContaining("Chỉ số đầu là bắt buộc");
    }

    @Test
    @DisplayName("R05: Recording normal reading resolves existing new alert")
    void testNormalReadingResolvesAlert() {
        doiSoatService.triggerAnomaly = false;
        var yeuCau = new DiemDoDungChungController.YeuCauGhiChiSo(
                1L, 4L, BigDecimal.valueOf(1000), BigDecimal.valueOf(1040),
                false, null, null, "Bình thường"
        );
        service.ghiChiSo(chu, yeuCau);

        assertThat(canhBaoRepo.resolvedList).contains("1-4");
    }
}
