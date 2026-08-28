package com.prj1.ccm.hopdong;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/hop-dong")
public class HopDongController {
    private static final String THONG_BAO_YEU_CAU_KHONG_HOP_LE = "Yêu cầu hợp đồng không hợp lệ.";
    private static final Set<String> KHOA_HOP_DONG_HOP_LE = Set.of(
            "phongId",
            "nguoiThueId",
            "ngayBatDau",
            "ngayKetThuc",
            "giaThue",
            "tienCoc",
            "soNgayBaoTruoc",
            "dichVuApDung"
    );
    private static final Set<String> KHOA_DICH_VU_HOP_LE = Set.of("dichVuId", "donGiaApDung");

    private final HopDongService hopDongService;

    public HopDongController(HopDongService hopDongService) {
        this.hopDongService = hopDongService;
    }

    /**
     * FR-TNT-04 lists one building's contracts and computes the BR-14 near-expiry label from the current date.
     * CR-012 keeps near expiry as a query-time view instead of a stored status value.
     *
     * @param toaNhaId the building identifier
     * @param trangThai the optional stored contract status filter
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the visible contracts for the requested building
     */
    @GetMapping
    public List<ThongTinHopDong> danhSach(
            @RequestParam Long toaNhaId,
            @RequestParam(required = false) TrangThaiHopDong trangThai,
            HttpServletRequest request
    ) {
        return hopDongService.danhSach(toaNhaId, trangThai, nguoiDungHienTai(request));
    }

    /**
     * FR-TNT-04 creates one rental contract without accepting a caller-supplied status field.
     * CR-005 starts every new contract at CHO_KY until a status action is performed.
     *
     * @param yeuCau the submitted contract payload
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the newly created contract
     */
    @PostMapping
    public ResponseEntity<ThongTinHopDong> tao(@RequestBody JsonNode yeuCau, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(hopDongService.tao(chuyenThanhYeuCau(yeuCau), nguoiDungHienTai(request)));
    }

    /**
     * FR-TNT-04 returns one contract together with its applied services and computed near-expiry flag.
     *
     * @param hopDongId the contract identifier
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the requested contract
     */
    @GetMapping("/{hopDongId}")
    public ThongTinHopDong chiTiet(@PathVariable Long hopDongId, HttpServletRequest request) {
        return hopDongService.chiTiet(hopDongId, nguoiDungHienTai(request));
    }

    /**
     * FR-TNT-04 and CR-005 record that the contract deposit has been received.
     *
     * @param hopDongId the contract identifier
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the updated contract
     */
    @PostMapping("/{hopDongId}/nhan-coc")
    public ThongTinHopDong nhanCoc(@PathVariable Long hopDongId, HttpServletRequest request) {
        return hopDongService.nhanCoc(hopDongId, nguoiDungHienTai(request));
    }

    /**
     * FR-TNT-04 and CR-012 activate a deposited contract through an explicit action instead of manual status editing.
     *
     * @param hopDongId the contract identifier
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the updated contract
     */
    @PostMapping("/{hopDongId}/kich-hoat")
    public ThongTinHopDong kichHoat(@PathVariable Long hopDongId, HttpServletRequest request) {
        return hopDongService.kichHoat(hopDongId, nguoiDungHienTai(request));
    }

    /**
     * FR-TNT-04 and CR-012 settle one contract through a dedicated action endpoint.
     *
     * @param hopDongId the contract identifier
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the updated contract
     */
    @PostMapping("/{hopDongId}/thanh-ly")
    public ThongTinHopDong thanhLy(@PathVariable Long hopDongId, HttpServletRequest request) {
        return hopDongService.thanhLy(hopDongId, nguoiDungHienTai(request));
    }

    private YeuCauHopDong chuyenThanhYeuCau(JsonNode yeuCau) {
        if (yeuCau == null || !yeuCau.isObject()) {
            throw khongHopLe();
        }
        for (String propertyName : yeuCau.propertyNames()) {
            if (!KHOA_HOP_DONG_HOP_LE.contains(propertyName)) {
                throw khongHopLe();
            }
        }
        return new YeuCauHopDong(
                layLongBatBuoc(yeuCau, "phongId"),
                layLongBatBuoc(yeuCau, "nguoiThueId"),
                layNgayBatBuoc(yeuCau, "ngayBatDau"),
                layNgayBatBuoc(yeuCau, "ngayKetThuc"),
                layBigDecimalBatBuoc(yeuCau, "giaThue"),
                layBigDecimalBatBuoc(yeuCau, "tienCoc"),
                layIntBatBuoc(yeuCau, "soNgayBaoTruoc"),
                layDichVuApDungBatBuoc(yeuCau)
        );
    }

    private List<YeuCauHopDongDichVu> layDichVuApDungBatBuoc(JsonNode yeuCau) {
        JsonNode node = yeuCau.get("dichVuApDung");
        if (node == null || !node.isArray()) {
            throw khongHopLe();
        }
        List<YeuCauHopDongDichVu> ketQua = new ArrayList<>();
        for (JsonNode item : node) {
            if (item == null || !item.isObject()) {
                throw khongHopLe();
            }
            for (String propertyName : item.propertyNames()) {
                if (!KHOA_DICH_VU_HOP_LE.contains(propertyName)) {
                    throw khongHopLe();
                }
            }
            ketQua.add(new YeuCauHopDongDichVu(
                    layLongBatBuoc(item, "dichVuId"),
                    layBigDecimalTuyChon(item, "donGiaApDung")
            ));
        }
        return List.copyOf(ketQua);
    }

    private Long layLongBatBuoc(JsonNode yeuCau, String tenTruong) {
        JsonNode node = yeuCau.get(tenTruong);
        if (node == null || node.isNull() || !node.canConvertToLong()) {
            throw khongHopLe();
        }
        return node.longValue();
    }

    private Integer layIntBatBuoc(JsonNode yeuCau, String tenTruong) {
        JsonNode node = yeuCau.get(tenTruong);
        if (node == null || node.isNull() || !node.canConvertToInt()) {
            throw khongHopLe();
        }
        return node.intValue();
    }

    private BigDecimal layBigDecimalBatBuoc(JsonNode yeuCau, String tenTruong) {
        JsonNode node = yeuCau.get(tenTruong);
        if (node == null || node.isNull()) {
            throw khongHopLe();
        }
        try {
            return new BigDecimal(node.textValue());
        } catch (NumberFormatException exception) {
            throw khongHopLe();
        }
    }

    private BigDecimal layBigDecimalTuyChon(JsonNode yeuCau, String tenTruong) {
        JsonNode node = yeuCau.get(tenTruong);
        if (node == null || node.isNull()) {
            return null;
        }
        try {
            return new BigDecimal(node.textValue());
        } catch (NumberFormatException exception) {
            throw khongHopLe();
        }
    }

    private LocalDate layNgayBatBuoc(JsonNode yeuCau, String tenTruong) {
        JsonNode node = yeuCau.get(tenTruong);
        if (node == null || node.isNull() || !node.isTextual()) {
            throw khongHopLe();
        }
        try {
            return LocalDate.parse(node.textValue());
        } catch (DateTimeParseException exception) {
            throw khongHopLe();
        }
    }

    private NguoiDung nguoiDungHienTai(HttpServletRequest request) {
        return (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
    }

    private ResponseStatusException khongHopLe() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE);
    }
}
