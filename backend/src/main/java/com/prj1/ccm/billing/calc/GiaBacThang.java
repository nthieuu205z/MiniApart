package com.prj1.ccm.billing.calc;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

public final class GiaBacThang implements ChienLuocGia {
    private static final int SO_NGUOI_MOI_HO = 4;
    private final List<Bac> cacBac;

    public GiaBacThang(List<Bac> cacBac) {
        if (cacBac == null || cacBac.isEmpty()) {
            throw new IllegalArgumentException("cacBac must not be empty");
        }
        this.cacBac = List.copyOf(cacBac);
    }

    public int soHoQuyDoi(Integer soNguoiOTrongKy) {
        return tinhSoHoQuyDoi(soNguoiOTrongKy);
    }

    public static int tinhSoHoQuyDoi(Integer soNguoiOTrongKy) {
        if (soNguoiOTrongKy == null) {
            return 0;
        }
        if (soNguoiOTrongKy < 0) {
            throw new IllegalArgumentException("soNguoiOTrongKy must not be negative");
        }
        int soHo = 0;
        for (int soNguoi = 0; soNguoi < soNguoiOTrongKy; soNguoi += SO_NGUOI_MOI_HO) {
            soHo++;
        }
        return soHo;
    }

    public TienTe thanhTien(BigDecimal soLuong, Integer soNguoiOTrongKy) {
        Objects.requireNonNull(soLuong, "soLuong must not be null");
        if (soLuong.signum() < 0) {
            throw new IllegalArgumentException("soLuong must not be negative");
        }
        if (soNguoiOTrongKy == null) {
            Bac bacBa = cacBac.get(Math.min(2, cacBac.size() - 1));
            return bacBa.donGia().nhan(soLuong);
        }

        return chiTiet(soLuong, soNguoiOTrongKy).stream()
                .map(BacTinhTien::thanhTien)
                .reduce(new TienTe(BigDecimal.ZERO), TienTe::cong);
    }

    public List<BacTinhTien> chiTiet(BigDecimal soLuong, Integer soNguoiOTrongKy) {
        Objects.requireNonNull(soLuong, "soLuong must not be null");
        if (soLuong.signum() < 0) {
            throw new IllegalArgumentException("soLuong must not be negative");
        }
        int soHo = soHoQuyDoi(soNguoiOTrongKy);
        if (soNguoiOTrongKy == null || soHo == 0) {
            return List.of();
        }

        BigDecimal conLai = soLuong;
        java.util.ArrayList<BacTinhTien> ketQua = new java.util.ArrayList<>();
        for (int i = 0; i < cacBac.size(); i++) {
            Bac bac = cacBac.get(i);
            BigDecimal dauBacTruoc = i == 0 ? bac.tuSoLuong() : cacBac.get(i - 1).denSoLuong();
            BigDecimal dinhMuc = bac.denSoLuong() == null
                    ? null
                    : bac.denSoLuong().subtract(dauBacTruoc).multiply(BigDecimal.valueOf(soHo));
            BigDecimal phanTrongBac = dinhMuc == null ? conLai : conLai.min(dinhMuc);
            ketQua.add(new BacTinhTien(
                    bac.thuTu(),
                    bac.tuSoLuong(),
                    bac.denSoLuong(),
                    dinhMuc,
                    phanTrongBac,
                    bac.donGia(),
                    bac.donGia().nhan(phanTrongBac)
            ));
            conLai = conLai.subtract(phanTrongBac);
        }
        return List.copyOf(ketQua);
    }

}
