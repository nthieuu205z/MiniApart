package com.prj1.ccm.publicportal;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import com.prj1.ccm.toanha.TrangThaiPhongService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Clock;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

@Service
public class PublicPortalService {
    private final PublicPortalRepository publicPortalRepository;
    private final PhanQuyenToaService phanQuyenToaService;
    private final TrangThaiPhongService trangThaiPhongService;
    private final Clock clock;

    public PublicPortalService(PublicPortalRepository publicPortalRepository, PhanQuyenToaService phanQuyenToaService, TrangThaiPhongService trangThaiPhongService, Clock clock) {
        this.publicPortalRepository = publicPortalRepository;
        this.phanQuyenToaService = phanQuyenToaService;
        this.trangThaiPhongService = trangThaiPhongService;
        this.clock = clock;
    }

    @Transactional
    public List<PublicToaNhaDto> layDanhSachToaNha() {
        dongBoPhong(null);
        return publicPortalRepository.layDanhSachToaNha();
    }

    @Transactional
    public List<PublicPhongDto> layDanhSachPhong(
            Long toaNhaId,
            BigDecimal giaTu,
            BigDecimal giaDen,
            String loaiPhong,
            String tuKhoa,
            Boolean chiPhongTrong
    ) {
        dongBoPhong(toaNhaId);
        return publicPortalRepository.layDanhSachPhong(toaNhaId, giaTu, giaDen, loaiPhong, tuKhoa, chiPhongTrong);
    }

    @Transactional
    public Optional<PublicPhongDto> layChiTietPhong(Long phongId) {
        publicPortalRepository.timToaNhaCuaPhong(phongId).ifPresent(this::dongBoPhong);
        return publicPortalRepository.layChiTietPhong(phongId);
    }

    @Transactional
    public Long datLichHen(YeuCauDatLichHen yeuCau) {
        if (yeuCau == null) throw new IllegalArgumentException("Yêu cầu đặt lịch hẹn không được rỗng");
        if (yeuCau.hoTen() == null || yeuCau.hoTen().trim().length() < 2) {
            throw new IllegalArgumentException("Họ tên phải có ít nhất 2 ký tự");
        }
        if (yeuCau.soDienThoai() == null || !yeuCau.soDienThoai().matches("^[0-9+]{9,15}$")) {
            throw new IllegalArgumentException("Số điện thoại không hợp lệ");
        }
        Long toaNhaId = yeuCau.toaNhaId();
        if (toaNhaId == null && yeuCau.phongId() != null) {
            toaNhaId = publicPortalRepository.layChiTietPhong(yeuCau.phongId())
                    .map(PublicPhongDto::toaNhaId)
                    .orElse(null);
        }
        if (toaNhaId == null || !publicPortalRepository.toaNhaTonTai(toaNhaId)) {
            throw new IllegalArgumentException("Toà nhà không hợp lệ");
        }
        if (yeuCau.phongId() != null && !publicPortalRepository.phongThuocToa(yeuCau.phongId(), toaNhaId)) {
            throw new IllegalArgumentException("Phòng không thuộc toà nhà đã chọn");
        }
        if (yeuCau.hoTen().trim().length() > 255 || yeuCau.email() != null && yeuCau.email().length() > 255
                || yeuCau.ghiChu() != null && yeuCau.ghiChu().length() > 4000) {
            throw new IllegalArgumentException("Thông tin lịch hẹn vượt quá độ dài cho phép");
        }

        YeuCauDatLichHen yeuCauHopLe = yeuCau.toaNhaId() != null
                ? yeuCau
                : new YeuCauDatLichHen(
                        yeuCau.hoTen(),
                        yeuCau.soDienThoai(),
                        yeuCau.email(),
                        yeuCau.phongId(),
                        toaNhaId,
                        yeuCau.thoiGianHen(),
                        yeuCau.ghiChu()
                );

        if (yeuCauHopLe.thoiGianHen() == null || yeuCauHopLe.thoiGianHen().isBefore(LocalDateTime.now(clock.withZone(ZoneId.of("Asia/Ho_Chi_Minh"))).minusMinutes(5))) {
            throw new IllegalArgumentException("Thời gian hẹn phải ở hiện tại hoặc tương lai");
        }

        return publicPortalRepository.luuLichHen(yeuCauHopLe);
    }

    public List<LichHenXemPhongDto> layDanhSachLichHen(Long toaNhaId, NguoiDung nguoiDung) {
        kiemTraVaiTro(nguoiDung);
        if (toaNhaId != null) phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, toaNhaId);
        return publicPortalRepository.layDanhSachLichHen(toaNhaId, nguoiDung.id());
    }

    @Transactional
    public boolean capNhatTrangThaiLichHen(Long id, String trangThaiMoi, NguoiDung nguoiDung) {
        kiemTraVaiTro(nguoiDung);
        Long toaNhaId = publicPortalRepository.timToaNhaCuaLichHen(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, toaNhaId);
        if (trangThaiMoi == null || !List.of("CHO_XAC_NHAN", "DA_XAC_NHAN", "DA_XEM", "HUY").contains(trangThaiMoi)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái lịch hẹn không hợp lệ");
        }
        return publicPortalRepository.capNhatTrangThaiLichHen(id, trangThaiMoi, nguoiDung.id());
    }

    private void kiemTraVaiTro(NguoiDung nguoiDung) {
        if (nguoiDung == null || (nguoiDung.vaiTro() != VaiTro.CHU && nguoiDung.vaiTro() != VaiTro.QUAN_LY)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private void dongBoPhong(Long toaNhaId) {
        if (toaNhaId != null) {
            trangThaiPhongService.dongBoTheoToaNhaId(toaNhaId, null);
        } else {
            for (PublicToaNhaDto toa : publicPortalRepository.layDanhSachToaNha()) {
                trangThaiPhongService.dongBoTheoToaNhaId(toa.id(), null);
            }
        }
    }
}
