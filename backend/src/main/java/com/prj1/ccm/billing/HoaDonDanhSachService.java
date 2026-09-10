package com.prj1.ccm.billing;

import com.prj1.ccm.billing.calc.TrangThaiHoaDon;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.thongbao.QuyTacBangViecVanHanh;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

/** FR-NTF-01 serves the server-scoped invoice worklist opened from the operational dashboard. */
@Service
public class HoaDonDanhSachService {
    private static final QuyTacBangViecVanHanh QUY_TAC_BANG_VIEC = new QuyTacBangViecVanHanh();

    private final HoaDonVanHanhRepository hoaDonVanHanhRepository;
    private final PhanQuyenToaService phanQuyenToaService;
    private final Clock clock;

    public HoaDonDanhSachService(
            HoaDonVanHanhRepository hoaDonVanHanhRepository,
            PhanQuyenToaService phanQuyenToaService,
            Clock clock
    ) {
        this.hoaDonVanHanhRepository = hoaDonVanHanhRepository;
        this.phanQuyenToaService = phanQuyenToaService;
        this.clock = clock;
    }

    /**
     * FR-NTF-01 lists invoices in one authorized building and applies NO_QUA_HAN with the dashboard rule.
     *
     * @param toaNhaId the requested building
     * @param trangThai null, NO_QUA_HAN, or a stored invoice status
     * @param nguoiDung the authenticated owner or manager
     * @return the exact-decimal invoice rows inside the server-enforced scope
     */
    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public List<ThongTinHoaDonDanhSach> danhSach(Long toaNhaId, String trangThai, NguoiDung nguoiDung) {
        kiemTraVaiTro(nguoiDung);
        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, toaNhaId);
        if (!hoaDonVanHanhRepository.xacNhanPhanQuyenToa(nguoiDung.id(), toaNhaId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        LocalDate homNay = LocalDate.now(clock);
        TrangThaiHoaDon trangThaiLuu = chuyenTrangThaiLuu(trangThai);
        return hoaDonVanHanhRepository.findTrongPhamVi(nguoiDung.id(), toaNhaId)
                .stream()
                .filter(hoaDon -> locTheoTrangThai(hoaDon, trangThai, trangThaiLuu, homNay))
                .map(ThongTinHoaDonDanhSach::tu)
                .toList();
    }

    private boolean locTheoTrangThai(
            HoaDonVanHanhDuLieu hoaDon,
            String trangThai,
            TrangThaiHoaDon trangThaiLuu,
            LocalDate homNay
    ) {
        if (trangThai == null || trangThai.isBlank()) {
            return true;
        }
        if ("NO_QUA_HAN".equals(trangThai)) {
            return QUY_TAC_BANG_VIEC.hoaDonQuaHanChuaThanhToan(
                    homNay,
                    hoaDon.hanThanhToan(),
                    hoaDon.tongTien(),
                    hoaDon.daThu(),
                    hoaDon.trangThai()
            );
        }
        return hoaDon.trangThai() == trangThaiLuu;
    }

    private TrangThaiHoaDon chuyenTrangThaiLuu(String trangThai) {
        if (trangThai == null || trangThai.isBlank() || "NO_QUA_HAN".equals(trangThai)) {
            return null;
        }
        try {
            return TrangThaiHoaDon.valueOf(trangThai);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái hoá đơn không hợp lệ");
        }
    }

    private void kiemTraVaiTro(NguoiDung nguoiDung) {
        if (nguoiDung == null || (nguoiDung.vaiTro() != VaiTro.CHU && nguoiDung.vaiTro() != VaiTro.QUAN_LY)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }
}
