package com.prj1.ccm.suachua;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;

@Repository
public class YeuCauSuaChuaRepository {
    private final JdbcTemplate jdbcTemplate;

    public YeuCauSuaChuaRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Long insert(YeuCauSuaChua yeuCau) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO YEU_CAU_SUA_CHUA(
                            phong_id, nguoi_tao_id, hang_muc, mo_ta, muc_do, trang_thai, tao_luc
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        RETURNING id
                        """,
                Long.class,
                yeuCau.phongId(),
                yeuCau.nguoiTaoId(),
                yeuCau.hangMuc(),
                yeuCau.moTa(),
                yeuCau.mucDo().name(),
                yeuCau.trangThai().name(),
                Timestamp.from(yeuCau.taoLuc())
        );
    }

    public Optional<YeuCauSuaChuaView> findById(Long id) {
        return jdbcTemplate.query(
                        """
                                SELECT yc.id, yc.ma_yeu_cau, yc.phong_id, yc.nguoi_tao_id,
                                       yc.hang_muc, yc.mo_ta, yc.muc_do, yc.trang_thai,
                                       yc.nguoi_tiep_nhan_id, yc.tiep_nhan_luc,
                                       yc.nguoi_xu_ly_id, yc.phan_cong_luc, yc.chi_phi,
                                       yc.ben_chiu_chi_phi, yc.cho_xac_nhan_luc, yc.ly_do_huy, yc.tao_luc,
                                       p.toa_nha_id, tn.ten AS toa_nha, p.so_phong, p.tang
                                FROM YEU_CAU_SUA_CHUA yc
                                JOIN PHONG p ON p.id = yc.phong_id
                                JOIN TOA_NHA tn ON tn.id = p.toa_nha_id
                                WHERE yc.id = ?
                                """,
                        (resultSet, rowNum) -> mapView(resultSet),
                        id
                )
                .stream()
                .findFirst();
    }

    public boolean coHopDongHieuLucCuaNguoiThue(Long phongId, Long nguoiThueId, LocalDate ngay) {
        Boolean tonTai = jdbcTemplate.queryForObject(
                """
                        SELECT EXISTS(
                            SELECT 1
                            FROM HOP_DONG
                            WHERE phong_id = ?
                              AND nguoi_thue_id = ?
                              AND trang_thai = 'HIEU_LUC'
                              AND ngay_bat_dau <= ?
                              AND ngay_ket_thuc >= ?
                        )
                        """,
                Boolean.class,
                phongId,
                nguoiThueId,
                java.sql.Date.valueOf(ngay),
                java.sql.Date.valueOf(ngay)
        );
        return Boolean.TRUE.equals(tonTai);
    }

    public Optional<PhamViAnh> findPhamViAnh(Long yeuCauId) {
        return jdbcTemplate.query(
                        """
                                SELECT yc.phong_id, p.toa_nha_id, yc.nguoi_tao_id,
                                       nguoi_tao.nguoi_thue_id AS nguoi_tao_nguoi_thue_id,
                                       yc.nguoi_xu_ly_id
                                FROM YEU_CAU_SUA_CHUA yc
                                JOIN PHONG p ON p.id = yc.phong_id
                                JOIN NGUOI_DUNG nguoi_tao ON nguoi_tao.id = yc.nguoi_tao_id
                                WHERE yc.id = ?
                                """,
                        (resultSet, rowNum) -> new PhamViAnh(
                                resultSet.getLong("phong_id"),
                                resultSet.getLong("toa_nha_id"),
                                resultSet.getLong("nguoi_tao_id"),
                                layLongNullable(resultSet, "nguoi_tao_nguoi_thue_id"),
                                layLongNullable(resultSet, "nguoi_xu_ly_id")
                        ),
                        yeuCauId
                )
                .stream()
                .findFirst();
    }

    private YeuCauSuaChuaView mapView(ResultSet resultSet) throws SQLException {
        return new YeuCauSuaChuaView(
                new YeuCauSuaChua(
                        resultSet.getLong("id"),
                        resultSet.getString("ma_yeu_cau"),
                        resultSet.getLong("phong_id"),
                        resultSet.getLong("nguoi_tao_id"),
                        resultSet.getString("hang_muc"),
                        resultSet.getString("mo_ta"),
                        MucDo.valueOf(resultSet.getString("muc_do")),
                        TrangThaiYeuCau.valueOf(resultSet.getString("trang_thai")),
                        layLongNullable(resultSet, "nguoi_tiep_nhan_id"),
                        layInstantNullable(resultSet, "tiep_nhan_luc"),
                        layLongNullable(resultSet, "nguoi_xu_ly_id"),
                        layInstantNullable(resultSet, "phan_cong_luc"),
                        resultSet.getBigDecimal("chi_phi"),
                        layBenChiuChiPhi(resultSet.getString("ben_chiu_chi_phi")),
                        layInstantNullable(resultSet, "cho_xac_nhan_luc"),
                        resultSet.getString("ly_do_huy"),
                        resultSet.getTimestamp("tao_luc").toInstant()
                ),
                resultSet.getLong("toa_nha_id"),
                resultSet.getString("toa_nha"),
                resultSet.getString("so_phong"),
                resultSet.getInt("tang")
        );
    }

    private Long layLongNullable(ResultSet resultSet, String column) throws SQLException {
        long value = resultSet.getLong(column);
        return resultSet.wasNull() ? null : value;
    }

    private Instant layInstantNullable(ResultSet resultSet, String column) throws SQLException {
        Timestamp value = resultSet.getTimestamp(column);
        return value == null ? null : value.toInstant();
    }

    private BenChiuChiPhi layBenChiuChiPhi(String value) {
        return value == null ? null : BenChiuChiPhi.valueOf(value);
    }

    public record YeuCauSuaChuaView(
            YeuCauSuaChua yeuCau,
            Long toaNhaId,
            String toaNha,
            String soPhong,
            int tang
    ) {
    }

    public record PhamViAnh(
            Long phongId,
            Long toaNhaId,
            Long nguoiTaoId,
            Long nguoiTaoNguoiThueId,
            Long nguoiXuLyId
    ) {
    }
}
