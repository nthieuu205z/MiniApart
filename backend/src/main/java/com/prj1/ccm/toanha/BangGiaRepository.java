package com.prj1.ccm.toanha;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class BangGiaRepository {
    private final JdbcTemplate jdbcTemplate;

    public BangGiaRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<BangGia> findByDichVuId(Long dichVuId) {
        return jdbcTemplate.query(
                """
                        SELECT id, dich_vu_id, don_gia, ngay_hieu_luc
                        FROM BANG_GIA
                        WHERE dich_vu_id = ?
                        ORDER BY ngay_hieu_luc DESC, id DESC
                        """,
                (resultSet, rowNum) -> mapBangGia(resultSet),
                dichVuId
        );
    }

    public Optional<BangGia> findApplicableByDichVuIdAndNgay(Long dichVuId, LocalDate ngay) {
        Optional<LocalDate> ngayHieuLuc = findApplicableNgayHieuLuc("BANG_GIA", dichVuId, ngay);
        if (ngayHieuLuc.isEmpty()) {
            return Optional.empty();
        }
        return jdbcTemplate.query(
                        """
                                SELECT id, dich_vu_id, don_gia, ngay_hieu_luc
                                FROM BANG_GIA
                                WHERE dich_vu_id = ? AND ngay_hieu_luc = ?
                                ORDER BY id DESC
                                LIMIT 1
                                """,
                        (resultSet, rowNum) -> mapBangGia(resultSet),
                        dichVuId,
                        Date.valueOf(ngayHieuLuc.get())
                )
                .stream()
                .findFirst();
    }

    public List<LocalDate> findNgayHieuLucBacThangByDichVuId(Long dichVuId) {
        return jdbcTemplate.query(
                """
                        SELECT DISTINCT ngay_hieu_luc
                        FROM BANG_GIA_BAC_THANG
                        WHERE dich_vu_id = ?
                        ORDER BY ngay_hieu_luc DESC
                        """,
                (resultSet, rowNum) -> resultSet.getObject("ngay_hieu_luc", LocalDate.class),
                dichVuId
        );
    }

    public Optional<LocalDate> findApplicableNgayHieuLucBacThangByDichVuIdAndNgay(Long dichVuId, LocalDate ngay) {
        return findApplicableNgayHieuLuc("BANG_GIA_BAC_THANG", dichVuId, ngay);
    }

    public boolean existsBacThangByDichVuIdAndNgayHieuLuc(Long dichVuId, LocalDate ngayHieuLuc) {
        Boolean tonTai = jdbcTemplate.queryForObject(
                """
                        SELECT EXISTS (
                            SELECT 1
                            FROM BANG_GIA_BAC_THANG
                            WHERE dich_vu_id = ? AND ngay_hieu_luc = ?
                        )
                        """,
                Boolean.class,
                dichVuId,
                Date.valueOf(ngayHieuLuc)
        );
        return Boolean.TRUE.equals(tonTai);
    }

    public List<BangGiaBacThang> findBacThangByDichVuIdAndNgayHieuLuc(Long dichVuId, LocalDate ngayHieuLuc) {
        return jdbcTemplate.query(
                """
                        SELECT id, dich_vu_id, bac, tu_so_luong, den_so_luong, ty_le, don_gia, ngay_hieu_luc
                        FROM BANG_GIA_BAC_THANG
                        WHERE dich_vu_id = ? AND ngay_hieu_luc = ?
                        ORDER BY bac, id
                        """,
                (resultSet, rowNum) -> mapBangGiaBacThang(resultSet),
                dichVuId,
                Date.valueOf(ngayHieuLuc)
        );
    }

    public void insertBacThang(List<BangGiaBacThang> cacBac) {
        List<Object[]> batchArguments = new ArrayList<>();
        for (BangGiaBacThang bac : cacBac) {
            batchArguments.add(new Object[]{
                    bac.dichVuId(),
                    bac.bac(),
                    bac.tuSoLuong(),
                    bac.denSoLuong(),
                    bac.tyLe(),
                    bac.donGia(),
                    Date.valueOf(bac.ngayHieuLuc())
            });
        }
        jdbcTemplate.batchUpdate(
                """
                        INSERT INTO BANG_GIA_BAC_THANG (
                            dich_vu_id, bac, tu_so_luong, den_so_luong, ty_le, don_gia, ngay_hieu_luc
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        """,
                batchArguments
        );
    }

    public Long insert(BangGia bangGia) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO BANG_GIA (dich_vu_id, don_gia, ngay_hieu_luc)
                        VALUES (?, ?, ?)
                        RETURNING id
                        """,
                Long.class,
                bangGia.dichVuId(),
                bangGia.donGia(),
                Date.valueOf(bangGia.ngayHieuLuc())
        );
    }

    public BangGia findById(Long id) {
        return jdbcTemplate.queryForObject(
                """
                        SELECT id, dich_vu_id, don_gia, ngay_hieu_luc
                        FROM BANG_GIA
                        WHERE id = ?
                        """,
                (resultSet, rowNum) -> mapBangGia(resultSet),
                id
        );
    }

    private BangGia mapBangGia(ResultSet resultSet) throws SQLException {
        return new BangGia(
                resultSet.getLong("id"),
                resultSet.getLong("dich_vu_id"),
                resultSet.getBigDecimal("don_gia"),
                resultSet.getObject("ngay_hieu_luc", LocalDate.class)
        );
    }

    private BangGiaBacThang mapBangGiaBacThang(ResultSet resultSet) throws SQLException {
        return new BangGiaBacThang(
                resultSet.getLong("id"),
                resultSet.getLong("dich_vu_id"),
                resultSet.getInt("bac"),
                resultSet.getBigDecimal("tu_so_luong"),
                resultSet.getBigDecimal("den_so_luong"),
                resultSet.getBigDecimal("ty_le"),
                resultSet.getBigDecimal("don_gia"),
                resultSet.getObject("ngay_hieu_luc", LocalDate.class)
        );
    }

    private Optional<LocalDate> findApplicableNgayHieuLuc(String tableName, Long dichVuId, LocalDate ngay) {
        return jdbcTemplate.query(
                        """
                                SELECT DISTINCT ngay_hieu_luc
                                FROM %s
                                WHERE dich_vu_id = ? AND ngay_hieu_luc <= ?
                                ORDER BY ngay_hieu_luc DESC
                                LIMIT 1
                                """.formatted(tableName),
                        (resultSet, rowNum) -> resultSet.getObject("ngay_hieu_luc", LocalDate.class),
                        dichVuId,
                        Date.valueOf(ngay)
                )
                .stream()
                .findFirst();
    }
}
