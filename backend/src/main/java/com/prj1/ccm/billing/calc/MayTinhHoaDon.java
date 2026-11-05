package com.prj1.ccm.billing.calc;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

public final class MayTinhHoaDon {
    private final List<ChienLuocTinhTien> cacChienLuoc;
    private final QuyTacLamTron quyTacLamTron;

    public MayTinhHoaDon() {
        this(List.of(new TinhTheoChiSo(),
                new TinhCoDinh(), new TinhTheoNguoi(), new TinhTheoSoLuong()), new QuyTacLamTron());
    }

    public MayTinhHoaDon(List<ChienLuocTinhTien> cacChienLuoc, QuyTacLamTron quyTacLamTron) {
        this.cacChienLuoc = List.copyOf(Objects.requireNonNull(cacChienLuoc, "cacChienLuoc must not be null"));
        this.quyTacLamTron = Objects.requireNonNull(quyTacLamTron, "quyTacLamTron must not be null");
    }

    public KetQuaTinhHoaDon tinh(BoiCanhTinh boiCanh) {
        List<DongChiTiet> cacDong = new ArrayList<>();
        List<LyDoBoQua> lyDoBoQua = new ArrayList<>();

        int soNgayO = boiCanh.hopDong().soNgayOTrongKy(boiCanh.ky());
        TienTe tienPhong = boiCanh.hopDong().tinhTienPhong(boiCanh.ky(), boiCanh.soNgayOThucTe());
        cacDong.add(new DongChiTiet(
                "Tien phong (" + soNgayO + "/" + boiCanh.ky().soNgayTrongKy() + " ngay)",
                null,
                null,
                BigDecimal.valueOf(boiCanh.soNgayOThucTe()),
                boiCanh.hopDong().giaThue(),
                tienPhong,
                LoaiKhoan.TIEN_PHONG
        ));

        java.util.stream.Stream.concat(boiCanh.cacBangGia().keySet().stream(), boiCanh.cacChiSo().keySet().stream())
                .distinct()
                .sorted(Comparator.comparing(DichVu::id, Comparator.nullsLast(Comparator.naturalOrder())))
                .forEach(dichVu -> tinhDichVu(dichVu, boiCanh, cacDong, lyDoBoQua));

        for (KhoanPhatSinh khoan : boiCanh.khoanChoTinh()) {
            cacDong.add(new DongChiTiet(khoan.tenKhoan(), null, null, BigDecimal.ONE,
                    khoan.soTien(), khoan.soTien(), LoaiKhoan.KHOAN_PHAT_SINH));
        }

        TienTe tongTruocLamTron = congTien(cacDong);
        if (boiCanh.soDuKhaDung().giaTri().signum() > 0) {
            TienTe soDuSuDung = boiCanh.soDuKhaDung().giaTri().min(tongTruocLamTron.giaTri()).signum() > 0
                    ? new TienTe(boiCanh.soDuKhaDung().giaTri().min(tongTruocLamTron.giaTri()))
                    : new TienTe(BigDecimal.ZERO);
            if (soDuSuDung.giaTri().signum() > 0) {
                TienTe amSoDu = new TienTe(soDuSuDung.giaTri().negate());
                cacDong.add(new DongChiTiet("So du kha dung", null, null, BigDecimal.ONE,
                        soDuSuDung, amSoDu, LoaiKhoan.SO_DU));
                tongTruocLamTron = tongTruocLamTron.cong(amSoDu);
            }
        }
        TienTe tongTien = quyTacLamTron.lamTron(tongTruocLamTron);
        cacDong.add(quyTacLamTron.dongChenhLech(tongTruocLamTron, tongTien));
        return new KetQuaTinhHoaDon(cacDong, tongTien, lyDoBoQua,
                boiCanh.soNguoiOTrongKy(), soHoQuyDoi(boiCanh));
    }

    private Integer soHoQuyDoi(BoiCanhTinh boiCanh) {
        if (boiCanh.soNguoiOTrongKy() == null) {
            return null;
        }
        return boiCanh.cacBangGia().values().stream()
                .filter(bangGia -> !bangGia.cacBac().isEmpty())
                .findFirst()
                .map(bangGia -> new GiaBacThang(bangGia.cacBac()).soHoQuyDoi(boiCanh.soNguoiOTrongKy()))
                .orElse(GiaBacThang.tinhSoHoQuyDoi(boiCanh.soNguoiOTrongKy()));
    }

    public KetQuaTinhHoaDon inLai(HoaDonDaChot hoaDonDaChot) {
        return Objects.requireNonNull(hoaDonDaChot, "hoaDonDaChot must not be null").ketQuaDaChot();
    }

    private void tinhDichVu(DichVu dichVu, BoiCanhTinh boiCanh,
            List<DongChiTiet> cacDong, List<LyDoBoQua> lyDoBoQua) {
        BangGiaTaiThoiDiem bangGia = boiCanh.cacBangGia().get(dichVu);
        if (bangGia == null) {
            lyDoBoQua.add(new LyDoBoQua(boiCanh.hopDong().phongId(), MaLyDo.THIEU_BANG_GIA,
                    "Thieu bang gia tai thoi diem tinh"));
            return;
        }
        if (dichVu.cachTinh() == CachTinh.THEO_CHI_SO && !boiCanh.cacChiSo().containsKey(dichVu)) {
            lyDoBoQua.add(new LyDoBoQua(boiCanh.hopDong().phongId(), MaLyDo.THIEU_CHI_SO,
                    "Thieu chi so tai thoi diem tinh"));
            return;
        }
        if (dichVu.cachTinh() == CachTinh.THEO_NGUOI && boiCanh.soNguoiOTrongKy() == null) {
            lyDoBoQua.add(new LyDoBoQua(boiCanh.hopDong().phongId(), MaLyDo.KHONG_XAC_DINH_SO_NGUOI_O,
                    "Khong xac dinh so nguoi o trong ky"));
            return;
        }
        if (dichVu.cachTinh() == CachTinh.THEO_SO_LUONG && !boiCanh.cacSoLuongDichVu().containsKey(dichVu)) {
            lyDoBoQua.add(new LyDoBoQua(boiCanh.hopDong().phongId(), MaLyDo.THIEU_SO_LUONG_DICH_VU,
                    "Thieu so luong dich vu tai thoi diem tinh"));
            return;
        }
        ChienLuocTinhTien chienLuoc = chienLuocCho(dichVu);
        DongChiTiet dong = chienLuoc.tinh(dichVu, boiCanh);
        if (dong != null) {
            cacDong.add(dong);
        }
    }

    private ChienLuocTinhTien chienLuocCho(DichVu dichVu) {
        return cacChienLuoc.stream()
                .filter(chienLuoc -> chienLuoc.apDungCho(dichVu.cachTinh()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "No calculation strategy for " + dichVu.cachTinh()));
    }

    private static TienTe congTien(List<DongChiTiet> cacDong) {
        TienTe tong = new TienTe(BigDecimal.ZERO);
        for (DongChiTiet dong : cacDong) {
            tong = tong.cong(dong.thanhTien());
        }
        return tong;
    }
}
