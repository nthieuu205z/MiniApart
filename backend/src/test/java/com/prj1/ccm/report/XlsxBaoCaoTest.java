package com.prj1.ccm.report;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.zip.ZipInputStream;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class XlsxBaoCaoTest {
    @Test void FR_RPT_04_preservesDecimalsUnicodeNullsAndTreatsFormulaLikeNamesAsText() throws Exception {
        byte[] bytes = XlsxBaoCao.viet(List.of(Arrays.asList("=HYPERLINK(\"x\")", "Phòng <101> & nước", new BigDecimal("1887838.71"), null)));
        String xml = worksheet(bytes);
        assertThat(xml).contains("1887838.71", "Phòng &lt;101&gt; &amp; nước", "t=\"inlineStr\"", "=HYPERLINK(&quot;x&quot;)").doesNotContain("<f>", "r=\"D1\"");
    }
    @Test void FR_RPT_04_debtExportUsesIdenticalServiceFilterOrderAndAmounts() throws Exception {
        CongNoBaoCaoService debts = mock(CongNoBaoCaoService.class);
        BaoCaoExcelController controller = new BaoCaoExcelController(mock(TongQuanBaoCaoService.class), debts, mock(TieuThuBaoCaoService.class), mock(ChiPhiBaoTriBaoCaoService.class));
        when(debts.layCongNo(eq(7L), isNull())).thenReturn(new ThongTinCongNoBaoCao(7L, "2026-11-04T10:00", List.of(
                new ThongTinKhoanNoBaoCao(10L, "HD-001", 8L, 11L, 7L, "Toà A", "101", 12L, "Người thuê", "2026-09-01", "2026-09-07", "1888000.00", "100000.25", "1787999.75", 58))));
        byte[] bytes = controller.congNo(7L, new MockHttpServletRequest()).getBody();
        assertThat(worksheet(bytes)).contains("HD-001", "1888000.00", "100000.25", "1787999.75", "Toà A", "58");
        verify(debts).layCongNo(7L, null);
    }
    private static String worksheet(byte[] bytes) throws Exception {
        try (ZipInputStream zip = new ZipInputStream(new ByteArrayInputStream(bytes))) {
            java.util.zip.ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) if (entry.getName().equals("xl/worksheets/sheet1.xml")) return new String(zip.readAllBytes(), StandardCharsets.UTF_8);
        }
        throw new AssertionError("Workbook lacks worksheet");
    }
}
