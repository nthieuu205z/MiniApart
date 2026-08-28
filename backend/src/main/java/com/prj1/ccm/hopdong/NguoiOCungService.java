package com.prj1.ccm.hopdong;

import com.prj1.ccm.nguoithue.NguoiThueRepository;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.toanha.Phong;
import com.prj1.ccm.toanha.PhongRepository;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
public class NguoiOCungService {
    private static final String THONG_BAO_YEU_CAU_KHONG_HOP_LE = "Yêu cầu người ở cùng không hợp lệ.";

    private final NguoiOCungRepository nguoiOCungRepository;
    private final HopDongRepository hopDongRepository;
    private final NguoiThueRepository nguoiThueRepository;
    private final PhongRepository phongRepository;
    private final PhanQuyenToaService phanQuyenToaService;

    public NguoiOCungService(
            NguoiOCungRepository nguoiOCungRepository,
            HopDongRepository hopDongRepository,
            NguoiThueRepository nguoiThueRepository,
            PhongRepository phongRepository,
            PhanQuyenToaService phanQuyenToaService
    ) {
        this.nguoiOCungRepository = nguoiOCungRepository;
        this.hopDongRepository = hopDongRepository;
        this.nguoiThueRepository = nguoiThueRepository;
        this.phongRepository = phongRepository;
        this.phanQuyenToaService = phanQuyenToaService;
    }

    /** FR-TNT-02 lists the temporal occupants of one rental contract within the manager's building scope. */
    @Transactional(readOnly = true)
    public List<ThongTinNguoiOCung> danhSach(Long hopDongId, NguoiDung nguoiDung) {
        layHopDongTrongPhamVi(hopDongId, nguoiDung);
        return nguoiOCungRepository.findByHopDongId(hopDongId).stream().map(ThongTinNguoiOCung::tu).toList();
    }

    /** FR-TNT-02 creates one source-of-truth occupant interval; the representative tenant may be used as the profile. */
    @Transactional
    public ThongTinThemNguoiOCung tao(Long hopDongId, YeuCauNguoiOCung yeuCau, NguoiDung nguoiDung) {
        HopDongRepository.HopDongView hopDongView = layHopDongTrongPhamVi(hopDongId, nguoiDung);
        if (yeuCau == null
                || yeuCau.nguoiThueId() == null
                || yeuCau.quanHe() == null
                || yeuCau.quanHe().isBlank()
                || yeuCau.tuNgay() == null
                || (yeuCau.denNgay() != null && yeuCau.denNgay().isBefore(yeuCau.tuNgay()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE);
        }
        String quanHe = yeuCau.quanHe().trim();
        if (nguoiThueRepository.findById(yeuCau.nguoiThueId()).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        Long id = nguoiOCungRepository.insert(new NguoiOCung(
                null,
                hopDongId,
                yeuCau.nguoiThueId(),
                null,
                quanHe,
                yeuCau.tuNgay(),
                yeuCau.denNgay()
        ));
        NguoiOCung nguoiOCung = nguoiOCungRepository.findByHopDongId(hopDongId).stream()
                .filter(item -> item.id().equals(id))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        Phong phong = phongRepository.findById(hopDongView.hopDong().phongId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        int soNguoiHienTai = nguoiOCungRepository.countByPhongIdAndNgay(phong.id(), yeuCau.tuNgay());
        String thongBao = soNguoiHienTai > phong.sucChua()
                ? "Phòng %s đang có %d người trên sức chứa %d.".formatted(phong.soPhong(), soNguoiHienTai, phong.sucChua())
                : null;
        return ThongTinThemNguoiOCung.tu(nguoiOCung, soNguoiHienTai, phong.sucChua(), thongBao);
    }

    /** FR-TNT-03 returns the occupant count of a room at an inclusive calendar date. */
    @Transactional(readOnly = true)
    public ThongTinSoNguoiO soLuong(Long hopDongId, LocalDate ngay, NguoiDung nguoiDung) {
        HopDongRepository.HopDongView hopDongView = layHopDongTrongPhamVi(hopDongId, nguoiDung);
        if (ngay == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE);
        }
        Phong phong = phongRepository.findById(hopDongView.hopDong().phongId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        int soNguoi = nguoiOCungRepository.countByPhongIdAndNgay(phong.id(), ngay);
        return new ThongTinSoNguoiO(phong.id(), phong.soPhong(), ngay, soNguoi, phong.sucChua(), soNguoi > phong.sucChua());
    }

    private HopDongRepository.HopDongView layHopDongTrongPhamVi(Long hopDongId, NguoiDung nguoiDung) {
        kiemTraVaiTro(nguoiDung);
        HopDongRepository.HopDongView hopDongView = hopDongRepository.findViewById(hopDongId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        phanQuyenToaService.layToaNhaNeuNguoiDungDuocXem(nguoiDung, hopDongView.toaNhaId());
        return hopDongView;
    }

    private void kiemTraVaiTro(NguoiDung nguoiDung) {
        if (nguoiDung == null || (nguoiDung.vaiTro() != VaiTro.QTHT
                && nguoiDung.vaiTro() != VaiTro.CHU
                && nguoiDung.vaiTro() != VaiTro.QUAN_LY)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }
}
