package com.prj1.ccm.billing;

import com.prj1.ccm.billing.calc.TrangThaiHoaDon;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.TrangThaiNguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.thongbao.ThongBaoService;
import com.prj1.ccm.toanha.KyThanhToanRepository;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.web.server.ResponseStatusException;
import java.util.Optional;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class PhatHanhHoaDonServiceTest {
    private final TinhHoaDonRepository repository = mock(TinhHoaDonRepository.class);
    private final ThongBaoService notifications = mock(ThongBaoService.class);
    private final PhatHanhHoaDonService service = new PhatHanhHoaDonService(mock(PhanQuyenToaService.class), mock(KyThanhToanRepository.class), repository, notifications, mock(PlatformTransactionManager.class));
    private final NguoiDung manager = new NguoiDung(3L, "Quản lý", "0900000003", "hash", VaiTro.QUAN_LY, TrangThaiNguoiDung.HOAT_DONG, 0, null);

    @Test void FR_INV_08_singlePublicationUsesConditionalWriteAndEmitsTenantNotification() {
        when(repository.timHoaDonTrongPhamVi(1L, 8L, 10L)).thenReturn(Optional.of(new TinhHoaDonRepository.HoaDonTrongPhamVi(10L, TrangThaiHoaDon.NHAP)));
        when(repository.phatHanhHoaDonNeuDangNhapVaTongTienKhacKhong(10L)).thenReturn(1);
        service.phatHanh(1L, 8L, 10L, manager);
        verify(notifications).taoKhiPhatHanhHoaDon(10L);
        verify(repository, never()).capNhatTrangThaiHoaDon(any(), any());
    }
    @Test void FR_INV_08_zeroOrConcurrentlyChangedInvoiceCannotPublishOrNotify() {
        when(repository.timHoaDonTrongPhamVi(1L, 8L, 10L)).thenReturn(Optional.of(new TinhHoaDonRepository.HoaDonTrongPhamVi(10L, TrangThaiHoaDon.NHAP)));
        when(repository.phatHanhHoaDonNeuDangNhapVaTongTienKhacKhong(10L)).thenReturn(0);
        assertThatThrownBy(() -> service.phatHanh(1L, 8L, 10L, manager)).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(notifications);
    }
    @Test void FR_INV_08_issuedInvoiceCannotProduceDuplicateNotification() {
        when(repository.timHoaDonTrongPhamVi(1L, 8L, 10L)).thenReturn(Optional.of(new TinhHoaDonRepository.HoaDonTrongPhamVi(10L, TrangThaiHoaDon.DA_THANH_TOAN)));
        assertThatThrownBy(() -> service.phatHanh(1L, 8L, 10L, manager)).isInstanceOf(ResponseStatusException.class);
        verify(repository, never()).phatHanhHoaDonNeuDangNhapVaTongTienKhacKhong(any());
        verifyNoInteractions(notifications);
    }
}
