package com.prj1.ccm.billing.calc;

import java.math.BigDecimal;
import java.util.Objects;

public final class TinhTheoChiSo implements ChienLuocTinhTien {
    private final ChienLuocGia chienLuocGia;

    public TinhTheoChiSo() {
        this.chienLuocGia = null;
    }

    public TinhTheoChiSo(ChienLuocGia chienLuocGia) {
        this.chienLuocGia = Objects.requireNonNull(chienLuocGia, "chienLuocGia must not be null");
    }

    public DongChiTiet tinh(DichVu dichVu, ChiSoDichVu chiSoDichVu, Integer soNguoiOTrongKy) {
        if (chienLuocGia == null) {
            throw new IllegalStateException("chienLuocGia must be supplied for direct calculation");
        }
        return tinh(dichVu, chiSoDichVu, soNguoiOTrongKy, chienLuocGia);
    }

    private DongChiTiet tinh(DichVu dichVu, ChiSoDichVu chiSoDichVu, Integer soNguoiOTrongKy,
            ChienLuocGia gia) {
        BigDecimal soLuong = TinhMucTieuThuCongTo.tinh(
                chiSoDichVu.chiSoDau(),
                chiSoDichVu.chiSoCuoi(),
                chiSoDichVu.chiSoCuoiCongToCu(),
                chiSoDichVu.chiSoDauCongToMoi());
        if (soLuong.signum() < 0) {
            soLuong = BigDecimal.ZERO;
        }
        TienTe thanhTien = gia.thanhTien(soLuong, soNguoiOTrongKy);
        TienTe donGia = gia instanceof GiaCoDinh giaCoDinh ? giaCoDinh.donGia() : null;
        java.util.List<BacTinhTien> cacBac = gia instanceof GiaBacThang giaBacThang
                ? giaBacThang.chiTiet(soLuong, soNguoiOTrongKy)
                : java.util.List.of();
        return new DongChiTiet(
                tenDong(dichVu),
                chiSoDichVu.chiSoDau(),
                chiSoDichVu.chiSoCuoi(),
                soLuong,
                donGia,
                thanhTien,
                LoaiKhoan.DICH_VU,
                dichVu.id(),
                cacBac
        );
    }

    @Override
    public boolean apDungCho(CachTinh cachTinh) {
        return cachTinh == CachTinh.THEO_CHI_SO;
    }

    @Override
    public DongChiTiet tinh(DichVu dichVu, BoiCanhTinh boiCanh) {
        ChiSoDichVu chiSo = boiCanh.cacChiSo().get(dichVu);
        BangGiaTaiThoiDiem bangGia = boiCanh.cacBangGia().get(dichVu);
        if (chiSo == null || bangGia == null) {
            return null;
        }
        ChienLuocGia gia = dichVu.cheDoGia() == CheDoGia.BAC_THANG
                ? new GiaBacThang(bangGia.cacBac())
                : new GiaCoDinh(bangGia.donGia());
        return tinh(dichVu, chiSo, boiCanh.soNguoiOTrongKy(), gia);
    }

    private static String tenDong(DichVu dichVu) {
        return switch (dichVu.ten()) {
            case "Dien" -> "Tien dien";
            case "Nuoc" -> "Tien nuoc";
            default -> dichVu.ten();
        };
    }
}
