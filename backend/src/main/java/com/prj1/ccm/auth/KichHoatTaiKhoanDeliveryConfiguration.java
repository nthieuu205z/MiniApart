package com.prj1.ccm.auth;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

@Configuration(proxyBeanMethods = false)
public class KichHoatTaiKhoanDeliveryConfiguration {

    @Bean
    @ConditionalOnProperty(prefix = "app.activation.delivery.http", name = "url")
    KichHoatTaiKhoanDelivery kichHoatTaiKhoanHttpDelivery(
            ObjectMapper objectMapper,
            org.springframework.core.env.Environment environment
    ) {
        return new HttpKichHoatTaiKhoanDelivery(
                URI.create(environment.getRequiredProperty("app.activation.delivery.http.url")),
                environment.getProperty("app.activation.delivery.http.bearer-token"),
                objectMapper,
                HttpClient.newHttpClient()
        );
    }

    @Bean
    @ConditionalOnMissingBean(KichHoatTaiKhoanDelivery.class)
    KichHoatTaiKhoanDelivery kichHoatTaiKhoanDeliveryChuaSanSang() {
        return (soDienThoai, maKichHoat) -> {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Kênh kích hoạt tài khoản chưa được cấu hình"
            );
        };
    }

    private static final class HttpKichHoatTaiKhoanDelivery implements KichHoatTaiKhoanDelivery {
        private static final Duration THOI_GIAN_CHO_PHAN_HOI = Duration.ofSeconds(10);

        private final URI endpoint;
        private final String bearerToken;
        private final ObjectMapper objectMapper;
        private final HttpClient httpClient;

        private HttpKichHoatTaiKhoanDelivery(
                URI endpoint,
                String bearerToken,
                ObjectMapper objectMapper,
                HttpClient httpClient
        ) {
            this.endpoint = endpoint;
            this.bearerToken = bearerToken;
            this.objectMapper = objectMapper;
            this.httpClient = httpClient;
        }

        @Override
        public void guiMaKichHoat(String soDienThoai, String maKichHoat) {
            try {
                HttpRequest.Builder request = HttpRequest.newBuilder(endpoint)
                        .timeout(THOI_GIAN_CHO_PHAN_HOI)
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(
                                objectMapper.writeValueAsString(Map.of(
                                        "soDienThoai", soDienThoai,
                                        "maKichHoat", maKichHoat
                                ))
                        ));
                if (bearerToken != null && !bearerToken.isBlank()) {
                    request.header("Authorization", "Bearer " + bearerToken);
                }

                HttpResponse<Void> response = httpClient.send(request.build(), HttpResponse.BodyHandlers.discarding());
                if (response.statusCode() < 200 || response.statusCode() >= 300) {
                    throw khongTheGuiMaKichHoat();
                }
            } catch (IOException exception) {
                throw khongTheGuiMaKichHoat();
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                throw khongTheGuiMaKichHoat();
            }
        }

        private ResponseStatusException khongTheGuiMaKichHoat() {
            return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Không thể gửi mã kích hoạt");
        }
    }
}
