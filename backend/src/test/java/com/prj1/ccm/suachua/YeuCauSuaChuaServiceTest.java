package com.prj1.ccm.suachua;

import com.prj1.ccm.billing.KhoanPhatSinhSuaChuaService;
import com.prj1.ccm.nguoithue.AnhDinhKemService;
import com.prj1.ccm.nguoithue.NhatKyThaoTacRepository;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.TrangThaiNguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.auth.NguoiDungRepository;
import com.prj1.ccm.thongbao.ThongBaoService;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import com.prj1.ccm.toanha.PhongRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class YeuCauSuaChuaServiceTest {
    private static final Instant NOW = Instant.parse("2040-08-15T03:00:00Z");

    @Mock
    private YeuCauSuaChuaRepository yeuCauSuaChuaRepository;

    @Mock
    private PhongRepository phongRepository;

    @Mock
    private PhanQuyenToaService phanQuyenToaService;

    @Mock
    private NguoiDungRepository nguoiDungRepository;

    @Mock
    private AnhDinhKemService anhDinhKemService;

    @Mock
    private NhatKyThaoTacRepository nhatKyThaoTacRepository;

    @Mock
    private ThongBaoService thongBaoService;

    @Mock
    private KhoanPhatSinhSuaChuaService khoanPhatSinhSuaChuaService;

    private YeuCauSuaChuaService service;

    @BeforeEach
    void setUp() {
        service = new YeuCauSuaChuaService(
                yeuCauSuaChuaRepository,
                phongRepository,
                phanQuyenToaService,
                nguoiDungRepository,
                anhDinhKemService,
                nhatKyThaoTacRepository,
                thongBaoService,
                khoanPhatSinhSuaChuaService,
                Clock.fixed(NOW, ZoneOffset.UTC)
        );
    }

    @Test
    void FR_MNT_06_CR_008_cancellationLocksRepairBeforeVoidingBillingExtra() {
        YeuCauSuaChuaRepository.YeuCauSuaChuaView view = view();
        when(yeuCauSuaChuaRepository.findById(1L)).thenReturn(Optional.of(view));
        when(yeuCauSuaChuaRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(view));
        when(yeuCauSuaChuaRepository.capNhatHuy(1L, "Không cần sửa", TrangThaiYeuCau.DANG_XU_LY))
                .thenReturn(1);

        service.huy(1L, "Không cần sửa", quanLy());

        verify(yeuCauSuaChuaRepository).findByIdForUpdate(1L);
    }

    private YeuCauSuaChuaRepository.YeuCauSuaChuaView view() {
        return new YeuCauSuaChuaRepository.YeuCauSuaChuaView(
                new YeuCauSuaChua(
                        1L,
                        "SC-204008-0001",
                        1L,
                        1L,
                        3L,
                        "Điện nước",
                        "Sửa vòi nước",
                        MucDo.THUONG,
                        TrangThaiYeuCau.DANG_XU_LY,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        NOW
                ),
                1L,
                "Toà A",
                "101",
                1,
                "0900000003"
        );
    }

    private NguoiDung quanLy() {
        return new NguoiDung(
                3L,
                "Quản lý",
                "0900000003",
                "hash",
                VaiTro.QUAN_LY,
                TrangThaiNguoiDung.HOAT_DONG,
                0,
                null
        );
    }
}
