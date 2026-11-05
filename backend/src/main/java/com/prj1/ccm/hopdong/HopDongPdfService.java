package com.prj1.ccm.hopdong;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.nguoithue.SoGiayToFormatter;
import com.prj1.ccm.toanha.MauHopDongChuan;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Dịch vụ tạo hồ sơ hợp đồng thuê phòng MiniApart chuẩn hành chính, có đầy đủ căn cứ đối chiếu nhận/trả phòng.
 */
@Service
public class HopDongPdfService {
    private final HopDongService hopDongService;
    private final String title;
    private final String clauses;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public HopDongPdfService(
            HopDongService hopDongService,
            @Value("${app.hop-dong.pdf-tieu-de:HỢP ĐỒNG THUÊ PHÒNG}") String title,
            @Value("${app.hop-dong.pdf-dieu-khoan:Bên thuê thanh toán tiền thuê và dịch vụ theo các điều khoản đã thoả thuận. Hai bên có trách nhiệm giữ gìn tài sản, bảo đảm an toàn và thông báo trước khi chấm dứt hợp đồng.}") String clauses
    ) {
        this.hopDongService = hopDongService;
        this.title = title;
        this.clauses = clauses;
    }

    public byte[] xuat(Long id, NguoiDung user) {
        ThongTinHopDong contract = user != null && user.vaiTro() == VaiTro.NGUOI_THUE
                ? hopDongService.chiTietCuaNguoiThue(id, user)
                : hopDongService.chiTiet(id, user);

        HopDongHoSoDto hoSo = hopDongService.layHoSoHopDong(id, user);
        boolean isDraft = hoSo == null || "DRAFT".equals(hoSo.trangThaiTaiLieu());

        try (ByteArrayOutputStream output = new ByteArrayOutputStream();
             InputStream stream = BaseFont.getResourceStream("liberation/LiberationSans-Regular.ttf")) {
            if (stream == null) throw new IllegalStateException("Không tìm thấy phông tiếng Việt");
            BaseFont baseFont = BaseFont.createFont(
                    "LiberationSans-Regular.ttf",
                    BaseFont.IDENTITY_H,
                    BaseFont.EMBEDDED,
                    false,
                    stream.readAllBytes(),
                    null
            );

            Font fNational = new Font(baseFont, 11, Font.BOLD);
            Font fMotto = new Font(baseFont, 10, Font.BOLD);
            Font fTitle = new Font(baseFont, 15, Font.BOLD);
            Font fSubTitle = new Font(baseFont, 9.5f, Font.ITALIC);
            Font fSecHeader = new Font(baseFont, 10.5f, Font.BOLD);
            Font fBody = new Font(baseFont, 9.5f, Font.NORMAL);
            Font fBodyBold = new Font(baseFont, 9.5f, Font.BOLD);
            Font fSmall = new Font(baseFont, 8.5f, Font.NORMAL);
            Font fSmallBold = new Font(baseFont, 8.5f, Font.BOLD);
            Font fSmallItalic = new Font(baseFont, 8.5f, Font.ITALIC);

            Document document = new Document(PageSize.A4, 40, 40, 40, 40);
            PdfWriter writer = PdfWriter.getInstance(document, output);
            writer.setPageEvent(new FooterPageEvent(baseFont, "HD-" + id, isDraft));
            document.open();

            // 1. DRAFT BANNER (nếu là bản dự thảo)
            if (isDraft) {
                PdfPTable draftTable = new PdfPTable(1);
                draftTable.setWidthPercentage(100);
                draftTable.setSpacingAfter(8);
                PdfPCell draftCell = new PdfPCell(new Phrase("[DỰ THẢO - CHƯA CÓ GIÁ TRỊ PHÁP LÝ]", new Font(baseFont, 10, Font.BOLD, new Color(180, 40, 40))));
                draftCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                draftCell.setBackgroundColor(new Color(254, 242, 242));
                draftCell.setBorderColor(new Color(252, 165, 165));
                draftCell.setPadding(5);
                draftTable.addCell(draftCell);
                document.add(draftTable);
            }

            // 2. QUỐC HIỆU & TIÊU NGỮ
            Paragraph nationalHeader = new Paragraph("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", fNational);
            nationalHeader.setAlignment(Element.ALIGN_CENTER);
            document.add(nationalHeader);

            Paragraph motto = new Paragraph("Độc lập - Tự do - Hạnh phúc", fMotto);
            motto.setAlignment(Element.ALIGN_CENTER);
            document.add(motto);

            Paragraph divider = new Paragraph("---------------------------", fSmall);
            divider.setAlignment(Element.ALIGN_CENTER);
            divider.setSpacingAfter(10);
            document.add(divider);

            // 3. TIÊU ĐỀ HỢP ĐỒNG & THỜI ĐIỂM
            String pdfTitle = (hoSo != null && hoSo.tieuDe() != null && !hoSo.tieuDe().isBlank()) ? hoSo.tieuDe() : title;
            Paragraph heading = new Paragraph(pdfTitle, fTitle);
            heading.setAlignment(Element.ALIGN_CENTER);
            document.add(heading);

            String contractCode = "Mã hợp đồng: " + contract.id() + " — " + contract.tenTrangThai();
            if (hoSo != null && hoSo.revision() > 1) {
                contractCode += " (Revision " + hoSo.revision() + ")";
            }
            Paragraph subHeading = new Paragraph(contractCode, fSubTitle);
            subHeading.setAlignment(Element.ALIGN_CENTER);
            subHeading.setSpacingAfter(12);
            document.add(subHeading);

            LocalDate ngayLap = hoSo != null && hoSo.ngayLap() != null ? hoSo.ngayLap() : LocalDate.now();
            String diaDiem = hoSo != null && hoSo.diaDiemLap() != null ? hoSo.diaDiemLap() : "Hà Nội";
            Paragraph intro = new Paragraph(
                    String.format("Hôm nay, ngày %02d tháng %02d năm %d, tại %s, chúng tôi gồm có:",
                            ngayLap.getDayOfMonth(), ngayLap.getMonthValue(), ngayLap.getYear(), diaDiem),
                    fBody
            );
            intro.setSpacingAfter(6);
            document.add(intro);

            // 4. BÊN CHO THUÊ (BÊN A)
            document.add(new Paragraph("BÊN CHO THUÊ (BÊN A):", fSecHeader));
            PdfPTable benATable = new PdfPTable(new float[]{30, 70});
            benATable.setWidthPercentage(100);
            benATable.setSpacingBefore(4);
            benATable.setSpacingAfter(8);

            String tenChuThe = hoSo != null && hoSo.benATenChuThe() != null ? hoSo.benATenChuThe() : "Ban quản lý toà nhà";
            String dinhDanh = hoSo != null && hoSo.benADinhDanh() != null ? hoSo.benADinhDanh() : "Đang cập nhật";
            String diaChiA = hoSo != null && hoSo.benADiaChi() != null ? hoSo.benADiaChi() : "Đang cập nhật";
            String dienThoaiA = hoSo != null && hoSo.benADienThoai() != null ? hoSo.benADienThoai() : "Đang cập nhật";
            String nguoiKyA = hoSo != null && hoSo.benANguoiKy() != null ? hoSo.benANguoiKy() : "Đại diện toà nhà";
            String chucVuA = hoSo != null && hoSo.benAChucVu() != null ? hoSo.benAChucVu() : "Chủ sở hữu / Người đại diện";
            String tkNhan = hoSo != null && hoSo.taiKhoanNhanTien() != null ? hoSo.taiKhoanNhanTien() : "Theo hướng dẫn khi thanh toán";

            addRow(benATable, fBodyBold, fBody, "Tên chủ thể / Đơn vị:", tenChuThe + (hoSo != null && "TO_CHUC".equals(hoSo.benALoaiChuThe()) ? " (Tổ chức)" : " (Cá nhân)"));
            addRow(benATable, fBodyBold, fBody, "Số CCCD / MST:", dinhDanh);
            addRow(benATable, fBodyBold, fBody, "Địa chỉ liên hệ:", diaChiA);
            addRow(benATable, fBodyBold, fBody, "Số điện thoại:", dienThoaiA + (hoSo != null && hoSo.benAEmail() != null ? "   |   Email: " + hoSo.benAEmail() : ""));
            addRow(benATable, fBodyBold, fBody, "Người đại diện ký:", nguoiKyA + "   —   Chức vụ: " + chucVuA);
            if (hoSo != null && hoSo.benACanCuUyQuyen() != null && !hoSo.benACanCuUyQuyen().isBlank()) {
                addRow(benATable, fBodyBold, fBody, "Căn cứ ủy quyền:", hoSo.benACanCuUyQuyen());
            }
            addRow(benATable, fBodyBold, fBody, "Tài khoản nhận tiền:", tkNhan);
            document.add(benATable);

            // 5. BÊN THUÊ (BÊN B)
            document.add(new Paragraph("BÊN THUÊ (BÊN B):", fSecHeader));
            PdfPTable benBTable = new PdfPTable(new float[]{30, 70});
            benBTable.setWidthPercentage(100);
            benBTable.setSpacingBefore(4);
            benBTable.setSpacingAfter(8);

            String hoTenB = hoSo != null && hoSo.benBHoTen() != null ? hoSo.benBHoTen() : contract.hoTenNguoiThue();
            String loaiGiayTo = hoSo != null && hoSo.benBLoaiGiayTo() != null ? hoSo.benBLoaiGiayTo() : "CCCD";
            String soGiayTo = hoSo != null && hoSo.benBSoGiayTo() != null ? hoSo.benBSoGiayTo() : "Đang cập nhật";
            String soGiayToHienThi = SoGiayToFormatter.che(soGiayTo);
            String ngayCap = hoSo != null && hoSo.benBNgayCap() != null ? hoSo.benBNgayCap().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "";
            String noiCap = hoSo != null && hoSo.benBNoiCap() != null ? hoSo.benBNoiCap() : "";
            String giayToFull = soGiayToHienThi + (!ngayCap.isBlank() ? " (Cấp ngày: " + ngayCap + (noiCap.isBlank() ? "" : " tại " + noiCap) + ")" : "");
            String thuongTru = hoSo != null && hoSo.benBThuongTru() != null ? hoSo.benBThuongTru() : "Đang cập nhật";
            String dienThoaiB = hoSo != null && hoSo.benBDienThoai() != null ? hoSo.benBDienThoai() : "Đang cập nhật";

            addRow(benBTable, fBodyBold, fBody, "Bên thuê:", hoTenB);
            addRow(benBTable, fBodyBold, fBody, "Số " + loaiGiayTo + ":", giayToFull);
            addRow(benBTable, fBodyBold, fBody, "Địa chỉ thường trú:", thuongTru);
            if (hoSo != null && hoSo.benBLienHe() != null && !hoSo.benBLienHe().isBlank()) {
                addRow(benBTable, fBodyBold, fBody, "Địa chỉ liên hệ:", hoSo.benBLienHe());
            }
            addRow(benBTable, fBodyBold, fBody, "Số điện thoại:", dienThoaiB + (hoSo != null && hoSo.benBEmail() != null ? "   |   Email: " + hoSo.benBEmail() : ""));

            if (!isDraft) {
                if (hoSo == null || hoSo.snapshotNguoiOCungJson() == null || hoSo.snapshotNguoiOCungJson().trim().isBlank()) {
                    throw new IllegalStateException("Hồ sơ hợp đồng đã chốt thiếu dữ liệu snapshot người ở cùng.");
                }
                try {
                    JsonNode nocTree = objectMapper.readTree(hoSo.snapshotNguoiOCungJson());
                    if (!nocTree.isArray()) {
                        throw new IllegalStateException("Snapshot người ở cùng sai định dạng (không phải danh sách).");
                    }
                } catch (IllegalStateException e) {
                    throw e;
                } catch (Exception e) {
                    throw new IllegalStateException("Snapshot người ở cùng của hồ sơ hợp đồng bị lỗi định dạng JSON: " + e.getMessage(), e);
                }
            }

            var dsCuTruHopLe = hoSo != null && hoSo.dsNguoiOCung() != null
                    ? hoSo.dsNguoiOCung().stream()
                    .filter(noc -> noc.trangThai() == null || "DA_DUYET".equals(noc.trangThai()))
                    .filter(noc -> {
                        LocalDate tuNgayHd = hoSo.ngayNhanPhong() != null ? hoSo.ngayNhanPhong() : (contract != null ? contract.ngayBatDau() : null);
                        LocalDate denNgayHd = contract != null ? contract.ngayKetThuc() : null;
                        if (tuNgayHd != null && noc.denNgay() != null && noc.denNgay().isBefore(tuNgayHd)) return false;
                        if (denNgayHd != null && noc.tuNgay() != null && noc.tuNgay().isAfter(denNgayHd)) return false;
                        return true;
                    })
                    .toList()
                    : java.util.List.<ThongTinNguoiOCung>of();

            if (!dsCuTruHopLe.isEmpty()) {
                StringBuilder oCungText = new StringBuilder();
                for (int i = 0; i < dsCuTruHopLe.size(); i++) {
                    var noc = dsCuTruHopLe.get(i);
                    if (i > 0) oCungText.append("; ");
                    oCungText.append(noc.hoTenNguoiThue()).append(" (").append(noc.quanHe() != null ? noc.quanHe() : "Ở cùng").append(")");
                }
                addRow(benBTable, fBodyBold, fBody, "Người ở cùng đã đăng ký:", oCungText.toString());
            }
            document.add(benBTable);

            // 5b. DANH SÁCH NGƯỜI ĐƯỢC PHÉP CƯ TRÚ
            Paragraph pCuTruHeader = new Paragraph("DANH SÁCH NGƯỜI ĐƯỢC PHÉP CƯ TRÚ:", fSecHeader);
            pCuTruHeader.setSpacingBefore(6);
            pCuTruHeader.setSpacingAfter(4);
            document.add(pCuTruHeader);

            PdfPTable cuTruTable = new PdfPTable(new float[]{8, 30, 26, 16, 20});
            cuTruTable.setWidthPercentage(100);
            cuTruTable.setSpacingBefore(2);
            cuTruTable.setSpacingAfter(6);

            addHeaderCell(cuTruTable, fSmallBold, "STT");
            addHeaderCell(cuTruTable, fSmallBold, "Họ và tên");
            addHeaderCell(cuTruTable, fSmallBold, "Vai trò cư trú");
            addHeaderCell(cuTruTable, fSmallBold, "Quan hệ");
            addHeaderCell(cuTruTable, fSmallBold, "Thời hạn");

            // Row 1: Đại diện bên thuê
            addBodyCell(cuTruTable, fSmall, "1", Element.ALIGN_CENTER);
            addBodyCell(cuTruTable, fSmallBold, hoTenB, Element.ALIGN_LEFT);
            addBodyCell(cuTruTable, fSmall, "Người đứng tên HĐ (Chính)", Element.ALIGN_LEFT);
            addBodyCell(cuTruTable, fSmall, "Đại diện bên thuê", Element.ALIGN_LEFT);
            addBodyCell(cuTruTable, fSmall, "Theo thời hạn HĐ", Element.ALIGN_CENTER);

            int nocStt = 2;
            for (var noc : dsCuTruHopLe) {
                String vaiTro = "Người ở cùng" + (noc.vaiTro() != null && !noc.vaiTro().isBlank() && !"NGUOI_O".equals(noc.vaiTro()) ? " (" + noc.vaiTro() + ")" : "");
                String quanHe = noc.quanHe() != null && !noc.quanHe().isBlank() ? noc.quanHe() : "Ở cùng";
                String thoiHan = (noc.tuNgay() != null ? noc.tuNgay().format(DateTimeFormatter.ofPattern("dd/MM/yy")) : "")
                        + (noc.denNgay() != null ? " - " + noc.denNgay().format(DateTimeFormatter.ofPattern("dd/MM/yy")) : " (Lâu dài)");

                addBodyCell(cuTruTable, fSmall, String.valueOf(nocStt++), Element.ALIGN_CENTER);
                addBodyCell(cuTruTable, fSmall, noc.hoTenNguoiThue(), Element.ALIGN_LEFT);
                addBodyCell(cuTruTable, fSmall, vaiTro, Element.ALIGN_LEFT);
                addBodyCell(cuTruTable, fSmall, quanHe, Element.ALIGN_LEFT);
                addBodyCell(cuTruTable, fSmall, thoiHan, Element.ALIGN_CENTER);
            }
            document.add(cuTruTable);

            // 6. THÔNG TIN PHÒNG VÀ ĐIỀU KIỆN THUÊ CỐT LÕI
            document.add(new Paragraph("THÔNG TIN PHÒNG VÀ ĐIỀU KIỆN THUÊ:", fSecHeader));
            PdfPTable phongTable = new PdfPTable(new float[]{30, 70});
            phongTable.setWidthPercentage(100);
            phongTable.setSpacingBefore(4);
            phongTable.setSpacingAfter(8);

            String tenToa = hoSo != null && hoSo.bdsTenToaNha() != null ? hoSo.bdsTenToaNha() : "Toà nhà MiniApart";
            String diaChiToa = hoSo != null && hoSo.bdsDiaChiToaNha() != null ? hoSo.bdsDiaChiToaNha() : "";
            String soPhong;
            if (!isDraft) {
                if (hoSo == null || hoSo.bdsSoPhong() == null || hoSo.bdsSoPhong().isBlank()) {
                    throw new IllegalStateException("Hồ sơ hợp đồng đã chốt thiếu thông tin số phòng trong snapshot.");
                }
                soPhong = hoSo.bdsSoPhong();
            } else {
                soPhong = (hoSo != null && hoSo.bdsSoPhong() != null && !hoSo.bdsSoPhong().isBlank())
                        ? hoSo.bdsSoPhong()
                        : contract.soPhong();
            }
            String dienTich = hoSo != null && hoSo.bdsDienTich() != null ? hoSo.bdsDienTich() + " m²" : "";
            String bdsText = "Phòng " + soPhong + (dienTich.isBlank() ? "" : " (Diện tích: " + dienTich + ")") + " - " + tenToa + (!diaChiToa.isBlank() ? ", " + diaChiToa : "");

            addRow(phongTable, fBodyBold, fBody, "Phòng thuê:", bdsText);
            addRow(phongTable, fBodyBold, fBody, "Mục đích thuê:", hoSo != null && hoSo.mucDichThue() != null ? hoSo.mucDichThue() : "Để ở");
            addRow(phongTable, fBodyBold, fBody, "Số người tối đa:", (hoSo != null && hoSo.soNguoiToiDa() != null ? hoSo.soNguoiToiDa() : 2) + " người");
            addRow(phongTable, fBodyBold, fBody, "Thời hạn thuê:", "Từ " + contract.ngayBatDau() + " đến " + contract.ngayKetThuc());
            addRow(phongTable, fBodyBold, fBody, "Tiền thuê mỗi tháng:", money(contract.giaThue()));

            String tienCocThoaThuan = money(contract.tienCoc());
            addRow(phongTable, fBodyBold, fBody, "Tiền cọc thoả thuận:", tienCocThoaThuan);
            addRow(phongTable, fBodyBold, fBody, "Báo trước gia hạn / kết thúc:", (hoSo != null && hoSo.soNgayBaoTruocGiaHan() != null ? hoSo.soNgayBaoTruocGiaHan() : contract.soNgayBaoTruoc()) + " ngày");
            addRow(phongTable, fBodyBold, fBody, "Thời hạn hoàn cọc:", (hoSo != null && hoSo.soNgayHoanCoc() != null ? hoSo.soNgayHoanCoc() : 7) + " ngày làm việc sau khi bàn giao phòng");
            addRow(phongTable, fBodyBold, fBody, "Khung giờ yên tĩnh:", (hoSo != null && hoSo.khungGioYenTinh() != null ? hoSo.khungGioYenTinh() : "22:00 - 06:00 hàng ngày"));
            addRow(phongTable, fBodyBold, fBody, "Kỳ thanh toán:", (hoSo != null ? hoSo.kyThanhToanThang() : 1) + " tháng/lần (Hạn thanh toán: ngày " + (hoSo != null ? hoSo.hanThanhToanNgay() : 5) + " hàng tháng)");
            document.add(phongTable);

            // 7. DỊCH VỤ ÁP DỤNG
            document.add(new Paragraph("DỊCH VỤ ÁP DỤNG:", fSecHeader));
            if (!isDraft) {
                if (hoSo == null || hoSo.snapshotDichVuJson() == null || hoSo.snapshotDichVuJson().trim().isBlank()) {
                    throw new IllegalStateException("Hồ sơ hợp đồng đã chốt thiếu dữ liệu snapshot dịch vụ.");
                }
                JsonNode arrayNode;
                try {
                    arrayNode = objectMapper.readTree(hoSo.snapshotDichVuJson());
                } catch (Exception e) {
                    throw new IllegalStateException("Snapshot dịch vụ của hồ sơ hợp đồng bị lỗi định dạng JSON: " + e.getMessage(), e);
                }
                if (!arrayNode.isArray()) {
                    throw new IllegalStateException("Snapshot dịch vụ của hồ sơ hợp đồng sai định dạng (không phải danh sách).");
                }
                if (arrayNode.isEmpty()) {
                    Paragraph pNone = new Paragraph("Không có dịch vụ tính phí riêng theo hợp đồng.", fBody);
                    pNone.setSpacingBefore(3);
                    pNone.setSpacingAfter(3);
                    document.add(pNone);
                } else {
                    for (JsonNode dvNode : arrayNode) {
                        String ten = dvNode.path("tenDichVu").asText("");
                        String cheDo = dvNode.path("cheDoGia").asText("CO_DINH");
                        String donVi = dvNode.path("donVi").asText("");
                        JsonNode tiersNode = dvNode.path("cacBacThang");
                        if ("BAC_THANG".equals(cheDo)) {
                            if (tiersNode == null || !tiersNode.isArray() || tiersNode.isEmpty()) {
                                throw new IllegalStateException("Dịch vụ bậc thang '" + ten + "' trong snapshot thiếu biểu giá định mức các bậc.");
                            }
                            Paragraph pDv = new Paragraph(ten + " (Biểu giá bậc thang):", fBodyBold);
                            pDv.setSpacingBefore(3);
                            pDv.setSpacingAfter(2);
                            document.add(pDv);

                            PdfPTable tierTable = new PdfPTable(new float[]{15, 45, 40});
                            tierTable.setWidthPercentage(95);
                            tierTable.setSpacingBefore(2);
                            tierTable.setSpacingAfter(4);

                            addHeaderCell(tierTable, fSmallBold, "Bậc");
                            addHeaderCell(tierTable, fSmallBold, "Định mức sử dụng (" + (donVi.isBlank() ? "đơn vị" : donVi) + ")");
                            addHeaderCell(tierTable, fSmallBold, "Đơn giá");

                            for (JsonNode tNode : tiersNode) {
                                int bac = tNode.path("bac").asInt(1);
                                BigDecimal tu = tNode.has("tuChiSo") && !tNode.path("tuChiSo").isNull() ? new BigDecimal(tNode.path("tuChiSo").asText()) : (tNode.has("tuSoLuong") && !tNode.path("tuSoLuong").isNull() ? new BigDecimal(tNode.path("tuSoLuong").asText()) : BigDecimal.ZERO);
                                String denStr = tNode.has("denChiSo") && !tNode.path("denChiSo").isNull() ? tNode.path("denChiSo").asText() : (tNode.has("denSoLuong") && !tNode.path("denSoLuong").isNull() ? tNode.path("denSoLuong").asText() : "");
                                if (!tNode.has("donGia") || tNode.path("donGia").isNull() || tNode.path("donGia").asText().isBlank()) {
                                    throw new IllegalStateException("Bậc " + bac + " của dịch vụ bậc thang '" + ten + "' thiếu đơn giá.");
                                }
                                BigDecimal donGia = new BigDecimal(tNode.path("donGia").asText());

                                String dinhMuc = denStr.isBlank() || "null".equalsIgnoreCase(denStr)
                                        ? "Từ " + tu + " trở lên"
                                        : "Từ " + tu + " đến " + denStr;
                                addBodyCell(tierTable, fSmall, String.valueOf(bac), Element.ALIGN_CENTER);
                                addBodyCell(tierTable, fSmall, dinhMuc, Element.ALIGN_LEFT);
                                addBodyCell(tierTable, fSmall, money(donGia.toPlainString()) + (donVi.isBlank() ? "" : " / " + donVi), Element.ALIGN_RIGHT);
                            }
                            document.add(tierTable);
                        } else {
                            if (!dvNode.has("donGiaApDung") || dvNode.path("donGiaApDung").isNull() || dvNode.path("donGiaApDung").asText().isBlank()) {
                                throw new IllegalStateException("Dịch vụ '" + ten + "' trong snapshot thiếu đơn giá áp dụng.");
                            }
                            BigDecimal gia = new BigDecimal(dvNode.path("donGiaApDung").asText());
                            String giaLabel = (gia.compareTo(BigDecimal.ZERO) == 0) ? "Miễn phí (0 đ)" : money(gia.toPlainString()) + (donVi.isBlank() ? "" : " / " + donVi);
                            Paragraph pDv = new Paragraph(ten + ": " + giaLabel, fBody);
                            pDv.setSpacingBefore(2);
                            pDv.setSpacingAfter(2);
                            document.add(pDv);
                        }
                    }
                }
            } else {
                if (contract.dichVuApDung() == null || contract.dichVuApDung().isEmpty()) {
                    Paragraph pNone = new Paragraph("Không có dịch vụ tính phí riêng theo hợp đồng.", fBody);
                    pNone.setSpacingBefore(3);
                    pNone.setSpacingAfter(3);
                    document.add(pNone);
                } else {
                    for (ThongTinHopDongDichVu service : contract.dichVuApDung()) {
                        String priceLabel;
                        if ("BAC_THANG".equals(service.cheDoGia())) {
                            priceLabel = "Tính theo biểu giá bậc thang quy định";
                        } else if (service.donGiaApDung() == null || service.donGiaApDung().isBlank()) {
                            throw new IllegalStateException("Dịch vụ '" + service.tenDichVu() + "' thiếu đơn giá áp dụng.");
                        } else {
                            BigDecimal gia = new BigDecimal(service.donGiaApDung());
                            if (gia.compareTo(BigDecimal.ZERO) == 0) {
                                priceLabel = "Miễn phí (0 đ)";
                            } else {
                                priceLabel = money(gia.toPlainString());
                            }
                        }
                        Paragraph pDv = new Paragraph(service.tenDichVu() + ": " + priceLabel, fBody);
                        pDv.setSpacingBefore(2);
                        pDv.setSpacingAfter(2);
                        document.add(pDv);
                    }
                }
            }

            // 8. ĐIỀU KHOẢN HỢP ĐỒNG
            document.add(new Paragraph("ĐIỀU KHOẢN HỢP ĐỒNG:", fSecHeader));
            String dieuKhoanText;
            if (!isDraft) {
                if (hoSo == null || hoSo.dieuKhoanTuyBien() == null || hoSo.dieuKhoanTuyBien().trim().isBlank()) {
                    throw new IllegalStateException("Hồ sơ hợp đồng đã chốt thiếu điều khoản hợp đồng.");
                }
                dieuKhoanText = hoSo.dieuKhoanTuyBien();
            } else {
                dieuKhoanText = (hoSo != null && hoSo.dieuKhoanTuyBien() != null && !hoSo.dieuKhoanTuyBien().isBlank())
                        ? hoSo.dieuKhoanTuyBien()
                        : (clauses != null && !clauses.isBlank() ? clauses : MauHopDongChuan.NOI_DUNG_DIEU_KHOAN_CHUAN);
            }

            for (String line : dieuKhoanText.split("\\n")) {
                String trimmed = line.trim();
                if (!trimmed.isBlank()) {
                    boolean isArticleTitle = trimmed.matches("^(Điều|ĐIỀU)\\s+\\d+.*");
                    Font lineFont = isArticleTitle ? fBodyBold : fBody;
                    Paragraph pLine = new Paragraph(trimmed, lineFont);
                    pLine.setSpacingBefore(isArticleTitle ? 5 : 2);
                    pLine.setSpacingAfter(2);
                    if (!isArticleTitle && trimmed.matches("^\\d+\\..*")) {
                        pLine.setIndentationLeft(10);
                    }
                    document.add(pLine);
                }
            }

            // 9. PHỤ LỤC: BÀN GIAO TÀI SẢN (NẾU CÓ)
            if (hoSo != null && hoSo.snapshotTaiSanJson() != null && !hoSo.snapshotTaiSanJson().isBlank() && !"[]".equals(hoSo.snapshotTaiSanJson())) {
                JsonNode assetsArray;
                try {
                    assetsArray = objectMapper.readTree(hoSo.snapshotTaiSanJson());
                } catch (Exception e) {
                    throw new IllegalStateException("Snapshot tài sản của hồ sơ hợp đồng bị lỗi định dạng JSON: " + e.getMessage(), e);
                }
                if (assetsArray.isArray() && assetsArray.size() > 0) {
                    Paragraph pPlHeader = new Paragraph("PHỤ LỤC: DANH MỤC TRANG THIẾT BỊ BÀN GIAO KÈM THEO PHÒNG", fSecHeader);
                    pPlHeader.setSpacingBefore(10);
                    pPlHeader.setSpacingAfter(4);
                    document.add(pPlHeader);

                    PdfPTable assetTable = new PdfPTable(new float[]{8, 37, 15, 25, 15});
                    assetTable.setWidthPercentage(100);
                    assetTable.setSpacingBefore(2);
                    assetTable.setSpacingAfter(8);

                    addHeaderCell(assetTable, fSmallBold, "STT");
                    addHeaderCell(assetTable, fSmallBold, "Tên tài sản / Thiết bị");
                    addHeaderCell(assetTable, fSmallBold, "Số lượng");
                    addHeaderCell(assetTable, fSmallBold, "Tình trạng lúc giao");
                    addHeaderCell(assetTable, fSmallBold, "Ghi chú");

                    int stt = 1;
                    for (JsonNode item : assetsArray) {
                        String ten = item.path("tenTaiSan").asText("Trang thiết bị");
                        int sl = item.path("soLuong").asInt(1);
                        String tinhTrang = item.path("tinhTrangLucGiao").asText("Hoạt động tốt");
                        String ghiChu = item.path("ghiChu").asText("");

                        addBodyCell(assetTable, fSmall, String.valueOf(stt++), Element.ALIGN_CENTER);
                        addBodyCell(assetTable, fSmall, ten, Element.ALIGN_LEFT);
                        addBodyCell(assetTable, fSmall, String.valueOf(sl), Element.ALIGN_CENTER);
                        addBodyCell(assetTable, fSmall, tinhTrang, Element.ALIGN_LEFT);
                        addBodyCell(assetTable, fSmall, ghiChu, Element.ALIGN_LEFT);
                    }
                    document.add(assetTable);
                }
            }

            // 10. KHỐI CHỮ KÝ (2 CỘT CÂN ĐỐI)
            Paragraph spaceBeforeSign = new Paragraph(" ", fBody);
            spaceBeforeSign.setSpacingBefore(12);
            document.add(spaceBeforeSign);

            PdfPTable signTable = new PdfPTable(2);
            signTable.setWidthPercentage(100);
            signTable.setKeepTogether(true);
            signTable.getDefaultCell().setBorder(Rectangle.NO_BORDER);

            PdfPCell cellA = new PdfPCell();
            cellA.setBorder(Rectangle.NO_BORDER);
            cellA.setHorizontalAlignment(Element.ALIGN_CENTER);

            Paragraph titleA = new Paragraph("ĐẠI DIỆN BÊN CHO THUÊ", fBodyBold);
            titleA.setAlignment(Element.ALIGN_CENTER);
            cellA.addElement(titleA);

            Paragraph noteA = new Paragraph("(Ký, ghi rõ họ tên)", fSmallItalic);
            noteA.setAlignment(Element.ALIGN_CENTER);
            noteA.setSpacingAfter(45);
            cellA.addElement(noteA);

            Paragraph nameA = new Paragraph(nguoiKyA, fBodyBold);
            nameA.setAlignment(Element.ALIGN_CENTER);
            cellA.addElement(nameA);

            PdfPCell cellB = new PdfPCell();
            cellB.setBorder(Rectangle.NO_BORDER);
            cellB.setHorizontalAlignment(Element.ALIGN_CENTER);

            Paragraph titleB = new Paragraph("BÊN THUÊ", fBodyBold);
            titleB.setAlignment(Element.ALIGN_CENTER);
            cellB.addElement(titleB);

            Paragraph noteB = new Paragraph("(Ký, ghi rõ họ tên)", fSmallItalic);
            noteB.setAlignment(Element.ALIGN_CENTER);
            noteB.setSpacingAfter(45);
            cellB.addElement(noteB);

            Paragraph nameB = new Paragraph(hoTenB, fBodyBold);
            nameB.setAlignment(Element.ALIGN_CENTER);
            cellB.addElement(nameB);

            signTable.addCell(cellA);
            signTable.addCell(cellB);
            document.add(signTable);

            // Ghi nhận ký nếu có
            if (hoSo != null && (hoSo.ngayKy() != null || hoSo.thoiDiemGhiNhanKy() != null)) {
                StringBuilder sbKy = new StringBuilder();
                if (hoSo.ngayKy() != null) {
                    sbKy.append("Ngày ký hợp đồng: ").append(hoSo.ngayKy().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
                }
                if (hoSo.thoiDiemGhiNhanKy() != null) {
                    if (sbKy.length() > 0) sbKy.append(" — ");
                    sbKy.append("Ghi nhận trên hệ thống lúc: ").append(hoSo.thoiDiemGhiNhanKy().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
                }
                if (hoSo.ghiChuKy() != null && !hoSo.ghiChuKy().isBlank()) {
                    sbKy.append(" (").append(hoSo.ghiChuKy()).append(")");
                }
                Paragraph ghiNhan = new Paragraph(sbKy.toString(), fSmallItalic);
                ghiNhan.setAlignment(Element.ALIGN_CENTER);
                ghiNhan.setSpacingBefore(10);
                document.add(ghiNhan);
            }

            document.close();
            return output.toByteArray();
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception exception) {
            throw new IllegalStateException("Không thể xuất PDF hợp đồng", exception);
        }
    }

    private static void addHeaderCell(PdfPTable table, Font font, String text) {
        PdfPCell c = new PdfPCell(new Phrase(text, font));
        c.setBackgroundColor(new Color(243, 244, 246));
        c.setHorizontalAlignment(Element.ALIGN_CENTER);
        c.setPadding(4);
        table.addCell(c);
    }

    private static void addBodyCell(PdfPTable table, Font font, String text, int align) {
        PdfPCell c = new PdfPCell(new Phrase(text != null ? text : "", font));
        c.setHorizontalAlignment(align);
        c.setPadding(3);
        table.addCell(c);
    }

    private static void addRow(PdfPTable table, Font fKey, Font fVal, String key, String val) {
        PdfPCell c1 = new PdfPCell(new Phrase(key, fKey));
        c1.setBorder(Rectangle.NO_BORDER);
        c1.setPadding(3);
        table.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Phrase(val != null ? val : "", fVal));
        c2.setBorder(Rectangle.NO_BORDER);
        c2.setPadding(3);
        table.addCell(c2);
    }

    private static String money(String value) {
        if (value == null || value.isBlank()) return "0 đ";
        try {
            return NumberFormat.getNumberInstance(Locale.forLanguageTag("vi-VN")).format(new BigDecimal(value)) + " đ";
        } catch (Exception e) {
            return value + " đ";
        }
    }

    static class FooterPageEvent extends PdfPageEventHelper {
        private final BaseFont font;
        private final String maHopDong;
        private final boolean isDraft;

        FooterPageEvent(BaseFont font, String maHopDong, boolean isDraft) {
            this.font = font;
            this.maHopDong = maHopDong;
            this.isDraft = isDraft;
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            PdfContentByte cb = writer.getDirectContent();
            cb.beginText();
            cb.setFontAndSize(font, 8.5f);
            cb.setColorFill(new Color(120, 120, 120));

            // Footer
            float footerY = 20;
            cb.showTextAligned(PdfContentByte.ALIGN_LEFT, "Hợp đồng " + maHopDong, document.left(), footerY, 0);
            cb.showTextAligned(PdfContentByte.ALIGN_RIGHT, "Trang " + writer.getPageNumber(), document.right(), footerY, 0);

            // Draft alert on top
            if (isDraft) {
                cb.setFontAndSize(font, 8.5f);
                cb.setColorFill(new Color(180, 40, 40));
                cb.showTextAligned(PdfContentByte.ALIGN_CENTER, "[DỰ THẢO - CHƯA CÓ GIÁ TRỊ PHÁP LÝ]", (document.left() + document.right()) / 2, document.top() + 15, 0);
            }

            cb.endText();
        }
    }
}
