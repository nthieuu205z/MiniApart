package com.prj1.ccm.hopdong;

import com.prj1.ccm.nguoithue.SoGiayToFormatter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class NguoiOCungRepository {
    private final JdbcTemplate jdbcTemplate;

    public NguoiOCungRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Long insert(NguoiOCung nguoiOCung) {
        String vaiTro = nguoiOCung.vaiTro() != null ? nguoiOCung.vaiTro() : "NGUOI_O";
        String trangThai = nguoiOCung.trangThai() != null ? nguoiOCung.trangThai() : "DA_DUYET";
        LocalDateTime deNghiLuc = nguoiOCung.thoiDiemDeNghi() != null ? nguoiOCung.thoiDiemDeNghi() : LocalDateTime.now();

        return jdbcTemplate.queryForObject(
                """
                INSERT INTO NGUOI_O_CUNG(
                    hop_dong_id, nguoi_thue_id, quan_he, tu_ngay, den_ngay,
                    vai_tro, trang_thai, nguoi_de_nghi_id, thoi_diem_de_nghi,
                    nguoi_duyet_id, thoi_diem_duyet, ly_do_tu_choi, ly_do_roi_di
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING id
                """,
                Long.class,
                nguoiOCung.hopDongId(),
                nguoiOCung.nguoiThueId(),
                nguoiOCung.quanHe(),
                Date.valueOf(nguoiOCung.tuNgay()),
                nguoiOCung.denNgay() == null ? null : Date.valueOf(nguoiOCung.denNgay()),
                vaiTro,
                trangThai,
                nguoiOCung.nguoiDeNghiId(),
                Timestamp.valueOf(deNghiLuc),
                nguoiOCung.nguoiDuyetId(),
                nguoiOCung.thoiDiemDuyet() != null ? Timestamp.valueOf(nguoiOCung.thoiDiemDuyet()) : null,
                nguoiOCung.lyDoTuChoi(),
                nguoiOCung.lyDoRoiDi()
        );
    }

    public Optional<NguoiOCung> findById(Long id) {
        return jdbcTemplate.query(
                """
                SELECT noc.id, noc.hop_dong_id, noc.nguoi_thue_id, nt.ho_ten,
                       noc.quan_he, noc.tu_ngay, noc.den_ngay,
                       noc.vai_tro, noc.trang_thai, noc.nguoi_de_nghi_id, noc.thoi_diem_de_nghi,
                       noc.nguoi_duyet_id, noc.thoi_diem_duyet, noc.ly_do_tu_choi, noc.ly_do_roi_di
                FROM NGUOI_O_CUNG noc
                JOIN NGUOI_THUE nt ON nt.id = noc.nguoi_thue_id
                WHERE noc.id = ?
                """,
                (resultSet, rowNum) -> mapNguoiOCung(resultSet),
                id
        ).stream().findFirst();
    }

    public List<NguoiOCung> findByHopDongId(Long hopDongId) {
        return jdbcTemplate.query(
                """
                SELECT noc.id, noc.hop_dong_id, noc.nguoi_thue_id, nt.ho_ten,
                       noc.quan_he, noc.tu_ngay, noc.den_ngay,
                       noc.vai_tro, noc.trang_thai, noc.nguoi_de_nghi_id, noc.thoi_diem_de_nghi,
                       noc.nguoi_duyet_id, noc.thoi_diem_duyet, noc.ly_do_tu_choi, noc.ly_do_roi_di
                FROM NGUOI_O_CUNG noc
                JOIN NGUOI_THUE nt ON nt.id = noc.nguoi_thue_id
                WHERE noc.hop_dong_id = ?
                ORDER BY noc.tu_ngay, noc.id
                """,
                (resultSet, rowNum) -> mapNguoiOCung(resultSet),
                hopDongId
        );
    }

    public List<ThongTinNguoiOCung> findByHopDongIdWithDetails(Long hopDongId) {
        return jdbcTemplate.query(
                """
                SELECT noc.id, noc.hop_dong_id, noc.nguoi_thue_id, nt.ho_ten,
                       noc.quan_he, noc.tu_ngay, noc.den_ngay,
                       noc.vai_tro, noc.trang_thai, noc.nguoi_de_nghi_id, noc.thoi_diem_de_nghi,
                       noc.nguoi_duyet_id, noc.thoi_diem_duyet, noc.ly_do_tu_choi, noc.ly_do_roi_di,
                       nt.so_dien_thoai, nt.so_giay_to,
                       (SELECT COUNT(*) FROM NGUOI_DUNG nd WHERE nd.nguoi_thue_id = nt.id) AS co_tai_khoan
                FROM NGUOI_O_CUNG noc
                JOIN NGUOI_THUE nt ON nt.id = noc.nguoi_thue_id
                WHERE noc.hop_dong_id = ?
                ORDER BY noc.tu_ngay, noc.id
                """,
                (resultSet, rowNum) -> {
                    NguoiOCung noc = mapNguoiOCung(resultSet);
                    String sdt = resultSet.getString("so_dien_thoai");
                    String cccd = resultSet.getString("so_giay_to");
                    String cccdChe = SoGiayToFormatter.che(cccd);
                    boolean coTaiKhoan = resultSet.getInt("co_tai_khoan") > 0;
                    return ThongTinNguoiOCung.tu(noc, sdt, cccdChe, coTaiKhoan);
                },
                hopDongId
        );
    }

    public List<NguoiOCung> findDangODeGiaHan(Long hopDongId, LocalDate ngayKetThucHopDongCu) {
        return jdbcTemplate.query(
                """
                SELECT noc.id, noc.hop_dong_id, noc.nguoi_thue_id, nt.ho_ten,
                       noc.quan_he, noc.tu_ngay, noc.den_ngay,
                       noc.vai_tro, noc.trang_thai, noc.nguoi_de_nghi_id, noc.thoi_diem_de_nghi,
                       noc.nguoi_duyet_id, noc.thoi_diem_duyet, noc.ly_do_tu_choi, noc.ly_do_roi_di
                FROM NGUOI_O_CUNG noc
                JOIN NGUOI_THUE nt ON nt.id = noc.nguoi_thue_id
                WHERE noc.hop_dong_id = ?
                  AND noc.trang_thai = 'DA_DUYET'
                  AND noc.tu_ngay <= ?
                  AND (noc.den_ngay IS NULL OR noc.den_ngay > ?)
                ORDER BY noc.tu_ngay, noc.id
                """,
                (resultSet, rowNum) -> mapNguoiOCung(resultSet),
                hopDongId,
                Date.valueOf(ngayKetThucHopDongCu),
                Date.valueOf(ngayKetThucHopDongCu)
        );
    }

    public int countByPhongIdAndNgay(Long phongId, LocalDate ngay) {
        Integer soNguoi = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM NGUOI_O_CUNG noc
                JOIN HOP_DONG hd ON hd.id = noc.hop_dong_id
                WHERE hd.phong_id = ?
                  AND noc.trang_thai = 'DA_DUYET'
                  AND hd.ngay_bat_dau <= ?
                  AND hd.ngay_ket_thuc >= ?
                  AND noc.tu_ngay <= ?
                  AND (noc.den_ngay IS NULL OR noc.den_ngay >= ?)
                """,
                Integer.class,
                phongId,
                Date.valueOf(ngay),
                Date.valueOf(ngay),
                Date.valueOf(ngay),
                Date.valueOf(ngay)
        );
        return soNguoi == null ? 0 : soNguoi;
    }

    public int countApprovedOccupantsInInterval(Long hopDongId, LocalDate tuNgay, LocalDate denNgay, Long excludeId) {
        Integer soNguoi = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM NGUOI_O_CUNG noc
                WHERE noc.hop_dong_id = ?
                  AND noc.trang_thai = 'DA_DUYET'
                  AND noc.nguoi_thue_id <> (SELECT hd.nguoi_thue_id FROM HOP_DONG hd WHERE hd.id = noc.hop_dong_id)
                  AND (?::bigint IS NULL OR noc.id <> ?)
                  AND noc.tu_ngay <= COALESCE(?::date, DATE '9999-12-31')
                  AND (noc.den_ngay IS NULL OR noc.den_ngay >= ?::date)
                """,
                Integer.class,
                hopDongId,
                excludeId,
                excludeId,
                denNgay != null ? Date.valueOf(denNgay) : null,
                Date.valueOf(tuNgay)
        );
        return soNguoi == null ? 0 : soNguoi;
    }

    public Integer lockPhongForUpdate(Long phongId) {
        return jdbcTemplate.queryForObject(
                "SELECT suc_chua FROM PHONG WHERE id = ? FOR UPDATE",
                Integer.class,
                phongId
        );
    }

    public int updateTrangThai(Long id, String trangThai, Long nguoiDuyetId, LocalDateTime thoiDiemDuyet, String lyDoTuChoi) {
        return jdbcTemplate.update(
                """
                UPDATE NGUOI_O_CUNG
                SET trang_thai = ?, nguoi_duyet_id = ?, thoi_diem_duyet = ?, ly_do_tu_choi = ?
                WHERE id = ?
                """,
                trangThai,
                nguoiDuyetId,
                thoiDiemDuyet != null ? Timestamp.valueOf(thoiDiemDuyet) : null,
                lyDoTuChoi,
                id
        );
    }

    public int updateRoiPhong(Long id, LocalDate denNgay, String lyDoRoiDi) {
        return jdbcTemplate.update(
                """
                UPDATE NGUOI_O_CUNG
                SET trang_thai = 'DA_ROI_DI', den_ngay = ?, ly_do_roi_di = ?
                WHERE id = ?
                """,
                Date.valueOf(denNgay),
                lyDoRoiDi,
                id
        );
    }

    public List<SoNguoiOTrongKy> findSoNguoiOChotKy(Long toaNhaId, LocalDate ngayBatDau, LocalDate ngayKetThuc) {
        return jdbcTemplate.query(
                """
                SELECT hd.phong_id,
                       CASE WHEN COUNT(noc.id) = 0 THEN NULL
                            ELSE COUNT(noc.id) FILTER (
                                WHERE noc.trang_thai = 'DA_DUYET'
                                  AND noc.tu_ngay <= ?
                                  AND (noc.den_ngay IS NULL OR noc.den_ngay >= ?)
                            )::INTEGER
                       END AS so_nguoi
                FROM HOP_DONG hd
                JOIN PHONG p ON p.id = hd.phong_id
                LEFT JOIN NGUOI_O_CUNG noc ON noc.hop_dong_id = hd.id
                WHERE p.toa_nha_id = ?
                  AND hd.trang_thai = 'HIEU_LUC'
                  AND daterange(hd.ngay_bat_dau, hd.ngay_ket_thuc, '[]')
                      && daterange(?, ?, '[]')
                GROUP BY hd.phong_id
                ORDER BY hd.phong_id
                """,
                (resultSet, rowNum) -> new SoNguoiOTrongKy(
                        resultSet.getLong("phong_id"),
                        resultSet.getObject("so_nguoi", Integer.class)
                ),
                Date.valueOf(ngayKetThuc),
                Date.valueOf(ngayKetThuc),
                toaNhaId,
                Date.valueOf(ngayBatDau),
                Date.valueOf(ngayKetThuc)
        );
    }

    public record SoNguoiOTrongKy(Long phongId, Integer soNguoi) {
    }

    private NguoiOCung mapNguoiOCung(ResultSet resultSet) throws SQLException {
        Timestamp deNghi = resultSet.getTimestamp("thoi_diem_de_nghi");
        Timestamp duyet = resultSet.getTimestamp("thoi_diem_duyet");

        return new NguoiOCung(
                resultSet.getLong("id"),
                resultSet.getLong("hop_dong_id"),
                resultSet.getLong("nguoi_thue_id"),
                resultSet.getString("ho_ten"),
                resultSet.getString("quan_he"),
                resultSet.getObject("tu_ngay", LocalDate.class),
                resultSet.getObject("den_ngay", LocalDate.class),
                resultSet.getString("vai_tro"),
                resultSet.getString("trang_thai"),
                resultSet.getObject("nguoi_de_nghi_id", Long.class),
                deNghi != null ? deNghi.toLocalDateTime() : null,
                resultSet.getObject("nguoi_duyet_id", Long.class),
                duyet != null ? duyet.toLocalDateTime() : null,
                resultSet.getString("lyDoTuChoi".equalsIgnoreCase("ly_do_tu_choi") ? "ly_do_tu_choi" : "ly_do_tu_choi"),
                resultSet.getString("ly_do_roi_di")
        );
    }
}
