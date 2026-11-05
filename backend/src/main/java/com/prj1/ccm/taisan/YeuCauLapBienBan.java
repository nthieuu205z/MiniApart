package com.prj1.ccm.taisan;

import java.time.LocalDate;
import java.util.List;

public record YeuCauLapBienBan(
        String loaiBienBan,
        LocalDate ngayThucHien,
        String ghiChuChung,
        List<YeuCauChiTietBienBan> chiTiet
) {}

