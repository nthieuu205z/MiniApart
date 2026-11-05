package com.prj1.ccm.billing.calc;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record BoiCanhTinh(
        KyThanhToan ky,
        HopDong hopDong,
        int soNgayOThucTe,
        Integer soNguoiOTrongKy,
        Map<DichVu, ChiSoDichVu> cacChiSo,
        Map<DichVu, BangGiaTaiThoiDiem> cacBangGia,
        Map<DichVu, BigDecimal> cacSoLuongDichVu,
        List<KhoanPhatSinh> khoanChoTinh,
        TienTe soDuKhaDung
) {
    public BoiCanhTinh(
            KyThanhToan ky,
            HopDong hopDong,
            int soNgayOThucTe,
            Integer soNguoiOTrongKy,
            Map<DichVu, ChiSoDichVu> cacChiSo,
            Map<DichVu, BangGiaTaiThoiDiem> cacBangGia,
            List<KhoanPhatSinh> khoanChoTinh,
            TienTe soDuKhaDung
    ) {
        this(ky, hopDong, soNgayOThucTe, soNguoiOTrongKy, cacChiSo, cacBangGia, Map.of(),
                khoanChoTinh, soDuKhaDung);
    }

    public BoiCanhTinh {
        cacChiSo = Map.copyOf(cacChiSo);
        cacBangGia = Map.copyOf(cacBangGia);
        cacSoLuongDichVu = Map.copyOf(cacSoLuongDichVu);
        khoanChoTinh = List.copyOf(khoanChoTinh);
    }
}
