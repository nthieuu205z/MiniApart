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

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/hop-dong/{hopDongId}/nguoi-o-cung")
public class NguoiOCungController {
    private static final Set<String> KHOA_HOP_LE = Set.of("nguoiThueId", "quanHe", "tuNgay", "denNgay");
    private static final String THONG_BAO_YEU_CAU_KHONG_HOP_LE = "Yêu cầu người ở cùng không hợp lệ.";

    private final NguoiOCungService nguoiOCungService;

    public NguoiOCungController(NguoiOCungService nguoiOCungService) {
        this.nguoiOCungService = nguoiOCungService;
    }

    /** FR-TNT-02 returns the full temporal occupant source for one contract. */
    @GetMapping
    public List<ThongTinNguoiOCung> danhSach(@PathVariable Long hopDongId, HttpServletRequest request) {
        return nguoiOCungService.danhSach(hopDongId, nguoiDungHienTai(request));
    }

    /** FR-TNT-02 creates an occupant interval, including the representative tenant profile when selected. */
    @PostMapping
    public ResponseEntity<ThongTinThemNguoiOCung> tao(
            @PathVariable Long hopDongId,
            @RequestBody JsonNode yeuCau,
            HttpServletRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                nguoiOCungService.tao(hopDongId, chuyenThanhYeuCau(yeuCau), nguoiDungHienTai(request))
        );
    }

    /** FR-TNT-03 counts occupants on an inclusive date, so denNgay remains occupied on that date. */
    @GetMapping("/so-luong")
    public ThongTinSoNguoiO soLuong(
            @PathVariable Long hopDongId,
            @RequestParam LocalDate ngay,
            HttpServletRequest request
    ) {
        return nguoiOCungService.soLuong(hopDongId, ngay, nguoiDungHienTai(request));
    }

    private YeuCauNguoiOCung chuyenThanhYeuCau(JsonNode yeuCau) {
        if (yeuCau == null || !yeuCau.isObject()) {
            throw khongHopLe();
        }
        for (String propertyName : yeuCau.propertyNames()) {
            if (!KHOA_HOP_LE.contains(propertyName)) {
                throw khongHopLe();
            }
        }
        return new YeuCauNguoiOCung(
                layLong(yeuCau, "nguoiThueId"),
                layChuoi(yeuCau, "quanHe"),
                layNgay(yeuCau, "tuNgay", false),
                layNgay(yeuCau, "denNgay", true)
        );
    }

    private Long layLong(JsonNode yeuCau, String tenTruong) {
        JsonNode node = yeuCau.get(tenTruong);
        if (node == null || node.isNull() || !node.canConvertToLong()) {
            throw khongHopLe();
        }
        return node.longValue();
    }

    private String layChuoi(JsonNode yeuCau, String tenTruong) {
        JsonNode node = yeuCau.get(tenTruong);
        if (node == null || node.isNull() || !node.isTextual()) {
            throw khongHopLe();
        }
        return node.textValue();
    }

    private LocalDate layNgay(JsonNode yeuCau, String tenTruong, boolean tuyChon) {
        JsonNode node = yeuCau.get(tenTruong);
        if (node == null || node.isNull()) {
            if (tuyChon) {
                return null;
            }
            throw khongHopLe();
        }
        if (!node.isTextual()) {
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
