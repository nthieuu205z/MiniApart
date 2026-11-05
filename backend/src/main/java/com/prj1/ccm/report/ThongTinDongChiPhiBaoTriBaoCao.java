package com.prj1.ccm.report;

import com.prj1.ccm.suachua.BenChiuChiPhi;
import com.prj1.ccm.suachua.TrangThaiYeuCau;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** FR-RPT-02/FR-RPT-08 is the exact-decimal repair row with a source-request drill-down id. */
public record ThongTinDongChiPhiBaoTriBaoCao(
        Long id,
        Long yeuCauId,
        Long toaNhaId,
        String maToa,
        String tenToaNha,
        Long phongId,
        String soPhong,
        String hangMuc,
        String thang,
        String nhanThang,
        TrangThaiYeuCau trangThai,
        String tenTrangThai,
        String chiPhi,
        BenChiuChiPhi benChiuChiPhi,
        boolean coChiPhi,
        String trangThaiChiPhi,
        String tenTrangThaiChiPhi,
        String taoLuc,
        String lienKet
) {
    private static final String DA_GHI_NHAN = "DA_GHI_NHAN";
    private static final String CHUA_GHI_NHAN = "CHUA_GHI_NHAN";
    private static final String THIEU_BEN_CHIU_CHI_PHI = "THIEU_BEN_CHIU_CHI_PHI";

    static ThongTinDongChiPhiBaoTriBaoCao tu(
            KhoanChiPhiBaoTriBaoCao khoan,
            TrangThaiYeuCau trangThaiHieuLuc
    ) {
        boolean coChiPhi = khoan.chiPhi() != null && khoan.benChiuChiPhi() != null;
        String trangThaiChiPhi = trangThaiChiPhi(khoan);
        return new ThongTinDongChiPhiBaoTriBaoCao(
                khoan.yeuCauId(),
                khoan.yeuCauId(),
                khoan.toaNhaId(),
                khoan.maToa(),
                khoan.tenToaNha(),
                khoan.phongId(),
                khoan.soPhong(),
                khoan.hangMuc(),
                khoan.ngayTao().getYear() + "-%02d".formatted(khoan.ngayTao().getMonthValue()),
                "%02d/%d".formatted(khoan.ngayTao().getMonthValue(), khoan.ngayTao().getYear()),
                trangThaiHieuLuc,
                trangThaiHieuLuc.tenHienThi(),
                khoan.chiPhi() == null ? null : dinhDangTien(khoan.chiPhi()),
                khoan.benChiuChiPhi(),
                coChiPhi,
                trangThaiChiPhi,
                tenTrangThaiChiPhi(trangThaiChiPhi),
                khoan.taoLuc().toString(),
                "/su-co?yeuCauId=" + khoan.yeuCauId()
        );
    }

    static String trangThaiChiPhi(KhoanChiPhiBaoTriBaoCao khoan) {
        if (khoan.chiPhi() == null) {
            return CHUA_GHI_NHAN;
        }
        return khoan.benChiuChiPhi() == null ? THIEU_BEN_CHIU_CHI_PHI : DA_GHI_NHAN;
    }

    static String dinhDangTien(BigDecimal giaTri) {
        return giaTri.setScale(2, RoundingMode.UNNECESSARY).toPlainString();
    }

    private static String tenTrangThaiChiPhi(String trangThai) {
        return switch (trangThai) {
            case DA_GHI_NHAN -> "Đã ghi nhận";
            case THIEU_BEN_CHIU_CHI_PHI -> "Thiếu bên chịu chi phí";
            default -> "Chưa ghi nhận chi phí";
        };
    }
}
