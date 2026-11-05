package com.prj1.ccm.publicportal;

import com.prj1.ccm.nguoidung.*;
import com.prj1.ccm.toanha.*;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.time.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class PublicPortalServiceTest {
    private final PublicPortalRepository repository = mock(PublicPortalRepository.class);
    private final PhanQuyenToaService permissions = mock(PhanQuyenToaService.class);
    private final TrangThaiPhongService rooms = mock(TrangThaiPhongService.class);
    private final PublicPortalService service = new PublicPortalService(repository, permissions, rooms,
            Clock.fixed(Instant.parse("2026-11-04T00:00:00Z"), ZoneId.of("Asia/Ho_Chi_Minh")));
    private NguoiDung user(VaiTro role) { return new NguoiDung(3L, "User", "0900000003", "", role, TrangThaiNguoiDung.HOAT_DONG, 0, null); }

    @Test void listAndUpdateRejectAnonymousTenantWorkerAndAdministrator() {
        List<NguoiDung> users = new ArrayList<>(List.of(user(VaiTro.NGUOI_THUE), user(VaiTro.THO), user(VaiTro.QTHT)));
        users.add(null);
        for (NguoiDung user : users) {
            assertThatThrownBy(() -> service.layDanhSachLichHen(null, user)).isInstanceOf(ResponseStatusException.class);
            assertThatThrownBy(() -> service.capNhatTrangThaiLichHen(1L, "HUY", user)).isInstanceOf(ResponseStatusException.class);
        }
        verifyNoInteractions(repository);
    }

    @Test void crossBuildingUpdateCannotReachWriteAndListAlwaysPassesAccountScope() {
        when(repository.timToaNhaCuaLichHen(1L)).thenReturn(Optional.of(2L));
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN)).when(permissions).layToaNhaNeuNhanVienDuocXem(user(VaiTro.QUAN_LY), 2L);
        assertThatThrownBy(() -> service.capNhatTrangThaiLichHen(1L, "HUY", user(VaiTro.QUAN_LY))).isInstanceOf(ResponseStatusException.class);
        verify(repository, never()).capNhatTrangThaiLichHen(anyLong(), anyString(), anyLong());
        service.layDanhSachLichHen(null, user(VaiTro.QUAN_LY));
        verify(repository).layDanhSachLichHen(null, 3L);
    }

    @Test void bookingRejectsRoomFromAnotherBuildingBeforeInsert() {
        when(repository.toaNhaTonTai(1L)).thenReturn(true);
        when(repository.phongThuocToa(9L, 1L)).thenReturn(false);
        assertThatThrownBy(() -> service.datLichHen(new YeuCauDatLichHen("Khách mới", "0900000009", null, 9L, 1L, LocalDateTime.parse("2026-11-05T10:00:00"), null)))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("không thuộc");
        verify(repository, never()).luuLichHen(any());
    }

    @Test void publicListingSynchronizesDatedContractStatusBeforeReading() {
        service.layDanhSachPhong(1L, null, null, null, null, true);
        var order = inOrder(rooms, repository);
        order.verify(rooms).dongBoTheoToaNhaId(1L, null);
        order.verify(repository).layDanhSachPhong(1L, null, null, null, null, true);
    }
}
