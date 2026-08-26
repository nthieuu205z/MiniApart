package com.prj1.ccm.nguoidung;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/nguoi-dung")
public class QuanLyNguoiDungController {
    private final QuanLyNguoiDungService quanLyNguoiDungService;

    public QuanLyNguoiDungController(QuanLyNguoiDungService quanLyNguoiDungService) {
        this.quanLyNguoiDungService = quanLyNguoiDungService;
    }

    /**
     * FR-AUT-06 returns the account list for the system administrator's management screen.
     *
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the list of managed accounts and their assigned buildings
     */
    @GetMapping
    public List<ThongTinQuanLyNguoiDung> danhSach(HttpServletRequest request) {
        return quanLyNguoiDungService.danhSach(nguoiDungHienTai(request));
    }

    /**
     * FR-AUT-06 returns a single account for editing on the management screen.
     *
     * @param nguoiDungId the account identifier
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the requested account detail
     */
    @GetMapping("/{nguoiDungId}")
    public ThongTinQuanLyNguoiDung chiTiet(@PathVariable Long nguoiDungId, HttpServletRequest request) {
        return quanLyNguoiDungService.chiTiet(nguoiDungId, nguoiDungHienTai(request));
    }

    /**
     * FR-AUT-06 creates a new account without accepting a creator-known raw password.
     *
     * @param yeuCau the submitted account data
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the newly created account
     */
    @PostMapping
    public ResponseEntity<ThongTinQuanLyNguoiDung> tao(
            @RequestBody JsonNode yeuCau,
            HttpServletRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(quanLyNguoiDungService.tao(chuyenThanhYeuCau(yeuCau), nguoiDungHienTai(request)));
    }

    /**
     * FR-AUT-06 updates an existing account's profile and building assignments.
     *
     * @param nguoiDungId the account identifier
     * @param yeuCau the submitted account data
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the updated account
     */
    @PutMapping("/{nguoiDungId}")
    public ThongTinQuanLyNguoiDung capNhat(
            @PathVariable Long nguoiDungId,
            @RequestBody JsonNode yeuCau,
            HttpServletRequest request
    ) {
        return quanLyNguoiDungService.capNhat(nguoiDungId, chuyenThanhYeuCau(yeuCau), nguoiDungHienTai(request));
    }

    /**
     * FR-AUT-06 locks an account and revokes any active token version immediately.
     *
     * @param nguoiDungId the account identifier
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the locked account
     */
    @PostMapping("/{nguoiDungId}/khoa")
    public ThongTinQuanLyNguoiDung khoa(@PathVariable Long nguoiDungId, HttpServletRequest request) {
        return quanLyNguoiDungService.khoa(nguoiDungId, nguoiDungHienTai(request));
    }

    private NguoiDung nguoiDungHienTai(HttpServletRequest request) {
        return (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
    }

    private YeuCauQuanLyNguoiDung chuyenThanhYeuCau(JsonNode yeuCau) {
        if (yeuCau == null || !yeuCau.isObject()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Yêu cầu không hợp lệ");
        }

        Set<String> khoaHopLe = Set.of("hoTen", "soDienThoai", "vaiTro", "toaNhaIds");
        List<String> khoaLa = new ArrayList<>();
        yeuCau.propertyNames().forEach(khoa -> {
            if (!khoaHopLe.contains(khoa)) {
                khoaLa.add(khoa);
            }
        });
        if (!khoaLa.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Yêu cầu không hợp lệ");
        }

        String hoTen = layTextBatBuoc(yeuCau, "hoTen");
        String soDienThoai = layTextBatBuoc(yeuCau, "soDienThoai");
        String vaiTroText = layTextBatBuoc(yeuCau, "vaiTro");
        VaiTro vaiTro;
        try {
            vaiTro = VaiTro.valueOf(vaiTroText);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Yêu cầu không hợp lệ", exception);
        }

        List<Long> toaNhaIds = new ArrayList<>();
        JsonNode toaNhaIdsNode = yeuCau.get("toaNhaIds");
        if (toaNhaIdsNode != null && !toaNhaIdsNode.isNull()) {
            if (!toaNhaIdsNode.isArray()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Yêu cầu không hợp lệ");
            }
            for (JsonNode toaNhaIdNode : toaNhaIdsNode) {
                if (!toaNhaIdNode.isIntegralNumber()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Yêu cầu không hợp lệ");
                }
                toaNhaIds.add(toaNhaIdNode.longValue());
            }
        }

        return new YeuCauQuanLyNguoiDung(hoTen, soDienThoai, vaiTro, toaNhaIds);
    }

    private String layTextBatBuoc(JsonNode yeuCau, String tenTruong) {
        JsonNode node = yeuCau.get(tenTruong);
        if (node == null || node.isNull() || !node.isTextual()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Yêu cầu không hợp lệ");
        }
        return node.textValue();
    }
}
