package com.prj1.ccm.billing;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class KhoanPhatSinhService {
    private static final String THONG_BAO_YEU_CAU_KHONG_HOP_LE = "Yêu cầu khoản phát sinh không hợp lệ.";
    private static final String THONG_BAO_NGUON_KHONG_TON_TAI = "Nguồn khoản phát sinh không tồn tại.";

    private final KhoanPhatSinhRepository khoanPhatSinhRepository;
    private final PhanQuyenToaService phanQuyenToaService;
    private final Map<NguonKhoanPhatSinh, NguonKhoanPhatSinhValidator> validatorTheoNguon;

    public KhoanPhatSinhService(
            KhoanPhatSinhRepository khoanPhatSinhRepository,
            PhanQuyenToaService phanQuyenToaService,
            List<NguonKhoanPhatSinhValidator> validators
    ) {
        this.khoanPhatSinhRepository = khoanPhatSinhRepository;
        this.phanQuyenToaService = phanQuyenToaService;
        Map<NguonKhoanPhatSinh, NguonKhoanPhatSinhValidator> tam = new EnumMap<>(NguonKhoanPhatSinh.class);
        for (NguonKhoanPhatSinhValidator validator : validators) {
            tam.put(validator.nguonLoai(), validator);
        }
        this.validatorTheoNguon = Map.copyOf(tam);
    }

    @Transactional
    public ThongTinKhoanPhatSinh tao(Long hopDongId, YeuCauKhoanPhatSinh yeuCau, NguoiDung nguoiDung) {
        kiemTraVaiTro(nguoiDung);
        KhoanPhatSinhRepository.HopDongTrongPhamVi hopDong = khoanPhatSinhRepository.timHopDongTrongPhamVi(hopDongId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, hopDong.toaNhaId());

        KhoanPhatSinhDaChuanHoa khoan = chuanHoa(hopDong.hopDongId(), yeuCau);
        Long id = khoanPhatSinhRepository.tao(new KhoanPhatSinhRepository.KhoanPhatSinhMoi(
                khoan.hopDongId(),
                khoan.nguonLoai(),
                khoan.nguonId(),
                khoan.tenKhoan(),
                khoan.soTienDaKy(),
                khoan.loai()
        ));
        return new ThongTinKhoanPhatSinh(
                id,
                khoan.hopDongId(),
                khoan.nguonLoai(),
                khoan.nguonId(),
                khoan.tenKhoan(),
                khoan.soTienDaKy(),
                khoan.loai(),
                TrangThaiKhoanPhatSinh.CHO_TINH
        );
    }

    private KhoanPhatSinhDaChuanHoa chuanHoa(Long hopDongId, YeuCauKhoanPhatSinh yeuCau) {
        if (yeuCau == null
                || yeuCau.nguonLoai() == null
                || yeuCau.nguonId() == null
                || yeuCau.nguonId() <= 0
                || yeuCau.tenKhoan() == null
                || yeuCau.tenKhoan().isBlank()
                || yeuCau.soTien() == null
                || yeuCau.soTien().signum() <= 0
                || yeuCau.loai() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE);
        }
        NguonKhoanPhatSinhValidator validator = validatorTheoNguon.get(yeuCau.nguonLoai());
        if (validator == null || !validator.tonTai(yeuCau.nguonId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_NGUON_KHONG_TON_TAI);
        }
        BigDecimal soTienDaKy = yeuCau.loai() == LoaiKhoanPhatSinh.GIAM_TRU
                ? yeuCau.soTien().negate()
                : yeuCau.soTien();
        return new KhoanPhatSinhDaChuanHoa(
                hopDongId,
                yeuCau.nguonLoai(),
                yeuCau.nguonId(),
                yeuCau.tenKhoan().trim(),
                soTienDaKy,
                yeuCau.loai()
        );
    }

    private void kiemTraVaiTro(NguoiDung nguoiDung) {
        if (nguoiDung == null || (nguoiDung.vaiTro() != VaiTro.CHU
                && nguoiDung.vaiTro() != VaiTro.QUAN_LY)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private record KhoanPhatSinhDaChuanHoa(
            Long hopDongId,
            NguonKhoanPhatSinh nguonLoai,
            Long nguonId,
            String tenKhoan,
            BigDecimal soTienDaKy,
            LoaiKhoanPhatSinh loai
    ) {
    }
}
