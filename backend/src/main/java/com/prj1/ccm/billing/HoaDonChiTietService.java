package com.prj1.ccm.billing;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.nguoithue.AnhDinhKemService;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;

@Service
public class HoaDonChiTietService {
    private final PhanQuyenToaService phanQuyenToaService;
    private final HoaDonChiTietRepository hoaDonChiTietRepository;
    private final TinhHoaDonRepository tinhHoaDonRepository;
    private final AnhDinhKemService anhDinhKemService;

    public HoaDonChiTietService(
            PhanQuyenToaService phanQuyenToaService,
            HoaDonChiTietRepository hoaDonChiTietRepository,
            TinhHoaDonRepository tinhHoaDonRepository,
            AnhDinhKemService anhDinhKemService
    ) {
        this.phanQuyenToaService = phanQuyenToaService;
        this.hoaDonChiTietRepository = hoaDonChiTietRepository;
        this.tinhHoaDonRepository = tinhHoaDonRepository;
        this.anhDinhKemService = anhDinhKemService;
    }

    /** FR-INV-02 loads every hand-recomputable invoice line, tier snapshot, resident context, and signed meter-photo link. */
    @Transactional(readOnly = true)
    public ThongTinHoaDonChiTiet chiTiet(Long toaNhaId, Long kyId, Long hoaDonId, NguoiDung nguoiDung) {
        if (nguoiDung == null || !coQuyenXemHoaDon(nguoiDung)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        if (laNhanVien(nguoiDung)) {
            phanQuyenToaService.layToaNhaNeuNguoiDungDuocXem(nguoiDung, toaNhaId);
        }
        HoaDonDuLieu hoaDon = hoaDonChiTietRepository.find(toaNhaId, kyId, hoaDonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (nguoiDung.vaiTro() == VaiTro.NGUOI_THUE
                && !Objects.equals(nguoiDung.nguoiThueId(), hoaDon.nguoiThueId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        TinhHoaDonRepository.HoaDonTrongPhamVi hoaDonTrongPhamVi = tinhHoaDonRepository
                .timHoaDonTrongPhamVi(toaNhaId, kyId, hoaDonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        List<ThongTinDongHoaDon> cacDong = hoaDon.cacDong().stream()
                .map(dong -> {
                    String lienKet = dong.anhCongToId() == null
                            ? null
                            : anhDinhKemService.taoLienKet(dong.anhCongToId(), nguoiDung).url();
                    return new ThongTinDongHoaDon(
                            dong.tenKhoan(),
                            toPlain(dong.chiSoDau()),
                            toPlain(dong.chiSoCuoi()),
                            toPlain(dong.soLuong()),
                            toPlain(dong.donGia()),
                            toPlain(dong.thanhTien()),
                            dong.loaiKhoan(),
                            dong.dichVuId(),
                            dong.dienGiai() == null ? ThongTinDongHoaDon.dienGiai(dong) : dong.dienGiai(),
                            dong.anhCongToId(),
                            lienKet,
                            dong.cacBac().stream().map(ThongTinBacHoaDon::tu).toList(),
                            dong.lyDo()
                    );
                })
                .toList();
        return ThongTinHoaDonChiTiet.tu(hoaDon, hoaDonTrongPhamVi.trangThai(), cacDong);
    }

    private boolean coQuyenXemHoaDon(NguoiDung nguoiDung) {
        return laNhanVien(nguoiDung) || nguoiDung.vaiTro() == VaiTro.NGUOI_THUE;
    }

    private boolean laNhanVien(NguoiDung nguoiDung) {
        return nguoiDung.vaiTro() == VaiTro.QTHT
                || nguoiDung.vaiTro() == VaiTro.CHU
                || nguoiDung.vaiTro() == VaiTro.QUAN_LY;
    }

    private String toPlain(java.math.BigDecimal value) {
        return value == null ? null : value.toPlainString();
    }
}
