package com.prj1.ccm.report;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.suachua.BenChiuChiPhi;
import com.prj1.ccm.suachua.QuyTacTrangThaiYeuCau;
import com.prj1.ccm.suachua.TrangThaiYeuCau;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** FR-RPT-02/FR-RPT-08 builds the CHU-only maintenance-cost report from one repeatable-read snapshot. */
@Service
public class ChiPhiBaoTriBaoCaoService {
    private static final QuyTacTrangThaiYeuCau QUY_TAC_TRANG_THAI = new QuyTacTrangThaiYeuCau();

    private final ChiPhiBaoTriBaoCaoRepository repository;
    private final PhanQuyenToaService phanQuyenToaService;
    private final Clock clock;

    public ChiPhiBaoTriBaoCaoService(
            ChiPhiBaoTriBaoCaoRepository repository,
            PhanQuyenToaService phanQuyenToaService,
            Clock clock
    ) {
        this.repository = repository;
        this.phanQuyenToaService = phanQuyenToaService;
        this.clock = clock;
    }

    /** FR-RPT-02/FR-RPT-08 returns one permission-filtered repair-cost snapshot with null missing costs. */
    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public ThongTinChiPhiBaoTriBaoCao layChiPhi(
            Long toaNhaId,
            Long phongId,
            String tuNgayThamSo,
            String denNgayThamSo,
            NguoiDung nguoiDung
    ) {
        kiemTraQuyen(nguoiDung);
        KhoangNgay khoangNgay = chuanHoaKhoangNgay(tuNgayThamSo, denNgayThamSo);
        kiemTraPhanQuyen(toaNhaId, phongId, nguoiDung);

        List<KhoanChiPhiBaoTriBaoCao> cacKhoan = repository.findChiPhi(
                nguoiDung.id(), toaNhaId, phongId, khoangNgay.tuNgay(), khoangNgay.denNgay()
        );
        Instant tinhLuc = clock.instant();
        List<ThongTinDongChiPhiBaoTriBaoCao> cacDong = cacKhoan.stream()
                .map(khoan -> ThongTinDongChiPhiBaoTriBaoCao.tu(khoan, trangThaiHieuLuc(khoan, tinhLuc)))
                .toList();

        return new ThongTinChiPhiBaoTriBaoCao(
                toaNhaId,
                phongId,
                khoangNgay.tuNgay().toString(),
                khoangNgay.denNgay().toString(),
                OffsetDateTime.ofInstant(tinhLuc, clock.getZone()).toString(),
                dinhDangTienOrNull(tongTheoBen(cacKhoan, BenChiuChiPhi.CHU_NHA)),
                dinhDangTienOrNull(tongTheoBen(cacKhoan, BenChiuChiPhi.NGUOI_THUE)),
                cacKhoan.size(),
                (int) cacKhoan.stream().filter(this::coChiPhi).count(),
                (int) cacKhoan.stream().filter(khoan -> khoan.chiPhi() == null).count(),
                (int) cacKhoan.stream().filter(khoan -> khoan.chiPhi() != null && khoan.benChiuChiPhi() == null).count(),
                cacDong,
                taoNhom(cacKhoan),
                taoBieuDo(cacKhoan)
        );
    }

    private List<ThongTinNhomChiPhiBaoTriBaoCao> taoNhom(List<KhoanChiPhiBaoTriBaoCao> cacKhoan) {
        Map<MaNhom, Nhom> theoNhom = new LinkedHashMap<>();
        for (KhoanChiPhiBaoTriBaoCao khoan : cacKhoan) {
            MaNhom maNhom = new MaNhom(
                    khoan.toaNhaId(), khoan.phongId(), khoan.hangMuc(), YearMonth.from(khoan.ngayTao())
            );
            theoNhom.computeIfAbsent(maNhom, ignore -> new Nhom(khoan)).them(khoan);
        }
        return theoNhom.values().stream().map(Nhom::ketQua).toList();
    }

    private List<ThongTinDiemChiPhiBaoTriBaoCao> taoBieuDo(List<KhoanChiPhiBaoTriBaoCao> cacKhoan) {
        Map<YearMonth, NhomTheoThang> theoThang = new LinkedHashMap<>();
        for (KhoanChiPhiBaoTriBaoCao khoan : cacKhoan) {
            theoThang.computeIfAbsent(YearMonth.from(khoan.ngayTao()), ignore -> new NhomTheoThang(khoan.ngayTao())).them(khoan);
        }
        return theoThang.values().stream().map(NhomTheoThang::ketQua).toList();
    }

    private TrangThaiYeuCau trangThaiHieuLuc(KhoanChiPhiBaoTriBaoCao khoan, Instant tinhLuc) {
        return QUY_TAC_TRANG_THAI.trangThaiHieuLuc(khoan.trangThai(), khoan.choXacNhanLuc(), tinhLuc);
    }

    private BigDecimal tongTheoBen(List<KhoanChiPhiBaoTriBaoCao> cacKhoan, BenChiuChiPhi benChiuChiPhi) {
        return cacKhoan.stream()
                .filter(this::coChiPhi)
                .filter(khoan -> khoan.benChiuChiPhi() == benChiuChiPhi)
                .map(KhoanChiPhiBaoTriBaoCao::chiPhi)
                .reduce(BigDecimal::add)
                .orElse(null);
    }

    private boolean coChiPhi(KhoanChiPhiBaoTriBaoCao khoan) {
        return khoan.chiPhi() != null && khoan.benChiuChiPhi() != null;
    }

    private void kiemTraPhanQuyen(Long toaNhaId, Long phongId, NguoiDung nguoiDung) {
        Long toaNhaCuaPhong = phongId == null
                ? null
                : repository.findToaNhaIdByPhongId(phongId)
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
        if (toaNhaId != null && toaNhaCuaPhong != null && !toaNhaId.equals(toaNhaCuaPhong)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private KhoangNgay chuanHoaKhoangNgay(String tuNgayThamSo, String denNgayThamSo) {
        LocalDate tuNgay = docNgay(tuNgayThamSo);
        LocalDate denNgay = docNgay(denNgayThamSo);
        if (tuNgay.isAfter(denNgay)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "khoảng ngày không hợp lệ");
        }
        return new KhoangNgay(tuNgay, denNgay);
    }

    private LocalDate docNgay(String thamSo) {
        if (thamSo == null || thamSo.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "khoảng ngày không hợp lệ");
        }
        try {
            return LocalDate.parse(thamSo);
        } catch (DateTimeParseException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "khoảng ngày không hợp lệ", exception);
        }
    }

    private void kiemTraQuyen(NguoiDung nguoiDung) {
        if (nguoiDung == null || nguoiDung.vaiTro() != VaiTro.CHU) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private record KhoangNgay(LocalDate tuNgay, LocalDate denNgay) {
    }

    private record MaNhom(Long toaNhaId, Long phongId, String hangMuc, YearMonth thang) {
    }

    private static final class Nhom {
        private final KhoanChiPhiBaoTriBaoCao dauTien;
        private BigDecimal chiPhiChuNha;
        private BigDecimal chiPhiNguoiThue;
        private int soDong;
        private int soDongCoChiPhi;
        private int soDongThieuChiPhi;
        private int soDongThieuBenChiuChiPhi;
        private final List<Long> yeuCauIds = new ArrayList<>();

        private Nhom(KhoanChiPhiBaoTriBaoCao dauTien) {
            this.dauTien = dauTien;
        }

        private void them(KhoanChiPhiBaoTriBaoCao khoan) {
            soDong++;
            yeuCauIds.add(khoan.yeuCauId());
            if (khoan.chiPhi() == null) {
                soDongThieuChiPhi++;
                return;
            }
            if (khoan.benChiuChiPhi() == null) {
                soDongThieuBenChiuChiPhi++;
                return;
            }
            soDongCoChiPhi++;
            if (khoan.benChiuChiPhi() == BenChiuChiPhi.CHU_NHA) {
                chiPhiChuNha = cong(chiPhiChuNha, khoan.chiPhi());
            } else {
                chiPhiNguoiThue = cong(chiPhiNguoiThue, khoan.chiPhi());
            }
        }

        private ThongTinNhomChiPhiBaoTriBaoCao ketQua() {
            return new ThongTinNhomChiPhiBaoTriBaoCao(
                    dauTien.toaNhaId(),
                    dauTien.maToa(),
                    dauTien.tenToaNha(),
                    dauTien.phongId(),
                    dauTien.soPhong(),
                    dauTien.hangMuc(),
                    dauTien.ngayTao().getYear() + "-%02d".formatted(dauTien.ngayTao().getMonthValue()),
                    "%02d/%d".formatted(dauTien.ngayTao().getMonthValue(), dauTien.ngayTao().getYear()),
                    dinhDangTienOrNull(chiPhiChuNha),
                    dinhDangTienOrNull(chiPhiNguoiThue),
                    soDong,
                    soDongCoChiPhi,
                    soDongThieuChiPhi,
                    soDongThieuBenChiuChiPhi,
                    yeuCauIds
            );
        }
    }

    private static final class NhomTheoThang {
        private final LocalDate ngayDauTien;
        private BigDecimal chiPhiChuNha;
        private BigDecimal chiPhiNguoiThue;
        private int soDong;
        private int soDongCoChiPhi;
        private int soDongThieuChiPhi;
        private int soDongThieuBenChiuChiPhi;

        private NhomTheoThang(LocalDate ngayDauTien) {
            this.ngayDauTien = ngayDauTien;
        }

        private void them(KhoanChiPhiBaoTriBaoCao khoan) {
            soDong++;
            if (khoan.chiPhi() == null) {
                soDongThieuChiPhi++;
                return;
            }
            if (khoan.benChiuChiPhi() == null) {
                soDongThieuBenChiuChiPhi++;
                return;
            }
            soDongCoChiPhi++;
            if (khoan.benChiuChiPhi() == BenChiuChiPhi.CHU_NHA) {
                chiPhiChuNha = cong(chiPhiChuNha, khoan.chiPhi());
            } else {
                chiPhiNguoiThue = cong(chiPhiNguoiThue, khoan.chiPhi());
            }
        }

        private ThongTinDiemChiPhiBaoTriBaoCao ketQua() {
            return new ThongTinDiemChiPhiBaoTriBaoCao(
                    ngayDauTien.getYear() + "-%02d".formatted(ngayDauTien.getMonthValue()),
                    "%02d/%d".formatted(ngayDauTien.getMonthValue(), ngayDauTien.getYear()),
                    dinhDangTienOrNull(chiPhiChuNha),
                    dinhDangTienOrNull(chiPhiNguoiThue),
                    soDong,
                    soDongCoChiPhi,
                    soDongThieuChiPhi,
                    soDongThieuBenChiuChiPhi
            );
        }
    }

    private static BigDecimal cong(BigDecimal hienTai, BigDecimal giaTri) {
        return hienTai == null ? giaTri : hienTai.add(giaTri);
    }

    private static String dinhDangTienOrNull(BigDecimal giaTri) {
        return giaTri == null ? null : ThongTinDongChiPhiBaoTriBaoCao.dinhDangTien(giaTri);
    }
}
