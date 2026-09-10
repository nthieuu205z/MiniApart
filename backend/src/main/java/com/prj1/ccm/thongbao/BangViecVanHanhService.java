package com.prj1.ccm.thongbao;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.suachua.YeuCauSuaChuaRepository;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import com.prj1.ccm.toanha.ToaNha;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

@Service
public class BangViecVanHanhService {
    private static final QuyTacBangViecVanHanh QUY_TAC_BANG_VIEC = new QuyTacBangViecVanHanh();

    private final BangViecVanHanhRepository bangViecVanHanhRepository;
    private final YeuCauSuaChuaRepository yeuCauSuaChuaRepository;
    private final PhanQuyenToaService phanQuyenToaService;
    private final Clock clock;

    public BangViecVanHanhService(
            BangViecVanHanhRepository bangViecVanHanhRepository,
            YeuCauSuaChuaRepository yeuCauSuaChuaRepository,
            PhanQuyenToaService phanQuyenToaService,
            Clock clock
    ) {
        this.bangViecVanHanhRepository = bangViecVanHanhRepository;
        this.yeuCauSuaChuaRepository = yeuCauSuaChuaRepository;
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
    @Transactional(readOnly = true)
    public ThongTinBangViecVanHanh layBangViec(Long toaNhaId, NguoiDung nguoiDung) {
        kiemTraVaiTro(nguoiDung);
        ToaNha toaNha = phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, toaNhaId);
        LocalDate homNay = LocalDate.now(clock);

        int noQuaHan = bangViecVanHanhRepository.demHoaDonQuaHanChuaThanhToan(toaNhaId, homNay);
        int thieuChiSo = bangViecVanHanhRepository.demPhongThieuChiSoSauNgayChot(toaNhaId, homNay);
        int hopDongSapHetHan = bangViecVanHanhRepository.demHopDongSapHetHan(toaNhaId, homNay);
        int suCoTonDong = demSuCoTonDong(toaNhaId);

        return new ThongTinBangViecVanHanh(
                toaNha.id(),
                toaNha.ten(),
                List.of(
                        nhom("NO_QUA_HAN", "Nợ quá hạn", noQuaHan, true, "/hoa-don?toaNhaId=" + toaNhaId + "&trangThai=QUA_HAN"),
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
                                "/an-toan?toaNhaId=" + toaNhaId
                        )
                )
        );
    }

    private int demSuCoTonDong(Long toaNhaId) {
        return (int) yeuCauSuaChuaRepository.findTrangThaiChoBangViec(toaNhaId)
                .stream()
                .filter(item -> QUY_TAC_BANG_VIEC.suCoTonDongQuaHaiMuoiTamGio(
                        item.taoLuc(),
                        item.trangThai(),
                        item.choXacNhanLuc(),
                        clock.instant()
                ))
                .count();
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
