package com.prj1.ccm.dashboard;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.toanha.KyThanhToan;
import com.prj1.ccm.toanha.KyThanhToanRepository;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import com.prj1.ccm.toanha.ToaNha;
import com.prj1.ccm.toanha.ToaNhaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardChuService {
    private static final String TEN_TAT_CA_TOA = "Tất cả toà được phân quyền";

    private final DashboardChuRepository repository;
    private final PhanQuyenToaService phanQuyenToaService;
    private final DoiSoatDienNuocService doiSoatDienNuocService;
    private final KyThanhToanRepository kyThanhToanRepository;
    private final ToaNhaRepository toaNhaRepository;
    private final Clock clock;

    public DashboardChuService(
            DashboardChuRepository repository,
            PhanQuyenToaService phanQuyenToaService,
            DoiSoatDienNuocService doiSoatDienNuocService,
            KyThanhToanRepository kyThanhToanRepository,
            Clock clock
    ) {
        this(repository, phanQuyenToaService, doiSoatDienNuocService, kyThanhToanRepository, null, clock);
    }

    public DashboardChuService(
            DashboardChuRepository repository,
            PhanQuyenToaService phanQuyenToaService,
            DoiSoatDienNuocService doiSoatDienNuocService,
            KyThanhToanRepository kyThanhToanRepository,
            ToaNhaRepository toaNhaRepository,
            Clock clock
    ) {
        this.repository = repository;
        this.phanQuyenToaService = phanQuyenToaService;
        this.doiSoatDienNuocService = doiSoatDienNuocService;
        this.kyThanhToanRepository = kyThanhToanRepository;
        this.toaNhaRepository = toaNhaRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public ThongTinDashboardChu layDashboard(
            Long toaNhaId,
            String tuNgayStr,
            String denNgayStr,
            NguoiDung nguoiDung
    ) {
        kiemTraQuyenChu(nguoiDung);

        String tenToaNha = TEN_TAT_CA_TOA;
        if (toaNhaId != null) {
            ToaNha toaNha = phanQuyenToaService.layToaNhaNeuNguoiDungDuocXem(nguoiDung, toaNhaId);
            tenToaNha = toaNha.ten();
        }

        LocalDate homNay = LocalDate.now(clock);
        KhoangNgay khoangNgay = chuanHoaKhoangNgay(tuNgayStr, denNgayStr, homNay);

        // 1. Tài chính theo tháng
        List<DashboardChuRepository.TaiChinhThangRecord> taiChinhList = repository.findTaiChinhTheoThang(
                nguoiDung.id(),
                toaNhaId,
                khoangNgay.tuNgay(),
                khoangNgay.denNgay()
        );

        BigDecimal tongDoanhThuPhatHanh = BigDecimal.ZERO.setScale(2);
        BigDecimal tongThucThu = BigDecimal.ZERO.setScale(2);
        BigDecimal tongDaThuTheoHd = BigDecimal.ZERO.setScale(2);
        BigDecimal tongCongNo = BigDecimal.ZERO.setScale(2);

        List<TaiChinhTheoThangDto> taiChinhDtoList = new ArrayList<>();
        for (var tc : taiChinhList) {
            tongDoanhThuPhatHanh = tongDoanhThuPhatHanh.add(tc.doanhThuPhatHanh());
            tongThucThu = tongThucThu.add(tc.thucThu());
            tongDaThuTheoHd = tongDaThuTheoHd.add(tc.daThuTheoHoaDon());
            tongCongNo = tongCongNo.add(tc.congNo());

            taiChinhDtoList.add(new TaiChinhTheoThangDto(
                    tc.thang().toString(),
                    String.format("%02d/%d", tc.thang().getMonthValue(), tc.thang().getYear()),
                    tc.doanhThuPhatHanh(),
                    tc.thucThu(),
                    tc.daThuTheoHoaDon(),
                    tc.congNo()
            ));
        }

        // 2. Cơ cấu phòng
        var coCauPhongRecord = repository.layCoCauPhong(nguoiDung.id(), toaNhaId, homNay);
        CoCauPhongDto coCauPhong = new CoCauPhongDto(
                coCauPhongRecord.tongSoPhong(),
                coCauPhongRecord.dangThue(),
                coCauPhongRecord.tyLeDangThue(),
                coCauPhongRecord.trong(),
                coCauPhongRecord.tyLeTrong(),
                coCauPhongRecord.daCoc(),
                coCauPhongRecord.tyLeDaCoc(),
                coCauPhongRecord.dangSua(),
                coCauPhongRecord.tyLeDangSua(),
                coCauPhongRecord.ngungKhaiThac(),
                coCauPhongRecord.tyLeNgungKhaiThac()
        );

        // 3. Tuổi nợ
        var tuoiNoRecord = repository.layTuoiNo(nguoiDung.id(), toaNhaId, homNay);
        TuoiNoDto tuoiNo = new TuoiNoDto(
                new NhomTuoiNoDto(tuoiNoRecord.chuaDenHan().soLuong(), tuoiNoRecord.chuaDenHan().soTien()),
                new NhomTuoiNoDto(tuoiNoRecord.quaHan1Den7().soLuong(), tuoiNoRecord.quaHan1Den7().soTien()),
                new NhomTuoiNoDto(tuoiNoRecord.quaHan8Den30().soLuong(), tuoiNoRecord.quaHan8Den30().soTien()),
                new NhomTuoiNoDto(tuoiNoRecord.quaHanTren30().soLuong(), tuoiNoRecord.quaHanTren30().soTien())
        );

        int soHoaDonQuaHan = tuoiNoRecord.quaHan1Den7().soLuong()
                + tuoiNoRecord.quaHan8Den30().soLuong()
                + tuoiNoRecord.quaHanTren30().soLuong();

        // 4. So sánh các toà (chỉ trong danh sách tòa được cấp quyền)
        List<SoSanhToaNhaDto> soSanhToaNhaList = repository.laySoSanhToaNha(
                nguoiDung.id(),
                khoangNgay.tuNgay(),
                khoangNgay.denNgay(),
                homNay
        ).stream().map(r -> new SoSanhToaNhaDto(
                r.toaNhaId(),
                r.tenToaNha(),
                r.doanhThuPhatHanh(),
                r.thucThu(),
                r.congNo(),
                r.tyLeLapDay(),
                r.tongSoPhong(),
                r.soPhongDangThue(),
                r.chiPhiBaoTri()
        )).toList();

        // 5. Chi phí bảo trì theo tháng
        var chiPhiList = repository.layChiPhiBaoTriTheoThang(
                nguoiDung.id(),
                toaNhaId,
                khoangNgay.tuNgay(),
                khoangNgay.denNgay()
        );
        BigDecimal tongChiPhiBaoTri = BigDecimal.ZERO.setScale(2);
        List<ChiPhiBaoTriThangDto> chiPhiDtoList = new ArrayList<>();
        for (var cp : chiPhiList) {
            tongChiPhiBaoTri = tongChiPhiBaoTri.add(cp.chiPhi());
            chiPhiDtoList.add(new ChiPhiBaoTriThangDto(
                    cp.thang().toString(),
                    String.format("%02d/%d", cp.thang().getMonthValue(), cp.thang().getYear()),
                    cp.chiPhi(),
                    cp.soSuCo()
            ));
        }

        int soSuCoDangMo = repository.demSoSuCoDangMo(nguoiDung.id(), toaNhaId);

        // 6. Tỷ lệ lấp đầy lịch sử từ hợp đồng thực tế theo tháng
        List<DashboardChuRepository.LichSuLapDayThangRecord> lapDayRecords = repository.layLichSuLapDay(
                nguoiDung.id(),
                toaNhaId,
                khoangNgay.tuNgay(),
                khoangNgay.denNgay()
        );
        Map<String, DashboardChuRepository.LichSuLapDayThangRecord> mapLapDay = lapDayRecords.stream()
                .collect(Collectors.toMap(r -> String.format("%02d/%d", r.thang().getMonthValue(), r.thang().getYear()), r -> r, (a, b) -> a));

        List<DiemLapDayLichSuDto> tyLeLapDayLichSu = new ArrayList<>();
        for (var tc : taiChinhDtoList) {
            var ld = mapLapDay.get(tc.nhan());
            if (ld != null && ld.tongSoPhong() > 0) {
                tyLeLapDayLichSu.add(new DiemLapDayLichSuDto(tc.nhan(), ld.tyLe(), ld.dangThue(), ld.tongSoPhong(), true));
            } else {
                tyLeLapDayLichSu.add(new DiemLapDayLichSuDto(tc.nhan(), BigDecimal.ZERO.setScale(2), 0, 0, false));
            }
        }

        // 7. Đối soát điện nước & khu vực chung (theo toà được chọn, yêu cầu chọn toà cụ thể nếu chọn tất cả toà)
        DienNuocDungChungTongQuanDto dienNuocDungChung = layDienNuocDungChungTongQuan(toaNhaId, khoangNgay.denNgay());

        // 8. Tiêu thụ điện nước theo kỳ (truy vấn số liệu thật từ cơ sở dữ liệu)
        TieuThuDienNuocDto tieuThuDienNuoc = layTieuThuDienNuocTheoKy(nguoiDung.id(), toaNhaId, khoangNgay.tuNgay(), khoangNgay.denNgay(), taiChinhDtoList);

        // 9. KPI Card: Công nợ hiện tại lấy nhất quán với tổng nợ thực tế của tuổi nợ
        BigDecimal congNoHienTai = tuoiNo.chuaDenHan().soTien()
                .add(tuoiNo.quaHan1Den7().soTien())
                .add(tuoiNo.quaHan8Den30().soTien())
                .add(tuoiNo.quaHanTren30().soTien());

        int soHoaDonQuaHanHienTai = tuoiNo.quaHan1Den7().soLuong()
                + tuoiNo.quaHan8Den30().soLuong()
                + tuoiNo.quaHanTren30().soLuong();

        KpiChuDto kpi = new KpiChuDto(
                tongDoanhThuPhatHanh,
                tongThucThu,
                tongDaThuTheoHd,
                congNoHienTai,
                soHoaDonQuaHanHienTai,
                coCauPhong.tyLeDangThue(),
                coCauPhong.tongSo(),
                coCauPhong.dangThue(),
                coCauPhong.trong(),
                coCauPhong.dangSua(),
                tongChiPhiBaoTri,
                soSuCoDangMo
        );

        return new ThongTinDashboardChu(
                toaNhaId,
                tenToaNha,
                khoangNgay.tuNgay().toString(),
                khoangNgay.denNgay().toString(),
                OffsetDateTime.now(clock).toString(),
                kpi,
                taiChinhDtoList,
                coCauPhong,
                tyLeLapDayLichSu,
                soSanhToaNhaList,
                tieuThuDienNuoc,
                tuoiNo,
                chiPhiDtoList,
                dienNuocDungChung
        );
    }

    private DienNuocDungChungTongQuanDto layDienNuocDungChungTongQuan(Long toaNhaId, LocalDate denNgay) {
        if (toaNhaId == null) {
            return new DienNuocDungChungTongQuanDto(
                    List.of(),
                    new ThongTinDoiSoatDto(
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
            return new DienNuocDungChungTongQuanDto(
                    List.of(),
                    new ThongTinDoiSoatDto(
                            "CHUA_DU_DU_LIEU",
                            null, null, null, null,
                            "kWh", BigDecimal.ZERO.setScale(2), false,
                            "Toà nhà chưa có kỳ thanh toán nào."
                    ),
                    BigDecimal.ZERO.setScale(2)
            );
        }

        // Ưu tiên chọn kỳ ứng với khoảng ngày lọc, hoặc kỳ mới nhất
        KyThanhToan kyMucTieu = null;
        if (denNgay != null) {
            int thang = denNgay.getMonthValue();
            int nam = denNgay.getYear();
            for (KyThanhToan k : danhSachKy) {
                if (k.nam() == nam && k.thang() == thang) {
                    kyMucTieu = k;
                    break;
                }
            }
        }
        if (kyMucTieu == null) {
            kyMucTieu = danhSachKy.get(0);
        }

        DoiSoatDienNuocService.KetQuaDoiSoat ketQuaDoiSoat;
        try {
            ketQuaDoiSoat = doiSoatDienNuocService.doiSoatKy(toaNhaId, kyMucTieu.id(), "DIEN");
        } catch (Exception ex) {
            ketQuaDoiSoat = DoiSoatDienNuocService.KetQuaDoiSoat.chuaDuDuLieu("kWh", "Lỗi xử lý đối soát: " + ex.getMessage());
        }

        List<KhuVucTieuThuDto> khuVucList = ketQuaDoiSoat.chiTietKhuVuc().stream()
                .map(kv -> new KhuVucTieuThuDto(
                        kv.diemDoId(),
                        kv.maCongTo(),
                        kv.tenCongTo(),
                        kv.khuVuc(),
                        kv.donVi(),
                        kv.donGiaMua(),
                        kv.mucTieuThu(),
                        kv.chiPhi()
                )).toList();

        String tenToaNha = toaNhaRepository != null ? toaNhaRepository.findById(toaNhaId).map(ToaNha::ten).orElse("Toà nhà #" + toaNhaId) : "Toà nhà #" + toaNhaId;
        String tenKy = "Tháng " + kyMucTieu.thang() + "/" + kyMucTieu.nam();

        ThongTinDoiSoatDto doiSoatDto = new ThongTinDoiSoatDto(
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
                tenToaNha,
                kyMucTieu.id(),
                tenKy
        );

        return new DienNuocDungChungTongQuanDto(khuVucList, doiSoatDto, ketQuaDoiSoat.chiPhiUocTinh());
    }

    private TieuThuDienNuocDto layTieuThuDienNuocTheoKy(
            Long nguoiDungId,
            Long toaNhaId,
            LocalDate tuNgay,
            LocalDate denNgay,
            List<TaiChinhTheoThangDto> taiChinhList
    ) {
        List<DashboardChuRepository.TieuThuThangRecord> dienRecords = repository.layTieuThuTheoThang(nguoiDungId, toaNhaId, tuNgay, denNgay, true);
        List<DashboardChuRepository.TieuThuThangRecord> nuocRecords = repository.layTieuThuTheoThang(nguoiDungId, toaNhaId, tuNgay, denNgay, false);

        Map<String, DashboardChuRepository.TieuThuThangRecord> mapDien = dienRecords.stream()
                .collect(Collectors.toMap(r -> String.format("%02d/%d", r.thang().getMonthValue(), r.thang().getYear()), r -> r, (a, b) -> a));
        Map<String, DashboardChuRepository.TieuThuThangRecord> mapNuoc = nuocRecords.stream()
                .collect(Collectors.toMap(r -> String.format("%02d/%d", r.thang().getMonthValue(), r.thang().getYear()), r -> r, (a, b) -> a));

        List<DiemTieuThuKyDto> dien = new ArrayList<>();
        List<DiemTieuThuKyDto> nuoc = new ArrayList<>();

        for (var tc : taiChinhList) {
            var dRec = mapDien.get(tc.nhan());
            if (dRec != null && dRec.coDuLieu()) {
                dien.add(new DiemTieuThuKyDto(null, tc.nhan(), dRec.tieuThuPhong(), dRec.tieuThuChung(), dRec.tieuThuTong(), "kWh", dRec.coCongToTong(), true));
            } else {
                dien.add(new DiemTieuThuKyDto(null, tc.nhan(), null, null, null, "kWh", false, false));
            }

            var nRec = mapNuoc.get(tc.nhan());
            if (nRec != null && nRec.coDuLieu()) {
                nuoc.add(new DiemTieuThuKyDto(null, tc.nhan(), nRec.tieuThuPhong(), nRec.tieuThuChung(), nRec.tieuThuTong(), "m3", nRec.coCongToTong(), true));
            } else {
                nuoc.add(new DiemTieuThuKyDto(null, tc.nhan(), null, null, null, "m3", false, false));
            }
        }
        return new TieuThuDienNuocDto(dien, nuoc);
    }

    private void kiemTraQuyenChu(NguoiDung nguoiDung) {
        if (nguoiDung == null || nguoiDung.vaiTro() != VaiTro.CHU) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ chủ nhà mới có quyền truy cập dashboard này.");
        }
    }

    private KhoangNgay chuanHoaKhoangNgay(String tuNgayStr, String denNgayStr, LocalDate homNay) {
        LocalDate tuNgay;
        LocalDate denNgay;

        try {
            if (tuNgayStr != null && !tuNgayStr.isBlank()) {
                tuNgay = LocalDate.parse(tuNgayStr);
            } else {
                tuNgay = homNay.minusMonths(5).withDayOfMonth(1); // 6 tháng gần nhất
            }

            if (denNgayStr != null && !denNgayStr.isBlank()) {
                denNgay = LocalDate.parse(denNgayStr);
            } else {
                denNgay = homNay;
            }
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Định dạng ngày không hợp lệ.");
        }

        if (tuNgay.isAfter(denNgay)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Từ ngày không được sau Đến ngày.");
        }

        return new KhoangNgay(tuNgay, denNgay);
    }

    private record KhoangNgay(LocalDate tuNgay, LocalDate denNgay) {}

    // DTO records
    public record ThongTinDashboardChu(
            Long toaNhaId,
            String tenToaNha,
            String tuNgay,
            String denNgay,
            String thoiDiemCapNhat,
            KpiChuDto kpi,
            List<TaiChinhTheoThangDto> taiChinhTheoThang,
            CoCauPhongDto coCauPhong,
            List<DiemLapDayLichSuDto> tyLeLapDayLichSu,
            List<SoSanhToaNhaDto> soSanhToaNha,
            TieuThuDienNuocDto tieuThuDienNuoc,
            TuoiNoDto tuoiNo,
            List<ChiPhiBaoTriThangDto> chiPhiBaoTri,
            DienNuocDungChungTongQuanDto dienNuocDungChung
    ) {}

    public record KpiChuDto(
            BigDecimal doanhThuPhatHanh,
            BigDecimal thucThu,
            BigDecimal daThuHopDong,
            BigDecimal congNoHienTai,
            int soHoaDonQuaHan,
            BigDecimal tyLeLapDay,
            int tongSoPhong,
            int soPhongDangThue,
            int soPhongTrong,
            int soPhongDangSua,
            BigDecimal chiPhiBaoTri,
            int soSuCoDangMo
    ) {}

    public record TaiChinhTheoThangDto(
            String thang,
            String nhan,
            BigDecimal doanhThuPhatHanh,
            BigDecimal thucThu,
            BigDecimal daThuTheoHoaDon,
            BigDecimal congNo
    ) {}

    public record CoCauPhongDto(
            int tongSo,
            int dangThue,
            BigDecimal tyLeDangThue,
            int trong,
            BigDecimal tyLeTrong,
            int daCoc,
            BigDecimal tyLeDaCoc,
            int dangSua,
            BigDecimal tyLeDangSua,
            int ngung,
            BigDecimal tyLeNgung
    ) {}

    public record DiemLapDayLichSuDto(
            String ky,
            BigDecimal tyLe,
            int soPhongThue,
            int tongPhong,
            boolean duDuLieu
    ) {}

    public record SoSanhToaNhaDto(
            Long toaNhaId,
            String tenToaNha,
            BigDecimal doanhThuPhatHanh,
            BigDecimal thucThu,
            BigDecimal congNo,
            BigDecimal tyLeLapDay,
            int tongSoPhong,
            int soPhongDangThue,
            BigDecimal chiPhiBaoTri
    ) {}

    public record TieuThuDienNuocDto(
            List<DiemTieuThuKyDto> dien,
            List<DiemTieuThuKyDto> nuoc
    ) {}

    public record DiemTieuThuKyDto(
            Long kyId,
            String nhan,
            BigDecimal phong,
            BigDecimal dungChung,
            BigDecimal tong,
            String donVi,
            boolean coCongToTong,
            boolean coDuLieu
    ) {
        public DiemTieuThuKyDto(
                Long kyId,
                String nhan,
                BigDecimal phong,
                BigDecimal dungChung,
                BigDecimal tong,
                String donVi
        ) {
            this(kyId, nhan, phong, dungChung, tong, donVi, tong != null, phong != null || dungChung != null || tong != null);
        }
    }

    public record TuoiNoDto(
            NhomTuoiNoDto chuaDenHan,
            NhomTuoiNoDto quaHan1Den7,
            NhomTuoiNoDto quaHan8Den30,
            NhomTuoiNoDto quaHanTren30
    ) {}

    public record NhomTuoiNoDto(int soLuong, BigDecimal soTien) {}

    public record ChiPhiBaoTriThangDto(
            String thang,
            String nhan,
            BigDecimal chiPhi,
            int soSuCo
    ) {}

    public record DienNuocDungChungTongQuanDto(
            List<KhuVucTieuThuDto> khuVucChung,
            ThongTinDoiSoatDto doiSoat,
            BigDecimal chiPhiUocTinh
    ) {}

    public record KhuVucTieuThuDto(
            Long diemDoId,
            String maCongTo,
            String tenCongTo,
            String khuVuc,
            String donVi,
            BigDecimal donGiaMua,
            BigDecimal mucTieuThu,
            BigDecimal chiPhi
    ) {}

    public record ThongTinDoiSoatDto(
            String trangThai,
            BigDecimal mucTong,
            BigDecimal mucPhong,
            BigDecimal mucChungDoRieng,
            BigDecimal chenhLech,
            String donVi,
            BigDecimal nguongChoPhep,
            boolean vuotNguong,
            String ghiChu,
            Long toaNhaId,
            String tenToaNha,
            Long kyId,
            String tenKy
    ) {
        public ThongTinDoiSoatDto(
                String trangThai,
                BigDecimal mucTong,
                BigDecimal mucPhong,
                BigDecimal mucChungDoRieng,
                BigDecimal chenhLech,
                String donVi,
                BigDecimal nguongChoPhep,
                boolean vuotNguong,
                String ghiChu
        ) {
            this(trangThai, mucTong, mucPhong, mucChungDoRieng, chenhLech, donVi, nguongChoPhep, vuotNguong, ghiChu, null, null, null, null);
        }
    }
}

