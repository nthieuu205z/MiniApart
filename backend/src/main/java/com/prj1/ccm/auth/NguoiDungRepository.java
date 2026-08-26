package com.prj1.ccm.auth;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.TrangThaiNguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class NguoiDungRepository {
    private final JdbcTemplate jdbcTemplate;

    public NguoiDungRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<NguoiDung> findBySoDienThoai(String soDienThoai) {
        return jdbcTemplate.query(
                        """
                                SELECT id, ho_ten, so_dien_thoai, mat_khau_hash, vai_tro, trang_thai, phien_ban_token
                                FROM NGUOI_DUNG
                                WHERE so_dien_thoai = ?
                                """,
                        (resultSet, rowNum) -> new NguoiDung(
                                resultSet.getLong("id"),
                                resultSet.getString("ho_ten"),
                                resultSet.getString("so_dien_thoai"),
                                resultSet.getString("mat_khau_hash"),
                                VaiTro.valueOf(resultSet.getString("vai_tro")),
                                TrangThaiNguoiDung.valueOf(resultSet.getString("trang_thai")),
                                resultSet.getInt("phien_ban_token")
                        ),
                        soDienThoai
                )
                .stream()
                .findFirst();
    }

    public Optional<NguoiDung> findById(Long id) {
        return jdbcTemplate.query(
                        """
                                SELECT id, ho_ten, so_dien_thoai, mat_khau_hash, vai_tro, trang_thai, phien_ban_token
                                FROM NGUOI_DUNG
                                WHERE id = ?
                                """,
                        (resultSet, rowNum) -> new NguoiDung(
                                resultSet.getLong("id"),
                                resultSet.getString("ho_ten"),
                                resultSet.getString("so_dien_thoai"),
                                resultSet.getString("mat_khau_hash"),
                                VaiTro.valueOf(resultSet.getString("vai_tro")),
                                TrangThaiNguoiDung.valueOf(resultSet.getString("trang_thai")),
                                resultSet.getInt("phien_ban_token")
                        ),
                        id
                )
                .stream()
                .findFirst();
    }

    public List<NguoiDung> findAll() {
        return jdbcTemplate.query(
                """
                        SELECT id, ho_ten, so_dien_thoai, mat_khau_hash, vai_tro, trang_thai, phien_ban_token
                        FROM NGUOI_DUNG
                        ORDER BY id
                        """,
                (resultSet, rowNum) -> new NguoiDung(
                        resultSet.getLong("id"),
                        resultSet.getString("ho_ten"),
                        resultSet.getString("so_dien_thoai"),
                        resultSet.getString("mat_khau_hash"),
                        VaiTro.valueOf(resultSet.getString("vai_tro")),
                        TrangThaiNguoiDung.valueOf(resultSet.getString("trang_thai")),
                        resultSet.getInt("phien_ban_token")
                )
        );
    }

    public List<Long> findPhanQuyenToaIds(Long nguoiDungId) {
        return jdbcTemplate.query(
                """
                        SELECT toa_nha_id
                        FROM PHAN_QUYEN_TOA
                        WHERE nguoi_dung_id = ?
                        ORDER BY toa_nha_id
                        """,
                (resultSet, rowNum) -> resultSet.getLong("toa_nha_id"),
                nguoiDungId
        );
    }

    public boolean existsBySoDienThoaiExceptId(String soDienThoai, Long nguoiDungId) {
        Integer soLuong = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM NGUOI_DUNG
                        WHERE so_dien_thoai = ? AND id <> ?
                        """,
                Integer.class,
                soDienThoai,
                nguoiDungId
        );
        return soLuong != null && soLuong > 0;
    }

    public Long insert(NguoiDung nguoiDung) {
        jdbcTemplate.update(
                """
                        INSERT INTO NGUOI_DUNG(
                            ho_ten, so_dien_thoai, mat_khau_hash, vai_tro, trang_thai,
                            phien_ban_token, so_lan_sai, lan_sai_dau_tien, khoa_den
                        ) VALUES (?, ?, ?, ?, ?, ?, 0, NULL, NULL)
                        """,
                nguoiDung.hoTen(),
                nguoiDung.soDienThoai(),
                nguoiDung.matKhauHash(),
                nguoiDung.vaiTro().name(),
                nguoiDung.trangThai().name(),
                nguoiDung.phienBanToken()
        );

        return jdbcTemplate.queryForObject(
                "SELECT id FROM NGUOI_DUNG WHERE so_dien_thoai = ?",
                Long.class,
                nguoiDung.soDienThoai()
        );
    }

    public void capNhatThongTinNguoiDung(Long nguoiDungId, String hoTen, String soDienThoai, VaiTro vaiTro) {
        jdbcTemplate.update(
                """
                        UPDATE NGUOI_DUNG
                        SET ho_ten = ?, so_dien_thoai = ?, vai_tro = ?
                        WHERE id = ?
                        """,
                hoTen,
                soDienThoai,
                vaiTro.name(),
                nguoiDungId
        );
    }

    public void capNhatSoDienThoaiDangNhap(String soDienThoaiCu, String soDienThoaiMoi) {
        if (soDienThoaiCu.equals(soDienThoaiMoi)) {
            return;
        }

        Map<String, TheoDoiDangNhap> theoDoiTheoSoDienThoai = jdbcTemplate.query(
                """
                        SELECT so_dien_thoai_key, so_lan_sai, lan_sai_dau_tien, khoa_den
                        FROM THEO_DOI_DANG_NHAP
                        WHERE so_dien_thoai_key IN (?, ?)
                        ORDER BY so_dien_thoai_key
                        FOR UPDATE
                        """,
                (resultSet, rowNum) -> new TheoDoiDangNhap(
                        resultSet.getString("so_dien_thoai_key"),
                        resultSet.getInt("so_lan_sai"),
                        toInstant(resultSet.getTimestamp("lan_sai_dau_tien")),
                        toInstant(resultSet.getTimestamp("khoa_den"))
                ),
                soDienThoaiCu,
                soDienThoaiMoi
        ).stream().collect(java.util.stream.Collectors.toMap(TheoDoiDangNhap::soDienThoaiKey, theoDoi -> theoDoi));

        TheoDoiDangNhap theoDoiCu = theoDoiTheoSoDienThoai.get(soDienThoaiCu);
        TheoDoiDangNhap theoDoiMoi = theoDoiTheoSoDienThoai.get(soDienThoaiMoi);
        jdbcTemplate.update(
                """
                        UPDATE LAN_DANG_NHAP_SAI
                        SET so_dien_thoai_key = ?
                        WHERE so_dien_thoai_key = ?
                        """,
                soDienThoaiMoi,
                soDienThoaiCu
        );

        int soLanSaiTuLichSu = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM LAN_DANG_NHAP_SAI WHERE so_dien_thoai_key = ?",
                Integer.class,
                soDienThoaiMoi
        );
        Instant lanSaiDauTienTuLichSu = toInstant(jdbcTemplate.queryForObject(
                "SELECT MIN(thoi_diem) FROM LAN_DANG_NHAP_SAI WHERE so_dien_thoai_key = ?",
                Timestamp.class,
                soDienThoaiMoi
        ));
        int soLanSaiGop = Math.max(
                soLanSaiTuLichSu,
                (theoDoiCu == null ? 0 : theoDoiCu.soLanSai()) + (theoDoiMoi == null ? 0 : theoDoiMoi.soLanSai())
        );
        Instant lanSaiDauTien = somNhat(
                lanSaiDauTienTuLichSu,
                theoDoiCu == null ? null : theoDoiCu.lanSaiDauTien(),
                theoDoiMoi == null ? null : theoDoiMoi.lanSaiDauTien()
        );
        Instant khoaDen = muonNhat(
                theoDoiCu == null ? null : theoDoiCu.khoaDen(),
                theoDoiMoi == null ? null : theoDoiMoi.khoaDen()
        );
        if (theoDoiCu != null || theoDoiMoi != null || soLanSaiTuLichSu > 0) {
            jdbcTemplate.update(
                    """
                            INSERT INTO THEO_DOI_DANG_NHAP(so_dien_thoai_key, so_lan_sai, lan_sai_dau_tien, khoa_den)
                            VALUES (?, ?, ?, ?)
                            ON CONFLICT (so_dien_thoai_key) DO UPDATE
                            SET so_lan_sai = EXCLUDED.so_lan_sai,
                                lan_sai_dau_tien = EXCLUDED.lan_sai_dau_tien,
                                khoa_den = EXCLUDED.khoa_den
                            """,
                    soDienThoaiMoi,
                    soLanSaiGop,
                    toTimestamp(lanSaiDauTien),
                    toTimestamp(khoaDen)
            );
        }
        jdbcTemplate.update("DELETE FROM THEO_DOI_DANG_NHAP WHERE so_dien_thoai_key = ?", soDienThoaiCu);
    }

    public void luuMaKichHoat(Long nguoiDungId, String maBiMatHash, Instant hetHan) {
        jdbcTemplate.update(
                """
                        INSERT INTO KICH_HOAT_TAI_KHOAN(nguoi_dung_id, ma_bi_mat_hash, het_han)
                        VALUES (?, ?, ?)
                        ON CONFLICT (nguoi_dung_id) DO UPDATE
                        SET ma_bi_mat_hash = EXCLUDED.ma_bi_mat_hash,
                            het_han = EXCLUDED.het_han
                        """,
                nguoiDungId,
                maBiMatHash,
                Timestamp.from(hetHan)
        );
    }

    public Optional<KichHoatTaiKhoan> findKichHoatTaiKhoanChoKichHoat(Long nguoiDungId) {
        return jdbcTemplate.query(
                        """
                                SELECT ma_bi_mat_hash, het_han
                                FROM KICH_HOAT_TAI_KHOAN
                                WHERE nguoi_dung_id = ?
                                FOR UPDATE
                                """,
                        (resultSet, rowNum) -> new KichHoatTaiKhoan(
                                resultSet.getString("ma_bi_mat_hash"),
                                toInstant(resultSet.getTimestamp("het_han"))
                        ),
                        nguoiDungId
                )
                .stream()
                .findFirst();
    }

    public void capNhatMatKhauSauKichHoat(Long nguoiDungId, String matKhauHash) {
        jdbcTemplate.update(
                """
                        UPDATE NGUOI_DUNG
                        SET mat_khau_hash = ?, phien_ban_token = phien_ban_token + 1
                        WHERE id = ?
                        """,
                matKhauHash,
                nguoiDungId
        );
    }

    public void xoaMaKichHoat(Long nguoiDungId) {
        jdbcTemplate.update("DELETE FROM KICH_HOAT_TAI_KHOAN WHERE nguoi_dung_id = ?", nguoiDungId);
    }

    public void capNhatQuyenToa(Long nguoiDungId, List<Long> toaNhaIds) {
        jdbcTemplate.update(
                "DELETE FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id = ?",
                nguoiDungId
        );

        if (toaNhaIds.isEmpty()) {
            return;
        }

        List<Object[]> batchArgs = new ArrayList<>();
        for (Long toaNhaId : toaNhaIds) {
            batchArgs.add(new Object[]{nguoiDungId, toaNhaId});
        }
        jdbcTemplate.batchUpdate(
                "INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (?, ?)",
                batchArgs
        );
    }

    public void khoaNguoiDung(Long nguoiDungId) {
        jdbcTemplate.update(
                """
                        UPDATE NGUOI_DUNG
                        SET trang_thai = 'BI_KHOA',
                            phien_ban_token = phien_ban_token + 1,
                            so_lan_sai = 0,
                            lan_sai_dau_tien = NULL,
                            khoa_den = NULL
                        WHERE id = ?
                        """,
                nguoiDungId
        );
    }

    public Optional<NguoiDungDangNhap> findBySoDienThoaiChoDangNhap(String soDienThoai) {
        return jdbcTemplate.query(
                        """
                                SELECT id, ho_ten, so_dien_thoai, mat_khau_hash, vai_tro, trang_thai, phien_ban_token,
                                       so_lan_sai, lan_sai_dau_tien, khoa_den
                                FROM NGUOI_DUNG
                                WHERE so_dien_thoai = ?
                                FOR UPDATE
                                """,
                        (resultSet, rowNum) -> new NguoiDungDangNhap(
                                resultSet.getLong("id"),
                                resultSet.getString("ho_ten"),
                                resultSet.getString("so_dien_thoai"),
                                resultSet.getString("mat_khau_hash"),
                                VaiTro.valueOf(resultSet.getString("vai_tro")),
                                TrangThaiNguoiDung.valueOf(resultSet.getString("trang_thai")),
                                resultSet.getInt("phien_ban_token"),
                                resultSet.getInt("so_lan_sai"),
                                toInstant(resultSet.getTimestamp("lan_sai_dau_tien")),
                                toInstant(resultSet.getTimestamp("khoa_den"))
                        ),
                        soDienThoai
                )
                .stream()
                .findFirst();
    }

    public Optional<NguoiDungDangNhap> findByIdChoXacThuc(Long id) {
        return jdbcTemplate.query(
                        """
                                SELECT id, ho_ten, so_dien_thoai, mat_khau_hash, vai_tro, trang_thai, phien_ban_token,
                                       so_lan_sai, lan_sai_dau_tien, khoa_den
                                FROM NGUOI_DUNG
                                WHERE id = ?
                                """,
                        (resultSet, rowNum) -> new NguoiDungDangNhap(
                                resultSet.getLong("id"),
                                resultSet.getString("ho_ten"),
                                resultSet.getString("so_dien_thoai"),
                                resultSet.getString("mat_khau_hash"),
                                VaiTro.valueOf(resultSet.getString("vai_tro")),
                                TrangThaiNguoiDung.valueOf(resultSet.getString("trang_thai")),
                                resultSet.getInt("phien_ban_token"),
                                resultSet.getInt("so_lan_sai"),
                                toInstant(resultSet.getTimestamp("lan_sai_dau_tien")),
                                toInstant(resultSet.getTimestamp("khoa_den"))
                        ),
                        id
                )
                .stream()
                .findFirst();
    }

    public void taoTheoDoiDangNhapNeuChuaCo(String soDienThoaiKey) {
        jdbcTemplate.update(
                """
                        INSERT INTO THEO_DOI_DANG_NHAP(so_dien_thoai_key, so_lan_sai)
                        VALUES (?, 0)
                        ON CONFLICT (so_dien_thoai_key) DO NOTHING
                        """,
                soDienThoaiKey
        );
    }

    public Optional<TheoDoiDangNhap> findTheoDoiDangNhapChoDangNhap(String soDienThoaiKey) {
        return jdbcTemplate.query(
                        """
                                SELECT so_dien_thoai_key, so_lan_sai, lan_sai_dau_tien, khoa_den
                                FROM THEO_DOI_DANG_NHAP
                                WHERE so_dien_thoai_key = ?
                                FOR UPDATE
                                """,
                        (resultSet, rowNum) -> new TheoDoiDangNhap(
                                resultSet.getString("so_dien_thoai_key"),
                                resultSet.getInt("so_lan_sai"),
                                toInstant(resultSet.getTimestamp("lan_sai_dau_tien")),
                                toInstant(resultSet.getTimestamp("khoa_den"))
                        ),
                        soDienThoaiKey
                )
                .stream()
                .findFirst();
    }

    public void xoaLanDangNhapSaiTruoc(String soDienThoaiKey, Instant mocThoiGian) {
        jdbcTemplate.update(
                "DELETE FROM LAN_DANG_NHAP_SAI WHERE so_dien_thoai_key = ? AND thoi_diem < ?",
                soDienThoaiKey,
                Timestamp.from(mocThoiGian)
        );
    }

    public void ghiNhanLanDangNhapSai(String soDienThoaiKey, Long nguoiDungId, Instant thoiDiem) {
        jdbcTemplate.update(
                "INSERT INTO LAN_DANG_NHAP_SAI(so_dien_thoai_key, nguoi_dung_id, thoi_diem) VALUES (?, ?, ?)",
                soDienThoaiKey,
                nguoiDungId,
                Timestamp.from(thoiDiem)
        );
    }

    public int demLanDangNhapSaiTu(String soDienThoaiKey, Instant mocThoiGian) {
        Integer soLanSai = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM LAN_DANG_NHAP_SAI WHERE so_dien_thoai_key = ? AND thoi_diem >= ?",
                Integer.class,
                soDienThoaiKey,
                Timestamp.from(mocThoiGian)
        );
        return soLanSai == null ? 0 : soLanSai;
    }

    public Instant timLanDangNhapSaiSomNhatTu(String soDienThoaiKey, Instant mocThoiGian) {
        Timestamp thoiDiem = jdbcTemplate.queryForObject(
                "SELECT MIN(thoi_diem) FROM LAN_DANG_NHAP_SAI WHERE so_dien_thoai_key = ? AND thoi_diem >= ?",
                Timestamp.class,
                soDienThoaiKey,
                Timestamp.from(mocThoiGian)
        );
        return toInstant(thoiDiem);
    }

    public void capNhatTheoDoiDangNhap(String soDienThoaiKey, int soLanSai, Instant lanSaiDauTien, Instant khoaDen) {
        jdbcTemplate.update(
                """
                        UPDATE THEO_DOI_DANG_NHAP
                        SET so_lan_sai = ?, lan_sai_dau_tien = ?, khoa_den = ?
                        WHERE so_dien_thoai_key = ?
                        """,
                soLanSai,
                toTimestamp(lanSaiDauTien),
                toTimestamp(khoaDen),
                soDienThoaiKey
        );
    }

    public void capNhatDangNhapSai(Long nguoiDungId, int soLanSai, Instant lanSaiDauTien) {
        jdbcTemplate.update(
                """
                        UPDATE NGUOI_DUNG
                        SET so_lan_sai = ?, lan_sai_dau_tien = ?, khoa_den = NULL
                        WHERE id = ?
                        """,
                soLanSai,
                Timestamp.from(lanSaiDauTien),
                nguoiDungId
        );
    }

    public void khoaTamDangNhap(Long nguoiDungId, int soLanSai, Instant lanSaiDauTien, Instant khoaDen) {
        jdbcTemplate.update(
                """
                        UPDATE NGUOI_DUNG
                        SET so_lan_sai = ?,
                            lan_sai_dau_tien = ?,
                            khoa_den = ?,
                            phien_ban_token = phien_ban_token + 1
                        WHERE id = ?
                        """,
                soLanSai,
                Timestamp.from(lanSaiDauTien),
                Timestamp.from(khoaDen),
                nguoiDungId
        );
    }

    public void datLaiTrangThaiDangNhap(String soDienThoaiKey, Long nguoiDungId) {
        capNhatTheoDoiDangNhap(soDienThoaiKey, 0, null, null);
        jdbcTemplate.update("DELETE FROM LAN_DANG_NHAP_SAI WHERE so_dien_thoai_key = ?", soDienThoaiKey);
        if (nguoiDungId != null) {
            jdbcTemplate.update(
                    """
                            UPDATE NGUOI_DUNG
                            SET so_lan_sai = 0, lan_sai_dau_tien = NULL, khoa_den = NULL
                            WHERE id = ?
                            """,
                    nguoiDungId
            );
        }
    }

    private Instant toInstant(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant();
    }

    private Timestamp toTimestamp(Instant instant) {
        return instant == null ? null : Timestamp.from(instant);
    }

    private Instant somNhat(Instant... instants) {
        Instant ketQua = null;
        for (Instant instant : instants) {
            if (instant != null && (ketQua == null || instant.isBefore(ketQua))) {
                ketQua = instant;
            }
        }
        return ketQua;
    }

    private Instant muonNhat(Instant... instants) {
        Instant ketQua = null;
        for (Instant instant : instants) {
            if (instant != null && (ketQua == null || instant.isAfter(ketQua))) {
                ketQua = instant;
            }
        }
        return ketQua;
    }
}
