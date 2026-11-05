package com.prj1.ccm.nguoithue;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.CacheControl;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** FR-SEC-06/07: scoped owner and administrator, paginated, read-only audit search. */
@RestController
@RequestMapping("/api/nhat-ky-thao-tac")
public class NhatKyThaoTacController {
    private final JdbcTemplate jdbc;
    public NhatKyThaoTacController(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    public record Dong(Long id, Long nguoiDungId, String hoTen, String hanhDong, String doiTuong, String giaTriTruoc, String giaTriSau, String lyDo, String thoiDiem, Long toaNhaId) {}
    public record Trang(List<Dong> items, long total, int page, int size) {}

    @GetMapping
    public ResponseEntity<Trang> danhSach(@RequestParam(required = false) Long nguoiDungId, @RequestParam(required = false) String hanhDong,
                         @RequestParam(required = false) LocalDate tuNgay, @RequestParam(required = false) LocalDate denNgay,
                         @RequestParam(required = false) String doiTuong, @RequestParam(required = false) Long toaNhaId, @RequestParam(defaultValue = "0") int page,
                         @RequestParam(defaultValue = "50") int size, HttpServletRequest request) {
        NguoiDung user = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        if (user == null || (user.vaiTro() != VaiTro.QTHT && user.vaiTro() != VaiTro.CHU)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        if (page < 0 || page > 100000 || size < 1 || size > 200 || (tuNgay != null && denNgay != null && denNgay.isBefore(tuNgay))
                || tuNgay != null && (tuNgay.getYear() < 1900 || tuNgay.getYear() > 9998)
                || denNgay != null && (denNgay.getYear() < 1900 || denNgay.getYear() > 9998)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bộ lọc nhật ký không hợp lệ.");
        }
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        List<Object> args = new ArrayList<>();
        if (user.vaiTro() == VaiTro.CHU) {
            if (toaNhaId != null && !Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id=? AND toa_nha_id=?)", Boolean.class, user.id(), toaNhaId))) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            }
            where.append(" AND n.toa_nha_id IS NOT NULL AND EXISTS(SELECT 1 FROM PHAN_QUYEN_TOA pqt WHERE pqt.toa_nha_id=n.toa_nha_id AND pqt.nguoi_dung_id=?)");
            args.add(user.id());
        }
        if (toaNhaId != null) { where.append(" AND n.toa_nha_id=?"); args.add(toaNhaId); }
        if (nguoiDungId != null) { where.append(" AND n.nguoi_dung_id=?"); args.add(nguoiDungId); }
        if (hanhDong != null && !hanhDong.isBlank()) { where.append(" AND n.hanh_dong ILIKE ?"); args.add("%" + hanhDong.trim() + "%"); }
        if (doiTuong != null && !doiTuong.isBlank()) { where.append(" AND n.doi_tuong ILIKE ?"); args.add("%" + doiTuong.trim() + "%"); }
        if (tuNgay != null) { where.append(" AND n.thoi_diem>=?"); args.add(tuNgay.atStartOfDay()); }
        if (denNgay != null) { where.append(" AND n.thoi_diem<?"); args.add(denNgay.plusDays(1).atStartOfDay()); }
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM NHAT_KY_THAO_TAC n" + where, Long.class, args.toArray());
        args.add(size); args.add((long) page * size);
        List<Dong> items = jdbc.query("SELECT n.*,nd.ho_ten FROM NHAT_KY_THAO_TAC n JOIN NGUOI_DUNG nd ON nd.id=n.nguoi_dung_id" + where + " ORDER BY n.thoi_diem DESC,n.id DESC LIMIT ? OFFSET ?",
                (rs, n) -> new Dong(rs.getLong("id"), rs.getLong("nguoi_dung_id"), rs.getString("ho_ten"), rs.getString("hanh_dong"), rs.getString("doi_tuong"), rs.getString("gia_tri_truoc"), rs.getString("gia_tri_sau"), rs.getString("ly_do"), rs.getTimestamp("thoi_diem").toLocalDateTime().toString(), rs.getObject("toa_nha_id",Long.class)), args.toArray());
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(new Trang(items, total == null ? 0 : total, page, size));
    }
}
