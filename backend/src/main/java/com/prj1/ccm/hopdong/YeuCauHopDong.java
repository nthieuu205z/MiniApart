package com.prj1.ccm.hopdong;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record YeuCauHopDong(
        Long phongId,
        Long nguoiThueId,
        LocalDate ngayBatDau,
        LocalDate ngayKetThuc,
        BigDecimal giaThue,
        BigDecimal tienCoc,
        Integer soNgayBaoTruoc,
        List<YeuCauHopDongDichVu> dichVuApDung
) {
}
