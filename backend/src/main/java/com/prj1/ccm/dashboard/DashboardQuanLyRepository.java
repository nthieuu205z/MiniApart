package com.prj1.ccm.dashboard;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Repository
public class DashboardQuanLyRepository {
    private final JdbcTemplate jdbcTemplate;

    public DashboardQuanLyRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public CongToChuaGhiTongHop layCongToChuaGhi(Long nguoiDungId, Long toaNhaId) {
        // Tìm kỳ đang mở của tòa nhà (hoặc các tòa)
        StringBuilder sqlKy = new StringBuilder(
                """
                SELECT k.id, k.toa_nha_id, tn.ten AS ten_toa_nha, k.thang, k.nam
                FROM KY_THANH_TOAN k
                JOIN TOA_NHA tn ON tn.id = k.toa_nha_id
                WHERE EXISTS (
                    SELECT 1 FROM PHAN_QUYEN_TOA pqt
                    WHERE pqt.toa_nha_id = k.toa_nha_id AND pqt.nguoi_dung_id = ?
                )
                  AND k.trang_thai = 'DANG_MO'
                """
        );
        List<Object> paramsKy = new ArrayList<>(List.of(nguoiDungId));
        if (toaNhaId != null) {
            sqlKy.append(" AND k.toa_nha_id = ?");
            paramsKy.add(toaNhaId);
        }
        sqlKy.append(" ORDER BY k.toa_nha_id ASC");

        List<KyMoRecord> cacKyMo = jdbcTemplate.query(
                sqlKy.toString(),
                (rs, rowNum) -> new KyMoRecord(
                        rs.getLong("id"),
                        rs.getLong("toa_nha_id"),
                        rs.getString("ten_toa_nha"),
                        rs.getInt("thang"),
                        rs.getInt("nam")
                ),
                paramsKy.toArray()
        );

        if (cacKyMo.isEmpty()) {
            return new CongToChuaGhiTongHop(null, "Không có kỳ đang mở", 0, 0, 0, List.of());
        }

        Long kyIdDau = cacKyMo.get(0).id();
        String tenKy = String.format("Kỳ %02d/%d - %s", cacKyMo.get(0).thang(), cacKyMo.get(0).nam(), cacKyMo.get(0).tenToaNha());

        // Lấy danh sách điểm đo phòng chưa ghi chỉ số
        StringBuilder sqlChuaGhiPhong = new StringBuilder(
                """
                SELECT p.id AS phong_id,
                       p.so_phong,
                       tn.id AS toa_nha_id,
                       tn.ten AS ten_toa_nha,
                       dv.id AS dich_vu_id,
                       dv.ten AS ten_dich_vu,
                       dv.don_vi,
                       k.id AS ky_id,
                       (
                           SELECT cs_prev.chi_so_cuoi
                           FROM CHI_SO_DICH_VU cs_prev
                           JOIN KY_THANH_TOAN k_prev ON k_prev.id = cs_prev.ky_id
                           WHERE cs_prev.phong_id = p.id AND cs_prev.dich_vu_id = dv.id
                             AND (k_prev.nam < k.nam OR (k_prev.nam = k.nam AND k_prev.thang < k.thang))
                           ORDER BY k_prev.nam DESC, k_prev.thang DESC
                           LIMIT 1
                       ) AS chi_so_cuoi_ky_truoc
                FROM PHONG p
                JOIN TOA_NHA tn ON tn.id = p.toa_nha_id
                JOIN DICH_VU dv ON dv.toa_nha_id = p.toa_nha_id AND dv.cach_tinh = 'THEO_CHI_SO' AND dv.dang_su_dung = TRUE
                JOIN KY_THANH_TOAN k ON k.toa_nha_id = p.toa_nha_id AND k.trang_thai = 'DANG_MO'
                WHERE EXISTS (
                    SELECT 1 FROM PHAN_QUYEN_TOA pqt
                    WHERE pqt.toa_nha_id = p.toa_nha_id AND pqt.nguoi_dung_id = ?
                )
                  AND NOT EXISTS (
                      SELECT 1 FROM CHI_SO_DICH_VU cs
                      WHERE cs.phong_id = p.id AND cs.dich_vu_id = dv.id AND cs.ky_id = k.id
                  )
                """
        );
        List<Object> paramsPhong = new ArrayList<>(List.of(nguoiDungId));
        if (toaNhaId != null) {
            sqlChuaGhiPhong.append(" AND p.toa_nha_id = ?");
            paramsPhong.add(toaNhaId);
        }

        List<DiemDoChuaGhiRecord> danhSachChuaGhi = new ArrayList<>(jdbcTemplate.query(
                sqlChuaGhiPhong.toString(),
                (rs, rowNum) -> new DiemDoChuaGhiRecord(
                        rs.getLong("phong_id"),
                        rs.getString("so_phong"),
                        rs.getLong("toa_nha_id"),
                        rs.getString("ten_toa_nha"),
                        rs.getString("ten_dich_vu"),
                        rs.getString("don_vi"),
                        "PHONG",
                        rs.getLong("ky_id"),
                        rs.getBigDecimal("chi_so_cuoi_ky_truoc")
                ),
                paramsPhong.toArray()
        ));

        // Lấy danh sách điểm đo chung chưa ghi
        StringBuilder sqlChuaGhiChung = new StringBuilder(
                """
                SELECT dd.id AS diem_do_id,
                       dd.ten_cong_to AS ten_diem_do,
                       tn.id AS toa_nha_id,
                       tn.ten AS ten_toa_nha,
                       dd.loai_dich_vu AS ten_dich_vu,
                       dd.don_vi,
                       k.id AS ky_id,
                       (
                           SELECT cs_prev.chi_so_cuoi
                           FROM CHI_SO_DUNG_CHUNG cs_prev
                           JOIN KY_THANH_TOAN k_prev ON k_prev.id = cs_prev.ky_id
                           WHERE cs_prev.diem_do_id = dd.id
                             AND (k_prev.nam < k.nam OR (k_prev.nam = k.nam AND k_prev.thang < k.thang))
                           ORDER BY k_prev.nam DESC, k_prev.thang DESC
                           LIMIT 1
                       ) AS chi_so_cuoi_ky_truoc
                FROM DIEM_DO_DUNG_CHUNG dd
                JOIN TOA_NHA tn ON tn.id = dd.toa_nha_id
                JOIN KY_THANH_TOAN k ON k.toa_nha_id = dd.toa_nha_id AND k.trang_thai = 'DANG_MO'
                WHERE EXISTS (
                    SELECT 1 FROM PHAN_QUYEN_TOA pqt
                    WHERE pqt.toa_nha_id = dd.toa_nha_id AND pqt.nguoi_dung_id = ?
                )
                  AND dd.hoat_dong = TRUE
                  AND NOT EXISTS (
                      SELECT 1 FROM CHI_SO_DUNG_CHUNG cs
                      WHERE cs.diem_do_id = dd.id AND cs.ky_id = k.id
                  )
                """
        );
        List<Object> paramsChung = new ArrayList<>(List.of(nguoiDungId));
        if (toaNhaId != null) {
            sqlChuaGhiChung.append(" AND dd.toa_nha_id = ?");
            paramsChung.add(toaNhaId);
        }

        List<DiemDoChuaGhiRecord> danhSachChungChuaGhi = jdbcTemplate.query(
                sqlChuaGhiChung.toString(),
                (rs, rowNum) -> new DiemDoChuaGhiRecord(
                        rs.getLong("diem_do_id"),
                        rs.getString("ten_diem_do"),
                        rs.getLong("toa_nha_id"),
                        rs.getString("ten_toa_nha"),
                        rs.getString("ten_dich_vu"),
                        rs.getString("don_vi"),
                        "KHU_VUC_CHUNG",
                        rs.getLong("ky_id"),
                        rs.getBigDecimal("chi_so_cuoi_ky_truoc")
                ),
                paramsChung.toArray()
        );
        danhSachChuaGhi.addAll(danhSachChungChuaGhi);

        // Tính số công tơ đã ghi thực tế từ cơ sở dữ liệu trên toàn bộ các kỳ mở trong scope (R07)
        int soChuaGhi = danhSachChuaGhi.size();
        
        StringBuilder sqlPhongDaGhi = new StringBuilder(
                """
                SELECT COUNT(*)
                FROM CHI_SO_DICH_VU cs
                JOIN KY_THANH_TOAN k ON k.id = cs.ky_id AND k.trang_thai = 'DANG_MO'
                JOIN PHONG p ON p.id = cs.phong_id
                WHERE EXISTS (
                    SELECT 1 FROM PHAN_QUYEN_TOA pqt
                    WHERE pqt.toa_nha_id = p.toa_nha_id AND pqt.nguoi_dung_id = ?
                )
                """
        );
        List<Object> paramsDaGhiPhong = new ArrayList<>(List.of(nguoiDungId));
        if (toaNhaId != null) {
            sqlPhongDaGhi.append(" AND p.toa_nha_id = ?");
            paramsDaGhiPhong.add(toaNhaId);
        }
        Integer phongDaGhi = jdbcTemplate.queryForObject(sqlPhongDaGhi.toString(), Integer.class, paramsDaGhiPhong.toArray());

        StringBuilder sqlChungDaGhi = new StringBuilder(
                """
                SELECT COUNT(*)
                FROM CHI_SO_DUNG_CHUNG cs
                JOIN KY_THANH_TOAN k ON k.id = cs.ky_id AND k.trang_thai = 'DANG_MO'
                JOIN DIEM_DO_DUNG_CHUNG dd ON dd.id = cs.diem_do_id
                WHERE EXISTS (
                    SELECT 1 FROM PHAN_QUYEN_TOA pqt
                    WHERE pqt.toa_nha_id = dd.toa_nha_id AND pqt.nguoi_dung_id = ?
                )
                """
        );
        List<Object> paramsDaGhiChung = new ArrayList<>(List.of(nguoiDungId));
        if (toaNhaId != null) {
            sqlChungDaGhi.append(" AND dd.toa_nha_id = ?");
            paramsDaGhiChung.add(toaNhaId);
        }
        Integer chungDaGhi = jdbcTemplate.queryForObject(sqlChungDaGhi.toString(), Integer.class, paramsDaGhiChung.toArray());

        int soDaGhi = (phongDaGhi != null ? phongDaGhi : 0) + (chungDaGhi != null ? chungDaGhi : 0);
        int tongSoDiemDo = soDaGhi + soChuaGhi;

        return new CongToChuaGhiTongHop(
                kyIdDau,
                tenKy,
                tongSoDiemDo,
                soDaGhi,
                soChuaGhi,
                danhSachChuaGhi
        );
    }

    public List<LichHenRecord> findLichHenSapToi(Long nguoiDungId, Long toaNhaId) {
        StringBuilder sql = new StringBuilder(
                """
                SELECT lh.id, lh.ho_ten, lh.so_dien_thoai, p.so_phong, tn.ten AS ten_toa_nha,
                       lh.thoi_gian_hen, lh.trang_thai
                FROM LICH_HEN_XEM_PHONG lh
                JOIN PHONG p ON p.id = lh.phong_id
                JOIN TOA_NHA tn ON tn.id = p.toa_nha_id
                WHERE EXISTS (
                    SELECT 1 FROM PHAN_QUYEN_TOA pqt
                    WHERE pqt.toa_nha_id = p.toa_nha_id AND pqt.nguoi_dung_id = ?
                )
                  AND lh.trang_thai NOT IN ('DA_HUY', 'DA_HOAN_THANH')
                """
        );
        List<Object> params = new ArrayList<>(List.of(nguoiDungId));
        if (toaNhaId != null) {
            sql.append(" AND p.toa_nha_id = ?");
            params.add(toaNhaId);
        }
        sql.append(" ORDER BY lh.thoi_gian_hen ASC LIMIT 5");

        return jdbcTemplate.query(
                sql.toString(),
                (rs, rowNum) -> new LichHenRecord(
                        rs.getLong("id"),
                        rs.getString("ho_ten"),
                        rs.getString("so_dien_thoai"),
                        rs.getString("so_phong") + " (" + rs.getString("ten_toa_nha") + ")",
                        rs.getTimestamp("thoi_gian_hen").toInstant().toString(),
                        "XEM_PHONG",
                        rs.getString("trang_thai")
                ),
                params.toArray()
        );
    }

    public record KyMoRecord(Long id, Long toaNhaId, String tenToaNha, int thang, int nam) {}

    public record CongToChuaGhiTongHop(
            Long kyHienTaiId,
            String tenKyHienTai,
            int tongSoCongTo,
            int soCongToDaGhi,
            int soCongToChuaGhi,
            List<DiemDoChuaGhiRecord> danhSachChuaGhi
    ) {}

    public record DiemDoChuaGhiRecord(
            Long viTriId,
            String tenViTri,
            Long toaNhaId,
            String tenToaNha,
            String tenDichVu,
            String donVi,
            String loaiDiemDo,
            Long kyId,
            BigDecimal chiSoCuoiKyTruoc
    ) {
        public DiemDoChuaGhiRecord(
                Long viTriId,
                String tenViTri,
                Long toaNhaId,
                String tenToaNha,
                String tenDichVu,
                String donVi,
                String loaiDiemDo,
                Long kyId
        ) {
            this(viTriId, tenViTri, toaNhaId, tenToaNha, tenDichVu, donVi, loaiDiemDo, kyId, null);
        }
    }

    public record LichHenRecord(
            Long id,
            String hoTen,
            String soDienThoai,
            String soPhong,
            String thoiGian,
            String loai,
            String trangThai
    ) {}
}

