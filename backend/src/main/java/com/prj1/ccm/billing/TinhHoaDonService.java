package com.prj1.ccm.billing;

import com.prj1.ccm.billing.calc.BoiCanhTinh;
import com.prj1.ccm.billing.calc.HoaDonDaChot;
import com.prj1.ccm.billing.calc.KetQuaTinhHoaDon;
import com.prj1.ccm.billing.calc.MayTinhHoaDon;
import com.prj1.ccm.toanha.NhanKhauTinhHoaDonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class TinhHoaDonService {
    private final NhanKhauTinhHoaDonService nhanKhauTinhHoaDonService;
    private final MayTinhHoaDon mayTinhHoaDon = new MayTinhHoaDon();

    @Autowired
    public TinhHoaDonService(NhanKhauTinhHoaDonService nhanKhauTinhHoaDonService) {
        this.nhanKhauTinhHoaDonService = nhanKhauTinhHoaDonService;
    }

    public KetQuaTinhHoaDon tinh(Long toaNhaId, BoiCanhTinh boiCanh) {
        Integer soNguoiOTrongKy = nhanKhauTinhHoaDonService.soNguoiOTrongKyDeTinhHoaDon(
                toaNhaId,
                boiCanh.ky().id(),
                boiCanh.hopDong().phongId()
        );
        return mayTinhHoaDon.tinh(new BoiCanhTinh(
                boiCanh.ky(),
                boiCanh.hopDong(),
                boiCanh.soNgayOThucTe(),
                soNguoiOTrongKy,
                boiCanh.cacChiSo(),
                boiCanh.cacBangGia(),
                boiCanh.cacSoLuongDichVu(),
                boiCanh.khoanChoTinh(),
                boiCanh.soDuKhaDung()
        ));
    }

    public KetQuaTinhHoaDon inLai(HoaDonDaChot hoaDonDaChot) {
        return mayTinhHoaDon.inLai(hoaDonDaChot);
    }
}
