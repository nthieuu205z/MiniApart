package com.prj1.ccm.nguoithue;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Set;

@RestController
@RequestMapping("/api/nguoi-thue")
public class NguoiThueController {
    private static final String THONG_BAO_YEU_CAU_KHONG_HOP_LE = "Yêu cầu không hợp lệ";
    private static final Set<String> KHOA_HOP_LE = Set.of("hoTen", "ngaySinh", "soDienThoai", "soGiayTo", "queQuan");

    private final NguoiThueService nguoiThueService;

    public NguoiThueController(NguoiThueService nguoiThueService) {
        this.nguoiThueService = nguoiThueService;
    }

    /**
     * FR-TNT-01 lists tenant profiles and lets the manager search by tenant name or phone number.
     *
     * @param q the optional search text for tenant name or phone number
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the tenant profile list with masked document numbers
     */
    @GetMapping
    public java.util.List<ThongTinNguoiThue> danhSach(
            @RequestParam(required = false) String q,
            HttpServletRequest request
    ) {
        return nguoiThueService.danhSach(q, nguoiDungHienTai(request));
    }

    /**
     * FR-TNT-01 creates one tenant profile for later contract and residency flows.
     *
     * @param yeuCau the submitted tenant profile data
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the newly created tenant profile with the document number masked
     */
    @PostMapping
    public ResponseEntity<ThongTinNguoiThue> tao(@RequestBody JsonNode yeuCau, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(nguoiThueService.tao(chuyenThanhYeuCau(yeuCau), nguoiDungHienTai(request)));
    }

    /**
     * FR-TNT-01 returns one tenant profile after the user explicitly asks to reveal the full document number.
     * FR-SEC-07 records the sensitive reveal in the audit log.
     *
     * @param nguoiThueId the tenant profile identifier
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the requested tenant profile with the full document number
     */
    @GetMapping("/{nguoiThueId}")
    public ThongTinNguoiThue chiTiet(@PathVariable Long nguoiThueId, HttpServletRequest request) {
        return nguoiThueService.chiTiet(nguoiThueId, nguoiDungHienTai(request));
    }

    /**
     * FR-TNT-01 updates one existing tenant profile without placing the document number in the URL.
     *
     * @param nguoiThueId the tenant profile identifier
     * @param yeuCau the submitted tenant profile data
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the updated tenant profile with the document number masked
     */
    @PutMapping("/{nguoiThueId}")
    public ThongTinNguoiThue capNhat(
            @PathVariable Long nguoiThueId,
            @RequestBody JsonNode yeuCau,
            HttpServletRequest request
    ) {
        return nguoiThueService.capNhat(nguoiThueId, chuyenThanhYeuCau(yeuCau), nguoiDungHienTai(request));
    }

    private NguoiDung nguoiDungHienTai(HttpServletRequest request) {
        return (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
    }

    private YeuCauNguoiThue chuyenThanhYeuCau(JsonNode yeuCau) {
        if (yeuCau == null || !yeuCau.isObject()) {
            throw khongHopLe();
        }

        for (String propertyName : yeuCau.propertyNames()) {
            if (!KHOA_HOP_LE.contains(propertyName)) {
                throw khongHopLe();
            }
        }

        return new YeuCauNguoiThue(
                layTextBatBuoc(yeuCau, "hoTen"),
                layNgayBatBuoc(yeuCau, "ngaySinh"),
                layTextBatBuoc(yeuCau, "soDienThoai"),
                layTextBatBuoc(yeuCau, "soGiayTo"),
                layTextBatBuoc(yeuCau, "queQuan")
        );
    }

    private String layTextBatBuoc(JsonNode yeuCau, String tenTruong) {
        JsonNode node = yeuCau.get(tenTruong);
        if (node == null || node.isNull() || !node.isTextual()) {
            throw khongHopLe();
        }
        return node.textValue();
    }

    private LocalDate layNgayBatBuoc(JsonNode yeuCau, String tenTruong) {
        try {
            return LocalDate.parse(layTextBatBuoc(yeuCau, tenTruong));
        } catch (DateTimeParseException exception) {
            throw khongHopLe();
        }
    }

    private ResponseStatusException khongHopLe() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE);
    }
}
