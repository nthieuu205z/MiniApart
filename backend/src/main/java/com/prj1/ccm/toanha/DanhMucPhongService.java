package com.prj1.ccm.toanha;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class DanhMucPhongService {
    private static final String THONG_BAO_YEU_CAU_KHONG_HOP_LE = "Yêu cầu phòng không hợp lệ.";
    private static final String THONG_BAO_SUC_CHUA = "Sức chứa phải lớn hơn 0.";
    private static final String THONG_BAO_TRUNG_SO_PHONG = "Số phòng đã tồn tại trong toà nhà này.";
    private static final String THONG_BAO_DAI_SO_PHONG = "Dải số phòng không hợp lệ.";
    private static final String THONG_BAO_QUA_NHIEU_PHONG = "Mỗi lần chỉ được tạo tối đa 1.000 phòng.";
    private static final long SO_PHONG_TOI_DA_MOI_LO = 1_000L;

    private final PhanQuyenToaService phanQuyenToaService;
    private final PhongRepository phongRepository;
    private final TrangThaiPhongService trangThaiPhongService;

    public DanhMucPhongService(
            PhanQuyenToaService phanQuyenToaService,
            PhongRepository phongRepository,
            TrangThaiPhongService trangThaiPhongService
    ) {
        this.phanQuyenToaService = phanQuyenToaService;
        this.phongRepository = phongRepository;
        this.trangThaiPhongService = trangThaiPhongService;
    }

    public List<ThongTinPhong> danhSachPhong(Long toaNhaId, Integer tang, NguoiDung nguoiDung) {
        kiemTraQuyenPhong(nguoiDung, toaNhaId);
        return phongRepository.findByToaNhaId(toaNhaId, tang)
                .stream()
                .map(ThongTinPhong::tuPhong)
                .toList();
    }

    @Transactional
    public ThongTinPhong taoPhong(Long toaNhaId, YeuCauPhong yeuCau, NguoiDung nguoiDung) {
        kiemTraQuyenPhong(nguoiDung, toaNhaId);
        Phong phong = chuanHoaPhongDon(toaNhaId, yeuCau);

        if (phongRepository.existsByToaNhaIdAndSoPhong(toaNhaId, phong.soPhong())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_TRUNG_SO_PHONG);
        }

        return luuPhong(phong);
    }

    public KetQuaPhongHangLoat xemTruocPhongHangLoat(Long toaNhaId, YeuCauPhongHangLoat yeuCau, NguoiDung nguoiDung) {
        kiemTraQuyenPhong(nguoiDung, toaNhaId);
        return new KetQuaPhongHangLoat(
                taoDayPhong(toaNhaId, yeuCau)
                        .stream()
                        .map(ThongTinPhong::tuPhong)
                        .toList()
        );
    }

    @Transactional
    public KetQuaPhongHangLoat taoPhongHangLoat(Long toaNhaId, YeuCauPhongHangLoat yeuCau, NguoiDung nguoiDung) {
        kiemTraQuyenPhong(nguoiDung, toaNhaId);
        List<Phong> phongXemTruoc = taoDayPhong(toaNhaId, yeuCau);
        List<ThongTinPhong> phongDaTao = new ArrayList<>();

        for (Phong phong : phongXemTruoc) {
            phongDaTao.add(luuPhong(phong));
        }

        return new KetQuaPhongHangLoat(phongDaTao);
    }

    @Transactional
    public void tinhLaiTrangThaiPhong(Long toaNhaId, LocalDate ngay, NguoiDung nguoiDung) {
        kiemTraQuyenPhong(nguoiDung, toaNhaId);
        trangThaiPhongService.dongBoTheoToaNhaId(toaNhaId, ngay);
    }

    private void kiemTraQuyenPhong(NguoiDung nguoiDung, Long toaNhaId) {
        if (nguoiDung == null || (nguoiDung.vaiTro() != VaiTro.QTHT
                && nguoiDung.vaiTro() != VaiTro.CHU
                && nguoiDung.vaiTro() != VaiTro.QUAN_LY)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        phanQuyenToaService.layToaNhaNeuNguoiDungDuocXem(nguoiDung, toaNhaId);
    }

    private Phong chuanHoaPhongDon(Long toaNhaId, YeuCauPhong yeuCau) {
        if (yeuCau == null
                || yeuCau.soPhong() == null || yeuCau.soPhong().isBlank()
                || yeuCau.tang() == null || yeuCau.tang() <= 0
                || yeuCau.dienTich() == null
                || yeuCau.sucChua() == null
                || yeuCau.giaThueMacDinh() == null
                || yeuCau.loaiPhong() == null || yeuCau.loaiPhong().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE);
        }

        if (yeuCau.sucChua() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_SUC_CHUA);
        }

        BigDecimal dienTich = chuanHoaSoDuong(yeuCau.dienTich());
        BigDecimal giaThueMacDinh = chuanHoaSoKhongAm(yeuCau.giaThueMacDinh());

        return new Phong(
                null,
                toaNhaId,
                yeuCau.soPhong().trim(),
                yeuCau.tang(),
                dienTich,
                yeuCau.sucChua(),
                giaThueMacDinh,
                yeuCau.loaiPhong().trim(),
                TrangThaiPhong.TRONG
        );
    }

    private List<Phong> taoDayPhong(Long toaNhaId, YeuCauPhongHangLoat yeuCau) {
        if (yeuCau == null
                || yeuCau.soBatDau() == null || yeuCau.soBatDau().isBlank()
                || yeuCau.soKetThuc() == null || yeuCau.soKetThuc().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_DAI_SO_PHONG);
        }

        YeuCauPhong yeuCauPhong = new YeuCauPhong(
                yeuCau.soBatDau(),
                yeuCau.tang(),
                yeuCau.dienTich(),
                yeuCau.sucChua(),
                yeuCau.giaThueMacDinh(),
                yeuCau.loaiPhong()
        );
        Phong mau = chuanHoaPhongDon(toaNhaId, yeuCauPhong);

        List<String> danhSachSoPhong = phatSinhDaySoPhong(yeuCau.soBatDau().trim(), yeuCau.soKetThuc().trim());
        List<String> soPhongTrung = phongRepository.findExistingRoomNumbers(toaNhaId, danhSachSoPhong);
        if (!soPhongTrung.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Số phòng đã tồn tại trong toà nhà này: " + String.join(", ", soPhongTrung)
            );
        }

        return danhSachSoPhong.stream()
                .map(soPhong -> new Phong(
                        null,
                        toaNhaId,
                        soPhong,
                        mau.tang(),
                        mau.dienTich(),
                        mau.sucChua(),
                        mau.giaThueMacDinh(),
                        mau.loaiPhong(),
                        TrangThaiPhong.TRONG
                ))
                .toList();
    }

    private List<String> phatSinhDaySoPhong(String soBatDau, String soKetThuc) {
        if (!soBatDau.chars().allMatch(Character::isDigit) || !soKetThuc.chars().allMatch(Character::isDigit)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_DAI_SO_PHONG);
        }

        long batDau;
        long ketThuc;
        try {
            batDau = Long.parseLong(soBatDau);
            ketThuc = Long.parseLong(soKetThuc);
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_DAI_SO_PHONG, exception);
        }
        if (batDau > ketThuc) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_DAI_SO_PHONG);
        }

        long khoangCach = ketThuc - batDau;
        if (khoangCach >= SO_PHONG_TOI_DA_MOI_LO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_QUA_NHIEU_PHONG);
        }

        int doRong = Math.max(soBatDau.length(), soKetThuc.length());
        int soLuongPhong = Math.toIntExact(khoangCach + 1L);
        List<String> ketQua = new ArrayList<>(soLuongPhong);
        for (long viTri = 0L; viTri < soLuongPhong; viTri += 1L) {
            long so = batDau + viTri;
            ketQua.add(String.format("%0" + doRong + "d", so));
        }
        return List.copyOf(ketQua);
    }

    private BigDecimal chuanHoaSoDuong(BigDecimal giaTri) {
        BigDecimal daChuanHoa = chuanHoaHaiChuSo(giaTri);
        if (daChuanHoa.signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE);
        }
        return daChuanHoa;
    }

    private BigDecimal chuanHoaSoKhongAm(BigDecimal giaTri) {
        BigDecimal daChuanHoa = chuanHoaHaiChuSo(giaTri);
        if (daChuanHoa.signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE);
        }
        return daChuanHoa;
    }

    private BigDecimal chuanHoaHaiChuSo(BigDecimal giaTri) {
        try {
            return giaTri.setScale(2, RoundingMode.UNNECESSARY);
        } catch (ArithmeticException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE, exception);
        }
    }

    private ThongTinPhong luuPhong(Phong phong) {
        try {
            Long phongId = phongRepository.insert(phong);
            return ThongTinPhong.tuPhong(
                    phongRepository.findById(phongId)
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND))
            );
        } catch (DuplicateKeyException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_TRUNG_SO_PHONG, exception);
        }
    }
}
