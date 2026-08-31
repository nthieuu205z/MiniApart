package com.prj1.ccm.billing.calc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

final class BillingCalcTestFixtures {
    private BillingCalcTestFixtures() {
    }

    static TienTe tien(String giaTri) {
        return new TienTe(new BigDecimal(giaTri));
    }

    static BigDecimal so(String giaTri) {
        return new BigDecimal(giaTri);
    }

    static DichVu dichVuDienTheoChiSo() {
        return new DichVu(1L, 1L, "Dien", CachTinh.THEO_CHI_SO, CheDoGia.CO_DINH, "kWh", true);
    }

    static DichVu dichVuDienBacThang() {
        return new DichVu(2L, 1L, "Dien", CachTinh.THEO_CHI_SO, CheDoGia.BAC_THANG, "kWh", true);
    }

    static DichVu dichVuNuocTheoChiSo() {
        return new DichVu(3L, 1L, "Nuoc", CachTinh.THEO_CHI_SO, CheDoGia.CO_DINH, "m3", false);
    }

    static DichVu dichVuNuocTheoNguoi() {
        return new DichVu(4L, 1L, "Nuoc", CachTinh.THEO_NGUOI, CheDoGia.CO_DINH, "nguoi", false);
    }

    static DichVu dichVuRacCoDinh() {
        return new DichVu(5L, 1L, "Phi rac", CachTinh.CO_DINH, CheDoGia.CO_DINH, "ky", false);
    }

    static DichVu dichVuInternetCoDinh() {
        return new DichVu(6L, 1L, "Internet", CachTinh.CO_DINH, CheDoGia.CO_DINH, "ky", false);
    }

    static DichVu dichVuGuiXe() {
        return new DichVu(7L, 1L, "Gui xe", CachTinh.THEO_SO_LUONG, CheDoGia.CO_DINH, "xe", false);
    }

    static HopDong hopDongMacDinh() {
        return new HopDong(
                11L,
                305L,
                901L,
                LocalDate.of(2026, 8, 17),
                LocalDate.of(2027, 8, 16),
                tien("3500000"),
                tien("3500000")
        );
    }

    static KyThanhToan kyThangTam2026() {
        return new KyThanhToan(
                21L,
                1L,
                2026,
                8,
                LocalDate.of(2026, 7, 28),
                LocalDate.of(2026, 8, 28)
        );
    }

    static ChiSoDichVu chiSo(String dau, String cuoi) {
        return new ChiSoDichVu(31L, 21L, 305L, 1L, so(dau), so(cuoi), null, null, false);
    }

    static ChiSoDichVu chiSoThayCongTo(String dau, String cuoi, String cuoiCu, String dauMoi) {
        return new ChiSoDichVu(32L, 21L, 305L, 1L, so(dau), so(cuoi), so(cuoiCu), so(dauMoi), true);
    }

    static List<Bac> namBacDienMacDinh() {
        return List.of(
                new Bac(1, so("0"), so("50"), tien("1984")),
                new Bac(2, so("51"), so("100"), tien("2050")),
                new Bac(3, so("101"), so("200"), tien("2380")),
                new Bac(4, so("201"), so("300"), tien("2998")),
                new Bac(5, so("301"), so("400"), tien("3350")),
                new Bac(6, so("401"), so("999999"), tien("3460"))
        );
    }

    static List<Bac> namBacDienTuongLai() {
        return List.of(
                new Bac(1, so("0"), so("100"), tien("1984")),
                new Bac(2, so("101"), so("200"), tien("2380")),
                new Bac(3, so("201"), so("400"), tien("2998")),
                new Bac(4, so("401"), so("700"), tien("3571")),
                new Bac(5, so("701"), so("999999"), tien("3967"))
        );
    }

    static BoiCanhTinh boiCanhViDuMuc545() {
        DichVu dien = dichVuDienTheoChiSo();
        DichVu nuoc = dichVuNuocTheoChiSo();
        DichVu rac = dichVuRacCoDinh();
        DichVu internet = dichVuInternetCoDinh();
        DichVu guiXe = dichVuGuiXe();

        return new BoiCanhTinh(
                kyThangTam2026(),
                hopDongMacDinh(),
                12,
                1,
                Map.of(
                        dien, chiSo("1240", "1298"),
                        nuoc, chiSo("210", "214")
                ),
                Map.of(
                        dien, new BangGiaTaiThoiDiem(LocalDate.of(2026, 7, 28), tien("3500"), List.of()),
                        nuoc, new BangGiaTaiThoiDiem(LocalDate.of(2026, 7, 28), tien("25000"), List.of()),
                        rac, new BangGiaTaiThoiDiem(LocalDate.of(2026, 7, 28), tien("30000"), List.of()),
                        internet, new BangGiaTaiThoiDiem(LocalDate.of(2026, 7, 28), tien("100000"), List.of()),
                        guiXe, new BangGiaTaiThoiDiem(LocalDate.of(2026, 7, 28), tien("100000"), List.of())
                ),
                Map.of(guiXe, so("1")),
                List.of(),
                tien("0")
        );
    }

    static BoiCanhTinh boiCanhVoiSoNguoiO(Integer soNguoiOTrongKy) {
        BoiCanhTinh goc = boiCanhViDuMuc545();
        return new BoiCanhTinh(
                goc.ky(),
                goc.hopDong(),
                goc.soNgayOThucTe(),
                soNguoiOTrongKy,
                goc.cacChiSo(),
                goc.cacBangGia(),
                goc.cacSoLuongDichVu(),
                goc.khoanChoTinh(),
                goc.soDuKhaDung()
        );
    }

    static BoiCanhTinh boiCanhVoiBangGia(Map<DichVu, BangGiaTaiThoiDiem> thayDoiBangGia) {
        BoiCanhTinh goc = boiCanhViDuMuc545();
        LinkedHashMap<DichVu, BangGiaTaiThoiDiem> bangGiaMoi = new LinkedHashMap<>(goc.cacBangGia());
        bangGiaMoi.putAll(thayDoiBangGia);
        return new BoiCanhTinh(
                goc.ky(),
                goc.hopDong(),
                goc.soNgayOThucTe(),
                goc.soNguoiOTrongKy(),
                goc.cacChiSo(),
                bangGiaMoi,
                goc.cacSoLuongDichVu(),
                goc.khoanChoTinh(),
                goc.soDuKhaDung()
        );
    }

    static BoiCanhTinh boiCanhVoiSoLuongDichVu(DichVu dichVu, BigDecimal soLuong) {
        BoiCanhTinh goc = boiCanhViDuMuc545();
        LinkedHashMap<DichVu, BigDecimal> soLuongMoi = new LinkedHashMap<>(goc.cacSoLuongDichVu());
        soLuongMoi.put(dichVu, soLuong);
        return new BoiCanhTinh(
                goc.ky(),
                goc.hopDong(),
                goc.soNgayOThucTe(),
                goc.soNguoiOTrongKy(),
                goc.cacChiSo(),
                goc.cacBangGia(),
                soLuongMoi,
                goc.khoanChoTinh(),
                goc.soDuKhaDung()
        );
    }
}
