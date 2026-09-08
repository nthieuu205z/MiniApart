package com.prj1.ccm.portal;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.billing.HoaDonChiTietService;
import com.prj1.ccm.billing.ThongTinHoaDonChiTiet;
import com.prj1.ccm.billing.ThongTinHoaDonLichSu;
import com.prj1.ccm.billing.ThongTinBieuDoTieuThu;
import com.prj1.ccm.hopdong.HopDongService;
import com.prj1.ccm.hopdong.ThongTinHopDong;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/cong")
public class CongNguoiThueController {
    private final HoaDonChiTietService hoaDonChiTietService;
    private final HopDongService hopDongService;

    public CongNguoiThueController(HoaDonChiTietService hoaDonChiTietService, HopDongService hopDongService) {
        this.hoaDonChiTietService = hoaDonChiTietService;
        this.hopDongService = hopDongService;
    }

    /**
     * FR-POR-01 returns the latest issued invoice belonging to the signed-in tenant, including an explicit empty state.
     * FR-POR-04 derives the tenant scope from the authenticated account rather than a request parameter.
     *
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the latest own invoice or a descriptive empty state
     */
    @GetMapping("/hoa-don-moi-nhat")
    public ThongTinHoaDonMoiNhat hoaDonMoiNhat(HttpServletRequest request) {
        NguoiDung nguoiDung = nguoiDungHienTai(request);
        return hoaDonChiTietService.hoaDonMoiNhatCuaNguoiThue(nguoiDung)
                .map(ThongTinHoaDonMoiNhat::coHoaDon)
                .orElseGet(ThongTinHoaDonMoiNhat::rong);
    }

    /**
     * FR-POR-03 lists all available invoice periods for the authenticated tenant, newest period first.
     * FR-POR-04 derives the scope from the authenticated tenant relationship and never from a client id.
     *
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the tenant's own invoice history, or an empty list when no period exists yet
     */
    @GetMapping("/hoa-don")
    public List<ThongTinHoaDonLichSu> lichSuHoaDon(HttpServletRequest request) {
        return hoaDonChiTietService.lichSuCuaNguoiThue(nguoiDungHienTai(request));
    }

    /**
     * FR-POR-05 returns the latest meter-consumption periods as separate electricity and water series.
     * FR-POR-04 derives the scope from the authenticated tenant and never accepts a room id from the client.
     *
     * @param soKy the requested number of periods, limited to the ticket's maximum of twelve
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return own electricity and water readings for the requested periods
     */
    @GetMapping("/tieu-thu")
    public ThongTinBieuDoTieuThu tieuThu(
            @RequestParam(defaultValue = "12") int soKy,
            HttpServletRequest request
    ) {
        return hoaDonChiTietService.tieuThuCuaNguoiThue(nguoiDungHienTai(request), soKy);
    }

    /**
     * FR-POR-02 and FR-POR-04 return one hand-recomputable invoice only when it belongs to the signed-in tenant.
     * Meter photos in the response remain 15-minute signed links from the existing attachment service.
     *
     * @param hoaDonId the guessable invoice identifier supplied by the client
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the complete own invoice representation
     */
    @GetMapping("/hoa-don/{hoaDonId}")
    public ThongTinHoaDonChiTiet chiTietHoaDon(@PathVariable Long hoaDonId, HttpServletRequest request) {
        return hoaDonChiTietService.chiTietCuaNguoiThue(hoaDonId, nguoiDungHienTai(request));
    }

    /**
     * FR-POR-07 lists the signed-in tenant's current and historical contracts, including query-time expiry fields.
     * FR-POR-04 ensures the list is scoped by the tenant relationship in the authenticated account.
     *
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the tenant's own contracts
     */
    @GetMapping("/hop-dong")
    public List<ThongTinHopDong> danhSachHopDong(HttpServletRequest request) {
        return hopDongService.danhSachCuaNguoiThue(nguoiDungHienTai(request));
    }

    /**
     * FR-POR-04 returns a historical contract only when the identifier belongs to the signed-in tenant.
     *
     * @param hopDongId the guessable contract identifier supplied by the client
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the complete own contract representation
     */
    @GetMapping("/hop-dong/{hopDongId}")
    public ThongTinHopDong chiTietHopDong(@PathVariable Long hopDongId, HttpServletRequest request) {
        return hopDongService.chiTietCuaNguoiThue(hopDongId, nguoiDungHienTai(request));
    }

    private NguoiDung nguoiDungHienTai(HttpServletRequest request) {
        return (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
    }
}
