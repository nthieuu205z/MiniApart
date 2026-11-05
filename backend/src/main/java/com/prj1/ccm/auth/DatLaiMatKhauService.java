package com.prj1.ccm.auth;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

@Service
public class DatLaiMatKhauService {
    private final NguoiDungRepository nguoiDungRepository;
    private final DatLaiMatKhauRepository repository;
    private final PasswordHasher hasher;
    private final KichHoatTaiKhoanDelivery delivery;
    private final Clock clock;
    private final SecureRandom random = new SecureRandom();
    public DatLaiMatKhauService(NguoiDungRepository nguoiDungRepository, DatLaiMatKhauRepository repository,
                               PasswordHasher hasher, KichHoatTaiKhoanDelivery delivery, Clock clock) {
        this.nguoiDungRepository = nguoiDungRepository; this.repository = repository;
        this.hasher = hasher; this.delivery = delivery; this.clock = clock;
    }

    /** Always return the same public response; request and verification limits are persisted per account. */
    @Transactional
    public void yeuCau(String soDienThoai) {
        String so = SoDienThoaiKey.tu(soDienThoai);
        if (so.isBlank()) return;
        NguoiDungDangNhap nguoiDung = nguoiDungRepository.findBySoDienThoaiChoDangNhap(so).orElse(null);
        if (nguoiDung == null || !nguoiDung.hoatDong()) return;
        Instant now = clock.instant();
        DatLaiMatKhauRepository.MaDatLai cu = repository.khoa(nguoiDung.id()).orElse(null);
        boolean cuaSoCu = cu != null && cu.cuaSoGuiLuc().plus(Duration.ofMinutes(15)).isAfter(now);
        if (cu != null && (cu.guiLuc().plusSeconds(60).isAfter(now) || cuaSoCu && cu.soLanGui() >= 5)) return;
        String otp = "%06d".formatted(random.nextInt(1_000_000));
        // Send first: failure does not replace an existing valid secret. No secret is logged.
        try { delivery.guiMaDatLaiMatKhau(so, otp); }
        catch (ResponseStatusException exception) { return; }
        repository.luu(nguoiDung.id(), hasher.hash(otp), now.plusSeconds(300), now,
                cuaSoCu ? cu.cuaSoGuiLuc() : now, cuaSoCu ? cu.soLanGui() + 1 : 1);
    }

    @Transactional(noRollbackFor = MaKhongHopLe.class)
    public void xacNhan(String soDienThoai, String maXacThuc, String matKhau) {
        if (matKhau == null || matKhau.length() < 8 || matKhau.length() > 128) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu phải có từ 8 đến 128 ký tự");
        }
        String so = SoDienThoaiKey.tu(soDienThoai);
        if (so.isBlank() || maXacThuc == null || !maXacThuc.matches("[0-9]{6}")) throw new MaKhongHopLe();
        // Use the same tracker -> account lock order as sign-in to avoid a reset/sign-in deadlock.
        nguoiDungRepository.taoTheoDoiDangNhapNeuChuaCo(so);
        nguoiDungRepository.findTheoDoiDangNhapChoDangNhap(so);
        NguoiDungDangNhap nguoiDung = nguoiDungRepository.findBySoDienThoaiChoDangNhap(so).orElseThrow(MaKhongHopLe::new);
        DatLaiMatKhauRepository.MaDatLai ma = repository.khoa(nguoiDung.id()).orElseThrow(MaKhongHopLe::new);
        if (!nguoiDung.hoatDong() || ma.daDung() || ma.soLanThu() >= 5 || !ma.hetHan().isAfter(clock.instant())) throw new MaKhongHopLe();
        if (!hasher.matches(maXacThuc, ma.hash())) {
            repository.ghiSai(nguoiDung.id());
            throw new MaKhongHopLe();
        }
        nguoiDungRepository.capNhatMatKhauSauKichHoat(nguoiDung.id(), hasher.hash(matKhau));
        nguoiDungRepository.datLaiTrangThaiDangNhap(so, nguoiDung.id());
        nguoiDungRepository.xoaMaKichHoat(nguoiDung.id());
        repository.dung(nguoiDung.id());
    }

    static class MaKhongHopLe extends ResponseStatusException {
        MaKhongHopLe() { super(HttpStatus.BAD_REQUEST, "Mã xác thực không hợp lệ, đã hết hạn hoặc đã dùng"); }
    }
}
