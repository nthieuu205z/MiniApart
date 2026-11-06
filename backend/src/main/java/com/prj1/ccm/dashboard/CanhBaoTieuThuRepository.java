package com.prj1.ccm.dashboard;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class CanhBaoTieuThuRepository {
    private final JdbcTemplate jdbcTemplate;

    public CanhBaoTieuThuRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<CanhBaoRecord> findCanhBao(Long nguoiDungId, Long toaNhaId, String trangThai) {
        StringBuilder sql = new StringBuilder(
                """
                SELECT cb.id, cb.toa_nha_id, tn.ten AS ten_toa_nha,
                       cb.diem_do_id, dd.ten_cong_to,
                       cb.phong_id, p.so_phong,
                       cb.ky_id, k.thang, k.nam,
                       cb.loai_dich_vu, cb.loai_canh_bao,
                       cb.muc_tieu_thu_ky_nay, cb.muc_tham_chieu, cb.muc_tang, cb.ty_le_tang,
                       cb.ly_do, cb.trang_thai,
                       cb.nguoi_xac_nhan_id, u.ho_ten AS ho_ten_nguoi_xac_nhan,
                       cb.ghi_chu_xu_ly, cb.thoi_diem_tao, cb.thoi_diem_cap_nhat
                FROM CANH_BAO_TIEU_THU cb
                JOIN TOA_NHA tn ON tn.id = cb.toa_nha_id
                JOIN KY_THANH_TOAN k ON k.id = cb.ky_id
                LEFT JOIN DIEM_DO_DUNG_CHUNG dd ON dd.id = cb.diem_do_id
                LEFT JOIN PHONG p ON p.id = cb.phong_id
                LEFT JOIN NGUOI_DUNG u ON u.id = cb.nguoi_xac_nhan_id
                WHERE EXISTS (
                    SELECT 1
                    FROM PHAN_QUYEN_TOA pqt
                    WHERE pqt.toa_nha_id = cb.toa_nha_id
                      AND pqt.nguoi_dung_id = ?
                )
                """
        );
        List<Object> params = new ArrayList<>();
        params.add(nguoiDungId);

        if (toaNhaId != null) {
            sql.append(" AND cb.toa_nha_id = ?");
            params.add(toaNhaId);
        }

        if (trangThai != null && !trangThai.isBlank()) {
            sql.append(" AND cb.trang_thai = ?");
            params.add(trangThai);
        }

        sql.append(" ORDER BY cb.thoi_diem_tao DESC, cb.id DESC");

        return jdbcTemplate.query(sql.toString(), this::mapCanhBao, params.toArray());
    }

    public Optional<CanhBaoRecord> findById(Long id) {
        List<CanhBaoRecord> list = jdbcTemplate.query(
                """
                SELECT cb.id, cb.toa_nha_id, tn.ten AS ten_toa_nha,
                       cb.diem_do_id, dd.ten_cong_to,
                       cb.phong_id, p.so_phong,
                       cb.ky_id, k.thang, k.nam,
                       cb.loai_dich_vu, cb.loai_canh_bao,
                       cb.muc_tieu_thu_ky_nay, cb.muc_tham_chieu, cb.muc_tang, cb.ty_le_tang,
                       cb.ly_do, cb.trang_thai,
                       cb.nguoi_xac_nhan_id, u.ho_ten AS ho_ten_nguoi_xac_nhan,
                       cb.ghi_chu_xu_ly, cb.thoi_diem_tao, cb.thoi_diem_cap_nhat
                FROM CANH_BAO_TIEU_THU cb
                JOIN TOA_NHA tn ON tn.id = cb.toa_nha_id
                JOIN KY_THANH_TOAN k ON k.id = cb.ky_id
                LEFT JOIN DIEM_DO_DUNG_CHUNG dd ON dd.id = cb.diem_do_id
                LEFT JOIN PHONG p ON p.id = cb.phong_id
                LEFT JOIN NGUOI_DUNG u ON u.id = cb.nguoi_xac_nhan_id
                WHERE cb.id = ?
                """,
                this::mapCanhBao,
                id
        );
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public int demCanhBaoDangMo(Long nguoiDungId, Long toaNhaId) {
        StringBuilder sql = new StringBuilder(
                """
                SELECT COUNT(*)
                FROM CANH_BAO_TIEU_THU cb
                WHERE EXISTS (
                    SELECT 1
                    FROM PHAN_QUYEN_TOA pqt
                    WHERE pqt.toa_nha_id = cb.toa_nha_id
                      AND pqt.nguoi_dung_id = ?
                )
                  AND cb.trang_thai IN ('MOI_PHAT_HIEN', 'DANG_KIEM_TRA')
                """
        );
        List<Object> params = new ArrayList<>();
        params.add(nguoiDungId);
        if (toaNhaId != null) {
            sql.append(" AND cb.toa_nha_id = ?");
            params.add(toaNhaId);
        }
        Integer count = jdbcTemplate.queryForObject(sql.toString(), Integer.class, params.toArray());
        return count == null ? 0 : count;
    }

    public void capNhatTrangThai(Long id, String trangThai, Long nguoiXacNhanId, String ghiChu) {
        jdbcTemplate.update(
                """
                UPDATE CANH_BAO_TIEU_THU
                SET trang_thai = ?,
                    nguoi_xac_nhan_id = ?,
                    ghi_chu_xu_ly = ?,
                    thoi_diem_cap_nhat = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                trangThai,
                nguoiXacNhanId,
                ghiChu,
                id
        );
    }

    public void taoCanhBaoNeuChuaCo(
            Long toaNhaId,
            Long diemDoId,
            Long phongId,
            Long kyId,
            String loaiDichVu,
            String loaiCanhBao,
            BigDecimal mucTieuThuKyNay,
            BigDecimal mucThamChieu,
            BigDecimal mucTang,
            BigDecimal tyLeTang,
            String lyDo
    ) {
        taoHoacCapNhatCanhBao(
                toaNhaId, diemDoId, phongId, kyId, loaiDichVu, loaiCanhBao,
                mucTieuThuKyNay, mucThamChieu, mucTang, tyLeTang, lyDo
        );
    }

    public void taoHoacCapNhatCanhBao(
            Long toaNhaId,
            Long diemDoId,
            Long phongId,
            Long kyId,
            String loaiDichVu,
            String loaiCanhBao,
            BigDecimal mucTieuThuKyNay,
            BigDecimal mucThamChieu,
            BigDecimal mucTang,
            BigDecimal tyLeTang,
            String lyDo
    ) {
        List<Long> existingIds = jdbcTemplate.query(
                """
                SELECT id FROM CANH_BAO_TIEU_THU
                WHERE toa_nha_id = ? AND ky_id = ? AND loai_canh_bao = ?
                  AND ((?::BIGINT IS NULL AND diem_do_id IS NULL) OR diem_do_id = ?)
                  AND ((?::BIGINT IS NULL AND phong_id IS NULL) OR phong_id = ?)
                ORDER BY id DESC
                """,
                (rs, rowNum) -> rs.getLong("id"),
                toaNhaId, kyId, loaiCanhBao, diemDoId, diemDoId, phongId, phongId
        );

        if (!existingIds.isEmpty()) {
            // Cập nhật bằng chứng khi ghi lại chỉ số (nếu cảnh báo còn ở trạng thái MOI_PHAT_HIEN)
            jdbcTemplate.update(
                    """
                    UPDATE CANH_BAO_TIEU_THU SET
                        muc_tieu_thu_ky_nay = ?,
                        muc_tham_chieu = ?,
                        muc_tang = ?,
                        ty_le_tang = ?,
                        ly_do = ?,
                        thoi_diem_cap_nhat = CURRENT_TIMESTAMP
                    WHERE id = ? AND trang_thai = 'MOI_PHAT_HIEN'
                    """,
                    mucTieuThuKyNay, mucThamChieu, mucTang, tyLeTang, lyDo, existingIds.get(0)
            );
            return;
        }

        jdbcTemplate.update(
                """
                INSERT INTO CANH_BAO_TIEU_THU (
                    toa_nha_id, diem_do_id, phong_id, ky_id, loai_dich_vu, loai_canh_bao,
                    muc_tieu_thu_ky_nay, muc_tham_chieu, muc_tang, ty_le_tang, ly_do, trang_thai,
                    thoi_diem_tao
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'MOI_PHAT_HIEN', CURRENT_TIMESTAMP)
                """,
                toaNhaId, diemDoId, phongId, kyId, loaiDichVu, loaiCanhBao,
                mucTieuThuKyNay, mucThamChieu, mucTang, tyLeTang, lyDo
        );
    }

    public void giaiQuyetCanhBaoKhiChiSoVeBinhThuong(Long diemDoId, Long kyId) {
        jdbcTemplate.update(
                """
                UPDATE CANH_BAO_TIEU_THU SET
                    trang_thai = 'DA_XU_LY',
                    ghi_chu_xu_ly = 'Chỉ số đã được ghi nhận lại về mức bình thường.',
                    thoi_diem_cap_nhat = CURRENT_TIMESTAMP
                WHERE diem_do_id = ? AND ky_id = ? AND trang_thai = 'MOI_PHAT_HIEN'
                """,
                diemDoId, kyId
        );
    }

    private CanhBaoRecord mapCanhBao(ResultSet rs, int rowNum) throws SQLException {
        Timestamp taoLuc = rs.getTimestamp("thoi_diem_tao");
        Timestamp capNhatLuc = rs.getTimestamp("thoi_diem_cap_nhat");
        return new CanhBaoRecord(
                rs.getLong("id"),
                rs.getLong("toa_nha_id"),
                rs.getString("ten_toa_nha"),
                rs.getObject("diem_do_id", Long.class),
                rs.getString("ten_cong_to"),
                rs.getObject("phong_id", Long.class),
                rs.getString("so_phong"),
                rs.getLong("ky_id"),
                rs.getInt("thang"),
                rs.getInt("nam"),
                rs.getString("loai_dich_vu"),
                rs.getString("loai_canh_bao"),
                rs.getBigDecimal("muc_tieu_thu_ky_nay"),
                rs.getBigDecimal("muc_tham_chieu"),
                rs.getBigDecimal("muc_tang"),
                rs.getBigDecimal("ty_le_tang"),
                rs.getString("ly_do"),
                rs.getString("trang_thai"),
                rs.getObject("nguoi_xac_nhan_id", Long.class),
                rs.getString("ho_ten_nguoi_xac_nhan"),
                rs.getString("ghi_chu_xu_ly"),
                taoLuc == null ? null : taoLuc.toInstant(),
                capNhatLuc == null ? null : capNhatLuc.toInstant()
        );
    }

    public record CanhBaoRecord(
            Long id,
            Long toaNhaId,
            String tenToaNha,
            Long diemDoId,
            String tenCongTo,
            Long phongId,
            String soPhong,
            Long kyId,
            int thang,
            int nam,
            String loaiDichVu,
            String loaiCanhBao,
            BigDecimal mucTieuThuKyNay,
            BigDecimal mucThamChieu,
            BigDecimal mucTang,
            BigDecimal tyLeTang,
            String lyDo,
            String trangThai,
            Long nguoiXacNhanId,
            String hoTenNguoiXacNhan,
            String ghiChuXuLy,
            Instant thoiDiemTao,
            Instant thoiDiemCapNhat
    ) {}
}

