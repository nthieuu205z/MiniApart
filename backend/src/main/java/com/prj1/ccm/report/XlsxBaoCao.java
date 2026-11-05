package com.prj1.ccm.report;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/** FR-RPT-04 writes real Office Open XML without interpreting user text as formulas. */
public final class XlsxBaoCao {
    private XlsxBaoCao() { }

    public static byte[] viet(List<List<?>> rows) {
        try (ByteArrayOutputStream bytes = new ByteArrayOutputStream(); ZipOutputStream zip = new ZipOutputStream(bytes, StandardCharsets.UTF_8)) {
            tep(zip, "[Content_Types].xml", """
                    <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
                    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
                    <Default Extension="xml" ContentType="application/xml"/>
                    <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
                    <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
                    </Types>""");
            tep(zip, "_rels/.rels", """
                    <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
                    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
                    </Relationships>""");
            tep(zip, "xl/workbook.xml", """
                    <workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
                    <sheets><sheet name="Báo cáo" sheetId="1" r:id="rId1"/></sheets></workbook>""");
            tep(zip, "xl/_rels/workbook.xml.rels", """
                    <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
                    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
                    </Relationships>""");
            StringBuilder sheet = new StringBuilder("<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><sheetData>");
            int rowIndex = 0;
            for (List<?> row : rows) {
                sheet.append("<row r=\"").append(++rowIndex).append("\">");
                for (int index = 0; index < row.size(); index++) {
                    Object value = row.get(index);
                    String reference = cot(index + 1) + rowIndex;
                    if (value == null) continue;
                    if (value instanceof BigDecimal decimal) {
                        sheet.append("<c r=\"").append(reference).append("\"><v>").append(decimal.toPlainString()).append("</v></c>");
                    } else if (value instanceof Integer || value instanceof Long) {
                        sheet.append("<c r=\"").append(reference).append("\"><v>").append(value).append("</v></c>");
                    } else {
                        sheet.append("<c r=\"").append(reference).append("\" t=\"inlineStr\"><is><t xml:space=\"preserve\">")
                                .append(xml(String.valueOf(value))).append("</t></is></c>");
                    }
                }
                sheet.append("</row>");
            }
            sheet.append("</sheetData></worksheet>");
            tep(zip, "xl/worksheets/sheet1.xml", sheet.toString());
            zip.finish();
            return bytes.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("Không thể tạo báo cáo Excel", exception);
        }
    }

    private static void tep(ZipOutputStream zip, String path, String xml) throws IOException {
        zip.putNextEntry(new ZipEntry(path));
        zip.write(("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" + xml).getBytes(StandardCharsets.UTF_8));
        zip.closeEntry();
    }

    private static String cot(int number) {
        StringBuilder result = new StringBuilder();
        while (number > 0) {
            result.insert(0, (char) ('A' + (number - 1) % 26));
            number = (number - 1) / 26;
        }
        return result.toString();
    }

    private static String xml(String value) {
        StringBuilder valid = new StringBuilder();
        value.codePoints().filter(code -> code == 9 || code == 10 || code == 13
                || (code >= 0x20 && code <= 0xD7FF) || (code >= 0xE000 && code <= 0xFFFD)
                || (code >= 0x10000 && code <= 0x10FFFF)).forEach(valid::appendCodePoint);
        return valid.toString().replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&apos;");
    }
}
