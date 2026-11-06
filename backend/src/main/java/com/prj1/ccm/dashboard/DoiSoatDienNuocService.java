package com.prj1.ccm.dashboard;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class DoiSoatDienNuocService {
    private static final BigDecimal NGUONG_TANG_TY_LE_CANH_BAO = BigDecimal.valueOf(1.50); // 1.5x (tăng 50%)
    private static final BigDecimal NGUONG_TANG_DIEN_TOI_THIEU = BigDecimal.valueOf(30.00); // 30 kWh
    private static final BigDecimal NGUONG_TANG_NUOC_TOI_THIEU = BigDecimal.valueOf(10.00); // 10 m3

    private final DiemDoDungChungRepository diemDoRepository;
    private final JdbcTemplate jdbcTemplate;

    public DoiSoatDienNuocService(
            DiemDoDungChungRepository diemDoRepository,
            JdbcTemplate jdbcTemplate
    ) {
        this.diemDoRepository = diemDoRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Thực hiện đối soát điện hoặc nước cho một tòa nhà trong một kỳ thanh toán cụ thể.
     * Công thức: Chênh lệch = Công tơ tổng - Tổng phòng - Khu vực chung đã đo riêng.
     */
    public KetQuaDoiSoat doiSoatKy(Long toaNhaId, Long kyId, String loaiDichVu) {
        boolean laDien = "DIEN".equalsIgnoreCase(loaiDichVu);
        String donVi = laDien ? "kWh" : "m3";

        // 1. Lấy thông tin kỳ
        KyInfo kyInfo = layThongTinKy(kyId);
        if (kyInfo == null) {
            return KetQuaDoiSoat.chuaDuDuLieu(donVi, "Không tìm thấy thông tin kỳ thanh toán.");
        }

        // 2. Lấy tiêu thụ công tơ tổng tòa nhà
        BigDecimal tieuThuTong = layTieuThuCongToTong(toaNhaId, kyId, loaiDichVu);

        // 3. Lấy tổng tiêu thụ các phòng kèm kiểm tra độ bao phủ (coverage)
        TongTieuThuPhongInfo phongInfo = layTongTieuThuPhongInfo(toaNhaId, kyId, laDien);
        BigDecimal tieuThuPhong = phongInfo.tongTieuThu();

        // 4. Lấy tiêu thụ các điểm đo khu vực chung (có kiểm tra phân cấp cha-con)
        List<ChiTietKhuVucDungChung> chiTietKhuVuc = layChiTietKhuVucChung(toaNhaId, kyId, loaiDichVu);
        BigDecimal tieuThuChungDoRieng = BigDecimal.ZERO.setScale(2);
        BigDecimal chiPhiUocTinh = BigDecimal.ZERO.setScale(2);
        boolean coDiemDoChungChuaGhi = false;
        boolean coDiemChungChuaCoGia = false;

        for (ChiTietKhuVucDungChung kv : chiTietKhuVuc) {
            if (kv.mucTieuThu() == null) {
                coDiemDoChungChuaGhi = true;
            } else if (kv.laDiemDoDocLap()) {
                // Chỉ trừ các điểm đo độc lập (không phải là con của 1 điểm đo khu vực chung khác)
                tieuThuChungDoRieng = tieuThuChungDoRieng.add(kv.mucTieuThu());
            }
            if (kv.chiPhi() != null) {
                chiPhiUocTinh = chiPhiUocTinh.add(kv.chiPhi());
            } else if (kv.mucTieuThu() != null && kv.mucTieuThu().compareTo(BigDecimal.ZERO) > 0) {
                coDiemChungChuaCoGia = true;
            }
        }

        // 5. Kiểm tra điều kiện đủ dữ liệu
        if (tieuThuTong == null) {
            return new KetQuaDoiSoat(
                    "CHUA_DU_DU_LIEU",
                    null,
                    tieuThuPhong,
                    tieuThuChungDoRieng,
                    null,
                    donVi,
                    BigDecimal.ZERO.setScale(2),
                    false,
                    "Chưa đủ dữ liệu đối soát: Chưa ghi nhận số đo công tơ tổng trong kỳ.",
                    chiTietKhuVuc,
                    chiPhiUocTinh
            );
        }

        if (!phongInfo.duDuLieu() || tieuThuPhong == null) {
            String ghiChuPhong = (phongInfo.tongSoPhongCanDo() > 0 && phongInfo.soPhongDaGhi() < phongInfo.tongSoPhongCanDo())
                    ? String.format("Chưa đủ dữ liệu đối soát: Mới ghi nhận số đo của %d/%d phòng trong kỳ.",
                            phongInfo.soPhongDaGhi(), phongInfo.tongSoPhongCanDo())
                    : "Chưa đủ dữ liệu đối soát: Chưa có số liệu tiêu thụ phòng.";
            return new KetQuaDoiSoat(
                    "CHUA_DU_DU_LIEU",
                    tieuThuTong,
                    tieuThuPhong,
                    tieuThuChungDoRieng,
                    null,
                    donVi,
                    BigDecimal.ZERO.setScale(2),
                    false,
                    ghiChuPhong,
                    chiTietKhuVuc,
                    chiPhiUocTinh
            );
        }

        if (coDiemDoChungChuaGhi) {
            return new KetQuaDoiSoat(
                    "CHUA_DU_DU_LIEU",
                    tieuThuTong,
                    tieuThuPhong,
                    tieuThuChungDoRieng,
                    null,
                    donVi,
                    BigDecimal.ZERO.setScale(2),
                    false,
                    "Chưa đủ dữ liệu đối soát: Còn điểm đo khu vực chung chưa ghi nhận số đo trong kỳ.",
                    chiTietKhuVuc,
                    chiPhiUocTinh
            );
        }

        // 6. Tính chênh lệch: Tổng - Phòng - Chung đo riêng
        BigDecimal chenhLech = tieuThuTong.subtract(tieuThuPhong).subtract(tieuThuChungDoRieng).setScale(2, RoundingMode.HALF_UP);

        // 7. Lấy ngưỡng thất thoát tòa nhà cấu hình và đơn giá mua công tơ thực tế
        BigDecimal nguongThatThoat = layNguongThatThoat(toaNhaId);
        BigDecimal donGiaThamChieu = layDonGiaDichVu(toaNhaId, loaiDichVu);

        if (donGiaThamChieu == null || donGiaThamChieu.compareTo(BigDecimal.ZERO) <= 0) {
            return new KetQuaDoiSoat(
                    "CHUA_DU_DU_LIEU",
                    tieuThuTong,
                    tieuThuPhong,
                    tieuThuChungDoRieng,
                    null,
                    donVi,
                    BigDecimal.ZERO.setScale(2),
                    false,
                    "Chưa đủ dữ liệu đối soát: Chưa cấu hình đơn giá mua công tơ để xác định ngưỡng cho phép.",
                    chiTietKhuVuc,
                    chiPhiUocTinh
            );
        }

        BigDecimal nguongTheoDonVi = nguongThatThoat.divide(donGiaThamChieu, 2, RoundingMode.HALF_UP);

        String trangThai;
        boolean vuotNguong;
        String ghiChu;

        // Xử lý chênh lệch âm: Tổng < Phòng + Chung
        if (chenhLech.compareTo(BigDecimal.ZERO) < 0) {
            trangThai = "LECH_AM_BAT_THUONG";
            vuotNguong = true;
            ghiChu = String.format("Chênh lệch âm bất thường (%s %s): tổng tiêu thụ phòng và khu vực chung vượt quá công tơ tổng. Cần kiểm tra công tơ tổng.",
                    chenhLech.toPlainString(), donVi);
        } else {
            vuotNguong = chenhLech.compareTo(nguongTheoDonVi) > 0;
            trangThai = vuotNguong ? "CANH_BAO_THAT_THOAT" : "KHOP_DOI_SOAT";
            ghiChu = vuotNguong
                    ? String.format("Chênh lệch đối soát vượt ngưỡng cho phép (%s %s > ngưỡng %s %s).",
                    chenhLech.toPlainString(), donVi, nguongTheoDonVi.toPlainString(), donVi)
                    : "Số liệu đối soát nằm trong ngưỡng sai số kỹ thuật cho phép.";
        }

        return new KetQuaDoiSoat(
                trangThai,
                tieuThuTong,
                tieuThuPhong,
                tieuThuChungDoRieng,
                chenhLech,
                donVi,
                nguongTheoDonVi,
                vuotNguong,
                ghiChu,
                chiTietKhuVuc,
                chiPhiUocTinh
        );
    }

    /**
     * Kiểm tra bất thường của một điểm đo so với 3 kỳ trước đó hợp lệ, đã chuẩn hóa theo số ngày của kỳ.
     */
    public KiemTraBatThuong kiemTraBatThuongDiemDo(Long diemDoId, Long kyId) {
        var kyHienTaiOpt = diemDoRepository.findChiSoByDiemDoVaKy(diemDoId, kyId);
        if (kyHienTaiOpt.isEmpty()) {
            return KiemTraBatThuong.khongCoDuLieu();
        }
        var kyHienTai = kyHienTaiOpt.get();

        // Lấy đúng 3 kỳ trước liền kề với kỳ mục tiêu
        var cacKyTruoc = diemDoRepository.findChiSoCacKyTruoc(diemDoId, kyId, 3);
        if (cacKyTruoc.size() < 3) {
            return KiemTraBatThuong.chuaDuLichSu();
        }

        // Chuẩn hóa theo số ngày
        KyInfo kyHienTaiInfo = layThongTinKy(kyHienTai.kyId());
        if (kyHienTaiInfo == null || kyHienTaiInfo.soNgay() <= 0) {
            return KiemTraBatThuong.khongCoDuLieu();
        }

        BigDecimal tieuThuHienTai = kyHienTai.mucTieuThu();
        BigDecimal tieuThuNgayHienTai = tieuThuHienTai.divide(BigDecimal.valueOf(kyHienTaiInfo.soNgay()), 4, RoundingMode.HALF_UP);

        BigDecimal tongTieuThuNgayKyTruoc = BigDecimal.ZERO;
        for (var cs : cacKyTruoc) {
            KyInfo kInfo = layThongTinKy(cs.kyId());
            long soNgay = (kInfo != null && kInfo.soNgay() > 0) ? kInfo.soNgay() : 30;
            tongTieuThuNgayKyTruoc = tongTieuThuNgayKyTruoc.add(cs.mucTieuThu().divide(BigDecimal.valueOf(soNgay), 4, RoundingMode.HALF_UP));
        }

        BigDecimal trungBinhNgayKyTruoc = tongTieuThuNgayKyTruoc.divide(BigDecimal.valueOf(cacKyTruoc.size()), 4, RoundingMode.HALF_UP);
        BigDecimal thamChieuKyNay = trungBinhNgayKyTruoc.multiply(BigDecimal.valueOf(kyHienTaiInfo.soNgay())).setScale(2, RoundingMode.HALF_UP);

        if (thamChieuKyNay.compareTo(BigDecimal.ZERO) <= 0) {
            return KiemTraBatThuong.binhThuong();
        }

        BigDecimal tyLe = tieuThuHienTai.divide(thamChieuKyNay, 2, RoundingMode.HALF_UP);
        BigDecimal mucTang = tieuThuHienTai.subtract(thamChieuKyNay).setScale(2, RoundingMode.HALF_UP);

        boolean laDien = "DIEN".equalsIgnoreCase(kyHienTai.loaiDichVu());
        BigDecimal nguongTangToiThieu = laDien ? NGUONG_TANG_DIEN_TOI_THIEU : NGUONG_TANG_NUOC_TOI_THIEU;

        if (tyLe.compareTo(NGUONG_TANG_TY_LE_CANH_BAO) >= 0 && mucTang.compareTo(nguongTangToiThieu) >= 0) {
            String lyDo = String.format(
                    "Mức tiêu thụ kỳ này là %s %s, trung bình 3 kỳ trước là %s %s, gấp %s lần (tăng %s %s).",
                    tieuThuHienTai.toPlainString(), kyHienTai.donVi(),
                    thamChieuKyNay.toPlainString(), kyHienTai.donVi(),
                    tyLe.toPlainString(), mucTang.toPlainString(), kyHienTai.donVi()
            );
            return new KiemTraBatThuong(true, tieuThuHienTai, thamChieuKyNay, mucTang, tyLe, lyDo);
        }

        return KiemTraBatThuong.binhThuong();
    }

    private BigDecimal layTieuThuCongToTong(Long toaNhaId, Long kyId, String loaiDichVu) {
        List<BigDecimal> list = jdbcTemplate.query(
                """
                SELECT cs.muc_tieu_thu
                FROM CHI_SO_DUNG_CHUNG cs
                JOIN DIEM_DO_DUNG_CHUNG dd ON dd.id = cs.diem_do_id
                WHERE dd.toa_nha_id = ? AND cs.ky_id = ?
                  AND dd.loai_diem_do = 'TONG'
                  AND dd.loai_dich_vu = ?
                  AND (dd.cong_to_cha_id IS NULL OR dd.cong_to_cha_id NOT IN (
                      SELECT sub.id FROM DIEM_DO_DUNG_CHUNG sub
                      WHERE sub.toa_nha_id = ? AND sub.loai_diem_do = 'TONG'
                  ))
                """,
                (rs, rowNum) -> rs.getBigDecimal("muc_tieu_thu"),
                toaNhaId, kyId, loaiDichVu, toaNhaId
        );
        if (list.isEmpty()) {
            return null;
        }
        BigDecimal tong = BigDecimal.ZERO.setScale(2);
        for (BigDecimal b : list) {
            if (b != null) {
                tong = tong.add(b);
            }
        }
        return tong;
    }

    record TongTieuThuPhongInfo(
            BigDecimal tongTieuThu,
            int tongSoPhongCanDo,
            int soPhongDaGhi
    ) {
        boolean duDuLieu() {
            return tongSoPhongCanDo == 0 || soPhongDaGhi >= tongSoPhongCanDo;
        }
    }

    private TongTieuThuPhongInfo layTongTieuThuPhongInfo(Long toaNhaId, Long kyId, boolean laDien) {
        List<TongTieuThuPhongInfo> list = jdbcTemplate.query(
                """
                SELECT 
                    COUNT(DISTINCT p.id) AS tong_phong,
                    COUNT(DISTINCT cs.phong_id) AS phong_da_ghi,
                    SUM(
                        CASE
                            WHEN cs.co_thay_cong_to = TRUE
                            THEN (COALESCE(cs.chi_so_cuoi_cong_to_cu, cs.chi_so_dau) - cs.chi_so_dau)
                               + (cs.chi_so_cuoi - COALESCE(cs.chi_so_dau_cong_to_moi, cs.chi_so_cuoi))
                            ELSE (cs.chi_so_cuoi - cs.chi_so_dau)
                        END
                    ) AS tieu_thu
                FROM PHONG p
                JOIN DICH_VU dv ON dv.toa_nha_id = p.toa_nha_id AND dv.cach_tinh = 'THEO_CHI_SO' AND dv.dang_su_dung = TRUE AND dv.la_dien = ?
                LEFT JOIN CHI_SO_DICH_VU cs ON cs.phong_id = p.id AND cs.dich_vu_id = dv.id AND cs.ky_id = ?
                WHERE p.toa_nha_id = ?
                """,
                (rs, rowNum) -> {
                    int tong = rs.getInt("tong_phong");
                    int daGhi = rs.getInt("phong_da_ghi");
                    BigDecimal tt = rs.getBigDecimal("tieu_thu");
                    return new TongTieuThuPhongInfo(
                            tt == null ? null : tt.setScale(2, RoundingMode.HALF_UP),
                            tong,
                            daGhi
                    );
                },
                laDien, kyId, toaNhaId
        );
        if (list.isEmpty()) {
            return new TongTieuThuPhongInfo(null, 0, 0);
        }
        return list.get(0);
    }

    private List<ChiTietKhuVucDungChung> layChiTietKhuVucChung(Long toaNhaId, Long kyId, String loaiDichVu) {
        return jdbcTemplate.query(
                """
                SELECT dd.id, dd.ma_cong_to, dd.ten_cong_to, dd.khu_vuc, dd.don_vi, dd.don_gia_mua,
                       dd.cong_to_cha_id,
                       parent.loai_diem_do AS loai_diem_do_cha,
                       cs.muc_tieu_thu,
                       CASE
                           WHEN cs.muc_tieu_thu IS NOT NULL AND dd.don_gia_mua IS NOT NULL AND dd.don_gia_mua > 0
                           THEN (cs.muc_tieu_thu * dd.don_gia_mua)
                           ELSE NULL
                       END AS chi_phi
                FROM DIEM_DO_DUNG_CHUNG dd
                LEFT JOIN DIEM_DO_DUNG_CHUNG parent ON parent.id = dd.cong_to_cha_id
                LEFT JOIN CHI_SO_DUNG_CHUNG cs ON cs.diem_do_id = dd.id AND cs.ky_id = ?
                WHERE dd.toa_nha_id = ?
                  AND dd.loai_diem_do = 'KHU_VUC_CHUNG'
                  AND dd.loai_dich_vu = ?
                ORDER BY dd.khu_vuc ASC, dd.ma_cong_to ASC
                """,
                (rs, rowNum) -> {
                    BigDecimal tieuThu = rs.getBigDecimal("muc_tieu_thu");
                    BigDecimal chiPhi = rs.getBigDecimal("chi_phi");
                    Long congToChaId = rs.getObject("cong_to_cha_id") != null ? rs.getLong("cong_to_cha_id") : null;
                    String loaiDiemDoCha = rs.getString("loai_diem_do_cha");
                    return new ChiTietKhuVucDungChung(
                            rs.getLong("id"),
                            rs.getString("ma_cong_to"),
                            rs.getString("ten_cong_to"),
                            rs.getString("khu_vuc"),
                            rs.getString("don_vi"),
                            rs.getBigDecimal("don_gia_mua"),
                            tieuThu == null ? null : tieuThu.setScale(2, RoundingMode.HALF_UP),
                            chiPhi == null ? null : chiPhi.setScale(2, RoundingMode.HALF_UP),
                            congToChaId,
                            loaiDiemDoCha
                    );
                },
                kyId, toaNhaId, loaiDichVu
        );
    }

    private BigDecimal layNguongThatThoat(Long toaNhaId) {
        List<BigDecimal> list = jdbcTemplate.query(
                "SELECT nguong_that_thoat FROM TOA_NHA WHERE id = ?",
                (rs, rowNum) -> rs.getBigDecimal(1),
                toaNhaId
        );
        return list.isEmpty() || list.get(0) == null ? BigDecimal.valueOf(150000) : list.get(0);
    }

    private BigDecimal layDonGiaDichVu(Long toaNhaId, String loaiDichVu) {
        // Lấy đơn giá mua thực tế đã cấu hình từ công tơ tổng hoặc công tơ khu vực chung
        List<BigDecimal> list = jdbcTemplate.query(
                """
                SELECT dd.don_gia_mua
                FROM DIEM_DO_DUNG_CHUNG dd
                WHERE dd.toa_nha_id = ? AND dd.loai_dich_vu = ? AND dd.don_gia_mua > 0
                ORDER BY CASE WHEN dd.loai_diem_do = 'TONG' THEN 1 ELSE 2 END, dd.id ASC
                LIMIT 1
                """,
                (rs, rowNum) -> rs.getBigDecimal("don_gia_mua"),
                toaNhaId, loaiDichVu
        );
        if (!list.isEmpty() && list.get(0) != null) {
            return list.get(0);
        }
        return null;
    }

    private KyInfo layThongTinKy(Long kyId) {
        List<KyInfo> list = jdbcTemplate.query(
                "SELECT id, toa_nha_id, nam, thang, ngay_bat_dau, ngay_ket_thuc FROM KY_THANH_TOAN WHERE id = ?",
                (rs, rowNum) -> {
                    var batDau = rs.getDate("ngay_bat_dau").toLocalDate();
                    var ketThuc = rs.getDate("ngay_ket_thuc").toLocalDate();
                    long soNgay = ChronoUnit.DAYS.between(batDau, ketThuc) + 1;
                    return new KyInfo(rs.getLong("id"), rs.getLong("toa_nha_id"), rs.getInt("nam"), rs.getInt("thang"), batDau, ketThuc, soNgay);
                },
                kyId
        );
        return list.isEmpty() ? null : list.get(0);
    }

    public record KetQuaDoiSoat(
            String trangThai,
            BigDecimal mucTong,
            BigDecimal mucPhong,
            BigDecimal mucChungDoRieng,
            BigDecimal chenhLech,
            String donVi,
            BigDecimal nguongChoPhep,
            boolean vuotNguong,
            String ghiChu,
            List<ChiTietKhuVucDungChung> chiTietKhuVuc,
            BigDecimal chiPhiUocTinh
    ) {
        public static KetQuaDoiSoat chuaDuDuLieu(String donVi, String ghiChu) {
            return new KetQuaDoiSoat(
                    "CHUA_DU_DU_LIEU",
                    null, null, null, null,
                    donVi, BigDecimal.ZERO.setScale(2), false, ghiChu,
                    List.of(), BigDecimal.ZERO.setScale(2)
            );
        }
    }

    public record ChiTietKhuVucDungChung(
            Long diemDoId,
            String maCongTo,
            String tenCongTo,
            String khuVuc,
            String donVi,
            BigDecimal donGiaMua,
            BigDecimal mucTieuThu,
            BigDecimal chiPhi,
            Long congToChaId,
            String loaiDiemDoCha
    ) {
        public ChiTietKhuVucDungChung(
                Long diemDoId,
                String maCongTo,
                String tenCongTo,
                String khuVuc,
                String donVi,
                BigDecimal donGiaMua,
                BigDecimal mucTieuThu,
                BigDecimal chiPhi
        ) {
            this(diemDoId, maCongTo, tenCongTo, khuVuc, donVi, donGiaMua, mucTieuThu, chiPhi, null, null);
        }

        public boolean laDiemDoDocLap() {
            return congToChaId == null || "TONG".equalsIgnoreCase(loaiDiemDoCha);
        }
    }

    public record KiemTraBatThuong(
            boolean batThuong,
            BigDecimal mucTieuThuKyNay,
            BigDecimal mucThamChieu,
            BigDecimal mucTang,
            BigDecimal tyLeTang,
            String lyDo
    ) {
        public static KiemTraBatThuong binhThuong() {
            return new KiemTraBatThuong(false, null, null, null, null, "Mức tiêu thụ bình thường.");
        }

        public static KiemTraBatThuong chuaDuLichSu() {
            return new KiemTraBatThuong(false, null, null, null, null, "Chưa đủ 3 kỳ lịch sử để so sánh bất thường.");
        }

        public static KiemTraBatThuong khongCoDuLieu() {
            return new KiemTraBatThuong(false, null, null, null, null, "Chưa có dữ liệu ghi chỉ số.");
        }
    }

    private record KyInfo(
            Long id,
            Long toaNhaId,
            int nam,
            int thang,
            java.time.LocalDate ngayBatDau,
            java.time.LocalDate ngayKetThuc,
            long soNgay
    ) {}
}
