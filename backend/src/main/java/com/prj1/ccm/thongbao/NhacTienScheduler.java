package com.prj1.ccm.thongbao;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

/** Retries every hour; the persisted milestone key makes repeated processing safe. */
@Configuration(proxyBeanMethods = false)
@EnableScheduling
@ConditionalOnProperty(prefix = "app.nhac-tien", name = "enabled", havingValue = "true", matchIfMissing = true)
public class NhacTienScheduler {
    private final NhacTienService service;
    public NhacTienScheduler(NhacTienService service) { this.service = service; }

    @Scheduled(cron = "${app.nhac-tien.cron:0 0 * * * *}", zone = "Asia/Ho_Chi_Minh")
    public void xuLy() { service.xuLy(); }
}
