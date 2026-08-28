package com.prj1.ccm.toanha;

import com.prj1.ccm.hopdong.HopDong;
import com.prj1.ccm.hopdong.TrangThaiHopDong;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class PhongRepository {
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
                            toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
                phong.trangThaiDem().name()
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
                SELECT id, toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai
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
                TrangThaiPhong.valueOf(resultSet.getString("trang_thai"))
        );
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
