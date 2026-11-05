package com.prj1.ccm.report;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** FR-RPT-02/FR-RPT-05 builds the owner-only consumption report from one consistent meter snapshot. */
@Service
public class TieuThuBaoCaoService {
    private final TieuThuBaoCaoRepository repository;
    private final PhanQuyenToaService phanQuyenToaService;
    private final Clock clock;

    public TieuThuBaoCaoService(
            TieuThuBaoCaoRepository repository,
            PhanQuyenToaService phanQuyenToaService,
            Clock clock
    ) {
        this.repository = repository;
        this.phanQuyenToaService = phanQuyenToaService;
        this.clock = clock;
    }

    /** FR-RPT-02/FR-RPT-05 returns permission-filtered rows and chart points with missing data preserved as null. */
    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public ThongTinTieuThuBaoCao layTieuThu(Long toaNhaId, Long phongId, Long kyId, NguoiDung nguoiDung) {
        kiemTraQuyen(nguoiDung);
        kiemTraPhanQuyen(toaNhaId, phongId, kyId, nguoiDung);

        List<KhoanTieuThuBaoCao> cacKhoan = repository.findTieuThu(nguoiDung.id(), toaNhaId, phongId, kyId);
        List<ThongTinDongTieuThuBaoCao> cacDong = cacKhoan.stream()
                .map(ThongTinDongTieuThuBaoCao::tu)
                .toList();
        return new ThongTinTieuThuBaoCao(
                toaNhaId,
                phongId,
                kyId,
                OffsetDateTime.now(clock).toString(),
                cacDong,
                taoBieuDo(cacKhoan)
        );
    }

    private List<ThongTinDiemTieuThuBaoCao> taoBieuDo(List<KhoanTieuThuBaoCao> cacKhoan) {
        Map<MaNhomBieuDo, NhomBieuDo> theoNhom = new LinkedHashMap<>();
        for (KhoanTieuThuBaoCao khoan : cacKhoan) {
            MaNhomBieuDo maNhom = new MaNhomBieuDo(khoan.kyId(), khoan.donVi(), khoan.laDien());
            NhomBieuDo nhom = theoNhom.computeIfAbsent(maNhom, ignore -> new NhomBieuDo(khoan));
            nhom.them(khoan);
        }
        return theoNhom.values().stream().map(NhomBieuDo::ketQua).toList();
    }

    private void kiemTraPhanQuyen(Long toaNhaId, Long phongId, Long kyId, NguoiDung nguoiDung) {
        Long toaNhaCuaPhong = phongId == null
                ? null
                : repository.findToaNhaIdByPhongId(phongId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Long toaNhaCuaKy = kyId == null
                ? null
                : repository.findToaNhaIdByKyId(kyId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (toaNhaId != null) {
            phanQuyenToaService.layToaNhaNeuNguoiDungDuocXem(nguoiDung, toaNhaId);
            if (!repository.xacNhanPhanQuyenToa(nguoiDung.id(), toaNhaId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            }
        }
        if (toaNhaCuaPhong != null) {
            phanQuyenToaService.layToaNhaNeuNguoiDungDuocXem(nguoiDung, toaNhaCuaPhong);
        }
        if (toaNhaCuaKy != null) {
            phanQuyenToaService.layToaNhaNeuNguoiDungDuocXem(nguoiDung, toaNhaCuaKy);
        }
        if (toaNhaId != null && ((toaNhaCuaPhong != null && !toaNhaId.equals(toaNhaCuaPhong))
                || (toaNhaCuaKy != null && !toaNhaId.equals(toaNhaCuaKy)))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        if (toaNhaCuaPhong != null && toaNhaCuaKy != null && !toaNhaCuaPhong.equals(toaNhaCuaKy)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private void kiemTraQuyen(NguoiDung nguoiDung) {
        if (nguoiDung == null || nguoiDung.vaiTro() != VaiTro.CHU) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private record MaNhomBieuDo(Long kyId, String donVi, boolean laDien) {
    }

    private static final class NhomBieuDo {
        private final KhoanTieuThuBaoCao dauTien;
        private BigDecimal tong;
        private int soDong;
        private int soDongCoDuLieu;

        private NhomBieuDo(KhoanTieuThuBaoCao dauTien) {
            this.dauTien = dauTien;
        }

        private void them(KhoanTieuThuBaoCao khoan) {
            soDong++;
            if (!khoan.coDuLieu()) {
                return;
            }
            soDongCoDuLieu++;
            tong = tong == null ? khoan.mucTieuThu() : tong.add(khoan.mucTieuThu());
        }

        private ThongTinDiemTieuThuBaoCao ketQua() {
            return ThongTinDiemTieuThuBaoCao.tu(dauTien, tong, soDong, soDongCoDuLieu);
        }
    }
}
