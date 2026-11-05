package com.prj1.ccm.hopdong;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.nguoithue.NguoiThue;
import com.prj1.ccm.nguoithue.NguoiThueRepository;
import com.prj1.ccm.nguoithue.NhatKyThaoTacRepository;
import com.prj1.ccm.toanha.BangGia;
import com.prj1.ccm.toanha.BangGiaRepository;
import com.prj1.ccm.toanha.DichVu;
import com.prj1.ccm.toanha.DichVuRepository;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import com.prj1.ccm.toanha.Phong;
import com.prj1.ccm.toanha.PhongRepository;
import com.prj1.ccm.toanha.TrangThaiPhongService;
import com.prj1.ccm.toanha.ToaNha;
import com.prj1.ccm.toanha.ToaNhaRepository;
import com.prj1.ccm.toanha.CauHinhBenA;
import com.prj1.ccm.toanha.CauHinhBenARepository;
import com.prj1.ccm.toanha.MauHopDong;
import com.prj1.ccm.toanha.MauHopDongRepository;
import com.prj1.ccm.toanha.MauHopDongChuan;
import com.prj1.ccm.toanha.BangGiaBacThang;
import com.prj1.ccm.toanha.BangGiaPhong;
import com.prj1.ccm.toanha.BangGiaPhongRepository;
import com.prj1.ccm.toanha.CheDoGia;
import com.prj1.ccm.taisan.TaiSanRepository;
import com.prj1.ccm.taisan.BienBanBanGiaoDto;
import com.prj1.ccm.taisan.ChiTietBienBanDto;
import java.time.LocalDateTime;
import com.prj1.ccm.toanha.ChiSoDichVuService;
import com.prj1.ccm.toanha.KyThanhToan;
import com.prj1.ccm.billing.GiaoDichCocService;
import com.prj1.ccm.billing.TaoHoaDonHangLoatService;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.JsonNode;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;
import java.sql.SQLException;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class HopDongService {
    private static final String THONG_BAO_YEU_CAU_KHONG_HOP_LE = "Yêu cầu hợp đồng không hợp lệ.";
    private static final String THONG_BAO_NGAY_KET_THUC = "Ngày kết thúc phải sau ngày bắt đầu.";
    private static final String THONG_BAO_DICH_VU_KHONG_HOP_LE = "Dịch vụ áp dụng không hợp lệ cho phòng này.";
    private static final String THONG_BAO_KHONG_TIM_THAY_GIA_AP_DUNG = "Không tìm thấy đơn giá áp dụng cho dịch vụ.";
    private static final String THONG_BAO_CHUYEN_TRANG_THAI = "Không thể chuyển trạng thái hợp đồng bằng hành động này.";
    private static final String THONG_BAO_CHUA_TOI_NGAY_BAT_DAU = "Chưa tới ngày bắt đầu nên chưa thể kích hoạt hợp đồng.";
    private static final String THONG_BAO_HOP_DONG_CHONG_NGAY = "Phòng %s đang có hợp đồng #%d chiếm chỗ đến hết %s.";
    private static final String THONG_BAO_GIA_HAN_KHONG_HOP_LE = "Hợp đồng này không thể gia hạn.";
    private static final String SQLSTATE_EXCLUSION_VIOLATION = "23P01";
    private static final String TEN_RANG_BUOC_CHONG_NGAY = "ex_hop_dong_phong_khong_chong_ngay";

    private final HopDongRepository hopDongRepository;
    private final PhongRepository phongRepository;
    private final NguoiThueRepository nguoiThueRepository;
    private final DichVuRepository dichVuRepository;
    private final BangGiaRepository bangGiaRepository;
    private final NguoiOCungRepository nguoiOCungRepository;
    private final PhanQuyenToaService phanQuyenToaService;
    private final TrangThaiPhongService trangThaiPhongService;
    private final TaoHoaDonHangLoatService taoHoaDonHangLoatService;
    private final GiaoDichCocService giaoDichCocService;
    private final NhatKyThaoTacRepository nhatKyThaoTacRepository;
    private final ChiSoDichVuService chiSoDichVuService;
    private final HopDongHoSoRepository hopDongHoSoRepository;
    private final HopDongPhuLucRepository hopDongPhuLucRepository;
    private final CauHinhBenARepository cauHinhBenARepository;
    private final MauHopDongRepository mauHopDongRepository;
    private final TaiSanRepository taiSanRepository;
    private final ToaNhaRepository toaNhaRepository;
    private final Clock clock;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired(required = false)
    private BangGiaPhongRepository bangGiaPhongRepository;

    public void setBangGiaPhongRepository(BangGiaPhongRepository bangGiaPhongRepository) {
        this.bangGiaPhongRepository = bangGiaPhongRepository;
    }

    @Autowired
    public HopDongService(
            HopDongRepository hopDongRepository,
            PhongRepository phongRepository,
            NguoiThueRepository nguoiThueRepository,
            DichVuRepository dichVuRepository,
            BangGiaRepository bangGiaRepository,
            NguoiOCungRepository nguoiOCungRepository,
            PhanQuyenToaService phanQuyenToaService,
            TrangThaiPhongService trangThaiPhongService,
            TaoHoaDonHangLoatService taoHoaDonHangLoatService,
            GiaoDichCocService giaoDichCocService,
            NhatKyThaoTacRepository nhatKyThaoTacRepository,
            ChiSoDichVuService chiSoDichVuService,
            HopDongHoSoRepository hopDongHoSoRepository,
            HopDongPhuLucRepository hopDongPhuLucRepository,
            CauHinhBenARepository cauHinhBenARepository,
            MauHopDongRepository mauHopDongRepository,
            TaiSanRepository taiSanRepository,
            ToaNhaRepository toaNhaRepository,
            Clock clock
    ) {
        this.hopDongRepository = hopDongRepository;
        this.phongRepository = phongRepository;
        this.nguoiThueRepository = nguoiThueRepository;
        this.dichVuRepository = dichVuRepository;
        this.bangGiaRepository = bangGiaRepository;
        this.nguoiOCungRepository = nguoiOCungRepository;
        this.phanQuyenToaService = phanQuyenToaService;
        this.trangThaiPhongService = trangThaiPhongService;
        this.taoHoaDonHangLoatService = taoHoaDonHangLoatService;
        this.giaoDichCocService = giaoDichCocService;
        this.nhatKyThaoTacRepository = nhatKyThaoTacRepository;
        this.chiSoDichVuService = chiSoDichVuService;
        this.hopDongHoSoRepository = hopDongHoSoRepository;
        this.hopDongPhuLucRepository = hopDongPhuLucRepository;
        this.cauHinhBenARepository = cauHinhBenARepository;
        this.mauHopDongRepository = mauHopDongRepository;
        this.taiSanRepository = taiSanRepository;
        this.toaNhaRepository = toaNhaRepository;
        this.clock = clock;
    }

    public HopDongService(
            HopDongRepository hopDongRepository,
            PhongRepository phongRepository,
            NguoiThueRepository nguoiThueRepository,
            DichVuRepository dichVuRepository,
            BangGiaRepository bangGiaRepository,
            NguoiOCungRepository nguoiOCungRepository,
            PhanQuyenToaService phanQuyenToaService,
            TrangThaiPhongService trangThaiPhongService, TaoHoaDonHangLoatService taoHoaDonHangLoatService,
            GiaoDichCocService giaoDichCocService, NhatKyThaoTacRepository nhatKyThaoTacRepository, ChiSoDichVuService chiSoDichVuService,
            Clock clock
    ) {
        this(hopDongRepository, phongRepository, nguoiThueRepository, dichVuRepository, bangGiaRepository, nguoiOCungRepository,
                phanQuyenToaService, trangThaiPhongService, taoHoaDonHangLoatService, giaoDichCocService, nhatKyThaoTacRepository, chiSoDichVuService,
                null, null, null, null, null, null, clock);
    }

    HopDongService(HopDongRepository hopDongRepository, PhongRepository phongRepository, NguoiThueRepository nguoiThueRepository,
                   DichVuRepository dichVuRepository, BangGiaRepository bangGiaRepository, NguoiOCungRepository nguoiOCungRepository,
                   PhanQuyenToaService phanQuyenToaService, TrangThaiPhongService trangThaiPhongService, Clock clock) {
        this(hopDongRepository, phongRepository, nguoiThueRepository, dichVuRepository, bangGiaRepository, nguoiOCungRepository,
                phanQuyenToaService, trangThaiPhongService, null, null, null, null, clock);
    }

    @Transactional
    public ThongTinHopDong tao(YeuCauHopDong yeuCau, NguoiDung nguoiDung) {
        kiemTraVaiTro(nguoiDung);
        HopDongDaChuanHoa hopDongDaChuanHoa = chuanHoa(yeuCau, nguoiDung);
        try {
            Long hopDongId = hopDongRepository.insert(hopDongDaChuanHoa.hopDong());
            hopDongRepository.insertDichVuApDung(
                    hopDongDaChuanHoa.dichVuApDung().stream()
                            .map(item -> new HopDongDichVu(hopDongId, item.dichVuId(), item.donGiaApDung()))
                            .toList()
            );
            trangThaiPhongService.dongBoTheoPhongId(hopDongDaChuanHoa.hopDong().phongId());
            return chiTiet(hopDongId, nguoiDung);
        } catch (DataIntegrityViolationException exception) {
            chuyenDoiNgoaiLeChongNgay(hopDongDaChuanHoa.hopDong(), exception);
            throw exception;
        }
    }

    @Transactional(readOnly = true)
    public List<ThongTinHopDong> danhSach(Long toaNhaId, TrangThaiHopDong trangThai, NguoiDung nguoiDung) {
        kiemTraVaiTro(nguoiDung);
        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, toaNhaId);
        LocalDate homNay = LocalDate.now(clock);
        return hopDongRepository.findByToaNhaId(toaNhaId, trangThai)
                .stream()
                .map(item -> taoThongTinHopDong(item, homNay))
                .toList();
    }

    @Transactional(readOnly = true)
    public ThongTinHopDong chiTiet(Long hopDongId, NguoiDung nguoiDung) {
        kiemTraVaiTro(nguoiDung);
        HopDongRepository.HopDongView hopDongView = layHopDongTrongPhamVi(hopDongId, nguoiDung);
        return taoThongTinHopDong(hopDongView, LocalDate.now(clock));
    }

    /** FR-POR-07 lists current and historical contracts belonging to the authenticated tenant. */
    @Transactional(readOnly = true)
    public List<ThongTinHopDong> danhSachCuaNguoiThue(NguoiDung nguoiDung) {
        kiemTraNguoiThue(nguoiDung);
        LocalDate homNay = LocalDate.now(clock);
        return hopDongRepository.findByNguoiThueId(nguoiDung.nguoiThueId())
                .stream()
                .map(item -> taoThongTinHopDong(item, homNay))
                .toList();
    }

    /** FR-POR-04 returns a historical contract only when its tenant matches the authenticated tenant. */
    @Transactional(readOnly = true)
    public ThongTinHopDong chiTietCuaNguoiThue(Long hopDongId, NguoiDung nguoiDung) {
        kiemTraNguoiThue(nguoiDung);
        HopDongRepository.HopDongView hopDongView = hopDongRepository.findViewById(hopDongId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!nguoiDung.nguoiThueId().equals(hopDongView.hopDong().nguoiThueId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return taoThongTinHopDong(hopDongView, LocalDate.now(clock));
    }

    @Transactional
    public ThongTinHopDong nhanCoc(Long hopDongId, NguoiDung nguoiDung) {
        kiemTraVaiTro(nguoiDung);
        return chuyenTrangThai(hopDongId, TrangThaiHopDong.CHO_KY, TrangThaiHopDong.DA_COC, nguoiDung, false);
    }

    @Transactional
    public ThongTinHopDong kichHoat(Long hopDongId, NguoiDung nguoiDung) {
        kiemTraVaiTro(nguoiDung);
        return chuyenTrangThai(hopDongId, TrangThaiHopDong.DA_COC, TrangThaiHopDong.HIEU_LUC, nguoiDung, true);
    }

    @Transactional
    public ThongTinHopDong thanhLy(Long hopDongId, NguoiDung nguoiDung) {
        return thanhLy(hopDongId, new YeuCauThanhLy(null, null, List.of()), nguoiDung);
    }

    /** FR-TNT-08, FR-TNT-09 and BR-07 settle final billing before changing the contract status. */
    @Transactional
    public ThongTinHopDong thanhLy(Long hopDongId, YeuCauThanhLy yeuCau, NguoiDung nguoiDung) {
        kiemTraVaiTro(nguoiDung);
        HopDongRepository.HopDongView hopDongView = layHopDongTrongPhamVi(hopDongId, nguoiDung);
        TrangThaiHopDong trangThaiHienTai = hopDongView.hopDong().trangThai();
        if (trangThaiHienTai != TrangThaiHopDong.CHO_KY
                && trangThaiHienTai != TrangThaiHopDong.DA_COC
                && trangThaiHienTai != TrangThaiHopDong.HIEU_LUC) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_CHUYEN_TRANG_THAI);
        }
        ToaNha toaNha = phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, hopDongView.toaNhaId());

        Long phongId = hopDongView.hopDong().phongId();
        HopDongRepository.BienBanBanGiaoRecord bienBanDung = null;
        if (yeuCau != null && yeuCau.bienBanId() != null) {
            HopDongRepository.BienBanBanGiaoRecord bb = hopDongRepository.timBienBanBanGiao(yeuCau.bienBanId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Biên bản bàn giao không tồn tại."));
            if (!bb.hopDongId().equals(hopDongId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Biên bản bàn giao không thuộc hợp đồng này.");
            }
            if (!bb.phongId().equals(phongId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Biên bản bàn giao không thuộc phòng của hợp đồng này.");
            }
            if (!"TRA_PHONG".equals(bb.loaiBienBan())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ được dùng biên bản trả phòng (TRA_PHONG) làm căn cứ quyết toán.");
            }
            bienBanDung = bb;
        } else {
            // Không truyền bienBanId: Kiểm tra xem DB đã có biên bản trả phòng cho hợp đồng này chưa
            Optional<HopDongRepository.BienBanBanGiaoRecord> existingTraPhong = hopDongRepository.timBienBanTraPhongCuaHopDong(hopDongId, phongId);
            if (existingTraPhong.isPresent()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hợp đồng đã có biên bản trả phòng; bắt buộc cung cấp ID biên bản để đối chiếu quyết toán.");
            }
            BigDecimal khauTru = yeuCau == null || yeuCau.khauTruHuHong() == null ? BigDecimal.ZERO : yeuCau.khauTruHuHong();
            if (khauTru.signum() > 0 && (yeuCau.lyDo() == null || yeuCau.lyDo().isBlank())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trường hợp không có biên bản bàn giao và có khấu trừ bồi thường, bắt buộc phải nhập lý do khấu trừ.");
            }
        }

        // Đối chiếu số tiền khấu trừ nếu có biên bản
        if (bienBanDung != null) {
            BigDecimal khauTruYeuCau = yeuCau == null || yeuCau.khauTruHuHong() == null ? BigDecimal.ZERO : yeuCau.khauTruHuHong();
            BigDecimal khauTruBienBan = bienBanDung.tongTienKhauTru() == null ? BigDecimal.ZERO : bienBanDung.tongTienKhauTru();
            if (khauTruYeuCau.compareTo(khauTruBienBan) != 0) {
                if (yeuCau == null || !Boolean.TRUE.equals(yeuCau.xacNhanChenhLech()) || yeuCau.lyDo() == null || yeuCau.lyDo().isBlank()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Số tiền khấu trừ (" + khauTruYeuCau + ") khác với biên bản bàn giao (" + khauTruBienBan + "). Yêu cầu xác nhận chênh lệch và nhập lý do.");
                }
            }
        }

        if (taoHoaDonHangLoatService != null) {
            KyThanhToan ky = taoHoaDonHangLoatService.layKyDangMo(toaNha.id());
            if (yeuCau != null && yeuCau.chiSoCuoi() != null && chiSoDichVuService != null && ky != null) {
                yeuCau.chiSoCuoi().forEach(chiSo -> chiSoDichVuService.ghiChiSo(toaNha.id(), ky.id(), chiSo, nguoiDung));
            }
        }

        Long hoaDonCuoiId = taoHoaDonHangLoatService.taoHoaDonKyCuoi(toaNha.id(), hopDongId, nguoiDung);
        com.prj1.ccm.billing.ThongTinQuyetToan quyetToan = giaoDichCocService.quyetToan(hopDongId, hoaDonCuoiId, yeuCau == null ? null : yeuCau.khauTruHuHong(), yeuCau == null ? null : yeuCau.lyDo(), toaNha.maToa(), toaNha.soNgayHanTt(), nguoiDung);
        hopDongRepository.updateTrangThai(hopDongId, TrangThaiHopDong.DA_THANH_LY);
        BigDecimal khauTruQuyetToan = new BigDecimal(quyetToan.khauTru());
        boolean coChenhLech = bienBanDung != null && bienBanDung.tongTienKhauTru() != null
                && khauTruQuyetToan.compareTo(bienBanDung.tongTienKhauTru()) != 0;
        boolean daXacNhan = yeuCau != null && Boolean.TRUE.equals(yeuCau.xacNhanChenhLech());
        String lyDoThanhLy = yeuCau != null && yeuCau.lyDo() != null ? yeuCau.lyDo().trim() : "";

        StringBuilder auditGiaTriSau = new StringBuilder("DA_THANH_LY;");
        if (bienBanDung != null) {
            auditGiaTriSau.append("bienBanId=").append(bienBanDung.id())
                    .append(";bbKhauTru=").append(bienBanDung.tongTienKhauTru())
                    .append(";khauTruQuyetToan=").append(quyetToan.khauTru())
                    .append(";chenhLech=").append(coChenhLech)
                    .append(";xacNhanChenhLech=").append(daXacNhan);
        } else {
            auditGiaTriSau.append("bienBanId=NONE;khauTruQuyetToan=").append(quyetToan.khauTru());
        }
        if (!lyDoThanhLy.isEmpty()) {
            auditGiaTriSau.append(";lyDo=").append(lyDoThanhLy);
        }
        auditGiaTriSau.append(";hoaDonCuoi=").append(quyetToan.hoaDonCuoiId())
                .append(";tong=").append(quyetToan.tongHoaDonCuoi())
                .append(";daThuCoc=").append(quyetToan.daThuCoc())
                .append(";congNo=").append(quyetToan.congNo())
                .append(";khauTru=").append(quyetToan.khauTru())
                .append(";hoan=").append(quyetToan.hoanCoc())
                .append(";hoaDonQT=").append(quyetToan.hoaDonQuyetToanId());

        nhatKyThaoTacRepository.ghi(
                toaNha.id(),
                nguoiDung.id(),
                "THANH_LY_HOP_DONG",
                "HOP_DONG:" + hopDongId,
                trangThaiHienTai.name(),
                auditGiaTriSau.toString(),
                phongId,
                null,
                lyDoThanhLy.isEmpty() ? null : lyDoThanhLy,
                java.time.LocalDateTime.now(clock)
        );
        trangThaiPhongService.dongBoTheoPhongId(hopDongView.hopDong().phongId());
        return chiTiet(hopDongId, nguoiDung).voiQuyetToan(quyetToan);
    }

    @Transactional
    public ThongTinGiaHanHopDong giaHan(Long hopDongId, YeuCauGiaHanHopDong yeuCau, NguoiDung nguoiDung) {
        kiemTraVaiTro(nguoiDung);
        HopDongRepository.HopDongView hopDongView = layHopDongTrongPhamVi(hopDongId, nguoiDung);
        HopDong hopDongCu = hopDongView.hopDong();
        LocalDate homNay = LocalDate.now(clock);
        if (hopDongCu.trangThai() != TrangThaiHopDong.HIEU_LUC || !hopDongCu.sapHetHan(homNay)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_GIA_HAN_KHONG_HOP_LE);
        }
        if (yeuCau == null || yeuCau.ngayKetThuc() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE);
        }

        LocalDate ngayBatDauMoi = hopDongCu.ngayKetThuc().plusDays(1);
        if (!yeuCau.ngayKetThuc().isAfter(ngayBatDauMoi)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_NGAY_KET_THUC);
        }
        BigDecimal giaThueMoi = yeuCau.giaThue() == null
                ? hopDongCu.giaThue()
                : chuanHoaSoKhongAm(yeuCau.giaThue());
        BigDecimal tienCocCanThu = tinhTienCocCanThu(hopDongCu, giaThueMoi);
        HopDong hopDongMoi = new HopDong(
                null,
                hopDongCu.phongId(),
                hopDongCu.nguoiThueId(),
                ngayBatDauMoi,
                yeuCau.ngayKetThuc(),
                giaThueMoi,
                hopDongCu.tienCoc(),
                hopDongCu.soNgayBaoTruoc(),
                tienCocCanThu.signum() == 0 ? TrangThaiHopDong.DA_COC : TrangThaiHopDong.CHO_KY
        );
        Long hopDongMoiId;
        try {
            hopDongMoiId = hopDongRepository.insert(hopDongMoi);
        } catch (DataIntegrityViolationException exception) {
            chuyenDoiNgoaiLeChongNgay(hopDongMoi, exception);
            throw exception;
        }
        hopDongRepository.insertDichVuApDung(hopDongRepository.findDichVuApDungDeGiaHan(hopDongId).stream()
                .map(item -> new HopDongDichVu(hopDongMoiId, item.dichVuId(), item.donGiaApDung()))
                .toList());
        nguoiOCungRepository.findDangODeGiaHan(hopDongId, hopDongCu.ngayKetThuc()).forEach(nguoiOCung ->
                nguoiOCungRepository.insert(new NguoiOCung(
                        null,
                        hopDongMoiId,
                        nguoiOCung.nguoiThueId(),
                        null,
                        nguoiOCung.quanHe(),
                        ngayBatDauMoi,
                        nguoiOCung.denNgay()
                ))
        );
        trangThaiPhongService.dongBoTheoPhongId(hopDongCu.phongId());
        return ThongTinGiaHanHopDong.tao(
                chiTiet(hopDongMoiId, nguoiDung),
                tienCocCanThu,
                giaThueMoi.compareTo(hopDongCu.giaThue()) != 0
        );
    }

    private ThongTinHopDong chuyenTrangThai(
            Long hopDongId,
            TrangThaiHopDong tuTrangThai,
            TrangThaiHopDong sangTrangThai,
            NguoiDung nguoiDung,
            boolean canToiNgayBatDau
    ) {
        HopDongRepository.HopDongView hopDongView = layHopDongTrongPhamVi(hopDongId, nguoiDung);
        HopDong hopDong = hopDongView.hopDong();
        if (hopDong.trangThai() != tuTrangThai) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_CHUYEN_TRANG_THAI);
        }
        if (canToiNgayBatDau && LocalDate.now(clock).isBefore(hopDong.ngayBatDau())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_CHUA_TOI_NGAY_BAT_DAU);
        }
        hopDongRepository.updateTrangThai(hopDongId, sangTrangThai);
        trangThaiPhongService.dongBoTheoPhongId(hopDong.phongId());
        return chiTiet(hopDongId, nguoiDung);
    }

    private HopDongRepository.HopDongView layHopDongTrongPhamVi(Long hopDongId, NguoiDung nguoiDung) {
        HopDongRepository.HopDongView hopDongView = hopDongRepository.findViewById(hopDongId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, hopDongView.toaNhaId());
        return hopDongView;
    }

    private HopDongDaChuanHoa chuanHoa(YeuCauHopDong yeuCau, NguoiDung nguoiDung) {
        if (yeuCau == null
                || yeuCau.phongId() == null
                || yeuCau.nguoiThueId() == null
                || yeuCau.ngayBatDau() == null
                || yeuCau.ngayKetThuc() == null
                || yeuCau.giaThue() == null
                || yeuCau.tienCoc() == null
                || yeuCau.soNgayBaoTruoc() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE);
        }
        if (!yeuCau.ngayKetThuc().isAfter(yeuCau.ngayBatDau())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_NGAY_KET_THUC);
        }
        if (yeuCau.soNgayBaoTruoc() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE);
        }

        Phong phong = phongRepository.findById(yeuCau.phongId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, phong.toaNhaId());
        NguoiThue nguoiThue = nguoiThueRepository.findById(yeuCau.nguoiThueId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        BigDecimal giaThue = chuanHoaSoKhongAm(yeuCau.giaThue());
        BigDecimal tienCoc = chuanHoaSoKhongAm(yeuCau.tienCoc());
        List<YeuCauHopDongDichVu> dsDichVuYeuCau = yeuCau.dichVuApDung() != null ? yeuCau.dichVuApDung() : Collections.emptyList();
        List<HopDongDichVuDaChuanHoa> dichVuApDung = chuanHoaDichVuApDung(phong, dsDichVuYeuCau);

        return new HopDongDaChuanHoa(
                new HopDong(
                        null,
                        phong.id(),
                        nguoiThue.id(),
                        yeuCau.ngayBatDau(),
                        yeuCau.ngayKetThuc(),
                        giaThue,
                        tienCoc,
                        yeuCau.soNgayBaoTruoc(),
                        TrangThaiHopDong.CHO_KY
                ),
                dichVuApDung
        );
    }

    private List<HopDongDichVuDaChuanHoa> chuanHoaDichVuApDung(Phong phong, List<YeuCauHopDongDichVu> yeuCauDichVu) {
        Set<Long> daGap = new LinkedHashSet<>();
        List<HopDongDichVuDaChuanHoa> ketQua = new ArrayList<>();

        for (YeuCauHopDongDichVu item : yeuCauDichVu) {
            if (item == null || item.dichVuId() == null || !daGap.add(item.dichVuId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE);
            }

            DichVu dichVu = dichVuRepository.findById(item.dichVuId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
            if (!dichVu.toaNhaId().equals(phong.toaNhaId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_DICH_VU_KHONG_HOP_LE);
            }

            BigDecimal donGiaApDung;
            if (dichVu.cheDoGia() == com.prj1.ccm.toanha.CheDoGia.BAC_THANG) {
                Optional<LocalDate> ngayHieuLuc = bangGiaRepository.findApplicableNgayHieuLucBacThangByDichVuIdAndNgay(
                        dichVu.id(), LocalDate.now(clock)
                );
                if (ngayHieuLuc.isEmpty()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Dịch vụ " + dichVu.ten() + " tính theo bậc thang nhưng chưa có bảng giá bậc thang hiệu lực.");
                }
                donGiaApDung = BigDecimal.ZERO.setScale(2, RoundingMode.UNNECESSARY);
            } else if (item.donGiaApDung() != null) {
                donGiaApDung = chuanHoaSoKhongAm(item.donGiaApDung());
            } else {
                donGiaApDung = layDonGiaMacDinh(phong.id(), dichVu.id());
            }
            ketQua.add(new HopDongDichVuDaChuanHoa(dichVu.id(), dichVu.ten(), donGiaApDung));
        }

        return List.copyOf(ketQua);
    }

    private BigDecimal layDonGiaMacDinh(Long phongId, Long dichVuId) {
        if (bangGiaPhongRepository != null && phongId != null) {
            Optional<BangGiaPhong> bgPhong = bangGiaPhongRepository.findApplicableByPhongIdAndDichVuIdAndNgay(
                    phongId, dichVuId, LocalDate.now(clock)
            );
            if (bgPhong.isPresent()) {
                return bgPhong.get().donGia().setScale(2, RoundingMode.UNNECESSARY);
            }
        }
        BangGia bangGia = bangGiaRepository.findApplicableByDichVuIdAndNgay(dichVuId, LocalDate.now(clock))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_KHONG_TIM_THAY_GIA_AP_DUNG));
        return bangGia.donGia().setScale(2, RoundingMode.UNNECESSARY);
    }

    private BigDecimal chuanHoaSoKhongAm(BigDecimal giaTri) {
        try {
            BigDecimal daChuanHoa = giaTri.setScale(2, RoundingMode.UNNECESSARY);
            if (daChuanHoa.signum() < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE);
            }
            return daChuanHoa;
        } catch (ArithmeticException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE, exception);
        }
    }

    private BigDecimal tinhTienCocCanThu(HopDong hopDongCu, BigDecimal giaThueMoi) {
        boolean tienCocDaDuocThu = hopDongCu.trangThai() == TrangThaiHopDong.DA_COC
                || hopDongCu.trangThai() == TrangThaiHopDong.HIEU_LUC;
        if (!tienCocDaDuocThu) {
            return hopDongCu.tienCoc();
        }
        return giaThueMoi.subtract(hopDongCu.giaThue()).max(BigDecimal.ZERO).setScale(2, RoundingMode.UNNECESSARY);
    }

    private void kiemTraVaiTro(NguoiDung nguoiDung) {
        if (nguoiDung == null || (nguoiDung.vaiTro() != VaiTro.CHU
                && nguoiDung.vaiTro() != VaiTro.QUAN_LY)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private void kiemTraNguoiThue(NguoiDung nguoiDung) {
        if (nguoiDung == null || nguoiDung.vaiTro() != VaiTro.NGUOI_THUE || nguoiDung.nguoiThueId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private boolean laRangBuocChongNgay(DataIntegrityViolationException exception) {
        Throwable nguyenNhanSautChinh = exception.getMostSpecificCause();
        if (!(nguyenNhanSautChinh instanceof SQLException sqlException)) {
            return false;
        }
        if (!SQLSTATE_EXCLUSION_VIOLATION.equals(sqlException.getSQLState())) {
            return false;
        }
        return TEN_RANG_BUOC_CHONG_NGAY.equals(layTenRangBuoc(sqlException));
    }

    private void chuyenDoiNgoaiLeChongNgay(HopDong hopDong, DataIntegrityViolationException exception) {
        if (!laRangBuocChongNgay(exception)) {
            return;
        }
        var hopDongXungDot = hopDongRepository.findXungDotTheoPhongVaKhoangNgay(
                hopDong.phongId(),
                hopDong.ngayBatDau(),
                hopDong.ngayKetThuc()
        );
        if (hopDongXungDot.isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    THONG_BAO_HOP_DONG_CHONG_NGAY.formatted(
                            hopDongXungDot.get().soPhong(),
                            hopDongXungDot.get().id(),
                            hopDongXungDot.get().ngayKetThuc()
                    ),
                    exception
            );
        }
        throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_DICH_VU_KHONG_HOP_LE, exception);
    }

    private String layTenRangBuoc(SQLException sqlException) {
        try {
            Method layThongDiepLoi = sqlException.getClass().getMethod("getServerErrorMessage");
            Object thongDiepLoi = layThongDiepLoi.invoke(sqlException);
            if (thongDiepLoi == null) {
                return null;
            }
            Method layTenRangBuoc = thongDiepLoi.getClass().getMethod("getConstraint");
            Object tenRangBuoc = layTenRangBuoc.invoke(thongDiepLoi);
            return tenRangBuoc == null ? null : tenRangBuoc.toString();
        } catch (ReflectiveOperationException exception) {
            return null;
        }
    }

    private ThongTinHopDong taoThongTinHopDong(HopDongRepository.HopDongView hopDongView, LocalDate homNay) {
        HopDong hopDong = hopDongView.hopDong();
        return ThongTinHopDong.tao(
                hopDong,
                hopDongView.soPhong(),
                hopDongView.hoTenNguoiThue(),
                hopDong.sapHetHan(homNay),
                hopDong.soNgayConLai(homNay),
                hopDongRepository.findDichVuApDungByHopDongId(hopDong.id())
        );
    }

    public HopDongHoSoDto layHoSoHopDong(Long hopDongId, NguoiDung nguoiDung) {
        HopDongRepository.HopDongView hopDongView = layHopDongChoPhepXem(hopDongId, nguoiDung);
        HopDong hopDong = hopDongView.hopDong();
        BigDecimal tienCocThucThu = hopDongRepository != null ? hopDongRepository.layTongThuCoc(hopDongId) : BigDecimal.ZERO;
        HopDongHoSo hoSo = hopDongHoSoRepository != null ? hopDongHoSoRepository.findLatestByHopDongId(hopDongId).orElse(null) : null;

        List<ThongTinNguoiOCung> dsNguoiOCung;
        boolean isSealed = hoSo != null && ("DA_CHOT".equals(hoSo.trangThaiTaiLieu()) || "DA_GHI_NHAN_KY".equals(hoSo.trangThaiTaiLieu()));

        if (isSealed) {
            String snapshotJson = hoSo.snapshotNguoiOCungJson();
            if (snapshotJson == null || snapshotJson.trim().isBlank()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Hồ sơ hợp đồng đã chốt thiếu dữ liệu lịch sử người ở cùng (snapshot). Dữ liệu lịch sử chưa đầy đủ để xác minh hoặc xuất bản chính thức."
                );
            }
            try {
                JsonNode tree = objectMapper.readTree(snapshotJson);
                if (!tree.isArray()) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Dữ liệu lịch sử người ở cùng (snapshot) sai cấu trúc danh sách JSON."
                    );
                }
                ThongTinNguoiOCung[] parsed = objectMapper.treeToValue(tree, ThongTinNguoiOCung[].class);
                dsNguoiOCung = parsed != null ? Arrays.stream(parsed)
                        .filter(noc -> noc.trangThai() == null || "DA_DUYET".equals(noc.trangThai()))
                        .toList() : Collections.emptyList();
            } catch (ResponseStatusException rse) {
                throw rse;
            } catch (Exception e) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Dữ liệu lịch sử người ở cùng (snapshot) bị lỗi định dạng JSON: " + e.getMessage(),
                        e
                );
            }
        } else {
            LocalDate ngayBatDauHd = hoSo != null && hoSo.ngayNhanPhong() != null ? hoSo.ngayNhanPhong() : hopDong.ngayBatDau();
            LocalDate ngayKetThucHd = hopDong.ngayKetThuc();
            dsNguoiOCung = nguoiOCungRepository != null ? nguoiOCungRepository.findByHopDongId(hopDongId).stream()
                    .filter(noc -> "DA_DUYET".equals(noc.trangThai()))
                    .filter(noc -> (noc.denNgay() == null || !noc.denNgay().isBefore(ngayBatDauHd))
                            && (noc.tuNgay() == null || !noc.tuNgay().isAfter(ngayKetThucHd)))
                    .map(ThongTinNguoiOCung::tu)
                    .toList() : Collections.emptyList();
        }

        if (hoSo == null) {
            CauHinhBenA benA = cauHinhBenARepository != null ? cauHinhBenARepository.findByToaNhaId(hopDongView.toaNhaId()).orElse(null) : null;
            NguoiThue nt = nguoiThueRepository.findById(hopDong.nguoiThueId()).orElse(null);
            Phong phong = phongRepository.findById(hopDong.phongId()).orElse(null);
            ToaNha toaNha = toaNhaRepository != null ? toaNhaRepository.findById(hopDongView.toaNhaId()).orElse(null) : null;
            MauHopDong mau = mauHopDongRepository != null ? mauHopDongRepository.findPublishedByToaNhaId(hopDongView.toaNhaId()).orElse(null) : null;

            Long bienBanNhanPhongId = null;
            if (taiSanRepository != null) {
                List<BienBanBanGiaoDto> dsBb = taiSanRepository.layDanhSachBienBan(hopDongId);
                bienBanNhanPhongId = dsBb.stream()
                        .filter(b -> "NHAN_PHONG".equals(b.loaiBienBan()))
                        .map(BienBanBanGiaoDto::id)
                        .findFirst()
                        .orElse(null);
            }

            String tkNhanTien = null;
            if (benA != null && benA.soTaiKhoan() != null && !benA.soTaiKhoan().isBlank()) {
                tkNhanTien = benA.soTaiKhoan() + " - " + benA.tenNganHang() + " (" + benA.chuTaiKhoan() + ")";
            } else if (toaNha != null && toaNha.tkNganHang() != null && !toaNha.tkNganHang().isBlank()) {
                tkNhanTien = toaNha.tkNganHang() + " - " + toaNha.maNganHang();
            }

            String snapshotDichVu = buildSnapshotDichVuJson(hopDongId, hopDong.ngayBatDau());
            String snapshotTaiSan = buildSnapshotTaiSanJson(hopDongView, bienBanNhanPhongId, nguoiDung);

            hoSo = new HopDongHoSo(
                    null,
                    hopDongId,
                    1,
                    "DRAFT",
                    mau != null ? mau.id() : null,
                    mau != null ? mau.phienBan() : 1,
                    mau != null && mau.tieuDe() != null ? mau.tieuDe() : "HỢP ĐỒNG THUÊ PHÒNG",
                    LocalDate.now(clock),
                    "Hà Nội",
                    "Để ở",
                    "Sử dụng riêng diện tích phòng thuê và sử dụng chung các tiện ích công cộng của toà nhà theo nội quy.",
                    hopDong.ngayBatDau(),
                    "CHUYEN_KHOAN",
                    1,
                    5,
                    tkNhanTien,
                    "Giá thuê giữ nguyên trong suốt thời hạn hợp đồng, trừ trường hợp có thỏa thuận bằng văn bản.",
                    bienBanNhanPhongId,
                    benA != null ? benA.loaiChuThe() : "CA_NHAN",
                    benA != null ? benA.tenChuThe() : (toaNha != null ? toaNha.ten() : null),
                    benA != null ? benA.maSoDinhDanh() : null,
                    benA != null ? benA.diaChiLienHe() : (toaNha != null ? toaNha.diaChi() : null),
                    benA != null ? benA.soDienThoai() : null,
                    benA != null ? benA.email() : null,
                    benA != null ? benA.hoTenNguoiKy() : null,
                    benA != null ? benA.chucVuNguoiKy() : "Chủ sở hữu",
                    benA != null ? benA.tuCachKy() : "CHU_SO_HUU",
                    benA != null ? benA.canCuUyQuyen() : null,
                    benA != null ? benA.thongTinDonViQuanLy() : null,
                    nt != null ? nt.hoTen() : hopDongView.hoTenNguoiThue(),
                    nt != null ? nt.ngaySinh() : null,
                    nt != null && nt.loaiGiayTo() != null ? nt.loaiGiayTo() : "CCCD",
                    nt != null ? nt.soGiayTo() : null,
                    nt != null ? nt.ngayCapGiayTo() : null,
                    nt != null ? nt.noiCapGiayTo() : null,
                    nt != null ? nt.diaChiThuongTru() : null,
                    nt != null ? nt.diaChiLienHe() : null,
                    nt != null ? nt.soDienThoai() : null,
                    nt != null ? nt.email() : null,
                    toaNha != null ? toaNha.ten() : null,
                    toaNha != null ? toaNha.diaChi() : null,
                    phong != null ? phong.soPhong() : hopDongView.soPhong(),
                    phong != null ? phong.tang() : null,
                    phong != null ? phong.dienTich() : null,
                    mau != null ? mau.noiDungDieuKhoan() : MauHopDongChuan.NOI_DUNG_DIEU_KHOAN_CHUAN,
                    snapshotDichVu,
                    snapshotTaiSan,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    LocalDateTime.now(clock),
                    LocalDateTime.now(clock),
                    phong != null ? phong.sucChua() : null,
                    30,
                    7,
                    "22h00 - 06h00"
            );
        }

        List<String> canhBao = new ArrayList<>();
        if (hoSo.benANguoiKy() == null || hoSo.benANguoiKy().isBlank()
                || hoSo.benADinhDanh() == null || hoSo.benADinhDanh().isBlank()
                || hoSo.benADiaChi() == null || hoSo.benADiaChi().isBlank()) {
            canhBao.add("Chưa hoàn thiện thông tin pháp lý hoặc người ký của Bên A.");
        }
        if (hoSo.benBSoGiayTo() == null || hoSo.benBSoGiayTo().isBlank()) {
            canhBao.add("Bên B chưa có số CCCD/Hộ chiếu.");
        }
        if (hoSo.benBNgayCap() == null || hoSo.benBNoiCap() == null || hoSo.benBNoiCap().isBlank()) {
            canhBao.add("Bên B chưa có ngày cấp và nơi cấp giấy tờ.");
        }
        if (hoSo.benBThuongTru() == null || hoSo.benBThuongTru().isBlank()) {
            canhBao.add("Bên B chưa có địa chỉ thường trú.");
        }
        if (hoSo.bienBanBanGiaoId() == null) {
            canhBao.add("Chưa liên kết biên bản bàn giao nhận phòng vào hợp đồng.");
        }
        if (tienCocThucThu.compareTo(hopDong.tienCoc()) < 0) {
            canhBao.add("Tiền cọc thực thu (" + formatTien(tienCocThucThu) + ") chưa đủ mức thỏa thuận (" + formatTien(hopDong.tienCoc()) + ").");
        }
        if (hoSo.dieuKhoanTuyBien() == null || hoSo.dieuKhoanTuyBien().isBlank()) {
            canhBao.add("Chưa có nội dung điều khoản hợp đồng. Vui lòng nạp mẫu hợp đồng hoặc bổ sung điều khoản.");
        } else if (MauHopDongChuan.coNoiDungChuaThoaThuan(hoSo.dieuKhoanTuyBien())) {
            canhBao.add("Điều khoản hợp đồng còn nội dung chưa hoàn thiện cần thỏa thuận (chứa ký hiệu đánh dấu [CHƯA THỎA THUẬN] / [CẦN BỔ SUNG]).");
        }

        boolean daCoHoSoChot = hoSo.id() != null && ("DA_CHOT".equals(hoSo.trangThaiTaiLieu()) || "DA_GHI_NHAN_KY".equals(hoSo.trangThaiTaiLieu()));

        return HopDongHoSoDto.tu(
                hoSo,
                hopDong.id(),
                hopDong.giaThue(),
                hopDong.tienCoc(),
                tienCocThucThu,
                hopDong.ngayBatDau(),
                hopDong.ngayKetThuc(),
                hopDong.soNgayBaoTruoc(),
                hopDong.trangThai().name(),
                dsNguoiOCung,
                canhBao,
                daCoHoSoChot
        );
    }

    @Transactional
    public HopDongHoSoDto luuDraftHoSo(Long hopDongId, YeuCauLuuDraftHoSo req, NguoiDung nguoiDung) {
        kiemTraVaiTro(nguoiDung);
        HopDongRepository.HopDongView hopDongView = layHopDongTrongPhamVi(hopDongId, nguoiDung);
        HopDongHoSo existing = hopDongHoSoRepository != null ? hopDongHoSoRepository.findLatestByHopDongId(hopDongId).orElse(null) : null;
        if (existing != null && ("DA_CHOT".equals(existing.trangThaiTaiLieu()) || "DA_GHI_NHAN_KY".equals(existing.trangThaiTaiLieu()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Hồ sơ hợp đồng đã chốt không thể sửa trực tiếp. Vui lòng tạo phụ lục hợp đồng.");
        }

        Integer expectedRev = req != null ? req.getEffectiveRevision() : null;
        if (existing != null) {
            if (expectedRev == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu expectedRevision khi cập nhật hồ sơ hợp đồng.");
            }
            if (expectedRev.intValue() != existing.revision()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Hồ sơ hợp đồng đã bị thay đổi bởi thao tác khác (phiên bản không khớp). Vui lòng tải lại.");
            }
        }

        if (req != null && req.bienBanBanGiaoId() != null) {
            kiemTraBienBanNhanPhong(req.bienBanBanGiaoId(), hopDongView, nguoiDung);
        }

        if (req != null && req.mauHopDongId() != null && mauHopDongRepository != null) {
            MauHopDong mau = mauHopDongRepository.findById(req.mauHopDongId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mẫu hợp đồng không tồn tại."));
            if (!mau.toaNhaId().equals(hopDongView.toaNhaId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Mẫu hợp đồng không thuộc tòa nhà này.");
            }
        }

        Phong phong = phongRepository.findById(hopDongView.hopDong().phongId()).orElse(null);
        ToaNha toaNha = toaNhaRepository != null ? toaNhaRepository.findById(hopDongView.toaNhaId()).orElse(null) : null;

        if (existing == null && hopDongHoSoRepository != null) {
            HopDongHoSo moi = new HopDongHoSo(
                    null,
                    hopDongId,
                    1,
                    "DRAFT",
                    req != null ? req.mauHopDongId() : null,
                    1,
                    req != null && req.tieuDe() != null && !req.tieuDe().isBlank() ? req.tieuDe() : "HỢP ĐỒNG THUÊ PHÒNG",
                    req != null && req.ngayLap() != null ? req.ngayLap() : LocalDate.now(clock),
                    req != null && req.diaDiemLap() != null && !req.diaDiemLap().isBlank() ? req.diaDiemLap() : "Hà Nội",
                    req != null && req.mucDichThue() != null && !req.mucDichThue().isBlank() ? req.mucDichThue() : "Để ở",
                    req != null && req.phamViSuDung() != null && !req.phamViSuDung().isBlank() ? req.phamViSuDung() : "Sử dụng riêng diện tích phòng thuê và sử dụng chung các tiện ích công cộng của toà nhà theo nội quy.",
                    req != null && req.ngayNhanPhong() != null ? req.ngayNhanPhong() : hopDongView.hopDong().ngayBatDau(),
                    req != null && req.phuongThucThanhToan() != null && !req.phuongThucThanhToan().isBlank() ? req.phuongThucThanhToan() : "CHUYEN_KHOAN",
                    req != null && req.kyThanhToanThang() != null ? req.kyThanhToanThang() : 1,
                    req != null && req.hanThanhToanNgay() != null ? req.hanThanhToanNgay() : 5,
                    req != null ? req.taiKhoanNhanTien() : null,
                    req != null ? req.dieuKienDieuChinhGia() : null,
                    req != null ? req.bienBanBanGiaoId() : null,
                    req != null ? req.benALoaiChuThe() : null,
                    req != null ? req.benATenChuThe() : null,
                    req != null ? req.benADinhDanh() : null,
                    req != null ? req.benADiaChi() : null,
                    req != null ? req.benADienThoai() : null,
                    req != null ? req.benAEmail() : null,
                    req != null ? req.benANguoiKy() : null,
                    req != null ? req.benAChucVu() : null,
                    req != null ? req.benATuCachKy() : null,
                    req != null ? req.benACanCuUyQuyen() : null,
                    req != null ? req.benADonViQuanLy() : null,
                    req != null ? req.benBHoTen() : null,
                    req != null ? req.benBNgaySinh() : null,
                    req != null ? req.benBLoaiGiayTo() : null,
                    req != null ? req.benBSoGiayTo() : null,
                    req != null ? req.benBNgayCap() : null,
                    req != null ? req.benBNoiCap() : null,
                    req != null ? req.benBThuongTru() : null,
                    req != null ? req.benBLienHe() : null,
                    req != null ? req.benBDienThoai() : null,
                    req != null ? req.benBEmail() : null,
                    toaNha != null ? toaNha.ten() : null,
                    toaNha != null ? toaNha.diaChi() : null,
                    phong != null ? phong.soPhong() : hopDongView.soPhong(),
                    phong != null ? phong.tang() : null,
                    phong != null ? phong.dienTich() : null,
                    req != null ? req.dieuKhoanTuyBien() : null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    LocalDateTime.now(clock),
                    LocalDateTime.now(clock),
                    req != null && req.soNguoiToiDa() != null ? req.soNguoiToiDa() : (phong != null ? phong.sucChua() : null),
                    req != null && req.soNgayBaoTruocGiaHan() != null ? req.soNgayBaoTruocGiaHan() : 30,
                    req != null && req.soNgayHoanCoc() != null ? req.soNgayHoanCoc() : 7,
                    req != null && req.khungGioYenTinh() != null && !req.khungGioYenTinh().isBlank() ? req.khungGioYenTinh() : "22h00 - 06h00"
            );
            hopDongHoSoRepository.insert(moi);
        } else if (existing != null && hopDongHoSoRepository != null) {
            HopDongHoSo capNhat = new HopDongHoSo(
                    existing.id(),
                    hopDongId,
                    existing.revision(),
                    "DRAFT",
                    req != null && req.mauHopDongId() != null ? req.mauHopDongId() : existing.mauHopDongId(),
                    existing.mauPhienBan(),
                    req != null && req.tieuDe() != null && !req.tieuDe().isBlank() ? req.tieuDe() : existing.tieuDe(),
                    req != null && req.ngayLap() != null ? req.ngayLap() : existing.ngayLap(),
                    req != null && req.diaDiemLap() != null && !req.diaDiemLap().isBlank() ? req.diaDiemLap() : existing.diaDiemLap(),
                    req != null && req.mucDichThue() != null && !req.mucDichThue().isBlank() ? req.mucDichThue() : existing.mucDichThue(),
                    req != null && req.phamViSuDung() != null && !req.phamViSuDung().isBlank() ? req.phamViSuDung() : existing.phamViSuDung(),
                    req != null && req.ngayNhanPhong() != null ? req.ngayNhanPhong() : existing.ngayNhanPhong(),
                    req != null && req.phuongThucThanhToan() != null && !req.phuongThucThanhToan().isBlank() ? req.phuongThucThanhToan() : existing.phuongThucThanhToan(),
                    req != null && req.kyThanhToanThang() != null ? req.kyThanhToanThang() : existing.kyThanhToanThang(),
                    req != null && req.hanThanhToanNgay() != null ? req.hanThanhToanNgay() : existing.hanThanhToanNgay(),
                    req != null && req.taiKhoanNhanTien() != null ? req.taiKhoanNhanTien() : existing.taiKhoanNhanTien(),
                    req != null && req.dieuKienDieuChinhGia() != null ? req.dieuKienDieuChinhGia() : existing.dieuKienDieuChinhGia(),
                    req != null && req.bienBanBanGiaoId() != null ? req.bienBanBanGiaoId() : existing.bienBanBanGiaoId(),
                    req != null && req.benALoaiChuThe() != null ? req.benALoaiChuThe() : existing.benALoaiChuThe(),
                    req != null && req.benATenChuThe() != null ? req.benATenChuThe() : existing.benATenChuThe(),
                    req != null && req.benADinhDanh() != null ? req.benADinhDanh() : existing.benADinhDanh(),
                    req != null && req.benADiaChi() != null ? req.benADiaChi() : existing.benADiaChi(),
                    req != null && req.benADienThoai() != null ? req.benADienThoai() : existing.benADienThoai(),
                    req != null && req.benAEmail() != null ? req.benAEmail() : existing.benAEmail(),
                    req != null && req.benANguoiKy() != null ? req.benANguoiKy() : existing.benANguoiKy(),
                    req != null && req.benAChucVu() != null ? req.benAChucVu() : existing.benAChucVu(),
                    req != null && req.benATuCachKy() != null ? req.benATuCachKy() : existing.benATuCachKy(),
                    req != null && req.benACanCuUyQuyen() != null ? req.benACanCuUyQuyen() : existing.benACanCuUyQuyen(),
                    req != null && req.benADonViQuanLy() != null ? req.benADonViQuanLy() : existing.benADonViQuanLy(),
                    req != null && req.benBHoTen() != null ? req.benBHoTen() : existing.benBHoTen(),
                    req != null && req.benBNgaySinh() != null ? req.benBNgaySinh() : existing.benBNgaySinh(),
                    req != null && req.benBLoaiGiayTo() != null ? req.benBLoaiGiayTo() : existing.benBLoaiGiayTo(),
                    req != null && req.benBSoGiayTo() != null ? req.benBSoGiayTo() : existing.benBSoGiayTo(),
                    req != null && req.benBNgayCap() != null ? req.benBNgayCap() : existing.benBNgayCap(),
                    req != null && req.benBNoiCap() != null ? req.benBNoiCap() : existing.benBNoiCap(),
                    req != null && req.benBThuongTru() != null ? req.benBThuongTru() : existing.benBThuongTru(),
                    req != null && req.benBLienHe() != null ? req.benBLienHe() : existing.benBLienHe(),
                    req != null && req.benBDienThoai() != null ? req.benBDienThoai() : existing.benBDienThoai(),
                    req != null && req.benBEmail() != null ? req.benBEmail() : existing.benBEmail(),
                    existing.bdsTenToaNha(),
                    existing.bdsDiaChiToaNha(),
                    existing.bdsSoPhong(),
                    existing.bdsTang(),
                    existing.bdsDienTich(),
                    req != null && req.dieuKhoanTuyBien() != null ? req.dieuKhoanTuyBien() : existing.dieuKhoanTuyBien(),
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    existing.taoLuc(),
                    LocalDateTime.now(clock),
                    req != null && req.soNguoiToiDa() != null ? req.soNguoiToiDa() : existing.soNguoiToiDa(),
                    req != null && req.soNgayBaoTruocGiaHan() != null ? req.soNgayBaoTruocGiaHan() : existing.soNgayBaoTruocGiaHan(),
                    req != null && req.soNgayHoanCoc() != null ? req.soNgayHoanCoc() : existing.soNgayHoanCoc(),
                    req != null && req.khungGioYenTinh() != null && !req.khungGioYenTinh().isBlank() ? req.khungGioYenTinh() : existing.khungGioYenTinh()
            );
            int affected = hopDongHoSoRepository.updateDraft(capNhat, expectedRev);
            if (affected == 0) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Hồ sơ hợp đồng đã bị thay đổi hoặc không ở trạng thái DRAFT. Vui lòng tải lại.");
            }
        }

        if (req != null) {
            nguoiThueRepository.findById(hopDongView.hopDong().nguoiThueId()).ifPresent(nt -> {
                nguoiThueRepository.update(new NguoiThue(
                        nt.id(),
                        req.benBHoTen() != null && !req.benBHoTen().isBlank() ? req.benBHoTen().trim() : nt.hoTen(),
                        req.benBNgaySinh() != null ? req.benBNgaySinh() : nt.ngaySinh(),
                        req.benBDienThoai() != null && !req.benBDienThoai().isBlank() ? req.benBDienThoai().trim() : nt.soDienThoai(),
                        req.benBSoGiayTo() != null && !req.benBSoGiayTo().isBlank() ? req.benBSoGiayTo().trim() : nt.soGiayTo(),
                        nt.queQuan(),
                        nt.trangThaiLuuTru(),
                        req.benBLoaiGiayTo() != null ? req.benBLoaiGiayTo() : nt.loaiGiayTo(),
                        req.benBNgayCap() != null ? req.benBNgayCap() : nt.ngayCapGiayTo(),
                        req.benBNoiCap() != null ? req.benBNoiCap() : nt.noiCapGiayTo(),
                        req.benBThuongTru() != null ? req.benBThuongTru() : nt.diaChiThuongTru(),
                        req.benBLienHe() != null ? req.benBLienHe() : nt.diaChiLienHe(),
                        req.benBEmail() != null ? req.benBEmail() : nt.email()
                ));
            });
        }

        return layHoSoHopDong(hopDongId, nguoiDung);
    }

    @Transactional
    public HopDongHoSoDto chotHoSo(Long hopDongId, YeuCauChotHoSo req, NguoiDung nguoiDung) {
        kiemTraVaiTro(nguoiDung);
        HopDongRepository.HopDongView hopDongView = layHopDongTrongPhamVi(hopDongId, nguoiDung);

        HopDongHoSo hoSo = hopDongHoSoRepository != null ? hopDongHoSoRepository.findLatestByHopDongId(hopDongId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chưa có bản dự thảo hồ sơ hợp đồng để chốt.")) : null;

        if (hoSo == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chưa có bản dự thảo hồ sơ hợp đồng để chốt.");
        }

        if ("DA_CHOT".equals(hoSo.trangThaiTaiLieu()) || "DA_GHI_NHAN_KY".equals(hoSo.trangThaiTaiLieu())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hợp đồng đã được chốt trước đó.");
        }

        Integer expectedRev = req != null ? req.getEffectiveRevision() : null;
        if (expectedRev == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu expectedRevision khi chốt hồ sơ hợp đồng.");
        }
        if (expectedRev.intValue() != hoSo.revision()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Dữ liệu hợp đồng đã bị thay đổi bởi người khác (phiên bản không khớp). Vui lòng tải lại trang.");
        }

        if (req != null && req.duLieuHoSo() != null) {
            luuDraftHoSo(hopDongId, req.duLieuHoSo(), nguoiDung);
            hoSo = hopDongHoSoRepository.findLatestByHopDongId(hopDongId).orElseThrow();
        }

        if (hoSo.benATenChuThe() == null || hoSo.benATenChuThe().isBlank()
                || hoSo.benADinhDanh() == null || hoSo.benADinhDanh().isBlank()
                || hoSo.benADiaChi() == null || hoSo.benADiaChi().isBlank()
                || hoSo.benADienThoai() == null || hoSo.benADienThoai().isBlank()
                || hoSo.benANguoiKy() == null || hoSo.benANguoiKy().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu thông tin bắt buộc của Bên cho thuê (Bên A): Tên chủ thể, MST/CCCD, địa chỉ, số điện thoại, người ký.");
        }

        String tuCachKy = hoSo.benATuCachKy() != null ? hoSo.benATuCachKy() : "CHU_SO_HUU";
        if (!"CHU_SO_HUU".equals(tuCachKy) && !"DAI_DIEN_PHAP_LUAT".equals(tuCachKy) && !"NGUOI_DUOC_UY_QUYEN".equals(tuCachKy)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tư cách ký của Bên A không hợp lệ (phải là CHU_SO_HUU, DAI_DIEN_PHAP_LUAT hoặc NGUOI_DUOC_UY_QUYEN).");
        }
        if ("NGUOI_DUOC_UY_QUYEN".equals(tuCachKy)) {
            if (hoSo.benACanCuUyQuyen() == null || hoSo.benACanCuUyQuyen().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Người ký là Người được ủy quyền bắt buộc phải có thông tin Căn cứ ủy quyền (văn bản/ngày ký ủy quyền).");
            }
        }

        if (hoSo.benBHoTen() == null || hoSo.benBHoTen().isBlank()
                || hoSo.benBSoGiayTo() == null || hoSo.benBSoGiayTo().isBlank()
                || hoSo.benBThuongTru() == null || hoSo.benBThuongTru().isBlank()
                || hoSo.benBDienThoai() == null || hoSo.benBDienThoai().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu thông tin bắt buộc của Bên thuê (Bên B): Họ tên, số CCCD/Hộ chiếu, địa chỉ thường trú, số điện thoại.");
        }

        if (hoSo.kyThanhToanThang() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kỳ thanh toán phải lớn hơn 0 tháng.");
        }
        if (hoSo.hanThanhToanNgay() < 1 || hoSo.hanThanhToanNgay() > 28) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hạn thanh toán hàng tháng phải từ ngày 1 đến ngày 28.");
        }

        if (hoSo.mauHopDongId() != null && mauHopDongRepository != null) {
            MauHopDong mau = mauHopDongRepository.findById(hoSo.mauHopDongId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mẫu hợp đồng không tồn tại."));
            if (!mau.toaNhaId().equals(hopDongView.toaNhaId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Mẫu hợp đồng không thuộc tòa nhà của hợp đồng này.");
            }
            if (!"PUBLISHED".equals(mau.trangThai())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mẫu hợp đồng chưa được xuất bản (PUBLISHED).");
            }
        }

        if (hoSo.dieuKhoanTuyBien() == null || hoSo.dieuKhoanTuyBien().trim().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Điều khoản hợp đồng không được để trống khi chốt.");
        }
        if (MauHopDongChuan.coNoiDungChuaThoaThuan(hoSo.dieuKhoanTuyBien())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Điều khoản hợp đồng còn nội dung chưa thỏa thuận hoặc còn chỗ trống chưa hoàn thiện, vui lòng rà soát trước khi chốt.");
        }

        String snapshotDichVuJson = buildSnapshotDichVuJson(hopDongId, hopDongView.hopDong().ngayBatDau());
        kiemTraSnapshotDichVuTruocKhiChot(snapshotDichVuJson);
        String snapshotTaiSanJson = buildSnapshotTaiSanJson(hopDongView, hoSo.bienBanBanGiaoId(), nguoiDung);

        LocalDate ngayBatDauHd = hoSo.ngayNhanPhong() != null ? hoSo.ngayNhanPhong() : hopDongView.hopDong().ngayBatDau();
        LocalDate ngayKetThucHd = hopDongView.hopDong().ngayKetThuc();

        List<ThongTinNguoiOCung> dsNguoiOCungList = nguoiOCungRepository != null
                ? nguoiOCungRepository.findByHopDongId(hopDongId).stream()
                .filter(noc -> "DA_DUYET".equals(noc.trangThai()))
                .filter(noc -> (noc.denNgay() == null || !noc.denNgay().isBefore(ngayBatDauHd))
                        && (noc.tuNgay() == null || !noc.tuNgay().isAfter(ngayKetThucHd)))
                .map(ThongTinNguoiOCung::tu)
                .toList()
                : Collections.emptyList();
        String snapshotNguoiOCungJson;
        try {
            snapshotNguoiOCungJson = objectMapper.writeValueAsString(dsNguoiOCungList);
        } catch (Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Lỗi serialize danh sách người ở cùng khi chốt hồ sơ: " + e.getMessage(),
                    e
            );
        }

        int affected = hopDongHoSoRepository.chotHoSo(
                hoSo.id(),
                hoSo.revision(),
                nguoiDung.id(),
                LocalDateTime.now(clock),
                snapshotDichVuJson,
                snapshotTaiSanJson,
                snapshotNguoiOCungJson
        );
        if (affected == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Hồ sơ hợp đồng đã bị thay đổi hoặc không ở trạng thái DRAFT.");
        }

        return layHoSoHopDong(hopDongId, nguoiDung);
    }

    @Transactional
    public HopDongHoSoDto ghiNhanKy(Long hopDongId, YeuCauGhiNhanKy req, NguoiDung nguoiDung) {
        kiemTraVaiTro(nguoiDung);
        HopDongRepository.HopDongView hopDongView = layHopDongTrongPhamVi(hopDongId, nguoiDung);

        HopDongHoSo hoSo = hopDongHoSoRepository != null ? hopDongHoSoRepository.findLatestByHopDongId(hopDongId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hợp đồng chưa có hồ sơ.")) : null;

        if (hoSo == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hợp đồng chưa có hồ sơ.");
        }

        if (!"DA_CHOT".equals(hoSo.trangThaiTaiLieu())) {
            if ("DA_GHI_NHAN_KY".equals(hoSo.trangThaiTaiLieu())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Hợp đồng đã được ghi nhận ký trước đó, không thể ghi đè.");
            }
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hồ sơ hợp đồng đang ở bản dự thảo (DRAFT), phải chốt hồ sơ trước khi ghi nhận ký.");
        }

        if (req != null && req.expectedRevision() != null && req.expectedRevision().intValue() != hoSo.revision()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Hồ sơ hợp đồng đã bị thay đổi hoặc mở lại thành bản nháp (phiên bản không khớp). Không thể ghi nhận ký bản đã bị thay thế.");
        }

        if (req == null || req.ngayKy() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu ngày ký thực tế của hợp đồng.");
        }
        LocalDate today = LocalDate.now(clock);
        if (req.ngayKy().isAfter(today)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ngày ký hợp đồng không được ở tương lai.");
        }
        if (hoSo.ngayLap() != null && req.ngayKy().isBefore(hoSo.ngayLap())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ngày ký hợp đồng không được trước ngày lập hồ sơ.");
        }
        if (hopDongView.hopDong().ngayBatDau() != null && req.ngayKy().isBefore(hopDongView.hopDong().ngayBatDau().minusMonths(6))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ngày ký không hợp lệ so với thời điểm bắt đầu hợp đồng.");
        }

        String fileScan = req.fileScanDinhKem();
        if (fileScan != null && !fileScan.isBlank()) {
            fileScan = fileScan.trim();
            if (fileScan.contains("..") || fileScan.contains("/") || fileScan.contains("\\")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên file scan đính kèm không hợp lệ (không được chứa đường dẫn hoặc ký tự đặc biệt).");
            }
            if (!fileScan.matches("^[a-zA-Z0-9_.-]+$")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên file scan chỉ được chứa chữ cái, số, gạch dưới, gạch ngang và dấu chấm.");
            }
        } else {
            fileScan = null;
        }

        int affected = hopDongHoSoRepository.ghiNhanKy(
                hoSo.id(),
                nguoiDung.id(),
                req.ngayKy(),
                LocalDateTime.now(clock),
                req.ghiChuKy() != null ? req.ghiChuKy().trim() : null,
                fileScan
        );
        if (affected == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Hồ sơ không ở trạng thái DA_CHOT hoặc đã được ghi nhận ký bởi thao tác khác.");
        }

        return layHoSoHopDong(hopDongId, nguoiDung);
    }

    @Transactional
    public HopDongHoSoDto moLaiDraft(Long hopDongId, Integer expectedRevision, String lyDo, NguoiDung nguoiDung) {
        kiemTraVaiTro(nguoiDung);
        layHopDongTrongPhamVi(hopDongId, nguoiDung);

        HopDongHoSo hoSo = hopDongHoSoRepository != null ? hopDongHoSoRepository.findLatestByHopDongId(hopDongId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ hợp đồng.")) : null;

        if (hoSo == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ hợp đồng.");
        }

        if (!"DA_CHOT".equals(hoSo.trangThaiTaiLieu())) {
            if ("DA_GHI_NHAN_KY".equals(hoSo.trangThaiTaiLieu())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hợp đồng đã ghi nhận ký chính thức, không thể mở lại thành bản nháp.");
            }
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hồ sơ hợp đồng hiện đang ở trạng thái " + hoSo.trangThaiTaiLieu() + ", không thể mở lại.");
        }

        if (expectedRevision != null && expectedRevision.intValue() != hoSo.revision()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Phiên bản hồ sơ không khớp (hồ sơ đã bị thay đổi). Vui lòng tải lại trang.");
        }

        int affected = hopDongHoSoRepository.moLaiDraft(hopDongId, hoSo.revision(), nguoiDung.id());
        if (affected == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Không thể mở lại bản nháp do xung đột phiên bản hoặc trạng thái hồ sơ.");
        }

        if (nhatKyThaoTacRepository != null) {
            nhatKyThaoTacRepository.ghi(
                    nguoiDung.id(),
                    "MO_LAI_DRAFT_HO_SO",
                    "HOP_DONG:" + hopDongId,
                    "revision=" + hoSo.revision() + ";trangThai=DA_CHOT",
                    "revision=" + (hoSo.revision() + 1) + ";trangThai=DRAFT;lyDo=" + (lyDo != null ? lyDo.trim() : "Mở lại để chỉnh sửa")
            );
        }

        return layHoSoHopDong(hopDongId, nguoiDung);
    }

    @Transactional
    public HopDongPhuLucDto taoPhuLuc(Long hopDongId, YeuCauTaoPhuLuc req, NguoiDung nguoiDung) {
        kiemTraVaiTro(nguoiDung);
        layHopDongTrongPhamVi(hopDongId, nguoiDung);

        HopDongHoSo hoSo = hopDongHoSoRepository != null ? hopDongHoSoRepository.findLatestByHopDongId(hopDongId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hợp đồng chưa có hồ sơ.")) : null;

        if (hoSo == null || "DRAFT".equals(hoSo.trangThaiTaiLieu())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ được tạo phụ lục cho hợp đồng đã chốt.");
        }

        if (req == null
                || req.tieuDe() == null || req.tieuDe().isBlank()
                || req.noiDungThayDoi() == null || req.noiDungThayDoi().isBlank()
                || req.ngayHieuLuc() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu thông tin bắt buộc của phụ lục (tiêu đề, nội dung thay đổi, ngày hiệu lực).");
        }

        int nextSo = hopDongPhuLucRepository.getNextSoPhuLuc(hopDongId);
        Long id = hopDongPhuLucRepository.insert(
                hopDongId,
                nextSo,
                req.tieuDe().trim(),
                req.ngayLap() != null ? req.ngayLap() : LocalDate.now(clock),
                req.ngayHieuLuc(),
                req.noiDungThayDoi().trim(),
                "DA_CHOT",
                nguoiDung.id()
        );

        return hopDongPhuLucRepository.findById(id)
                .map(HopDongPhuLucDto::tu)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR));
    }

    public List<HopDongPhuLucDto> danhSachPhuLuc(Long hopDongId, NguoiDung nguoiDung) {
        layHopDongChoPhepXem(hopDongId, nguoiDung);
        if (hopDongPhuLucRepository == null) return List.of();
        return hopDongPhuLucRepository.findByHopDongId(hopDongId).stream()
                .map(HopDongPhuLucDto::tu)
                .toList();
    }

    public HopDongRepository.HopDongView layHopDongChoPhepXem(Long hopDongId, NguoiDung nguoiDung) {
        HopDongRepository.HopDongView hopDongView = hopDongRepository.findViewById(hopDongId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (nguoiDung == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        if (nguoiDung.vaiTro() == VaiTro.NGUOI_THUE) {
            if (nguoiDung.nguoiThueId() == null || !nguoiDung.nguoiThueId().equals(hopDongView.hopDong().nguoiThueId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            }
        } else {
            kiemTraVaiTro(nguoiDung);
            phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, hopDongView.toaNhaId());
        }
        return hopDongView;
    }

    public record SnapshotBacThangItem(
            Integer bac,
            BigDecimal tuSoLuong,
            BigDecimal denSoLuong,
            BigDecimal tuChiSo,
            BigDecimal denChiSo,
            BigDecimal tyLe,
            BigDecimal donGia
    ) {}

    public record SnapshotDichVuItem(
            Long dichVuId,
            String tenDichVu,
            String cachTinh,
            String cheDoGia,
            String donVi,
            BigDecimal donGiaApDung,
            LocalDate ngayApDung,
            List<SnapshotBacThangItem> cacBacThang
    ) {}

    public record SnapshotTaiSanItem(
            Long taiSanId,
            String tenTaiSan,
            int soLuong,
            String tinhTrangLucGiao,
            String ghiChu
    ) {}

    public TaiSanRepository.ThongTinKiemTraBienBan kiemTraBienBanNhanPhong(Long bienBanId, HopDongRepository.HopDongView hopDongView, NguoiDung nguoiDung) {
        if (bienBanId == null || taiSanRepository == null) return null;
        TaiSanRepository.ThongTinKiemTraBienBan info = taiSanRepository.layThongTinKiemTraBienBan(bienBanId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Biên bản bàn giao đính kèm không tồn tại."));
        if (!info.hopDongId().equals(hopDongView.hopDong().id())
                || !info.phongId().equals(hopDongView.hopDong().phongId())
                || !info.toaNhaId().equals(hopDongView.toaNhaId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Biên bản bàn giao không thuộc hợp đồng hoặc phòng/tòa nhà này.");
        }
        if (!"NHAN_PHONG".equals(info.loaiBienBan())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Biên bản bàn giao đính kèm phải là loại NHAN_PHONG.");
        }
        if (nguoiDung != null && nguoiDung.vaiTro() != VaiTro.NGUOI_THUE) {
            phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, info.toaNhaId());
        }
        return info;
    }

    private void kiemTraSnapshotDichVuTruocKhiChot(String snapshotDichVuJson) {
        if (snapshotDichVuJson == null || snapshotDichVuJson.trim().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Snapshot dịch vụ không được để trống khi chốt.");
        }
        try {
            JsonNode arrayNode = objectMapper.readTree(snapshotDichVuJson);
            if (!arrayNode.isArray()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Snapshot dịch vụ không đúng định dạng danh sách JSON.");
            }
            if (arrayNode.isEmpty()) {
                // "[]" is valid when contract does not select any services
                return;
            }
            for (JsonNode item : arrayNode) {
                String cheDoGia = item.path("cheDoGia").asText("CO_DINH");
                String tenDichVu = item.path("tenDichVu").asText("Dịch vụ");
                if ("BAC_THANG".equals(cheDoGia)) {
                    JsonNode tiers = item.path("cacBacThang");
                    if (tiers == null || !tiers.isArray() || tiers.isEmpty()) {
                        throw new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "Dịch vụ bậc thang '" + tenDichVu + "' chưa có bảng giá hiệu lực tại ngày áp dụng hoặc thiếu các bậc thang định mức. Không thể chốt hợp đồng."
                        );
                    }
                    for (JsonNode tier : tiers) {
                        if (!tier.has("donGia") || tier.path("donGia").isNull() || tier.path("donGia").asText().isBlank()) {
                            throw new ResponseStatusException(
                                    HttpStatus.BAD_REQUEST,
                                    "Bậc " + tier.path("bac").asInt(1) + " của dịch vụ bậc thang '" + tenDichVu + "' thiếu đơn giá."
                            );
                        }
                    }
                } else {
                    if (!item.has("donGiaApDung") || item.path("donGiaApDung").isNull() || item.path("donGiaApDung").asText().isBlank()) {
                        throw new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "Dịch vụ '" + tenDichVu + "' thiếu đơn giá áp dụng."
                        );
                    }
                }
            }
        } catch (ResponseStatusException rse) {
            throw rse;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lỗi kiểm tra định dạng snapshot dịch vụ: " + e.getMessage(), e);
        }
    }

    private String buildSnapshotDichVuJson(Long hopDongId, LocalDate ngayBatDau) {
        if (hopDongRepository == null) return "[]";
        List<ThongTinHopDongDichVu> dsDichVu = hopDongRepository.findDichVuApDungByHopDongId(hopDongId);
        List<SnapshotDichVuItem> items = new ArrayList<>();
        for (ThongTinHopDongDichVu dv : dsDichVu) {
            DichVu entity = dichVuRepository != null ? dichVuRepository.findById(dv.dichVuId()).orElse(null) : null;
            String cachTinh = entity != null && entity.cachTinh() != null ? entity.cachTinh().name() : "";
            String cheDoGia = entity != null && entity.cheDoGia() != null ? entity.cheDoGia().name() : (dv.cheDoGia() != null ? dv.cheDoGia() : "CO_DINH");
            String donVi = entity != null ? entity.donVi() : "";
            BigDecimal donGiaApDung = dv.donGiaApDung() != null ? new BigDecimal(dv.donGiaApDung()) : ("BAC_THANG".equals(cheDoGia) ? BigDecimal.ZERO : null);
            LocalDate ngayApDung = ngayBatDau != null ? ngayBatDau : LocalDate.now(clock);
            List<SnapshotBacThangItem> cacBacThang = new ArrayList<>();

            if (entity != null && entity.cheDoGia() == CheDoGia.BAC_THANG && bangGiaRepository != null) {
                LocalDate ngayHieuLuc = bangGiaRepository.findApplicableNgayHieuLucBacThangByDichVuIdAndNgay(
                        entity.id(),
                        ngayApDung
                ).orElse(null);
                if (ngayHieuLuc != null) {
                    ngayApDung = ngayHieuLuc;
                    List<BangGiaBacThang> tiers = bangGiaRepository.findBacThangByDichVuIdAndNgayHieuLuc(entity.id(), ngayHieuLuc);
                    for (BangGiaBacThang t : tiers) {
                        cacBacThang.add(new SnapshotBacThangItem(
                                t.bac(),
                                t.tuSoLuong(),
                                t.denSoLuong(),
                                t.tuSoLuong(),
                                t.denSoLuong(),
                                t.tyLe(),
                                t.donGia()
                        ));
                    }
                }
            }
            items.add(new SnapshotDichVuItem(
                    dv.dichVuId(),
                    dv.tenDichVu(),
                    cachTinh,
                    cheDoGia,
                    donVi,
                    donGiaApDung,
                    ngayApDung,
                    cacBacThang
            ));
        }
        try {
            return objectMapper.writeValueAsString(items);
        } catch (Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Lỗi serialize snapshot dịch vụ: " + e.getMessage(),
                    e
            );
        }
    }

    private String buildSnapshotTaiSanJson(HopDongRepository.HopDongView hopDongView, Long bienBanId, NguoiDung nguoiDung) {
        if (taiSanRepository == null || bienBanId == null) {
            return "[]";
        }
        TaiSanRepository.ThongTinKiemTraBienBan info = kiemTraBienBanNhanPhong(bienBanId, hopDongView, nguoiDung);
        if (info == null) return "[]";

        List<ChiTietBienBanDto> chiTietList = taiSanRepository.layChiTietBienBan(bienBanId);
        List<SnapshotTaiSanItem> items = new ArrayList<>();
        for (ChiTietBienBanDto ct : chiTietList) {
            items.add(new SnapshotTaiSanItem(
                    ct.taiSanId(),
                    ct.tenTaiSan(),
                    ct.soLuong(),
                    ct.tinhTrangLucGiao(),
                    ct.lyDoKhauTru()
            ));
        }
        try {
            return objectMapper.writeValueAsString(items);
        } catch (Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Lỗi serialize snapshot tài sản: " + e.getMessage(),
                    e
            );
        }
    }

    private String formatTien(BigDecimal tien) {
        if (tien == null) return "0 đ";
        return java.text.NumberFormat.getNumberInstance(java.util.Locale.forLanguageTag("vi-VN")).format(tien) + " đ";
    }

    private record HopDongDaChuanHoa(
            HopDong hopDong,
            List<HopDongDichVuDaChuanHoa> dichVuApDung
    ) {
    }

    private record HopDongDichVuDaChuanHoa(
            Long dichVuId,
            String tenDichVu,
            BigDecimal donGiaApDung
    ) {
    }
}
