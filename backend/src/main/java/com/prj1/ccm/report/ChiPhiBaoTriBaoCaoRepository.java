package com.prj1.ccm.report;

import com.prj1.ccm.suachua.BenChiuChiPhi;
import com.prj1.ccm.suachua.TrangThaiYeuCau;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** FR-RPT-02/FR-RPT-08 reads repair costs from the repair request source and keeps invoice extras out of the amount. */
@Repository
public class ChiPhiBaoTriBaoCaoRepository {
    private final JdbcTemplate jdbcTemplate;

    public ChiPhiBaoTriBaoCaoRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /** FR-RPT-02/FR-RPT-08 filters by the project's local calendar date and embeds PHAN_QUYEN_TOA in the read query. */
    public List<KhoanChiPhiBaoTriBaoCao> findChiPhi(
            Long nguoiDungId,
            Long toaNhaId,
            Long phongId,
            LocalDate tuNgay,
            LocalDate denNgay
    ) {
        StringBuilder sql = new StringBuilder(
                """
                        SELECT yc.id AS yeu_cau_id,
                               p.toa_nha_id,
                               tn.ma_toa,
                               tn.ten AS ten_toa_nha,
                               yc.phong_id,
                               p.so_phong,
                               yc.hang_muc,
                               (yc.tao_luc AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE AS ngay_tao,
                               yc.tao_luc,
                               yc.trang_thai,
                               yc.cho_xac_nhan_luc,
                               yc.chi_phi,
                               yc.ben_chiu_chi_phi
                        FROM YEU_CAU_SUA_CHUA yc
                        JOIN PHONG p ON p.id = yc.phong_id
                        JOIN TOA_NHA tn ON tn.id = p.toa_nha_id
                        WHERE EXISTS (
                            SELECT 1
                            FROM PHAN_QUYEN_TOA pqt
                            WHERE pqt.toa_nha_id = p.toa_nha_id
                              AND pqt.nguoi_dung_id = ?
                        )
                          AND yc.trang_thai <> 'DA_HUY'
                          AND (yc.tao_luc AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE BETWEEN ? AND ?
                        """
        );
        List<Object> thamSo = new ArrayList<>(List.of(nguoiDungId, tuNgay, denNgay));
        if (toaNhaId != null) {
            sql.append(" AND p.toa_nha_id = ? ");
            thamSo.add(toaNhaId);
        }
        if (phongId != null) {
            sql.append(" AND yc.phong_id = ? ");
            thamSo.add(phongId);
        }
        sql.append(
                """
                        ORDER BY ngay_tao, p.toa_nha_id, yc.hang_muc, p.so_phong, yc.id
                        """
        );

        return jdbcTemplate.query(
                sql.toString(),
                (resultSet, rowNum) -> new KhoanChiPhiBaoTriBaoCao(
                        resultSet.getLong("yeu_cau_id"),
                        resultSet.getLong("toa_nha_id"),
                        resultSet.getString("ma_toa"),
                        resultSet.getString("ten_toa_nha"),
                        resultSet.getLong("phong_id"),
                        resultSet.getString("so_phong"),
                        resultSet.getString("hang_muc"),
                        resultSet.getObject("ngay_tao", LocalDate.class),
                        resultSet.getTimestamp("tao_luc").toInstant(),
                        TrangThaiYeuCau.valueOf(resultSet.getString("trang_thai")),
                        layInstantNullable(resultSet, "cho_xac_nhan_luc"),
                        resultSet.getBigDecimal("chi_phi"),
                        layBenChiuChiPhi(resultSet.getString("ben_chiu_chi_phi"))
                ),
                thamSo.toArray()
        );
    }

    public Optional<Long> findToaNhaIdByPhongId(Long phongId) {
        return jdbcTemplate.query(
                        "SELECT toa_nha_id FROM PHONG WHERE id = ?",
                        (resultSet, rowNum) -> resultSet.getLong("toa_nha_id"),
                        phongId
                )
                .stream()
                .findFirst();
    }

    /** FR-RPT-02/FR-RPT-08 reasserts a selected building permission in the same report transaction. */
    public boolean xacNhanPhanQuyenToa(Long nguoiDungId, Long toaNhaId) {
        return !jdbcTemplate.query(
                """
                        SELECT 1
                        FROM PHAN_QUYEN_TOA
                        WHERE nguoi_dung_id = ? AND toa_nha_id = ?
                        """,
                (resultSet, rowNum) -> resultSet.getInt(1),
                nguoiDungId,
                toaNhaId
        ).isEmpty();
    }

    private Instant layInstantNullable(ResultSet resultSet, String column) throws SQLException {
        Timestamp value = resultSet.getTimestamp(column);
        return value == null ? null : value.toInstant();
    }

    private BenChiuChiPhi layBenChiuChiPhi(String value) {
        return value == null ? null : BenChiuChiPhi.valueOf(value);
    }
}
