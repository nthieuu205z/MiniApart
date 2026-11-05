package com.prj1.ccm.taisan;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TaiSanPhongDto(
        Long id,
        Long phongId,
        String soPhong,
        String tenTaiSan,
        String loaiTaiSan,
        int soLuong,
        String tinhTrang,
        BigDecimal giaTriUocTinh,
        String ghiChu,
        LocalDate ngayLap
) {}

