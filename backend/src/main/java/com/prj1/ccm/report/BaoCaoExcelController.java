package com.prj1.ccm.report;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/** FR-RPT-04 exports the exact DTOs and filters used by the report screens. */
@RestController
@RequestMapping("/api/bao-cao")
public class BaoCaoExcelController {
    private static final MediaType XLSX = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    private final TongQuanBaoCaoService tongQuan;
    private final CongNoBaoCaoService congNo;
    private final TieuThuBaoCaoService tieuThu;
    private final ChiPhiBaoTriBaoCaoService chiPhi;

    public BaoCaoExcelController(TongQuanBaoCaoService tongQuan, CongNoBaoCaoService congNo,
                                 TieuThuBaoCaoService tieuThu, ChiPhiBaoTriBaoCaoService chiPhi) {
        this.tongQuan = tongQuan;
        this.congNo = congNo;
        this.tieuThu = tieuThu;
        this.chiPhi = chiPhi;
    }

    /** FR-RPT-01/FR-RPT-02/FR-RPT-04 reuses the scoped financial overview calculation. */
    @GetMapping("/tong-quan/xuat-excel")
    public ResponseEntity<byte[]> tongQuan(@RequestParam(required = false) Long toaNhaId,
            @RequestParam(required = false) String tuNgay, @RequestParam(required = false) String denNgay,
            HttpServletRequest request) {
        ThongTinTongQuanBaoCao data = tongQuan.layTongQuan(toaNhaId, tuNgay, denNgay, user(request));
        List<List<?>> rows = rows("Tổng quan", data.tinhLuc(), data.toaNhaId(), data.tuNgay(), data.denNgay());
        ThongTinKpiTongQuan kpi = data.kpi();
        rows.add(row("Doanh thu phát hành", "Đã thu", "Công nợ", "Tỷ lệ lấp đầy (%)", "Tổng phòng", "Đang thuê", "Phòng trống", "Sự cố đang mở"));
        rows.add(row(tien(kpi.doanhThuPhatHanh()), tien(kpi.daThu()), tien(kpi.congNo()), tien(kpi.tyLeLapDay()), kpi.tongSoPhong(), kpi.soPhongDangThue(), kpi.soPhongTrong(), kpi.soSuCoDangMo()));
        rows.add(row("Tháng", "Doanh thu phát hành", "Đã thu", "Công nợ"));
        for (ThongTinBaoCaoTheoThang month : data.theoThang()) rows.add(row(month.nhan(), tien(month.doanhThuPhatHanh()), tien(month.daThu()), tien(month.congNo())));
        return file("tong-quan", rows);
    }

    /** FR-RPT-02/FR-RPT-03/FR-RPT-04 retains the server's overdue sorting and exact amounts. */
    @GetMapping("/cong-no/xuat-excel")
    public ResponseEntity<byte[]> congNo(@RequestParam(required = false) Long toaNhaId, HttpServletRequest request) {
        ThongTinCongNoBaoCao data = congNo.layCongNo(toaNhaId, user(request));
        List<List<?>> rows = rows("Công nợ", data.tinhLuc(), data.toaNhaId(), null, null);
        rows.add(row("Mã hoá đơn", "Toà nhà", "Phòng", "Người thuê", "Ngày phát hành", "Hạn thanh toán", "Tổng tiền", "Đã thu", "Còn lại", "Ngày quá hạn", "Hợp đồng", "Kỳ"));
        for (ThongTinKhoanNoBaoCao debt : data.congNo()) rows.add(row(debt.maHoaDon(), debt.tenToaNha(), debt.soPhong(), debt.hoTenNguoiThue(), debt.ngayPhatHanh(), debt.hanThanhToan(), tien(debt.tongTien()), tien(debt.daThu()), tien(debt.conLai()), debt.soNgayQuaHan(), debt.hopDongId(), debt.kyId()));
        return file("cong-no", rows);
    }

    /** FR-RPT-02/FR-RPT-04/FR-RPT-05 leaves missing meter readings blank, never zero. */
    @GetMapping("/tieu-thu/xuat-excel")
    public ResponseEntity<byte[]> tieuThu(@RequestParam(required = false) Long toaNhaId,
            @RequestParam(required = false) Long phongId, @RequestParam(required = false) Long kyId, HttpServletRequest request) {
        ThongTinTieuThuBaoCao data = tieuThu.layTieuThu(toaNhaId, phongId, kyId, user(request));
        List<List<?>> rows = rows("Tiêu thụ điện nước", data.tinhLuc(), data.toaNhaId(), null, null);
        rows.add(row("Phòng đã lọc", data.phongId(), "Kỳ đã lọc", data.kyId()));
        rows.add(row("Kỳ", "Từ ngày", "Đến ngày", "Toà nhà", "Phòng", "Dịch vụ", "Đơn vị", "Chỉ số đầu", "Chỉ số cuối", "Cuối công tơ cũ", "Đầu công tơ mới", "Mức tiêu thụ", "Trạng thái"));
        for (ThongTinDongTieuThuBaoCao meter : data.cacDong()) rows.add(row(meter.nhanKy(), meter.tuNgay(), meter.denNgay(), meter.tenToaNha(), meter.soPhong(), meter.tenDichVu(), meter.donVi(), tien(meter.chiSoDau()), tien(meter.chiSoCuoi()), tien(meter.chiSoCuoiCongToCu()), tien(meter.chiSoDauCongToMoi()), tien(meter.mucTieuThu()), meter.coDuLieu() ? "Đã ghi" : "Chưa có dữ liệu"));
        return file("tieu-thu", rows);
    }

    /** FR-RPT-02/FR-RPT-04/FR-RPT-08 shares the maintenance filters and totals with the UI. */
    @GetMapping("/chi-phi-bao-tri/xuat-excel")
    public ResponseEntity<byte[]> chiPhi(@RequestParam(required = false) Long toaNhaId,
            @RequestParam(required = false) Long phongId, @RequestParam String tuNgay, @RequestParam String denNgay, HttpServletRequest request) {
        ThongTinChiPhiBaoTriBaoCao data = chiPhi.layChiPhi(toaNhaId, phongId, tuNgay, denNgay, user(request));
        List<List<?>> rows = rows("Chi phí bảo trì", data.tinhLuc(), data.toaNhaId(), data.tuNgay(), data.denNgay());
        rows.add(row("Phòng đã lọc", data.phongId(), "Chủ nhà chịu", tien(data.tongChiPhiChuNha()), "Người thuê chịu", tien(data.tongChiPhiNguoiThue())));
        rows.add(row("Mã yêu cầu", "Toà nhà", "Phòng", "Hạng mục", "Tháng", "Trạng thái", "Chi phí", "Bên chịu", "Trạng thái chi phí", "Tạo lúc"));
        for (ThongTinDongChiPhiBaoTriBaoCao repair : data.cacDong()) rows.add(row(repair.yeuCauId(), repair.tenToaNha(), repair.soPhong(), repair.hangMuc(), repair.nhanThang(), repair.tenTrangThai(), tien(repair.chiPhi()), repair.benChiuChiPhi(), repair.tenTrangThaiChiPhi(), repair.taoLuc()));
        return file("chi-phi-bao-tri", rows);
    }

    private NguoiDung user(HttpServletRequest request) { return (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE); }
    private static BigDecimal tien(String value) { return value == null ? null : new BigDecimal(value); }
    private static List<?> row(Object... values) { return Arrays.asList(values); }
    private static List<List<?>> rows(String title, String timestamp, Long building, String from, String to) {
        List<List<?>> rows = new ArrayList<>();
        rows.add(row(title));
        rows.add(row("Tính lúc", timestamp));
        rows.add(row("Toà nhà đã lọc", building == null ? "Tất cả toà được phân quyền" : building));
        if (from != null) rows.add(row("Từ ngày", from, "Đến ngày", to));
        return rows;
    }
    private static ResponseEntity<byte[]> file(String name, List<List<?>> rows) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).contentType(XLSX)
                .header("Content-Disposition", "attachment; filename=bao-cao-" + name + ".xlsx")
                .body(XlsxBaoCao.viet(rows));
    }
}
