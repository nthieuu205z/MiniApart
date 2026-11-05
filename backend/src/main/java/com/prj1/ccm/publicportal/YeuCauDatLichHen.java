package com.prj1.ccm.publicportal;

import java.time.LocalDateTime;

public record YeuCauDatLichHen(
        String hoTen,
        String soDienThoai,
        String email,
        Long phongId,
        Long toaNhaId,
        LocalDateTime thoiGianHen,
        String ghiChu
) {}

