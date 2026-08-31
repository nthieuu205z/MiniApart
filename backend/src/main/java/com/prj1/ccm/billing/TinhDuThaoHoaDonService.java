package com.prj1.ccm.billing;

import com.prj1.ccm.billing.calc.KetQuaTinhHoaDon;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TinhDuThaoHoaDonService {
    private final PhanQuyenToaService phanQuyenToaService;
    private final TinhHoaDonRepository tinhHoaDonRepository;
    private final TinhHoaDonService tinhHoaDonService;

    public TinhDuThaoHoaDonService(
            PhanQuyenToaService phanQuyenToaService,
            TinhHoaDonRepository tinhHoaDonRepository,
            TinhHoaDonService tinhHoaDonService
    ) {
        this.phanQuyenToaService = phanQuyenToaService;
        this.tinhHoaDonRepository = tinhHoaDonRepository;
        this.tinhHoaDonService = tinhHoaDonService;
    }

    @Transactional(readOnly = true)
    public ThongTinTinhHoaDon tinhThuHoaDon(Long toaNhaId, Long kyId, Long hopDongId, NguoiDung nguoiDung) {
        phanQuyenToaService.layToaNhaNeuNguoiDungDuocXem(nguoiDung, toaNhaId);
        DuLieuTinhHoaDon duLieu = tinhHoaDonRepository.layDuLieuTinhHoaDon(toaNhaId, kyId, hopDongId);
        if (!duLieu.coTheTinh()) {
            return ThongTinTinhHoaDon.khongTheTinh(kyId, hopDongId, duLieu.lyDoKhongTheTinh());
        }
        KetQuaTinhHoaDon ketQua = tinhHoaDonService.tinh(toaNhaId, duLieu.boiCanh());
        return ThongTinTinhHoaDon.tu(kyId, hopDongId, ketQua);
    }
}
