package com.prj1.ccm.billing;

import com.prj1.ccm.billing.calc.Bac;
import com.prj1.ccm.billing.calc.BangGiaTaiThoiDiem;
import com.prj1.ccm.billing.calc.BoiCanhTinh;
import com.prj1.ccm.billing.calc.ChiSoDichVu;
import com.prj1.ccm.billing.calc.CheDoGia;
import com.prj1.ccm.billing.calc.DichVu;
import com.prj1.ccm.billing.calc.DongChiTiet;
import com.prj1.ccm.billing.calc.HopDong;
import com.prj1.ccm.billing.calc.KhoanPhatSinh;
import com.prj1.ccm.billing.calc.KetQuaTinhHoaDon;
import com.prj1.ccm.billing.calc.KyThanhToan;
import com.prj1.ccm.billing.calc.LyDoBoQua;
import com.prj1.ccm.billing.calc.MaLyDo;
import com.prj1.ccm.billing.calc.TienTe;
import com.prj1.ccm.billing.calc.TrangThaiHoaDon;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.stereotype.Repository;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.sql.ResultSet;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Repository
class TinhHoaDonRepository {
    private static final String RANG_BUOC_TRUNG_MA_HOA_DON = "uq_hoa_don_ma_hoa_don";
    private static final String RANG_BUOC_TRUNG_HOP_DONG_KY = "uq_hoa_don_hop_dong_ky";

    private final JdbcTemplate jdbcTemplate;
    private final Clock clock;

    TinhHoaDonRepository(JdbcTemplate jdbcTemplate, Clock clock) {
        this.jdbcTemplate = jdbcTemplate;
        this.clock = clock;
    }

    DuLieuTinhHoaDon layDuLieuTinhHoaDon(Long toaNhaId, Long kyId, Long hopDongId) {
        return layDuLieuTinhHoaDon(toaNhaId, kyId, hopDongId, false);
    }

    DuLieuTinhHoaDon layDuLieuTinhHoaDonDeTaoHoaDon(Long toaNhaId, Long kyId, Long hopDongId) {
        return layDuLieuTinhHoaDon(toaNhaId, kyId, hopDongId, true);
    }

    private DuLieuTinhHoaDon layDuLieuTinhHoaDon(Long toaNhaId, Long kyId, Long hopDongId, boolean khoaKhoanPhatSinh) {
        KyThanhToan ky = layKyThanhToan(toaNhaId, kyId);
        HopDong hopDong = layHopDong(toaNhaId, hopDongId);
        List<DichVuApDung> dichVuApDung = layDichVuApDung(hopDongId);
        Map<DichVu, ChiSoDichVu> cacChiSo = layChiSo(kyId, hopDong.phongId());
        Map<DichVu, BangGiaTaiThoiDiem> cacBangGia = new LinkedHashMap<>();
        List<LyDoBoQua> lyDoKhongTheTinh = new ArrayList<>(lyDoKhongTheTinh(hopDong.phongId(), dichVuApDung));
        for (DichVuApDung apDung : dichVuApDung) {
            boolean giaBacThang = apDung.dichVu().cheDoGia() == CheDoGia.BAC_THANG;
            List<Bac> cacBac = giaBacThang
                    ? layBacThang(apDung.dichVu().id(), ky.ngayKetThuc())
                    : List.of();
            if (giaBacThang && cacBac.isEmpty()) {
                lyDoKhongTheTinh.add(new LyDoBoQua(hopDong.phongId(), MaLyDo.THIEU_BANG_GIA,
                        "Thieu bang gia tai thoi diem tinh"));
            }
            cacBangGia.put(apDung.dichVu(), new BangGiaTaiThoiDiem(
                    ky.ngayBatDau(),
                    apDung.donGia(),
                    cacBac
            ));
        }
        return new DuLieuTinhHoaDon(
                new BoiCanhTinh(
                        ky,
                        hopDong,
                        hopDong.soNgayOTrongKy(ky),
                        null,
                        cacChiSo,
                        cacBangGia,
                        cacSoLuongDichVuChuaCoNguonLuuTru(),
                        khoanChoTinhChuaCoNguonLuuTru(hopDong.id(), khoaKhoanPhatSinh),
                        soDuKhaDungChuaCoNguonLuuTru()
                ),
                lyDoKhongTheTinh
        );
    }

    private Map<DichVu, BigDecimal> cacSoLuongDichVuChuaCoNguonLuuTru() {
        return Map.of();
    }

    private List<KhoanPhatSinh> khoanChoTinhChuaCoNguonLuuTru(Long hopDongId, boolean khoaKhoanPhatSinh) {
        String sql = """
                SELECT id, ten_khoan, so_tien
                FROM KHOAN_PHAT_SINH
                WHERE hop_dong_id = ?
                  AND trang_thai = 'CHO_TINH'
                ORDER BY id
                """;
        if (khoaKhoanPhatSinh) {
            sql += " FOR UPDATE";
        }
        return jdbcTemplate.query(
                sql,
                (resultSet, rowNum) -> new KhoanPhatSinh(
                        resultSet.getLong("id"),
                        resultSet.getString("ten_khoan"),
                        new TienTe(resultSet.getBigDecimal("so_tien"))
                ),
                hopDongId
        );
    }

    private TienTe soDuKhaDungChuaCoNguonLuuTru() {
        return new TienTe(BigDecimal.ZERO);
    }

    private List<LyDoBoQua> lyDoKhongTheTinh(Long phongId, List<DichVuApDung> dichVuApDung) {
        return dichVuApDung.stream()
                .filter(apDung -> apDung.dichVu().cachTinh() == com.prj1.ccm.billing.calc.CachTinh.THEO_SO_LUONG)
                .map(apDung -> new LyDoBoQua(phongId, MaLyDo.THIEU_SO_LUONG_DICH_VU,
                        "Chua co nguon du lieu so luong cho dich vu " + apDung.dichVu().ten()))
                .toList();
    }

    private KyThanhToan layKyThanhToan(Long toaNhaId, Long kyId) {
        return jdbcTemplate.query(
                        """
                                SELECT id, toa_nha_id, nam, thang, ngay_bat_dau, ngay_ket_thuc, trang_thai
                                FROM KY_THANH_TOAN
                                WHERE id = ?
                                  AND toa_nha_id = ?
                                """,
                        (resultSet, rowNum) -> new KyThanhToan(
                                resultSet.getLong("id"),
                                resultSet.getLong("toa_nha_id"),
                                resultSet.getInt("nam"),
                                resultSet.getInt("thang"),
                                resultSet.getObject("ngay_bat_dau", LocalDate.class),
                                resultSet.getObject("ngay_ket_thuc", LocalDate.class)
                        ),
                        kyId,
                        toaNhaId
                )
                .stream()
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    List<HopDongTrongKy> layHopDongHieuLucTrongKy(Long toaNhaId, LocalDate ngayBatDauKy, LocalDate ngayKetThucKy) {
        return jdbcTemplate.query(
                """
                        SELECT hd.id AS hop_dong_id, hd.phong_id, p.so_phong
                        FROM HOP_DONG hd
                        JOIN PHONG p ON p.id = hd.phong_id
                        WHERE p.toa_nha_id = ?
                          AND hd.trang_thai = 'HIEU_LUC'
                          AND daterange(hd.ngay_bat_dau, hd.ngay_ket_thuc, '[]')
                              && daterange(?, ?, '[]')
                        ORDER BY p.so_phong, hd.id
                        """,
                (resultSet, rowNum) -> new HopDongTrongKy(
                        resultSet.getLong("hop_dong_id"),
                        resultSet.getLong("phong_id"),
                        resultSet.getString("so_phong")
                ),
                toaNhaId,
                java.sql.Date.valueOf(ngayBatDauKy),
                java.sql.Date.valueOf(ngayKetThucKy)
        );
    }

    Long taoHoaDon(HoaDonMoi hoaDon, KetQuaTinhHoaDon ketQua) {
        Long hoaDonId = jdbcTemplate.queryForObject(
                """
                            INSERT INTO HOA_DON (
                            ma_hoa_don, ky_id, hop_dong_id, ngay_phat_hanh, han_thanh_toan, tong_tien, da_thu, trang_thai,
                            so_nguoi_o, so_ho_quy_doi, giai_thich_so_ho
                        )
                        VALUES (?, ?, ?, ?, ?, ?, 0.00, 'NHAP', ?, ?, ?)
                        RETURNING id
                        """,
                Long.class,
                hoaDon.maHoaDon(),
                hoaDon.kyId(),
                hoaDon.hopDongId(),
                hoaDon.ngayPhatHanh(),
                hoaDon.hanThanhToan(),
                hoaDon.tongTien(),
                hoaDon.soNguoiOTrongKy(),
                hoaDon.soHoQuyDoi(),
                hoaDon.giaiThichSoHo()
        );
        for (DongChiTiet dong : ketQua.cacDong()) {
            Long chiTietId = jdbcTemplate.queryForObject(
                    """
                            INSERT INTO CHI_TIET_HOA_DON (
                                hoa_don_id, dich_vu_id, ten_khoan, chi_so_dau, chi_so_cuoi, so_luong, don_gia, thanh_tien, loai_khoan
                            )
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                            RETURNING id
                            """,
                    Long.class,
                    hoaDonId,
                    dong.dichVuId(),
                    dong.tenKhoan(),
                    dong.chiSoDau(),
                    dong.chiSoCuoi(),
                    dong.soLuong(),
                    dong.donGia() == null ? null : dong.donGia().giaTri(),
                    dong.thanhTien().giaTri(),
                    dong.loaiKhoan().name()
            );
            for (com.prj1.ccm.billing.calc.BacTinhTien bac : dong.cacBac()) {
                jdbcTemplate.update(
                        """
                                INSERT INTO CHI_TIET_HOA_DON_BAC_THANG (
                                    chi_tiet_hoa_don_id, bac, tu_so_luong, den_so_luong, dinh_muc_quy_doi,
                                    so_luong, don_gia, thanh_tien
                                )
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                                """,
                        chiTietId,
                        bac.bac(),
                        bac.tuSoLuong(),
                        bac.denSoLuong(),
                        bac.dinhMucQuyDoi(),
                        bac.soLuong(),
                        bac.donGia().giaTri(),
                        bac.thanhTien().giaTri()
                );
            }
        }
        return hoaDonId;
    }

    void danhDauKhoanPhatSinhDaTinh(List<Long> khoanPhatSinhIds, Long hoaDonId) {
        for (Long khoanPhatSinhId : khoanPhatSinhIds) {
            int soDongCapNhat = jdbcTemplate.update(
                    """
                            UPDATE KHOAN_PHAT_SINH
                            SET trang_thai = 'DA_TINH',
                                hoa_don_id = ?
                            WHERE id = ?
                              AND trang_thai = 'CHO_TINH'
                              AND hoa_don_id IS NULL
                            """,
                    hoaDonId,
                    khoanPhatSinhId
            );
            if (soDongCapNhat != 1) {
                throw new IllegalStateException("Khoan phat sinh khong con san sang de danh dau da tinh");
            }
        }
    }

    boolean laXungDotHoaDonTrung(DataIntegrityViolationException exception) {
        Throwable goc = NestedExceptionUtils.getMostSpecificCause(exception);
        if (!(goc instanceof SQLException sqlException) || !"23505".equals(sqlException.getSQLState())) {
            return false;
        }
        String thongDiep = sqlException.getMessage();
        return thongDiep != null
                && (thongDiep.contains(RANG_BUOC_TRUNG_MA_HOA_DON) || thongDiep.contains(RANG_BUOC_TRUNG_HOP_DONG_KY));
    }

    java.util.Optional<HoaDonTrongPhamVi> timHoaDonTrongPhamVi(Long toaNhaId, Long kyId, Long hoaDonId) {
        return jdbcTemplate.query(
                        """
                                SELECT hd.id,
                                       CASE
                                           WHEN hd.trang_thai IN ('NHAP', 'DA_HUY', 'DA_THANH_TOAN') THEN hd.trang_thai
                                           WHEN hd.da_thu >= hd.tong_tien THEN 'DA_THANH_TOAN'
                                           WHEN ?::date > kt.ngay_ket_thuc + tn.so_ngay_han_tt THEN 'QUA_HAN'
                                           WHEN hd.da_thu > 0 THEN 'DA_THU_MOT_PHAN'
                                           ELSE 'DA_PHAT_HANH'
                                       END AS trang_thai
                                FROM HOA_DON hd
                                JOIN HOP_DONG hop_dong ON hop_dong.id = hd.hop_dong_id
                                JOIN PHONG p ON p.id = hop_dong.phong_id
                                JOIN KY_THANH_TOAN kt ON kt.id = hd.ky_id
                                JOIN TOA_NHA tn ON tn.id = p.toa_nha_id
                                WHERE hd.id = ?
                                  AND hd.ky_id = ?
                                  AND p.toa_nha_id = ?
                                """,
                        (resultSet, rowNum) -> new HoaDonTrongPhamVi(
                                resultSet.getLong("id"),
                                TrangThaiHoaDon.valueOf(resultSet.getString("trang_thai"))
                        ),
                        java.sql.Date.valueOf(LocalDate.now(clock)),
                        hoaDonId,
                        kyId,
                        toaNhaId
                )
                .stream()
                .findFirst();
    }

    Long themNoiDungHoaDon(Long hoaDonId, String tenKhoan, BigDecimal thanhTien, String lyDo) {
        Long chiTietId = jdbcTemplate.queryForObject(
                """
                        INSERT INTO CHI_TIET_HOA_DON (
                            hoa_don_id, dich_vu_id, ten_khoan, chi_so_dau, chi_so_cuoi, so_luong, don_gia,
                            thanh_tien, loai_khoan, ly_do
                        )
                        VALUES (?, NULL, ?, NULL, NULL, NULL, NULL, ?, 'KHOAN_PHAT_SINH', ?)
                        RETURNING id
                        """,
                Long.class,
                hoaDonId,
                tenKhoan,
                thanhTien,
                lyDo
        );
        jdbcTemplate.update(
                """
                        UPDATE HOA_DON
                        SET tong_tien = tong_tien + ?
                        WHERE id = ?
                        """,
                thanhTien,
                hoaDonId
        );
        return chiTietId;
    }

    void capNhatTrangThaiHoaDon(Long hoaDonId, TrangThaiHoaDon trangThai) {
        jdbcTemplate.update(
                """
                        UPDATE HOA_DON
                        SET trang_thai = ?
                        WHERE id = ?
                        """,
                trangThai.name(),
                hoaDonId
        );
    }

    void khoiPhucKhoanPhatSinhChoTinh(Long hoaDonId) {
        jdbcTemplate.update(
                """
                        UPDATE KHOAN_PHAT_SINH
                        SET trang_thai = 'CHO_TINH',
                            hoa_don_id = NULL
                        WHERE hoa_don_id = ?
                        """,
                hoaDonId
        );
    }

    private HopDong layHopDong(Long toaNhaId, Long hopDongId) {
        return jdbcTemplate.query(
                        """
                                SELECT hd.id, hd.phong_id, hd.nguoi_thue_id, hd.ngay_bat_dau, hd.ngay_ket_thuc,
                                       hd.gia_thue, hd.tien_coc
                                FROM HOP_DONG hd
                                JOIN PHONG p ON p.id = hd.phong_id
                                WHERE hd.id = ?
                                  AND p.toa_nha_id = ?
                                """,
                        (resultSet, rowNum) -> new HopDong(
                                resultSet.getLong("id"),
                                resultSet.getLong("phong_id"),
                                resultSet.getLong("nguoi_thue_id"),
                                resultSet.getObject("ngay_bat_dau", LocalDate.class),
                                resultSet.getObject("ngay_ket_thuc", LocalDate.class),
                                new TienTe(resultSet.getBigDecimal("gia_thue")),
                                new TienTe(resultSet.getBigDecimal("tien_coc"))
                        ),
                        hopDongId,
                        toaNhaId
                )
                .stream()
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private List<DichVuApDung> layDichVuApDung(Long hopDongId) {
        return jdbcTemplate.query(
                """
                        SELECT dv.id, dv.toa_nha_id, dv.ten, dv.cach_tinh, dv.che_do_gia, dv.don_vi, dv.la_dien,
                               hddv.don_gia_ap_dung
                        FROM HOP_DONG_DICH_VU hddv
                        JOIN DICH_VU dv ON dv.id = hddv.dich_vu_id
                        WHERE hddv.hop_dong_id = ?
                        ORDER BY dv.id
                        """,
                (resultSet, rowNum) -> new DichVuApDung(
                        mapDichVu(resultSet),
                        new TienTe(resultSet.getBigDecimal("don_gia_ap_dung"))
                ),
                hopDongId
        );
    }

    private Map<DichVu, ChiSoDichVu> layChiSo(Long kyId, Long phongId) {
        Map<DichVu, ChiSoDichVu> cacChiSo = new LinkedHashMap<>();
        jdbcTemplate.query(
                """
                        SELECT dv.id, dv.toa_nha_id, dv.ten, dv.cach_tinh, dv.che_do_gia, dv.don_vi, dv.la_dien,
                               cs.id AS chi_so_id, cs.ky_id, cs.phong_id, cs.dich_vu_id, cs.chi_so_dau, cs.chi_so_cuoi,
                               cs.chi_so_cuoi_cong_to_cu, cs.chi_so_dau_cong_to_moi, cs.co_thay_cong_to
                        FROM CHI_SO_DICH_VU cs
                        JOIN DICH_VU dv ON dv.id = cs.dich_vu_id
                        WHERE cs.ky_id = ?
                          AND cs.phong_id = ?
                        ORDER BY cs.dich_vu_id
                        """,
                (RowCallbackHandler) resultSet -> cacChiSo.put(
                        mapDichVu(resultSet),
                        new ChiSoDichVu(
                                resultSet.getLong("chi_so_id"),
                                resultSet.getLong("ky_id"),
                                resultSet.getLong("phong_id"),
                                resultSet.getLong("dich_vu_id"),
                                resultSet.getBigDecimal("chi_so_dau"),
                                resultSet.getBigDecimal("chi_so_cuoi"),
                                resultSet.getBigDecimal("chi_so_cuoi_cong_to_cu"),
                                resultSet.getBigDecimal("chi_so_dau_cong_to_moi"),
                                resultSet.getBoolean("co_thay_cong_to")
                        )
                ),
                kyId,
                phongId
        );
        return cacChiSo;
    }

    private List<Bac> layBacThang(Long dichVuId, LocalDate ngay) {
        return jdbcTemplate.query(
                """
                        SELECT bac, tu_so_luong, den_so_luong, don_gia
                        FROM BANG_GIA_BAC_THANG
                        WHERE dich_vu_id = ?
                          AND ngay_hieu_luc = (
                              SELECT MAX(ngay_hieu_luc)
                              FROM BANG_GIA_BAC_THANG
                              WHERE dich_vu_id = ?
                                AND ngay_hieu_luc <= ?
                          )
                        ORDER BY bac
                        """,
                (resultSet, rowNum) -> new Bac(
                        resultSet.getInt("bac"),
                        resultSet.getBigDecimal("tu_so_luong"),
                        resultSet.getBigDecimal("den_so_luong"),
                        new TienTe(resultSet.getBigDecimal("don_gia"))
                ),
                dichVuId,
                dichVuId,
                java.sql.Date.valueOf(ngay)
        );
    }

    private DichVu mapDichVu(ResultSet resultSet) throws SQLException {
        return new DichVu(
                resultSet.getLong("id"),
                resultSet.getLong("toa_nha_id"),
                resultSet.getString("ten"),
                com.prj1.ccm.billing.calc.CachTinh.valueOf(resultSet.getString("cach_tinh")),
                com.prj1.ccm.billing.calc.CheDoGia.valueOf(resultSet.getString("che_do_gia")),
                resultSet.getString("don_vi"),
                resultSet.getBoolean("la_dien")
        );
    }

    private record DichVuApDung(DichVu dichVu, TienTe donGia) {
    }

    record HopDongTrongKy(Long hopDongId, Long phongId, String soPhong) {
    }

    record HoaDonMoi(
            String maHoaDon,
            Long kyId,
            Long hopDongId,
            LocalDate ngayPhatHanh,
            LocalDate hanThanhToan,
            BigDecimal tongTien,
            Integer soNguoiOTrongKy,
            Integer soHoQuyDoi,
            String giaiThichSoHo
    ) {
    }

    record HoaDonTrongPhamVi(Long hoaDonId, TrangThaiHoaDon trangThai) {
    }
}
