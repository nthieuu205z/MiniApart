package com.prj1.ccm.billing;

import com.prj1.ccm.billing.calc.TrangThaiHoaDon;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.TrangThaiNguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.nguoithue.NhatKyThaoTacRepository;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class HuyHoaDonNhapServiceTest {
    private PhanQuyenToaService phanQuyenToaService;
    private TinhHoaDonRepository tinhHoaDonRepository;
    private NhatKyThaoTacRepository nhatKyThaoTacRepository;
    private HuyHoaDonNhapService huyHoaDonNhapService;

    private final NguoiDung chuSoHuu = new NguoiDung(
            2L, "Chủ nhà", "0900000002", "hash", VaiTro.CHU, TrangThaiNguoiDung.HOAT_DONG, 0, null
    );

    @BeforeEach
    void setUp() {
        phanQuyenToaService = mock(PhanQuyenToaService.class);
        tinhHoaDonRepository = mock(TinhHoaDonRepository.class);
        nhatKyThaoTacRepository = mock(NhatKyThaoTacRepository.class);
        huyHoaDonNhapService = new HuyHoaDonNhapService(
                phanQuyenToaService, tinhHoaDonRepository, nhatKyThaoTacRepository
        );
    }

    @Test
    void huyHoaDonDaCoThanhToan_nemLoiConflictYeuCauButToanDoiUng() {
        Long toaNhaId = 1L;
        Long kyId = 10L;
        Long hoaDonId = 100L;

        // Hoá đơn đã phát hành và đã thu 500,000 đ
        TinhHoaDonRepository.HoaDonTrongPhamVi hoaDon = new TinhHoaDonRepository.HoaDonTrongPhamVi(
                hoaDonId, TrangThaiHoaDon.DA_PHAT_HANH, BigDecimal.valueOf(500000)
        );

        when(tinhHoaDonRepository.timHoaDonTrongPhamVi(toaNhaId, kyId, hoaDonId))
                .thenReturn(Optional.of(hoaDon));

        YeuCauHuyHoaDon req = new YeuCauHuyHoaDon("Huỷ do tính sai");

        assertThatThrownBy(() -> huyHoaDonNhapService.huy(toaNhaId, kyId, hoaDonId, req, chuSoHuu))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> {
                    ResponseStatusException rse = (ResponseStatusException) e;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(rse.getReason()).contains("Lập bút toán đối ứng cho các khoản đã thu trước khi huỷ hoá đơn.");
                });

        verify(tinhHoaDonRepository, never()).capNhatTrangThaiHoaDon(any(), any());
    }

    @Test
    void huyHoaDonDaPhatHanhChuaThuTien_thanhCong() {
        Long toaNhaId = 1L;
        Long kyId = 10L;
        Long hoaDonId = 101L;

        // Hoá đơn đã phát hành nhưng chưa thu đồng nào (daThu = 0)
        TinhHoaDonRepository.HoaDonTrongPhamVi hoaDon = new TinhHoaDonRepository.HoaDonTrongPhamVi(
                hoaDonId, TrangThaiHoaDon.DA_PHAT_HANH, BigDecimal.ZERO
        );

        when(tinhHoaDonRepository.timHoaDonTrongPhamVi(toaNhaId, kyId, hoaDonId))
                .thenReturn(Optional.of(hoaDon));

        YeuCauHuyHoaDon req = new YeuCauHuyHoaDon("Huỷ do chỉnh sửa hợp đồng");

        huyHoaDonNhapService.huy(toaNhaId, kyId, hoaDonId, req, chuSoHuu);

        verify(tinhHoaDonRepository).capNhatTrangThaiHoaDon(hoaDonId, TrangThaiHoaDon.DA_HUY);
        verify(tinhHoaDonRepository).khoiPhucKhoanPhatSinhChoTinh(hoaDonId);
        verify(tinhHoaDonRepository).khoiPhucSoDuKhaDung(hoaDonId);
    }
}
