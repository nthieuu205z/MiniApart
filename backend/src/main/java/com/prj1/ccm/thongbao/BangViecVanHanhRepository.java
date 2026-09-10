package com.prj1.ccm.thongbao;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
class BangViecVanHanhRepository {
    private final JdbcTemplate jdbcTemplate;

    BangViecVanHanhRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    int demHoaDonQuaHanChuaThanhToan(Long toaNhaId, LocalDate homNay) {
        Integer dem = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM HOA_DON hd
                        JOIN HOP_DONG hop_dong ON hop_dong.id = hd.hop_dong_id
                        JOIN PHONG p ON p.id = hop_dong.phong_id
                        WHERE p.toa_nha_id = ?
                          AND hd.trang_thai IN ('DA_PHAT_HANH', 'DA_THU_MOT_PHAN', 'QUA_HAN')
                          AND hd.han_thanh_toan < ?
                          AND COALESCE((
                              SELECT SUM(tt.so_tien)
                              FROM THANH_TOAN tt
                              WHERE tt.hoa_don_id = hd.id
                          ), hd.da_thu) < hd.tong_tien
                        """,
                Integer.class,
                toaNhaId,
                homNay
        );
        return dem == null ? 0 : dem;
    }

    int demPhongThieuChiSoSauNgayChot(Long toaNhaId, LocalDate homNay) {
        Integer dem = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(DISTINCT p.id)
                        FROM KY_THANH_TOAN kt
                        JOIN PHONG p ON p.toa_nha_id = kt.toa_nha_id
                        JOIN HOP_DONG hd ON hd.phong_id = p.id
                        JOIN HOP_DONG_DICH_VU hddv ON hddv.hop_dong_id = hd.id
                        JOIN DICH_VU dv ON dv.id = hddv.dich_vu_id
                        LEFT JOIN CHI_SO_DICH_VU cs
                               ON cs.ky_id = kt.id
                              AND cs.phong_id = p.id
                              AND cs.dich_vu_id = dv.id
                        WHERE kt.toa_nha_id = ?
                          AND kt.trang_thai = 'DANG_MO'
                          AND kt.ngay_ket_thuc <= ?
                          AND hd.trang_thai = 'HIEU_LUC'
                          AND dv.cach_tinh = 'THEO_CHI_SO'
                          AND dv.dang_su_dung = TRUE
                          AND daterange(hd.ngay_bat_dau, hd.ngay_ket_thuc, '[]')
                              && daterange(kt.ngay_bat_dau, kt.ngay_ket_thuc, '[]')
                          AND cs.id IS NULL
                        """,
                Integer.class,
                toaNhaId,
                homNay
        );
        return dem == null ? 0 : dem;
    }

    int demHopDongSapHetHan(Long toaNhaId, LocalDate homNay) {
        Integer dem = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM HOP_DONG hd
                        JOIN PHONG p ON p.id = hd.phong_id
                        WHERE p.toa_nha_id = ?
                          AND hd.trang_thai = 'HIEU_LUC'
                          AND hd.ngay_ket_thuc BETWEEN ? AND ?
                        """,
                Integer.class,
                toaNhaId,
                homNay,
                homNay.plusDays(30)
        );
        return dem == null ? 0 : dem;
    }
}
