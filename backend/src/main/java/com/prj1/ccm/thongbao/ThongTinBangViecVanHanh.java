package com.prj1.ccm.thongbao;

import java.util.List;

/** FR-NTF-01 carries semantic status and a filter target for each operational group. */
public record ThongTinBangViecVanHanh(
        Long toaNhaId,
        String tenToaNha,
        List<NhomViec> nhomViec
) {
    public record NhomViec(
            String ma,
            String tieuDe,
            Integer soLuong,
            String trangThai,
            String tenTrangThai,
            boolean khanCap,
            String lienKet
    ) {
    }
}
