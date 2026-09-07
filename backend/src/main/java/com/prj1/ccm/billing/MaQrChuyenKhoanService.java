package com.prj1.ccm.billing;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Clock;
import java.util.Base64;
import java.util.Map;

@Service
public class MaQrChuyenKhoanService {
    static final long THOI_HAN_LIEN_KET_GIAY = 900L;
    private static final int KICH_THUOC_MA_QR = 300;
    private static final String THONG_BAO_HOA_DON_DA_THANH_TOAN_DU = "Hóa đơn đã thanh toán đủ hoặc thừa, không cần sinh mã QR chuyển khoản.";
    private static final String THONG_BAO_LIEN_KET_KHONG_HOP_LE = "Liên kết mã QR không hợp lệ hoặc đã hết hạn";

    private final PhanQuyenToaService phanQuyenToaService;
    private final MaQrChuyenKhoanRepository maQrChuyenKhoanRepository;
    private final Clock clock;
    private final byte[] khoaKy;

    public MaQrChuyenKhoanService(
            PhanQuyenToaService phanQuyenToaService,
            MaQrChuyenKhoanRepository maQrChuyenKhoanRepository,
            Clock clock,
            @Value("${app.anh.link-secret:${ANH_LINK_SECRET:dev-only-image-link-secret-not-for-production}}") String khoaKy
    ) {
        this.phanQuyenToaService = phanQuyenToaService;
        this.maQrChuyenKhoanRepository = maQrChuyenKhoanRepository;
        this.clock = clock;
        this.khoaKy = khoaKy.getBytes(StandardCharsets.UTF_8);
    }

    public LienKetMaQrChuyenKhoan taoLienKet(Long toaNhaId, Long kyId, Long hoaDonId, NguoiDung nguoiDung) {
        kiemTraQuyen(nguoiDung, toaNhaId);
        MaQrChuyenKhoanRepository.DuLieuMaQrChuyenKhoan hoaDon = layHoaDon(toaNhaId, kyId, hoaDonId);
        kiemTraConLai(hoaDon);

        long hetHan = clock.instant().getEpochSecond() + THOI_HAN_LIEN_KET_GIAY;
        String chuKy = chuKy(toaNhaId, kyId, hoaDonId, hetHan);
        String url = "/api/toa-nha/" + toaNhaId
                + "/ky-thanh-toan/" + kyId
                + "/hoa-don/" + hoaDonId
                + "/ma-qr-chuyen-khoan/xem?hetHan=" + hetHan
                + "&chuKy=" + chuKy;
        return new LienKetMaQrChuyenKhoan(url);
    }

    public byte[] taoAnh(Long toaNhaId, Long kyId, Long hoaDonId, long hetHan, String chuKy) {
        if (clock.instant().getEpochSecond() >= hetHan || !chuKyHopLe(toaNhaId, kyId, hoaDonId, hetHan, chuKy)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, THONG_BAO_LIEN_KET_KHONG_HOP_LE);
        }
        MaQrChuyenKhoanRepository.DuLieuMaQrChuyenKhoan hoaDon = layHoaDon(toaNhaId, kyId, hoaDonId);
        BigDecimal conLai = kiemTraConLai(hoaDon);
        return taoAnh(VietQrPayloadBuilder.tao(
                hoaDon.maNganHang(),
                hoaDon.taiKhoanNganHang(),
                conLai,
                hoaDon.maHoaDon()
        ));
    }

    private MaQrChuyenKhoanRepository.DuLieuMaQrChuyenKhoan layHoaDon(Long toaNhaId, Long kyId, Long hoaDonId) {
        return maQrChuyenKhoanRepository.timHoaDon(toaNhaId, kyId, hoaDonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private BigDecimal kiemTraConLai(MaQrChuyenKhoanRepository.DuLieuMaQrChuyenKhoan hoaDon) {
        BigDecimal conLai = hoaDon.tongTien().subtract(hoaDon.daThu());
        if (conLai.signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_HOA_DON_DA_THANH_TOAN_DU);
        }
        return conLai;
    }

    private void kiemTraQuyen(NguoiDung nguoiDung, Long toaNhaId) {
        if (nguoiDung == null || (nguoiDung.vaiTro() != VaiTro.CHU && nguoiDung.vaiTro() != VaiTro.QUAN_LY)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, toaNhaId);
    }

    private byte[] taoAnh(String payload) {
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            BitMatrix maQr = new QRCodeWriter().encode(
                    payload,
                    BarcodeFormat.QR_CODE,
                    KICH_THUOC_MA_QR,
                    KICH_THUOC_MA_QR,
                    Map.of(EncodeHintType.CHARACTER_SET, StandardCharsets.UTF_8.name())
            );
            MatrixToImageWriter.writeToStream(maQr, "PNG", output);
            return output.toByteArray();
        } catch (WriterException | IOException exception) {
            throw new IllegalStateException("Khong the sinh ma QR chuyen khoan", exception);
        }
    }

    private String chuKy(Long toaNhaId, Long kyId, Long hoaDonId, long hetHan) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(khoaKy, "HmacSHA256"));
            String thongDiep = toaNhaId + ":" + kyId + ":" + hoaDonId + ":" + hetHan;
            return Base64.getUrlEncoder().withoutPadding().encodeToString(
                    mac.doFinal(thongDiep.getBytes(StandardCharsets.UTF_8))
            );
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Cannot sign QR link", exception);
        }
    }

    private boolean chuKyHopLe(Long toaNhaId, Long kyId, Long hoaDonId, long hetHan, String chuKy) {
        if (chuKy == null) {
            return false;
        }
        return MessageDigest.isEqual(
                chuKy(toaNhaId, kyId, hoaDonId, hetHan).getBytes(StandardCharsets.UTF_8),
                chuKy.getBytes(StandardCharsets.UTF_8)
        );
    }
}
