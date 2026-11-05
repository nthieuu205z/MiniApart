package com.prj1.ccm.hopdong;

import com.lowagie.text.pdf.PdfReader;
import com.lowagie.text.pdf.parser.PdfTextExtractor;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.TrangThaiNguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class HopDongPdfServiceTest {
    @Test void FR_TNT_06_exportsStoredTermsVietnameseAndConfiguredTemplate() throws Exception {
        HopDongService contracts = mock(HopDongService.class);
        NguoiDung manager = user(VaiTro.QUAN_LY);
        when(contracts.chiTiet(21L, manager)).thenReturn(contract());
        byte[] pdf = new HopDongPdfService(contracts, "HỢP ĐỒNG THUÊ PHÒNG", "Điều khoản cấu hình\nThanh toán đúng hạn.").xuat(21L, manager);
        try (PdfReader reader = new PdfReader(pdf)) {
            String text = new PdfTextExtractor(reader).getTextFromPage(1);
            assertThat(text).contains("HỢP ĐỒNG THUÊ PHÒNG", "Nguyễn Văn An", "3.500.000", "Điều khoản cấu hình", "2026-01-01", "Điện");
        }
    }
    @Test void FR_POR_04_tenantPdfUsesOwnContractAuthorization() {
        HopDongService contracts = mock(HopDongService.class);
        NguoiDung tenant = user(VaiTro.NGUOI_THUE);
        when(contracts.chiTietCuaNguoiThue(21L, tenant)).thenReturn(contract());
        assertThat(new HopDongPdfService(contracts, "Hợp đồng", "Điều khoản").xuat(21L, tenant)).isNotEmpty();
        verify(contracts).chiTietCuaNguoiThue(21L, tenant);
        verify(contracts, never()).chiTiet(anyLong(), any());
    }
    private static NguoiDung user(VaiTro role) { return new NguoiDung(3L, "Người dùng", "0900000003", "hash", role, TrangThaiNguoiDung.HOAT_DONG, 0, 10L); }
    private static ThongTinHopDong contract() {
        return new ThongTinHopDong(21L, 101L, "101", 10L, "Nguyễn Văn An", LocalDate.parse("2026-01-01"), LocalDate.parse("2026-12-31"), "3500000.00", "3500000.00", 30, "HIEU_LUC", "Hiệu lực", false, 60, List.of(new ThongTinHopDongDichVu(7L, "Điện", "3500.00")), null);
    }
}
