package com.prj1.ccm.billing;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.TrangThaiNguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import com.prj1.ccm.toanha.ToaNha;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class KhoanPhatSinhServiceTest {

    @Mock
    private KhoanPhatSinhRepository khoanPhatSinhRepository;

    @Mock
    private PhanQuyenToaService phanQuyenToaService;

    private KhoanPhatSinhService khoanPhatSinhService;

    @BeforeEach
    void setUp() {
        khoanPhatSinhService = new KhoanPhatSinhService(
                khoanPhatSinhRepository,
                phanQuyenToaService,
                List.of(new NguonKhoanPhatSinhValidator() {
                    @Override
                    public NguonKhoanPhatSinh nguonLoai() {
                        return NguonKhoanPhatSinh.SUA_CHUA;
                    }

                    @Override
                    public boolean tonTai(Long nguonId) {
                        return nguonId != null && nguonId == 101L;
                    }
                })
        );
    }

    @Test
    void FR_INV_05_CR_008_rejectsNullAndNonPositiveSourceIdentifiersAtCommandBoundary() {
        NguoiDung quanLy = new NguoiDung(3L, "Quan ly", "0900000003", "hash", VaiTro.QUAN_LY, TrangThaiNguoiDung.HOAT_DONG, 0, null);
        when(khoanPhatSinhRepository.timHopDongTrongPhamVi(88L))
                .thenReturn(Optional.of(new KhoanPhatSinhRepository.HopDongTrongPhamVi(88L, 1L)));
        when(phanQuyenToaService.layToaNhaNeuNguoiDungDuocXem(quanLy, 1L))
                .thenReturn(new ToaNha(1L, "TN-A", "Toa A", "Dia chi", 5, 25, 7, "0123", new BigDecimal("0.15"), false));

        assertThatThrownBy(() -> khoanPhatSinhService.tao(
                88L,
                new YeuCauKhoanPhatSinh(NguonKhoanPhatSinh.SUA_CHUA, null, "Tien sua den", new BigDecimal("120000.00"), LoaiKhoanPhatSinh.PHAT_SINH),
                quanLy
        )).isInstanceOf(ResponseStatusException.class);

        assertThatThrownBy(() -> khoanPhatSinhService.tao(
                88L,
                new YeuCauKhoanPhatSinh(NguonKhoanPhatSinh.SUA_CHUA, 0L, "Tien sua den", new BigDecimal("120000.00"), LoaiKhoanPhatSinh.PHAT_SINH),
                quanLy
        )).isInstanceOf(ResponseStatusException.class);

        verify(khoanPhatSinhRepository, never()).tao(org.mockito.ArgumentMatchers.any());
    }
}
