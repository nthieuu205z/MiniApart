package com.prj1.ccm.hopdong;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.TrangThaiNguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.nguoithue.NguoiThue;
import com.prj1.ccm.nguoithue.NguoiThueRepository;
import com.prj1.ccm.toanha.BangGiaRepository;
import com.prj1.ccm.toanha.DichVu;
import com.prj1.ccm.toanha.DichVuRepository;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import com.prj1.ccm.toanha.Phong;
import com.prj1.ccm.toanha.PhongRepository;
import com.prj1.ccm.toanha.ToaNha;
import com.prj1.ccm.toanha.TrangThaiPhong;
import com.prj1.ccm.toanha.TrangThaiPhongService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.argThat;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HopDongServiceTest {

    @Mock
    private HopDongRepository hopDongRepository;

    @Mock
    private PhongRepository phongRepository;

    @Mock
    private NguoiThueRepository nguoiThueRepository;

    @Mock
    private DichVuRepository dichVuRepository;

    @Mock
    private BangGiaRepository bangGiaRepository;

    @Mock
    private NguoiOCungRepository nguoiOCungRepository;

    @Mock
    private PhanQuyenToaService phanQuyenToaService;

    @Mock
    private TrangThaiPhongService trangThaiPhongService;

    private HopDongService hopDongService;

    @BeforeEach
    void setUp() {
        hopDongService = new HopDongService(
                hopDongRepository,
                phongRepository,
                nguoiThueRepository,
                dichVuRepository,
                bangGiaRepository,
                nguoiOCungRepository,
                phanQuyenToaService,
                trangThaiPhongService,
                Clock.fixed(LocalDate.of(2040, 8, 1).atStartOfDay(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant(), ZoneId.of("Asia/Ho_Chi_Minh"))
        );
    }

    @Test
    void FR_TNT_05_CR_002_khongDoiDataIntegrityKhacThanhXungDotChongNgay() {
        NguoiDung quanLy = new NguoiDung(3L, "Quản lý", "0900000003", "hash", VaiTro.QUAN_LY, TrangThaiNguoiDung.HOAT_DONG, 0, null);
        Long phongId = 9L;
        Long nguoiThueId = 12L;
        Long dichVuId = 6L;

        when(phongRepository.findById(phongId)).thenReturn(Optional.of(
                new Phong(phongId, 1L, "501", 3, new BigDecimal("22.50"), 4, new BigDecimal("3500000.00"), "Studio", TrangThaiPhong.TRONG)
        ));
        when(nguoiThueRepository.findById(nguoiThueId)).thenReturn(Optional.of(
                new NguoiThue(nguoiThueId, "Phạm Ngọc An", LocalDate.of(2000, 1, 1), "0900001007", "079123456785", "Nam Định", null)
        ));
        when(dichVuRepository.findById(dichVuId)).thenReturn(Optional.of(
                new DichVu(dichVuId, 1L, "Internet", null, null, "tháng", false, true)
        ));
        when(phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(eq(quanLy), eq(1L))).thenReturn(
                new ToaNha(1L, "T01", "Toà A", "Địa chỉ", 5, 25, 7, "970405", "0123456789", new BigDecimal("0.15"), false)
        );
        when(hopDongRepository.insert(any())).thenThrow(
                new DataIntegrityViolationException("duplicate key", new SQLException("duplicate key", "23505"))
        );

        assertThatThrownBy(() -> hopDongService.tao(
                new YeuCauHopDong(
                        phongId,
                        nguoiThueId,
                        LocalDate.of(2040, 9, 10),
                        LocalDate.of(2040, 9, 20),
                        new BigDecimal("3500000.00"),
                        new BigDecimal("3500000.00"),
                        30,
                        List.of(new YeuCauHopDongDichVu(dichVuId, new BigDecimal("250000.00")))
                ),
                quanLy
        ))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("duplicate key");

        verify(hopDongRepository, never()).findXungDotTheoPhongVaKhoangNgay(any(), any(), any());
        verify(hopDongRepository, never()).insertDichVuApDung(any());
    }

    @Test
    void taoHopDong_dichVuBacThang_khongCanTimDonGiaCoDinh() {
        NguoiDung quanLy = new NguoiDung(3L, "Quản lý", "0900000003", "hash", VaiTro.QUAN_LY, TrangThaiNguoiDung.HOAT_DONG, 0, null);
        Long phongId = 9L;
        Long nguoiThueId = 12L;
        Long dichVuDienId = 7L;

        when(phongRepository.findById(phongId)).thenReturn(Optional.of(
                new Phong(phongId, 1L, "501", 3, new BigDecimal("22.50"), 4, new BigDecimal("3500000.00"), "Studio", TrangThaiPhong.TRONG)
        ));
        when(nguoiThueRepository.findById(nguoiThueId)).thenReturn(Optional.of(
                new NguoiThue(nguoiThueId, "Phạm Ngọc An", LocalDate.of(2000, 1, 1), "0900001007", "079123456785", "Nam Định", null)
        ));
        // Dịch vụ bậc thang
        when(dichVuRepository.findById(dichVuDienId)).thenReturn(Optional.of(
                new DichVu(dichVuDienId, 1L, "Điện sinh hoạt bậc thang", com.prj1.ccm.toanha.CachTinh.THEO_CHI_SO, com.prj1.ccm.toanha.CheDoGia.BAC_THANG, "kWh", true, true)
        ));
        when(bangGiaRepository.findApplicableNgayHieuLucBacThangByDichVuIdAndNgay(eq(dichVuDienId), any())).thenReturn(
                Optional.of(LocalDate.of(2026, 1, 1))
        );
        when(phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(eq(quanLy), eq(1L))).thenReturn(
                new ToaNha(1L, "T01", "Toà A", "Địa chỉ", 5, 25, 7, "970405", "0123456789", new BigDecimal("0.15"), false)
        );
        when(hopDongRepository.insert(any())).thenReturn(1001L);
        when(hopDongRepository.findViewById(1001L)).thenReturn(Optional.of(
                new HopDongRepository.HopDongView(
                        new HopDong(1001L, phongId, nguoiThueId, LocalDate.of(2040, 9, 10), LocalDate.of(2040, 9, 20),
                                new BigDecimal("3500000.00"), new BigDecimal("3500000.00"), 30, TrangThaiHopDong.CHO_KY),
                        1L, "501", "Phạm Ngọc An"
                )
        ));
        when(hopDongRepository.findDichVuApDungByHopDongId(1001L)).thenReturn(
                List.of(ThongTinHopDongDichVu.tao(dichVuDienId, "Điện sinh hoạt bậc thang", BigDecimal.ZERO))
        );

        // donGiaApDung = null (như khi bấm "Chọn tất cả" trên UI)
        ThongTinHopDong ketQua = hopDongService.tao(new YeuCauHopDong(
                phongId, nguoiThueId, LocalDate.of(2040, 9, 10), LocalDate.of(2040, 9, 20),
                new BigDecimal("3500000.00"), new BigDecimal("3500000.00"), 30,
                List.of(new YeuCauHopDongDichVu(dichVuDienId, null))
        ), quanLy);

        assertThat(ketQua).isNotNull();
        // Không hề gọi bangGiaRepository tìm đơn giá cố định
        verify(bangGiaRepository, never()).findApplicableByDichVuIdAndNgay(any(), any());
        verify(hopDongRepository).insertDichVuApDung(argThat(list -> {
            assertThat(list).hasSize(1);
            assertThat(list.get(0).donGiaApDung()).isEqualByComparingTo(BigDecimal.ZERO);
            return true;
        }));
    }

    @Test
    void taoHopDong_dichVuBacThangThieuBangGia_nemLoiBadRequest() {
        NguoiDung quanLy = new NguoiDung(3L, "Quản lý", "0900000003", "hash", VaiTro.QUAN_LY, TrangThaiNguoiDung.HOAT_DONG, 0, null);
        Long phongId = 101L;
        Long nguoiThueId = 201L;
        Long dichVuDienId = 301L;

        when(phongRepository.findById(phongId)).thenReturn(Optional.of(
                new Phong(phongId, 1L, "501", 5, new BigDecimal("25.00"), 2, new BigDecimal("3500000.00"), "Studio", TrangThaiPhong.TRONG)
        ));
        when(nguoiThueRepository.findById(nguoiThueId)).thenReturn(Optional.of(
                new NguoiThue(nguoiThueId, "Phạm Ngọc An", LocalDate.of(2000, 1, 1), "0900001007", "079123456785", "Nam Định", null)
        ));
        when(dichVuRepository.findById(dichVuDienId)).thenReturn(Optional.of(
                new DichVu(dichVuDienId, 1L, "Điện sinh hoạt bậc thang", com.prj1.ccm.toanha.CachTinh.THEO_CHI_SO, com.prj1.ccm.toanha.CheDoGia.BAC_THANG, "kWh", true, true)
        ));
        when(phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(eq(quanLy), eq(1L))).thenReturn(
                new ToaNha(1L, "T01", "Toà A", "Địa chỉ", 5, 25, 7, "970405", "0123456789", new BigDecimal("0.15"), false)
        );
        // Thiếu bảng giá bậc thang hiệu lực
        when(bangGiaRepository.findApplicableNgayHieuLucBacThangByDichVuIdAndNgay(eq(dichVuDienId), any()))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> hopDongService.tao(new YeuCauHopDong(
                phongId, nguoiThueId, LocalDate.of(2040, 9, 10), LocalDate.of(2040, 9, 20),
                new BigDecimal("3500000.00"), new BigDecimal("3500000.00"), 30,
                List.of(new YeuCauHopDongDichVu(dichVuDienId, null))
        ), quanLy))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> {
                    ResponseStatusException rse = (ResponseStatusException) e;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(rse.getReason()).contains("chưa có bảng giá bậc thang hiệu lực");
                });
    }

    @Test
    void taoHopDong_dichVuBacThangThieuBangGia_ngayCaKhiCoDonGiaApDung_nemLoiBadRequest() {
        NguoiDung quanLy = new NguoiDung(3L, "Quản lý", "0900000003", "hash", VaiTro.QUAN_LY, TrangThaiNguoiDung.HOAT_DONG, 0, null);
        Long phongId = 101L;
        Long nguoiThueId = 201L;
        Long dichVuDienId = 301L;

        when(phongRepository.findById(phongId)).thenReturn(Optional.of(
                new Phong(phongId, 1L, "501", 5, new BigDecimal("25.00"), 2, new BigDecimal("3500000.00"), "Studio", TrangThaiPhong.TRONG)
        ));
        when(nguoiThueRepository.findById(nguoiThueId)).thenReturn(Optional.of(
                new NguoiThue(nguoiThueId, "Phạm Ngọc An", LocalDate.of(2000, 1, 1), "0900001007", "079123456785", "Nam Định", null)
        ));
        when(dichVuRepository.findById(dichVuDienId)).thenReturn(Optional.of(
                new DichVu(dichVuDienId, 1L, "Điện sinh hoạt bậc thang", com.prj1.ccm.toanha.CachTinh.THEO_CHI_SO, com.prj1.ccm.toanha.CheDoGia.BAC_THANG, "kWh", true, true)
        ));
        when(phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(eq(quanLy), eq(1L))).thenReturn(
                new ToaNha(1L, "T01", "Toà A", "Địa chỉ", 5, 25, 7, "970405", "0123456789", new BigDecimal("0.15"), false)
        );
        when(bangGiaRepository.findApplicableNgayHieuLucBacThangByDichVuIdAndNgay(eq(dichVuDienId), any()))
                .thenReturn(Optional.empty());

        // Truyền donGiaApDung = 3500 (cố tình bypass) -> vẫn phải bị chặn!
        assertThatThrownBy(() -> hopDongService.tao(new YeuCauHopDong(
                phongId, nguoiThueId, LocalDate.of(2040, 9, 10), LocalDate.of(2040, 9, 20),
                new BigDecimal("3500000.00"), new BigDecimal("3500000.00"), 30,
                List.of(new YeuCauHopDongDichVu(dichVuDienId, new BigDecimal("3500.00")))
        ), quanLy))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> {
                    ResponseStatusException rse = (ResponseStatusException) e;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(rse.getReason()).contains("chưa có bảng giá bậc thang hiệu lực");
                });
    }

    @Test
    void thanhLy_bienBanKhongThuocHopDong_nemLoiBadRequest() {
        NguoiDung quanLy = new NguoiDung(3L, "Quản lý", "0900000003", "hash", VaiTro.QUAN_LY, TrangThaiNguoiDung.HOAT_DONG, 0, null);
        Long hopDongId = 1001L;
        Long phongId = 101L;
        Long bienBanId = 999L;

        when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(
                new HopDongRepository.HopDongView(
                        new HopDong(hopDongId, phongId, 201L, LocalDate.of(2040, 1, 1), LocalDate.of(2040, 6, 30),
                                new BigDecimal("3500000.00"), new BigDecimal("3500000.00"), 30, TrangThaiHopDong.HIEU_LUC),
                        1L, "501", "Phạm Ngọc An"
                )
        ));
        when(phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(eq(quanLy), eq(1L))).thenReturn(
                new ToaNha(1L, "T01", "Toà A", "Địa chỉ", 5, 25, 7, "970405", "0123456789", new BigDecimal("0.15"), false)
        );
        // Biên bản thuộc hợp đồng khác (hopDongId = 2002L)
        when(hopDongRepository.timBienBanBanGiao(bienBanId)).thenReturn(Optional.of(
                new HopDongRepository.BienBanBanGiaoRecord(bienBanId, 2002L, phongId, "TRA_PHONG", BigDecimal.ZERO)
        ));

        assertThatThrownBy(() -> hopDongService.thanhLy(
                hopDongId,
                new YeuCauThanhLy(BigDecimal.ZERO, "Thanh lý", List.of(), bienBanId, false),
                quanLy
        ))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> {
                    ResponseStatusException rse = (ResponseStatusException) e;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(rse.getReason()).contains("không thuộc hợp đồng này");
                });
    }

    @Test
    void thanhLy_bienBanLaNhanPhong_nemLoiBadRequest() {
        NguoiDung quanLy = new NguoiDung(3L, "Quản lý", "0900000003", "hash", VaiTro.QUAN_LY, TrangThaiNguoiDung.HOAT_DONG, 0, null);
        Long hopDongId = 1001L;
        Long phongId = 101L;
        Long bienBanId = 888L;

        when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(
                new HopDongRepository.HopDongView(
                        new HopDong(hopDongId, phongId, 201L, LocalDate.of(2040, 1, 1), LocalDate.of(2040, 6, 30),
                                new BigDecimal("3500000.00"), new BigDecimal("3500000.00"), 30, TrangThaiHopDong.HIEU_LUC),
                        1L, "501", "Phạm Ngọc An"
                )
        ));
        when(phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(eq(quanLy), eq(1L))).thenReturn(
                new ToaNha(1L, "T01", "Toà A", "Địa chỉ", 5, 25, 7, "970405", "0123456789", new BigDecimal("0.15"), false)
        );
        // Biên bản là NHAN_PHONG, không phải TRA_PHONG
        when(hopDongRepository.timBienBanBanGiao(bienBanId)).thenReturn(Optional.of(
                new HopDongRepository.BienBanBanGiaoRecord(bienBanId, hopDongId, phongId, "NHAN_PHONG", BigDecimal.ZERO)
        ));

        assertThatThrownBy(() -> hopDongService.thanhLy(
                hopDongId,
                new YeuCauThanhLy(BigDecimal.ZERO, "Thanh lý", List.of(), bienBanId, false),
                quanLy
        ))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> {
                    ResponseStatusException rse = (ResponseStatusException) e;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(rse.getReason()).contains("Chỉ được dùng biên bản trả phòng (TRA_PHONG)");
                });
    }

    @Test
    void thanhLy_khauTruLechKhongXacNhan_nemLoiBadRequest() {
        NguoiDung quanLy = new NguoiDung(3L, "Quản lý", "0900000003", "hash", VaiTro.QUAN_LY, TrangThaiNguoiDung.HOAT_DONG, 0, null);
        Long hopDongId = 1001L;
        Long phongId = 101L;
        Long bienBanId = 777L;

        when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(
                new HopDongRepository.HopDongView(
                        new HopDong(hopDongId, phongId, 201L, LocalDate.of(2040, 1, 1), LocalDate.of(2040, 6, 30),
                                new BigDecimal("3500000.00"), new BigDecimal("3500000.00"), 30, TrangThaiHopDong.HIEU_LUC),
                        1L, "501", "Phạm Ngọc An"
                )
        ));
        when(phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(eq(quanLy), eq(1L))).thenReturn(
                new ToaNha(1L, "T01", "Toà A", "Địa chỉ", 5, 25, 7, "970405", "0123456789", new BigDecimal("0.15"), false)
        );
        // Biên bản ghi nhận khấu trừ 500.000 đ
        when(hopDongRepository.timBienBanBanGiao(bienBanId)).thenReturn(Optional.of(
                new HopDongRepository.BienBanBanGiaoRecord(bienBanId, hopDongId, phongId, "TRA_PHONG", new BigDecimal("500000.00"))
        ));

        // Request gửi lên 0 đ, nhưng xacNhanChenhLech = false -> Bắt buộc ném 400!
        assertThatThrownBy(() -> hopDongService.thanhLy(
                hopDongId,
                new YeuCauThanhLy(BigDecimal.ZERO, "", List.of(), bienBanId, false),
                quanLy
        ))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> {
                    ResponseStatusException rse = (ResponseStatusException) e;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(rse.getReason()).contains("Yêu cầu xác nhận chênh lệch");
                });
    }
}
