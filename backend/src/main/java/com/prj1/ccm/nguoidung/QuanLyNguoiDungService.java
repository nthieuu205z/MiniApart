package com.prj1.ccm.nguoidung;

import com.prj1.ccm.auth.KichHoatTaiKhoanService;
import com.prj1.ccm.auth.PasswordHasher;
import com.prj1.ccm.auth.NguoiDungRepository;
import com.prj1.ccm.auth.SoDienThoaiKey;
import com.prj1.ccm.toanha.ToaNhaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashSet;
import java.util.Arrays;
import java.util.List;

@Service
public class QuanLyNguoiDungService {
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
        NguoiDung moi = new NguoiDung(
                null,
                yeuCau.hoTen(),
                soDienThoai,
                passwordHasher.hash(maNgauNhienDeVoHieuHoaMatKhauBanDau()),
                yeuCau.vaiTro(),
                TrangThaiNguoiDung.HOAT_DONG,
                0
        );
        Long nguoiDungId = nguoiDungRepository.insert(moi);
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
        if (!hienTai.soDienThoai().equals(soDienThoai)) {
            nguoiDungRepository.capNhatSoDienThoaiDangNhap(
                    SoDienThoaiKey.tu(hienTai.soDienThoai()),
                    soDienThoai
            );
        }
        nguoiDungRepository.capNhatThongTinNguoiDung(nguoiDungId, yeuCau.hoTen(), soDienThoai, yeuCau.vaiTro());
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
