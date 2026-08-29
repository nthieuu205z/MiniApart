package com.prj1.ccm.nguoithue;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
class NhatKyThaoTacRepository {
    private final JdbcTemplate jdbcTemplate;

    NhatKyThaoTacRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void ghi(Long nguoiDungId, String hanhDong, String doiTuong, String giaTriTruoc, String giaTriSau) {
        jdbcTemplate.update(
                """
                        INSERT INTO NHAT_KY_THAO_TAC(nguoi_dung_id, hanh_dong, doi_tuong, gia_tri_truoc, gia_tri_sau)
                        VALUES (?, ?, ?, ?, ?)
                        """,
                nguoiDungId,
                hanhDong,
                doiTuong,
                giaTriTruoc,
                giaTriSau
        );
    }
}
