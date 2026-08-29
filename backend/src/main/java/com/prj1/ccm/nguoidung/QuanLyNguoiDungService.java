package com.prj1.ccm.nguoidung;

import com.prj1.ccm.auth.KichHoatTaiKhoanService;
import com.prj1.ccm.auth.PasswordHasher;
import com.prj1.ccm.auth.NguoiDungRepository;
import com.prj1.ccm.auth.SoDienThoaiKey;
import com.prj1.ccm.toanha.ToaNhaRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashSet;
import java.util.Arrays;
import java.util.List;

@Service
public class QuanLyNguoiDungService {
    private static final String THONG_BAO_NGUOI_THUE_BAT_BUOC = "Tài khoản người thuê phải gắn với hồ sơ người thuê";
    private static final String THONG_BAO_NGUOI_THUE_DA_GAN = "Hồ sơ người thuê đã được gắn với tài khoản khác";

    private final NguoiDungRepository nguoiDungRepository;
    private final ToaNhaRepository toaNhaRepository;
    private final PasswordHasher passwordHasher;
    private final KichHoatTaiKhoanService kichHoatTaiKhoanService;

    public QuanLyNguoiDungService(
            NguoiDungRepository nguoiDungRepository,
            ToaNhaRepository toaNhaRepository,
            PasswordHasher passwordHasher,
            KichHoatTaiKhoanService kichHoatTaiKhoanService
    ) {
        this.nguoiDungRepository = nguoiDungRepository;
        this.toaNhaRepository = toaNhaRepository;
        this.passwordHasher = passwordHasher;
        this.kichHoatTaiKhoanService = kichHoatTaiKhoanService;
    }

    @Transactional(readOnly = true)
    public List<ThongTinQuanLyNguoiDung> danhSach(NguoiDung nguoiDung) {
        kiemTraQuanTriHeThong(nguoiDung);
        return nguoiDungRepository.findAll().stream()
                .map(this::toThongTinQuanLyNguoiDung)
                .toList();
    }

    @Transactional(readOnly = true)
    public ThongTinQuanLyNguoiDung chiTiet(Long nguoiDungId, NguoiDung nguoiDung) {
        kiemTraQuanTriHeThong(nguoiDung);
        return toThongTinQuanLyNguoiDung(layNguoiDung(nguoiDungId));
    }

    @Transactional(readOnly = true)
    public List<ThongTinVaiTro> danhSachVaiTro(NguoiDung nguoiDung) {
        kiemTraQuanTriHeThong(nguoiDung);
        return Arrays.stream(VaiTro.values())
                .map(ThongTinVaiTro::tuVaiTro)
                .toList();
    }

    @Transactional
    public ThongTinQuanLyNguoiDung tao(YeuCauQuanLyNguoiDung yeuCau, NguoiDung nguoiDung) {
        kiemTraQuanTriHeThong(nguoiDung);
        xacThucYeuCau(yeuCau);
        String soDienThoai = SoDienThoaiKey.tu(yeuCau.soDienThoai());
        if (nguoiDungRepository.findBySoDienThoai(soDienThoai).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Số điện thoại đã được sử dụng");
        }

        List<Long> toaNhaIds = chuanHoaToaNhaIds(yeuCau.toaNhaIds());
        Long nguoiThueId = chuanHoaNguoiThueId(yeuCau, null);
        NguoiDung moi = new NguoiDung(
                null,
                yeuCau.hoTen(),
                soDienThoai,
                passwordHasher.hash(maNgauNhienDeVoHieuHoaMatKhauBanDau()),
                yeuCau.vaiTro(),
                TrangThaiNguoiDung.HOAT_DONG,
                0,
                nguoiThueId
        );
        Long nguoiDungId;
        try {
            nguoiDungId = nguoiDungRepository.insert(moi);
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_NGUOI_THUE_DA_GAN, exception);
        }
        nguoiDungRepository.capNhatQuyenToa(nguoiDungId, toaNhaIds);
        NguoiDung nguoiDungMoi = layNguoiDung(nguoiDungId);
        kichHoatTaiKhoanService.taoMaKichHoat(nguoiDungMoi);
        return toThongTinQuanLyNguoiDung(nguoiDungMoi);
    }

    @Transactional
    public ThongTinQuanLyNguoiDung capNhat(Long nguoiDungId, YeuCauQuanLyNguoiDung yeuCau, NguoiDung nguoiDung) {
        kiemTraQuanTriHeThong(nguoiDung);
        xacThucYeuCau(yeuCau);
        NguoiDung hienTai = layNguoiDung(nguoiDungId);
        String soDienThoai = SoDienThoaiKey.tu(yeuCau.soDienThoai());

        if (!hienTai.soDienThoai().equals(soDienThoai)
                && nguoiDungRepository.existsBySoDienThoaiExceptId(soDienThoai, nguoiDungId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Số điện thoại đã được sử dụng");
        }

        List<Long> toaNhaIds = chuanHoaToaNhaIds(yeuCau.toaNhaIds());
        Long nguoiThueId = chuanHoaNguoiThueId(yeuCau, nguoiDungId);
        if (!hienTai.soDienThoai().equals(soDienThoai)) {
            nguoiDungRepository.capNhatSoDienThoaiDangNhap(
                    SoDienThoaiKey.tu(hienTai.soDienThoai()),
                    soDienThoai
            );
        }
        try {
            nguoiDungRepository.capNhatThongTinNguoiDung(nguoiDungId, yeuCau.hoTen(), soDienThoai, yeuCau.vaiTro(), nguoiThueId);
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_NGUOI_THUE_DA_GAN, exception);
        }
        nguoiDungRepository.capNhatQuyenToa(nguoiDungId, toaNhaIds);
        return toThongTinQuanLyNguoiDung(layNguoiDung(nguoiDungId));
    }

    @Transactional
    public ThongTinQuanLyNguoiDung khoa(Long nguoiDungId, NguoiDung nguoiDung) {
        kiemTraQuanTriHeThong(nguoiDung);
        layNguoiDung(nguoiDungId);
        nguoiDungRepository.khoaNguoiDung(nguoiDungId);
        return toThongTinQuanLyNguoiDung(layNguoiDung(nguoiDungId));
    }

    private void kiemTraQuanTriHeThong(NguoiDung nguoiDung) {
        if (nguoiDung == null || nguoiDung.vaiTro() != VaiTro.QTHT) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private void xacThucYeuCau(YeuCauQuanLyNguoiDung yeuCau) {
        if (yeuCau == null
                || yeuCau.hoTen() == null || yeuCau.hoTen().isBlank()
                || yeuCau.soDienThoai() == null || yeuCau.soDienThoai().isBlank()
                || yeuCau.vaiTro() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Yêu cầu không hợp lệ");
        }
    }

    private NguoiDung layNguoiDung(Long nguoiDungId) {
        return nguoiDungRepository.findById(nguoiDungId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private List<Long> chuanHoaToaNhaIds(List<Long> toaNhaIds) {
        if (toaNhaIds == null || toaNhaIds.isEmpty()) {
            return List.of();
        }

        LinkedHashSet<Long> uniqueIds = new LinkedHashSet<>();
        for (Long toaNhaId : toaNhaIds) {
            if (toaNhaId == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Yêu cầu không hợp lệ");
            }
            if (toaNhaRepository.findById(toaNhaId).isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND);
            }
            uniqueIds.add(toaNhaId);
        }
        return List.copyOf(uniqueIds);
    }

    private Long chuanHoaNguoiThueId(YeuCauQuanLyNguoiDung yeuCau, Long nguoiDungId) {
        if (yeuCau.vaiTro() != VaiTro.NGUOI_THUE) {
            return null;
        }
        if (yeuCau.nguoiThueId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_NGUOI_THUE_BAT_BUOC);
        }
        if (!nguoiDungRepository.existsNguoiThueById(yeuCau.nguoiThueId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        if (nguoiDungRepository.existsNguoiDungByNguoiThueIdExceptId(yeuCau.nguoiThueId(), nguoiDungId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_NGUOI_THUE_DA_GAN);
        }
        return yeuCau.nguoiThueId();
    }

    private ThongTinQuanLyNguoiDung toThongTinQuanLyNguoiDung(NguoiDung nguoiDung) {
        return ThongTinQuanLyNguoiDung.tuNguoiDung(
                nguoiDung,
                nguoiDungRepository.findPhanQuyenToaIds(nguoiDung.id())
        );
    }

    private String maNgauNhienDeVoHieuHoaMatKhauBanDau() {
        return java.util.UUID.randomUUID().toString();
    }
}
