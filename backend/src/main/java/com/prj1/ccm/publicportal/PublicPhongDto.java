package com.prj1.ccm.publicportal;

import java.math.BigDecimal;
import java.util.List;

public record PublicPhongDto(
        Long id,
        Long toaNhaId,
        String tenToaNha,
        String diaChiToaNha,
        String soPhong,
        int tang,
        BigDecimal dienTich,
        int sucChua,
        BigDecimal giaThue,
        String loaiPhong,
        String trangThai,
        String nhanTrangThai,
        List<String> tienIch,
        String moTa,
        String anhDaiDien,
        List<DichVuCongKhaiDto> bangGiaDichVu
) {}

