package com.prj1.ccm.thongbao;

import com.prj1.ccm.billing.HoaDonVanHanhRepository;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import com.prj1.ccm.toanha.ToaNha;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

@Service
public class BangViecVanHanhService {
    private static final QuyTacBangViecVanHanh QUY_TAC_BANG_VIEC = new QuyTacBangViecVanHanh();

    private final BangViecVanHanhRepository bangViecVanHanhRepository;
    private final HoaDonVanHanhRepository hoaDonVanHanhRepository;
    private final PhanQuyenToaService phanQuyenToaService;
    private final Clock clock;

    public BangViecVanHanhService(
            BangViecVanHanhRepository bangViecVanHanhRepository,
            HoaDonVanHanhRepository hoaDonVanHanhRepository,
            PhanQuyenToaService phanQuyenToaService,
            Clock clock
    ) {
        this.bangViecVanHanhRepository = bangViecVanHanhRepository;
        this.hoaDonVanHanhRepository = hoaDonVanHanhRepository;
        this.phanQuyenToaService = phanQuyenToaService;
        this.clock = clock;
    }

    /**
     * FR-NTF-01 and BR-14 expose the operational dashboard only inside an authorized building scope.
     * The PCCC group stays explicit about its unavailable source until Slice 10 supplies that domain.
     *
     * @param toaNhaId the building whose operational work is requested
     * @param nguoiDung the authenticated owner or manager
     * @return the four actionable groups plus the explicit PCCC source state
     */
    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public ThongTinBangViecVanHanh layBangViec(Long toaNhaId, NguoiDung nguoiDung) {
        kiemTraVaiTro(nguoiDung);
        ToaNha toaNha = phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, toaNhaId);
        if (!bangViecVanHanhRepository.xacNhanPhanQuyenToa(nguoiDung.id(), toaNhaId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        LocalDate homNay = LocalDate.now(clock);
        var hienTai = clock.instant();

        int noQuaHan = (int) hoaDonVanHanhRepository.findTrongPhamVi(nguoiDung.id(), toaNhaId)
                .stream()
                .filter(hoaDon -> QUY_TAC_BANG_VIEC.hoaDonQuaHanChuaThanhToan(
                        homNay,
                        hoaDon.hanThanhToan(),
                        hoaDon.tongTien(),
                        hoaDon.daThu(),
                        hoaDon.trangThai()
                ))
                .count();
        int thieuChiSo = bangViecVanHanhRepository.demPhongThieuChiSoSauNgayChot(nguoiDung.id(), toaNhaId, homNay);
        int hopDongSapHetHan = bangViecVanHanhRepository.demHopDongSapHetHan(nguoiDung.id(), toaNhaId, homNay);
        int suCoTonDong = bangViecVanHanhRepository.demSuCoTonDongQuaHaiMuoiTamGio(
                nguoiDung.id(), toaNhaId, hienTai
        );

        return new ThongTinBangViecVanHanh(
                toaNha.id(),
                toaNha.ten(),
                List.of(
                        nhom("NO_QUA_HAN", "Nợ quá hạn", noQuaHan, true, "/hoa-don?toaNhaId=" + toaNhaId + "&trangThai=NO_QUA_HAN"),
                        nhom("THIEU_CHI_SO", "Thiếu chỉ số sau ngày chốt", thieuChiSo, true, "/ghi-chi-so?toaNhaId=" + toaNhaId),
                        nhom("HOP_DONG_SAP_HET_HAN", "Hợp đồng sắp hết hạn", hopDongSapHetHan, false, "/hop-dong?toaNhaId=" + toaNhaId + "&sapHetHan=true"),
                        nhom("SU_CO_TON_DONG", "Sự cố tồn đọng trên 48 giờ", suCoTonDong, true, "/su-co?toaNhaId=" + toaNhaId + "&boLoc=TON_DONG_QUA_48_GIO"),
                        new ThongTinBangViecVanHanh.NhomViec(
                                "PCCC",
                                "Kiểm tra PCCC",
                                QuyTacBangViecVanHanh.PCCC_SO_LUONG,
                                QuyTacBangViecVanHanh.PCCC_TRANG_THAI,
                                "Chưa triển khai nguồn kiểm tra PCCC",
                                false,
                                null
                        )
                )
        );
    }

    private ThongTinBangViecVanHanh.NhomViec nhom(
            String ma,
            String tieuDe,
            int soLuong,
            boolean khanCap,
            String lienKet
    ) {
        String trangThai = QUY_TAC_BANG_VIEC.trangThaiNhom(soLuong);
        return new ThongTinBangViecVanHanh.NhomViec(
                ma,
                tieuDe,
                soLuong,
                trangThai,
                "DA_XONG".equals(trangThai) ? "Đã xong" : "Cần xử lý",
                khanCap && soLuong > 0,
                lienKet
        );
    }

    private void kiemTraVaiTro(NguoiDung nguoiDung) {
        if (nguoiDung == null || (nguoiDung.vaiTro() != VaiTro.CHU && nguoiDung.vaiTro() != VaiTro.QUAN_LY)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }
}
