package com.prj1.ccm.toanha;

import com.prj1.ccm.hopdong.NguoiOCungRepository;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.TrangThaiNguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class KyThanhToanServiceTest {

    @Mock
    private PhanQuyenToaService phanQuyenToaService;

    @Mock
    private KyThanhToanRepository kyThanhToanRepository;

    @Mock
    private ChiSoDichVuRepository chiSoDichVuRepository;

    @Mock
    private NguoiOCungRepository nguoiOCungRepository;

    @Mock
    private NhanKhauKyRepository nhanKhauKyRepository;

    @Test
    void CR_002_loserOfCloseCompareAndSwapDoesNotInsertResidentSnapshot() {
        KyThanhToanService service = new KyThanhToanService(
                phanQuyenToaService,
                kyThanhToanRepository,
                chiSoDichVuRepository,
                nguoiOCungRepository,
                nhanKhauKyRepository
        );
        NguoiDung quanLy = new NguoiDung(3L, "Quan ly", "0900000003", "hash", VaiTro.QUAN_LY,
                TrangThaiNguoiDung.HOAT_DONG, 0, null);
        ToaNha toaNha = new ToaNha(1L, "TOA-A", "Toa A", "Dia chi", 5, 25, 3, "123", BigDecimal.ZERO, true);
        KyThanhToan kyDangMo = new KyThanhToan(
                10L,
                1L,
                2026,
                8,
                LocalDate.of(2026, 7, 26),
                LocalDate.of(2026, 8, 25),
                TrangThaiKy.DANG_MO
        );

        when(phanQuyenToaService.layToaNhaNeuNguoiDungDuocXem(quanLy, 1L)).thenReturn(toaNha);
        when(kyThanhToanRepository.findByIdAndToaNhaId(10L, 1L)).thenReturn(Optional.of(kyDangMo));
        when(chiSoDichVuRepository.findChoNhap(1L, 10L, null)).thenReturn(List.of());
        when(kyThanhToanRepository.findByToaNhaId(1L)).thenReturn(List.of(kyDangMo));
        when(kyThanhToanRepository.updateTrangThaiDaChot(10L, 1L)).thenReturn(0);

        assertThatThrownBy(() -> service.chotKyThanhToan(1L, 10L, quanLy))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
                        org.assertj.core.api.Assertions.assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.CONFLICT)
                );

        verify(nhanKhauKyRepository, never()).insertAll(org.mockito.ArgumentMatchers.anyLong(),
                org.mockito.ArgumentMatchers.anyList(),
                org.mockito.ArgumentMatchers.any());
        verify(nguoiOCungRepository, never()).findSoNguoiOChotKy(
                org.mockito.ArgumentMatchers.anyLong(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any()
        );
    }
}
