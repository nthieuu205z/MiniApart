package com.prj1.ccm.dashboard;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Repository
public class DashboardChuRepository {
    private final JdbcTemplate jdbcTemplate;

    public DashboardChuRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<TaiChinhThangRecord> findTaiChinhTheoThang(
            Long nguoiDungId,
            Long toaNhaId,
            LocalDate tuNgay,
            LocalDate denNgay
    ) {
        // 1. Lấy doanh thu phát hành, đã thu theo hóa đơn, và công nợ theo tháng phát hành
        StringBuilder sqlPhatHanh = new StringBuilder(
                """
                WITH pham_vi_hd AS (
                    SELECT hd.id,
                           DATE_TRUNC('month', hd.ngay_phat_hanh)::DATE AS thang,
                           hd.tong_tien,
                           hd.da_thu
                    FROM HOA_DON hd
                    JOIN HOP_DONG hop_dong ON hop_dong.id = hd.hop_dong_id
                    JOIN PHONG p ON p.id = hop_dong.phong_id
                    WHERE EXISTS (
                        SELECT 1 FROM PHAN_QUYEN_TOA pqt
                        WHERE pqt.toa_nha_id = p.toa_nha_id AND pqt.nguoi_dung_id = ?
                    )
                      AND hd.ngay_phat_hanh BETWEEN ? AND ?
                      AND hd.trang_thai NOT IN ('NHAP', 'DA_HUY')
                """
        );
        List<Object> thamSoPhatHanh = new ArrayList<>(List.of(nguoiDungId, Date.valueOf(tuNgay), Date.valueOf(denNgay)));
        if (toaNhaId != null) {
            sqlPhatHanh.append(" AND p.toa_nha_id = ?");
            thamSoPhatHanh.add(toaNhaId);
        }
        sqlPhatHanh.append(
                """
                ),
                thanh_toan_hd AS (
                    SELECT tt.hoa_don_id,
                           SUM(
                               CASE
                                   WHEN tt.loai = 'THU' THEN tt.so_tien
                                   WHEN tt.loai = 'DOI_UNG' THEN -tt.so_tien
                                   ELSE 0
                               END
                           ) AS tong_da_thu
                    FROM THANH_TOAN tt
                    JOIN pham_vi_hd hd ON hd.id = tt.hoa_don_id
                    WHERE tt.loai IN ('THU', 'DOI_UNG')
                    GROUP BY tt.hoa_don_id
                )
                SELECT hd.thang,
                       SUM(hd.tong_tien) AS doanh_thu_phat_hanh,
                       SUM(GREATEST(LEAST(COALESCE(t.tong_da_thu, hd.da_thu, 0), hd.tong_tien), 0)) AS da_thu_theo_hd,
                       SUM(hd.tong_tien - GREATEST(LEAST(COALESCE(t.tong_da_thu, hd.da_thu, 0), hd.tong_tien), 0)) AS cong_no
                FROM pham_vi_hd hd
                LEFT JOIN thanh_toan_hd t ON t.hoa_don_id = hd.id
                GROUP BY hd.thang ORDER BY hd.thang
                """
        );

        Map<LocalDate, TaiChinhThangRecord> mapTheoThang = new HashMap<>();

        jdbcTemplate.query(
                sqlPhatHanh.toString(),
                rs -> {
                    LocalDate thang = rs.getDate("thang").toLocalDate();
                    BigDecimal phatHanh = rs.getBigDecimal("doanh_thu_phat_hanh");
                    BigDecimal daThuHd = rs.getBigDecimal("da_thu_theo_hd");
                    BigDecimal congNo = rs.getBigDecimal("cong_no");
                    mapTheoThang.put(thang, new TaiChinhThangRecord(
                            thang,
                            phatHanh == null ? BigDecimal.ZERO : phatHanh.setScale(2, RoundingMode.HALF_UP),
                            // thucThu cùng nguồn daThuTheoHoaDon (Σ đã thu của hoá đơn phát hành trong tháng)
                            daThuHd == null ? BigDecimal.ZERO : daThuHd.setScale(2, RoundingMode.HALF_UP),
                            daThuHd == null ? BigDecimal.ZERO : daThuHd.setScale(2, RoundingMode.HALF_UP),
                            congNo == null ? BigDecimal.ZERO : congNo.setScale(2, RoundingMode.HALF_UP)
                    ));
                },
                thamSoPhatHanh.toArray()
        );

        // Duyệt liên tục theo các tháng trong khoảng
        List<TaiChinhThangRecord> ketQua = new ArrayList<>();
        LocalDate cur = tuNgay.withDayOfMonth(1);
        LocalDate endMonth = denNgay.withDayOfMonth(1);
        while (!cur.isAfter(endMonth)) {
            TaiChinhThangRecord item = mapTheoThang.get(cur);
            if (item != null) {
                ketQua.add(item);
            } else {
                ketQua.add(new TaiChinhThangRecord(
                        cur,
                        BigDecimal.ZERO.setScale(2),
                        BigDecimal.ZERO.setScale(2),
                        BigDecimal.ZERO.setScale(2),
                        BigDecimal.ZERO.setScale(2)
                ));
            }
            cur = cur.plusMonths(1);
        }
        return ketQua;
    }

    public CoCauPhongRecord layCoCauPhong(Long nguoiDungId, Long toaNhaId, LocalDate ngayTinh) {
        StringBuilder sql = new StringBuilder(
                """
                WITH tham_so AS (SELECT CAST(? AS DATE) AS ngay_tinh),
                phan_loai_phong AS (
                    SELECT
                        p.id,
                        CASE
                            WHEN p.ngung_cho_thue = TRUE OR p.trang_thai = 'NGUNG' THEN 'NGUNG'
                            WHEN p.trang_thai IN ('DANG_SUA', 'DANG_SUA_CHUA') THEN 'DANG_SUA'
                            WHEN EXISTS (
                                SELECT 1 FROM HOP_DONG hd
                                WHERE hd.phong_id = p.id
                                  AND hd.trang_thai = 'HIEU_LUC'
                                  AND hd.ngay_bat_dau <= t.ngay_tinh
                                  AND hd.ngay_ket_thuc >= t.ngay_tinh
                            ) OR p.trang_thai = 'DANG_THUE' THEN 'DANG_THUE'
                            WHEN EXISTS (
                                SELECT 1 FROM HOP_DONG hd
                                WHERE hd.phong_id = p.id
                                  AND hd.trang_thai = 'DA_COC'
                                  AND hd.ngay_bat_dau > t.ngay_tinh
                            ) OR p.trang_thai = 'DA_COC' THEN 'DA_COC'
                            ELSE 'TRONG'
                        END AS loai
                    FROM PHONG p
                    CROSS JOIN tham_so t
                    WHERE EXISTS (
                        SELECT 1 FROM PHAN_QUYEN_TOA pqt
                        WHERE pqt.toa_nha_id = p.toa_nha_id AND pqt.nguoi_dung_id = ?
                    )
                """
        );
        List<Object> params = new ArrayList<>(List.of(Date.valueOf(ngayTinh), nguoiDungId));
        if (toaNhaId != null) {
            sql.append(" AND p.toa_nha_id = ?");
            params.add(toaNhaId);
        }
        sql.append(
                """
                )
                SELECT
                    COUNT(*) AS tong_so_phong,
                    COUNT(*) FILTER (WHERE loai = 'DANG_THUE') AS dang_thue,
                    COUNT(*) FILTER (WHERE loai = 'DA_COC') AS da_coc,
                    COUNT(*) FILTER (WHERE loai = 'DANG_SUA') AS dang_sua,
                    COUNT(*) FILTER (WHERE loai = 'NGUNG') AS ngung_khai_thac,
                    COUNT(*) FILTER (WHERE loai = 'TRONG') AS trong
                FROM phan_loai_phong
                """
        );

        return jdbcTemplate.queryForObject(
                sql.toString(),
                (rs, rowNum) -> {
                    int tong = rs.getInt("tong_so_phong");
                    int dangThue = rs.getInt("dang_thue");
                    int daCoc = rs.getInt("da_coc");
                    int dangSua = rs.getInt("dang_sua");
                    int ngung = rs.getInt("ngung_khai_thac");
                    int trong = rs.getInt("trong");

                    BigDecimal tyLeDangThue = tong > 0
                            ? BigDecimal.valueOf(dangThue).multiply(BigDecimal.valueOf(100)).divide(BigDecimal.valueOf(tong), 2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO.setScale(2);
                    BigDecimal tyLeTrong = tong > 0
                            ? BigDecimal.valueOf(trong).multiply(BigDecimal.valueOf(100)).divide(BigDecimal.valueOf(tong), 2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO.setScale(2);
                    BigDecimal tyLeDaCoc = tong > 0
                            ? BigDecimal.valueOf(daCoc).multiply(BigDecimal.valueOf(100)).divide(BigDecimal.valueOf(tong), 2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO.setScale(2);
                    BigDecimal tyLeDangSua = tong > 0
                            ? BigDecimal.valueOf(dangSua).multiply(BigDecimal.valueOf(100)).divide(BigDecimal.valueOf(tong), 2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO.setScale(2);
                    BigDecimal tyLeNgung = tong > 0
                            ? BigDecimal.valueOf(ngung).multiply(BigDecimal.valueOf(100)).divide(BigDecimal.valueOf(tong), 2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO.setScale(2);

                    return new CoCauPhongRecord(tong, dangThue, tyLeDangThue, trong, tyLeTrong, daCoc, tyLeDaCoc, dangSua, tyLeDangSua, ngung, tyLeNgung);
                },
                params.toArray()
        );
    }

    public record TieuThuThangRecord(
            LocalDate thang,
            BigDecimal tieuThuPhong,
            BigDecimal tieuThuChung,
            BigDecimal tieuThuTong,
            boolean coCongToTong,
            boolean coDuLieu
    ) {
        public TieuThuThangRecord(
                LocalDate thang,
                BigDecimal tieuThuPhong,
                BigDecimal tieuThuChung,
                BigDecimal tieuThuTong
        ) {
            this(thang, tieuThuPhong, tieuThuChung, tieuThuTong, tieuThuTong != null, tieuThuPhong != null || tieuThuChung != null || tieuThuTong != null);
        }
    }

    public List<TieuThuThangRecord> layTieuThuTheoThang(Long nguoiDungId, Long toaNhaId, LocalDate tuNgay, LocalDate denNgay, boolean laDien) {
        String loaiDichVu = laDien ? "DIEN" : "NUOC";
        StringBuilder sql = new StringBuilder(
                """
                WITH ky_pham_vi AS (
                    SELECT kt.id AS ky_id, kt.toa_nha_id,
                           DATE_TRUNC('month', kt.ngay_bat_dau)::DATE AS thang_ky
                    FROM KY_THANH_TOAN kt
                    WHERE EXISTS (
                        SELECT 1 FROM PHAN_QUYEN_TOA pqt
                        WHERE pqt.toa_nha_id = kt.toa_nha_id AND pqt.nguoi_dung_id = ?
                    )
                      AND kt.ngay_bat_dau <= ? AND kt.ngay_ket_thuc >= ?
                """
        );
        List<Object> params = new ArrayList<>(List.of(nguoiDungId, Date.valueOf(denNgay), Date.valueOf(tuNgay)));
        if (toaNhaId != null) {
            sql.append(" AND kt.toa_nha_id = ?");
            params.add(toaNhaId);
        }
        sql.append(
                """
                ),
                tieu_thu_phong AS (
                    SELECT kp.thang_ky,
                           SUM(
                               CASE
                                   WHEN cs.co_thay_cong_to = TRUE
                                   THEN (COALESCE(cs.chi_so_cuoi_cong_to_cu, cs.chi_so_dau) - cs.chi_so_dau)
                                      + (cs.chi_so_cuoi - COALESCE(cs.chi_so_dau_cong_to_moi, cs.chi_so_cuoi))
                                   ELSE (cs.chi_so_cuoi - cs.chi_so_dau)
                               END
                           ) AS muc_phong
                    FROM CHI_SO_DICH_VU cs
                    JOIN DICH_VU dv ON dv.id = cs.dich_vu_id
                    JOIN ky_pham_vi kp ON kp.ky_id = cs.ky_id
                    WHERE dv.la_dien = ?
                    GROUP BY kp.thang_ky
                ),
                tieu_thu_chung AS (
                    SELECT kp.thang_ky,
                           SUM(cs.muc_tieu_thu) AS muc_chung
                    FROM CHI_SO_DUNG_CHUNG cs
                    JOIN DIEM_DO_DUNG_CHUNG dd ON dd.id = cs.diem_do_id
                    JOIN ky_pham_vi kp ON kp.ky_id = cs.ky_id
                    WHERE dd.loai_diem_do = 'KHU_VUC_CHUNG' AND dd.loai_dich_vu = ?
                    GROUP BY kp.thang_ky
                ),
                tieu_thu_tong_ct AS (
                    SELECT kp.thang_ky,
                           SUM(cs.muc_tieu_thu) AS muc_tong
                    FROM CHI_SO_DUNG_CHUNG cs
                    JOIN DIEM_DO_DUNG_CHUNG dd ON dd.id = cs.diem_do_id
                    JOIN ky_pham_vi kp ON kp.ky_id = cs.ky_id
                    WHERE dd.loai_diem_do = 'TONG' AND dd.loai_dich_vu = ?
                    GROUP BY kp.thang_ky
                ),
                cac_thang AS (
                    SELECT DISTINCT thang_ky FROM ky_pham_vi
                )
                SELECT ct.thang_ky,
                       p.muc_phong,
                       c.muc_chung,
                       t.muc_tong,
                       (t.muc_tong IS NOT NULL) AS co_cong_to_tong,
                       (p.muc_phong IS NOT NULL OR c.muc_chung IS NOT NULL OR t.muc_tong IS NOT NULL) AS co_du_lieu
                FROM cac_thang ct
                LEFT JOIN tieu_thu_phong p ON p.thang_ky = ct.thang_ky
                LEFT JOIN tieu_thu_chung c ON c.thang_ky = ct.thang_ky
                LEFT JOIN tieu_thu_tong_ct t ON t.thang_ky = ct.thang_ky
                ORDER BY ct.thang_ky ASC
                """
        );
        params.add(laDien);
        params.add(loaiDichVu);
        params.add(loaiDichVu);

        return jdbcTemplate.query(
                sql.toString(),
                (rs, rowNum) -> {
                    BigDecimal mp = rs.getBigDecimal("muc_phong");
                    BigDecimal mc = rs.getBigDecimal("muc_chung");
                    BigDecimal mt = rs.getBigDecimal("muc_tong");
                    boolean coTong = rs.getBoolean("co_cong_to_tong");
                    boolean coDL = rs.getBoolean("co_du_lieu");
                    return new TieuThuThangRecord(
                            rs.getDate("thang_ky").toLocalDate(),
                            mp != null ? mp.setScale(2, RoundingMode.HALF_UP) : null,
                            mc != null ? mc.setScale(2, RoundingMode.HALF_UP) : null,
                            mt != null ? mt.setScale(2, RoundingMode.HALF_UP) : null,
                            coTong,
                            coDL
                    );
                },
                params.toArray()
        );
    }

    public record LichSuLapDayThangRecord(
            LocalDate thang,
            int dangThue,
            int tongSoPhong,
            BigDecimal tyLe
    ) {}

    public List<LichSuLapDayThangRecord> layLichSuLapDay(Long nguoiDungId, Long toaNhaId, LocalDate tuNgay, LocalDate denNgay) {
        StringBuilder sql = new StringBuilder(
                """
                WITH thang_series AS (
                    SELECT generate_series(
                        DATE_TRUNC('month', ?::DATE),
                        DATE_TRUNC('month', ?::DATE),
                        '1 month'::INTERVAL
                    )::DATE AS thang_dau
                ),
                thang_khung AS (
                    SELECT thang_dau, (thang_dau + '1 month'::INTERVAL - '1 day'::INTERVAL)::DATE AS thang_cuoi
                    FROM thang_series
                ),
                phong_scope AS (
                    SELECT p.id, p.toa_nha_id
                    FROM PHONG p
                    WHERE EXISTS (
                        SELECT 1 FROM PHAN_QUYEN_TOA pqt
                        WHERE pqt.toa_nha_id = p.toa_nha_id AND pqt.nguoi_dung_id = ?
                    )
                """
        );
        List<Object> params = new ArrayList<>(List.of(Date.valueOf(tuNgay), Date.valueOf(denNgay), nguoiDungId));
        if (toaNhaId != null) {
            sql.append(" AND p.toa_nha_id = ?");
            params.add(toaNhaId);
        }
        sql.append(
                """
                )
                SELECT tk.thang_dau,
                       COUNT(DISTINCT ps.id) AS tong_so_phong,
                       COUNT(DISTINCT CASE WHEN hd.id IS NOT NULL THEN ps.id ELSE NULL END) AS dang_thue
                FROM thang_khung tk
                CROSS JOIN phong_scope ps
                LEFT JOIN HOP_DONG hd ON hd.phong_id = ps.id
                     AND hd.trang_thai IN ('HIEU_LUC', 'DA_THANH_LY')
                     AND hd.ngay_bat_dau <= tk.thang_cuoi
                     AND hd.ngay_ket_thuc >= tk.thang_dau
                GROUP BY tk.thang_dau
                ORDER BY tk.thang_dau ASC
                """
        );
        return jdbcTemplate.query(
                sql.toString(),
                (rs, rowNum) -> {
                    LocalDate thang = rs.getDate("thang_dau").toLocalDate();
                    int tong = rs.getInt("tong_so_phong");
                    int thue = rs.getInt("dang_thue");
                    BigDecimal tyLe = tong > 0
                            ? BigDecimal.valueOf(thue * 100.0 / tong).setScale(2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO.setScale(2);
                    return new LichSuLapDayThangRecord(thang, thue, tong, tyLe);
                },
                params.toArray()
        );
    }

    public TuoiNoRecord layTuoiNo(Long nguoiDungId, Long toaNhaId, LocalDate ngayTinh) {
        StringBuilder sql = new StringBuilder(
                """
                WITH hoa_don_pham_vi AS (
                    SELECT hd.id,
                           hd.tong_tien,
                           hd.han_thanh_toan,
                           hd.da_thu AS da_thu_cot,
                           CAST(? AS DATE) - hd.han_thanh_toan AS so_ngay_qua_han
                    FROM HOA_DON hd
                    JOIN HOP_DONG hop_dong ON hop_dong.id = hd.hop_dong_id
                    JOIN PHONG p ON p.id = hop_dong.phong_id
                    WHERE EXISTS (
                        SELECT 1 FROM PHAN_QUYEN_TOA pqt
                        WHERE pqt.toa_nha_id = p.toa_nha_id AND pqt.nguoi_dung_id = ?
                    )
                      AND hd.trang_thai NOT IN ('NHAP', 'DA_HUY')
                """
        );
        List<Object> params = new ArrayList<>(List.of(Date.valueOf(ngayTinh), nguoiDungId));
        if (toaNhaId != null) {
            sql.append(" AND p.toa_nha_id = ?");
            params.add(toaNhaId);
        }
        sql.append(
                """
                ),
                thanh_toan_hd AS (
                    SELECT tt.hoa_don_id,
                           SUM(
                               CASE
                                   WHEN tt.loai = 'THU' THEN tt.so_tien
                                   WHEN tt.loai = 'DOI_UNG' THEN -tt.so_tien
                                   ELSE 0
                               END
                           ) AS tong_da_thu
                    FROM THANH_TOAN tt
                    JOIN hoa_don_pham_vi hd ON hd.id = tt.hoa_don_id
                    WHERE tt.loai IN ('THU', 'DOI_UNG')
                    GROUP BY tt.hoa_don_id
                ),
                con_no AS (
                    SELECT hd.id,
                           hd.so_ngay_qua_han,
                           hd.tong_tien - GREATEST(LEAST(COALESCE(t.tong_da_thu, hd.da_thu_cot, 0.00), hd.tong_tien), 0.00) AS con_lai
                    FROM hoa_don_pham_vi hd
                    LEFT JOIN thanh_toan_hd t ON t.hoa_don_id = hd.id
                )
                SELECT
                    COUNT(*) FILTER (WHERE con_lai > 0 AND so_ngay_qua_han <= 0) AS sl_chua_den_han,
                    COALESCE(SUM(con_lai) FILTER (WHERE con_lai > 0 AND so_ngay_qua_han <= 0), 0.00) AS tien_chua_den_han,
                    COUNT(*) FILTER (WHERE con_lai > 0 AND so_ngay_qua_han BETWEEN 1 AND 7) AS sl_qua_han_1_7,
                    COALESCE(SUM(con_lai) FILTER (WHERE con_lai > 0 AND so_ngay_qua_han BETWEEN 1 AND 7), 0.00) AS tien_qua_han_1_7,
                    COUNT(*) FILTER (WHERE con_lai > 0 AND so_ngay_qua_han BETWEEN 8 AND 30) AS sl_qua_han_8_30,
                    COALESCE(SUM(con_lai) FILTER (WHERE con_lai > 0 AND so_ngay_qua_han BETWEEN 8 AND 30), 0.00) AS tien_qua_han_8_30,
                    COUNT(*) FILTER (WHERE con_lai > 0 AND so_ngay_qua_han > 30) AS sl_qua_han_tren_30,
                    COALESCE(SUM(con_lai) FILTER (WHERE con_lai > 0 AND so_ngay_qua_han > 30), 0.00) AS tien_qua_han_tren_30
                FROM con_no
                """
        );

        return jdbcTemplate.queryForObject(
                sql.toString(),
                (rs, rowNum) -> new TuoiNoRecord(
                        new NhomTuoiNo(rs.getInt("sl_chua_den_han"), rs.getBigDecimal("tien_chua_den_han").setScale(2, RoundingMode.HALF_UP)),
                        new NhomTuoiNo(rs.getInt("sl_qua_han_1_7"), rs.getBigDecimal("tien_qua_han_1_7").setScale(2, RoundingMode.HALF_UP)),
                        new NhomTuoiNo(rs.getInt("sl_qua_han_8_30"), rs.getBigDecimal("tien_qua_han_8_30").setScale(2, RoundingMode.HALF_UP)),
                        new NhomTuoiNo(rs.getInt("sl_qua_han_tren_30"), rs.getBigDecimal("tien_qua_han_tren_30").setScale(2, RoundingMode.HALF_UP))
                ),
                params.toArray()
        );
    }

    public List<SoSanhToaNhaRecord> laySoSanhToaNha(
            Long nguoiDungId,
            LocalDate tuNgay,
            LocalDate denNgay,
            LocalDate ngayTinh
    ) {
        String sql = """
                SELECT tn.id AS toa_nha_id,
                       tn.ten AS ten_toa_nha,
                       -- Tổng phòng & phòng đang thuê
                       (SELECT COUNT(*) FROM PHONG p WHERE p.toa_nha_id = tn.id) AS tong_so_phong,
                       (SELECT COUNT(*) FROM PHONG p WHERE p.toa_nha_id = tn.id AND EXISTS (
                           SELECT 1 FROM HOP_DONG hd
                           WHERE hd.phong_id = p.id
                             AND hd.trang_thai = 'HIEU_LUC'
                             AND hd.ngay_bat_dau <= ? AND hd.ngay_ket_thuc >= ?
                       )) AS so_phong_dang_thue,
                       -- Doanh thu phát hành trong kỳ
                       COALESCE((
                           SELECT SUM(hd.tong_tien)
                           FROM HOA_DON hd
                           JOIN HOP_DONG h ON h.id = hd.hop_dong_id
                           JOIN PHONG p ON p.id = h.phong_id
                           WHERE p.toa_nha_id = tn.id
                             AND hd.ngay_phat_hanh BETWEEN ? AND ?
                             AND hd.trang_thai NOT IN ('NHAP', 'DA_HUY')
                       ), 0.00) AS doanh_thu_phat_hanh,
                       -- Đã thu = Σ đã thu của hoá đơn phát hành trong kỳ (cùng nguồn daThuTheoHoaDon)
                       COALESCE((
                           SELECT SUM(GREATEST(LEAST(COALESCE(
                               (SELECT SUM(CASE WHEN tt.loai = 'THU' THEN tt.so_tien WHEN tt.loai = 'DOI_UNG' THEN -tt.so_tien ELSE 0 END)
                                FROM THANH_TOAN tt WHERE tt.hoa_don_id = hd.id AND tt.loai IN ('THU', 'DOI_UNG')),
                               hd.da_thu, 0.00
                           ), hd.tong_tien), 0.00))
                           FROM HOA_DON hd
                           JOIN HOP_DONG h ON h.id = hd.hop_dong_id
                           JOIN PHONG p ON p.id = h.phong_id
                           WHERE p.toa_nha_id = tn.id
                             AND hd.ngay_phat_hanh BETWEEN ? AND ?
                             AND hd.trang_thai NOT IN ('NHAP', 'DA_HUY')
                       ), 0.00) AS thuc_thu,
                       -- Công nợ hiện tại
                       COALESCE((
                           SELECT SUM(hd.tong_tien - GREATEST(LEAST(COALESCE(
                               (SELECT SUM(
                                   CASE
                                       WHEN tt.loai = 'THU' THEN tt.so_tien
                                       WHEN tt.loai = 'DOI_UNG' THEN -tt.so_tien
                                       ELSE 0
                                   END
                                ) FROM THANH_TOAN tt WHERE tt.hoa_don_id = hd.id AND tt.loai IN ('THU', 'DOI_UNG')),
                               hd.da_thu, 0.00
                           ), hd.tong_tien), 0.00))
                           FROM HOA_DON hd
                           JOIN HOP_DONG h ON h.id = hd.hop_dong_id
                           JOIN PHONG p ON p.id = h.phong_id
                           WHERE p.toa_nha_id = tn.id
                             AND hd.trang_thai NOT IN ('NHAP', 'DA_HUY')
                       ), 0.00) AS cong_no,
                       -- Chi phí bảo trì đã ghi nhận trong kỳ
                       COALESCE((
                           SELECT SUM(yc.chi_phi)
                           FROM YEU_CAU_SUA_CHUA yc
                           JOIN PHONG p ON p.id = yc.phong_id
                           WHERE p.toa_nha_id = tn.id
                             AND yc.trang_thai <> 'DA_HUY'
                             AND (yc.tao_luc AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE BETWEEN ? AND ?
                       ), 0.00) AS chi_phi_bao_tri
                FROM TOA_NHA tn
                WHERE EXISTS (
                    SELECT 1 FROM PHAN_QUYEN_TOA pqt
                    WHERE pqt.toa_nha_id = tn.id AND pqt.nguoi_dung_id = ?
                )
                ORDER BY tn.id ASC
                """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> {
                    int tongPhong = rs.getInt("tong_so_phong");
                    int dangThue = rs.getInt("so_phong_dang_thue");
                    BigDecimal tyLe = tongPhong > 0
                            ? BigDecimal.valueOf(dangThue).multiply(BigDecimal.valueOf(100)).divide(BigDecimal.valueOf(tongPhong), 2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO.setScale(2);

                    return new SoSanhToaNhaRecord(
                            rs.getLong("toa_nha_id"),
                            rs.getString("ten_toa_nha"),
                            rs.getBigDecimal("doanh_thu_phat_hanh").setScale(2, RoundingMode.HALF_UP),
                            rs.getBigDecimal("thuc_thu").setScale(2, RoundingMode.HALF_UP),
                            rs.getBigDecimal("cong_no").setScale(2, RoundingMode.HALF_UP),
                            tyLe,
                            tongPhong,
                            dangThue,
                            rs.getBigDecimal("chi_phi_bao_tri").setScale(2, RoundingMode.HALF_UP)
                    );
                },
                Date.valueOf(ngayTinh), Date.valueOf(ngayTinh),
                Date.valueOf(tuNgay), Date.valueOf(denNgay),
                Date.valueOf(tuNgay), Date.valueOf(denNgay),
                Date.valueOf(tuNgay), Date.valueOf(denNgay),
                nguoiDungId
        );
    }

    public List<ChiPhiBaoTriThangRecord> layChiPhiBaoTriTheoThang(
            Long nguoiDungId,
            Long toaNhaId,
            LocalDate tuNgay,
            LocalDate denNgay
    ) {
        StringBuilder sql = new StringBuilder(
                """
                SELECT DATE_TRUNC('month', (yc.tao_luc AT TIME ZONE 'Asia/Ho_Chi_Minh'))::DATE AS thang,
                       SUM(COALESCE(yc.chi_phi, 0.00)) AS chi_phi,
                       COUNT(*) AS so_su_co
                FROM YEU_CAU_SUA_CHUA yc
                JOIN PHONG p ON p.id = yc.phong_id
                WHERE EXISTS (
                    SELECT 1 FROM PHAN_QUYEN_TOA pqt
                    WHERE pqt.toa_nha_id = p.toa_nha_id AND pqt.nguoi_dung_id = ?
                )
                  AND yc.trang_thai <> 'DA_HUY'
                  AND (yc.tao_luc AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE BETWEEN ? AND ?
                """
        );
        List<Object> params = new ArrayList<>(List.of(nguoiDungId, Date.valueOf(tuNgay), Date.valueOf(denNgay)));
        if (toaNhaId != null) {
            sql.append(" AND p.toa_nha_id = ?");
            params.add(toaNhaId);
        }
        sql.append(" GROUP BY thang ORDER BY thang ASC");

        return jdbcTemplate.query(
                sql.toString(),
                (rs, rowNum) -> new ChiPhiBaoTriThangRecord(
                        rs.getDate("thang").toLocalDate(),
                        rs.getBigDecimal("chi_phi").setScale(2, RoundingMode.HALF_UP),
                        rs.getInt("so_su_co")
                ),
                params.toArray()
        );
    }

    public int demSoSuCoDangMo(Long nguoiDungId, Long toaNhaId) {
        StringBuilder sql = new StringBuilder(
                """
                SELECT COUNT(*)
                FROM YEU_CAU_SUA_CHUA yc
                JOIN PHONG p ON p.id = yc.phong_id
                WHERE EXISTS (
                    SELECT 1 FROM PHAN_QUYEN_TOA pqt
                    WHERE pqt.toa_nha_id = p.toa_nha_id AND pqt.nguoi_dung_id = ?
                )
                  AND yc.trang_thai NOT IN ('DA_DONG', 'DA_HUY')
                """
        );
        List<Object> params = new ArrayList<>(List.of(nguoiDungId));
        if (toaNhaId != null) {
            sql.append(" AND p.toa_nha_id = ?");
            params.add(toaNhaId);
        }
        Integer count = jdbcTemplate.queryForObject(sql.toString(), Integer.class, params.toArray());
        return count == null ? 0 : count;
    }

    public record TaiChinhThangRecord(
            LocalDate thang,
            BigDecimal doanhThuPhatHanh,
            BigDecimal thucThu,
            BigDecimal daThuTheoHoaDon,
            BigDecimal congNo
    ) {}

    public record CoCauPhongRecord(
            int tongSoPhong,
            int dangThue,
            BigDecimal tyLeDangThue,
            int trong,
            BigDecimal tyLeTrong,
            int daCoc,
            BigDecimal tyLeDaCoc,
            int dangSua,
            BigDecimal tyLeDangSua,
            int ngungKhaiThac,
            BigDecimal tyLeNgungKhaiThac
    ) {}

    public record TuoiNoRecord(
            NhomTuoiNo chuaDenHan,
            NhomTuoiNo quaHan1Den7,
            NhomTuoiNo quaHan8Den30,
            NhomTuoiNo quaHanTren30
    ) {}

    public record NhomTuoiNo(int soLuong, BigDecimal soTien) {}

    public record SoSanhToaNhaRecord(
            Long toaNhaId,
            String tenToaNha,
            BigDecimal doanhThuPhatHanh,
            BigDecimal thucThu,
            BigDecimal congNo,
            BigDecimal tyLeLapDay,
            int tongSoPhong,
            int soPhongDangThue,
            BigDecimal chiPhiBaoTri
    ) {}

    public record ChiPhiBaoTriThangRecord(
            LocalDate thang,
            BigDecimal chiPhi,
            int soSuCo
    ) {}
}

