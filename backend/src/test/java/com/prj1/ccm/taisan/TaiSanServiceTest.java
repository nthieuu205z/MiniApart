package com.prj1.ccm.taisan;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.TrangThaiNguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class TaiSanServiceTest {
    private TaiSanRepository taiSanRepository;
    private PhanQuyenToaService phanQuyenToaService;
    private TaiSanService taiSanService;

    private final NguoiDung chuSoHuu = new NguoiDung(
            2L, "Chủ nhà", "0900000002", "hash", VaiTro.CHU, TrangThaiNguoiDung.HOAT_DONG, 0, null
    );
    private final NguoiDung quanLy = new NguoiDung(
            3L, "Quản lý toà", "0900000003", "hash", VaiTro.QUAN_LY, TrangThaiNguoiDung.HOAT_DONG, 0, null
    );
    private final NguoiDung nguoiThueA = new NguoiDung(
            5L, "Người thuê A", "0900000005", "hash", VaiTro.NGUOI_THUE, TrangThaiNguoiDung.HOAT_DONG, 0, 10L
    );
    private final NguoiDung nguoiThueB = new NguoiDung(
            6L, "Người thuê B", "0900000006", "hash", VaiTro.NGUOI_THUE, TrangThaiNguoiDung.HOAT_DONG, 0, 11L
    );

    @BeforeEach
    void setUp() {
        taiSanRepository = mock(TaiSanRepository.class);
        phanQuyenToaService = mock(PhanQuyenToaService.class);
        taiSanService = new TaiSanService(taiSanRepository, phanQuyenToaService);
    }

    @Test
    void layDanhSachTaiSan_chuaDangNhap_nemLoi401() {
        assertThatThrownBy(() -> taiSanService.layDanhSachTaiSan(101L, null))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    void themTaiSan_nguoiThueKhongCoQuyen_nemLoi403() {
        YeuCauKhaiBaoTaiSan req = new YeuCauKhaiBaoTaiSan("Điều hoà", "DIEN_LANH", 1, "Tốt", BigDecimal.valueOf(5000000), null);
        assertThatThrownBy(() -> taiSanService.themTaiSan(101L, req, nguoiThueA))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void lapBienBan_nguoiLapIdLaNguoiDungDangNhap_khongFallback1() {
        Long hopDongId = 50L;
        Long phongId = 101L;
        Long toaNhaId = 1L;

        when(taiSanRepository.layThongTinHopDongTaiSan(hopDongId))
                .thenReturn(Optional.of(new TaiSanRepository.ThongTinHopDongTaiSan(hopDongId, phongId, toaNhaId, 10L)));
        when(taiSanRepository.layDanhSachTaiSan(phongId))
                .thenReturn(List.of(new TaiSanPhongDto(201L, phongId, "P.101", "Tủ lạnh 180L", "DIEN_LANH", 1, "Tốt", BigDecimal.valueOf(4000000), null, LocalDate.now())));
        when(taiSanRepository.lapBienBan(eq(hopDongId), eq(phongId), eq(3L), any()))
                .thenReturn(999L);

        YeuCauLapBienBan req = new YeuCauLapBienBan(
                "TRA_PHONG", LocalDate.now(), "Bàn giao trả phòng",
                List.of(new YeuCauChiTietBienBan(201L, "Tên fake", 1, "Tốt", "Hỏng", BigDecimal.valueOf(500000), "Vỡ cửa kính", null))
        );

        Long bienBanId = taiSanService.lapBienBan(hopDongId, req, quanLy);

        assertThat(bienBanId).isEqualTo(999L);
        // Xác nhận người lập là quanLy.id() (3L), tuyệt đối không phải fallback 1L
        verify(taiSanRepository).lapBienBan(eq(hopDongId), eq(phongId), eq(3L), argThat(y -> {
            assertThat(y.chiTiet()).hasSize(1);
            // Snapshot lấy từ DB ("Tủ lạnh 180L") thay vì client fake ("Tên fake")
            assertThat(y.chiTiet().get(0).tenTaiSan()).isEqualTo("Tủ lạnh 180L");
            return true;
        }));
    }

    @Test
    void lapBienBan_taiSanKhongThuocPhong_nemLoi400() {
        Long hopDongId = 50L;
        Long phongId = 101L;
        Long toaNhaId = 1L;

        when(taiSanRepository.layThongTinHopDongTaiSan(hopDongId))
                .thenReturn(Optional.of(new TaiSanRepository.ThongTinHopDongTaiSan(hopDongId, phongId, toaNhaId, 10L)));
        when(taiSanRepository.layDanhSachTaiSan(phongId))
                .thenReturn(List.of(new TaiSanPhongDto(201L, phongId, "P.101", "Tủ lạnh", "DIEN_LANH", 1, "Tốt", BigDecimal.valueOf(4000000), null, LocalDate.now())));

        YeuCauLapBienBan req = new YeuCauLapBienBan(
                "TRA_PHONG", LocalDate.now(), "Bàn giao",
                List.of(new YeuCauChiTietBienBan(9999L, "Tài sản lạ", 1, "Tốt", "Tốt", BigDecimal.ZERO, null, null))
        );

        assertThatThrownBy(() -> taiSanService.lapBienBan(hopDongId, req, chuSoHuu))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("không thuộc phòng của hợp đồng này");
    }

    @Test
    void lapBienBan_taiSanBiTrungLap_nemLoi400() {
        Long hopDongId = 50L;
        Long phongId = 101L;
        Long toaNhaId = 1L;

        when(taiSanRepository.layThongTinHopDongTaiSan(hopDongId))
                .thenReturn(Optional.of(new TaiSanRepository.ThongTinHopDongTaiSan(hopDongId, phongId, toaNhaId, 10L)));
        when(taiSanRepository.layDanhSachTaiSan(phongId))
                .thenReturn(List.of(new TaiSanPhongDto(201L, phongId, "P.101", "Tủ lạnh", "DIEN_LANH", 1, "Tốt", BigDecimal.valueOf(4000000), null, LocalDate.now())));

        YeuCauLapBienBan req = new YeuCauLapBienBan(
                "NHAN_PHONG", LocalDate.now(), "Bàn giao",
                List.of(
                        new YeuCauChiTietBienBan(201L, "Tủ lạnh", 1, "Tốt", null, BigDecimal.ZERO, null, null),
                        new YeuCauChiTietBienBan(201L, "Tủ lạnh", 1, "Tốt", null, BigDecimal.ZERO, null, null)
                )
        );

        assertThatThrownBy(() -> taiSanService.lapBienBan(hopDongId, req, chuSoHuu))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("bị trùng lặp");
    }

    @Test
    void lapBienBan_tienKhauTruAm_nemLoi400() {
        Long hopDongId = 50L;
        Long phongId = 101L;
        Long toaNhaId = 1L;

        when(taiSanRepository.layThongTinHopDongTaiSan(hopDongId))
                .thenReturn(Optional.of(new TaiSanRepository.ThongTinHopDongTaiSan(hopDongId, phongId, toaNhaId, 10L)));
        when(taiSanRepository.layDanhSachTaiSan(phongId))
                .thenReturn(List.of(new TaiSanPhongDto(201L, phongId, "P.101", "Tủ lạnh", "DIEN_LANH", 1, "Tốt", BigDecimal.valueOf(4000000), null, LocalDate.now())));

        YeuCauLapBienBan req = new YeuCauLapBienBan(
                "TRA_PHONG", LocalDate.now(), "Bàn giao",
                List.of(new YeuCauChiTietBienBan(201L, "Tủ lạnh", 1, "Tốt", "Hỏng", BigDecimal.valueOf(-100000), "Lỗi", null))
        );

        assertThatThrownBy(() -> taiSanService.lapBienBan(hopDongId, req, chuSoHuu))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Tiền khấu trừ không được âm");
    }

    @Test
    void layDanhSachBienBan_nguoiThueKhongThuocHopDong_nemLoi403() {
        Long hopDongId = 50L;
        Long phongId = 101L;
        Long toaNhaId = 1L;

        when(taiSanRepository.layThongTinHopDongTaiSan(hopDongId))
                .thenReturn(Optional.of(new TaiSanRepository.ThongTinHopDongTaiSan(hopDongId, phongId, toaNhaId, 10L)));

        // nguoiThueB có id người thuê là 11L != 10L
        assertThatThrownBy(() -> taiSanService.layDanhSachBienBan(hopDongId, nguoiThueB))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));
    }
}
