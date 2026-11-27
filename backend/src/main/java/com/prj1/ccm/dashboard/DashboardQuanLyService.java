package com.prj1.ccm.dashboard;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.toanha.KyThanhToan;
import com.prj1.ccm.toanha.KyThanhToanRepository;
import com.prj1.ccm.toanha.KyThanhToanService;
import com.prj1.ccm.toanha.TrangThaiKy;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import com.prj1.ccm.toanha.ToaNha;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Service
public class DashboardQuanLyService {
    private static final String TEN_TAT_CA_TOA_PHAN_CONG = "Tất cả toà được phân công";

    private final DashboardQuanLyRepository repository;
    private final DashboardChuRepository chuRepository;
    private final CanhBaoTieuThuRepository canhBaoRepository;
    private final DoiSoatDienNuocService doiSoatDienNuocService;
    private final KyThanhToanRepository kyThanhToanRepository;
    private final KyThanhToanService kyThanhToanService;
    private final PhanQuyenToaService phanQuyenToaService;
    private final Clock clock;

    public DashboardQuanLyService(
            DashboardQuanLyRepository repository,
            DashboardChuRepository chuRepository,
            CanhBaoTieuThuRepository canhBaoRepository,
            DoiSoatDienNuocService doiSoatDienNuocService,
            KyThanhToanRepository kyThanhToanRepository,
            KyThanhToanService kyThanhToanService,
            PhanQuyenToaService phanQuyenToaService,
            Clock clock
    ) {
        this.repository = repository;
        this.chuRepository = chuRepository;
        this.canhBaoRepository = canhBaoRepository;
        this.doiSoatDienNuocService = doiSoatDienNuocService;
        this.kyThanhToanRepository = kyThanhToanRepository;
        this.kyThanhToanService = kyThanhToanService;
        this.phanQuyenToaService = phanQuyenToaService;
        this.clock = clock;
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public ThongTinDashboardQuanLy layDashboard(
            Long toaNhaId,
            NguoiDung nguoiDung
    ) {
        kiemTraQuyenQuanLy(nguoiDung);

        String tenToaNha = TEN_TAT_CA_TOA_PHAN_CONG;
        if (toaNhaId != null) {
            ToaNha toaNha = phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, toaNhaId);
            tenToaNha = toaNha.ten();
        }

        LocalDate homNay = LocalDate.now(clock);

        // 1. Công nợ & Tuổi nợ
        var tuoiNoRecord = chuRepository.layTuoiNo(nguoiDung.id(), toaNhaId, homNay);
        BigDecimal khoanConPhaiThu = tuoiNoRecord.chuaDenHan().soTien()
                .add(tuoiNoRecord.quaHan1Den7().soTien())
                .add(tuoiNoRecord.quaHan8Den30().soTien())
                .add(tuoiNoRecord.quaHanTren30().soTien());

        int soHoaDonQuaHan = tuoiNoRecord.quaHan1Den7().soLuong()
                + tuoiNoRecord.quaHan8Den30().soLuong()
                + tuoiNoRecord.quaHanTren30().soLuong();

        BigDecimal tienQuaHan = tuoiNoRecord.quaHan1Den7().soTien()
                .add(tuoiNoRecord.quaHan8Den30().soTien())
                .add(tuoiNoRecord.quaHanTren30().soTien());

        DashboardChuService.TuoiNoDto tuoiNo = new DashboardChuService.TuoiNoDto(
                new DashboardChuService.NhomTuoiNoDto(tuoiNoRecord.chuaDenHan().soLuong(), tuoiNoRecord.chuaDenHan().soTien()),
                new DashboardChuService.NhomTuoiNoDto(tuoiNoRecord.quaHan1Den7().soLuong(), tuoiNoRecord.quaHan1Den7().soTien()),
                new DashboardChuService.NhomTuoiNoDto(tuoiNoRecord.quaHan8Den30().soLuong(), tuoiNoRecord.quaHan8Den30().soTien()),
                new DashboardChuService.NhomTuoiNoDto(tuoiNoRecord.quaHanTren30().soLuong(), tuoiNoRecord.quaHanTren30().soTien())
        );

        // 2. Cơ cấu phòng
        var coCauRecord = chuRepository.layCoCauPhong(nguoiDung.id(), toaNhaId, homNay);
        DashboardChuService.CoCauPhongDto coCauPhong = new DashboardChuService.CoCauPhongDto(
                coCauRecord.tongSoPhong(),
                coCauRecord.dangThue(),
                coCauRecord.tyLeDangThue(),
                coCauRecord.trong(),
                coCauRecord.tyLeTrong(),
                coCauRecord.daCoc(),
                coCauRecord.tyLeDaCoc(),
                coCauRecord.dangSua(),
                coCauRecord.tyLeDangSua(),
                coCauRecord.ngungKhaiThac(),
                coCauRecord.tyLeNgungKhaiThac()
        );

        // 3. Công tơ chưa ghi
        var congToChuaGhiData = repository.layCongToChuaGhi(nguoiDung.id(), toaNhaId);
        // Một nguồn với /ky-thanh-toan/:ky/thieu-chi-so: số phòng còn thiếu chỉ số ở các kỳ đang mở.
        int soChuaGhi = demPhongThieuChiSo(toaNhaId, nguoiDung);
        CongToChuaGhiSummaryDto congToChuaGhi = new CongToChuaGhiSummaryDto(
                congToChuaGhiData.kyHienTaiId(),
                congToChuaGhiData.tenKyHienTai(),
                congToChuaGhiData.soCongToDaGhi() + soChuaGhi,
                congToChuaGhiData.soCongToDaGhi(),
                soChuaGhi,
                congToChuaGhiData.danhSachChuaGhi().stream()
                        .map(d -> new DiemDoChuaGhiDto(
                                d.viTriId(),
                                d.tenViTri(),
                                d.toaNhaId(),
                                d.tenToaNha(),
                                d.tenDichVu(),
                                d.donVi(),
                                d.loaiDiemDo(),
                                d.kyId()
                        )).toList()
        );

        // 4. Cảnh báo điện nước đang mở
        List<CanhBaoTieuThuDto> canhBaoList = canhBaoRepository.findCanhBao(nguoiDung.id(), toaNhaId, null)
                .stream()
                .map(cb -> new CanhBaoTieuThuDto(
                        cb.id(),
                        cb.toaNhaId(),
                        cb.tenToaNha(),
                        cb.diemDoId(),
                        cb.tenCongTo(),
                        cb.phongId(),
                        cb.soPhong(),
                        cb.kyId(),
                        String.format("Kỳ %02d/%d", cb.thang(), cb.nam()),
                        cb.loaiDichVu(),
                        cb.loaiCanhBao(),
                        cb.mucTieuThuKyNay(),
                        cb.mucThamChieu(),
                        cb.mucTang(),
                        cb.tyLeTang(),
                        cb.lyDo(),
                        cb.trangThai(),
                        cb.hoTenNguoiXacNhan(),
                        cb.ghiChuXuLy(),
                        cb.thoiDiemTao() == null ? null : cb.thoiDiemTao().toString(),
                        "/ghi-chi-so?toaNhaId=" + cb.toaNhaId()
                )).toList();

        int soCanhBaoDangMo = canhBaoRepository.demCanhBaoDangMo(nguoiDung.id(), toaNhaId);
        int soSuCoCanXuLy = chuRepository.demSoSuCoDangMo(nguoiDung.id(), toaNhaId);

        // 5. Đối soát điện nước chung
        DashboardChuService.DienNuocDungChungTongQuanDto dienNuocDungChung = layDienNuocDungChung(toaNhaId);

        // 6. Lịch hẹn sắp tới
        List<LichHenSapToiDto> lichHenList = repository.findLichHenSapToi(nguoiDung.id(), toaNhaId)
                .stream()
                .map(lh -> new LichHenSapToiDto(
                        lh.id(),
                        lh.hoTen(),
                        lh.soDienThoai(),
                        lh.soPhong(),
                        lh.thoiGian(),
                        lh.loai(),
                        lh.trangThai()
                )).toList();

        // 7. Operational KPI Card
        KpiQuanLyDto kpi = new KpiQuanLyDto(
                khoanConPhaiThu,
                soHoaDonQuaHan,
                tienQuaHan,
                coCauPhong.dangThue(),
                coCauPhong.trong(),
                coCauPhong.dangSua(),
                coCauPhong.tongSo(),
                coCauPhong.tyLeDangThue(),
                soChuaGhi,
                soSuCoCanXuLy,
                soCanhBaoDangMo
        );

        return new ThongTinDashboardQuanLy(
                toaNhaId,
                tenToaNha,
                OffsetDateTime.now(clock).toString(),
                kpi,
                canhBaoList,
                coCauPhong,
                tuoiNo,
                congToChuaGhi,
                dienNuocDungChung,
                lichHenList
        );
    }

    private int demPhongThieuChiSo(Long toaNhaId, NguoiDung nguoiDung) {
        List<ToaNha> toaNhaList = toaNhaId == null
                ? phanQuyenToaService.danhSachToaNhaNguoiDungDuocXem(nguoiDung)
                : List.of(phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, toaNhaId));
        int tong = 0;
        for (ToaNha toaNha : toaNhaList) {
            for (KyThanhToan ky : kyThanhToanRepository.findByToaNhaId(toaNha.id())) {
                if (ky.trangThai() == TrangThaiKy.DANG_MO) {
                    tong += kyThanhToanService.danhSachPhongChuaGhiChiSo(toaNha.id(), ky.id(), nguoiDung).size();
                }
            }
        }
        return tong;
    }

    private DashboardChuService.DienNuocDungChungTongQuanDto layDienNuocDungChung(Long toaNhaId) {
        if (toaNhaId == null) {
            return new DashboardChuService.DienNuocDungChungTongQuanDto(
                    List.of(),
                    new DashboardChuService.ThongTinDoiSoatDto(
                            "CHON_TOA_NHA",
                            null, null, null, null,
                            "kWh", BigDecimal.ZERO.setScale(2), false,
                            "Vui lòng chọn một toà nhà cụ thể để xem chi tiết đối soát điện nước."
                    ),
                    BigDecimal.ZERO.setScale(2)
            );
        }

        var danhSachKy = kyThanhToanRepository.findByToaNhaId(toaNhaId);
        if (danhSachKy.isEmpty()) {
            return new DashboardChuService.DienNuocDungChungTongQuanDto(
                    List.of(),
                    new DashboardChuService.ThongTinDoiSoatDto(
                            "CHUA_DU_DU_LIEU",
                            null, null, null, null,
                            "kWh", BigDecimal.ZERO.setScale(2), false,
                            "Toà nhà chưa có kỳ thanh toán nào."
                    ),
                    BigDecimal.ZERO.setScale(2)
            );
        }

        KyThanhToan kyMoiNhat = danhSachKy.get(0);
        DoiSoatDienNuocService.KetQuaDoiSoat ketQuaDoiSoat;
        try {
            ketQuaDoiSoat = doiSoatDienNuocService.doiSoatKy(toaNhaId, kyMoiNhat.id(), "DIEN");
        } catch (Exception ex) {
            ketQuaDoiSoat = DoiSoatDienNuocService.KetQuaDoiSoat.chuaDuDuLieu("kWh", "Lỗi xử lý đối soát: " + ex.getMessage());
        }

        List<DashboardChuService.KhuVucTieuThuDto> khuVucList = ketQuaDoiSoat.chiTietKhuVuc().stream()
                .map(kv -> new DashboardChuService.KhuVucTieuThuDto(
                        kv.diemDoId(),
                        kv.maCongTo(),
                        kv.tenCongTo(),
                        kv.khuVuc(),
                        kv.donVi(),
                        kv.donGiaMua(),
                        kv.mucTieuThu(),
                        kv.chiPhi()
                )).toList();

        String tenKy = "Tháng " + kyMoiNhat.thang() + "/" + kyMoiNhat.nam();
        DashboardChuService.ThongTinDoiSoatDto doiSoatDto = new DashboardChuService.ThongTinDoiSoatDto(
                ketQuaDoiSoat.trangThai(),
                ketQuaDoiSoat.mucTong(),
                ketQuaDoiSoat.mucPhong(),
                ketQuaDoiSoat.mucChungDoRieng(),
                ketQuaDoiSoat.chenhLech(),
                ketQuaDoiSoat.donVi(),
                ketQuaDoiSoat.nguongChoPhep(),
                ketQuaDoiSoat.vuotNguong(),
                ketQuaDoiSoat.ghiChu(),
                toaNhaId,
                null,
                kyMoiNhat.id(),
                tenKy
        );

        return new DashboardChuService.DienNuocDungChungTongQuanDto(khuVucList, doiSoatDto, ketQuaDoiSoat.chiPhiUocTinh());
    }

    private void kiemTraQuyenQuanLy(NguoiDung nguoiDung) {
        if (nguoiDung == null || (nguoiDung.vaiTro() != VaiTro.QUAN_LY && nguoiDung.vaiTro() != VaiTro.CHU)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền truy cập dashboard quản lý.");
        }
    }

    // DTO records
    public record ThongTinDashboardQuanLy(
            Long toaNhaId,
            String tenToaNha,
            String thoiDiemCapNhat,
            KpiQuanLyDto kpi,
            List<CanhBaoTieuThuDto> canhBaoDienNuoc,
            DashboardChuService.CoCauPhongDto coCauPhong,
            DashboardChuService.TuoiNoDto tuoiNo,
            CongToChuaGhiSummaryDto congToChuaGhi,
            DashboardChuService.DienNuocDungChungTongQuanDto dienNuocDungChung,
            List<LichHenSapToiDto> lichHenSapToi
    ) {}

    public record KpiQuanLyDto(
            BigDecimal khoanConPhaiThu,
            int soHoaDonQuaHan,
            BigDecimal tienQuaHan,
            int soPhongDangThue,
            int soPhongTrong,
            int soPhongDangSua,
            int tongSoPhong,
            BigDecimal tyLeLapDay,
            int soCongToChuaGhi,
            int soSuCoCanXuLy,
            int soCanhBaoDienNuocDangMo
    ) {}

    public record CanhBaoTieuThuDto(
            Long id,
            Long toaNhaId,
            String tenToaNha,
            Long diemDoId,
            String tenDiemDo,
            Long phongId,
            String soPhong,
            Long kyId,
            String tenKy,
            String loaiDichVu,
            String loaiCanhBao,
            BigDecimal mucTieuThuKyNay,
            BigDecimal mucThamChieu,
            BigDecimal mucTang,
            BigDecimal tyLeTang,
            String lyDo,
            String trangThai,
            String nguoiXacNhan,
            String ghiChuXuLy,
            String thoiDiemTao,
            String duongDanHanhDong
    ) {}

    public record CongToChuaGhiSummaryDto(
            Long kyHienTaiId,
            String tenKyHienTai,
            int tongSoCongTo,
            int soCongToDaGhi,
            int soCongToChuaGhi,
            List<DiemDoChuaGhiDto> danhSachChuaGhi
    ) {}

    public record DiemDoChuaGhiDto(
            Long viTriId,
            String tenViTri,
            Long toaNhaId,
            String tenToaNha,
            String tenDichVu,
            String donVi,
            String loaiDiemDo,
            Long kyId
    ) {}

    public record LichHenSapToiDto(
            Long id,
            String hoTen,
            String soDienThoai,
            String soPhong,
            String thoiGian,
            String loai,
            String trangThai
    ) {}
}

