package com.prj1.ccm.hopdong;

import java.time.LocalDate;

public record YeuCauGhiNhanKy(
        LocalDate ngayKy,
        String ghiChuKy,
        String fileScanDinhKem,
        Integer expectedRevision
) {
    public YeuCauGhiNhanKy(LocalDate ngayKy, String ghiChuKy, String fileScanDinhKem) {
        this(ngayKy, ghiChuKy, fileScanDinhKem, null);
    }
}


