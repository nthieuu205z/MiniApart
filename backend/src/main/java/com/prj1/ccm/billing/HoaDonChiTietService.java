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
import java.util.Optional;

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
        return chiTiet(toaNhaId, kyId, hoaDonId, nguoiDung, true);
    }

    /** FR-INV-09 reuses invoice detail without generating signed meter-photo links for persistent PDFs. */
    @Transactional(readOnly = true)
    public ThongTinHoaDonChiTiet chiTietKhongAnhKy(Long toaNhaId, Long kyId, Long hoaDonId, NguoiDung nguoiDung) {
        return chiTiet(toaNhaId, kyId, hoaDonId, nguoiDung, false);
    }

    /** FR-POR-01 finds the latest issued invoice owned by the authenticated tenant, or an empty result. */
    @Transactional(readOnly = true)
    public Optional<ThongTinHoaDonChiTiet> hoaDonMoiNhatCuaNguoiThue(NguoiDung nguoiDung) {
        kiemTraNguoiThue(nguoiDung);
        return hoaDonChiTietRepository.findHoaDonMoiNhatCuaNguoiThue(nguoiDung.nguoiThueId())
                .map(phamVi -> chiTiet(phamVi.toaNhaId(), phamVi.kyId(), phamVi.hoaDonId(), nguoiDung));
    }

    /** FR-POR-04 resolves a guessable invoice identifier only after binding it to the tenant in the token. */
    @Transactional(readOnly = true)
    public ThongTinHoaDonChiTiet chiTietCuaNguoiThue(Long hoaDonId, NguoiDung nguoiDung) {
        kiemTraNguoiThue(nguoiDung);
        HoaDonPhamVi phamVi = hoaDonChiTietRepository.findPhamViByHoaDonId(hoaDonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return chiTiet(phamVi.toaNhaId(), phamVi.kyId(), phamVi.hoaDonId(), nguoiDung);
    }

    private ThongTinHoaDonChiTiet chiTiet(
            Long toaNhaId, Long kyId, Long hoaDonId, NguoiDung nguoiDung, boolean kemLienKetAnhKy
    ) {
        if (nguoiDung == null || !coQuyenXemHoaDon(nguoiDung)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        if (laNhanVien(nguoiDung)) {
            phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, toaNhaId);
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
                    String lienKet = !kemLienKetAnhKy || dong.anhCongToId() == null
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

    private void kiemTraNguoiThue(NguoiDung nguoiDung) {
        if (nguoiDung == null || nguoiDung.vaiTro() != VaiTro.NGUOI_THUE || nguoiDung.nguoiThueId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private boolean laNhanVien(NguoiDung nguoiDung) {
        return nguoiDung.vaiTro() == VaiTro.CHU
                || nguoiDung.vaiTro() == VaiTro.QUAN_LY;
    }

    private String toPlain(java.math.BigDecimal value) {
        return value == null ? null : value.toPlainString();
    }
}
