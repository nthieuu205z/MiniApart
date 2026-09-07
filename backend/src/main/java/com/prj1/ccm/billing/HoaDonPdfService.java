package com.prj1.ccm.billing;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.PageSize;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.prj1.ccm.billing.calc.TrangThaiHoaDon;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Objects;

@Service
public class HoaDonPdfService {
    private static final String THONG_BAO_HOA_DON_NHAP = "Chỉ hoá đơn đã phát hành mới được xuất PDF.";
    private static final BaseFont PHONG_CHU_TIENG_VIET = taiPhongChuTiengViet();

    private final HoaDonChiTietService hoaDonChiTietService;
    private final ThanhToanPdfRepository thanhToanPdfRepository;
    private final PhanQuyenToaService phanQuyenToaService;
    private final DinhDangChungTu dinhDang;

    public HoaDonPdfService(
            HoaDonChiTietService hoaDonChiTietService,
            ThanhToanPdfRepository thanhToanPdfRepository,
            PhanQuyenToaService phanQuyenToaService,
            DinhDangChungTu dinhDang
    ) {
        this.hoaDonChiTietService = hoaDonChiTietService;
        this.thanhToanPdfRepository = thanhToanPdfRepository;
        this.phanQuyenToaService = phanQuyenToaService;
        this.dinhDang = dinhDang;
    }

    /** FR-INV-09 exports a published invoice with all hand-recomputable lines and tier rows. */
    public byte[] xuatHoaDon(Long toaNhaId, Long kyId, Long hoaDonId, NguoiDung nguoiDung) {
        ThongTinHoaDonChiTiet hoaDon = hoaDonChiTietService.chiTietKhongAnhKy(toaNhaId, kyId, hoaDonId, nguoiDung);
        if (TrangThaiHoaDon.NHAP.name().equals(hoaDon.trangThai())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_HOA_DON_NHAP);
        }
        return taoPdf(document -> vietHoaDon(document, hoaDon));
    }

    /** FR-INV-13 exports an immutable payment receipt and explicitly labels counter-entries. */
    public byte[] xuatBienLai(Long thanhToanId, NguoiDung nguoiDung) {
        kiemTraVaiTroXuatBienLai(nguoiDung);
        BienLaiPdfDuLieu bienLai = thanhToanPdfRepository.find(thanhToanId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        kiemTraQuyenXuatBienLai(nguoiDung, bienLai);
        return taoPdf(document -> vietBienLai(document, bienLai));
    }

    private void vietHoaDon(Document document, ThongTinHoaDonChiTiet hoaDon) throws DocumentException, IOException {
        document.add(tieuDe("HÓA ĐƠN " + hoaDon.maHoaDon()));
        document.add(doan("Phòng: " + hoaDon.soPhong() + "    Người thuê: " + hoaDon.nguoiThue()));
        document.add(doan("Ngày phát hành: " + dinhDang.ngay(hoaDon.ngayPhatHanh()) + "    Hạn thanh toán: " + dinhDang.ngay(hoaDon.hanThanhToan())));
        document.add(doan("Trạng thái: " + hoaDon.trangThai()));
        if (hoaDon.soNguoiO() != null) {
            document.add(doan("Số người ở dùng để tính: " + hoaDon.soNguoiO() + " người"
                    + (hoaDon.soHoQuyDoi() == null ? "" : "    Số hộ: " + hoaDon.soHoQuyDoi() + " hộ quy đổi")));
        }
        if (hoaDon.giaiThichSoHo() != null) {
            document.add(doan("Giải thích số hộ: " + hoaDon.giaiThichSoHo()));
        }
        document.add(khoangTrang());

        PdfPTable bang = new PdfPTable(8);
        bang.setWidths(new int[]{17, 9, 9, 8, 12, 13, 20, 12});
        bang.setWidthPercentage(100);
        for (String cot : new String[]{"Khoản mục", "Chỉ số đầu", "Chỉ số cuối", "Số lượng", "Đơn giá", "Thành tiền", "Diễn giải", "Lý do"}) {
            bang.addCell(oTieuDe(cot));
        }
        for (ThongTinDongHoaDon dong : hoaDon.cacDong()) {
            bang.addCell(o(dong.tenKhoan()));
            bang.addCell(o(dong.chiSoDau()));
            bang.addCell(o(dong.chiSoCuoi()));
            bang.addCell(o(dong.soLuong()));
            bang.addCell(oTien(dong.donGia()));
            bang.addCell(oTien(dong.thanhTien()));
            bang.addCell(o(dong.dienGiai()));
            bang.addCell(o(dong.lyDo()));
            for (ThongTinBacHoaDon bac : dong.cacBac()) {
                PdfPCell bacCell = o("Bậc " + bac.bac()
                        + " — Từ: " + giaTri(bac.tuSoLuong())
                        + " — Đến: " + giaTri(bac.denSoLuong())
                        + " — Định mức quy đổi: " + giaTri(bac.dinhMucQuyDoi())
                        + " — Số lượng: " + giaTri(bac.soLuong())
                        + " — Đơn giá: " + dinhDang.tien(bac.donGia())
                        + " — Thành tiền: " + dinhDang.tien(bac.thanhTien()));
                bacCell.setColspan(8);
                bang.addCell(bacCell);
            }
        }
        document.add(bang);
        document.add(khoangTrang());
        document.add(doanDam("Tổng cộng: " + dinhDang.tien(hoaDon.tongTien())));
        document.add(doanDam("Đã thu: " + dinhDang.tien(hoaDon.daThu()) + "    Còn lại: " + dinhDang.tien(hoaDon.conLai())));
    }

    private void vietBienLai(Document document, BienLaiPdfDuLieu bienLai) throws DocumentException, IOException {
        boolean laDoiUng = "DOI_UNG".equals(bienLai.loai());
        document.add(tieuDe(laDoiUng ? "BIÊN LAI ĐIỀU CHỈNH" : "BIÊN LAI THANH TOÁN"));
        document.add(doan("Mã biên lai: " + bienLai.maBienLai()));
        document.add(doan("Hóa đơn: " + bienLai.maHoaDon()));
        document.add(doanDam("Số tiền: " + dinhDang.tien(bienLai.soTien())));
        if (laDoiUng) {
            document.add(doan("Hình thức: Điều chỉnh đối ứng"));
            document.add(doan("Ngày thu: " + dinhDang.ngay(bienLai.thoiDiemTao().toLocalDate())));
            document.add(doanDam("Lý do điều chỉnh: " + bienLai.lyDo()));
        } else {
            document.add(doan("Hình thức: " + tenHinhThuc(bienLai.hinhThuc())));
            document.add(doan("Ngày thu: " + dinhDang.ngay(bienLai.ngayThu())));
        }
        document.add(doan("Người thu: " + (bienLai.nguoiThu() == null ? "Không lưu" : bienLai.nguoiThu())));
    }

    private byte[] taoPdf(NoiDungPdf noiDung) {
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 42, 42);
            PdfWriter.getInstance(document, output);
            document.open();
            noiDung.viet(document);
            document.close();
            return output.toByteArray();
        } catch (DocumentException | IOException exception) {
            throw new IllegalStateException("Khong the tao PDF", exception);
        }
    }

    private Font font(int size, int style) {
        return new Font(PHONG_CHU_TIENG_VIET, size, style);
    }

    private Paragraph tieuDe(String value) {
        Paragraph paragraph = new Paragraph(value, font(16, Font.BOLD));
        paragraph.setAlignment(Element.ALIGN_CENTER);
        return paragraph;
    }

    private Paragraph doan(String value) {
        return new Paragraph(value, font(10, Font.NORMAL));
    }

    private Paragraph doanDam(String value) {
        return new Paragraph(value, font(11, Font.BOLD));
    }

    private Paragraph khoangTrang() {
        return new Paragraph(" ", font(5, Font.NORMAL));
    }

    private PdfPCell o(String value) {
        return new PdfPCell(new Phrase(value == null ? "—" : value, font(8, Font.NORMAL)));
    }

    private PdfPCell oTien(String value) {
        PdfPCell cell = o(value == null ? null : dinhDang.tien(value));
        cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        return cell;
    }

    private PdfPCell oTieuDe(String value) {
        PdfPCell cell = new PdfPCell(new Phrase(value, font(8, Font.BOLD)));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        return cell;
    }

    private String giaTri(String value) {
        return value == null ? "Không giới hạn" : value;
    }

    private String tenHinhThuc(String value) {
        if (value == null) return "Không lưu";
        return switch (value) {
            case "TIEN_MAT" -> "Tiền mặt";
            case "CHUYEN_KHOAN" -> "Chuyển khoản";
            default -> value;
        };
    }

    private void kiemTraQuyenXuatBienLai(NguoiDung nguoiDung, BienLaiPdfDuLieu bienLai) {
        if (nguoiDung.vaiTro() == VaiTro.NGUOI_THUE) {
            if (!Objects.equals(nguoiDung.nguoiThueId(), bienLai.nguoiThueId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            }
            return;
        }

        if (nguoiDung.vaiTro() == VaiTro.CHU || nguoiDung.vaiTro() == VaiTro.QUAN_LY) {
            phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, bienLai.toaNhaId());
        }
    }

    private void kiemTraVaiTroXuatBienLai(NguoiDung nguoiDung) {
        if (nguoiDung == null || (nguoiDung.vaiTro() != VaiTro.CHU
                && nguoiDung.vaiTro() != VaiTro.QUAN_LY
                && nguoiDung.vaiTro() != VaiTro.NGUOI_THUE)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private static BaseFont taiPhongChuTiengViet() {
        try (InputStream fontStream = BaseFont.getResourceStream("liberation/LiberationSans-Regular.ttf")) {
            if (fontStream == null) {
                throw new IllegalStateException("Khong tim thay phong chu tieng Viet tren classpath");
            }
            return BaseFont.createFont(
                    "LiberationSans-Regular.ttf",
                    BaseFont.IDENTITY_H,
                    BaseFont.EMBEDDED,
                    BaseFont.NOT_CACHED,
                    fontStream.readAllBytes(),
                    null
            );
        } catch (DocumentException | IOException exception) {
            throw new ExceptionInInitializerError(exception);
        }
    }

    @FunctionalInterface
    private interface NoiDungPdf {
        void viet(Document document) throws DocumentException, IOException;
    }
}
