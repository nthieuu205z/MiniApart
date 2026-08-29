package com.prj1.ccm.hopdong;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.nguoithue.NguoiThue;
import com.prj1.ccm.nguoithue.NguoiThueRepository;
import com.prj1.ccm.toanha.BangGia;
import com.prj1.ccm.toanha.BangGiaRepository;
import com.prj1.ccm.toanha.DichVu;
import com.prj1.ccm.toanha.DichVuRepository;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import com.prj1.ccm.toanha.Phong;
import com.prj1.ccm.toanha.PhongRepository;
import com.prj1.ccm.toanha.TrangThaiPhongService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.math.RoundingMode;
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
    private final Clock clock;

    public HopDongService(
            HopDongRepository hopDongRepository,
            PhongRepository phongRepository,
            NguoiThueRepository nguoiThueRepository,
            DichVuRepository dichVuRepository,
            BangGiaRepository bangGiaRepository,
            NguoiOCungRepository nguoiOCungRepository,
            PhanQuyenToaService phanQuyenToaService,
            TrangThaiPhongService trangThaiPhongService,
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
        this.clock = clock;
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
        phanQuyenToaService.layToaNhaNeuNguoiDungDuocXem(nguoiDung, toaNhaId);
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
        kiemTraVaiTro(nguoiDung);
        HopDongRepository.HopDongView hopDongView = layHopDongTrongPhamVi(hopDongId, nguoiDung);
        TrangThaiHopDong trangThaiHienTai = hopDongView.hopDong().trangThai();
        if (trangThaiHienTai != TrangThaiHopDong.CHO_KY
                && trangThaiHienTai != TrangThaiHopDong.DA_COC
                && trangThaiHienTai != TrangThaiHopDong.HIEU_LUC) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_CHUYEN_TRANG_THAI);
        }
        hopDongRepository.updateTrangThai(hopDongId, TrangThaiHopDong.DA_THANH_LY);
        trangThaiPhongService.dongBoTheoPhongId(hopDongView.hopDong().phongId());
        return chiTiet(hopDongId, nguoiDung);
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
        phanQuyenToaService.layToaNhaNeuNguoiDungDuocXem(nguoiDung, hopDongView.toaNhaId());
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
                || yeuCau.soNgayBaoTruoc() == null
                || yeuCau.dichVuApDung() == null) {
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
        phanQuyenToaService.layToaNhaNeuNguoiDungDuocXem(nguoiDung, phong.toaNhaId());
        NguoiThue nguoiThue = nguoiThueRepository.findById(yeuCau.nguoiThueId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        BigDecimal giaThue = chuanHoaSoKhongAm(yeuCau.giaThue());
        BigDecimal tienCoc = chuanHoaSoKhongAm(yeuCau.tienCoc());
        List<HopDongDichVuDaChuanHoa> dichVuApDung = chuanHoaDichVuApDung(phong, yeuCau.dichVuApDung());

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

            BigDecimal donGiaApDung = item.donGiaApDung() != null
                    ? chuanHoaSoKhongAm(item.donGiaApDung())
                    : layDonGiaMacDinh(dichVu.id());
            ketQua.add(new HopDongDichVuDaChuanHoa(dichVu.id(), dichVu.ten(), donGiaApDung));
        }

        return List.copyOf(ketQua);
    }

    private BigDecimal layDonGiaMacDinh(Long dichVuId) {
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
        if (nguoiDung == null || (nguoiDung.vaiTro() != VaiTro.QTHT
                && nguoiDung.vaiTro() != VaiTro.CHU
                && nguoiDung.vaiTro() != VaiTro.QUAN_LY)) {
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
