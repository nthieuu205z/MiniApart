package com.prj1.ccm.auth;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

@Component
public class SpringEventKichHoatTaiKhoanDelivery implements KichHoatTaiKhoanDelivery {
    private final ApplicationEventPublisher eventPublisher;

    public SpringEventKichHoatTaiKhoanDelivery(ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    @Override
    public void guiMaKichHoat(String soDienThoai, String maKichHoat) {
        eventPublisher.publishEvent(new KichHoatTaiKhoanEvent(this, soDienThoai, maKichHoat));
    }
}
