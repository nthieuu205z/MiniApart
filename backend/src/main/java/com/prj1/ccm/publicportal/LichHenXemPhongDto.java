package com.prj1.ccm.publicportal;

import java.time.LocalDateTime;

public record LichHenXemPhongDto(
        Long id,
        String hoTen,
        String soDienThoai,
        String email,
        Long phongId,
        String soPhong,
        Long toaNhaId,
        String tenToaNha,
        LocalDateTime thoiGianHen,
        String ghiChu,
        String trangThai,
        LocalDateTime taoLuc
) {}

