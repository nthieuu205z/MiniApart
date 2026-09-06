package com.prj1.ccm.billing;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;

@Service
public class MaQrChuyenKhoanService {
    private static final String THONG_BAO_HOA_DON_DA_THANH_TOAN_DU = "Hóa đơn đã thanh toán đủ, không cần sinh mã QR chuyển khoản.";
    private static final int KICH_THUOC_MA_QR = 300;

    private final PhanQuyenToaService phanQuyenToaService;
    private final MaQrChuyenKhoanRepository maQrChuyenKhoanRepository;

    public MaQrChuyenKhoanService(
            PhanQuyenToaService phanQuyenToaService,
            MaQrChuyenKhoanRepository maQrChuyenKhoanRepository
    ) {
        this.phanQuyenToaService = phanQuyenToaService;
        this.maQrChuyenKhoanRepository = maQrChuyenKhoanRepository;
    }

    /** FR-INV-10 generates one current bank-transfer QR image from an invoice's outstanding balance. */
    public byte[] tao(Long toaNhaId, Long kyId, Long hoaDonId, NguoiDung nguoiDung) {
        kiemTraQuyen(nguoiDung, toaNhaId);
        MaQrChuyenKhoanRepository.DuLieuMaQrChuyenKhoan hoaDon = maQrChuyenKhoanRepository
                .timHoaDon(toaNhaId, kyId, hoaDonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        BigDecimal conLai = hoaDon.tongTien().subtract(hoaDon.daThu());
        if (conLai.signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_HOA_DON_DA_THANH_TOAN_DU);
        }
        return maHoaPayload(thongTinChuyenKhoan(hoaDon, conLai));
    }

    private void kiemTraQuyen(NguoiDung nguoiDung, Long toaNhaId) {
        if (nguoiDung == null || (nguoiDung.vaiTro() != VaiTro.CHU && nguoiDung.vaiTro() != VaiTro.QUAN_LY)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, toaNhaId);
    }

    private String thongTinChuyenKhoan(MaQrChuyenKhoanRepository.DuLieuMaQrChuyenKhoan hoaDon, BigDecimal conLai) {
        return "account=" + hoaDon.taiKhoanNganHang()
                + "&amount=" + conLai.toPlainString()
                + "&content=" + hoaDon.maHoaDon();
    }

    private byte[] maHoaPayload(String payload) {
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            BitMatrix maQr = new QRCodeWriter().encode(payload, BarcodeFormat.QR_CODE, KICH_THUOC_MA_QR, KICH_THUOC_MA_QR);
            MatrixToImageWriter.writeToStream(maQr, "PNG", output);
            return output.toByteArray();
        } catch (WriterException | IOException exception) {
            throw new IllegalStateException("Khong the sinh ma QR chuyen khoan", exception);
        }
    }
}
