package com.prj1.ccm.toanha;

import com.prj1.ccm.nguoidung.NguoiDung;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

@Service
public class BangGiaDichVuService {
    private static final String THONG_BAO_YEU_CAU_BANG_GIA_KHONG_HOP_LE = "Yêu cầu bảng giá không hợp lệ.";
    private static final String THONG_BAO_KHONG_TIM_THAY_GIA_HIEU_LUC = "Không tìm thấy giá hiệu lực cho ngày yêu cầu.";
    private static final String THONG_BAO_DICH_VU_BAC_THANG_KHONG_HOP_LE =
            "Biểu giá bậc thang chỉ áp dụng cho dịch vụ điện tính theo chỉ số.";
    private static final String THONG_BAO_CAC_BAC_PHAI_LIEN_NHAU =
            "Các bậc phải liền nhau, không hở và không chồng lấn.";
    private static final String THONG_BAO_BAC_CUOI_PHAI_VO_CUC =
            "Chỉ bậc cuối cùng mới được bỏ trống đến số lượng và phải có đúng một bậc cuối vô cực.";
    private static final String THONG_BAO_BAC_DAU_TIEN_PHAI_BAT_DAU_TU_0 =
            "Bậc đầu tiên phải bắt đầu từ 0.";

    private final DanhMucDichVuService danhMucDichVuService;
    private final BangGiaRepository bangGiaRepository;
    private final Clock clock;

    public BangGiaDichVuService(
            DanhMucDichVuService danhMucDichVuService,
            BangGiaRepository bangGiaRepository,
            Clock clock
    ) {
        this.danhMucDichVuService = danhMucDichVuService;
        this.bangGiaRepository = bangGiaRepository;
        this.clock = clock;
    }

    public List<ThongTinBangGia> danhSachBangGia(Long dichVuId, NguoiDung nguoiDung) {
        DichVu dichVu = danhMucDichVuService.layDichVuNguoiDungDuocQuanLy(dichVuId, nguoiDung);
        BangGia bangGiaHienTai = bangGiaRepository.findApplicableByDichVuIdAndNgay(dichVu.id(), LocalDate.now(clock))
                .orElse(null);

        return bangGiaRepository.findByDichVuId(dichVu.id())
                .stream()
                .map(bangGia -> ThongTinBangGia.tuBangGia(
                        bangGia,
                        bangGiaHienTai != null && bangGia.id().equals(bangGiaHienTai.id())
                ))
                .toList();
    }

    @Transactional
    public ThongTinBangGia themBangGia(Long dichVuId, YeuCauBangGia yeuCau, NguoiDung nguoiDung) {
        DichVu dichVu = danhMucDichVuService.layDichVuNguoiDungDuocQuanLy(dichVuId, nguoiDung);
        BangGia bangGiaMoi = chuanHoa(dichVu.id(), yeuCau);
        Long bangGiaId = bangGiaRepository.insert(bangGiaMoi);
        BangGia bangGiaDaLuu = bangGiaRepository.findById(bangGiaId);
        return ThongTinBangGia.tuBangGia(
                bangGiaDaLuu,
                bangGiaCoDangApDungHomNay(bangGiaDaLuu)
        );
    }

    public ThongTinBangGia layBangGiaTheoNgay(Long dichVuId, LocalDate ngay, NguoiDung nguoiDung) {
        DichVu dichVu = danhMucDichVuService.layDichVuNguoiDungDuocQuanLy(dichVuId, nguoiDung);
        BangGia bangGia = bangGiaRepository.findApplicableByDichVuIdAndNgay(dichVu.id(), ngay)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, THONG_BAO_KHONG_TIM_THAY_GIA_HIEU_LUC));
        return ThongTinBangGia.tuBangGia(bangGia, bangGiaCoDangApDungHomNay(bangGia));
    }

    public List<ThongTinBangGiaBacThang> danhSachBangGiaBacThang(Long dichVuId, NguoiDung nguoiDung) {
        DichVu dichVu = layDichVuDienTheoChiSo(dichVuId, nguoiDung);
        LocalDate ngayHieuLucHienTai = bangGiaRepository
                .findApplicableNgayHieuLucBacThangByDichVuIdAndNgay(dichVu.id(), ngayApDungHomNay())
                .orElse(null);
        return bangGiaRepository.findNgayHieuLucBacThangByDichVuId(dichVu.id())
                .stream()
                .map(ngayHieuLuc -> taoThongTinBangGiaBacThang(
                        dichVu.id(),
                        ngayHieuLuc,
                        ngayHieuLuc.equals(ngayHieuLucHienTai)
                ))
                .toList();
    }

    public ThongTinBangGiaBacThang layBangGiaBacThangTheoNgay(Long dichVuId, LocalDate ngay, NguoiDung nguoiDung) {
        DichVu dichVu = layDichVuDienTheoChiSo(dichVuId, nguoiDung);
        LocalDate ngayHieuLuc = bangGiaRepository.findApplicableNgayHieuLucBacThangByDichVuIdAndNgay(dichVu.id(), ngay)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, THONG_BAO_KHONG_TIM_THAY_GIA_HIEU_LUC));
        return taoThongTinBangGiaBacThang(
                dichVu.id(),
                ngayHieuLuc,
                bangGiaBacThangCoDangApDungHomNay(dichVu.id(), ngayHieuLuc)
        );
    }

    @Transactional
    public ThongTinBangGiaBacThang themBangGiaBacThang(Long dichVuId, YeuCauBangGiaBacThang yeuCau, NguoiDung nguoiDung) {
        DichVu dichVu = layDichVuDienTheoChiSo(dichVuId, nguoiDung);
        List<BangGiaBacThang> cacBac = chuanHoaBangGiaBacThang(dichVu.id(), yeuCau);
        bangGiaRepository.insertBacThang(cacBac);
        return taoThongTinBangGiaBacThang(
                dichVu.id(),
                yeuCau.ngayHieuLuc(),
                bangGiaBacThangCoDangApDungHomNay(dichVu.id(), yeuCau.ngayHieuLuc())
        );
    }

    private BangGia chuanHoa(Long dichVuId, YeuCauBangGia yeuCau) {
        if (yeuCau == null
                || yeuCau.donGia() == null
                || yeuCau.ngayHieuLuc() == null
                || yeuCau.donGia().signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_BANG_GIA_KHONG_HOP_LE);
        }

        return new BangGia(
                null,
                dichVuId,
                yeuCau.donGia(),
                yeuCau.ngayHieuLuc()
        );
    }

    private List<BangGiaBacThang> chuanHoaBangGiaBacThang(Long dichVuId, YeuCauBangGiaBacThang yeuCau) {
        if (yeuCau == null
                || yeuCau.giaBanLeBinhQuan() == null
                || yeuCau.giaBanLeBinhQuan().signum() <= 0
                || yeuCau.ngayHieuLuc() == null
                || yeuCau.cacBac() == null
                || yeuCau.cacBac().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_BANG_GIA_KHONG_HOP_LE);
        }

        List<YeuCauBacGia> cacBac = yeuCau.cacBac().stream()
                .sorted((bacA, bacB) -> Integer.compare(bacA.bac(), bacB.bac()))
                .toList();
        kiemTraCacBacHopLe(cacBac);

        return cacBac.stream()
                .map(bac -> new BangGiaBacThang(
                        null,
                        dichVuId,
                        bac.bac(),
                        bac.tuSoLuong().setScale(2, RoundingMode.UNNECESSARY),
                        bac.denSoLuong() == null ? null : bac.denSoLuong().setScale(2, RoundingMode.UNNECESSARY),
                        bac.tyLe().setScale(2, RoundingMode.UNNECESSARY),
                        tinhDonGiaTheoTyLe(yeuCau.giaBanLeBinhQuan(), bac.tyLe()),
                        yeuCau.ngayHieuLuc()
                ))
                .toList();
    }

    private void kiemTraCacBacHopLe(List<YeuCauBacGia> cacBac) {
        int soBacVoCuc = 0;
        BigDecimal diemBatDauKyVong = BigDecimal.ZERO.setScale(2, RoundingMode.UNNECESSARY);

        for (int index = 0; index < cacBac.size(); index++) {
            YeuCauBacGia bac = cacBac.get(index);
            if (bac == null
                    || bac.bac() == null
                    || bac.tuSoLuong() == null
                    || bac.tyLe() == null
                    || bac.tyLe().signum() <= 0
                    || bac.tuSoLuong().signum() < 0
                    || bac.bac() != index + 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_BANG_GIA_KHONG_HOP_LE);
            }

            BigDecimal tuSoLuong = bac.tuSoLuong().setScale(2, RoundingMode.UNNECESSARY);
            if (index == 0 && tuSoLuong.compareTo(BigDecimal.ZERO.setScale(2, RoundingMode.UNNECESSARY)) != 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_BAC_DAU_TIEN_PHAI_BAT_DAU_TU_0);
            }
            if (tuSoLuong.compareTo(diemBatDauKyVong) != 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_CAC_BAC_PHAI_LIEN_NHAU);
            }

            if (bac.denSoLuong() == null) {
                soBacVoCuc++;
                if (index != cacBac.size() - 1) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_BAC_CUOI_PHAI_VO_CUC);
                }
                continue;
            }

            BigDecimal denSoLuong = bac.denSoLuong().setScale(2, RoundingMode.UNNECESSARY);
            if (denSoLuong.compareTo(tuSoLuong) <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_BANG_GIA_KHONG_HOP_LE);
            }
            diemBatDauKyVong = denSoLuong.add(BigDecimal.ONE).setScale(2, RoundingMode.UNNECESSARY);
        }

        if (soBacVoCuc != 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_BAC_CUOI_PHAI_VO_CUC);
        }
    }

    private BigDecimal tinhDonGiaTheoTyLe(BigDecimal giaBanLeBinhQuan, BigDecimal tyLe) {
        return giaBanLeBinhQuan
                .multiply(tyLe)
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP)
                .setScale(2, RoundingMode.UNNECESSARY);
    }

    private boolean bangGiaCoDangApDungHomNay(BangGia bangGia) {
        return bangGiaRepository.findApplicableByDichVuIdAndNgay(bangGia.dichVuId(), ngayApDungHomNay())
                .map(BangGia::id)
                .filter(bangGia.id()::equals)
                .isPresent();
    }

    private boolean bangGiaBacThangCoDangApDungHomNay(Long dichVuId, LocalDate ngayHieuLuc) {
        return bangGiaRepository.findApplicableNgayHieuLucBacThangByDichVuIdAndNgay(dichVuId, ngayApDungHomNay())
                .filter(ngayHieuLuc::equals)
                .isPresent();
    }

    private ThongTinBangGiaBacThang taoThongTinBangGiaBacThang(Long dichVuId, LocalDate ngayHieuLuc, boolean dangApDung) {
        return ThongTinBangGiaBacThang.tuDanhSachBangGia(
                ngayHieuLuc,
                dangApDung,
                bangGiaRepository.findBacThangByDichVuIdAndNgayHieuLuc(dichVuId, ngayHieuLuc)
        );
    }

    private DichVu layDichVuDienTheoChiSo(Long dichVuId, NguoiDung nguoiDung) {
        DichVu dichVu = danhMucDichVuService.layDichVuNguoiDungDuocQuanLy(dichVuId, nguoiDung);
        if (!dichVu.laDien() || dichVu.cachTinh() != CachTinh.THEO_CHI_SO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_DICH_VU_BAC_THANG_KHONG_HOP_LE);
        }
        return dichVu;
    }

    private LocalDate ngayApDungHomNay() {
        return LocalDate.now(clock);
    }
}
