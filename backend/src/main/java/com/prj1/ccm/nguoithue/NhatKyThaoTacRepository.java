package com.prj1.ccm.nguoithue;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDateTime;

@Repository
public class NhatKyThaoTacRepository {
    private final JdbcTemplate jdbcTemplate;

    public NhatKyThaoTacRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void ghi(Long nguoiDungId, String hanhDong, String doiTuong, String giaTriTruoc, String giaTriSau) {
        ghi(nguoiDungId, hanhDong, doiTuong, giaTriTruoc, giaTriSau, null, null, null, null);
    }

    public void ghi(
            Long nguoiDungId,
            String hanhDong,
            String doiTuong,
            String giaTriTruoc,
            String giaTriSau,
            Long phongId,
            Long dichVuId,
            String lyDo,
            LocalDateTime thoiDiem
    ) {
        jdbcTemplate.update(
                """
                        INSERT INTO NHAT_KY_THAO_TAC(
                            nguoi_dung_id, hanh_dong, doi_tuong, gia_tri_truoc, gia_tri_sau, phong_id, dich_vu_id, ly_do, thoi_diem
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
                        """,
                nguoiDungId,
                hanhDong,
                doiTuong,
                giaTriTruoc,
                giaTriSau,
                phongId,
                dichVuId,
                lyDo,
                thoiDiem == null ? null : Timestamp.valueOf(thoiDiem)
        );
    }
}
