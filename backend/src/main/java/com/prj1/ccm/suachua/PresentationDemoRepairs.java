package com.prj1.ccm.suachua;

import com.prj1.ccm.nguoidung.NguoiDung;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import java.util.List;

/** Adapter in this package because the existing create command is package-private. */
@Component
@Profile("presentation-demo")
public class PresentationDemoRepairs {
    private final YeuCauSuaChuaService service;
    public PresentationDemoRepairs(YeuCauSuaChuaService service) { this.service = service; }

    public void create(Long room, int scenario, NguoiDung manager, NguoiDung worker, boolean urgent) {
        String[] items = {"Điều hòa", "Cấp thoát nước", "Khóa cửa", "Chiếu sáng", "Bình nóng lạnh"};
        String[] notes = {"Điều hòa làm lạnh chậm, cần vệ sinh dàn lạnh.",
                "Vòi lavabo rỉ nước, cần kiểm tra gioăng và đường cấp.",
                "Khóa cửa khó xoay, đề nghị kiểm tra trước khi thay lõi.",
                "Đèn khu bếp nhấp nháy, cần kiểm tra nguồn và bóng đèn.",
                "Bình nóng lạnh ngắt bất thường, cần kiểm tra an toàn điện."};
        var request = service.tao(new YeuCauTaoSuaChua(room, items[scenario % 5],
                notes[scenario % 5] + " Dữ liệu tình huống mô phỏng.", urgent ? MucDo.KHAN_CAP : MucDo.THUONG), List.of(), manager);
        if (scenario % 5 == 0) return;
        service.tiepNhan(request.id(), manager);
        if (scenario % 5 == 1) return;
        service.phanCong(request.id(), worker.id(), manager);
        if (scenario % 5 == 2) return;
        service.batDauXuLy(request.id(), worker);
        if (scenario % 5 == 3 || urgent) return;
        service.ghiChiPhi(request.id(), new YeuCauChiPhiSuaChua("250000.00", BenChiuChiPhi.CHU_NHA), manager);
        service.baoDaSuaXong(request.id(), worker);
        service.xacNhanDong(request.id(), manager);
    }
}
