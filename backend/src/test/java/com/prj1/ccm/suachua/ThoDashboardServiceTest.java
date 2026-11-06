package com.prj1.ccm.suachua;

import com.prj1.ccm.auth.NguoiDungRepository;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.nguoithue.NhatKyThaoTacRepository;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import com.prj1.ccm.toanha.ToaNha;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ThoDashboardServiceTest {
    private static final Instant NOW = Instant.parse("2026-11-06T10:00:00Z");

    @Mock
    private JdbcTemplate jdbcTemplate;
    @Mock
    private YeuCauSuaChuaRepository yeuCauRepo;
    @Mock
    private YeuCauSuaChuaService yeuCauService;
    @Mock
    private BaoGiaSuaChuaRepository baoGiaRepo;
    @Mock
    private ThanhToanThoRepository thanhToanRepo;
    @Mock
    private PhanQuyenToaService phanQuyenService;
    @Mock
    private NguoiDungRepository nguoiDungRepo;
    @Mock
    private NhatKyThaoTacRepository nhatKyRepo;

    private ThoDashboardService service;

    private final NguoiDung tho1 = new NguoiDung(31L, "Lê Quốc Huy", "0999000031", "", VaiTro.THO, null, 0, null);
    private final NguoiDung tho2 = new NguoiDung(32L, "Đặng Văn Thành", "0999000032", "", VaiTro.THO, null, 0, null);
    private final NguoiDung quanLy = new NguoiDung(20L, "Vũ Thu Hà", "0999000020", "", VaiTro.QUAN_LY, null, 0, null);
    private final NguoiDung nguoiThue = new NguoiDung(50L, "Nguyễn Văn Thuê", "0999100001", "", VaiTro.NGUOI_THUE, null, 0, null);

    @BeforeEach
    void setUp() {
        service = new ThoDashboardService(
                jdbcTemplate,
                yeuCauRepo,
                yeuCauService,
                baoGiaRepo,
                thanhToanRepo,
                phanQuyenService,
                nguoiDungRepo,
                nhatKyRepo,
                Clock.fixed(NOW, ZoneOffset.UTC)
        );
    }

    @Test
    void nonWorkerCannotAccessWorkerDashboard() {
        assertThatThrownBy(() -> service.layTongQuan(nguoiThue, null, null, null))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Khu vực chỉ dành cho thợ sửa chữa");
    }

    @Test
    void workerCannotViewAnotherWorkerTicket() {
        YeuCauSuaChua yc = new YeuCauSuaChua(
                100L, "SC-202611-0100", 10L, null, 50L, "Sửa điều hòa", "Không mát",
                MucDo.THUONG, TrangThaiYeuCau.DA_PHAN_CONG, 20L, NOW, tho2.id(), NOW,
                null, null, null, null, NOW
        );
        var view = new YeuCauSuaChuaRepository.YeuCauSuaChuaView(yc, 1L, "Toà A", "101", 1, "0999100001");
        when(yeuCauRepo.findById(100L)).thenReturn(Optional.of(view));

        assertThatThrownBy(() -> service.layChiTietCongViec(tho1, 100L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Bạn không được phân công yêu cầu này");
    }

    @Test
    void workerCannotViewAnotherWorkerVoucher() {
        YeuCauSuaChua yc = new YeuCauSuaChua(
                100L, "SC-202611-0100", 10L, null, 50L, "Sửa vòi nước", "Rò nước",
                MucDo.THUONG, TrangThaiYeuCau.DA_DONG, 20L, NOW, tho2.id(), NOW,
                BigDecimal.ZERO, null, null, null, NOW
        );
        var view = new YeuCauSuaChuaRepository.YeuCauSuaChuaView(yc, 1L, "Toà A", "101", 1, "0999100001");
        when(yeuCauRepo.findById(100L)).thenReturn(Optional.of(view));

        assertThatThrownBy(() -> service.layChungTu(tho1, 100L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Không được phép xem chứng từ của thợ khác");
    }

    @Test
    void createQuoteRejectsEmptyOrInvalidLineItems() {
        YeuCauSuaChua yc = new YeuCauSuaChua(
                100L, "SC-202611-0100", 10L, null, 50L, "Sửa vòi nước", "Rò nước",
                MucDo.THUONG, TrangThaiYeuCau.DANG_XU_LY, 20L, NOW, tho1.id(), NOW,
                null, null, null, null, NOW
        );
        var view = new YeuCauSuaChuaRepository.YeuCauSuaChuaView(yc, 1L, "Toà A", "101", 1, "0999100001");
        when(yeuCauRepo.findById(100L)).thenReturn(Optional.of(view));

        // Empty items
        var emptyReq = new ThoDashboardDto.YeuCauTaoBaoGia("Mô tả", "Ghi chú", List.of(), false);
        assertThatThrownBy(() -> service.taoBaoGia(tho1, 100L, emptyReq))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Báo giá phải có ít nhất một dòng");

        // Negative price
        var invalidPriceReq = new ThoDashboardDto.YeuCauTaoBaoGia(
                "Mô tả", "Ghi chú",
                List.of(new ThoDashboardDto.YeuCauTaoBaoGia.DongBaoGiaReq("Vật tư", BigDecimal.ONE, "cái", new BigDecimal("-100"))),
                false
        );
        assertThatThrownBy(() -> service.taoBaoGia(tho1, 100L, invalidPriceReq))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Đơn giá không được âm");
    }

    @Test
    void managerCannotApproveQuoteWithoutChoDuyetStatus() {
        YeuCauSuaChua yc = new YeuCauSuaChua(
                100L, "SC-202611-0100", 10L, null, 50L, "Sửa vòi nước", "Rò nước",
                MucDo.THUONG, TrangThaiYeuCau.DANG_XU_LY, 20L, NOW, tho1.id(), NOW,
                null, null, null, null, NOW
        );
        var view = new YeuCauSuaChuaRepository.YeuCauSuaChuaView(yc, 1L, "Toà A", "101", 1, "0999100001");
        when(yeuCauRepo.findById(100L)).thenReturn(Optional.of(view));
        when(phanQuyenService.layToaNhaNeuNhanVienDuocXem(quanLy, 1L)).thenReturn(mock(ToaNha.class));

        // Quote is NHAP, not CHO_DUYET
        BaoGiaSuaChua bg = new BaoGiaSuaChua(
                1L, "BG-00100-v1", 100L, 1, TrangThaiBaoGia.NHAP, new BigDecimal("200000.00"),
                "Mô tả", null, null, tho1.id(), NOW, null, null, null, List.of()
        );
        when(baoGiaRepo.findById(1L)).thenReturn(Optional.of(bg));

        assertThatThrownBy(() -> service.duyetBaoGia(quanLy, 100L, 1L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Báo giá phải ở trạng thái Chờ duyệt");
    }

    @Test
    void paymentCannotExceedRemainingQuoteAmount() {
        YeuCauSuaChua yc = new YeuCauSuaChua(
                100L, "SC-202611-0100", 10L, null, 50L, "Sửa vòi nước", "Rò nước",
                MucDo.THUONG, TrangThaiYeuCau.DA_DONG, 20L, NOW, tho1.id(), NOW,
                new BigDecimal("300000.00"), null, null, null, NOW
        );
        var view = new YeuCauSuaChuaRepository.YeuCauSuaChuaView(yc, 1L, "Toà A", "101", 1, "0999100001");
        when(yeuCauRepo.findById(100L)).thenReturn(Optional.of(view));
        when(phanQuyenService.layToaNhaNeuNhanVienDuocXem(quanLy, 1L)).thenReturn(mock(ToaNha.class));

        BaoGiaSuaChua bg = new BaoGiaSuaChua(
                1L, "BG-00100-v1", 100L, 1, TrangThaiBaoGia.DA_DUYET, new BigDecimal("300000.00"),
                "Mô tả", null, null, tho1.id(), NOW, quanLy.id(), NOW, null, List.of()
        );
        when(baoGiaRepo.findBaoGiaHieuLuc(100L)).thenReturn(Optional.of(bg));
        when(thanhToanRepo.tinhTongDaThanhToan(100L)).thenReturn(new BigDecimal("200000.00")); // remaining is 100,000

        var overpayReq = new ThoDashboardDto.ThoActionRequests.GhiNhanThanhToanReq(
                new BigDecimal("150000.00"), PhuongThucThanhToanTho.CHUYEN_KHOAN, "REF-123", "Ghi chú"
        );

        assertThatThrownBy(() -> service.ghiNhanThanhToan(quanLy, 100L, overpayReq))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("vượt quá số tiền còn lại");
    }
}
