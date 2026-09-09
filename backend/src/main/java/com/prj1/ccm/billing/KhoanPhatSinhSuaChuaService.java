package com.prj1.ccm.billing;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

/** Coordinates repair-cost extras without exposing the generic extra-creation endpoint as a bypass. */
@Service
public class KhoanPhatSinhSuaChuaService {
    private static final String THONG_BAO_DA_TINH =
            "Chi phí sửa chữa đã nằm trong hoá đơn, không thể sửa hoặc huỷ yêu cầu";
    private static final String THONG_BAO_THIEU_HOP_DONG =
            "Yêu cầu sửa chữa không có hợp đồng thuê để ghi chi phí cho người thuê";
    private static final String THONG_BAO_NGUON_KHONG_HOP_LE =
            "Nguồn khoản phát sinh sửa chữa không hợp lệ";

    private final KhoanPhatSinhRepository khoanPhatSinhRepository;

    public KhoanPhatSinhSuaChuaService(KhoanPhatSinhRepository khoanPhatSinhRepository) {
        this.khoanPhatSinhRepository = khoanPhatSinhRepository;
    }

    @Transactional
    public void ghiChiPhi(Long hopDongId, Long yeuCauId, BigDecimal soTien) {
        List<KhoanPhatSinhRepository.KhoanPhatSinhCuaNguon> cacKhoan = khoaCacKhoan(yeuCauId);
        kiemTraChuaTinh(cacKhoan);
        if (hopDongId != null && cacKhoan.stream().anyMatch(khoan -> !hopDongId.equals(khoan.hopDongId()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_NGUON_KHONG_HOP_LE);
        }
        if (soTien == null || soTien.signum() == 0) {
            voHieuKhoanChoTinh(cacKhoan);
            return;
        }
        if (hopDongId == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_THIEU_HOP_DONG);
        }

        KhoanPhatSinhRepository.KhoanPhatSinhCuaNguon dangChoTinh = cacKhoan.stream()
                .filter(khoan -> khoan.trangThai() == TrangThaiKhoanPhatSinh.CHO_TINH)
                .findFirst()
                .orElse(null);
        if (dangChoTinh != null) {
            if (!hopDongId.equals(dangChoTinh.hopDongId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_NGUON_KHONG_HOP_LE);
            }
            if (khoanPhatSinhRepository.capNhatChoTinh(dangChoTinh.id(), soTien) != 1) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_DA_TINH);
            }
            return;
        }

        khoanPhatSinhRepository.tao(new KhoanPhatSinhRepository.KhoanPhatSinhMoi(
                hopDongId,
                NguonKhoanPhatSinh.SUA_CHUA,
                yeuCauId,
                "Chi phí sửa chữa yêu cầu #" + yeuCauId,
                soTien,
                LoaiKhoanPhatSinh.PHAT_SINH
        ));
    }

    @Transactional
    public void voHieu(Long yeuCauId) {
        List<KhoanPhatSinhRepository.KhoanPhatSinhCuaNguon> cacKhoan = khoaCacKhoan(yeuCauId);
        kiemTraChuaTinh(cacKhoan);
        voHieuKhoanChoTinh(cacKhoan);
    }

    private List<KhoanPhatSinhRepository.KhoanPhatSinhCuaNguon> khoaCacKhoan(Long yeuCauId) {
        return khoanPhatSinhRepository.timTheoNguonKhoa(NguonKhoanPhatSinh.SUA_CHUA, yeuCauId);
    }

    private void kiemTraChuaTinh(List<KhoanPhatSinhRepository.KhoanPhatSinhCuaNguon> cacKhoan) {
        if (cacKhoan.stream().anyMatch(khoan -> khoan.trangThai() == TrangThaiKhoanPhatSinh.DA_TINH)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_DA_TINH);
        }
    }

    private void voHieuKhoanChoTinh(List<KhoanPhatSinhRepository.KhoanPhatSinhCuaNguon> cacKhoan) {
        for (KhoanPhatSinhRepository.KhoanPhatSinhCuaNguon khoan : cacKhoan) {
            if (khoan.trangThai() != TrangThaiKhoanPhatSinh.CHO_TINH) {
                continue;
            }
            if (khoanPhatSinhRepository.voHieu(khoan.id()) != 1) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_DA_TINH);
            }
        }
    }
}
