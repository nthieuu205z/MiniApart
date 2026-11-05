package com.prj1.ccm.hopdong;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public class HopDongHoSoRepository {
    private final JdbcTemplate jdbcTemplate;

    public HopDongHoSoRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<HopDongHoSo> findLatestByHopDongId(Long hopDongId) {
        String sql = """
                SELECT id, hop_dong_id, revision, trang_thai_tai_lieu, mau_hop_dong_id, mau_phien_ban, tieu_de,
                       ngay_lap, dia_diem_lap, muc_dich_thue, pham_vi_su_dung, ngay_nhan_phong,
                       phuong_thuc_thanh_toan, ky_thanh_toan_thang, han_thanh_toan_ngay, tai_khoan_nhan_tien,
                       dieu_kien_dieu_chinh_gia, bien_ban_ban_giao_id,
                       ben_a_loai_chu_the, ben_a_ten_chu_the, ben_a_dinh_danh, ben_a_dia_chi, ben_a_dien_thoai,
                       ben_a_email, ben_a_nguoi_ky, ben_a_chuc_vu, ben_a_tu_cach_ky, ben_a_can_cu_uy_quyen,
                       ben_a_don_vi_quan_ly,
                       ben_b_ho_ten, ben_b_ngay_sinh, ben_b_loai_giay_to, ben_b_so_giay_to, ben_b_ngay_cap,
                       ben_b_noi_cap, ben_b_thuong_tru, ben_b_lien_he, ben_b_dien_thoai, ben_b_email,
                       bds_ten_toa_nha, bds_dia_chi_toa_nha, bds_so_phong, bds_tang, bds_dien_tich,
                       dieu_khoan_tuy_bien, snapshot_dich_vu_json, snapshot_tai_san_json, snapshot_nguoi_o_cung_json,
                       chot_boi_nguoi_dung_id, thoi_diem_chot, ghi_nhan_ky_boi_id, ngay_ky, thoi_diem_ghi_nhan_ky,
                       ghi_chu_ky, file_scan_dinh_kem, tao_luc, cap_nhat_luc,
                       so_nguoi_toi_da, so_ngay_bao_truoc_gia_han, so_ngay_hoan_coc, khung_gio_yen_tinh
                FROM HOP_DONG_HO_SO
                WHERE hop_dong_id = ?
                ORDER BY revision DESC
                LIMIT 1
                """;
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, this::mapRow, hopDongId));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<HopDongHoSo> findByHopDongIdAndRevision(Long hopDongId, int revision) {
        String sql = """
                SELECT id, hop_dong_id, revision, trang_thai_tai_lieu, mau_hop_dong_id, mau_phien_ban, tieu_de,
                       ngay_lap, dia_diem_lap, muc_dich_thue, pham_vi_su_dung, ngay_nhan_phong,
                       phuong_thuc_thanh_toan, ky_thanh_toan_thang, han_thanh_toan_ngay, tai_khoan_nhan_tien,
                       dieu_kien_dieu_chinh_gia, bien_ban_ban_giao_id,
                       ben_a_loai_chu_the, ben_a_ten_chu_the, ben_a_dinh_danh, ben_a_dia_chi, ben_a_dien_thoai,
                       ben_a_email, ben_a_nguoi_ky, ben_a_chuc_vu, ben_a_tu_cach_ky, ben_a_can_cu_uy_quyen,
                       ben_a_don_vi_quan_ly,
                       ben_b_ho_ten, ben_b_ngay_sinh, ben_b_loai_giay_to, ben_b_so_giay_to, ben_b_ngay_cap,
                       ben_b_noi_cap, ben_b_thuong_tru, ben_b_lien_he, ben_b_dien_thoai, ben_b_email,
                       bds_ten_toa_nha, bds_dia_chi_toa_nha, bds_so_phong, bds_tang, bds_dien_tich,
                       dieu_khoan_tuy_bien, snapshot_dich_vu_json, snapshot_tai_san_json, snapshot_nguoi_o_cung_json,
                       chot_boi_nguoi_dung_id, thoi_diem_chot, ghi_nhan_ky_boi_id, ngay_ky, thoi_diem_ghi_nhan_ky,
                       ghi_chu_ky, file_scan_dinh_kem, tao_luc, cap_nhat_luc,
                       so_nguoi_toi_da, so_ngay_bao_truoc_gia_han, so_ngay_hoan_coc, khung_gio_yen_tinh
                FROM HOP_DONG_HO_SO
                WHERE hop_dong_id = ? AND revision = ?
                """;
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, this::mapRow, hopDongId, revision));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Long insert(HopDongHoSo hoSo) {
        String sql = """
                INSERT INTO HOP_DONG_HO_SO (
                    hop_dong_id, revision, trang_thai_tai_lieu, mau_hop_dong_id, mau_phien_ban, tieu_de,
                    ngay_lap, dia_diem_lap, muc_dich_thue, pham_vi_su_dung, ngay_nhan_phong,
                    phuong_thuc_thanh_toan, ky_thanh_toan_thang, han_thanh_toan_ngay, tai_khoan_nhan_tien,
                    dieu_kien_dieu_chinh_gia, bien_ban_ban_giao_id,
                    ben_a_loai_chu_the, ben_a_ten_chu_the, ben_a_dinh_danh, ben_a_dia_chi, ben_a_dien_thoai,
                    ben_a_email, ben_a_nguoi_ky, ben_a_chuc_vu, ben_a_tu_cach_ky, ben_a_can_cu_uy_quyen,
                    ben_a_don_vi_quan_ly,
                    ben_b_ho_ten, ben_b_ngay_sinh, ben_b_loai_giay_to, ben_b_so_giay_to, ben_b_ngay_cap,
                    ben_b_noi_cap, ben_b_thuong_tru, ben_b_lien_he, ben_b_dien_thoai, ben_b_email,
                    bds_ten_toa_nha, bds_dia_chi_toa_nha, bds_so_phong, bds_tang, bds_dien_tich,
                    dieu_khoan_tuy_bien, snapshot_dich_vu_json, snapshot_tai_san_json, snapshot_nguoi_o_cung_json,
                    chot_boi_nguoi_dung_id, thoi_diem_chot, ghi_nhan_ky_boi_id, ngay_ky, thoi_diem_ghi_nhan_ky,
                    ghi_chu_ky, file_scan_dinh_kem,
                    so_nguoi_toi_da, so_ngay_bao_truoc_gia_han, so_ngay_hoan_coc, khung_gio_yen_tinh
                ) VALUES (
                    ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?,
                    ?, ?, ?, ?
                ) RETURNING id
                """;
        return jdbcTemplate.queryForObject(
                sql,
                Long.class,
                hoSo.hopDongId(),
                hoSo.revision(),
                hoSo.trangThaiTaiLieu(),
                hoSo.mauHopDongId(),
                hoSo.mauPhienBan(),
                hoSo.tieuDe(),
                hoSo.ngayLap() != null ? Date.valueOf(hoSo.ngayLap()) : Date.valueOf(java.time.LocalDate.now()),
                hoSo.diaDiemLap(),
                hoSo.mucDichThue(),
                hoSo.phamViSuDung(),
                hoSo.ngayNhanPhong() != null ? Date.valueOf(hoSo.ngayNhanPhong()) : null,
                hoSo.phuongThucThanhToan(),
                hoSo.kyThanhToanThang(),
                hoSo.hanThanhToanNgay(),
                hoSo.taiKhoanNhanTien(),
                hoSo.dieuKienDieuChinhGia(),
                hoSo.bienBanBanGiaoId(),
                hoSo.benALoaiChuThe(),
                hoSo.benATenChuThe(),
                hoSo.benADinhDanh(),
                hoSo.benADiaChi(),
                hoSo.benADienThoai(),
                hoSo.benAEmail(),
                hoSo.benANguoiKy(),
                hoSo.benAChucVu(),
                hoSo.benATuCachKy(),
                hoSo.benACanCuUyQuyen(),
                hoSo.benADonViQuanLy(),
                hoSo.benBHoTen(),
                hoSo.benBNgaySinh() != null ? Date.valueOf(hoSo.benBNgaySinh()) : null,
                hoSo.benBLoaiGiayTo(),
                hoSo.benBSoGiayTo(),
                hoSo.benBNgayCap() != null ? Date.valueOf(hoSo.benBNgayCap()) : null,
                hoSo.benBNoiCap(),
                hoSo.benBThuongTru(),
                hoSo.benBLienHe(),
                hoSo.benBDienThoai(),
                hoSo.benBEmail(),
                hoSo.bdsTenToaNha(),
                hoSo.bdsDiaChiToaNha(),
                hoSo.bdsSoPhong(),
                hoSo.bdsTang(),
                hoSo.bdsDienTich(),
                hoSo.dieuKhoanTuyBien(),
                hoSo.snapshotDichVuJson(),
                hoSo.snapshotTaiSanJson(),
                hoSo.snapshotNguoiOCungJson(),
                hoSo.chotBoiNguoiDungId(),
                hoSo.thoiDiemChot() != null ? Timestamp.valueOf(hoSo.thoiDiemChot()) : null,
                hoSo.ghiNhanKyBoiId(),
                hoSo.ngayKy() != null ? Date.valueOf(hoSo.ngayKy()) : null,
                hoSo.thoiDiemGhiNhanKy() != null ? Timestamp.valueOf(hoSo.thoiDiemGhiNhanKy()) : null,
                hoSo.ghiChuKy(),
                hoSo.fileScanDinhKem(),
                hoSo.soNguoiToiDa(),
                hoSo.soNgayBaoTruocGiaHan(),
                hoSo.soNgayHoanCoc(),
                hoSo.khungGioYenTinh()
        );
    }

    public int updateDraft(HopDongHoSo hoSo, int expectedRevision) {
        String sql = """
                UPDATE HOP_DONG_HO_SO
                SET mau_hop_dong_id = ?, mau_phien_ban = ?, tieu_de = ?,
                    ngay_lap = ?, dia_diem_lap = ?, muc_dich_thue = ?, pham_vi_su_dung = ?, ngay_nhan_phong = ?,
                    phuong_thuc_thanh_toan = ?, ky_thanh_toan_thang = ?, han_thanh_toan_ngay = ?,
                    tai_khoan_nhan_tien = ?, dieu_kien_dieu_chinh_gia = ?, bien_ban_ban_giao_id = ?,
                    ben_a_loai_chu_the = ?, ben_a_ten_chu_the = ?, ben_a_dinh_danh = ?, ben_a_dia_chi = ?,
                    ben_a_dien_thoai = ?, ben_a_email = ?, ben_a_nguoi_ky = ?, ben_a_chuc_vu = ?,
                    ben_a_tu_cach_ky = ?, ben_a_can_cu_uy_quyen = ?, ben_a_don_vi_quan_ly = ?,
                    ben_b_ho_ten = ?, ben_b_ngay_sinh = ?, ben_b_loai_giay_to = ?, ben_b_so_giay_to = ?,
                    ben_b_ngay_cap = ?, ben_b_noi_cap = ?, ben_b_thuong_tru = ?, ben_b_lien_he = ?,
                    ben_b_dien_thoai = ?, ben_b_email = ?,
                    dieu_khoan_tuy_bien = ?,
                    so_nguoi_toi_da = ?, so_ngay_bao_truoc_gia_han = ?, so_ngay_hoan_coc = ?, khung_gio_yen_tinh = ?,
                    revision = revision + 1, cap_nhat_luc = CURRENT_TIMESTAMP
                WHERE id = ? AND revision = ? AND trang_thai_tai_lieu = 'DRAFT'
                """;
        return jdbcTemplate.update(
                sql,
                hoSo.mauHopDongId(),
                hoSo.mauPhienBan(),
                hoSo.tieuDe(),
                hoSo.ngayLap() != null ? Date.valueOf(hoSo.ngayLap()) : Date.valueOf(java.time.LocalDate.now()),
                hoSo.diaDiemLap(),
                hoSo.mucDichThue(),
                hoSo.phamViSuDung(),
                hoSo.ngayNhanPhong() != null ? Date.valueOf(hoSo.ngayNhanPhong()) : null,
                hoSo.phuongThucThanhToan(),
                hoSo.kyThanhToanThang(),
                hoSo.hanThanhToanNgay(),
                hoSo.taiKhoanNhanTien(),
                hoSo.dieuKienDieuChinhGia(),
                hoSo.bienBanBanGiaoId(),
                hoSo.benALoaiChuThe(),
                hoSo.benATenChuThe(),
                hoSo.benADinhDanh(),
                hoSo.benADiaChi(),
                hoSo.benADienThoai(),
                hoSo.benAEmail(),
                hoSo.benANguoiKy(),
                hoSo.benAChucVu(),
                hoSo.benATuCachKy(),
                hoSo.benACanCuUyQuyen(),
                hoSo.benADonViQuanLy(),
                hoSo.benBHoTen(),
                hoSo.benBNgaySinh() != null ? Date.valueOf(hoSo.benBNgaySinh()) : null,
                hoSo.benBLoaiGiayTo(),
                hoSo.benBSoGiayTo(),
                hoSo.benBNgayCap() != null ? Date.valueOf(hoSo.benBNgayCap()) : null,
                hoSo.benBNoiCap(),
                hoSo.benBThuongTru(),
                hoSo.benBLienHe(),
                hoSo.benBDienThoai(),
                hoSo.benBEmail(),
                hoSo.dieuKhoanTuyBien(),
                hoSo.soNguoiToiDa(),
                hoSo.soNgayBaoTruocGiaHan(),
                hoSo.soNgayHoanCoc(),
                hoSo.khungGioYenTinh(),
                hoSo.id(),
                expectedRevision
        );
    }

    public int chotHoSo(
            Long id,
            int revision,
            Long nguoiDungId,
            LocalDateTime thoiDiem,
            String snapshotDichVuJson,
            String snapshotTaiSanJson,
            String snapshotNguoiOCungJson
    ) {
        String sql = """
                UPDATE HOP_DONG_HO_SO
                SET trang_thai_tai_lieu = 'DA_CHOT',
                    snapshot_dich_vu_json = ?,
                    snapshot_tai_san_json = ?,
                    snapshot_nguoi_o_cung_json = ?,
                    chot_boi_nguoi_dung_id = ?,
                    thoi_diem_chot = ?,
                    cap_nhat_luc = CURRENT_TIMESTAMP
                WHERE id = ? AND revision = ? AND trang_thai_tai_lieu = 'DRAFT'
                """;
        return jdbcTemplate.update(
                sql,
                snapshotDichVuJson,
                snapshotTaiSanJson,
                snapshotNguoiOCungJson,
                nguoiDungId,
                Timestamp.valueOf(thoiDiem),
                id,
                revision
        );
    }

    public int ghiNhanKy(
            Long id,
            Long nguoiDungId,
            LocalDate ngayKy,
            LocalDateTime thoiDiem,
            String ghiChuKy,
            String fileScan
    ) {
        String sql = """
                UPDATE HOP_DONG_HO_SO
                SET trang_thai_tai_lieu = 'DA_GHI_NHAN_KY',
                    ngay_ky = ?,
                    ghi_nhan_ky_boi_id = ?,
                    thoi_diem_ghi_nhan_ky = ?,
                    ghi_chu_ky = ?,
                    file_scan_dinh_kem = ?,
                    cap_nhat_luc = CURRENT_TIMESTAMP
                WHERE id = ? AND trang_thai_tai_lieu = 'DA_CHOT'
                """;
        return jdbcTemplate.update(
                sql,
                ngayKy != null ? Date.valueOf(ngayKy) : null,
                nguoiDungId,
                Timestamp.valueOf(thoiDiem),
                ghiChuKy,
                fileScan,
                id
        );
    }

    public int moLaiDraft(Long hopDongId, int expectedRevision, Long nguoiDungId) {
        Optional<HopDongHoSo> currentOpt = findByHopDongIdAndRevision(hopDongId, expectedRevision);
        if (currentOpt.isEmpty()) return 0;
        HopDongHoSo cur = currentOpt.get();
        if (!"DA_CHOT".equals(cur.trangThaiTaiLieu())) return 0;

        int newRev = cur.revision() + 1;
        String sql = """
                INSERT INTO HOP_DONG_HO_SO (
                    hop_dong_id, revision, trang_thai_tai_lieu, mau_hop_dong_id, mau_phien_ban, tieu_de,
                    ngay_lap, dia_diem_lap, muc_dich_thue, pham_vi_su_dung, ngay_nhan_phong,
                    phuong_thuc_thanh_toan, ky_thanh_toan_thang, han_thanh_toan_ngay, tai_khoan_nhan_tien,
                    dieu_kien_dieu_chinh_gia, bien_ban_ban_giao_id,
                    ben_a_loai_chu_the, ben_a_ten_chu_the, ben_a_dinh_danh, ben_a_dia_chi, ben_a_dien_thoai,
                    ben_a_email, ben_a_nguoi_ky, ben_a_chuc_vu, ben_a_tu_cach_ky, ben_a_can_cu_uy_quyen,
                    ben_a_don_vi_quan_ly,
                    ben_b_ho_ten, ben_b_ngay_sinh, ben_b_loai_giay_to, ben_b_so_giay_to, ben_b_ngay_cap,
                    ben_b_noi_cap, ben_b_thuong_tru, ben_b_lien_he, ben_b_dien_thoai, ben_b_email,
                    bds_ten_toa_nha, bds_dia_chi_toa_nha, bds_so_phong, bds_tang, bds_dien_tich,
                    dieu_khoan_tuy_bien, so_nguoi_toi_da, so_ngay_bao_truoc_gia_han, so_ngay_hoan_coc, khung_gio_yen_tinh
                ) VALUES (
                    ?, ?, 'DRAFT', ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?
                )
                """;
        return jdbcTemplate.update(
                sql,
                cur.hopDongId(), newRev, cur.mauHopDongId(), cur.mauPhienBan(), cur.tieuDe(),
                cur.ngayLap() != null ? Date.valueOf(cur.ngayLap()) : Date.valueOf(LocalDate.now()), cur.diaDiemLap(), cur.mucDichThue(), cur.phamViSuDung(),
                cur.ngayNhanPhong() != null ? Date.valueOf(cur.ngayNhanPhong()) : null,
                cur.phuongThucThanhToan(), cur.kyThanhToanThang(), cur.hanThanhToanNgay(), cur.taiKhoanNhanTien(),
                cur.dieuKienDieuChinhGia(), cur.bienBanBanGiaoId(),
                cur.benALoaiChuThe(), cur.benATenChuThe(), cur.benADinhDanh(), cur.benADiaChi(), cur.benADienThoai(),
                cur.benAEmail(), cur.benANguoiKy(), cur.benAChucVu(), cur.benATuCachKy(), cur.benACanCuUyQuyen(),
                cur.benADonViQuanLy(),
                cur.benBHoTen(), cur.benBNgaySinh() != null ? Date.valueOf(cur.benBNgaySinh()) : null, cur.benBLoaiGiayTo(), cur.benBSoGiayTo(),
                cur.benBNgayCap() != null ? Date.valueOf(cur.benBNgayCap()) : null, cur.benBNoiCap(), cur.benBThuongTru(), cur.benBLienHe(), cur.benBDienThoai(), cur.benBEmail(),
                cur.bdsTenToaNha(), cur.bdsDiaChiToaNha(), cur.bdsSoPhong(), cur.bdsTang(), cur.bdsDienTich(),
                cur.dieuKhoanTuyBien(), cur.soNguoiToiDa(), cur.soNgayBaoTruocGiaHan(), cur.soNgayHoanCoc(), cur.khungGioYenTinh()
        );
    }

    private HopDongHoSo mapRow(ResultSet rs, int rowNum) throws SQLException {
        Date ngayLap = rs.getDate("ngay_lap");
        Date ngayNhanPhong = rs.getDate("ngay_nhan_phong");
        Date benBNgaySinh = rs.getDate("ben_b_ngay_sinh");
        Date benBNgayCap = rs.getDate("ben_b_ngay_cap");
        Date ngayKy = null;
        try {
            ngayKy = rs.getDate("ngay_ky");
        } catch (SQLException ignored) {
        }
        String snapshotNguoiOCungJson = null;
        try {
            snapshotNguoiOCungJson = rs.getString("snapshot_nguoi_o_cung_json");
        } catch (SQLException ignored) {
        }
        Timestamp thoiDiemChot = rs.getTimestamp("thoi_diem_chot");
        Timestamp thoiDiemKy = rs.getTimestamp("thoi_diem_ghi_nhan_ky");
        Timestamp taoLuc = rs.getTimestamp("tao_luc");
        Timestamp capNhatLuc = rs.getTimestamp("cap_nhat_luc");

        Integer soNguoiToiDa = null;
        Integer soNgayBaoTruocGiaHan = 30;
        Integer soNgayHoanCoc = 7;
        String khungGioYenTinh = "22h00 - 06h00";
        try {
            soNguoiToiDa = rs.getObject("so_nguoi_toi_da", Integer.class);
            Integer vGiaHan = rs.getObject("so_ngay_bao_truoc_gia_han", Integer.class);
            if (vGiaHan != null) soNgayBaoTruocGiaHan = vGiaHan;
            Integer vHoanCoc = rs.getObject("so_ngay_hoan_coc", Integer.class);
            if (vHoanCoc != null) soNgayHoanCoc = vHoanCoc;
            String vKhungGio = rs.getString("khung_gio_yen_tinh");
            if (vKhungGio != null) khungGioYenTinh = vKhungGio;
        } catch (SQLException ignored) {
        }

        return new HopDongHoSo(
                rs.getLong("id"),
                rs.getLong("hop_dong_id"),
                rs.getInt("revision"),
                rs.getString("trang_thai_tai_lieu"),
                rs.getObject("mau_hop_dong_id", Long.class),
                rs.getObject("mau_phien_ban", Integer.class),
                rs.getString("tieu_de"),
                ngayLap != null ? ngayLap.toLocalDate() : null,
                rs.getString("dia_diem_lap"),
                rs.getString("muc_dich_thue"),
                rs.getString("pham_vi_su_dung"),
                ngayNhanPhong != null ? ngayNhanPhong.toLocalDate() : null,
                rs.getString("phuong_thuc_thanh_toan"),
                rs.getInt("ky_thanh_toan_thang"),
                rs.getInt("han_thanh_toan_ngay"),
                rs.getString("tai_khoan_nhan_tien"),
                rs.getString("dieu_kien_dieu_chinh_gia"),
                rs.getObject("bien_ban_ban_giao_id", Long.class),
                rs.getString("ben_a_loai_chu_the"),
                rs.getString("ben_a_ten_chu_the"),
                rs.getString("ben_a_dinh_danh"),
                rs.getString("ben_a_dia_chi"),
                rs.getString("ben_a_dien_thoai"),
                rs.getString("ben_a_email"),
                rs.getString("ben_a_nguoi_ky"),
                rs.getString("ben_a_chuc_vu"),
                rs.getString("ben_a_tu_cach_ky"),
                rs.getString("ben_a_can_cu_uy_quyen"),
                rs.getString("ben_a_don_vi_quan_ly"),
                rs.getString("ben_b_ho_ten"),
                benBNgaySinh != null ? benBNgaySinh.toLocalDate() : null,
                rs.getString("ben_b_loai_giay_to"),
                rs.getString("ben_b_so_giay_to"),
                benBNgayCap != null ? benBNgayCap.toLocalDate() : null,
                rs.getString("ben_b_noi_cap"),
                rs.getString("ben_b_thuong_tru"),
                rs.getString("ben_b_lien_he"),
                rs.getString("ben_b_dien_thoai"),
                rs.getString("ben_b_email"),
                rs.getString("bds_ten_toa_nha"),
                rs.getString("bds_dia_chi_toa_nha"),
                rs.getString("bds_so_phong"),
                rs.getObject("bds_tang", Integer.class),
                rs.getBigDecimal("bds_dien_tich"),
                rs.getString("dieu_khoan_tuy_bien"),
                rs.getString("snapshot_dich_vu_json"),
                rs.getString("snapshot_tai_san_json"),
                snapshotNguoiOCungJson,
                rs.getObject("chot_boi_nguoi_dung_id", Long.class),
                thoiDiemChot != null ? thoiDiemChot.toLocalDateTime() : null,
                rs.getObject("ghi_nhan_ky_boi_id", Long.class),
                ngayKy != null ? ngayKy.toLocalDate() : null,
                thoiDiemKy != null ? thoiDiemKy.toLocalDateTime() : null,
                rs.getString("ghi_chu_ky"),
                rs.getString("file_scan_dinh_kem"),
                taoLuc != null ? taoLuc.toLocalDateTime() : null,
                capNhatLuc != null ? capNhatLuc.toLocalDateTime() : null,
                soNguoiToiDa,
                soNgayBaoTruocGiaHan,
                soNgayHoanCoc,
                khungGioYenTinh
        );
    }
}
