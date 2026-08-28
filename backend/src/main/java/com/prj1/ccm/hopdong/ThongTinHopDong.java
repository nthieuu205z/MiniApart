package com.prj1.ccm.hopdong;

import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

public record ThongTinHopDong(
        Long id,
        Long phongId,
        String soPhong,
        Long nguoiThueId,
        String hoTenNguoiThue,
        LocalDate ngayBatDau,
        LocalDate ngayKetThuc,
        String giaThue,
        String tienCoc,
        int soNgayBaoTruoc,
        String trangThai,
        String tenTrangThai,
        boolean sapHetHan,
        long soNgayConLai,
        List<ThongTinHopDongDichVu> dichVuApDung
) {
    public static ThongTinHopDong tao(
            HopDong hopDong,
            String soPhong,
            String hoTenNguoiThue,
            boolean sapHetHan,
            long soNgayConLai,
            List<ThongTinHopDongDichVu> dichVuApDung
    ) {
        return new ThongTinHopDong(
                hopDong.id(),
                hopDong.phongId(),
                soPhong,
                hopDong.nguoiThueId(),
                hoTenNguoiThue,
                hopDong.ngayBatDau(),
                hopDong.ngayKetThuc(),
                hopDong.giaThue().setScale(2, RoundingMode.UNNECESSARY).toPlainString(),
                hopDong.tienCoc().setScale(2, RoundingMode.UNNECESSARY).toPlainString(),
                hopDong.soNgayBaoTruoc(),
                hopDong.trangThai().name(),
                hopDong.trangThai().tenHienThi(),
                sapHetHan,
                soNgayConLai,
                dichVuApDung
        );
    }
}
