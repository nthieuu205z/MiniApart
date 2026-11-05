package com.prj1.ccm.hopdong;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfWriter;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

/** FR-TNT-06 uses persisted contract terms, an embedded Vietnamese font and configurable clauses. */
@Service
public class HopDongPdfService {
    private final HopDongService hopDongService;
    private final String title;
    private final String clauses;

    public HopDongPdfService(HopDongService hopDongService,
            @Value("${app.hop-dong.pdf-tieu-de:HỢP ĐỒNG THUÊ PHÒNG}") String title,
            @Value("${app.hop-dong.pdf-dieu-khoan:Bên thuê thanh toán tiền thuê và dịch vụ theo các điều khoản đã thoả thuận. Hai bên có trách nhiệm giữ gìn tài sản, bảo đảm an toàn và thông báo trước khi chấm dứt hợp đồng.}") String clauses) {
        this.hopDongService = hopDongService;
        this.title = title;
        this.clauses = clauses;
    }

    public byte[] xuat(Long id, NguoiDung user) {
        ThongTinHopDong contract = user != null && user.vaiTro() == VaiTro.NGUOI_THUE
                ? hopDongService.chiTietCuaNguoiThue(id, user) : hopDongService.chiTiet(id, user);
        try (ByteArrayOutputStream output = new ByteArrayOutputStream();
             InputStream stream = BaseFont.getResourceStream("liberation/LiberationSans-Regular.ttf")) {
            if (stream == null) throw new IllegalStateException("Không tìm thấy phông tiếng Việt");
            BaseFont font = BaseFont.createFont("LiberationSans-Regular.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED, false, stream.readAllBytes(), null);
            Document document = new Document(PageSize.A4, 42, 42, 42, 42);
            PdfWriter.getInstance(document, output);
            document.open();
            Paragraph heading = new Paragraph(title, new Font(font, 17, Font.BOLD));
            heading.setAlignment(Paragraph.ALIGN_CENTER);
            document.add(heading);
            add(document, font, "Mã hợp đồng: " + contract.id() + " — " + contract.tenTrangThai());
            add(document, font, "Bên thuê: " + contract.hoTenNguoiThue());
            add(document, font, "Phòng thuê: " + contract.soPhong());
            add(document, font, "Thời hạn: " + contract.ngayBatDau() + " đến " + contract.ngayKetThuc());
            add(document, font, "Tiền thuê mỗi tháng: " + money(contract.giaThue()));
            add(document, font, "Tiền cọc thoả thuận: " + money(contract.tienCoc()));
            add(document, font, "Thời hạn báo trước: " + contract.soNgayBaoTruoc() + " ngày");
            add(document, font, "Dịch vụ áp dụng:");
            for (ThongTinHopDongDichVu service : contract.dichVuApDung()) {
                String priceLabel;
                if ("BAC_THANG".equals(service.cheDoGia())) {
                    priceLabel = "Tính theo biểu giá bậc thang quy định";
                } else if ("0.00".equals(service.donGiaApDung()) || "0".equals(service.donGiaApDung())) {
                    priceLabel = "Miễn phí (0 đ)";
                } else {
                    priceLabel = money(service.donGiaApDung());
                }
                add(document, font, service.tenDichVu() + ": " + priceLabel);
            }
            add(document, font, "Điều khoản:");
            for (String clause : clauses.split("\\n")) add(document, font, clause);
            add(document, font, " ");
            add(document, font, "ĐẠI DIỆN BÊN CHO THUÊ                         BÊN THUÊ");
            add(document, font, "(Ký, ghi rõ họ tên)                                      (Ký, ghi rõ họ tên)");
            document.close();
            return output.toByteArray();
        } catch (Exception exception) {
            throw new IllegalStateException("Không thể xuất PDF hợp đồng", exception);
        }
    }

    private static void add(Document document, BaseFont font, String value) throws com.lowagie.text.DocumentException {
        Paragraph paragraph = new Paragraph(value, new Font(font, 11));
        paragraph.setSpacingBefore(9);
        document.add(paragraph);
    }
    private static String money(String value) { return NumberFormat.getNumberInstance(Locale.forLanguageTag("vi-VN")).format(new BigDecimal(value)) + " đ"; }
}
