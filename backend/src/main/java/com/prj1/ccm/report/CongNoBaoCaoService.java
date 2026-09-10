package com.prj1.ccm.report;

import com.prj1.ccm.billing.HoaDonChiTietService;
import com.prj1.ccm.billing.ThongTinHoaDonChiTiet;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/** FR-RPT-02/FR-RPT-03 serves the owner-only debt snapshot and invoice drill-down. */
@Service
public class CongNoBaoCaoService {
    private final CongNoBaoCaoRepository repository;
    private final PhanQuyenToaService phanQuyenToaService;
    private final HoaDonChiTietService hoaDonChiTietService;
    private final Clock clock;

    public CongNoBaoCaoService(
            CongNoBaoCaoRepository repository,
            PhanQuyenToaService phanQuyenToaService,
            HoaDonChiTietService hoaDonChiTietService,
            Clock clock
    ) {
        this.repository = repository;
        this.phanQuyenToaService = phanQuyenToaService;
        this.hoaDonChiTietService = hoaDonChiTietService;
        this.clock = clock;
    }

    /** FR-RPT-02/FR-RPT-03 returns the current ledger-backed debt list for assigned buildings. */
    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public ThongTinCongNoBaoCao layCongNo(Long toaNhaId, NguoiDung nguoiDung) {
        kiemTraQuyen(nguoiDung);
        if (toaNhaId != null) {
            phanQuyenToaService.layToaNhaNeuNguoiDungDuocXem(nguoiDung, toaNhaId);
            if (!repository.xacNhanPhanQuyenToa(nguoiDung.id(), toaNhaId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            }
        }

        List<ThongTinKhoanNoBaoCao> congNo = repository.findCongNo(
                        nguoiDung.id(),
                        toaNhaId,
                        LocalDate.now(clock)
                )
                .stream()
                .map(ThongTinKhoanNoBaoCao::tu)
                .toList();
        return new ThongTinCongNoBaoCao(toaNhaId, OffsetDateTime.now(clock).toString(), congNo);
    }

    /** FR-RPT-03 resolves an owner debt row by invoice id, including settlement invoices without a period. */
    @Transactional(readOnly = true)
    public ThongTinHoaDonChiTiet chiTietHoaDon(Long hoaDonId, NguoiDung nguoiDung) {
        kiemTraQuyen(nguoiDung);
        return hoaDonChiTietService.chiTietCuaChuTheoHoaDonId(hoaDonId, nguoiDung);
    }

    private void kiemTraQuyen(NguoiDung nguoiDung) {
        if (nguoiDung == null || nguoiDung.vaiTro() != VaiTro.CHU) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }
}
