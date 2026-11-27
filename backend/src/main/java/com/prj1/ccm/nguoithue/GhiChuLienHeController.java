package com.prj1.ccm.nguoithue;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Set;

/** Ghi chú liên hệ với người thuê (gọi/Zalo/gặp), chỉ CHU và QUAN_LY có toà trùng với người thuê. */
@RestController
@RequestMapping("/api/nguoi-thue/{nguoiThueId}/ghi-chu")
public class GhiChuLienHeController {
    private static final Set<String> KENH = Set.of("GOI", "ZALO", "GAP");
    private static final int TOI_DA = 1000;

    public record GhiChuLienHe(Long id, String kenh, String noiDung, String nguoiTao, Instant taoLuc) {
    }

    public record YeuCauGhiChu(String noiDung, String kenh) {
    }

    private final JdbcTemplate jdbc;
    private final NguoiThueRepository nguoiThueRepository;

    GhiChuLienHeController(JdbcTemplate jdbc, NguoiThueRepository nguoiThueRepository) {
        this.jdbc = jdbc;
        this.nguoiThueRepository = nguoiThueRepository;
    }

    @GetMapping
    public List<GhiChuLienHe> danhSach(@PathVariable Long nguoiThueId, HttpServletRequest request) {
        kiemTra(nguoiThueId, nguoiDung(request));
        return jdbc.query(
                """
                        SELECT g.id, g.kenh, g.noi_dung, nd.ho_ten, g.tao_luc
                        FROM GHI_CHU_LIEN_HE g JOIN NGUOI_DUNG nd ON nd.id = g.nguoi_tao_id
                        WHERE g.nguoi_thue_id = ? ORDER BY g.tao_luc DESC, g.id DESC
                        """,
                (rs, i) -> new GhiChuLienHe(rs.getLong(1), rs.getString(2), rs.getString(3), rs.getString(4),
                        rs.getObject(5, java.time.OffsetDateTime.class).toInstant()),
                nguoiThueId);
    }

    @PostMapping
    public GhiChuLienHe them(@PathVariable Long nguoiThueId, @RequestBody YeuCauGhiChu yeuCau, HttpServletRequest request) {
        NguoiDung nd = nguoiDung(request);
        kiemTra(nguoiThueId, nd);
        String noiDung = yeuCau == null || yeuCau.noiDung() == null ? "" : yeuCau.noiDung().trim();
        if (noiDung.isEmpty() || noiDung.length() > TOI_DA || yeuCau.kenh() == null || !KENH.contains(yeuCau.kenh())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần nội dung (tối đa 1000 ký tự) và kênh GOI, ZALO hoặc GAP");
        }
        Long id = jdbc.queryForObject(
                "INSERT INTO GHI_CHU_LIEN_HE(nguoi_thue_id, nguoi_tao_id, kenh, noi_dung) VALUES (?, ?, ?, ?) RETURNING id",
                Long.class, nguoiThueId, nd.id(), yeuCau.kenh(), noiDung);
        return jdbc.queryForObject(
                """
                        SELECT g.id, g.kenh, g.noi_dung, nd.ho_ten, g.tao_luc
                        FROM GHI_CHU_LIEN_HE g JOIN NGUOI_DUNG nd ON nd.id = g.nguoi_tao_id WHERE g.id = ?
                        """,
                (rs, i) -> new GhiChuLienHe(rs.getLong(1), rs.getString(2), rs.getString(3), rs.getString(4),
                        rs.getObject(5, java.time.OffsetDateTime.class).toInstant()),
                id);
    }

    private void kiemTra(Long nguoiThueId, NguoiDung nd) {
        if (nd == null || (nd.vaiTro() != VaiTro.CHU && nd.vaiTro() != VaiTro.QUAN_LY)
                || !nguoiThueRepository.coNguoiThueTrongPhamVi(nd.id(), nguoiThueId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private NguoiDung nguoiDung(HttpServletRequest request) {
        return (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
    }
}
