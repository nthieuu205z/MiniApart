package com.prj1.ccm.taisan;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TaiSanService {
    private final TaiSanRepository taiSanRepository;
    private final PhanQuyenToaService phanQuyenToaService;

    public TaiSanService(TaiSanRepository taiSanRepository, PhanQuyenToaService phanQuyenToaService) {
        this.taiSanRepository = taiSanRepository;
        this.phanQuyenToaService = phanQuyenToaService;
    }

    public List<TaiSanPhongDto> layDanhSachTaiSan(Long phongId, NguoiDung nguoiDung) {
        kiemTraDangNhap(nguoiDung);
        Objects.requireNonNull(phongId, "Mã phòng không được để trống");

        Long toaNhaId = taiSanRepository.layToaNhaIdTheoPhong(phongId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy phòng #" + phongId));

        if (nguoiDung.vaiTro() == VaiTro.CHU || nguoiDung.vaiTro() == VaiTro.QUAN_LY) {
            phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, toaNhaId);
        } else if (nguoiDung.vaiTro() == VaiTro.NGUOI_THUE) {
            if (nguoiDung.nguoiThueId() == null || !taiSanRepository.kiemTraNguoiThueDangThuePhong(nguoiDung.nguoiThueId(), phongId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền xem tài sản của phòng này");
            }
        } else {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        return taiSanRepository.layDanhSachTaiSan(phongId);
    }

    @Transactional
    public Long themTaiSan(Long phongId, YeuCauKhaiBaoTaiSan yeuCau, NguoiDung nguoiDung) {
        kiemTraDangNhap(nguoiDung);
        Objects.requireNonNull(phongId, "Mã phòng không được để trống");
        Objects.requireNonNull(yeuCau, "Yêu cầu khai báo tài sản không được để trống");

        if (nguoiDung.vaiTro() != VaiTro.CHU && nguoiDung.vaiTro() != VaiTro.QUAN_LY) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ chủ sở hữu hoặc quản lý mới có quyền khai báo tài sản phòng");
        }

        Long toaNhaId = taiSanRepository.layToaNhaIdTheoPhong(phongId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy phòng #" + phongId));
        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, toaNhaId);

        if (yeuCau.tenTaiSan() == null || yeuCau.tenTaiSan().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên tài sản không được để trống");
        }
        if (yeuCau.soLuong() != null && yeuCau.soLuong() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số lượng tài sản phải lớn hơn 0");
        }
        if (yeuCau.giaTriUocTinh() != null && yeuCau.giaTriUocTinh().compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giá trị ước tính không được âm");
        }

        return taiSanRepository.themTaiSan(phongId, yeuCau);
    }

    @Transactional
    public boolean xoaTaiSan(Long id, NguoiDung nguoiDung) {
        kiemTraDangNhap(nguoiDung);
        Objects.requireNonNull(id, "Mã tài sản không được để trống");

        if (nguoiDung.vaiTro() != VaiTro.CHU && nguoiDung.vaiTro() != VaiTro.QUAN_LY) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ chủ sở hữu hoặc quản lý mới có quyền xoá tài sản phòng");
        }

        Long toaNhaId = taiSanRepository.layToaNhaIdTheoTaiSan(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài sản #" + id));
        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, toaNhaId);

        return taiSanRepository.xoaTaiSan(id);
    }

    public List<BienBanBanGiaoDto> layDanhSachBienBan(Long hopDongId, NguoiDung nguoiDung) {
        kiemTraDangNhap(nguoiDung);
        Objects.requireNonNull(hopDongId, "Mã hợp đồng không được để trống");

        TaiSanRepository.ThongTinHopDongTaiSan hopDong = taiSanRepository.layThongTinHopDongTaiSan(hopDongId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hợp đồng #" + hopDongId));

        if (nguoiDung.vaiTro() == VaiTro.CHU || nguoiDung.vaiTro() == VaiTro.QUAN_LY) {
            phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, hopDong.toaNhaId());
        } else if (nguoiDung.vaiTro() == VaiTro.NGUOI_THUE) {
            if (!Objects.equals(nguoiDung.nguoiThueId(), hopDong.nguoiThueId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền xem biên bản bàn giao của hợp đồng này");
            }
        } else {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        return taiSanRepository.layDanhSachBienBan(hopDongId);
    }

    @Transactional
    public Long lapBienBan(Long hopDongId, YeuCauLapBienBan yeuCau, NguoiDung nguoiDung) {
        kiemTraDangNhap(nguoiDung);
        Objects.requireNonNull(hopDongId, "Mã hợp đồng không được để trống");
        Objects.requireNonNull(yeuCau, "Dữ liệu biên bản không được để trống");

        if (nguoiDung.vaiTro() != VaiTro.CHU && nguoiDung.vaiTro() != VaiTro.QUAN_LY) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ chủ sở hữu hoặc quản lý mới có quyền lập biên bản bàn giao");
        }

        TaiSanRepository.ThongTinHopDongTaiSan hopDong = taiSanRepository.layThongTinHopDongTaiSan(hopDongId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hợp đồng #" + hopDongId));
        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, hopDong.toaNhaId());

        if (!List.of("NHAN_PHONG", "TRA_PHONG").contains(yeuCau.loaiBienBan())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Loại biên bản không hợp lệ: " + yeuCau.loaiBienBan());
        }

        // Xác minh tài sản thuộc phòng của hợp đồng, kiểm tra số lượng, trùng lặp và lấy snapshot từ DB
        Map<Long, TaiSanPhongDto> taiSanTrongPhong = taiSanRepository.layDanhSachTaiSan(hopDong.phongId())
                .stream()
                .collect(Collectors.toMap(TaiSanPhongDto::id, item -> item));

        List<YeuCauChiTietBienBan> chiTietDaXacThuc = new ArrayList<>();
        Set<Long> taiSanDaKiemKe = new HashSet<>();

        if (yeuCau.chiTiet() != null) {
            for (YeuCauChiTietBienBan ct : yeuCau.chiTiet()) {
                if (ct == null) continue;

                String tenTaiSanSnapshot = ct.tenTaiSan();
                int soLuong = ct.soLuong() != null ? ct.soLuong() : 1;
                if (soLuong <= 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số lượng tài sản trong biên bản phải lớn hơn 0");
                }

                if (ct.taiSanId() != null) {
                    if (!taiSanDaKiemKe.add(ct.taiSanId())) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tài sản trong biên bản bị trùng lặp: ID " + ct.taiSanId());
                    }
                    TaiSanPhongDto tsDb = taiSanTrongPhong.get(ct.taiSanId());
                    if (tsDb == null) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tài sản #" + ct.taiSanId() + " không thuộc phòng của hợp đồng này");
                    }
                    if (soLuong > tsDb.soLuong()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                "Số lượng kiểm kê (" + soLuong + ") vượt quá số lượng tài sản trong phòng (" + tsDb.soLuong() + ")");
                    }
                    // Snapshot tên tài sản chuẩn xác từ database
                    tenTaiSanSnapshot = tsDb.tenTaiSan();
                } else if (tenTaiSanSnapshot == null || tenTaiSanSnapshot.trim().isEmpty()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên tài sản không được để trống");
                }

                BigDecimal tienKhauTru = ct.tienKhauTru() != null ? ct.tienKhauTru() : BigDecimal.ZERO;
                if (tienKhauTru.compareTo(BigDecimal.ZERO) < 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tiền khấu trừ không được âm");
                }

                chiTietDaXacThuc.add(new YeuCauChiTietBienBan(
                        ct.taiSanId(),
                        tenTaiSanSnapshot,
                        soLuong,
                        ct.tinhTrangLucGiao() != null ? ct.tinhTrangLucGiao() : "HOAT_DONG_TOT",
                        ct.tinhTrangLucTra(),
                        tienKhauTru,
                        ct.lyDoKhauTru(),
                        ct.anhMinhChung()
                ));
            }
        }

        YeuCauLapBienBan yeuCauChuanHoa = new YeuCauLapBienBan(
                yeuCau.loaiBienBan(),
                yeuCau.ngayThucHien(),
                yeuCau.ghiChuChung(),
                chiTietDaXacThuc
        );

        // Bỏ hoàn toàn fallback người tạo ID 1: sử dụng trực tiếp nguoiDung.id() đã xác thực
        Long nguoiLapId = nguoiDung.id();
        return taiSanRepository.lapBienBan(hopDong.hopDongId(), hopDong.phongId(), nguoiLapId, yeuCauChuanHoa);
    }

    private void kiemTraDangNhap(NguoiDung nguoiDung) {
        if (nguoiDung == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Yêu cầu đăng nhập");
        }
    }
}
