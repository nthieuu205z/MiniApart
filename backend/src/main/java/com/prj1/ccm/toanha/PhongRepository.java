package com.prj1.ccm.toanha;

import com.prj1.ccm.hopdong.HopDong;
import com.prj1.ccm.hopdong.TrangThaiHopDong;
import com.prj1.ccm.suachua.QuyTacTrangThaiYeuCau;
import com.prj1.ccm.suachua.TrangThaiYeuCau;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Repository
public class PhongRepository {
    private static final QuyTacTrangThaiYeuCau QUY_TAC_TRANG_THAI_YEU_CAU = new QuyTacTrangThaiYeuCau();

    private final JdbcTemplate jdbcTemplate;

    public PhongRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Phong> findByToaNhaId(Long toaNhaId, Integer tang) {
        if (tang == null) {
            return jdbcTemplate.query(
                    cauLenhPhongCoBan() + " WHERE toa_nha_id = ? ORDER BY tang, so_phong",
                    (resultSet, rowNum) -> mapPhong(resultSet),
                    toaNhaId
            );
        }

        return jdbcTemplate.query(
                cauLenhPhongCoBan() + " WHERE toa_nha_id = ? AND tang = ? ORDER BY tang, so_phong",
                (resultSet, rowNum) -> mapPhong(resultSet),
                toaNhaId,
                tang
        );
    }

    public Optional<Phong> findById(Long id) {
        return jdbcTemplate.query(
                        cauLenhPhongCoBan() + " WHERE id = ?",
                        (resultSet, rowNum) -> mapPhong(resultSet),
                        id
                )
                .stream()
                .findFirst();
    }

    public Optional<Phong> findByIdKemHopDong(Long id) {
        return findById(id).map(phong -> ganHopDong(List.of(phong)).get(0));
    }

    public List<Phong> findByToaNhaIdKemHopDong(Long toaNhaId) {
        return ganHopDong(findByToaNhaId(toaNhaId, null));
    }

    public boolean existsByToaNhaIdAndSoPhong(Long toaNhaId, String soPhong) {
        Integer dem = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM PHONG
                        WHERE toa_nha_id = ? AND so_phong = ?
                        """,
                Integer.class,
                toaNhaId,
                soPhong
        );
        return dem != null && dem > 0;
    }

    public List<String> findExistingRoomNumbers(Long toaNhaId, List<String> soPhong) {
        if (soPhong.isEmpty()) {
            return List.of();
        }

        String placeholders = soPhong.stream().map(ignore -> "?").collect(Collectors.joining(", "));
        Object[] params = new Object[soPhong.size() + 1];
        params[0] = toaNhaId;
        for (int index = 0; index < soPhong.size(); index += 1) {
            params[index + 1] = soPhong.get(index);
        }

        return jdbcTemplate.queryForList(
                """
                        SELECT so_phong
                        FROM PHONG
                        WHERE toa_nha_id = ?
                          AND so_phong IN (%s)
                        ORDER BY so_phong
                        """.formatted(placeholders),
                String.class,
                params
        );
    }

    public Long insert(Phong phong) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO PHONG (
                            toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai, ngung_cho_thue
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        RETURNING id
                        """,
                Long.class,
                phong.toaNhaId(),
                phong.soPhong(),
                phong.tang(),
                phong.dienTich(),
                phong.sucChua(),
                phong.giaThueMacDinh(),
                phong.loaiPhong(),
                phong.trangThaiDem().name(),
                phong.ngungChoThue()
        );
    }

    public void updateTrangThaiDem(Long phongId, TrangThaiPhong trangThai) {
        jdbcTemplate.update(
                """
                        UPDATE PHONG
                        SET trang_thai = ?
                        WHERE id = ?
                        """,
                trangThai.name(),
                phongId
        );
    }

    public void updateNgungChoThue(Long phongId, boolean ngungChoThue) {
        jdbcTemplate.update(
                """
                        UPDATE PHONG
                        SET ngung_cho_thue = ?
                        WHERE id = ?
                        """,
                ngungChoThue,
                phongId
        );
    }

    public boolean coYeuCauKhanCapDangMo(Long phongId, Instant hienTai) {
        return phongIdsCoYeuCauKhanCapDangMo(List.of(phongId), hienTai).contains(phongId);
    }

    public Set<Long> phongIdsCoYeuCauKhanCapDangMo(List<Long> phongIds, Instant hienTai) {
        if (phongIds.isEmpty()) {
            return Set.of();
        }

        String placeholders = phongIds.stream().map(ignore -> "?").collect(Collectors.joining(", "));
        return jdbcTemplate.query(
                """
                        SELECT phong_id, trang_thai, cho_xac_nhan_luc
                        FROM YEU_CAU_SUA_CHUA
                        WHERE muc_do = 'KHAN_CAP'
                          AND phong_id IN (%s)
                        """.formatted(placeholders),
                (resultSet, rowNum) -> new YeuCauKhanCapNguon(
                        resultSet.getLong("phong_id"),
                        TrangThaiYeuCau.valueOf(resultSet.getString("trang_thai")),
                        layInstantNullable(resultSet, "cho_xac_nhan_luc")
                ),
                phongIds.toArray()
        ).stream()
                .filter(item -> yeuCauDangMo(item, hienTai))
                .map(YeuCauKhanCapNguon::phongId)
                .collect(Collectors.toSet());
    }

    private List<Phong> ganHopDong(List<Phong> phong) {
        if (phong.isEmpty()) {
            return List.of();
        }

        Map<Long, List<HopDong>> hopDongTheoPhong = timHopDongTheoPhong(
                phong.stream().map(Phong::id).toList()
        );

        return phong.stream()
                .map(item -> new Phong(
                        item.id(),
                        item.toaNhaId(),
                        item.soPhong(),
                        item.tang(),
                        item.dienTich(),
                        item.sucChua(),
                        item.giaThueMacDinh(),
                        item.loaiPhong(),
                        item.trangThaiDem(),
                        item.ngungChoThue(),
                        hopDongTheoPhong.getOrDefault(item.id(), List.of())
                ))
                .toList();
    }

    private Map<Long, List<HopDong>> timHopDongTheoPhong(List<Long> phongIds) {
        String placeholders = phongIds.stream().map(ignore -> "?").collect(Collectors.joining(", "));
        Map<Long, List<HopDong>> hopDongTheoPhong = new LinkedHashMap<>();
        jdbcTemplate.query(
                """
                        SELECT id, phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai
                        FROM HOP_DONG
                        WHERE phong_id IN (%s)
                        ORDER BY phong_id, ngay_bat_dau, id
                        """.formatted(placeholders),
                resultSet -> {
                    HopDong hopDong = mapHopDong(resultSet);
                    hopDongTheoPhong.computeIfAbsent(hopDong.phongId(), ignore -> new java.util.ArrayList<>()).add(hopDong);
                },
                phongIds.toArray()
        );
        return hopDongTheoPhong;
    }

    private String cauLenhPhongCoBan() {
        return """
                SELECT id, toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai, ngung_cho_thue
                FROM PHONG
                """;
    }

    private Phong mapPhong(ResultSet resultSet) throws SQLException {
        return new Phong(
                resultSet.getLong("id"),
                resultSet.getLong("toa_nha_id"),
                resultSet.getString("so_phong"),
                resultSet.getInt("tang"),
                resultSet.getBigDecimal("dien_tich"),
                resultSet.getInt("suc_chua"),
                resultSet.getBigDecimal("gia_thue_mac_dinh"),
                resultSet.getString("loai_phong"),
                TrangThaiPhong.valueOf(resultSet.getString("trang_thai")),
                resultSet.getBoolean("ngung_cho_thue"),
                List.of()
        );
    }

    private Instant layInstantNullable(ResultSet resultSet, String column) throws SQLException {
        Timestamp value = resultSet.getTimestamp(column);
        return value == null ? null : value.toInstant();
    }

    private boolean yeuCauDangMo(YeuCauKhanCapNguon yeuCau, Instant hienTai) {
        TrangThaiYeuCau trangThaiHieuLuc = QUY_TAC_TRANG_THAI_YEU_CAU.trangThaiHieuLuc(
                yeuCau.trangThaiLuu(),
                yeuCau.choXacNhanLuc(),
                hienTai
        );
        return trangThaiHieuLuc != TrangThaiYeuCau.DA_DONG
                && trangThaiHieuLuc != TrangThaiYeuCau.DA_HUY;
    }

    private record YeuCauKhanCapNguon(
            Long phongId,
            TrangThaiYeuCau trangThaiLuu,
            Instant choXacNhanLuc
    ) {
    }

    private HopDong mapHopDong(ResultSet resultSet) throws SQLException {
        return new HopDong(
                resultSet.getLong("id"),
                resultSet.getLong("phong_id"),
                resultSet.getLong("nguoi_thue_id"),
                resultSet.getObject("ngay_bat_dau", LocalDate.class),
                resultSet.getObject("ngay_ket_thuc", LocalDate.class),
                resultSet.getBigDecimal("gia_thue"),
                resultSet.getBigDecimal("tien_coc"),
                resultSet.getInt("so_ngay_bao_truoc"),
                TrangThaiHopDong.valueOf(resultSet.getString("trang_thai"))
        );
    }
}
