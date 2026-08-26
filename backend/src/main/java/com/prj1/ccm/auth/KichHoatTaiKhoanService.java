package com.prj1.ccm.auth;

import com.prj1.ccm.nguoidung.NguoiDung;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;

@Service
public class KichHoatTaiKhoanService {
    private static final Duration THOI_GIAN_HIEU_LUC = Duration.ofMinutes(30);

    private final NguoiDungRepository nguoiDungRepository;
    private final PasswordHasher passwordHasher;
    private final Clock clock;
    private final List<KichHoatTaiKhoanDelivery> deliveries;
    private final SecureRandom secureRandom = new SecureRandom();

    public KichHoatTaiKhoanService(
            NguoiDungRepository nguoiDungRepository,
            PasswordHasher passwordHasher,
            Clock clock,
            List<KichHoatTaiKhoanDelivery> deliveries
    ) {
        this.nguoiDungRepository = nguoiDungRepository;
        this.passwordHasher = passwordHasher;
        this.clock = clock;
        this.deliveries = deliveries;
    }

    public void taoMaKichHoat(NguoiDung nguoiDung) {
        if (deliveries.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Kênh kích hoạt tài khoản chưa sẵn sàng");
        }

        String maKichHoat = maKichHoatNgauNhien();
        nguoiDungRepository.luuMaKichHoat(
                nguoiDung.id(),
                passwordHasher.hash(maKichHoat),
                clock.instant().plus(THOI_GIAN_HIEU_LUC)
        );
        deliveries.forEach(delivery -> delivery.guiMaKichHoat(nguoiDung.soDienThoai(), maKichHoat));
    }

    @Transactional
    public void kichHoat(YeuCauKichHoatTaiKhoan yeuCau) {
        if (yeuCau == null
                || yeuCau.soDienThoai() == null || yeuCau.soDienThoai().isBlank()
                || yeuCau.maKichHoat() == null || yeuCau.maKichHoat().isBlank()
                || yeuCau.matKhau() == null || yeuCau.matKhau().isBlank()) {
            throw khongHopLe();
        }

        NguoiDung nguoiDung = nguoiDungRepository.findBySoDienThoai(SoDienThoaiKey.tu(yeuCau.soDienThoai()))
                .orElseThrow(this::khongHopLe);
        KichHoatTaiKhoan kichHoat = nguoiDungRepository.findKichHoatTaiKhoanChoKichHoat(nguoiDung.id())
                .orElseThrow(this::khongHopLe);
        Instant now = clock.instant();
        if (!kichHoat.hetHan().isAfter(now)
                || !passwordHasher.matches(yeuCau.maKichHoat(), kichHoat.maBiMatHash())) {
            throw khongHopLe();
        }

        nguoiDungRepository.capNhatMatKhauSauKichHoat(nguoiDung.id(), passwordHasher.hash(yeuCau.matKhau()));
        nguoiDungRepository.datLaiTrangThaiDangNhap(nguoiDung.soDienThoai(), nguoiDung.id());
        nguoiDungRepository.xoaMaKichHoat(nguoiDung.id());
    }

    private String maKichHoatNgauNhien() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private ResponseStatusException khongHopLe() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Mã kích hoạt không hợp lệ hoặc đã hết hạn");
    }
}
