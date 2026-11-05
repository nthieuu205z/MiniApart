package com.prj1.ccm.thongbao;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
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
        return jdbcTemplate.query(sqlSelect() + " WHERE tb.ma_tham_chieu = ?",
                        (resultSet, rowNum) -> map(resultSet), maThamChieu)
                .stream()
                .findFirst();
    }

    /** Legacy query retained for existing notification flows; the service uses the archive-aware overload. */
    public List<ThongBao> findAllByNguoiNhan(Long nguoiNhanId) {
        return jdbcTemplate.query(
                sqlSelect() + " WHERE tb.nguoi_nhan_id = ? ORDER BY tb.da_doc ASC, tb.tao_luc DESC, tb.id DESC",
                (resultSet, rowNum) -> map(resultSet),
                nguoiNhanId
        );
    }

    public List<ThongBao> findAllByNguoiNhan(Long nguoiNhanId, Instant hienTai, boolean luuTru) {
        String dieuKien = luuTru
                ? " AND tbc.id IS NOT NULL AND tbc.het_han_luc <= ?"
                : " AND (tbc.id IS NULL OR tbc.het_han_luc > ?)";
        return jdbcTemplate.query(
                sqlSelect() + " WHERE tb.nguoi_nhan_id = ?" + dieuKien
                        + " ORDER BY tb.da_doc ASC, tb.tao_luc DESC, tb.id DESC",
                (resultSet, rowNum) -> map(resultSet),
                nguoiNhanId,
                timestamp(hienTai)
        );
    }

    public Optional<ThongBao> markAsRead(UUID maThamChieu, Long nguoiNhanId, Instant docLuc) {
        int updated = jdbcTemplate.update(
                """
                        UPDATE THONG_BAO
                        SET da_doc = TRUE, doc_luc = COALESCE(doc_luc, ?)
                        WHERE ma_tham_chieu = ? AND nguoi_nhan_id = ? AND da_doc = FALSE
                        """,
                timestamp(docLuc),
                maThamChieu,
                nguoiNhanId
        );
        return updated == 0 ? Optional.empty() : findByMaThamChieu(maThamChieu);
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
            case THONG_BAO_CHUNG -> "THONG_BAO_CHUNG";
        };
        Boolean exists = jdbcTemplate.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM " + table + " WHERE id = ?)",
                Boolean.class,
                id
        );
        return Boolean.TRUE.equals(exists);
    }

    public NguoiNhanSnapshot snapshotNguoiNhan(YeuCauThongBaoChung yeuCau, LocalDate ngayNghiepVu) {
        ScopeSql scope = scopeSql(yeuCau);
        List<Object> args = new ArrayList<>(scope.arguments());
        args.add(java.sql.Date.valueOf(ngayNghiepVu));
        args.add(java.sql.Date.valueOf(ngayNghiepVu));
        List<RecipientRow> rows = jdbcTemplate.query(
                """
                        SELECT hd.phong_id,
                               nd.id AS nguoi_nhan_id
                        FROM HOP_DONG hd
                        JOIN PHONG p ON p.id = hd.phong_id
                        LEFT JOIN NGUOI_DUNG nd ON nd.nguoi_thue_id = hd.nguoi_thue_id
                            AND nd.vai_tro = 'NGUOI_THUE'
                            AND nd.trang_thai = 'HOAT_DONG'
                        WHERE %s
                          AND hd.trang_thai = 'HIEU_LUC'
                          AND hd.ngay_bat_dau <= ?
                          AND hd.ngay_ket_thuc >= ?
                        ORDER BY hd.phong_id, nd.id
                        """.formatted(scope.whereClause()),
                (resultSet, rowNum) -> new RecipientRow(
                        resultSet.getLong("phong_id"),
                        layLongNullable(resultSet, "nguoi_nhan_id")
                ),
                args.toArray()
        );

        Map<Long, Boolean> roomHasAccount = new LinkedHashMap<>();
        LinkedHashSet<Long> recipientIds = new LinkedHashSet<>();
        for (RecipientRow row : rows) {
            roomHasAccount.putIfAbsent(row.roomId(), false);
            if (row.recipientId() != null) {
                roomHasAccount.put(row.roomId(), true);
                recipientIds.add(row.recipientId());
            }
        }
        int soPhongNhan = (int) roomHasAccount.values().stream().filter(Boolean.TRUE::equals).count();
        int soPhongKhongCoTaiKhoan = (int) roomHasAccount.values().stream().filter(value -> !value).count();
        return new NguoiNhanSnapshot(
                recipientIds.stream().sorted().toList(),
                soPhongNhan,
                soPhongKhongCoTaiKhoan
        );
    }

    public ThongTinXemTruocThongBaoChung xemTruoc(YeuCauThongBaoChung yeuCau, LocalDate ngayNghiepVu) {
        return snapshotNguoiNhan(yeuCau, ngayNghiepVu).thongTin();
    }

    public int countRoomsBelongingToBuilding(Long toaNhaId, List<Long> phongIds) {
        if (phongIds.isEmpty()) {
            return 0;
        }
        String placeholders = String.join(", ", phongIds.stream().map(id -> "?").toList());
        List<Object> args = new ArrayList<>();
        args.add(toaNhaId);
        args.addAll(phongIds);
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM PHONG WHERE toa_nha_id = ? AND id IN (" + placeholders + ")",
                Integer.class,
                args.toArray()
        );
        return count == null ? 0 : count;
    }

    public Optional<ThongBaoChung> findCommonByKey(Long nguoiGuiId, String khoaChongLap) {
        return jdbcTemplate.query(
                        sqlCommon() + " WHERE nguoi_gui_id = ? AND khoa_chong_lap = ?",
                        (resultSet, rowNum) -> mapCommon(resultSet),
                        nguoiGuiId,
                        khoaChongLap
                )
                .stream()
                .findFirst();
    }

    public Optional<ThongBaoChung> insertCommon(
            Long nguoiGuiId,
            YeuCauThongBaoChung yeuCau,
            String phamVi,
            String phongIds,
            String khoaChongLap,
            String dauVaoHash,
            ThongTinXemTruocThongBaoChung xemTruoc
    ) {
        return jdbcTemplate.query(
                        """
                                INSERT INTO THONG_BAO_CHUNG(
                                    ma_tham_chieu, nguoi_gui_id, toa_nha_id, pham_vi, tang, phong_ids,
                                    tieu_de, noi_dung, het_han_luc, khoa_chong_lap, dau_vao_hash,
                                    so_nguoi_nhan, so_phong_nhan, so_phong_khong_co_tai_khoan
                                )
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                ON CONFLICT (nguoi_gui_id, khoa_chong_lap) DO NOTHING
                                RETURNING id, ma_tham_chieu, nguoi_gui_id, toa_nha_id, pham_vi, tang, phong_ids,
                                          tieu_de, noi_dung, het_han_luc, khoa_chong_lap, dau_vao_hash,
                                          so_nguoi_nhan, so_phong_nhan, so_phong_khong_co_tai_khoan, tao_luc
                                """,
                        (resultSet, rowNum) -> mapCommon(resultSet),
                        UUID.randomUUID(),
                        nguoiGuiId,
                        yeuCau.toaNhaId(),
                        phamVi,
                        yeuCau.tang(),
                        phongIds,
                        yeuCau.tieuDe().trim(),
                        yeuCau.noiDung().trim(),
                        timestamp(yeuCau.hetHanLuc()),
                        khoaChongLap,
                        dauVaoHash,
                        xemTruoc.soNguoiNhan(),
                        xemTruoc.soPhongNhan(),
                        xemTruoc.soPhongKhongCoTaiKhoan()
                )
                .stream()
                .findFirst();
    }

    public boolean coQuyenXemAnhThongBaoChung(Long nguoiDungId, Long thongBaoChungId) {
        Boolean allowed = jdbcTemplate.queryForObject(
                """
                        SELECT EXISTS (
                            SELECT 1
                            FROM THONG_BAO tb
                            WHERE tb.doi_tuong_loai = 'THONG_BAO_CHUNG'
                              AND tb.doi_tuong_id = ?
                              AND tb.nguoi_nhan_id = ?
                        ) OR EXISTS (
                            SELECT 1
                            FROM THONG_BAO_CHUNG tbc
                            WHERE tbc.id = ?
                              AND tbc.nguoi_gui_id = ?
                        )
                        """,
                Boolean.class,
                thongBaoChungId,
                nguoiDungId,
                thongBaoChungId,
                nguoiDungId
        );
        return Boolean.TRUE.equals(allowed);
    }

    private String sqlSelect() {
        return """
                SELECT tb.id, tb.ma_tham_chieu, tb.nguoi_nhan_id, tb.doi_tuong_loai, tb.doi_tuong_id,
                       tb.tieu_de, tb.noi_dung, tb.da_doc, tb.doc_luc, tb.tao_luc,
                       tbc.het_han_luc
                FROM THONG_BAO tb
                LEFT JOIN THONG_BAO_CHUNG tbc
                    ON tbc.id = tb.doi_tuong_id AND tb.doi_tuong_loai = 'THONG_BAO_CHUNG'
                """;
    }

    private String sqlCommon() {
        return """
                SELECT id, ma_tham_chieu, nguoi_gui_id, toa_nha_id, pham_vi, tang, phong_ids,
                       tieu_de, noi_dung, het_han_luc, khoa_chong_lap, dau_vao_hash,
                       so_nguoi_nhan, so_phong_nhan, so_phong_khong_co_tai_khoan, tao_luc
                FROM THONG_BAO_CHUNG
                """;
    }

    private ThongBao map(ResultSet resultSet) throws SQLException {
        LoaiDoiTuongThongBao loai = LoaiDoiTuongThongBao.valueOf(resultSet.getString("doi_tuong_loai"));
        Long doiTuongId = resultSet.getLong("doi_tuong_id");
        return new ThongBao(
                resultSet.getLong("id"),
                layUuid(resultSet, "ma_tham_chieu"),
                resultSet.getLong("nguoi_nhan_id"),
                loai,
                doiTuongId,
                resultSet.getString("tieu_de"),
                resultSet.getString("noi_dung"),
                resultSet.getBoolean("da_doc"),
                instant(resultSet.getTimestamp("doc_luc")),
                instant(resultSet.getTimestamp("tao_luc")),
                instant(resultSet.getTimestamp("het_han_luc")),
                loai == LoaiDoiTuongThongBao.THONG_BAO_CHUNG ? findAttachmentIds(doiTuongId) : List.of()
        );
    }

    private List<Long> findAttachmentIds(Long thongBaoChungId) {
        return jdbcTemplate.queryForList(
                """
                        SELECT id
                        FROM ANH_DINH_KEM
                        WHERE doi_tuong_loai = 'THONG_BAO_CHUNG' AND doi_tuong_id = ?
                        ORDER BY id
                        """,
                Long.class,
                thongBaoChungId
        );
    }

    private ThongBaoChung mapCommon(ResultSet resultSet) throws SQLException {
        return new ThongBaoChung(
                resultSet.getLong("id"),
                layUuid(resultSet, "ma_tham_chieu"),
                resultSet.getLong("nguoi_gui_id"),
                resultSet.getLong("toa_nha_id"),
                resultSet.getString("pham_vi"),
                layIntegerNullable(resultSet, "tang"),
                resultSet.getString("phong_ids"),
                resultSet.getString("tieu_de"),
                resultSet.getString("noi_dung"),
                instant(resultSet.getTimestamp("het_han_luc")),
                resultSet.getString("khoa_chong_lap"),
                resultSet.getString("dau_vao_hash"),
                resultSet.getInt("so_nguoi_nhan"),
                resultSet.getInt("so_phong_nhan"),
                resultSet.getInt("so_phong_khong_co_tai_khoan"),
                instant(resultSet.getTimestamp("tao_luc"))
        );
    }

    private ScopeSql scopeSql(YeuCauThongBaoChung yeuCau) {
        List<Object> arguments = new ArrayList<>();
        arguments.add(yeuCau.toaNhaId());
        if (yeuCau.tang() != null) {
            arguments.add(yeuCau.tang());
            return new ScopeSql("p.toa_nha_id = ? AND p.tang = ?", arguments);
        }
        if (!yeuCau.phongIds().isEmpty()) {
            arguments.addAll(yeuCau.phongIds());
            String placeholders = String.join(", ", yeuCau.phongIds().stream().map(id -> "?").toList());
            return new ScopeSql("p.toa_nha_id = ? AND p.id IN (" + placeholders + ")", arguments);
        }
        return new ScopeSql("p.toa_nha_id = ?", arguments);
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

    private Integer layIntegerNullable(ResultSet resultSet, String column) throws SQLException {
        int value = resultSet.getInt(column);
        return resultSet.wasNull() ? null : value;
    }

    private UUID layUuid(ResultSet resultSet, String column) throws SQLException {
        Object value = resultSet.getObject(column);
        return value instanceof UUID uuid ? uuid : UUID.fromString(value.toString());
    }

    private record ScopeSql(String whereClause, List<Object> arguments) {
    }

    private record RecipientRow(Long roomId, Long recipientId) {
    }

    public record NguoiNhanSnapshot(
            List<Long> nguoiNhanIds,
            int soPhongNhan,
            int soPhongKhongCoTaiKhoan
    ) {
        public ThongTinXemTruocThongBaoChung thongTin() {
            return new ThongTinXemTruocThongBaoChung(
                    nguoiNhanIds.size(),
                    soPhongNhan,
                    soPhongKhongCoTaiKhoan
            );
        }
    }

    public record ThongBaoChung(
            Long id,
            UUID maThamChieu,
            Long nguoiGuiId,
            Long toaNhaId,
            String phamVi,
            Integer tang,
            String phongIds,
            String tieuDe,
            String noiDung,
            Instant hetHanLuc,
            String khoaChongLap,
            String dauVaoHash,
            int soNguoiNhan,
            int soPhongNhan,
            int soPhongKhongCoTaiKhoan,
            Instant taoLuc
    ) {
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
