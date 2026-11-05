package com.prj1.ccm.billing.calc;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BillingCalcValueTypesTest {

    @Test
    void FR_INV_02_billingCalcValueTypesDefensivelyCopyMutableCollections() {
        DichVu dichVu = new DichVu(10L, 20L, "Dien", CachTinh.THEO_CHI_SO, CheDoGia.BAC_THANG, "kWh", true);
        ChiSoDichVu chiSo = new ChiSoDichVu(
                30L,
                40L,
                50L,
                10L,
                new BigDecimal("1240.00"),
                new BigDecimal("1298.00"),
                null,
                null,
                false
        );
        Bac bac = new Bac(1, new BigDecimal("0.00"), new BigDecimal("50.00"), new TienTe(new BigDecimal("3500")));
        BangGiaTaiThoiDiem bangGia = new BangGiaTaiThoiDiem(
                LocalDate.of(2026, 8, 1),
                new TienTe(new BigDecimal("3500")),
                new ArrayList<>(List.of(bac))
        );
        KhoanPhatSinh khoanPhatSinh = new KhoanPhatSinh(60L, "Phi sua cua", new TienTe(new BigDecimal("-50000")));

        LinkedHashMap<DichVu, ChiSoDichVu> cacChiSo = new LinkedHashMap<>();
        cacChiSo.put(dichVu, chiSo);

        LinkedHashMap<DichVu, BangGiaTaiThoiDiem> cacBangGia = new LinkedHashMap<>();
        cacBangGia.put(dichVu, bangGia);

        ArrayList<KhoanPhatSinh> khoanChoTinh = new ArrayList<>(List.of(khoanPhatSinh));

        BoiCanhTinh boiCanh = new BoiCanhTinh(
                new KyThanhToan(70L, 80L, 2026, 8, LocalDate.of(2026, 7, 28), LocalDate.of(2026, 8, 28)),
                new HopDong(
                        90L,
                        100L,
                        110L,
                        LocalDate.of(2026, 8, 17),
                        LocalDate.of(2027, 8, 16),
                        new TienTe(new BigDecimal("3500000")),
                        new TienTe(new BigDecimal("3500000"))
                ),
                12,
                1,
                cacChiSo,
                cacBangGia,
                khoanChoTinh,
                new TienTe(new BigDecimal("250000"))
        );

        cacChiSo.clear();
        cacBangGia.clear();
        khoanChoTinh.clear();

        assertThat(boiCanh.cacChiSo()).containsOnlyKeys(dichVu);
        assertThat(boiCanh.cacBangGia()).containsOnlyKeys(dichVu);
        assertThat(boiCanh.khoanChoTinh()).containsExactly(khoanPhatSinh);
        assertThatThrownBy(() -> boiCanh.cacChiSo().clear()).isInstanceOf(UnsupportedOperationException.class);
        assertThatThrownBy(() -> boiCanh.cacBangGia().clear()).isInstanceOf(UnsupportedOperationException.class);
        assertThatThrownBy(() -> boiCanh.khoanChoTinh().clear()).isInstanceOf(UnsupportedOperationException.class);
        assertThatThrownBy(() -> bangGia.cacBac().clear()).isInstanceOf(UnsupportedOperationException.class);
    }

    @Test
    void FR_INV_02_ketQuaTinhHoaDonCarriesMoneyBackedTotalsAndSkipReasons() {
        DongChiTiet dong = new DongChiTiet(
                "Tien phong",
                null,
                null,
                new BigDecimal("12.00"),
                new TienTe(new BigDecimal("291666.67")),
                new TienTe(new BigDecimal("3500000.00")),
                LoaiKhoan.TIEN_PHONG
        );
        LyDoBoQua lyDo = new LyDoBoQua(305L, MaLyDo.THIEU_BANG_GIA, "Thieu bang gia tai thoi diem tinh");

        KetQuaTinhHoaDon ketQua = new KetQuaTinhHoaDon(
                new ArrayList<>(List.of(dong)),
                new TienTe(new BigDecimal("3500000.00")),
                new ArrayList<>(List.of(lyDo))
        );

        assertThat(ketQua.tongTien().giaTri()).isEqualByComparingTo("3500000.00");
        assertThat(ketQua.cacDong()).containsExactly(dong);
        assertThat(ketQua.lyDoBoQua()).containsExactly(lyDo);
        assertThat(ketQua.thanhCong()).isFalse();
    }

    @Test
    void FR_INV_02_tierDetailsExposeEveryRangeQuotaUnitPriceAndAmountForHandRecomputation() {
        GiaBacThang gia = new GiaBacThang(List.of(
                new Bac(1, new BigDecimal("0.00"), new BigDecimal("50.00"), new TienTe(new BigDecimal("3500.00"))),
                new Bac(2, new BigDecimal("51.00"), new BigDecimal("100.00"), new TienTe(new BigDecimal("4000.00"))),
                new Bac(3, new BigDecimal("101.00"), new BigDecimal("200.00"), new TienTe(new BigDecimal("5000.00")))
        ));

        assertThat(gia.chiTiet(new BigDecimal("110.00"), 5))
                .extracting(BacTinhTien::dinhMucQuyDoi, BacTinhTien::soLuong,
                        BacTinhTien::donGia, BacTinhTien::thanhTien)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple(new BigDecimal("100.00"), new BigDecimal("100.00"), new TienTe(new BigDecimal("3500.00")), new TienTe(new BigDecimal("350000.00"))),
                        org.assertj.core.groups.Tuple.tuple(new BigDecimal("100.00"), new BigDecimal("10.00"), new TienTe(new BigDecimal("4000.00")), new TienTe(new BigDecimal("40000.00"))),
                        org.assertj.core.groups.Tuple.tuple(new BigDecimal("200.00"), new BigDecimal("0.00"), new TienTe(new BigDecimal("5000.00")), new TienTe(new BigDecimal("0.00")))
                );
    }

    @Test
    void FR_INV_02_openEndedTierDetailsExposeUnlimitedQuotaInsteadOfRemainingConsumption() {
        GiaBacThang gia = new GiaBacThang(List.of(
                new Bac(1, new BigDecimal("0.00"), new BigDecimal("100.00"), new TienTe(new BigDecimal("3500.00"))),
                new Bac(2, new BigDecimal("101.00"), null, new TienTe(new BigDecimal("4000.00")))
        ));

        assertThat(gia.chiTiet(new BigDecimal("250.00"), 1))
                .extracting(BacTinhTien::dinhMucQuyDoi, BacTinhTien::soLuong,
                        BacTinhTien::donGia, BacTinhTien::thanhTien)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple(new BigDecimal("100.00"), new BigDecimal("100.00"), new TienTe(new BigDecimal("3500.00")), new TienTe(new BigDecimal("350000.00"))),
                        org.assertj.core.groups.Tuple.tuple(null, new BigDecimal("150.00"), new TienTe(new BigDecimal("4000.00")), new TienTe(new BigDecimal("600000.00")))
                );
    }
}
