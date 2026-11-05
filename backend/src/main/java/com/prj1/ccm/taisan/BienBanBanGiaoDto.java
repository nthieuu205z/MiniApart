package com.prj1.ccm.taisan;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record BienBanBanGiaoDto(
        Long id,
        Long hopDongId,
        Long phongId,
        String soPhong,
        String loaiBienBan,
        LocalDate ngayThucHien,
        Long nguoiLapId,
        String tenNguoiLap,
        String ghiChuChung,
        BigDecimal tongTienKhauTru,
        LocalDateTime taoLuc,
        List<ChiTietBienBanDto> chiTiet
) {}

