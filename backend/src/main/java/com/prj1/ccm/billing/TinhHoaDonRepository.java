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
import com.prj1.ccm.billing.calc.QuyTacTrangThaiHoaDon;
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
    private final QuyTacTrangThaiHoaDon quyTacTrangThaiHoaDon = new QuyTacTrangThaiHoaDon();

    TinhHoaDonRepository(JdbcTemplate jdbcTemplate, Clock clock) {
        this.jdbcTemplate = jdbcTemplate;
        this.clock = clock;
    }

    DuLieuTinhHoaDon layDuLieuTinhHoaDon(Long toaNhaId, Long kyId, Long hopDongId) {
        return layDuLieuTinhHoaDon(toaNhaId, kyId, hopDongId, false);
    }

    DuLieuTinhHoaDon layDuLieuTinhHoaDonDeTaoHoaDon(Long toaNhaId, Long kyId, Long hopDongId) {
        khoaHopDongDeTaoHoaDon(toaNhaId, hopDongId);
        return layDuLieuTinhHoaDon(toaNhaId, kyId, hopDongId, true);
    }

    private void khoaHopDongDeTaoHoaDon(Long toaNhaId, Long hopDongId) {
        List<Long> hopDongs = jdbcTemplate.queryForList(
                """
                        SELECT hd.id FROM HOP_DONG hd
                        JOIN PHONG p ON p.id = hd.phong_id
                        WHERE hd.id = ? AND p.toa_nha_id = ?
                        FOR UPDATE OF hd
                        """,
                Long.class, hopDongId, toaNhaId
        );
        if (hopDongs.size() != 1) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
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
                        soDuKhaDungChuaCoNguonLuuTru(hopDong.id(), khoaKhoanPhatSinh)
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

    private TienTe soDuKhaDungChuaCoNguonLuuTru(Long hopDongId, boolean khoaSoDu) {
        String sql = """
                SELECT so_tien FROM SO_DU_KHA_DUNG
                WHERE hop_dong_id = ? AND hoa_don_su_dung_id IS NULL
                ORDER BY id
                """;
        if (khoaSoDu) {
            sql += " FOR UPDATE";
        }
        BigDecimal tong = jdbcTemplate.queryForList(sql, BigDecimal.class, hopDongId).stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .max(BigDecimal.ZERO);
        return new TienTe(tong);
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

    void danhDauSoDuDaSuDung(Long hopDongId, Long hoaDonId, KetQuaTinhHoaDon ketQua) {
        BigDecimal soTienCanDung = ketQua.cacDong().stream()
                .filter(dong -> dong.loaiKhoan() == com.prj1.ccm.billing.calc.LoaiKhoan.SO_DU)
                .map(dong -> dong.thanhTien().giaTri().negate())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (soTienCanDung.signum() <= 0) {
            return;
        }
        List<SoDuKhaDung> cacSoDu = jdbcTemplate.query(
                """
                        SELECT id, so_tien, nguon_hoa_don_id, ngay_phat_sinh
                        FROM SO_DU_KHA_DUNG
                        WHERE hop_dong_id = ? AND hoa_don_su_dung_id IS NULL
                        ORDER BY id
                        FOR UPDATE
                        """,
                (rs, rowNum) -> new SoDuKhaDung(rs.getLong("id"), rs.getBigDecimal("so_tien"),
                        rs.getLong("nguon_hoa_don_id"), rs.getObject("ngay_phat_sinh", LocalDate.class)),
                hopDongId
        );
        BigDecimal conLai = soTienCanDung;
        for (SoDuKhaDung soDu : cacSoDu) {
            if (conLai.signum() <= 0) break;
            BigDecimal phanDaDung = soDu.soTien().min(conLai);
            jdbcTemplate.update(
                    "UPDATE SO_DU_KHA_DUNG SET so_tien = ?, hoa_don_su_dung_id = ?, ngay_su_dung = ? WHERE id = ? AND hoa_don_su_dung_id IS NULL",
                    phanDaDung, hoaDonId, java.sql.Date.valueOf(LocalDate.now(clock)), soDu.id());
            if (soDu.soTien().compareTo(phanDaDung) > 0) {
                jdbcTemplate.update(
                        "INSERT INTO SO_DU_KHA_DUNG (hop_dong_id, so_tien, nguon_hoa_don_id, ngay_phat_sinh) VALUES (?, ?, ?, ?)",
                        hopDongId, soDu.soTien().subtract(phanDaDung), soDu.nguonHoaDonId(), java.sql.Date.valueOf(soDu.ngayPhatSinh()));
            }
            conLai = conLai.subtract(phanDaDung);
        }
        if (conLai.signum() != 0) throw new IllegalStateException("So du kha dung khong con du de danh dau");
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
                                       hd.trang_thai,
                                       hd.tong_tien,
                                       COALESCE(
                                           (SELECT SUM(tt.so_tien) FROM THANH_TOAN tt WHERE tt.hoa_don_id = hd.id),
                                           0.00
                                       ) AS da_thu,
                                       hd.han_thanh_toan
                                FROM HOA_DON hd
                                JOIN HOP_DONG hop_dong ON hop_dong.id = hd.hop_dong_id
                                JOIN PHONG p ON p.id = hop_dong.phong_id
                                WHERE hd.id = ?
                                  AND hd.ky_id = ?
                                  AND p.toa_nha_id = ?
                                """,
                        (resultSet, rowNum) -> new HoaDonTrongPhamVi(
                                resultSet.getLong("id"),
                                tinhTrangThai(
                                        TrangThaiHoaDon.valueOf(resultSet.getString("trang_thai")),
                                        resultSet.getBigDecimal("tong_tien"),
                                        resultSet.getBigDecimal("da_thu"),
                                        resultSet.getObject("han_thanh_toan", LocalDate.class)
                                )
                        ),
                        hoaDonId,
                        kyId,
                        toaNhaId
                )
                .stream()
                .findFirst();
    }

    List<HoaDonCanPhatHanh> layHoaDonCanPhatHanh(Long toaNhaId, Long kyId) {
        return jdbcTemplate.query(
                """
                        SELECT hd.id, hop_dong.phong_id, hd.trang_thai, hd.tong_tien
                        FROM HOA_DON hd
                        JOIN HOP_DONG hop_dong ON hop_dong.id = hd.hop_dong_id
                        JOIN PHONG p ON p.id = hop_dong.phong_id
                        WHERE hd.ky_id = ?
                          AND p.toa_nha_id = ?
                        ORDER BY p.so_phong, hd.id
                        """,
                (resultSet, rowNum) -> new HoaDonCanPhatHanh(
                        resultSet.getLong("id"),
                        resultSet.getLong("phong_id"),
                        TrangThaiHoaDon.valueOf(resultSet.getString("trang_thai")),
                        resultSet.getBigDecimal("tong_tien")
                ),
                kyId,
                toaNhaId
        );
    }

    private TrangThaiHoaDon tinhTrangThai(
            TrangThaiHoaDon trangThaiLuu,
            BigDecimal tongTien,
            BigDecimal daThu,
            LocalDate hanThanhToan
    ) {
        if (trangThaiLuu == TrangThaiHoaDon.NHAP || trangThaiLuu == TrangThaiHoaDon.DA_HUY) {
            return trangThaiLuu;
        }
        if (daThu.signum() == 0 && !LocalDate.now(clock).isAfter(hanThanhToan)) {
            return trangThaiLuu;
        }
        return quyTacTrangThaiHoaDon.ghiNhanThanhToan(
                trangThaiLuu,
                new TienTe(tongTien),
                new TienTe(daThu),
                LocalDate.now(clock),
                hanThanhToan
        );
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

    int phatHanhHoaDonNeuDangNhapVaTongTienKhacKhong(Long hoaDonId) {
        return jdbcTemplate.update(
                """
                        UPDATE HOA_DON
                        SET trang_thai = 'DA_PHAT_HANH'
                        WHERE id = ?
                          AND trang_thai = 'NHAP'
                          AND tong_tien <> 0.00
                        """,
                hoaDonId
        );
    }

    java.util.Optional<HoaDonCanPhatHanh> timHoaDonCanPhatHanh(Long hoaDonId) {
        return jdbcTemplate.query(
                        """
                                SELECT hd.id, hop_dong.phong_id, hd.trang_thai, hd.tong_tien
                                FROM HOA_DON hd
                                JOIN HOP_DONG hop_dong ON hop_dong.id = hd.hop_dong_id
                                WHERE hd.id = ?
                                """,
                        (resultSet, rowNum) -> new HoaDonCanPhatHanh(
                                resultSet.getLong("id"),
                                resultSet.getLong("phong_id"),
                                TrangThaiHoaDon.valueOf(resultSet.getString("trang_thai")),
                                resultSet.getBigDecimal("tong_tien")
                        ),
                        hoaDonId
                )
                .stream()
                .findFirst();
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

    void khoiPhucSoDuKhaDung(Long hoaDonId) {
        jdbcTemplate.update(
                "UPDATE SO_DU_KHA_DUNG SET hoa_don_su_dung_id = NULL, ngay_su_dung = NULL WHERE hoa_don_su_dung_id = ?",
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

    private record SoDuKhaDung(Long id, BigDecimal soTien, Long nguonHoaDonId, LocalDate ngayPhatSinh) {
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

    record HoaDonCanPhatHanh(Long hoaDonId, Long phongId, TrangThaiHoaDon trangThai, BigDecimal tongTien) {
    }
}
