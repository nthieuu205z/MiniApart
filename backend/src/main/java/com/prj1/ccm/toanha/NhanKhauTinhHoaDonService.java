package com.prj1.ccm.toanha;

import com.prj1.ccm.hopdong.NguoiOCungRepository;
import org.springframework.stereotype.Service;

@Service
public class NhanKhauTinhHoaDonService {
    private final KyThanhToanRepository kyThanhToanRepository;
    private final NhanKhauKyRepository nhanKhauKyRepository;
    private final NguoiOCungRepository nguoiOCungRepository;

    public NhanKhauTinhHoaDonService(
            KyThanhToanRepository kyThanhToanRepository,
            NhanKhauKyRepository nhanKhauKyRepository,
            NguoiOCungRepository nguoiOCungRepository
    ) {
        this.kyThanhToanRepository = kyThanhToanRepository;
        this.nhanKhauKyRepository = nhanKhauKyRepository;
        this.nguoiOCungRepository = nguoiOCungRepository;
    }

    public Integer soNguoiOTrongKyDeTinhHoaDon(Long toaNhaId, Long kyId, Long phongId) {
        KyThanhToan kyThanhToan = kyThanhToanRepository.findByIdAndToaNhaId(kyId, toaNhaId)
                .orElseThrow(() -> new IllegalArgumentException("Ky thanh toan khong ton tai"));
        if (kyThanhToan.trangThai() == TrangThaiKy.DA_CHOT) {
            return nhanKhauKyRepository.findSoNguoiByKyIdAndPhongId(kyId, phongId).orElse(null);
        }
        return nguoiOCungRepository.findSoNguoiOChotKy(
                        toaNhaId,
                        kyThanhToan.ngayBatDau(),
                        kyThanhToan.ngayKetThuc()
                )
                .stream()
                .filter(nhanKhau -> nhanKhau.phongId().equals(phongId))
                .findFirst()
                .map(NguoiOCungRepository.SoNguoiOTrongKy::soNguoi)
                .orElse(null);
    }
}
