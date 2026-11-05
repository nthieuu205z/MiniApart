package com.prj1.ccm.auth;

import com.prj1.ccm.nguoidung.*;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockHttpServletRequest;
import tools.jackson.databind.ObjectMapper;
import java.time.*;
import static org.assertj.core.api.Assertions.*;

class LocalMaXacThucTest {
    @Test void localDeliveryRequiresBothExplicitOptInAndLocalProfile() {
        MockEnvironment env = new MockEnvironment().withProperty("app.activation.delivery.local-enabled", "true");
        KichHoatTaiKhoanDeliveryConfiguration config = new KichHoatTaiKhoanDeliveryConfiguration();
        assertThatThrownBy(() -> config.kichHoatTaiKhoanDelivery(new ObjectMapper(), env, Clock.systemUTC())).isInstanceOf(IllegalStateException.class);
        env.setActiveProfiles("local");
        assertThat(config.kichHoatTaiKhoanDelivery(new ObjectMapper(), env, Clock.systemUTC())).isInstanceOf(LocalMaXacThucDelivery.class);
        env.setActiveProfiles("local", "prod");
        assertThatThrownBy(() -> config.kichHoatTaiKhoanDelivery(new ObjectMapper(), env, Clock.systemUTC())).isInstanceOf(IllegalStateException.class);
    }

    @Test void outboxRequiresAdministratorAndDisablesCaching() {
        LocalMaXacThucDelivery outbox = new LocalMaXacThucDelivery(Clock.fixed(Instant.parse("2026-11-04T00:00:00Z"), ZoneOffset.UTC));
        outbox.guiMaKichHoat("0900000003", "activation-secret");
        LocalMaXacThucController controller = new LocalMaXacThucController(outbox);
        MockHttpServletRequest request = new MockHttpServletRequest();
        assertThatThrownBy(() -> controller.lay("0900000003", request)).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        request.setAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE, new NguoiDung(3L, "QL", "0900000003", "", VaiTro.QUAN_LY, TrangThaiNguoiDung.HOAT_DONG, 0, null));
        assertThatThrownBy(() -> controller.lay("0900000003", request)).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        request.setAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE, new NguoiDung(1L, "QT", "0900000001", "", VaiTro.QTHT, TrangThaiNguoiDung.HOAT_DONG, 0, null));
        var response = controller.lay("0900000003", request);
        assertThat(response.getHeaders().getCacheControl()).isEqualTo("no-store");
        assertThat(response.getBody().kichHoat()).isEqualTo("activation-secret");
    }
}
