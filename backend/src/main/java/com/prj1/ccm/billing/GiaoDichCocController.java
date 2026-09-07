package com.prj1.ccm.billing;

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
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.net.URI;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Set;

@RestController
@RequestMapping("/api/hop-dong/{hopDongId}/giao-dich-coc")
public class GiaoDichCocController {
    private static final String THONG_BAO_YEU_CAU_KHONG_HOP_LE = "Yêu cầu thu tiền cọc không hợp lệ.";
    private static final Set<String> KHOA_HOP_LE = Set.of("soTien", "ngay", "lyDo");

    private final GiaoDichCocService giaoDichCocService;

    public GiaoDichCocController(GiaoDichCocService giaoDichCocService) {
        this.giaoDichCocService = giaoDichCocService;
    }

    /** FR-TNT-04, CR-009, BR-07, and US-09 record a deposit separately from recurring invoice lines. */
    @PostMapping
    public ResponseEntity<ThongTinGiaoDichCoc> thuCoc(
            @PathVariable Long hopDongId,
            @RequestBody JsonNode yeuCau,
            HttpServletRequest request
    ) {
        NguoiDung nguoiDung = nguoiDungHienTai(request);
        ThongTinGiaoDichCoc ketQua = giaoDichCocService.thuCoc(
                hopDongId,
                chuyenThanhYeuCau(yeuCau),
                nguoiDung
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .location(URI.create("/api/hop-dong/" + hopDongId + "/giao-dich-coc/" + ketQua.id()))
                .body(ketQua);
    }

    /** FR-TNT-04, CR-009, and BR-07 return the agreed deposit, collected total, balance, and receipt history. */
    @GetMapping
    public ThongTinTienCoc xem(@PathVariable Long hopDongId, HttpServletRequest request) {
        return giaoDichCocService.xem(hopDongId, nguoiDungHienTai(request));
    }

    private YeuCauThuCoc chuyenThanhYeuCau(JsonNode yeuCau) {
        if (yeuCau == null || !yeuCau.isObject()) {
            throw khongHopLe();
        }
        for (String propertyName : yeuCau.propertyNames()) {
            if (!KHOA_HOP_LE.contains(propertyName)) {
                throw khongHopLe();
            }
        }
        return new YeuCauThuCoc(
                layBigDecimalBatBuoc(yeuCau, "soTien"),
                layNgayBatBuoc(yeuCau, "ngay"),
                layChuoiTuyChon(yeuCau, "lyDo")
        );
    }

    private BigDecimal layBigDecimalBatBuoc(JsonNode yeuCau, String tenTruong) {
        JsonNode node = yeuCau.get(tenTruong);
        if (node == null || node.isNull() || !node.isTextual()) {
            throw khongHopLe();
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

    private String layChuoiTuyChon(JsonNode yeuCau, String tenTruong) {
        JsonNode node = yeuCau.get(tenTruong);
        if (node == null || node.isNull()) {
            return null;
        }
        if (!node.isTextual()) {
            throw khongHopLe();
        }
        return node.textValue();
    }

    private ResponseStatusException khongHopLe() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE);
    }

    private NguoiDung nguoiDungHienTai(HttpServletRequest request) {
        return (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
    }
}
