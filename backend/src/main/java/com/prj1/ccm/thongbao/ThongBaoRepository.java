package com.prj1.ccm.thongbao;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class ThongBaoRepository {
    private final JdbcTemplate jdbcTemplate;

    public ThongBaoRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Long insert(ThongBao thongBao) {
        UUID maThamChieu = thongBao.maThamChieu() == null ? UUID.randomUUID() : thongBao.maThamChieu();
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO THONG_BAO(
                            ma_tham_chieu, nguoi_nhan_id, doi_tuong_loai, doi_tuong_id,
                            tieu_de, noi_dung, da_doc, doc_luc, tao_luc
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        RETURNING id
                        """,
                Long.class,
                maThamChieu,
                thongBao.nguoiNhanId(),
                thongBao.doiTuongLoai().name(),
                thongBao.doiTuongId(),
                thongBao.tieuDe(),
                thongBao.noiDung(),
                thongBao.daDoc(),
                timestamp(thongBao.docLuc()),
                timestamp(thongBao.taoLuc())
        );
    }

    public Optional<ThongBao> findByMaThamChieu(UUID maThamChieu) {
        return jdbcTemplate.query(sqlSelect() + " WHERE tb.ma_tham_chieu = ?", (resultSet, rowNum) -> map(resultSet), maThamChieu)
                .stream()
                .findFirst();
    }

    public List<ThongBao> findAllByNguoiNhan(Long nguoiNhanId) {
        return jdbcTemplate.query(
                sqlSelect() + " WHERE tb.nguoi_nhan_id = ? ORDER BY tb.da_doc ASC, tb.tao_luc DESC, tb.id DESC",
                (resultSet, rowNum) -> map(resultSet),
                nguoiNhanId
        );
    }

    public Optional<ThongBao> markAsRead(UUID maThamChieu, Long nguoiNhanId, Instant docLuc) {
        return jdbcTemplate.query(
                """
                        UPDATE THONG_BAO
                        SET da_doc = TRUE, doc_luc = COALESCE(doc_luc, ?)
                        WHERE ma_tham_chieu = ? AND nguoi_nhan_id = ? AND da_doc = FALSE
                        RETURNING id, ma_tham_chieu, nguoi_nhan_id, doi_tuong_loai, doi_tuong_id,
                                  tieu_de, noi_dung, da_doc, doc_luc, tao_luc
                        """,
                (resultSet, rowNum) -> map(resultSet),
                timestamp(docLuc),
                maThamChieu,
                nguoiNhanId
        ).stream().findFirst();
    }

    public List<Long> findNguoiQuanLyIdTheoToa(Long toaNhaId) {
        return jdbcTemplate.queryForList(
                """
                        SELECT nd.id
                        FROM NGUOI_DUNG nd
                        JOIN PHAN_QUYEN_TOA pqt ON pqt.nguoi_dung_id = nd.id
                        WHERE pqt.toa_nha_id = ?
                          AND nd.vai_tro = 'QUAN_LY'
                          AND nd.trang_thai = 'HOAT_DONG'
                        ORDER BY nd.id
                        """,
                Long.class,
                toaNhaId
        );
    }

    public Optional<YeuCauSuaChuaThongBao> findYeuCauSuaChuaThongBao(Long yeuCauId) {
        return jdbcTemplate.query(
                        """
                                SELECT yc.id, yc.nguoi_xu_ly_id, p.so_phong, yc.mo_ta, yc.muc_do
                                FROM YEU_CAU_SUA_CHUA yc
                                JOIN PHONG p ON p.id = yc.phong_id
                                WHERE yc.id = ?
                                """,
                        (resultSet, rowNum) -> new YeuCauSuaChuaThongBao(
                                resultSet.getLong("id"),
                                layLongNullable(resultSet, "nguoi_xu_ly_id"),
                                resultSet.getString("so_phong"),
                                resultSet.getString("mo_ta"),
                                resultSet.getString("muc_do")
                        ),
                        yeuCauId
                )
                .stream()
                .findFirst();
    }

    public Optional<Long> findToaNhaIdCuaYeuCau(Long yeuCauId) {
        return jdbcTemplate.query(
                        """
                                SELECT p.toa_nha_id
                                FROM YEU_CAU_SUA_CHUA yc
                                JOIN PHONG p ON p.id = yc.phong_id
                                WHERE yc.id = ?
                                """,
                        (resultSet, rowNum) -> resultSet.getLong("toa_nha_id"),
                        yeuCauId
                )
                .stream()
                .findFirst();
    }

    public Optional<HoaDonThongBao> findHoaDonThongBao(Long hoaDonId) {
        return jdbcTemplate.query(
                        """
                                SELECT nd.id AS nguoi_nhan_id,
                                       p.so_phong,
                                       hd.ma_hoa_don,
                                       ky.nam,
                                       ky.thang
                                FROM HOA_DON hd
                                JOIN HOP_DONG hop_dong ON hop_dong.id = hd.hop_dong_id
                                JOIN PHONG p ON p.id = hop_dong.phong_id
                                JOIN NGUOI_THUE nt ON nt.id = hop_dong.nguoi_thue_id
                                JOIN NGUOI_DUNG nd ON nd.nguoi_thue_id = nt.id
                                LEFT JOIN KY_THANH_TOAN ky ON ky.id = hd.ky_id
                                WHERE hd.id = ?
                                  AND nd.vai_tro = 'NGUOI_THUE'
                                  AND nd.trang_thai = 'HOAT_DONG'
                                ORDER BY nd.id
                                LIMIT 1
                                """,
                        (resultSet, rowNum) -> new HoaDonThongBao(
                                resultSet.getLong("nguoi_nhan_id"),
                                resultSet.getString("so_phong"),
                                resultSet.getString("ma_hoa_don"),
                                layIntegerNullable(resultSet, "nam"),
                                layIntegerNullable(resultSet, "thang")
                        ),
                        hoaDonId
                )
                .stream()
                .findFirst();
    }

    public boolean existsDoiTuong(LoaiDoiTuongThongBao loai, Long id) {
        String table = switch (loai) {
            case YEU_CAU_SUA_CHUA -> "YEU_CAU_SUA_CHUA";
            case HOA_DON -> "HOA_DON";
        };
        Boolean exists = jdbcTemplate.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM " + table + " WHERE id = ?)",
                Boolean.class,
                id
        );
        return Boolean.TRUE.equals(exists);
    }

    private String sqlSelect() {
        return """
                SELECT tb.id, tb.ma_tham_chieu, tb.nguoi_nhan_id, tb.doi_tuong_loai, tb.doi_tuong_id,
                       tb.tieu_de, tb.noi_dung, tb.da_doc, tb.doc_luc, tb.tao_luc
                FROM THONG_BAO tb
                """;
    }

    private ThongBao map(ResultSet resultSet) throws SQLException {
        return new ThongBao(
                resultSet.getLong("id"),
                layUuid(resultSet, "ma_tham_chieu"),
                resultSet.getLong("nguoi_nhan_id"),
                LoaiDoiTuongThongBao.valueOf(resultSet.getString("doi_tuong_loai")),
                resultSet.getLong("doi_tuong_id"),
                resultSet.getString("tieu_de"),
                resultSet.getString("noi_dung"),
                resultSet.getBoolean("da_doc"),
                instant(resultSet.getTimestamp("doc_luc")),
                instant(resultSet.getTimestamp("tao_luc"))
        );
    }

    private Timestamp timestamp(Instant value) {
        return value == null ? null : Timestamp.from(value);
    }

    private Instant instant(Timestamp value) {
        return value == null ? null : value.toInstant();
    }

    private Long layLongNullable(ResultSet resultSet, String column) throws SQLException {
        long value = resultSet.getLong(column);
        return resultSet.wasNull() ? null : value;
    }

    private UUID layUuid(ResultSet resultSet, String column) throws SQLException {
        Object value = resultSet.getObject(column);
        return value instanceof UUID uuid ? uuid : UUID.fromString(value.toString());
    }

    private Integer layIntegerNullable(ResultSet resultSet, String column) throws SQLException {
        int value = resultSet.getInt(column);
        return resultSet.wasNull() ? null : value;
    }

    public record YeuCauSuaChuaThongBao(
            Long id,
            Long nguoiXuLyId,
            String soPhong,
            String moTa,
            String mucDo
    ) {
    }

    public record HoaDonThongBao(
            Long nguoiNhanId,
            String soPhong,
            String maHoaDon,
            Integer nam,
            Integer thang
    ) {
    }
}
