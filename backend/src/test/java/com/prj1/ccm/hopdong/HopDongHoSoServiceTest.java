package com.prj1.ccm.hopdong;

import com.lowagie.text.pdf.PdfReader;
import com.lowagie.text.pdf.parser.PdfTextExtractor;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.TrangThaiNguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.nguoithue.NguoiThue;
import com.prj1.ccm.nguoithue.NguoiThueRepository;
import com.prj1.ccm.toanha.*;
import com.prj1.ccm.taisan.TaiSanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HopDongHoSoServiceTest {

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

        @Mock
        private HopDongHoSoRepository hopDongHoSoRepository;

        @Mock
        private HopDongPhuLucRepository hopDongPhuLucRepository;

        @Mock
        private CauHinhBenARepository cauHinhBenARepository;

        @Mock
        private MauHopDongRepository mauHopDongRepository;

        @Mock
        private TaiSanRepository taiSanRepository;

        @Mock
        private ToaNhaRepository toaNhaRepository;

        private HopDongService hopDongService;
        private Clock fixedClock;
        private NguoiDung quanLy;

        @BeforeEach
        void setUp() {
                fixedClock = Clock.fixed(
                                LocalDate.of(2026, 11, 5).atStartOfDay(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant(),
                                ZoneId.of("Asia/Ho_Chi_Minh"));
                quanLy = new NguoiDung(3L, "Quản lý tòa nhà", "0900000003", "hash", VaiTro.QUAN_LY,
                                TrangThaiNguoiDung.HOAT_DONG, 0, null);

                hopDongService = new HopDongService(
                                hopDongRepository,
                                phongRepository,
                                nguoiThueRepository,
                                dichVuRepository,
                                bangGiaRepository,
                                nguoiOCungRepository,
                                phanQuyenToaService,
                                trangThaiPhongService,
                                null,
                                null,
                                null,
                                null,
                                hopDongHoSoRepository,
                                hopDongPhuLucRepository,
                                cauHinhBenARepository,
                                mauHopDongRepository,
                                taiSanRepository,
                                toaNhaRepository,
                                fixedClock);
        }

        @Test
        void layHoSoHopDong_chuaCoHoSo_taoBanDuThaoDeXuatDayDu() {
                Long hopDongId = 100L;
                HopDong hd = new HopDong(hopDongId, 10L, 20L, LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1),
                                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), 30,
                                TrangThaiHopDong.CHO_KY);
                HopDongRepository.HopDongView view = new HopDongRepository.HopDongView(hd, 1L, "301", "Trần Văn B");

                when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(view));
                when(hopDongRepository.layTongThuCoc(hopDongId)).thenReturn(new BigDecimal("4500000.00"));
                when(nguoiOCungRepository.findByHopDongId(hopDongId)).thenReturn(List.of());
                when(hopDongHoSoRepository.findLatestByHopDongId(hopDongId)).thenReturn(Optional.empty());

                CauHinhBenA benA = new CauHinhBenA(1L, 1L, "CA_NHAN", "Nguyễn Văn Chủ", "001090123456", "Hà Nội",
                                "0912345678", "chu@gmail.com", "Nguyễn Văn Chủ", "Chủ nhà", "CHU_SO_HUU", null, null,
                                "123456", "Vietcombank", "NGUYEN VAN CHU", null);
                when(cauHinhBenARepository.findByToaNhaId(1L)).thenReturn(Optional.of(benA));

                NguoiThue nt = new NguoiThue(20L, "Trần Văn B", LocalDate.of(1995, 5, 20), "0987654321", "001200009999",
                                "Nam Định", "HOAT_DONG", "CCCD", LocalDate.of(2021, 5, 10), "Cục CSQLHC về TTXH",
                                "Hà Nội", "Hà Nội", "b@gmail.com");
                when(nguoiThueRepository.findById(20L)).thenReturn(Optional.of(nt));

                HopDongHoSoDto dto = hopDongService.layHoSoHopDong(hopDongId, quanLy);

                assertThat(dto).isNotNull();
                assertThat(dto.trangThaiTaiLieu()).isEqualTo("DRAFT");
                assertThat(dto.benATenChuThe()).isEqualTo("Nguyễn Văn Chủ");
                assertThat(dto.benBHoTen()).isEqualTo("Trần Văn B");
                assertThat(dto.giaThue()).isEqualTo(new BigDecimal("4500000.00"));
                assertThat(dto.tienCocThucThu()).isEqualTo(new BigDecimal("4500000.00"));
        }

        private HopDongHoSo taoHoSoMau(Long id, Long hopDongId, int revision, String trangThai, String benATen,
                        String benBHoTen) {
                return new HopDongHoSo(
                                id, hopDongId, revision, trangThai, null, 1, "HỢP ĐỒNG THUÊ PHÒNG",
                                LocalDate.of(2026, 11, 1), "Hà Nội", "Để ở", "Phạm vi", LocalDate.of(2026, 11, 1),
                                "CHUYEN_KHOAN", 1, 5, "123456", "Thỏa thuận", null,
                                "CA_NHAN", benATen, "001090123456", "Hà Nội", "0912345678", "chu@gmail.com",
                                benATen, "Chủ nhà", "CHU_SO_HUU", null, null,
                                benBHoTen, LocalDate.of(1995, 5, 20), "CCCD", "001200009999", LocalDate.of(2021, 5, 10),
                                "Cục CSQLHC về TTXH", "Hà Nội", "Hà Nội", "0987654321", "b@gmail.com",
                                "Toà nhà MiniApart", "Hà Nội", "301", 3, new BigDecimal("25.0"),
                                "Điều khoản", "[]", "[]", "[]",
                                null, null, null, null, null, null, null,
                                LocalDateTime.of(2026, 11, 1, 10, 0), LocalDateTime.of(2026, 11, 1, 10, 0));
        }

        @Test
        void chotHoSo_thieuThongTinBenA_nemBadRequest() {
                Long hopDongId = 100L;
                HopDong hd = new HopDong(hopDongId, 10L, 20L, LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1),
                                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), 30,
                                TrangThaiHopDong.CHO_KY);
                HopDongRepository.HopDongView view = new HopDongRepository.HopDongView(hd, 1L, "301", "Trần Văn B");
                when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(view));

                HopDongHoSo draftChuaDu = taoHoSoMau(1L, hopDongId, 1, "DRAFT", null, "Trần Văn B");
                when(hopDongHoSoRepository.findLatestByHopDongId(hopDongId)).thenReturn(Optional.of(draftChuaDu));

                YeuCauChotHoSo req = new YeuCauChotHoSo(1, 1, null);

                assertThatThrownBy(() -> hopDongService.chotHoSo(hopDongId, req, quanLy))
                                .isInstanceOf(ResponseStatusException.class)
                                .hasMessageContaining("Thiếu thông tin bắt buộc của Bên cho thuê");
        }

        @Test
        void luuDraftHoSo_hopDongDaChot_nemConflict() {
                Long hopDongId = 100L;
                HopDong hd = new HopDong(hopDongId, 10L, 20L, LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1),
                                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), 30,
                                TrangThaiHopDong.CHO_KY);
                HopDongRepository.HopDongView view = new HopDongRepository.HopDongView(hd, 1L, "301", "Trần Văn B");
                when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(view));

                HopDongHoSo daChot = taoHoSoMau(1L, hopDongId, 1, "DA_CHOT", "Chủ nhà", "Trần Văn B");
                when(hopDongHoSoRepository.findLatestByHopDongId(hopDongId)).thenReturn(Optional.of(daChot));

                YeuCauLuuDraftHoSo draftReq = new YeuCauLuuDraftHoSo(1, 1, null, "Tiêu đề mới", null, null, null, null,
                                null, null, null, null, null, null, null, null, null, null, null, null, null, null,
                                null, null, null, null, null, null, null, null, null, null, null, null, null, null,
                                null);

                assertThatThrownBy(() -> hopDongService.luuDraftHoSo(hopDongId, draftReq, quanLy))
                                .isInstanceOf(ResponseStatusException.class)
                                .hasMessageContaining("Hồ sơ hợp đồng đã chốt không thể sửa trực tiếp");
        }

        @Test
        void taoPhuLuc_hopDongChuaChot_nemBadRequest() {
                Long hopDongId = 100L;
                HopDong hd = new HopDong(hopDongId, 10L, 20L, LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1),
                                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), 30,
                                TrangThaiHopDong.CHO_KY);
                HopDongRepository.HopDongView view = new HopDongRepository.HopDongView(hd, 1L, "301", "Trần Văn B");
                when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(view));

                HopDongHoSo draft = taoHoSoMau(1L, hopDongId, 1, "DRAFT", null, null);
                when(hopDongHoSoRepository.findLatestByHopDongId(hopDongId)).thenReturn(Optional.of(draft));

                YeuCauTaoPhuLuc req = new YeuCauTaoPhuLuc("Phụ lục 1", LocalDate.now(), LocalDate.now().plusMonths(1),
                                "Tăng giá thuê");

                assertThatThrownBy(() -> hopDongService.taoPhuLuc(hopDongId, req, quanLy))
                                .isInstanceOf(ResponseStatusException.class)
                                .hasMessageContaining("Chỉ được tạo phụ lục cho hợp đồng đã chốt");
        }

        @Test
        void ghiNhanKy_hopDongDangDraft_nemBadRequest() {
                Long hopDongId = 100L;
                HopDong hd = new HopDong(hopDongId, 10L, 20L, LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1),
                                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), 30,
                                TrangThaiHopDong.CHO_KY);
                HopDongRepository.HopDongView view = new HopDongRepository.HopDongView(hd, 1L, "301", "Trần Văn B");
                when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(view));

                HopDongHoSo draft = taoHoSoMau(1L, hopDongId, 1, "DRAFT", null, null);
                when(hopDongHoSoRepository.findLatestByHopDongId(hopDongId)).thenReturn(Optional.of(draft));

                YeuCauGhiNhanKy req = new YeuCauGhiNhanKy(LocalDate.now(), "Đã ký", null);

                assertThatThrownBy(() -> hopDongService.ghiNhanKy(hopDongId, req, quanLy))
                                .isInstanceOf(ResponseStatusException.class)
                                .hasMessageContaining("phải chốt hồ sơ trước khi ghi nhận ký");
        }

        @Test
        void luuDraftHoSo_saiExpectedRevision_nemConflict() {
                Long hopDongId = 100L;
                HopDong hd = new HopDong(hopDongId, 10L, 20L, LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1),
                                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), 30,
                                TrangThaiHopDong.CHO_KY);
                HopDongRepository.HopDongView view = new HopDongRepository.HopDongView(hd, 1L, "301", "Trần Văn B");
                when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(view));

                HopDongHoSo existing = taoHoSoMau(1L, hopDongId, 2, "DRAFT", "Chủ A", "Khách B");
                when(hopDongHoSoRepository.findLatestByHopDongId(hopDongId)).thenReturn(Optional.of(existing));

                // Client passes stale revision 1 while server is at revision 2
                YeuCauLuuDraftHoSo draftReq = new YeuCauLuuDraftHoSo(1, 1, null, "Sửa nháp", null, null, null, null,
                                null, null, null, null, null, null, null, null, null, null, null, null, null, null,
                                null, null, null, null, null, null, null, null, null, null, null, null, null, null,
                                null);

                assertThatThrownBy(() -> hopDongService.luuDraftHoSo(hopDongId, draftReq, quanLy))
                                .isInstanceOf(ResponseStatusException.class)
                                .hasMessageContaining("phiên bản không khớp");
        }

        @Test
        void chotHoSo_saiExpectedRevision_nemConflict() {
                Long hopDongId = 100L;
                HopDong hd = new HopDong(hopDongId, 10L, 20L, LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1),
                                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), 30,
                                TrangThaiHopDong.CHO_KY);
                HopDongRepository.HopDongView view = new HopDongRepository.HopDongView(hd, 1L, "301", "Trần Văn B");
                when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(view));

                HopDongHoSo existing = taoHoSoMau(1L, hopDongId, 3, "DRAFT", "Chủ A", "Khách B");
                when(hopDongHoSoRepository.findLatestByHopDongId(hopDongId)).thenReturn(Optional.of(existing));

                // Client attempts to seal with stale expected revision 2
                YeuCauChotHoSo req = new YeuCauChotHoSo(2, 2, null);

                assertThatThrownBy(() -> hopDongService.chotHoSo(hopDongId, req, quanLy))
                                .isInstanceOf(ResponseStatusException.class)
                                .hasMessageContaining("phiên bản không khớp");
        }

        @Test
        void chotHoSo_bienBanKhacToaNha_nemForbidden() {
                Long hopDongId = 100L;
                HopDong hd = new HopDong(hopDongId, 10L, 20L, LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1),
                                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), 30,
                                TrangThaiHopDong.CHO_KY);
                HopDongRepository.HopDongView view = new HopDongRepository.HopDongView(hd, 1L, "301", "Trần Văn B");
                when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(view));

                HopDongHoSo draftWithForeignBb = taoHoSoMau(1L, hopDongId, 1, "DRAFT", "Chủ A", "Khách B");
                // Gắn biên bản của toà nhà 2
                HopDongHoSo draftWithBb2 = new HopDongHoSo(
                                draftWithForeignBb.id(), draftWithForeignBb.hopDongId(), draftWithForeignBb.revision(),
                                draftWithForeignBb.trangThaiTaiLieu(),
                                draftWithForeignBb.mauHopDongId(), draftWithForeignBb.mauPhienBan(),
                                draftWithForeignBb.tieuDe(), draftWithForeignBb.ngayLap(),
                                draftWithForeignBb.diaDiemLap(), draftWithForeignBb.mucDichThue(),
                                draftWithForeignBb.phamViSuDung(), draftWithForeignBb.ngayNhanPhong(),
                                draftWithForeignBb.phuongThucThanhToan(), draftWithForeignBb.kyThanhToanThang(),
                                draftWithForeignBb.hanThanhToanNgay(),
                                draftWithForeignBb.taiKhoanNhanTien(), draftWithForeignBb.dieuKienDieuChinhGia(), 999L, // biên
                                                                                                                        // bản
                                                                                                                        // ID
                                                                                                                        // 999
                                draftWithForeignBb.benALoaiChuThe(), draftWithForeignBb.benATenChuThe(),
                                draftWithForeignBb.benADinhDanh(), draftWithForeignBb.benADiaChi(),
                                draftWithForeignBb.benADienThoai(), draftWithForeignBb.benAEmail(),
                                draftWithForeignBb.benANguoiKy(), draftWithForeignBb.benAChucVu(),
                                draftWithForeignBb.benATuCachKy(), draftWithForeignBb.benACanCuUyQuyen(),
                                draftWithForeignBb.benADonViQuanLy(),
                                draftWithForeignBb.benBHoTen(), draftWithForeignBb.benBNgaySinh(),
                                draftWithForeignBb.benBLoaiGiayTo(), draftWithForeignBb.benBSoGiayTo(),
                                draftWithForeignBb.benBNgayCap(), draftWithForeignBb.benBNoiCap(),
                                draftWithForeignBb.benBThuongTru(), draftWithForeignBb.benBLienHe(),
                                draftWithForeignBb.benBDienThoai(), draftWithForeignBb.benBEmail(),
                                draftWithForeignBb.bdsTenToaNha(), draftWithForeignBb.bdsDiaChiToaNha(),
                                draftWithForeignBb.bdsSoPhong(), draftWithForeignBb.bdsTang(),
                                draftWithForeignBb.bdsDienTich(), draftWithForeignBb.dieuKhoanTuyBien(),
                                draftWithForeignBb.snapshotDichVuJson(), draftWithForeignBb.snapshotTaiSanJson(),
                                draftWithForeignBb.snapshotNguoiOCungJson(),
                                null, null, null, null, null, null, null, draftWithForeignBb.taoLuc(),
                                draftWithForeignBb.capNhatLuc());
                when(hopDongHoSoRepository.findLatestByHopDongId(hopDongId)).thenReturn(Optional.of(draftWithBb2));

                // Biên bản 999 thuộc hợp đồng khác (hopDongId 200, toaNhaId 2)
                TaiSanRepository.ThongTinKiemTraBienBan bbInfo = new TaiSanRepository.ThongTinKiemTraBienBan(999L, 200L,
                                99L, 2L, "NHAN_PHONG");
                when(taiSanRepository.layThongTinKiemTraBienBan(999L)).thenReturn(Optional.of(bbInfo));

                YeuCauChotHoSo req = new YeuCauChotHoSo(1, 1, null);

                assertThatThrownBy(() -> hopDongService.chotHoSo(hopDongId, req, quanLy))
                                .isInstanceOf(ResponseStatusException.class)
                                .hasMessageContaining("Biên bản bàn giao không thuộc hợp đồng");
        }

        @Test
        void chotHoSo_mauHopDongKhacToa_nemForbidden() {
                Long hopDongId = 100L;
                HopDong hd = new HopDong(hopDongId, 10L, 20L, LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1),
                                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), 30,
                                TrangThaiHopDong.CHO_KY);
                HopDongRepository.HopDongView view = new HopDongRepository.HopDongView(hd, 1L, "301", "Trần Văn B");
                when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(view));

                HopDongHoSo draft = taoHoSoMau(1L, hopDongId, 1, "DRAFT", "Chủ A", "Khách B");
                HopDongHoSo draftWithMau = new HopDongHoSo(
                                draft.id(), draft.hopDongId(), draft.revision(), draft.trangThaiTaiLieu(),
                                50L, 1, draft.tieuDe(), draft.ngayLap(), // Mẫu 50L
                                draft.diaDiemLap(), draft.mucDichThue(), draft.phamViSuDung(), draft.ngayNhanPhong(),
                                draft.phuongThucThanhToan(), draft.kyThanhToanThang(), draft.hanThanhToanNgay(),
                                draft.taiKhoanNhanTien(), draft.dieuKienDieuChinhGia(), null,
                                draft.benALoaiChuThe(), draft.benATenChuThe(), draft.benADinhDanh(), draft.benADiaChi(),
                                draft.benADienThoai(), draft.benAEmail(), draft.benANguoiKy(), draft.benAChucVu(),
                                draft.benATuCachKy(), draft.benACanCuUyQuyen(), draft.benADonViQuanLy(),
                                draft.benBHoTen(), draft.benBNgaySinh(), draft.benBLoaiGiayTo(), draft.benBSoGiayTo(),
                                draft.benBNgayCap(), draft.benBNoiCap(), draft.benBThuongTru(), draft.benBLienHe(),
                                draft.benBDienThoai(), draft.benBEmail(),
                                draft.bdsTenToaNha(), draft.bdsDiaChiToaNha(), draft.bdsSoPhong(), draft.bdsTang(),
                                draft.bdsDienTich(), draft.dieuKhoanTuyBien(), draft.snapshotDichVuJson(),
                                draft.snapshotTaiSanJson(), draft.snapshotNguoiOCungJson(),
                                null, null, null, null, null, null, null, draft.taoLuc(), draft.capNhatLuc());
                when(hopDongHoSoRepository.findLatestByHopDongId(hopDongId)).thenReturn(Optional.of(draftWithMau));

                // Mẫu 50 thuộc toà nhà 2, trong khi hợp đồng thuộc toà nhà 1
                MauHopDong mauToa2 = new MauHopDong(50L, 2L, "MẪU TOÀ 2", 1, "PUBLISHED", "HỢP ĐỒNG MẪU",
                                "Điều khoản mẫu", 1L, LocalDateTime.now(), LocalDateTime.now());
                when(mauHopDongRepository.findById(50L)).thenReturn(Optional.of(mauToa2));

                YeuCauChotHoSo req = new YeuCauChotHoSo(1, 1, null);

                assertThatThrownBy(() -> hopDongService.chotHoSo(hopDongId, req, quanLy))
                                .isInstanceOf(ResponseStatusException.class)
                                .hasMessageContaining("Mẫu hợp đồng không thuộc tòa nhà");
        }

        @Test
        void chotHoSo_mauHopDongChuaPublish_nemBadRequest() {
                Long hopDongId = 100L;
                HopDong hd = new HopDong(hopDongId, 10L, 20L, LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1),
                                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), 30,
                                TrangThaiHopDong.CHO_KY);
                HopDongRepository.HopDongView view = new HopDongRepository.HopDongView(hd, 1L, "301", "Trần Văn B");
                when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(view));

                HopDongHoSo draft = taoHoSoMau(1L, hopDongId, 1, "DRAFT", "Chủ A", "Khách B");
                HopDongHoSo draftWithMau = new HopDongHoSo(
                                draft.id(), draft.hopDongId(), draft.revision(), draft.trangThaiTaiLieu(),
                                60L, 1, draft.tieuDe(), draft.ngayLap(), // Mẫu 60L
                                draft.diaDiemLap(), draft.mucDichThue(), draft.phamViSuDung(), draft.ngayNhanPhong(),
                                draft.phuongThucThanhToan(), draft.kyThanhToanThang(), draft.hanThanhToanNgay(),
                                draft.taiKhoanNhanTien(), draft.dieuKienDieuChinhGia(), null,
                                draft.benALoaiChuThe(), draft.benATenChuThe(), draft.benADinhDanh(), draft.benADiaChi(),
                                draft.benADienThoai(), draft.benAEmail(), draft.benANguoiKy(), draft.benAChucVu(),
                                draft.benATuCachKy(), draft.benACanCuUyQuyen(), draft.benADonViQuanLy(),
                                draft.benBHoTen(), draft.benBNgaySinh(), draft.benBLoaiGiayTo(), draft.benBSoGiayTo(),
                                draft.benBNgayCap(), draft.benBNoiCap(), draft.benBThuongTru(), draft.benBLienHe(),
                                draft.benBDienThoai(), draft.benBEmail(),
                                draft.bdsTenToaNha(), draft.bdsDiaChiToaNha(), draft.bdsSoPhong(), draft.bdsTang(),
                                draft.bdsDienTich(), draft.dieuKhoanTuyBien(), draft.snapshotDichVuJson(),
                                draft.snapshotTaiSanJson(), draft.snapshotNguoiOCungJson(),
                                null, null, null, null, null, null, null, draft.taoLuc(), draft.capNhatLuc());
                when(hopDongHoSoRepository.findLatestByHopDongId(hopDongId)).thenReturn(Optional.of(draftWithMau));

                // Mẫu 60 thuộc đúng toà 1 nhưng trạng thái là DRAFT
                MauHopDong mauDraft = new MauHopDong(60L, 1L, "MẪU DRAFT", 1, "DRAFT", "HỢP ĐỒNG DRAFT",
                                "Điều khoản nháp", 1L, LocalDateTime.now(), LocalDateTime.now());
                when(mauHopDongRepository.findById(60L)).thenReturn(Optional.of(mauDraft));

                YeuCauChotHoSo req = new YeuCauChotHoSo(1, 1, null);

                assertThatThrownBy(() -> hopDongService.chotHoSo(hopDongId, req, quanLy))
                                .isInstanceOf(ResponseStatusException.class)
                                .hasMessageContaining("chưa được xuất bản");
        }

        @Test
        void chotHoSo_uyQuyenThieuCanCu_nemBadRequest() {
                Long hopDongId = 100L;
                HopDong hd = new HopDong(hopDongId, 10L, 20L, LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1),
                                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), 30,
                                TrangThaiHopDong.CHO_KY);
                HopDongRepository.HopDongView view = new HopDongRepository.HopDongView(hd, 1L, "301", "Trần Văn B");
                when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(view));

                HopDongHoSo draft = taoHoSoMau(1L, hopDongId, 1, "DRAFT", "Chủ A", "Khách B");
                // Người ký có tư cách NGUOI_DUOC_UY_QUYEN nhưng không có căn cứ ủy quyền
                HopDongHoSo draftUyQuyenThieu = new HopDongHoSo(
                                draft.id(), draft.hopDongId(), draft.revision(), draft.trangThaiTaiLieu(),
                                null, 1, draft.tieuDe(), draft.ngayLap(),
                                draft.diaDiemLap(), draft.mucDichThue(), draft.phamViSuDung(), draft.ngayNhanPhong(),
                                draft.phuongThucThanhToan(), draft.kyThanhToanThang(), draft.hanThanhToanNgay(),
                                draft.taiKhoanNhanTien(), draft.dieuKienDieuChinhGia(), null,
                                draft.benALoaiChuThe(), draft.benATenChuThe(), draft.benADinhDanh(), draft.benADiaChi(),
                                draft.benADienThoai(), draft.benAEmail(), draft.benANguoiKy(), draft.benAChucVu(),
                                "NGUOI_DUOC_UY_QUYEN", null, // Thiếu benACanCuUyQuyen
                                draft.benADonViQuanLy(),
                                draft.benBHoTen(), draft.benBNgaySinh(), draft.benBLoaiGiayTo(), draft.benBSoGiayTo(),
                                draft.benBNgayCap(), draft.benBNoiCap(), draft.benBThuongTru(), draft.benBLienHe(),
                                draft.benBDienThoai(), draft.benBEmail(),
                                draft.bdsTenToaNha(), draft.bdsDiaChiToaNha(), draft.bdsSoPhong(), draft.bdsTang(),
                                draft.bdsDienTich(), draft.dieuKhoanTuyBien(), draft.snapshotDichVuJson(),
                                draft.snapshotTaiSanJson(), draft.snapshotNguoiOCungJson(),
                                null, null, null, null, null, null, null, draft.taoLuc(), draft.capNhatLuc());
                when(hopDongHoSoRepository.findLatestByHopDongId(hopDongId)).thenReturn(Optional.of(draftUyQuyenThieu));

                YeuCauChotHoSo req = new YeuCauChotHoSo(1, 1, null);

                assertThatThrownBy(() -> hopDongService.chotHoSo(hopDongId, req, quanLy))
                                .isInstanceOf(ResponseStatusException.class)
                                .hasMessageContaining("Người được ủy quyền bắt buộc phải có thông tin Căn cứ ủy quyền");
        }

        @Test
        void chotHoSo_benBThieuDiaChiThuongTru_nemBadRequest() {
                Long hopDongId = 100L;
                HopDong hd = new HopDong(hopDongId, 10L, 20L, LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1),
                                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), 30,
                                TrangThaiHopDong.CHO_KY);
                HopDongRepository.HopDongView view = new HopDongRepository.HopDongView(hd, 1L, "301", "Trần Văn B");
                when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(view));

                HopDongHoSo draft = taoHoSoMau(1L, hopDongId, 1, "DRAFT", "Chủ A", "Khách B");
                // Bên B thiếu địa chỉ thường trú
                HopDongHoSo draftThieuThuongTru = new HopDongHoSo(
                                draft.id(), draft.hopDongId(), draft.revision(), draft.trangThaiTaiLieu(),
                                null, 1, draft.tieuDe(), draft.ngayLap(),
                                draft.diaDiemLap(), draft.mucDichThue(), draft.phamViSuDung(), draft.ngayNhanPhong(),
                                draft.phuongThucThanhToan(), draft.kyThanhToanThang(), draft.hanThanhToanNgay(),
                                draft.taiKhoanNhanTien(), draft.dieuKienDieuChinhGia(), null,
                                draft.benALoaiChuThe(), draft.benATenChuThe(), draft.benADinhDanh(), draft.benADiaChi(),
                                draft.benADienThoai(), draft.benAEmail(), draft.benANguoiKy(), draft.benAChucVu(),
                                draft.benATuCachKy(), draft.benACanCuUyQuyen(), draft.benADonViQuanLy(),
                                draft.benBHoTen(), draft.benBNgaySinh(), draft.benBLoaiGiayTo(), draft.benBSoGiayTo(),
                                draft.benBNgayCap(), draft.benBNoiCap(), null, // Thiếu benBThuongTru (không được lấy
                                                                               // queQuan thay thế)
                                draft.benBLienHe(), draft.benBDienThoai(), draft.benBEmail(),
                                draft.bdsTenToaNha(), draft.bdsDiaChiToaNha(), draft.bdsSoPhong(), draft.bdsTang(),
                                draft.bdsDienTich(), draft.dieuKhoanTuyBien(), draft.snapshotDichVuJson(),
                                draft.snapshotTaiSanJson(), draft.snapshotNguoiOCungJson(),
                                null, null, null, null, null, null, null, draft.taoLuc(), draft.capNhatLuc());
                when(hopDongHoSoRepository.findLatestByHopDongId(hopDongId))
                                .thenReturn(Optional.of(draftThieuThuongTru));

                YeuCauChotHoSo req = new YeuCauChotHoSo(1, 1, null);

                assertThatThrownBy(() -> hopDongService.chotHoSo(hopDongId, req, quanLy))
                                .isInstanceOf(ResponseStatusException.class)
                                .hasMessageContaining("địa chỉ thường trú");
        }

        @Test
        void ghiNhanKy_ngayKyTuongLai_nemBadRequest() {
                Long hopDongId = 100L;
                HopDong hd = new HopDong(hopDongId, 10L, 20L, LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1),
                                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), 30,
                                TrangThaiHopDong.CHO_KY);
                HopDongRepository.HopDongView view = new HopDongRepository.HopDongView(hd, 1L, "301", "Trần Văn B");
                when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(view));

                HopDongHoSo daChot = taoHoSoMau(1L, hopDongId, 1, "DA_CHOT", "Chủ A", "Khách B");
                when(hopDongHoSoRepository.findLatestByHopDongId(hopDongId)).thenReturn(Optional.of(daChot));

                // Ngày ký ở tương lai (2026-11-10 so với fixedClock 2026-11-05)
                YeuCauGhiNhanKy req = new YeuCauGhiNhanKy(LocalDate.of(2026, 11, 10), "Ký trước", null);

                assertThatThrownBy(() -> hopDongService.ghiNhanKy(hopDongId, req, quanLy))
                                .isInstanceOf(ResponseStatusException.class)
                                .hasMessageContaining("không được ở tương lai");
        }

        @Test
        void ghiNhanKy_hopDongDaKy_nemConflict() {
                Long hopDongId = 100L;
                HopDong hd = new HopDong(hopDongId, 10L, 20L, LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1),
                                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), 30,
                                TrangThaiHopDong.CHO_KY);
                HopDongRepository.HopDongView view = new HopDongRepository.HopDongView(hd, 1L, "301", "Trần Văn B");
                when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(view));

                HopDongHoSo daKy = taoHoSoMau(1L, hopDongId, 1, "DA_GHI_NHAN_KY", "Chủ A", "Khách B");
                when(hopDongHoSoRepository.findLatestByHopDongId(hopDongId)).thenReturn(Optional.of(daKy));

                YeuCauGhiNhanKy req = new YeuCauGhiNhanKy(LocalDate.of(2026, 11, 5), "Ghi nhận lại", null);

                assertThatThrownBy(() -> hopDongService.ghiNhanKy(hopDongId, req, quanLy))
                                .isInstanceOf(ResponseStatusException.class)
                                .hasMessageContaining("không thể ghi đè");
        }

        @Test
        void ghiNhanKy_fileScanChuaPathTraversal_nemBadRequest() {
                Long hopDongId = 100L;
                HopDong hd = new HopDong(hopDongId, 10L, 20L, LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1),
                                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), 30,
                                TrangThaiHopDong.CHO_KY);
                HopDongRepository.HopDongView view = new HopDongRepository.HopDongView(hd, 1L, "301", "Trần Văn B");
                when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(view));

                HopDongHoSo daChot = taoHoSoMau(1L, hopDongId, 1, "DA_CHOT", "Chủ A", "Khách B");
                when(hopDongHoSoRepository.findLatestByHopDongId(hopDongId)).thenReturn(Optional.of(daChot));

                YeuCauGhiNhanKy req = new YeuCauGhiNhanKy(LocalDate.of(2026, 11, 5), "Đã ký", "../../etc/passwd");

                assertThatThrownBy(() -> hopDongService.ghiNhanKy(hopDongId, req, quanLy))
                                .isInstanceOf(ResponseStatusException.class)
                                .hasMessageContaining("không hợp lệ");
        }

        @Test
        void chotHoSo_dichVuBacThangTruocNgayHieuLucBangGia_nemBadRequest() {
                Long hopDongId = 100L;
                LocalDate ngayBatDau = LocalDate.of(2025, 1, 1);
                HopDong hd = new HopDong(hopDongId, 10L, 20L, ngayBatDau, LocalDate.of(2026, 1, 1),
                                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), 30,
                                TrangThaiHopDong.CHO_KY);
                HopDongRepository.HopDongView view = new HopDongRepository.HopDongView(hd, 1L, "301", "Trần Văn B");
                when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(view));

                HopDongHoSo draft = taoHoSoMau(1L, hopDongId, 1, "DRAFT", "Nguyễn Văn Chủ", "Trần Văn B");
                when(hopDongHoSoRepository.findLatestByHopDongId(hopDongId)).thenReturn(Optional.of(draft));

                ThongTinHopDongDichVu dv = new ThongTinHopDongDichVu(1L, "Điện sinh hoạt", null, "BAC_THANG");
                when(hopDongRepository.findDichVuApDungByHopDongId(hopDongId)).thenReturn(List.of(dv));

                DichVu entityDv = new DichVu(1L, 1L, "Điện sinh hoạt", CachTinh.THEO_CHI_SO, CheDoGia.BAC_THANG, "kWh",
                                true, true);
                when(dichVuRepository.findById(1L)).thenReturn(Optional.of(entityDv));

                // Ngày bắt đầu hợp đồng trước ngày hiệu lực bảng giá đầu tiên
                when(bangGiaRepository.findApplicableNgayHieuLucBacThangByDichVuIdAndNgay(1L, ngayBatDau))
                                .thenReturn(Optional.empty());

                YeuCauChotHoSo req = new YeuCauChotHoSo(1, 1, null);

                assertThatThrownBy(() -> hopDongService.chotHoSo(hopDongId, req, quanLy))
                                .isInstanceOf(ResponseStatusException.class)
                                .hasMessageContaining("chưa có bảng giá hiệu lực");
        }

        @Test
        void chotHoSo_dichVuBacThangRongBac_nemBadRequest() {
                Long hopDongId = 100L;
                LocalDate ngayBatDau = LocalDate.of(2026, 11, 1);
                HopDong hd = new HopDong(hopDongId, 10L, 20L, ngayBatDau, LocalDate.of(2027, 11, 1),
                                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), 30,
                                TrangThaiHopDong.CHO_KY);
                HopDongRepository.HopDongView view = new HopDongRepository.HopDongView(hd, 1L, "301", "Trần Văn B");
                when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(view));

                HopDongHoSo draft = taoHoSoMau(1L, hopDongId, 1, "DRAFT", "Nguyễn Văn Chủ", "Trần Văn B");
                when(hopDongHoSoRepository.findLatestByHopDongId(hopDongId)).thenReturn(Optional.of(draft));

                ThongTinHopDongDichVu dv = new ThongTinHopDongDichVu(1L, "Điện sinh hoạt", null, "BAC_THANG");
                when(hopDongRepository.findDichVuApDungByHopDongId(hopDongId)).thenReturn(List.of(dv));

                DichVu entityDv = new DichVu(1L, 1L, "Điện sinh hoạt", CachTinh.THEO_CHI_SO, CheDoGia.BAC_THANG, "kWh",
                                true, true);
                when(dichVuRepository.findById(1L)).thenReturn(Optional.of(entityDv));

                when(bangGiaRepository.findApplicableNgayHieuLucBacThangByDichVuIdAndNgay(1L, ngayBatDau))
                                .thenReturn(Optional.of(LocalDate.of(2026, 1, 1)));
                when(bangGiaRepository.findBacThangByDichVuIdAndNgayHieuLuc(1L, LocalDate.of(2026, 1, 1)))
                                .thenReturn(List.of());

                YeuCauChotHoSo req = new YeuCauChotHoSo(1, 1, null);

                assertThatThrownBy(() -> hopDongService.chotHoSo(hopDongId, req, quanLy))
                                .isInstanceOf(ResponseStatusException.class)
                                .hasMessageContaining("thiếu các bậc thang định mức");
        }

        @Test
        void chotHoSo_thanhCong_chuaDonGia0HopLeVaDongBangNguoiOCung() {
                Long hopDongId = 100L;
                LocalDate ngayBatDau = LocalDate.of(2026, 11, 1);
                HopDong hd = new HopDong(hopDongId, 10L, 20L, ngayBatDau, LocalDate.of(2027, 11, 1),
                                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), 30,
                                TrangThaiHopDong.CHO_KY);
                HopDongRepository.HopDongView view = new HopDongRepository.HopDongView(hd, 1L, "301", "Trần Văn B");
                when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(view));

                HopDongHoSo draft = taoHoSoMau(1L, hopDongId, 1, "DRAFT", "Nguyễn Văn Chủ", "Trần Văn B");
                when(hopDongHoSoRepository.findLatestByHopDongId(hopDongId)).thenReturn(Optional.of(draft));
                when(hopDongRepository.layTongThuCoc(hopDongId)).thenReturn(new BigDecimal("4500000.00"));

                // Dịch vụ cố định có đơn giá 0.00 (miễn phí hợp lệ)
                ThongTinHopDongDichVu dv = new ThongTinHopDongDichVu(2L, "Wifi miễn phí", "0.00", "CO_DINH");
                when(hopDongRepository.findDichVuApDungByHopDongId(hopDongId)).thenReturn(List.of(dv));
                DichVu entityDv = new DichVu(2L, 1L, "Wifi miễn phí", CachTinh.CO_DINH, CheDoGia.CO_DINH, "phòng",
                                false, true);
                when(dichVuRepository.findById(2L)).thenReturn(Optional.of(entityDv));

                NguoiOCung noc = new NguoiOCung(1L, hopDongId, 99L, "Bạn Cùng Phòng", "Bạn bè",
                                LocalDate.of(2026, 11, 1), null);
                when(nguoiOCungRepository.findByHopDongId(hopDongId)).thenReturn(List.of(noc));

                when(hopDongHoSoRepository.chotHoSo(eq(1L), eq(1), eq(quanLy.id()), any(), any(), any(), any()))
                                .thenReturn(1);

                YeuCauChotHoSo req = new YeuCauChotHoSo(1, 1, null);

                HopDongHoSoDto dto = hopDongService.chotHoSo(hopDongId, req, quanLy);
                assertThat(dto).isNotNull();

                verify(hopDongHoSoRepository).chotHoSo(
                                eq(1L), eq(1), eq(quanLy.id()), any(),
                                contains("Wifi miễn phí"),
                                any(),
                                contains("Bạn Cùng Phòng"));
        }

        @Test
        void layHoSoHopDong_daChot_baoToanSnapshotNguoiOCung_khongBiAnhHuongBoiDuLieuSong() {
                Long hopDongId = 100L;
                HopDong hd = new HopDong(hopDongId, 10L, 20L, LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1),
                                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), 30,
                                TrangThaiHopDong.CHO_KY);
                HopDongRepository.HopDongView view = new HopDongRepository.HopDongView(hd, 1L, "301", "Trần Văn B");
                when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(view));
                when(hopDongRepository.layTongThuCoc(hopDongId)).thenReturn(new BigDecimal("4500000.00"));

                // Snapshot đã đóng băng 1 người ở cùng
                String snapshotNoc = """
                                [
                                    {
                                        "id": 1,
                                        "hopDongId": 100,
                                        "nguoiThueId": 99,
                                        "hoTenNguoiThue": "Nguyễn Ở Cùng Gốc",
                                        "quanHe": "Bạn bè",
                                        "tuNgay": "2026-11-01",
                                        "denNgay": null
                                    }
                                ]
                                """;
                HopDongHoSo sealed = new HopDongHoSo(
                                1L, hopDongId, 1, "DA_CHOT", null, 1, "HỢP ĐỒNG THUÊ PHÒNG",
                                LocalDate.of(2026, 11, 1), "Hà Nội", "Để ở", "Phạm vi", LocalDate.of(2026, 11, 1),
                                "CHUYEN_KHOAN", 1, 5, "123456", "Thỏa thuận", null,
                                "CA_NHAN", "Chủ", "001090123456", "Hà Nội", "0912345678", "chu@gmail.com",
                                "Chủ", "Chủ nhà", "CHU_SO_HUU", null, null,
                                "Trần Văn B", LocalDate.of(1995, 5, 20), "CCCD", "001200009999", LocalDate.of(2021, 5, 10),
                                "Cục CS", "Hà Nội", "Hà Nội", "0987654321", "b@gmail.com",
                                "Toà nhà MiniApart", "Hà Nội", "301", 3, new BigDecimal("25.0"),
                                "Điều khoản", "[]", "[]", snapshotNoc,
                                1L, LocalDateTime.now(), null, null, null, null, null,
                                LocalDateTime.now(), LocalDateTime.now());
                when(hopDongHoSoRepository.findLatestByHopDongId(hopDongId)).thenReturn(Optional.of(sealed));

                HopDongHoSoDto dto = hopDongService.layHoSoHopDong(hopDongId, quanLy);

                assertThat(dto).isNotNull();
                assertThat(dto.dsNguoiOCung()).hasSize(1);
                assertThat(dto.dsNguoiOCung().get(0).hoTenNguoiThue()).isEqualTo("Nguyễn Ở Cùng Gốc");

                // Tuyệt đối không truy vấn repo dữ liệu sống khi hồ sơ đã chốt
                verify(nguoiOCungRepository, never()).findByHopDongId(any());
        }

        @Test
        void layHoSoHopDong_daChot_snapshotNguoiOCungRong_khongTruyVanDuLieuSong() {
                Long hopDongId = 100L;
                HopDong hd = new HopDong(hopDongId, 10L, 20L, LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1),
                                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), 30,
                                TrangThaiHopDong.CHO_KY);
                HopDongRepository.HopDongView view = new HopDongRepository.HopDongView(hd, 1L, "301", "Trần Văn B");
                when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(view));
                when(hopDongRepository.layTongThuCoc(hopDongId)).thenReturn(new BigDecimal("4500000.00"));

                // Snapshot rỗng "[]" hợp lệ
                HopDongHoSo sealed = taoHoSoMau(1L, hopDongId, 1, "DA_CHOT", "Chủ", "Trần Văn B");
                when(hopDongHoSoRepository.findLatestByHopDongId(hopDongId)).thenReturn(Optional.of(sealed));

                HopDongHoSoDto dto = hopDongService.layHoSoHopDong(hopDongId, quanLy);

                assertThat(dto).isNotNull();
                assertThat(dto.dsNguoiOCung()).isEmpty();
                verify(nguoiOCungRepository, never()).findByHopDongId(any());
        }

        @Test
        void layHoSoHopDong_daChot_snapshotNguoiOCungNull_nemBadRequest() {
                Long hopDongId = 100L;
                HopDong hd = new HopDong(hopDongId, 10L, 20L, LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1),
                                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), 30,
                                TrangThaiHopDong.CHO_KY);
                HopDongRepository.HopDongView view = new HopDongRepository.HopDongView(hd, 1L, "301", "Trần Văn B");
                when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(view));
                when(hopDongRepository.layTongThuCoc(hopDongId)).thenReturn(new BigDecimal("4500000.00"));

                // Snapshot người ở cùng là null (hồ sơ lịch sử nâng cấp sau V59 chưa có snapshot)
                HopDongHoSo sealedThieuSnapshot = new HopDongHoSo(
                                1L, hopDongId, 1, "DA_CHOT", null, 1, "HỢP ĐỒNG THUÊ PHÒNG",
                                LocalDate.of(2026, 11, 1), "Hà Nội", "Để ở", "Phạm vi", LocalDate.of(2026, 11, 1),
                                "CHUYEN_KHOAN", 1, 5, "123456", "Thỏa thuận", null,
                                "CA_NHAN", "Chủ", "001090123456", "Hà Nội", "0912345678", "chu@gmail.com",
                                "Chủ", "Chủ nhà", "CHU_SO_HUU", null, null,
                                "Trần Văn B", LocalDate.of(1995, 5, 20), "CCCD", "001200009999", LocalDate.of(2021, 5, 10),
                                "Cục CS", "Hà Nội", "Hà Nội", "0987654321", "b@gmail.com",
                                "Toà nhà MiniApart", "Hà Nội", "301", 3, new BigDecimal("25.0"),
                                "Điều khoản", "[]", "[]", null,
                                1L, LocalDateTime.now(), null, null, null, null, null,
                                LocalDateTime.now(), LocalDateTime.now());
                when(hopDongHoSoRepository.findLatestByHopDongId(hopDongId)).thenReturn(Optional.of(sealedThieuSnapshot));

                assertThatThrownBy(() -> hopDongService.layHoSoHopDong(hopDongId, quanLy))
                                .isInstanceOf(ResponseStatusException.class)
                                .hasMessageContaining("thiếu dữ liệu lịch sử người ở cùng (snapshot)");

                // Không được fallback đọc repo sống
                verify(nguoiOCungRepository, never()).findByHopDongId(any());
        }

        @Test
        void layHoSoHopDong_daChot_snapshotNguoiOCungBlank_nemBadRequest() {
                Long hopDongId = 100L;
                HopDong hd = new HopDong(hopDongId, 10L, 20L, LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1),
                                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), 30,
                                TrangThaiHopDong.CHO_KY);
                HopDongRepository.HopDongView view = new HopDongRepository.HopDongView(hd, 1L, "301", "Trần Văn B");
                when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(view));
                when(hopDongRepository.layTongThuCoc(hopDongId)).thenReturn(new BigDecimal("4500000.00"));

                HopDongHoSo sealedBlank = new HopDongHoSo(
                                1L, hopDongId, 1, "DA_CHOT", null, 1, "HỢP ĐỒNG THUÊ PHÒNG",
                                LocalDate.of(2026, 11, 1), "Hà Nội", "Để ở", "Phạm vi", LocalDate.of(2026, 11, 1),
                                "CHUYEN_KHOAN", 1, 5, "123456", "Thỏa thuận", null,
                                "CA_NHAN", "Chủ", "001090123456", "Hà Nội", "0912345678", "chu@gmail.com",
                                "Chủ", "Chủ nhà", "CHU_SO_HUU", null, null,
                                "Trần Văn B", LocalDate.of(1995, 5, 20), "CCCD", "001200009999", LocalDate.of(2021, 5, 10),
                                "Cục CS", "Hà Nội", "Hà Nội", "0987654321", "b@gmail.com",
                                "Toà nhà MiniApart", "Hà Nội", "301", 3, new BigDecimal("25.0"),
                                "Điều khoản", "[]", "[]", "   ",
                                1L, LocalDateTime.now(), null, null, null, null, null,
                                LocalDateTime.now(), LocalDateTime.now());
                when(hopDongHoSoRepository.findLatestByHopDongId(hopDongId)).thenReturn(Optional.of(sealedBlank));

                assertThatThrownBy(() -> hopDongService.layHoSoHopDong(hopDongId, quanLy))
                                .isInstanceOf(ResponseStatusException.class)
                                .hasMessageContaining("thiếu dữ liệu lịch sử người ở cùng (snapshot)");

                verify(nguoiOCungRepository, never()).findByHopDongId(any());
        }

        @Test
        void layHoSoHopDong_daChot_snapshotNguoiOCungHongJson_nemBadRequest() {
                Long hopDongId = 100L;
                HopDong hd = new HopDong(hopDongId, 10L, 20L, LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1),
                                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), 30,
                                TrangThaiHopDong.CHO_KY);
                HopDongRepository.HopDongView view = new HopDongRepository.HopDongView(hd, 1L, "301", "Trần Văn B");
                when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(view));
                when(hopDongRepository.layTongThuCoc(hopDongId)).thenReturn(new BigDecimal("4500000.00"));

                HopDongHoSo sealedHongJson = new HopDongHoSo(
                                1L, hopDongId, 1, "DA_CHOT", null, 1, "HỢP ĐỒNG THUÊ PHÒNG",
                                LocalDate.of(2026, 11, 1), "Hà Nội", "Để ở", "Phạm vi", LocalDate.of(2026, 11, 1),
                                "CHUYEN_KHOAN", 1, 5, "123456", "Thỏa thuận", null,
                                "CA_NHAN", "Chủ", "001090123456", "Hà Nội", "0912345678", "chu@gmail.com",
                                "Chủ", "Chủ nhà", "CHU_SO_HUU", null, null,
                                "Trần Văn B", LocalDate.of(1995, 5, 20), "CCCD", "001200009999", LocalDate.of(2021, 5, 10),
                                "Cục CS", "Hà Nội", "Hà Nội", "0987654321", "b@gmail.com",
                                "Toà nhà MiniApart", "Hà Nội", "301", 3, new BigDecimal("25.0"),
                                "Điều khoản", "[]", "[]", "{invalid_json",
                                1L, LocalDateTime.now(), null, null, null, null, null,
                                LocalDateTime.now(), LocalDateTime.now());
                when(hopDongHoSoRepository.findLatestByHopDongId(hopDongId)).thenReturn(Optional.of(sealedHongJson));

                assertThatThrownBy(() -> hopDongService.layHoSoHopDong(hopDongId, quanLy))
                                .isInstanceOf(ResponseStatusException.class)
                                .hasMessageContaining("lỗi định dạng JSON");

                verify(nguoiOCungRepository, never()).findByHopDongId(any());
        }

        @Test
        void layHoSoHopDong_daChot_snapshotNguoiOCungKhongPhaiMang_nemBadRequest() {
                Long hopDongId = 100L;
                HopDong hd = new HopDong(hopDongId, 10L, 20L, LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1),
                                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), 30,
                                TrangThaiHopDong.CHO_KY);
                HopDongRepository.HopDongView view = new HopDongRepository.HopDongView(hd, 1L, "301", "Trần Văn B");
                when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(view));
                when(hopDongRepository.layTongThuCoc(hopDongId)).thenReturn(new BigDecimal("4500000.00"));

                HopDongHoSo sealedObject = new HopDongHoSo(
                                1L, hopDongId, 1, "DA_CHOT", null, 1, "HỢP ĐỒNG THUÊ PHÒNG",
                                LocalDate.of(2026, 11, 1), "Hà Nội", "Để ở", "Phạm vi", LocalDate.of(2026, 11, 1),
                                "CHUYEN_KHOAN", 1, 5, "123456", "Thỏa thuận", null,
                                "CA_NHAN", "Chủ", "001090123456", "Hà Nội", "0912345678", "chu@gmail.com",
                                "Chủ", "Chủ nhà", "CHU_SO_HUU", null, null,
                                "Trần Văn B", LocalDate.of(1995, 5, 20), "CCCD", "001200009999", LocalDate.of(2021, 5, 10),
                                "Cục CS", "Hà Nội", "Hà Nội", "0987654321", "b@gmail.com",
                                "Toà nhà MiniApart", "Hà Nội", "301", 3, new BigDecimal("25.0"),
                                "Điều khoản", "[]", "[]", "{\"hoTen\":\"Không phải mảng\"}",
                                1L, LocalDateTime.now(), null, null, null, null, null,
                                LocalDateTime.now(), LocalDateTime.now());
                when(hopDongHoSoRepository.findLatestByHopDongId(hopDongId)).thenReturn(Optional.of(sealedObject));

                assertThatThrownBy(() -> hopDongService.layHoSoHopDong(hopDongId, quanLy))
                                .isInstanceOf(ResponseStatusException.class)
                                .hasMessageContaining("sai cấu trúc danh sách JSON");

                verify(nguoiOCungRepository, never()).findByHopDongId(any());
        }

        @Test
        void layHoSoHopDong_draft_docDuLieuSongNguoiOCung() {
                Long hopDongId = 100L;
                HopDong hd = new HopDong(hopDongId, 10L, 20L, LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1),
                                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), 30,
                                TrangThaiHopDong.CHO_KY);
                HopDongRepository.HopDongView view = new HopDongRepository.HopDongView(hd, 1L, "301", "Trần Văn B");
                when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(view));
                when(hopDongRepository.layTongThuCoc(hopDongId)).thenReturn(new BigDecimal("4500000.00"));

                HopDongHoSo draft = taoHoSoMau(1L, hopDongId, 1, "DRAFT", "Chủ", "Trần Văn B");
                when(hopDongHoSoRepository.findLatestByHopDongId(hopDongId)).thenReturn(Optional.of(draft));

                NguoiOCung liveNoc = new NguoiOCung(1L, hopDongId, 99L, "Người Sống", "Em", LocalDate.of(2026, 11, 1), null);
                when(nguoiOCungRepository.findByHopDongId(hopDongId)).thenReturn(List.of(liveNoc));

                HopDongHoSoDto dto = hopDongService.layHoSoHopDong(hopDongId, quanLy);

                assertThat(dto).isNotNull();
                assertThat(dto.dsNguoiOCung()).hasSize(1);
                assertThat(dto.dsNguoiOCung().get(0).hoTenNguoiThue()).isEqualTo("Người Sống");
                verify(nguoiOCungRepository).findByHopDongId(hopDongId);
        }

        @Test
        void chotHoSo_khongChonDichVu_thanhCongLuuSnapshotRong() {
                Long hopDongId = 100L;
                LocalDate ngayBatDau = LocalDate.of(2026, 11, 1);
                HopDong hd = new HopDong(hopDongId, 10L, 20L, ngayBatDau, LocalDate.of(2027, 11, 1),
                                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), 30,
                                TrangThaiHopDong.CHO_KY);
                HopDongRepository.HopDongView view = new HopDongRepository.HopDongView(hd, 1L, "301", "Trần Văn B");
                when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(view));

                HopDongHoSo draft = taoHoSoMau(1L, hopDongId, 1, "DRAFT", "Nguyễn Văn Chủ", "Trần Văn B");
                when(hopDongHoSoRepository.findLatestByHopDongId(hopDongId)).thenReturn(Optional.of(draft));
                when(hopDongRepository.layTongThuCoc(hopDongId)).thenReturn(new BigDecimal("4500000.00"));

                // Hợp đồng không chọn dịch vụ nào
                when(hopDongRepository.findDichVuApDungByHopDongId(hopDongId)).thenReturn(List.of());
                when(nguoiOCungRepository.findByHopDongId(hopDongId)).thenReturn(List.of());

                when(hopDongHoSoRepository.chotHoSo(eq(1L), eq(1), eq(quanLy.id()), any(), eq("[]"), eq("[]"), eq("[]")))
                                .thenReturn(1);

                YeuCauChotHoSo req = new YeuCauChotHoSo(1, 1, null);
                HopDongHoSoDto dto = hopDongService.chotHoSo(hopDongId, req, quanLy);

                assertThat(dto).isNotNull();
                verify(hopDongHoSoRepository).chotHoSo(
                                eq(1L), eq(1), eq(quanLy.id()), any(),
                                eq("[]"),
                                eq("[]"),
                                eq("[]"));
        }

        @Test
        void chotHoSo_dichVuCoDinhThieuDonGia_nemBadRequest() {
                Long hopDongId = 100L;
                LocalDate ngayBatDau = LocalDate.of(2026, 11, 1);
                HopDong hd = new HopDong(hopDongId, 10L, 20L, ngayBatDau, LocalDate.of(2027, 11, 1),
                                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), 30,
                                TrangThaiHopDong.CHO_KY);
                HopDongRepository.HopDongView view = new HopDongRepository.HopDongView(hd, 1L, "301", "Trần Văn B");
                when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(view));

                HopDongHoSo draft = taoHoSoMau(1L, hopDongId, 1, "DRAFT", "Nguyễn Văn Chủ", "Trần Văn B");
                when(hopDongHoSoRepository.findLatestByHopDongId(hopDongId)).thenReturn(Optional.of(draft));

                // Dịch vụ cố định nhưng không có đơn giá
                ThongTinHopDongDichVu dv = new ThongTinHopDongDichVu(2L, "Dịch vụ thiếu giá", null, "CO_DINH");
                when(hopDongRepository.findDichVuApDungByHopDongId(hopDongId)).thenReturn(List.of(dv));
                DichVu entityDv = new DichVu(2L, 1L, "Dịch vụ thiếu giá", CachTinh.CO_DINH, CheDoGia.CO_DINH, "phòng",
                                false, true);
                when(dichVuRepository.findById(2L)).thenReturn(Optional.of(entityDv));

                YeuCauChotHoSo req = new YeuCauChotHoSo(1, 1, null);

                assertThatThrownBy(() -> hopDongService.chotHoSo(hopDongId, req, quanLy))
                                .isInstanceOf(ResponseStatusException.class)
                                .hasMessageContaining("thiếu đơn giá áp dụng");

                // Giao dịch không được gọi chotHoSo
                verify(hopDongHoSoRepository, never()).chotHoSo(any(), anyInt(), any(), any(), any(), any(), any());
        }

        @Test
        void layHoSoHopDong_chuaCoMauToaNha_deXuatDieuKhoanChuan12DieuDayDu() {
                Long hopDongId = 100L;
                HopDong hd = new HopDong(hopDongId, 10L, 20L, LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1),
                                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), 30,
                                TrangThaiHopDong.CHO_KY);
                HopDongRepository.HopDongView view = new HopDongRepository.HopDongView(hd, 1L, "301", "Trần Văn B");
                when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(view));
                when(hopDongRepository.layTongThuCoc(hopDongId)).thenReturn(new BigDecimal("4500000.00"));
                when(nguoiOCungRepository.findByHopDongId(hopDongId)).thenReturn(List.of());
                when(hopDongHoSoRepository.findLatestByHopDongId(hopDongId)).thenReturn(Optional.empty());

                CauHinhBenA benA = new CauHinhBenA(1L, 1L, "CA_NHAN", "Nguyễn Văn Chủ", "001090123456", "Hà Nội",
                                "0912345678", "chu@gmail.com", "Nguyễn Văn Chủ", "Chủ nhà", "CHU_SO_HUU", null, null,
                                "123456", "Vietcombank", "NGUYEN VAN CHU", null);
                when(cauHinhBenARepository.findByToaNhaId(1L)).thenReturn(Optional.of(benA));

                NguoiThue nt = new NguoiThue(20L, "Trần Văn B", LocalDate.of(1995, 5, 20), "0987654321", "001200009999",
                                "Nam Định", "HOAT_DONG", "CCCD", LocalDate.of(2021, 5, 10), "Cục CSQLHC về TTXH",
                                "Hà Nội", "Hà Nội", "b@gmail.com");
                when(nguoiThueRepository.findById(20L)).thenReturn(Optional.of(nt));

                // Toà nhà chưa tạo mẫu hợp đồng riêng -> hệ thống đề xuất mẫu chuẩn MiniApart
                when(mauHopDongRepository.findPublishedByToaNhaId(1L)).thenReturn(Optional.empty());

                HopDongHoSoDto dto = hopDongService.layHoSoHopDong(hopDongId, quanLy);

                assertThat(dto).isNotNull();
                assertThat(dto.trangThaiTaiLieu()).isEqualTo("DRAFT");
                assertThat(dto.dieuKhoanTuyBien()).isNotNull();

                // Kiểm chứng có đủ 12 điều khoản với các khoản chi tiết
                for (int i = 1; i <= 12; i++) {
                        assertThat(dto.dieuKhoanTuyBien()).contains("Điều " + i + ".");
                }
                assertThat(dto.dieuKhoanTuyBien()).contains("Biên bản bàn giao nhận phòng (loại NHẬN PHÒNG)");
                assertThat(dto.dieuKhoanTuyBien()).contains("Biên bản bàn giao trả phòng (loại TRẢ PHÒNG)");
                assertThat(dto.dieuKhoanTuyBien()).contains("an toàn PCCC");
                assertThat(dto.dieuKhoanTuyBien()).contains("thủ tục khai báo tạm trú");
                assertThat(dto.dieuKhoanTuyBien()).contains("hao mòn tự nhiên");
        }

        @Test
        void layHoSoHopDong_dieuKhoanChuaThoaThuan_canhBaoRoRangTrongDraft() {
                Long hopDongId = 100L;
                HopDong hd = new HopDong(hopDongId, 10L, 20L, LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1),
                                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), 30,
                                TrangThaiHopDong.CHO_KY);
                HopDongRepository.HopDongView view = new HopDongRepository.HopDongView(hd, 1L, "301", "Trần Văn B");
                when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(view));
                when(hopDongRepository.layTongThuCoc(hopDongId)).thenReturn(new BigDecimal("4500000.00"));

                // Bản nháp có chỗ trống / ký hiệu đánh dấu chưa thỏa thuận
                HopDongHoSo draftWithPlaceholder = new HopDongHoSo(
                                1L, hopDongId, 1, "DRAFT", null, 1, "HỢP ĐỒNG THUÊ PHÒNG",
                                LocalDate.of(2026, 11, 1), "Hà Nội", "Để ở", "Phạm vi", LocalDate.of(2026, 11, 1),
                                "CHUYEN_KHOAN", 1, 5, "123456", "Thỏa thuận", null,
                                "CA_NHAN", "Chủ", "001090123456", "Hà Nội", "0912345678", "chu@gmail.com",
                                "Chủ", "Chủ nhà", "CHU_SO_HUU", null, null,
                                "Trần Văn B", LocalDate.of(1995, 5, 20), "CCCD", "001200009999", LocalDate.of(2021, 5, 10),
                                "Cục CS", "Hà Nội", "Hà Nội", "0987654321", "b@gmail.com",
                                "Toà nhà MiniApart", "Hà Nội", "301", 3, new BigDecimal("25.0"),
                                "Điều 1. Phạm vi thuê.\nĐiều 2. Giá thuê [CHƯA THỎA THUẬN: phí quản lý xe máy].",
                                "[]", "[]", "[]",
                                null, null, null, null, null, null, null,
                                LocalDateTime.now(), LocalDateTime.now());
                when(hopDongHoSoRepository.findLatestByHopDongId(hopDongId)).thenReturn(Optional.of(draftWithPlaceholder));

                HopDongHoSoDto dto = hopDongService.layHoSoHopDong(hopDongId, quanLy);

                assertThat(dto.canhBaoThieuThongTin()).anyMatch(c -> c.contains("chưa hoàn thiện cần thỏa thuận"));
        }

        @Test
        void chotHoSo_dieuKhoanChuaThoaThuan_nemBadRequest() {
                Long hopDongId = 100L;
                LocalDate ngayBatDau = LocalDate.of(2026, 11, 1);
                HopDong hd = new HopDong(hopDongId, 10L, 20L, ngayBatDau, LocalDate.of(2027, 11, 1),
                                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), 30,
                                TrangThaiHopDong.CHO_KY);
                HopDongRepository.HopDongView view = new HopDongRepository.HopDongView(hd, 1L, "301", "Trần Văn B");
                when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(view));

                // Hồ sơ còn chứa [CẦN BỔ SUNG] -> chặn chốt
                HopDongHoSo draftWithUnagreed = new HopDongHoSo(
                                1L, hopDongId, 1, "DRAFT", null, 1, "HỢP ĐỒNG THUÊ PHÒNG",
                                LocalDate.of(2026, 11, 1), "Hà Nội", "Để ở", "Phạm vi", LocalDate.of(2026, 11, 1),
                                "CHUYEN_KHOAN", 1, 5, "123456", "Thỏa thuận", null,
                                "CA_NHAN", "Chủ A", "001090123456", "Hà Nội", "0912345678", "chu@gmail.com",
                                "Chủ A", "Chủ nhà", "CHU_SO_HUU", null, null,
                                "Trần Văn B", LocalDate.of(1995, 5, 20), "CCCD", "001200009999", LocalDate.of(2021, 5, 10),
                                "Cục CS", "Hà Nội", "Hà Nội", "0987654321", "b@gmail.com",
                                "Toà nhà MiniApart", "Hà Nội", "301", 3, new BigDecimal("25.0"),
                                "Điều 1. Đối tượng.\nĐiều 2. [CẦN BỔ SUNG: thời hạn thanh toán]",
                                "[]", "[]", "[]",
                                null, null, null, null, null, null, null,
                                LocalDateTime.now(), LocalDateTime.now());
                when(hopDongHoSoRepository.findLatestByHopDongId(hopDongId)).thenReturn(Optional.of(draftWithUnagreed));

                YeuCauChotHoSo req = new YeuCauChotHoSo(1, 1, null);

                assertThatThrownBy(() -> hopDongService.chotHoSo(hopDongId, req, quanLy))
                                .isInstanceOf(ResponseStatusException.class)
                                .hasMessageContaining("chưa thỏa thuận hoặc còn chỗ trống");
        }

        @Test
        void chotHoSo_mauHopDongMoiKhongThayDoiHoSoDaChot() {
                Long hopDongId = 100L;
                HopDong hd = new HopDong(hopDongId, 10L, 20L, LocalDate.of(2026, 11, 1), LocalDate.of(2027, 11, 1),
                                new BigDecimal("4500000.00"), new BigDecimal("4500000.00"), 30,
                                TrangThaiHopDong.CHO_KY);
                HopDongRepository.HopDongView view = new HopDongRepository.HopDongView(hd, 1L, "301", "Trần Văn B");
                when(hopDongRepository.findViewById(hopDongId)).thenReturn(Optional.of(view));
                when(hopDongRepository.layTongThuCoc(hopDongId)).thenReturn(new BigDecimal("4500000.00"));

                // Hợp đồng đã chốt với điều khoản bất biến cũ
                String dieuKhoanDaChot = "Điều 1. Điều khoản bất biến đã chốt ngày 01/11/2026.\n1. Bên B cam kết thực hiện đúng.";
                HopDongHoSo sealed = new HopDongHoSo(
                                1L, hopDongId, 1, "DA_CHOT", 10L, 1, "HỢP ĐỒNG THUÊ PHÒNG",
                                LocalDate.of(2026, 11, 1), "Hà Nội", "Để ở", "Phạm vi", LocalDate.of(2026, 11, 1),
                                "CHUYEN_KHOAN", 1, 5, "123456", "Thỏa thuận", null,
                                "CA_NHAN", "Chủ", "001090123456", "Hà Nội", "0912345678", "chu@gmail.com",
                                "Chủ", "Chủ nhà", "CHU_SO_HUU", null, null,
                                "Trần Văn B", LocalDate.of(1995, 5, 20), "CCCD", "001200009999", LocalDate.of(2021, 5, 10),
                                "Cục CS", "Hà Nội", "Hà Nội", "0987654321", "b@gmail.com",
                                "Toà nhà MiniApart", "Hà Nội", "301", 3, new BigDecimal("25.0"),
                                dieuKhoanDaChot, "[]", "[]", "[]",
                                1L, LocalDateTime.now(), null, null, null, null, null,
                                LocalDateTime.now(), LocalDateTime.now());
                when(hopDongHoSoRepository.findLatestByHopDongId(hopDongId)).thenReturn(Optional.of(sealed));

                // Kể cả khi toà nhà cập nhật hoặc xuất bản mẫu mới phiên bản 2, 3...
                // layHoSoHopDong của hợp đồng đã chốt vẫn trả về đúng 100% điều khoản đã chốt
                HopDongHoSoDto dto = hopDongService.layHoSoHopDong(hopDongId, quanLy);

                assertThat(dto).isNotNull();
                assertThat(dto.dieuKhoanTuyBien()).isEqualTo(dieuKhoanDaChot);
                assertThat(dto.daCoHoSoChot()).isTrue();
        }
}
