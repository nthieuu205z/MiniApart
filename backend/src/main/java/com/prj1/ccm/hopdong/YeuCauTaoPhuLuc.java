package com.prj1.ccm.hopdong;

import java.time.LocalDate;

public record YeuCauTaoPhuLuc(
        String tieuDe,
        LocalDate ngayLap,
        LocalDate ngayHieuLuc,
        String noiDungThayDoi
) {}

