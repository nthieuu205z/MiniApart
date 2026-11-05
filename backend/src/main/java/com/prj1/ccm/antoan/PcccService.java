package com.prj1.ccm.antoan;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.nguoithue.NhatKyThaoTacRepository;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

/** FR-SEC-01/02/03: private safety records, equipment and periodic inspections within a building. */
@Service
public class PcccService {
    private static final Set<String> PHAN_LOAI = Set.of("THONG_TIN_CO_SO", "PHUONG_AN_THOAT_NAN", "BIEN_BAN_KIEM_TRA", "THIET_BI", "BAO_HIEM");
    private final JdbcTemplate jdbc;
    private final PhanQuyenToaService phanQuyen;
    private final NhatKyThaoTacRepository nhatKy;
    private final ObjectMapper mapper;
    private final Clock clock;

    public PcccService(JdbcTemplate jdbc, PhanQuyenToaService phanQuyen, NhatKyThaoTacRepository nhatKy, ObjectMapper mapper, Clock clock) {
        this.jdbc = jdbc; this.phanQuyen = phanQuyen; this.nhatKy = nhatKy; this.mapper = mapper; this.clock = clock;
    }

    public record HoSo(Long id, String phanLoai, String ten, String tenTep, String loaiNoiDung, String taoLuc) {}
    public record ThietBi(Long id, String ten, String viTri, LocalDate hanKiemDinh) {}
    public record YeuCauThietBi(String ten, String viTri, LocalDate hanKiemDinh) {}
    public record HangMuc(String ten, Boolean dat, String ghiChu) {}
    public record KiemTra(Long id, LocalDate ngayKiemTra, List<HangMuc> hangMuc, boolean dat) {}
    public record YeuCauKiemTra(LocalDate ngayKiemTra, List<HangMuc> hangMuc) {}
    public record LichKiemTra(Integer chuKyThang, LocalDate ngayKiemTraTiep) {}
    public record TongQuan(int chuKyThang, LocalDate ngayKiemTraTiep, int soViecDenHan, List<HoSo> hoSo, List<ThietBi> thietBi, List<KiemTra> kiemTra) {}
    public record Tep(String tenTep, String loaiNoiDung, byte[] duLieu) {}

    @Transactional(readOnly = true)
    public TongQuan lay(Long toaId, NguoiDung user) {
        kiemTraQuyen(toaId, user, false);
        LichKiemTra lich = jdbc.queryForObject("SELECT pccc_chu_ky_thang, pccc_ngay_kiem_tra_tiep FROM TOA_NHA WHERE id = ?",
                (rs, n) -> new LichKiemTra(rs.getInt(1), rs.getObject(2, LocalDate.class)), toaId);
        List<HoSo> hoSo = jdbc.query("SELECT id, phan_loai, ten, ten_tep, loai_noi_dung, tao_luc FROM PCCC_HO_SO WHERE toa_nha_id = ? ORDER BY tao_luc DESC, id DESC",
                (rs, n) -> new HoSo(rs.getLong(1), rs.getString(2), rs.getString(3), rs.getString(4), rs.getString(5), rs.getTimestamp(6).toInstant().toString()), toaId);
        List<ThietBi> thietBi = jdbc.query("SELECT id, ten, vi_tri, han_kiem_dinh FROM PCCC_THIET_BI WHERE toa_nha_id = ? ORDER BY han_kiem_dinh, id",
                (rs, n) -> new ThietBi(rs.getLong(1), rs.getString(2), rs.getString(3), rs.getObject(4, LocalDate.class)), toaId);
        List<KiemTra> kiemTra = jdbc.query("SELECT id, ngay_kiem_tra, hang_muc, dat FROM PCCC_KIEM_TRA WHERE toa_nha_id = ? ORDER BY ngay_kiem_tra DESC, id DESC LIMIT 100",
                (rs, n) -> new KiemTra(rs.getLong(1), rs.getObject(2, LocalDate.class), docHangMuc(rs.getString(3)), rs.getBoolean(4)), toaId);
        return new TongQuan(lich.chuKyThang(), lich.ngayKiemTraTiep(), demViecDenHan(toaId, LocalDate.now(clock)), hoSo, thietBi, kiemTra);
    }

    /** FR-NTF-01 includes equipment due within 30 days and periodic inspections due today. */
    public int demViecDenHan(Long toaId, LocalDate homNay) {
        Integer soLuong = jdbc.queryForObject("""
                SELECT (SELECT COUNT(*) FROM PCCC_THIET_BI WHERE toa_nha_id = ? AND han_kiem_dinh <= ?)
                     + (SELECT COUNT(*) FROM TOA_NHA WHERE id = ? AND pccc_ngay_kiem_tra_tiep <= ?)
                """, Integer.class, toaId, homNay.plusDays(30), toaId, homNay);
        return soLuong == null ? 0 : soLuong;
    }

    @Transactional
    public Long themHoSo(Long toaId, String phanLoai, String ten, MultipartFile tep, NguoiDung user) {
        kiemTraQuyen(toaId, user, true);
        if (!PHAN_LOAI.contains(phanLoai == null ? "" : phanLoai)) throw loi("Phân loại hồ sơ không hợp lệ.");
        String tenHopLe = chuoi(ten, 255, "Tên hồ sơ");
        if (tep == null || tep.isEmpty() || tep.getSize() > 5L * 1024 * 1024) throw loi("Tệp phải có dữ liệu và không vượt quá 5 MB.");
        byte[] bytes;
        try { bytes = tep.getBytes(); } catch (IOException ex) { throw loi("Không thể đọc tệp tải lên."); }
        String mime = mime(bytes);
        String tenTep = tep.getOriginalFilename() == null ? "ho-so" : tep.getOriginalFilename().replace('\\', '/');
        tenTep = tenTep.substring(tenTep.lastIndexOf('/') + 1).replaceAll("[\\r\\n\\p{Cntrl}]", "_");
        if (tenTep.isBlank()) tenTep = "ho-so";
        if (tenTep.length() > 255) tenTep = tenTep.substring(tenTep.length() - 255);
        Long id = jdbc.queryForObject("INSERT INTO PCCC_HO_SO(toa_nha_id, phan_loai, ten, ten_tep, loai_noi_dung, du_lieu, nguoi_tao_id) VALUES (?,?,?,?,?,?,?) RETURNING id",
                Long.class, toaId, phanLoai, tenHopLe, tenTep, mime, bytes, user.id());
        nhatKy.ghi(user.id(), "THEM_HO_SO_PCCC", "PCCC_HO_SO:" + id, null, "toaNhaId=" + toaId + ";phanLoai=" + phanLoai);
        return id;
    }

    @Transactional(readOnly = true)
    public Tep docTep(Long toaId, Long id, NguoiDung user) {
        kiemTraQuyen(toaId, user, false);
        return jdbc.query("SELECT ten_tep, loai_noi_dung, du_lieu FROM PCCC_HO_SO WHERE toa_nha_id = ? AND id = ?",
                (rs, n) -> new Tep(rs.getString(1), rs.getString(2), rs.getBytes(3)), toaId, id).stream().findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @Transactional
    public Long luuThietBi(Long toaId, Long id, YeuCauThietBi yeuCau, NguoiDung user) {
        kiemTraQuyen(toaId, user, true);
        if (yeuCau == null || yeuCau.hanKiemDinh() == null) throw loi("Nhập hạn kiểm định thiết bị.");
        String ten = chuoi(yeuCau.ten(), 255, "Tên thiết bị");
        String viTri = chuoi(yeuCau.viTri(), 500, "Vị trí thiết bị");
        String truoc = null;
        if (id == null) {
            id = jdbc.queryForObject("INSERT INTO PCCC_THIET_BI(toa_nha_id,ten,vi_tri,han_kiem_dinh) VALUES (?,?,?,?) RETURNING id", Long.class, toaId, ten, viTri, yeuCau.hanKiemDinh());
        } else {
            truoc = jdbc.query("SELECT ten, vi_tri, han_kiem_dinh FROM PCCC_THIET_BI WHERE id = ? AND toa_nha_id = ? FOR UPDATE",
                    (rs, n) -> rs.getString(1) + ";" + rs.getString(2) + ";" + rs.getString(3), id, toaId).stream().findFirst()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
            jdbc.update("UPDATE PCCC_THIET_BI SET ten=?,vi_tri=?,han_kiem_dinh=? WHERE id=? AND toa_nha_id=?", ten, viTri, yeuCau.hanKiemDinh(), id, toaId);
        }
        nhatKy.ghi(user.id(), "LUU_THIET_BI_PCCC", "PCCC_THIET_BI:" + id, truoc, ten + ";" + viTri + ";" + yeuCau.hanKiemDinh());
        return id;
    }

    @Transactional
    public Long ghiKiemTra(Long toaId, YeuCauKiemTra yeuCau, NguoiDung user) {
        kiemTraQuyen(toaId, user, true);
        if (yeuCau == null || yeuCau.ngayKiemTra() == null || yeuCau.ngayKiemTra().isAfter(LocalDate.now(clock))
                || yeuCau.hangMuc() == null || yeuCau.hangMuc().isEmpty() || yeuCau.hangMuc().size() > 50) throw loi("Nhập ngày kiểm tra đã diễn ra và từ 1 đến 50 hạng mục.");
        for (HangMuc muc : yeuCau.hangMuc()) {
            if (muc == null || muc.dat() == null) throw loi("Ghi kết quả cho từng hạng mục kiểm tra.");
            chuoi(muc.ten(), 255, "Tên hạng mục");
            if (muc.ghiChu() != null && muc.ghiChu().length() > 2000) throw loi("Ghi chú hạng mục tối đa 2000 ký tự.");
        }
        Integer chuKy = jdbc.queryForObject("SELECT pccc_chu_ky_thang FROM TOA_NHA WHERE id = ? FOR UPDATE", Integer.class, toaId);
        boolean dat = yeuCau.hangMuc().stream().allMatch(muc -> Boolean.TRUE.equals(muc.dat()));
        Long id = jdbc.queryForObject("INSERT INTO PCCC_KIEM_TRA(toa_nha_id, ngay_kiem_tra, hang_muc, dat, nguoi_tao_id) VALUES (?,?,?,?,?) RETURNING id",
                Long.class, toaId, yeuCau.ngayKiemTra(), mapper.writeValueAsString(yeuCau.hangMuc()), dat, user.id());
        // An old report must not move the current next inspection backwards.
        jdbc.update("UPDATE TOA_NHA SET pccc_ngay_kiem_tra_tiep=GREATEST(pccc_ngay_kiem_tra_tiep, ?) WHERE id=?", yeuCau.ngayKiemTra().plusMonths(chuKy), toaId);
        nhatKy.ghi(user.id(), "GHI_KIEM_TRA_PCCC", "PCCC_KIEM_TRA:" + id, null, "toaNhaId=" + toaId + ";dat=" + dat);
        return id;
    }

    @Transactional
    public void luuLich(Long toaId, LichKiemTra lich, NguoiDung user) {
        kiemTraQuyen(toaId, user, true);
        if (lich == null || lich.chuKyThang() == null || lich.chuKyThang() < 1 || lich.chuKyThang() > 24 || lich.ngayKiemTraTiep() == null) throw loi("Chu kỳ kiểm tra phải từ 1 đến 24 tháng và có ngày kiểm tra tiếp.");
        String truoc = jdbc.queryForObject("SELECT pccc_chu_ky_thang || ';' || pccc_ngay_kiem_tra_tiep FROM TOA_NHA WHERE id = ? FOR UPDATE", String.class, toaId);
        jdbc.update("UPDATE TOA_NHA SET pccc_chu_ky_thang=?, pccc_ngay_kiem_tra_tiep=? WHERE id=?", lich.chuKyThang(), lich.ngayKiemTraTiep(), toaId);
        nhatKy.ghi(user.id(), "DOI_LICH_PCCC", "TOA_NHA:" + toaId, truoc, lich.toString());
    }

    private void kiemTraQuyen(Long toaId, NguoiDung user, boolean ghi) {
        if (ghi && (user == null || user.vaiTro() != VaiTro.CHU)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        phanQuyen.layToaNhaNeuNhanVienDuocXem(user, toaId);
    }

    private List<HangMuc> docHangMuc(String json) {
        return List.of(mapper.readValue(json, HangMuc[].class));
    }

    private String chuoi(String value, int max, String ten) {
        if (value == null || value.isBlank() || value.trim().length() > max) throw loi(ten + " không được trống và tối đa " + max + " ký tự.");
        return value.trim();
    }

    private String mime(byte[] bytes) {
        if (bytes.length >= 5 && new String(bytes, 0, 5, StandardCharsets.US_ASCII).equals("%PDF-")) return "application/pdf";
        if (bytes.length >= 8 && bytes[0] == (byte) 0x89 && bytes[1] == 'P' && bytes[2] == 'N' && bytes[3] == 'G'
                && bytes[4] == 13 && bytes[5] == 10 && bytes[6] == 26 && bytes[7] == 10) return "image/png";
        if (bytes.length >= 3 && bytes[0] == (byte) 0xff && bytes[1] == (byte) 0xd8 && bytes[2] == (byte) 0xff) return "image/jpeg";
        throw loi("Chỉ nhận hồ sơ PDF, ảnh PNG hoặc JPEG.");
    }

    private ResponseStatusException loi(String message) { return new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
}
