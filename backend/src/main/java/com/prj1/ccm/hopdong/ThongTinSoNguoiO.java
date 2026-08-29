package com.prj1.ccm.hopdong;

import java.time.LocalDate;

public record ThongTinSoNguoiO(
        Long phongId,
        String soPhong,
        LocalDate ngay,
        int soNguoi,
        int sucChua,
        boolean canhBaoQuaSucChua
) {
}
