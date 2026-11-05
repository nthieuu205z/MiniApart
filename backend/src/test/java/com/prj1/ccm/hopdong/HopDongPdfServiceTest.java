package com.prj1.ccm.hopdong;

import com.lowagie.text.pdf.PdfReader;
import com.lowagie.text.pdf.parser.PdfTextExtractor;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.TrangThaiNguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.toanha.MauHopDongChuan;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class HopDongPdfServiceTest {

    @Mock
    private HopDongService hopDongService;

    private HopDongPdfService pdfService;
    private NguoiDung quanLy;

    @BeforeEach
    void setUp() {
        pdfService = new HopDongPdfService(
                hopDongService,
                "HỢP ĐỒNG THUÊ PHÒNG",
                "Điều khoản mẫu mặc định của toà nhà."
        );
        quanLy = new NguoiDung(3L, "Quản lý tòa nhà", "0900000003", "hash", VaiTro.QUAN_LY, TrangThaiNguoiDung.HOAT_DONG, 0, null);
    }

    private String trichXuatVanBanPdf(byte[] pdfBytes) throws IOException {
        PdfReader reader = new PdfReader(pdfBytes);
        PdfTextExtractor extractor = new PdfTextExtractor(reader);
        StringBuilder sb = new StringBuilder();
        for (int i = 1; i <= reader.getNumberOfPages(); i++) {
            sb.append(extractor.getTextFromPage(i)).append("\n");
        }
        reader.close();
        return sb.toString();
    }

    @Test
    void xuatPdf_banDraft_coCanhBaoDuThaoVaKhongPhapLy() throws Exception {
        Long hopDongId = 100L;
        ThongTinHopDong contract = new ThongTinHopDong(
                hopDongId, 101L, "101", 10L, "Trần Văn B",
                LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1), "4500000.00", "4500000.00", 30,
                "CHO_KY", "Chờ ký", false, 365,
                List.of(new ThongTinHopDongDichVu(1L, "Điện", "3500.00", "CO_DINH")),
                null
        );
        when(hopDongService.chiTiet(eq(hopDongId), eq(quanLy))).thenReturn(contract);

        HopDongHoSoDto draftHoSo = new HopDongHoSoDto(
                1L, hopDongId, 1, "DRAFT", null, 1, "HỢP ĐỒNG THUÊ PHÒNG DỰ THẢO",
                LocalDate.of(2026, 11, 1), "Hà Nội", "Để ở", "Phạm vi sử dụng", LocalDate.of(2026, 11, 1),
                "CHUYEN_KHOAN", 1, 5, "123456", "Thỏa thuận", null,
                "CA_NHAN", "Chủ nhà", "001090123456", "Hà Nội", "0912345678", null,
                "Chủ nhà", "Chủ sở hữu", "CHU_SO_HUU", null, null,
                "Trần Văn B", LocalDate.of(1995, 5, 20), "CCCD", "001200009999", LocalDate.of(2021, 5, 10),
                "Cục CS", "Hà Nội", "Hà Nội", "0987654321", null,
                "Toà nhà MiniApart", "Hà Nội", "101", 1, new BigDecimal("25.0"),
                "Điều khoản hợp đồng dự thảo", "[]", "[]", null,
                null, null, null, null, null, null, null,
                null, null,
                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), new BigDecimal("4500000.00"),
                LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1), 30, "CHO_KY",
                List.of(), List.of(), false
        );
        when(hopDongService.layHoSoHopDong(eq(hopDongId), eq(quanLy))).thenReturn(draftHoSo);

        byte[] pdfBytes = pdfService.xuat(hopDongId, quanLy);
        assertThat(pdfBytes).isNotEmpty();

        String text = trichXuatVanBanPdf(pdfBytes);
        assertThat(text).contains("DỰ THẢO - CHƯA CÓ GIÁ TRỊ PHÁP LÝ");
        assertThat(text).contains("Trần Văn B");
        assertThat(text).contains("4.500.000 đ");
    }

    @Test
    void xuatPdf_banDaChot_hienThiSnapshotBacThangPhuLucTaiSanVaNgayKyThucTe() throws Exception {
        Long hopDongId = 100L;
        // Dữ liệu hợp đồng động hiện thời có dịch vụ bị xóa hoặc thay đổi, nhưng snapshot hồ sơ đã chốt phải bảo toàn
        ThongTinHopDong liveContract = new ThongTinHopDong(
                hopDongId, 101L, "101", 10L, "Trần Văn B",
                LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1), "4500000.00", "4500000.00", 30,
                "HIEU_LUC", "Hiệu lực", false, 365,
                List.of(), // Live rỗng
                null
        );
        when(hopDongService.chiTiet(eq(hopDongId), eq(quanLy))).thenReturn(liveContract);

        // Snapshot JSON đóng băng biểu giá bậc thang và đơn giá 0
        String snapshotDichVu = """
                [
                    {
                        "dichVuId": 1,
                        "tenDichVu": "Điện sinh hoạt",
                        "cachTinh": "CONG_TO",
                        "cheDoGia": "BAC_THANG",
                        "donVi": "kWh",
                        "donGiaApDung": 0,
                        "cacBacThang": [
                            {"bac": 1, "tuChiSo": 0, "denChiSo": 50, "donGia": 1800.00, "tyLe": 1.0},
                            {"bac": 2, "tuChiSo": 51, "denChiSo": 100, "donGia": 2100.00, "tyLe": 1.0},
                            {"bac": 3, "tuChiSo": 101, "denChiSo": null, "donGia": 2500.00, "tyLe": 1.0}
                        ]
                    },
                    {
                        "dichVuId": 2,
                        "tenDichVu": "Internet cáp quang",
                        "cachTinh": "CO_DINH",
                        "cheDoGia": "CO_DINH",
                        "donVi": "phòng",
                        "donGiaApDung": 0.00,
                        "cacBacThang": []
                    }
                ]
                """;

        // Snapshot tài sản bàn giao kèm phòng
        String snapshotTaiSan = """
                [
                    {
                        "taiSanId": 10,
                        "tenTaiSan": "Điều hoà Panasonic 9000BTU",
                        "soLuong": 1,
                        "tinhTrangLucGiao": "Mới 100%, làm lạnh tốt",
                        "ghiChu": "Kèm điều khiển từ xa"
                    },
                    {
                        "taiSanId": 11,
                        "tenTaiSan": "Bình nóng lạnh Rossi 20L",
                        "soLuong": 1,
                        "tinhTrangLucGiao": "Hoạt động tốt",
                        "ghiChu": ""
                    }
                ]
                """;

        HopDongHoSoDto sealedHoSo = new HopDongHoSoDto(
                1L, hopDongId, 1, "DA_GHI_NHAN_KY", null, 1, "HỢP ĐỒNG THUÊ PHÒNG CHÍNH THỨC",
                LocalDate.of(2026, 11, 1), "Hà Nội", "Để ở", "Sử dụng riêng diện tích phòng", LocalDate.of(2026, 11, 1),
                "CHUYEN_KHOAN", 1, 5, "123456789 - VCB", "Thỏa thuận", 10L,
                "CA_NHAN", "Công ty TNHH Quản lý Toà nhà", "0109999999", "123 Cầu Giấy, Hà Nội", "0912345678", "contact@miniapart.vn",
                "Nguyễn Văn Chủ", "Giám đốc", "DAI_DIEN_PHAP_LUAT", null, null,
                "Trần Văn B", LocalDate.of(1995, 5, 20), "CCCD", "001200009999", LocalDate.of(2021, 5, 10),
                "Cục CSQLHC về TTXH", "Hà Nội", "Hà Nội", "0987654321", "b@gmail.com",
                "Toà nhà MiniApart Cầu Giấy", "123 Cầu Giấy, Hà Nội", "101", 1, new BigDecimal("28.5"),
                "Điều khoản pháp lý chặt chẽ đã ký kết.",
                snapshotDichVu,
                snapshotTaiSan,
                "[]",
                1L, LocalDateTime.of(2026, 11, 1, 15, 30),
                1L,
                LocalDate.of(2026, 11, 2), // Ngày ký thực tế trên giấy
                LocalDateTime.of(2026, 11, 2, 9, 15), // Thời điểm ghi nhận hệ thống
                "Ký kết trực tiếp tại toà nhà",
                "hopdong_scan_101.pdf",
                LocalDateTime.of(2026, 11, 1, 10, 0), LocalDateTime.of(2026, 11, 2, 9, 15),
                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), new BigDecimal("4500000.00"),
                LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1), 30, "HIEU_LUC",
                List.of(), List.of(), true
        );
        when(hopDongService.layHoSoHopDong(eq(hopDongId), eq(quanLy))).thenReturn(sealedHoSo);

        byte[] pdfBytes = pdfService.xuat(hopDongId, quanLy);
        assertThat(pdfBytes).isNotEmpty();

        String text = trichXuatVanBanPdf(pdfBytes);

        // 1. Bản chính thức không có banner dự thảo
        assertThat(text).doesNotContain("DỰ THẢO - CHƯA CÓ GIÁ TRỊ PHÁP LÝ");

        // 2. Chứa đầy đủ thông tin dịch vụ bậc thang từ snapshot
        assertThat(text).contains("Điện sinh hoạt (Biểu giá bậc thang)");
        assertThat(text).contains("1.800 đ / kWh");
        assertThat(text).contains("2.100 đ / kWh");
        assertThat(text).contains("2.500 đ / kWh");

        // 3. Đơn giá 0đ hiển thị là Miễn phí (0 đ)
        assertThat(text).contains("Internet cáp quang: Miễn phí (0 đ)");

        // 4. Có phụ lục bàn giao trang thiết bị kèm theo phòng
        assertThat(text).contains("PHỤ LỤC: DANH MỤC TRANG THIẾT BỊ BÀN GIAO KÈM THEO PHÒNG");
        assertThat(text).contains("Điều hoà Panasonic 9000BTU");
        assertThat(text).contains("Mới 100%, làm lạnh tốt");
        assertThat(text).contains("Bình nóng lạnh Rossi 20L");

        // 5. Hiển thị ngày ký thực tế riêng biệt với thời điểm ghi nhận trên hệ thống
        assertThat(text).contains("Ngày ký hợp đồng: 02/11/2026");
        assertThat(text).contains("Ghi nhận trên hệ thống lúc: 02/11/2026 09:15");
        assertThat(text).contains("Ký kết trực tiếp tại toà nhà");
    }

    @Test
    void xuatPdf_daChot_suaDuLieuSong_vanBanCamKetBatBien() throws Exception {
        Long hopDongId = 100L;
        // Dữ liệu sống bị sửa đổi: số phòng đổi thành 999, cọc thực thu = 0, người thuê sửa tên
        ThongTinHopDong modifiedLiveContract = new ThongTinHopDong(
                hopDongId, 999L, "999", 99L, "Người Thuê Đã Đổi Tên",
                LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1), "4500000.00", "4500000.00", 30,
                "HIEU_LUC", "Hiệu lực", false, 365,
                List.of(),
                null
        );
        when(hopDongService.chiTiet(eq(hopDongId), eq(quanLy))).thenReturn(modifiedLiveContract);

        // Snapshot bất biến của hồ sơ đã chốt
        HopDongHoSoDto sealedHoSo = new HopDongHoSoDto(
                1L, hopDongId, 1, "DA_CHOT", null, 1, "HỢP ĐỒNG THUÊ PHÒNG BẤT BIẾN",
                LocalDate.of(2026, 11, 1), "Hà Nội", "Để ở", "Sử dụng riêng", LocalDate.of(2026, 11, 1),
                "CHUYEN_KHOAN", 1, 5, "123456", "Thỏa thuận", null,
                "CA_NHAN", "Chủ nhà", "001090123456", "Hà Nội", "0912345678", null,
                "Chủ nhà", "Chủ sở hữu", "CHU_SO_HUU", null, null,
                "Trần Văn B Gốc", LocalDate.of(1995, 5, 20), "CCCD", "001200009999", LocalDate.of(2021, 5, 10),
                "Cục CS", "Hà Nội", "Hà Nội", "0987654321", null,
                "Toà nhà MiniApart", "Hà Nội", "101", 1, new BigDecimal("25.0"),
                "Điều khoản cam kết bất biến.",
                "[{\"dichVuId\":1,\"tenDichVu\":\"Điện\",\"cachTinh\":\"CONG_TO\",\"cheDoGia\":\"CO_DINH\",\"donVi\":\"kWh\",\"donGiaApDung\":3500.00,\"cacBacThang\":[]}]",
                "[]",
                "[{\"hoTenNguoiThue\":\"Nguyễn Ở Cùng\",\"quanHe\":\"Bạn\"}]",
                1L, LocalDateTime.of(2026, 11, 1, 10, 0),
                null, null, null, null, null,
                null, null,
                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), BigDecimal.ZERO, // cọc thực thu sống = 0
                LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1), 30, "HIEU_LUC",
                List.of(new ThongTinNguoiOCung(1L, hopDongId, 99L, "Nguyễn Ở Cùng", "Bạn", null, null)), List.of(), true
        );
        when(hopDongService.layHoSoHopDong(eq(hopDongId), eq(quanLy))).thenReturn(sealedHoSo);

        byte[] pdfBytes = pdfService.xuat(hopDongId, quanLy);
        String text = trichXuatVanBanPdf(pdfBytes);

        // Bảo toàn dữ liệu cam kết trong snapshot:
        assertThat(text).contains("Phòng 101");
        assertThat(text).doesNotContain("Phòng 999");
        assertThat(text).contains("Trần Văn B Gốc");
        assertThat(text).doesNotContain("Người Thuê Đã Đổi Tên");
        assertThat(text).contains("Nguyễn Ở Cùng (Bạn)");
        assertThat(text).contains("Tiền cọc thoả thuận:");
        assertThat(text).contains("4.500.000 đ");
    }

    @Test
    void xuatPdf_daChot_snapshotDichVuRong_xuatThanhCongVaHienThiKhongCoDichVu() throws Exception {
        Long hopDongId = 100L;
        ThongTinHopDong contract = new ThongTinHopDong(
                hopDongId, 101L, "101", 10L, "Trần Văn B",
                LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1), "4500000.00", "4500000.00", 30,
                "HIEU_LUC", "Hiệu lực", false, 365, List.of(), null
        );
        when(hopDongService.chiTiet(eq(hopDongId), eq(quanLy))).thenReturn(contract);

        HopDongHoSoDto sealedHoSo = new HopDongHoSoDto(
                1L, hopDongId, 1, "DA_CHOT", null, 1, "HỢP ĐỒNG THUÊ PHÒNG",
                LocalDate.of(2026, 11, 1), "Hà Nội", "Để ở", "Phạm vi", LocalDate.of(2026, 11, 1),
                "CHUYEN_KHOAN", 1, 5, "123456", "Thỏa thuận", null,
                "CA_NHAN", "Chủ", "001090123456", "Hà Nội", "0912345678", null,
                "Chủ", "Chủ sở hữu", "CHU_SO_HUU", null, null,
                "Khách", LocalDate.of(1995, 1, 1), "CCCD", "001200001111", LocalDate.of(2021, 1, 1),
                "Cục CS", "HN", "HN", "0912345678", null,
                "Toà", "HN", "101", 1, new BigDecimal("25.0"),
                "Điều khoản",
                "[]", // Snapshot rỗng là hợp lệ!
                "[]", "[]",
                1L, LocalDateTime.now(), null, null, null, null, null,
                null, null,
                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), new BigDecimal("4500000.00"),
                LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1), 30, "HIEU_LUC",
                List.of(), List.of(), true
        );
        when(hopDongService.layHoSoHopDong(eq(hopDongId), eq(quanLy))).thenReturn(sealedHoSo);

        byte[] pdfBytes = pdfService.xuat(hopDongId, quanLy);
        assertThat(pdfBytes).isNotEmpty();
        String text = trichXuatVanBanPdf(pdfBytes);
        assertThat(text).contains("Không có dịch vụ tính phí riêng theo hợp đồng.");
    }

    @Test
    void xuatPdf_daChot_snapshotDichVuNull_nemIllegalStateException() {
        Long hopDongId = 100L;
        ThongTinHopDong contract = new ThongTinHopDong(
                hopDongId, 101L, "101", 10L, "Trần Văn B",
                LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1), "4500000.00", "4500000.00", 30,
                "HIEU_LUC", "Hiệu lực", false, 365, List.of(), null
        );
        when(hopDongService.chiTiet(eq(hopDongId), eq(quanLy))).thenReturn(contract);

        HopDongHoSoDto sealedHoSo = new HopDongHoSoDto(
                1L, hopDongId, 1, "DA_CHOT", null, 1, "HỢP ĐỒNG THUÊ PHÒNG",
                LocalDate.of(2026, 11, 1), "Hà Nội", "Để ở", "Phạm vi", LocalDate.of(2026, 11, 1),
                "CHUYEN_KHOAN", 1, 5, "123456", "Thỏa thuận", null,
                "CA_NHAN", "Chủ", "001090123456", "Hà Nội", "0912345678", null,
                "Chủ", "Chủ sở hữu", "CHU_SO_HUU", null, null,
                "Khách", LocalDate.of(1995, 1, 1), "CCCD", "001200001111", LocalDate.of(2021, 1, 1),
                "Cục CS", "HN", "HN", "0912345678", null,
                "Toà", "HN", "101", 1, new BigDecimal("25.0"),
                "Điều khoản",
                null, // Snapshot dịch vụ null
                "[]", "[]",
                1L, LocalDateTime.now(), null, null, null, null, null,
                null, null,
                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), new BigDecimal("4500000.00"),
                LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1), 30, "HIEU_LUC",
                List.of(), List.of(), true
        );
        when(hopDongService.layHoSoHopDong(eq(hopDongId), eq(quanLy))).thenReturn(sealedHoSo);

        assertThatThrownBy(() -> pdfService.xuat(hopDongId, quanLy))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("thiếu dữ liệu snapshot dịch vụ");
    }

    @Test
    void xuatPdf_daChot_snapshotDichVuKhongPhaiDanhSach_nemIllegalStateException() {
        Long hopDongId = 100L;
        ThongTinHopDong contract = new ThongTinHopDong(
                hopDongId, 101L, "101", 10L, "Trần Văn B",
                LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1), "4500000.00", "4500000.00", 30,
                "HIEU_LUC", "Hiệu lực", false, 365, List.of(), null
        );
        when(hopDongService.chiTiet(eq(hopDongId), eq(quanLy))).thenReturn(contract);

        HopDongHoSoDto sealedHoSo = new HopDongHoSoDto(
                1L, hopDongId, 1, "DA_CHOT", null, 1, "HỢP ĐỒNG THUÊ PHÒNG",
                LocalDate.of(2026, 11, 1), "Hà Nội", "Để ở", "Phạm vi", LocalDate.of(2026, 11, 1),
                "CHUYEN_KHOAN", 1, 5, "123456", "Thỏa thuận", null,
                "CA_NHAN", "Chủ", "001090123456", "Hà Nội", "0912345678", null,
                "Chủ", "Chủ sở hữu", "CHU_SO_HUU", null, null,
                "Khách", LocalDate.of(1995, 1, 1), "CCCD", "001200001111", LocalDate.of(2021, 1, 1),
                "Cục CS", "HN", "HN", "0912345678", null,
                "Toà", "HN", "101", 1, new BigDecimal("25.0"),
                "Điều khoản",
                "{}", // Object thay vì Array
                "[]", "[]",
                1L, LocalDateTime.now(), null, null, null, null, null,
                null, null,
                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), new BigDecimal("4500000.00"),
                LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1), 30, "HIEU_LUC",
                List.of(), List.of(), true
        );
        when(hopDongService.layHoSoHopDong(eq(hopDongId), eq(quanLy))).thenReturn(sealedHoSo);

        assertThatThrownBy(() -> pdfService.xuat(hopDongId, quanLy))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("sai định dạng (không phải danh sách)");
    }

    @Test
    void xuatPdf_daChot_snapshotDichVuHongJson_nemIllegalStateException() {
        Long hopDongId = 100L;
        ThongTinHopDong contract = new ThongTinHopDong(
                hopDongId, 101L, "101", 10L, "Trần Văn B",
                LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1), "4500000.00", "4500000.00", 30,
                "HIEU_LUC", "Hiệu lực", false, 365, List.of(), null
        );
        when(hopDongService.chiTiet(eq(hopDongId), eq(quanLy))).thenReturn(contract);

        HopDongHoSoDto sealedHoSo = new HopDongHoSoDto(
                1L, hopDongId, 1, "DA_CHOT", null, 1, "HỢP ĐỒNG THUÊ PHÒNG",
                LocalDate.of(2026, 11, 1), "Hà Nội", "Để ở", "Phạm vi", LocalDate.of(2026, 11, 1),
                "CHUYEN_KHOAN", 1, 5, "123456", "Thỏa thuận", null,
                "CA_NHAN", "Chủ", "001090123456", "Hà Nội", "0912345678", null,
                "Chủ", "Chủ sở hữu", "CHU_SO_HUU", null, null,
                "Khách", LocalDate.of(1995, 1, 1), "CCCD", "001200001111", LocalDate.of(2021, 1, 1),
                "Cục CS", "HN", "HN", "0912345678", null,
                "Toà", "HN", "101", 1, new BigDecimal("25.0"),
                "Điều khoản",
                "{invalid_json", // Hỏng JSON
                "[]", "[]",
                1L, LocalDateTime.now(), null, null, null, null, null,
                null, null,
                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), new BigDecimal("4500000.00"),
                LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1), 30, "HIEU_LUC",
                List.of(), List.of(), true
        );
        when(hopDongService.layHoSoHopDong(eq(hopDongId), eq(quanLy))).thenReturn(sealedHoSo);

        assertThatThrownBy(() -> pdfService.xuat(hopDongId, quanLy))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Snapshot dịch vụ của hồ sơ hợp đồng bị lỗi định dạng JSON");
    }

    @Test
    void xuatPdf_daChot_thieuDieuKhoan_nemIllegalStateException() {
        Long hopDongId = 100L;
        ThongTinHopDong contract = new ThongTinHopDong(
                hopDongId, 101L, "101", 10L, "Trần Văn B",
                LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1), "4500000.00", "4500000.00", 30,
                "HIEU_LUC", "Hiệu lực", false, 365, List.of(), null
        );
        when(hopDongService.chiTiet(eq(hopDongId), eq(quanLy))).thenReturn(contract);

        HopDongHoSoDto sealedHoSo = new HopDongHoSoDto(
                1L, hopDongId, 1, "DA_CHOT", null, 1, "HỢP ĐỒNG THUÊ PHÒNG",
                LocalDate.of(2026, 11, 1), "Hà Nội", "Để ở", "Phạm vi", LocalDate.of(2026, 11, 1),
                "CHUYEN_KHOAN", 1, 5, "123456", "Thỏa thuận", null,
                "CA_NHAN", "Chủ", "001090123456", "Hà Nội", "0912345678", null,
                "Chủ", "Chủ sở hữu", "CHU_SO_HUU", null, null,
                "Khách", LocalDate.of(1995, 1, 1), "CCCD", "001200001111", LocalDate.of(2021, 1, 1),
                "Cục CS", "HN", "HN", "0912345678", null,
                "Toà", "HN", "101", 1, new BigDecimal("25.0"),
                "", // Điều khoản rỗng!
                "[{\"dichVuId\":1,\"tenDichVu\":\"Điện\",\"cheDoGia\":\"CO_DINH\",\"donGiaApDung\":3500.00}]",
                "[]", "[]",
                1L, LocalDateTime.now(), null, null, null, null, null,
                null, null,
                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), new BigDecimal("4500000.00"),
                LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1), 30, "HIEU_LUC",
                List.of(), List.of(), true
        );
        when(hopDongService.layHoSoHopDong(eq(hopDongId), eq(quanLy))).thenReturn(sealedHoSo);

        assertThatThrownBy(() -> pdfService.xuat(hopDongId, quanLy))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Hồ sơ hợp đồng đã chốt thiếu điều khoản hợp đồng");
    }

    @Test
    void xuatPdf_daChot_bacThangRongBac_nemIllegalStateException_khongHienThiMienPhi() {
        Long hopDongId = 100L;
        ThongTinHopDong contract = new ThongTinHopDong(
                hopDongId, 101L, "101", 10L, "Trần Văn B",
                LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1), "4500000.00", "4500000.00", 30,
                "HIEU_LUC", "Hiệu lực", false, 365, List.of(), null
        );
        when(hopDongService.chiTiet(eq(hopDongId), eq(quanLy))).thenReturn(contract);

        // Snapshot bậc thang nhưng cacBacThang rỗng -> KHÔNG được fallback thành Miễn phí (0 đ), phải ném lỗi
        String snapshotBacThangRong = """
                [
                    {
                        "dichVuId": 1,
                        "tenDichVu": "Nước sinh hoạt",
                        "cheDoGia": "BAC_THANG",
                        "donVi": "m3",
                        "cacBacThang": []
                    }
                ]
                """;

        HopDongHoSoDto sealedHoSo = new HopDongHoSoDto(
                1L, hopDongId, 1, "DA_CHOT", null, 1, "HỢP ĐỒNG THUÊ PHÒNG",
                LocalDate.of(2026, 11, 1), "Hà Nội", "Để ở", "Phạm vi", LocalDate.of(2026, 11, 1),
                "CHUYEN_KHOAN", 1, 5, "123456", "Thỏa thuận", null,
                "CA_NHAN", "Chủ", "001090123456", "Hà Nội", "0912345678", null,
                "Chủ", "Chủ sở hữu", "CHU_SO_HUU", null, null,
                "Khách", LocalDate.of(1995, 1, 1), "CCCD", "001200001111", LocalDate.of(2021, 1, 1),
                "Cục CS", "HN", "HN", "0912345678", null,
                "Toà", "HN", "101", 1, new BigDecimal("25.0"),
                "Điều khoản",
                snapshotBacThangRong,
                "[]", "[]",
                1L, LocalDateTime.now(), null, null, null, null, null,
                null, null,
                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), new BigDecimal("4500000.00"),
                LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1), 30, "HIEU_LUC",
                List.of(), List.of(), true
        );
        when(hopDongService.layHoSoHopDong(eq(hopDongId), eq(quanLy))).thenReturn(sealedHoSo);

        assertThatThrownBy(() -> pdfService.xuat(hopDongId, quanLy))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("thiếu biểu giá định mức các bậc");
    }

    @Test
    void xuatPdf_daChot_bacThangThieuDonGia_nemIllegalStateException() {
        Long hopDongId = 100L;
        ThongTinHopDong contract = new ThongTinHopDong(
                hopDongId, 101L, "101", 10L, "Trần Văn B",
                LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1), "4500000.00", "4500000.00", 30,
                "HIEU_LUC", "Hiệu lực", false, 365, List.of(), null
        );
        when(hopDongService.chiTiet(eq(hopDongId), eq(quanLy))).thenReturn(contract);

        // Bậc thang có bậc nhưng thiếu donGia
        String snapshotThieuDonGia = """
                [
                    {
                        "dichVuId": 1,
                        "tenDichVu": "Nước sinh hoạt",
                        "cheDoGia": "BAC_THANG",
                        "donVi": "m3",
                        "cacBacThang": [
                            {"bac": 1, "tuSoLuong": 0, "denSoLuong": 10}
                        ]
                    }
                ]
                """;

        HopDongHoSoDto sealedHoSo = new HopDongHoSoDto(
                1L, hopDongId, 1, "DA_CHOT", null, 1, "HỢP ĐỒNG THUÊ PHÒNG",
                LocalDate.of(2026, 11, 1), "Hà Nội", "Để ở", "Phạm vi", LocalDate.of(2026, 11, 1),
                "CHUYEN_KHOAN", 1, 5, "123456", "Thỏa thuận", null,
                "CA_NHAN", "Chủ", "001090123456", "Hà Nội", "0912345678", null,
                "Chủ", "Chủ sở hữu", "CHU_SO_HUU", null, null,
                "Khách", LocalDate.of(1995, 1, 1), "CCCD", "001200001111", LocalDate.of(2021, 1, 1),
                "Cục CS", "HN", "HN", "0912345678", null,
                "Toà", "HN", "101", 1, new BigDecimal("25.0"),
                "Điều khoản",
                snapshotThieuDonGia,
                "[]", "[]",
                1L, LocalDateTime.now(), null, null, null, null, null,
                null, null,
                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), new BigDecimal("4500000.00"),
                LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1), 30, "HIEU_LUC",
                List.of(), List.of(), true
        );
        when(hopDongService.layHoSoHopDong(eq(hopDongId), eq(quanLy))).thenReturn(sealedHoSo);

        assertThatThrownBy(() -> pdfService.xuat(hopDongId, quanLy))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("thiếu đơn giá");
    }

    @Test
    void xuatPdf_daChot_coDinhThieuDonGia_nemIllegalStateException() {
        Long hopDongId = 100L;
        ThongTinHopDong contract = new ThongTinHopDong(
                hopDongId, 101L, "101", 10L, "Trần Văn B",
                LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1), "4500000.00", "4500000.00", 30,
                "HIEU_LUC", "Hiệu lực", false, 365, List.of(), null
        );
        when(hopDongService.chiTiet(eq(hopDongId), eq(quanLy))).thenReturn(contract);

        // Cố định nhưng thiếu donGiaApDung
        String snapshotThieuGia = """
                [
                    {
                        "dichVuId": 2,
                        "tenDichVu": "Vệ sinh",
                        "cheDoGia": "CO_DINH",
                        "donVi": "phòng"
                    }
                ]
                """;

        HopDongHoSoDto sealedHoSo = new HopDongHoSoDto(
                1L, hopDongId, 1, "DA_CHOT", null, 1, "HỢP ĐỒNG THUÊ PHÒNG",
                LocalDate.of(2026, 11, 1), "Hà Nội", "Để ở", "Phạm vi", LocalDate.of(2026, 11, 1),
                "CHUYEN_KHOAN", 1, 5, "123456", "Thỏa thuận", null,
                "CA_NHAN", "Chủ", "001090123456", "Hà Nội", "0912345678", null,
                "Chủ", "Chủ sở hữu", "CHU_SO_HUU", null, null,
                "Khách", LocalDate.of(1995, 1, 1), "CCCD", "001200001111", LocalDate.of(2021, 1, 1),
                "Cục CS", "HN", "HN", "0912345678", null,
                "Toà", "HN", "101", 1, new BigDecimal("25.0"),
                "Điều khoản",
                snapshotThieuGia,
                "[]", "[]",
                1L, LocalDateTime.now(), null, null, null, null, null,
                null, null,
                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), new BigDecimal("4500000.00"),
                LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1), 30, "HIEU_LUC",
                List.of(), List.of(), true
        );
        when(hopDongService.layHoSoHopDong(eq(hopDongId), eq(quanLy))).thenReturn(sealedHoSo);

        assertThatThrownBy(() -> pdfService.xuat(hopDongId, quanLy))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("thiếu đơn giá áp dụng");
    }

    @Test
    void xuatPdf_daChot_thieuSnapshotNguoiOCung_nemIllegalStateException() {
        Long hopDongId = 100L;
        ThongTinHopDong contract = new ThongTinHopDong(
                hopDongId, 101L, "101", 10L, "Trần Văn B",
                LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1), "4500000.00", "4500000.00", 30,
                "HIEU_LUC", "Hiệu lực", false, 365, List.of(), null
        );
        when(hopDongService.chiTiet(eq(hopDongId), eq(quanLy))).thenReturn(contract);

        HopDongHoSoDto sealedHoSo = new HopDongHoSoDto(
                1L, hopDongId, 1, "DA_CHOT", null, 1, "HỢP ĐỒNG THUÊ PHÒNG",
                LocalDate.of(2026, 11, 1), "Hà Nội", "Để ở", "Phạm vi", LocalDate.of(2026, 11, 1),
                "CHUYEN_KHOAN", 1, 5, "123456", "Thỏa thuận", null,
                "CA_NHAN", "Chủ", "001090123456", "Hà Nội", "0912345678", null,
                "Chủ", "Chủ sở hữu", "CHU_SO_HUU", null, null,
                "Khách", LocalDate.of(1995, 1, 1), "CCCD", "001200001111", LocalDate.of(2021, 1, 1),
                "Cục CS", "HN", "HN", "0912345678", null,
                "Toà", "HN", "101", 1, new BigDecimal("25.0"),
                "Điều khoản",
                "[]",
                "[]",
                null, // Thiếu snapshot người ở cùng
                1L, LocalDateTime.now(), null, null, null, null, null,
                null, null,
                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), new BigDecimal("4500000.00"),
                LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1), 30, "HIEU_LUC",
                List.of(), List.of(), true
        );
        when(hopDongService.layHoSoHopDong(eq(hopDongId), eq(quanLy))).thenReturn(sealedHoSo);

        assertThatThrownBy(() -> pdfService.xuat(hopDongId, quanLy))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("thiếu dữ liệu snapshot người ở cùng");
    }

    @Test
    void xuatPdf_daChot_snapshotNguoiOCungKhongPhaiDanhSach_nemIllegalStateException() {
        Long hopDongId = 100L;
        ThongTinHopDong contract = new ThongTinHopDong(
                hopDongId, 101L, "101", 10L, "Trần Văn B",
                LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1), "4500000.00", "4500000.00", 30,
                "HIEU_LUC", "Hiệu lực", false, 365, List.of(), null
        );
        when(hopDongService.chiTiet(eq(hopDongId), eq(quanLy))).thenReturn(contract);

        HopDongHoSoDto sealedHoSo = new HopDongHoSoDto(
                1L, hopDongId, 1, "DA_CHOT", null, 1, "HỢP ĐỒNG THUÊ PHÒNG",
                LocalDate.of(2026, 11, 1), "Hà Nội", "Để ở", "Phạm vi", LocalDate.of(2026, 11, 1),
                "CHUYEN_KHOAN", 1, 5, "123456", "Thỏa thuận", null,
                "CA_NHAN", "Chủ", "001090123456", "Hà Nội", "0912345678", null,
                "Chủ", "Chủ sở hữu", "CHU_SO_HUU", null, null,
                "Khách", LocalDate.of(1995, 1, 1), "CCCD", "001200001111", LocalDate.of(2021, 1, 1),
                "Cục CS", "HN", "HN", "0912345678", null,
                "Toà", "HN", "101", 1, new BigDecimal("25.0"),
                "Điều khoản",
                "[]",
                "[]",
                "\"string_not_array\"", // Non-array
                1L, LocalDateTime.now(), null, null, null, null, null,
                null, null,
                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), new BigDecimal("4500000.00"),
                LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1), 30, "HIEU_LUC",
                List.of(), List.of(), true
        );
        when(hopDongService.layHoSoHopDong(eq(hopDongId), eq(quanLy))).thenReturn(sealedHoSo);

        assertThatThrownBy(() -> pdfService.xuat(hopDongId, quanLy))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("sai định dạng (không phải danh sách)");
    }

    @Test
    void xuatPdf_daTrang_khongDichVu_kiemTraTrucQuanVaGhiTep() throws Exception {
        Long hopDongId = 200L;
        ThongTinHopDong contract = new ThongTinHopDong(
                hopDongId, 101L, "101", 10L, "Trần Văn B",
                LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1), "4500000.00", "4500000.00", 30,
                "HIEU_LUC", "Hiệu lực", false, 365, List.of(), null
        );
        when(hopDongService.chiTiet(eq(hopDongId), eq(quanLy))).thenReturn(contract);

        String dieuKhoanDai = """
                Điều 1. Mục đích và phạm vi sử dụng: Bên thuê sử dụng phòng thuê đúng mục đích để ở, không sử dụng vào các mục đích kinh doanh, tàng trữ hàng cấm, vũ khí hoặc chất gây cháy nổ.
                Điều 2. Giá thuê và phương thức thanh toán: Tiền thuê phòng được thanh toán theo kỳ 1 tháng một lần vào ngày 5 hàng tháng bằng hình thức chuyển khoản. Quá hạn 05 ngày sẽ áp dụng phí phạt chậm nộp.
                Điều 3. Tiền đặt cọc: Bên thuê đặt cọc số tiền tương đương 01 tháng tiền thuê để bảo đảm thực hiện hợp đồng. Tiền cọc sẽ được hoàn trả sau khi thanh lý hợp đồng và cấn trừ các nghĩa vụ còn tồn đọng.
                Điều 4. Trách nhiệm của Bên thuê: Chấp hành nghiêm chỉnh nội quy toà nhà, quy định phòng cháy chữa cháy, bảo vệ tài sản chung, giữ gìn vệ sinh trật tự khu sinh hoạt chung.
                Điều 5. Trách nhiệm của Bên cho thuê: Bàn giao phòng đúng hiện trạng, bảo đảm cung cấp dịch vụ thiết yếu, hỗ trợ đăng ký tạm trú theo quy định của pháp luật.
                Điều 6. Sửa chữa và bảo trì: Bên cho thuê chịu trách nhiệm sửa chữa các hư hỏng kết cấu; Bên thuê chịu chi phí sửa chữa các hỏng hóc phát sinh do quá trình sử dụng cá nhân gây ra.
                Điều 7. Chấm dứt hợp đồng: Mỗi bên có quyền đơn phương chấm dứt hợp đồng nhưng phải thông báo bằng văn bản trước ít nhất 30 ngày. Vi phạm thời hạn báo trước sẽ phải bồi thường tiền cọc.
                Điều 8. Giải quyết tranh chấp: Mọi tranh chấp phát sinh sẽ được ưu tiên giải quyết thông qua thương lượng, hòa giải; nếu không đạt được thỏa thuận sẽ đưa ra Tòa án nhân dân có thẩm quyền.
                Điều 9. Điều khoản thi hành: Hợp đồng có hiệu lực kể từ ngày ký và được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản để thực hiện.
                """;

        String snapshotTaiSan = """
                [
                    {"taiSanId": 1, "tenTaiSan": "Điều hoà Inverter 9000BTU", "soLuong": 1, "tinhTrangLucGiao": "Hoạt động tốt, nguyên tem", "ghiChu": "Kèm điều khiển"},
                    {"taiSanId": 2, "tenTaiSan": "Tủ lạnh 2 cánh Sharp 180L", "soLuong": 1, "tinhTrangLucGiao": "Mới 98%, làm lạnh tốt", "ghiChu": ""},
                    {"taiSanId": 3, "tenTaiSan": "Bình nóng lạnh Ariston 20L", "soLuong": 1, "tinhTrangLucGiao": "Hoạt động bình thường", "ghiChu": ""},
                    {"taiSanId": 4, "tenTaiSan": "Giường gỗ sồi 1m6 x 2m", "soLuong": 1, "tinhTrangLucGiao": "Chắc chắn, kèm đệm", "ghiChu": ""},
                    {"taiSanId": 5, "tenTaiSan": "Bàn làm việc và ghế xoay", "soLuong": 1, "tinhTrangLucGiao": "Tốt", "ghiChu": ""}
                ]
                """;

        HopDongHoSoDto sealedHoSo = new HopDongHoSoDto(
                1L, hopDongId, 1, "DA_GHI_NHAN_KY", null, 1, "HỢP ĐỒNG THUÊ PHÒNG NGUYÊN BẢN",
                LocalDate.of(2026, 11, 1), "Hà Nội", "Để ở", "Sử dụng riêng diện tích phòng", LocalDate.of(2026, 11, 1),
                "CHUYEN_KHOAN", 1, 5, "123456789 - VCB", "Thỏa thuận", 10L,
                "TO_CHUC", "Công ty Cổ phần Quản lý MiniApart", "0108888888", "Tầng 5, Toà nhà MiniApart, Cầu Giấy, Hà Nội", "0912345678", "contact@miniapart.vn",
                "Nguyễn Văn Chủ", "Tổng Giám Đốc", "DAI_DIEN_PHAP_LUAT", null, null,
                "Trần Văn B", LocalDate.of(1995, 5, 20), "CCCD", "001200009999", LocalDate.of(2021, 5, 10),
                "Cục CSQLHC về TTXH", "Hà Nội", "Hà Nội", "0987654321", "b@gmail.com",
                "Toà nhà MiniApart Cầu Giấy", "Số 12 ngõ 34 Cầu Giấy, Hà Nội", "101", 1, new BigDecimal("28.5"),
                dieuKhoanDai,
                "[]", // KHÔNG CÓ DỊCH VỤ TÍNH PHÍ RIÊNG
                snapshotTaiSan,
                "[]", // KHÔNG CÓ NGƯỜI Ở CÙNG
                1L, LocalDateTime.of(2026, 11, 1, 10, 0),
                1L, LocalDate.of(2026, 11, 2), LocalDateTime.of(2026, 11, 2, 9, 30),
                "Ký trực tiếp tại văn phòng toà nhà", "scan_hd_101.pdf",
                LocalDateTime.of(2026, 11, 1, 9, 0), LocalDateTime.of(2026, 11, 2, 9, 30),
                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), new BigDecimal("4500000.00"),
                LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1), 30, "HIEU_LUC",
                List.of(), List.of(), true
        );
        when(hopDongService.layHoSoHopDong(eq(hopDongId), eq(quanLy))).thenReturn(sealedHoSo);

        byte[] pdfBytes = pdfService.xuat(hopDongId, quanLy);
        assertThat(pdfBytes).isNotEmpty();

        java.nio.file.Path outputPath = java.nio.file.Paths.get("build", "hop-dong-khong-dich-vu.pdf");
        java.nio.file.Files.createDirectories(outputPath.getParent());
        java.nio.file.Files.write(outputPath, pdfBytes);

        PdfReader reader = new PdfReader(pdfBytes);
        int totalPages = reader.getNumberOfPages();
        assertThat(totalPages).isGreaterThanOrEqualTo(2);

        PdfTextExtractor extractor = new PdfTextExtractor(reader);
        String fullText = "";
        for (int p = 1; p <= totalPages; p++) {
            String pageText = extractor.getTextFromPage(p);
            fullText += pageText + "\n";
            assertThat(pageText).contains("Trang " + p);
            assertThat(pageText).contains("Hợp đồng HD-200");
        }
        reader.close();

        assertThat(fullText).contains("Không có dịch vụ tính phí riêng theo hợp đồng.");
        assertThat(fullText).contains("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM");
        assertThat(fullText).contains("Độc lập - Tự do - Hạnh phúc");
        assertThat(fullText).contains("HỢP ĐỒNG THUÊ PHÒNG NGUYÊN BẢN");
        assertThat(fullText).contains("Công ty Cổ phần Quản lý MiniApart");
        assertThat(fullText).contains("PHỤ LỤC: DANH MỤC TRANG THIẾT BỊ BÀN GIAO KÈM THEO PHÒNG");
        assertThat(fullText).contains("Điều hoà Inverter 9000BTU");
        assertThat(fullText).contains("ĐẠI DIỆN BÊN CHO THUÊ");
        assertThat(fullText).contains("BÊN THUÊ");
        assertThat(fullText).contains("Ngày ký hợp đồng: 02/11/2026");
    }

    @Test
    void xuatPdf_daTrang_coDichVuBacThang_kiemTraTrucQuanVaGhiTep() throws Exception {
        Long hopDongId = 201L;
        ThongTinHopDong contract = new ThongTinHopDong(
                hopDongId, 101L, "101", 10L, "Trần Văn B",
                LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1), "4500000.00", "4500000.00", 30,
                "HIEU_LUC", "Hiệu lực", false, 365, List.of(), null
        );
        when(hopDongService.chiTiet(eq(hopDongId), eq(quanLy))).thenReturn(contract);

        String snapshotDichVu = """
                [
                    {
                        "dichVuId": 1,
                        "tenDichVu": "Điện sinh hoạt",
                        "cachTinh": "CONG_TO",
                        "cheDoGia": "BAC_THANG",
                        "donVi": "kWh",
                        "donGiaApDung": 0,
                        "cacBacThang": [
                            {"bac": 1, "tuChiSo": 0, "denChiSo": 50, "donGia": 1800.00, "tyLe": 1.0},
                            {"bac": 2, "tuChiSo": 51, "denChiSo": 100, "donGia": 2100.00, "tyLe": 1.0},
                            {"bac": 3, "tuChiSo": 101, "denChiSo": null, "donGia": 2500.00, "tyLe": 1.0}
                        ]
                    },
                    {
                        "dichVuId": 2,
                        "tenDichVu": "Internet wifi tốc độ cao",
                        "cachTinh": "CO_DINH",
                        "cheDoGia": "CO_DINH",
                        "donVi": "phòng",
                        "donGiaApDung": 0.00,
                        "cacBacThang": []
                    },
                    {
                        "dichVuId": 3,
                        "tenDichVu": "Phí quản lý & Vệ sinh hành lang",
                        "cachTinh": "CO_DINH",
                        "cheDoGia": "CO_DINH",
                        "donVi": "người",
                        "donGiaApDung": 150000.00,
                        "cacBacThang": []
                    }
                ]
                """;

        String dieuKhoanDai = MauHopDongChuan.NOI_DUNG_DIEU_KHOAN_CHUAN;

        String snapshotTaiSan = """
                [
                    {"taiSanId": 1, "tenTaiSan": "Điều hoà Panasonic 9000BTU Inverter", "soLuong": 1, "tinhTrangLucGiao": "Mới 100%, có điều khiển", "ghiChu": ""},
                    {"taiSanId": 2, "tenTaiSan": "Bình nước nóng Rossi 20L", "soLuong": 1, "tinhTrangLucGiao": "Hoạt động tốt", "ghiChu": ""},
                    {"taiSanId": 3, "tenTaiSan": "Tủ quần áo 3 cánh gỗ ép", "soLuong": 1, "tinhTrangLucGiao": "Chắc chắn, sạch sẽ", "ghiChu": ""}
                ]
                """;

        HopDongHoSoDto sealedHoSo = new HopDongHoSoDto(
                1L, hopDongId, 1, "DA_GHI_NHAN_KY", null, 1, "HỢP ĐỒNG THUÊ PHÒNG CHÍNH THỨC",
                LocalDate.of(2026, 11, 1), "Hà Nội", "Để ở", "Sử dụng riêng diện tích phòng", LocalDate.of(2026, 11, 1),
                "CHUYEN_KHOAN", 1, 5, "0011001234567 - VCB", "Thỏa thuận", 10L,
                "CA_NHAN", "Công ty TNHH MiniApart Quản Lý", "0109999999", "123 Cầu Giấy, Hà Nội", "0912345678", "contact@miniapart.vn",
                "Nguyễn Văn Chủ", "Giám Đốc", "DAI_DIEN_PHAP_LUAT", null, null,
                "Trần Văn B", LocalDate.of(1995, 5, 20), "CCCD", "001200009999", LocalDate.of(2021, 5, 10),
                "Cục CSQLHC về TTXH", "Hà Nội", "Hà Nội", "0987654321", "b@gmail.com",
                "Toà nhà MiniApart Cầu Giấy", "123 Cầu Giấy, Hà Nội", "101", 1, new BigDecimal("28.5"),
                dieuKhoanDai,
                snapshotDichVu,
                snapshotTaiSan,
                "[{\"hoTenNguoiThue\":\"Lê Thị Cùng Phòng\",\"quanHe\":\"Em gái\"}]",
                1L, LocalDateTime.of(2026, 11, 1, 10, 0),
                1L, LocalDate.of(2026, 11, 2), LocalDateTime.of(2026, 11, 2, 9, 30),
                "Ký kết tại toà nhà", "scan_101.pdf",
                LocalDateTime.of(2026, 11, 1, 9, 0), LocalDateTime.of(2026, 11, 2, 9, 30),
                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), new BigDecimal("4500000.00"),
                LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1), 30, "HIEU_LUC",
                List.of(new ThongTinNguoiOCung(1L, hopDongId, 99L, "Lê Thị Cùng Phòng", "Em gái", null, null)), List.of(), true
        );
        when(hopDongService.layHoSoHopDong(eq(hopDongId), eq(quanLy))).thenReturn(sealedHoSo);

        byte[] pdfBytes = pdfService.xuat(hopDongId, quanLy);
        assertThat(pdfBytes).isNotEmpty();

        java.nio.file.Path outputPath = java.nio.file.Paths.get("build", "hop-dong-chinh-thuc.pdf");
        java.nio.file.Files.createDirectories(outputPath.getParent());
        java.nio.file.Files.write(outputPath, pdfBytes);

        PdfReader reader = new PdfReader(pdfBytes);
        int totalPages = reader.getNumberOfPages();
        assertThat(totalPages).isGreaterThanOrEqualTo(3);

        PdfTextExtractor extractor = new PdfTextExtractor(reader);
        String fullText = "";
        for (int p = 1; p <= totalPages; p++) {
            String pageText = extractor.getTextFromPage(p);
            fullText += pageText + "\n";
            assertThat(pageText).contains("Trang " + p);
        }
        reader.close();

        // 12 điều khoản chuẩn mực đầy đủ
        assertThat(fullText).contains("Điều 1. Đối tượng thuê, mục đích, phạm vi sử dụng và nhận bàn giao");
        assertThat(fullText).contains("Điều 2. Thời hạn thuê, giá thuê, kỳ hạn và phương thức thanh toán");
        assertThat(fullText).contains("Điều 3. Tiền đặt cọc, điều kiện hoàn cọc và căn cứ khấu trừ");
        assertThat(fullText).contains("Điều 4. Chi phí dịch vụ, cơ chế tính phí và chốt chỉ số định kỳ");
        assertThat(fullText).contains("Điều 5. Quyền và nghĩa vụ của Bên cho thuê (Bên A)");
        assertThat(fullText).contains("Điều 6. Quyền và nghĩa vụ của Bên thuê (Bên B)");
        assertThat(fullText).contains("Điều 7. Quản lý tài sản, trang thiết bị và giá trị pháp lý của Biên bản bàn giao");
        assertThat(fullText).contains("Điều 8. Sửa chữa, bảo trì và phân định trách nhiệm hao mòn tài sản");
        assertThat(fullText).contains("Điều 9. An toàn phòng cháy chữa cháy, an ninh trật tự và quy định cư trú");
        assertThat(fullText).contains("Điều 10. Gia hạn hợp đồng, chấm dứt trước thời hạn và thủ tục trả phòng");
        assertThat(fullText).contains("Điều 11. Đối chiếu công nợ, kiểm kê tài sản, quyết toán và thanh lý hợp đồng");
        assertThat(fullText).contains("Điều 12. Điều khoản thi hành, sửa đổi phụ lục, giải quyết tranh chấp và ký kết");

        // Các khoản cụ thể và liên kết module nghiệp vụ
        assertThat(fullText).contains("Biên bản bàn giao nhận phòng (loại NHẬN PHÒNG)");
        assertThat(fullText).contains("Biên bản bàn giao trả phòng (loại TRẢ PHÒNG)");
        assertThat(fullText).contains("hao mòn tự nhiên");
        assertThat(fullText).contains("an toàn PCCC");
        assertThat(fullText).contains("Luật Cư trú");
        assertThat(fullText).contains("Phụ lục hợp đồng");

        // Biểu giá bậc thang
        assertThat(fullText).contains("Điện sinh hoạt (Biểu giá bậc thang)");
        assertThat(fullText).contains("1.800 đ / kWh");
        assertThat(fullText).contains("2.100 đ / kWh");
        assertThat(fullText).contains("2.500 đ / kWh");

        // Dịch vụ 0đ hiển thị Miễn phí
        assertThat(fullText).contains("Internet wifi tốc độ cao: Miễn phí (0 đ)");
        assertThat(fullText).contains("Phí quản lý & Vệ sinh hành lang: 150.000 đ / người");

        // Người ở cùng trong snapshot
        assertThat(fullText).contains("Lê Thị Cùng Phòng (Em gái)");

        // Phụ lục tài sản
        assertThat(fullText).contains("PHỤ LỤC: DANH MỤC TRANG THIẾT BỊ BÀN GIAO KÈM THEO PHÒNG");
        assertThat(fullText).contains("Điều hoà Panasonic 9000BTU Inverter");
    }
}
