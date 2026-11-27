package com.prj1.ccm.portal;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.thongbao.ThongBaoService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CongThanhToanService {
    private final CongThanhToanRepository repository;
    private final ThongBaoService thongBaoService;

    CongThanhToanService(CongThanhToanRepository repository, ThongBaoService thongBaoService) {
        this.repository = repository;
        this.thongBaoService = thongBaoService;
    }

    @Transactional(readOnly = true)
    public ThongTinThanhToanCong thongTin(NguoiDung nguoiDung) {
        kiemTraNguoiThue(nguoiDung);
        return repository.findTheoNguoiThue(nguoiDung.nguoiThueId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chưa có hợp đồng đang hiệu lực"));
    }

    /** Idempotent: lần đầu tạo thông báo cho QL toà, các lần sau chỉ trả lại mốc đã báo. */
    @Transactional
    public ThongTinBaoDaChuyen baoDaChuyen(Long hoaDonId, NguoiDung nguoiDung) {
        kiemTraNguoiThue(nguoiDung);
        var hoaDon = repository.findHoaDon(hoaDonId, nguoiDung.nguoiThueId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        boolean moi = repository.themBao(hoaDonId, nguoiDung.nguoiThueId());
        if (moi && !hoaDon.conNo()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Hoá đơn đã thanh toán đủ");
        }
        if (moi) {
            thongBaoService.taoKhiNguoiThueBaoDaChuyen(hoaDonId, hoaDon.toaNhaId(),
                    "Phòng %s báo đã chuyển khoản cho hoá đơn %s. Kiểm tra ngân hàng rồi ghi thu.".formatted(hoaDon.soPhong(), hoaDon.maHoaDon()));
        }
        return new ThongTinBaoDaChuyen(hoaDonId, repository.baoLuc(hoaDonId), !moi);
    }

    private void kiemTraNguoiThue(NguoiDung nguoiDung) {
        if (nguoiDung == null || nguoiDung.vaiTro() != VaiTro.NGUOI_THUE || nguoiDung.nguoiThueId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }
}
