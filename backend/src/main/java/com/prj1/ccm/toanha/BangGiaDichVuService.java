package com.prj1.ccm.toanha;

import com.prj1.ccm.nguoidung.NguoiDung;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

@Service
public class BangGiaDichVuService {
    private static final String THONG_BAO_YEU_CAU_BANG_GIA_KHONG_HOP_LE = "Yêu cầu bảng giá không hợp lệ.";
    private static final String THONG_BAO_KHONG_TIM_THAY_GIA_HIEU_LUC = "Không tìm thấy giá hiệu lực cho ngày yêu cầu.";

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

    private boolean bangGiaCoDangApDungHomNay(BangGia bangGia) {
        return bangGiaRepository.findApplicableByDichVuIdAndNgay(bangGia.dichVuId(), ngayApDungHomNay())
                .map(BangGia::id)
                .filter(bangGia.id()::equals)
                .isPresent();
    }

    private LocalDate ngayApDungHomNay() {
        return LocalDate.now(clock);
    }
}
