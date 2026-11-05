package com.prj1.ccm.billing;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class KhoanPhatSinhSuaChuaServiceTest {
    @Mock
    private KhoanPhatSinhRepository khoanPhatSinhRepository;

    @Test
    void FR_MNT_06_CR_008_rejectsRepairSourcePairWhenHistoryBelongsToAnotherContract() {
        KhoanPhatSinhSuaChuaService service = new KhoanPhatSinhSuaChuaService(khoanPhatSinhRepository);
        when(khoanPhatSinhRepository.timTheoNguonKhoa(NguonKhoanPhatSinh.SUA_CHUA, 101L))
                .thenReturn(List.of(new KhoanPhatSinhRepository.KhoanPhatSinhCuaNguon(
                        1L,
                        88L,
                        new BigDecimal("125000.00"),
                        TrangThaiKhoanPhatSinh.VO_HIEU,
                        null
                )));

        assertThatThrownBy(() -> service.ghiChiPhi(99L, 101L, new BigDecimal("150000.00")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Nguồn khoản phát sinh sửa chữa không hợp lệ");
        verify(khoanPhatSinhRepository, never()).tao(any());
    }

    @Test
    void FR_MNT_06_CR_008_rejectsMismatchedRepairSourceHistoryForZeroCostToo() {
        KhoanPhatSinhSuaChuaService service = new KhoanPhatSinhSuaChuaService(khoanPhatSinhRepository);
        when(khoanPhatSinhRepository.timTheoNguonKhoa(NguonKhoanPhatSinh.SUA_CHUA, 101L))
                .thenReturn(List.of(new KhoanPhatSinhRepository.KhoanPhatSinhCuaNguon(
                        1L,
                        88L,
                        new BigDecimal("125000.00"),
                        TrangThaiKhoanPhatSinh.VO_HIEU,
                        null
                )));

        assertThatThrownBy(() -> service.ghiChiPhi(99L, 101L, BigDecimal.ZERO))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Nguồn khoản phát sinh sửa chữa không hợp lệ");
    }
}
