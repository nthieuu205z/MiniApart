package com.prj1.ccm.auth;

import org.springframework.context.ApplicationEvent;

public class KichHoatTaiKhoanEvent extends ApplicationEvent {
    private final String soDienThoai;
    private final String maKichHoat;

    public KichHoatTaiKhoanEvent(Object source, String soDienThoai, String maKichHoat) {
        super(source);
        this.soDienThoai = soDienThoai;
        this.maKichHoat = maKichHoat;
    }

    public String soDienThoai() {
        return soDienThoai;
    }

    public String maKichHoat() {
        return maKichHoat;
    }
}
