package com.prj1.ccm.suachua;

import com.prj1.ccm.nguoithue.AnhDinhKemService;
import com.prj1.ccm.nguoithue.NhatKyThaoTacRepository;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.auth.NguoiDungRepository;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.thongbao.ThongBaoService;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import com.prj1.ccm.toanha.Phong;
import com.prj1.ccm.toanha.PhongRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@Service
public class YeuCauSuaChuaService {
    private static final int SO_ANH_TOI_DA = 5;
    private static final String THONG_BAO_YEU_CAU_KHONG_HOP_LE = "Yêu cầu sửa chữa không hợp lệ";
    private static final String THONG_BAO_QUA_NAM_ANH = "Mỗi yêu cầu chỉ được đính kèm tối đa 5 ảnh";
    private static final String THONG_BAO_CHUYEN_TRANG_THAI_KHONG_HOP_LE =
            "Không thể chuyển trạng thái yêu cầu sửa chữa";
    private static final String THONG_BAO_LY_DO_HUY_BAT_BUOC = "Lý do huỷ yêu cầu sửa chữa là bắt buộc";
    private static final String THONG_BAO_THO_KHONG_HOP_LE = "Thợ sửa chữa không hợp lệ";
    private static final QuyTacTrangThaiYeuCau QUY_TAC_TRANG_THAI = new QuyTacTrangThaiYeuCau();

    private final YeuCauSuaChuaRepository yeuCauSuaChuaRepository;
    private final PhongRepository phongRepository;
    private final PhanQuyenToaService phanQuyenToaService;
    private final NguoiDungRepository nguoiDungRepository;
    private final AnhDinhKemService anhDinhKemService;
    private final NhatKyThaoTacRepository nhatKyThaoTacRepository;
    private final ThongBaoService thongBaoService;
    private final Clock clock;

    public YeuCauSuaChuaService(
            YeuCauSuaChuaRepository yeuCauSuaChuaRepository,
            PhongRepository phongRepository,
            PhanQuyenToaService phanQuyenToaService,
            NguoiDungRepository nguoiDungRepository,
            AnhDinhKemService anhDinhKemService,
            NhatKyThaoTacRepository nhatKyThaoTacRepository,
            ThongBaoService thongBaoService,
            Clock clock
    ) {
        this.yeuCauSuaChuaRepository = yeuCauSuaChuaRepository;
        this.phongRepository = phongRepository;
        this.phanQuyenToaService = phanQuyenToaService;
        this.nguoiDungRepository = nguoiDungRepository;
        this.anhDinhKemService = anhDinhKemService;
        this.nhatKyThaoTacRepository = nhatKyThaoTacRepository;
        this.thongBaoService = thongBaoService;
        this.clock = clock;
    }

    /** FR-MNT-01 and BR-17 create a repair request in the tenant's own active room or an assigned building. */
    @Transactional
    public ThongTinYeuCauSuaChua tao(YeuCauTaoSuaChua yeuCau, List<MultipartFile> anh, NguoiDung nguoiDung) {
        kiemTraVaiTroTao(nguoiDung);
        List<MultipartFile> danhSachAnh = anh == null ? List.of() : List.copyOf(anh);
        if (danhSachAnh.size() > SO_ANH_TOI_DA) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_QUA_NAM_ANH);
        }
        kiemTraYeuCau(yeuCau);

        Phong phong = phongRepository.findById(yeuCau.phongId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        kiemTraPhamVi(phong, nguoiDung);

        Long yeuCauId = yeuCauSuaChuaRepository.insert(new YeuCauSuaChua(
                null,
                null,
                phong.id(),
                nguoiDung.id(),
                yeuCau.hangMuc().trim(),
                yeuCau.moTa().trim(),
                yeuCau.mucDo(),
                TrangThaiYeuCau.MOI_TIEP_NHAN,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                clock.instant()
        ));

        List<Long> anhIds = anhDinhKemService.taiLenAnhYeuCauSuaChua(yeuCauId, danhSachAnh);
        nhatKyThaoTacRepository.ghi(
                nguoiDung.id(),
                "TAO_YEU_CAU_SUA_CHUA",
                "YEU_CAU_SUA_CHUA:" + yeuCauId,
                null,
                TrangThaiYeuCau.MOI_TIEP_NHAN.name()
        );

        YeuCauSuaChuaRepository.YeuCauSuaChuaView daLuu = yeuCauSuaChuaRepository.findById(yeuCauId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        thongBaoService.taoKhiTaoYeuCau(yeuCauId);
        return ThongTinYeuCauSuaChua.tu(daLuu, anhIds);
    }

    /** FR-MNT-03 lists requests inside the buildings visible to the owner or manager. */
    @Transactional(readOnly = true)
    public List<ThongTinYeuCauSuaChua> danhSach(Long toaNhaId, TrangThaiYeuCau trangThai, NguoiDung nguoiDung) {
        kiemTraVaiTroQuanLy(nguoiDung);
        List<YeuCauSuaChuaRepository.YeuCauSuaChuaView> danhSach = toaNhaId == null
                ? yeuCauSuaChuaRepository.findByNguoiQuanLy(nguoiDung.id(), trangThai)
                : timTrongToa(toaNhaId, trangThai, nguoiDung);
        return danhSach.stream().map(this::thongTin).toList();
    }

    /** FR-MNT-03 returns one request only when the authenticated actor owns its scope. */
    @Transactional(readOnly = true)
    public ThongTinYeuCauSuaChua chiTiet(Long yeuCauId, NguoiDung nguoiDung) {
        YeuCauSuaChuaRepository.YeuCauSuaChuaView view = timYeuCau(yeuCauId);
        kiemTraQuyenXem(view, nguoiDung);
        return thongTin(view);
    }

    /** FR-MNT-04 returns the active assigned work list for the authenticated worker. */
    @Transactional(readOnly = true)
    public List<ThongTinYeuCauSuaChua> viecCuaToi(NguoiDung nguoiDung) {
        kiemTraVaiTroTho(nguoiDung);
        return yeuCauSuaChuaRepository.findByNguoiXuLy(nguoiDung.id()).stream()
                .map(this::thongTin)
                .toList();
    }

    /** FR-MNT-03 moves a request from new to accepted and records the accepting manager. */
    @Transactional
    public ThongTinYeuCauSuaChua tiepNhan(Long yeuCauId, NguoiDung nguoiDung) {
        YeuCauSuaChuaRepository.YeuCauSuaChuaView view = timTrongPhamViQuanLy(yeuCauId, nguoiDung);
        TrangThaiYeuCau trangThaiMoi = chuyenTiepNhan(view.yeuCau().trangThai());
        kiemTraCapNhat(yeuCauSuaChuaRepository.capNhatTiepNhan(
                yeuCauId, nguoiDung.id(), clock.instant(), view.yeuCau().trangThai()
        ));
        ghiNhatKy(nguoiDung, "TIEP_NHAN_YEU_CAU_SUA_CHUA", view.yeuCau().trangThai(), trangThaiMoi, null, yeuCauId);
        return thongTin(timYeuCau(yeuCauId));
    }

    /** FR-MNT-04 assigns a request to an active THO without creating a building permission. */
    @Transactional
    public ThongTinYeuCauSuaChua phanCong(Long yeuCauId, Long thoId, NguoiDung nguoiDung) {
        YeuCauSuaChuaRepository.YeuCauSuaChuaView view = timTrongPhamViQuanLy(yeuCauId, nguoiDung);
        if (thoId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_THO_KHONG_HOP_LE);
        }
        NguoiDung tho = nguoiDungRepository.findById(thoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_THO_KHONG_HOP_LE));
        if (tho.vaiTro() != VaiTro.THO || !tho.hoatDong()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_THO_KHONG_HOP_LE);
        }
        TrangThaiYeuCau trangThaiMoi = chuyenPhanCong(view.yeuCau().trangThai());
        kiemTraCapNhat(yeuCauSuaChuaRepository.capNhatPhanCong(
                yeuCauId, thoId, clock.instant(), view.yeuCau().trangThai()
        ));
        thongBaoService.taoKhiPhanCong(yeuCauId);
        ghiNhatKy(nguoiDung, "PHAN_CONG_YEU_CAU_SUA_CHUA", view.yeuCau().trangThai(), trangThaiMoi, null, yeuCauId);
        return thongTin(timYeuCau(yeuCauId));
    }

    /** FR-MNT-04 lets only the assigned worker start the repair. */
    @Transactional
    public ThongTinYeuCauSuaChua batDauXuLy(Long yeuCauId, NguoiDung nguoiDung) {
        YeuCauSuaChuaRepository.YeuCauSuaChuaView view = timYeuCau(yeuCauId);
        kiemTraQuyenTho(view, nguoiDung);
        TrangThaiYeuCau trangThaiMoi = chuyenBatDauXuLy(view.yeuCau().trangThai());
        kiemTraCapNhat(yeuCauSuaChuaRepository.capNhatTrangThai(
                yeuCauId, trangThaiMoi, view.yeuCau().trangThai()
        ));
        ghiNhatKy(nguoiDung, "BAT_DAU_XU_LY_YEU_CAU_SUA_CHUA", view.yeuCau().trangThai(), trangThaiMoi, null, yeuCauId);
        return thongTin(timYeuCau(yeuCauId));
    }

    /** FR-MNT-04 lets only the assigned worker mark the repair as awaiting tenant confirmation. */
    @Transactional
    public ThongTinYeuCauSuaChua baoDaSuaXong(Long yeuCauId, NguoiDung nguoiDung) {
        YeuCauSuaChuaRepository.YeuCauSuaChuaView view = timYeuCau(yeuCauId);
        kiemTraQuyenTho(view, nguoiDung);
        TrangThaiYeuCau trangThaiMoi = chuyenBaoDaSuaXong(view.yeuCau().trangThai());
        kiemTraCapNhat(yeuCauSuaChuaRepository.capNhatChoXacNhan(
                yeuCauId, clock.instant(), view.yeuCau().trangThai()
        ));
        ghiNhatKy(nguoiDung, "HOAN_THANH_YEU_CAU_SUA_CHUA", view.yeuCau().trangThai(), trangThaiMoi, null, yeuCauId);
        return thongTin(timYeuCau(yeuCauId));
    }

    /** FR-MNT-03 moves a request from tenant confirmation to closed for its creator or building manager. */
    @Transactional
    public ThongTinYeuCauSuaChua xacNhanDong(Long yeuCauId, NguoiDung nguoiDung) {
        YeuCauSuaChuaRepository.YeuCauSuaChuaView view = timYeuCau(yeuCauId);
        kiemTraQuyenDong(view, nguoiDung);
        TrangThaiYeuCau trangThaiMoi = chuyenXacNhanDong(view.yeuCau().trangThai());
        kiemTraCapNhat(yeuCauSuaChuaRepository.capNhatTrangThai(
                yeuCauId, trangThaiMoi, view.yeuCau().trangThai()
        ));
        ghiNhatKy(nguoiDung, "XAC_NHAN_DONG_YEU_CAU_SUA_CHUA", view.yeuCau().trangThai(), trangThaiMoi, null, yeuCauId);
        return thongTin(timYeuCau(yeuCauId));
    }

    /** FR-MNT-03 cancels an open request with a mandatory reason and an audit row. */
    @Transactional
    public ThongTinYeuCauSuaChua huy(Long yeuCauId, String lyDo, NguoiDung nguoiDung) {
        YeuCauSuaChuaRepository.YeuCauSuaChuaView view = timTrongPhamViQuanLy(yeuCauId, nguoiDung);
        if (lyDo == null || lyDo.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_LY_DO_HUY_BAT_BUOC);
        }
        TrangThaiYeuCau trangThaiMoi = chuyenHuy(view.yeuCau().trangThai(), lyDo);
        String lyDoDaChuanHoa = lyDo.trim();
        kiemTraCapNhat(yeuCauSuaChuaRepository.capNhatHuy(
                yeuCauId, lyDoDaChuanHoa, view.yeuCau().trangThai()
        ));
        ghiNhatKy(nguoiDung, "HUY_YEU_CAU_SUA_CHUA", view.yeuCau().trangThai(), trangThaiMoi, lyDoDaChuanHoa, yeuCauId);
        return thongTin(timYeuCau(yeuCauId));
    }

    private void kiemTraVaiTroTao(NguoiDung nguoiDung) {
        if (nguoiDung == null
                || (nguoiDung.vaiTro() != VaiTro.CHU
                && nguoiDung.vaiTro() != VaiTro.QUAN_LY
                && nguoiDung.vaiTro() != VaiTro.NGUOI_THUE)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private List<YeuCauSuaChuaRepository.YeuCauSuaChuaView> timTrongToa(
            Long toaNhaId,
            TrangThaiYeuCau trangThai,
            NguoiDung nguoiDung
    ) {
        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, toaNhaId);
        return yeuCauSuaChuaRepository.findByToaNhaId(toaNhaId, trangThai);
    }

    private YeuCauSuaChuaRepository.YeuCauSuaChuaView timTrongPhamViQuanLy(Long yeuCauId, NguoiDung nguoiDung) {
        kiemTraVaiTroQuanLy(nguoiDung);
        YeuCauSuaChuaRepository.YeuCauSuaChuaView view = timYeuCau(yeuCauId);
        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, view.toaNhaId());
        return view;
    }

    private YeuCauSuaChuaRepository.YeuCauSuaChuaView timYeuCau(Long yeuCauId) {
        return yeuCauSuaChuaRepository.findById(yeuCauId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private ThongTinYeuCauSuaChua thongTin(YeuCauSuaChuaRepository.YeuCauSuaChuaView view) {
        return ThongTinYeuCauSuaChua.tu(view, yeuCauSuaChuaRepository.findAnhIds(view.yeuCau().id()));
    }

    private void kiemTraQuyenXem(YeuCauSuaChuaRepository.YeuCauSuaChuaView view, NguoiDung nguoiDung) {
        if (nguoiDung == null || nguoiDung.vaiTro() == VaiTro.QTHT) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        if (nguoiDung.vaiTro() == VaiTro.CHU || nguoiDung.vaiTro() == VaiTro.QUAN_LY) {
            phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, view.toaNhaId());
            return;
        }
        if (nguoiDung.vaiTro() == VaiTro.THO
                && Objects.equals(nguoiDung.id(), view.yeuCau().nguoiXuLyId())) {
            return;
        }
        if (nguoiDung.vaiTro() == VaiTro.NGUOI_THUE
                && Objects.equals(nguoiDung.id(), view.yeuCau().nguoiTaoId())) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }

    private void kiemTraQuyenTho(YeuCauSuaChuaRepository.YeuCauSuaChuaView view, NguoiDung nguoiDung) {
        if (nguoiDung == null || nguoiDung.vaiTro() != VaiTro.THO
                || !Objects.equals(nguoiDung.id(), view.yeuCau().nguoiXuLyId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private void kiemTraQuyenDong(YeuCauSuaChuaRepository.YeuCauSuaChuaView view, NguoiDung nguoiDung) {
        if (nguoiDung == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        if (nguoiDung.vaiTro() == VaiTro.QUAN_LY) {
            phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, view.toaNhaId());
            return;
        }
        if (nguoiDung.vaiTro() == VaiTro.NGUOI_THUE
                && Objects.equals(nguoiDung.id(), view.yeuCau().nguoiTaoId())) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }

    private void kiemTraCapNhat(int soDongDaCapNhat) {
        if (soDongDaCapNhat != 1) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    THONG_BAO_CHUYEN_TRANG_THAI_KHONG_HOP_LE
            );
        }
    }

    private void kiemTraVaiTroQuanLy(NguoiDung nguoiDung) {
        if (nguoiDung == null || (nguoiDung.vaiTro() != VaiTro.CHU && nguoiDung.vaiTro() != VaiTro.QUAN_LY)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private void kiemTraVaiTroTho(NguoiDung nguoiDung) {
        if (nguoiDung == null || nguoiDung.vaiTro() != VaiTro.THO) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private TrangThaiYeuCau chuyenTiepNhan(TrangThaiYeuCau hienTai) {
        try {
            return QUY_TAC_TRANG_THAI.tiepNhan(hienTai);
        } catch (IllegalArgumentException exception) {
            throw loiChuyenTrangThai(exception);
        }
    }

    private TrangThaiYeuCau chuyenPhanCong(TrangThaiYeuCau hienTai) {
        try {
            return QUY_TAC_TRANG_THAI.phanCong(hienTai);
        } catch (IllegalArgumentException exception) {
            throw loiChuyenTrangThai(exception);
        }
    }

    private TrangThaiYeuCau chuyenBatDauXuLy(TrangThaiYeuCau hienTai) {
        try {
            return QUY_TAC_TRANG_THAI.batDauXuLy(hienTai);
        } catch (IllegalArgumentException exception) {
            throw loiChuyenTrangThai(exception);
        }
    }

    private TrangThaiYeuCau chuyenBaoDaSuaXong(TrangThaiYeuCau hienTai) {
        try {
            return QUY_TAC_TRANG_THAI.baoDaSuaXong(hienTai);
        } catch (IllegalArgumentException exception) {
            throw loiChuyenTrangThai(exception);
        }
    }

    private TrangThaiYeuCau chuyenXacNhanDong(TrangThaiYeuCau hienTai) {
        try {
            return QUY_TAC_TRANG_THAI.xacNhanDong(hienTai);
        } catch (IllegalArgumentException exception) {
            throw loiChuyenTrangThai(exception);
        }
    }

    private TrangThaiYeuCau chuyenHuy(TrangThaiYeuCau hienTai, String lyDo) {
        try {
            return QUY_TAC_TRANG_THAI.huy(hienTai, lyDo);
        } catch (IllegalArgumentException exception) {
            throw loiChuyenTrangThai(exception);
        }
    }

    private ResponseStatusException loiChuyenTrangThai(IllegalArgumentException exception) {
        return new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_CHUYEN_TRANG_THAI_KHONG_HOP_LE, exception);
    }

    private void ghiNhatKy(
            NguoiDung nguoiDung,
            String hanhDong,
            TrangThaiYeuCau trangThaiCu,
            TrangThaiYeuCau trangThaiMoi,
            String lyDo,
            Long yeuCauId
    ) {
        nhatKyThaoTacRepository.ghi(
                nguoiDung.id(),
                hanhDong,
                "YEU_CAU_SUA_CHUA:" + yeuCauId,
                trangThaiCu.name(),
                trangThaiMoi.name(),
                null,
                null,
                lyDo,
                null
        );
    }

    private void kiemTraYeuCau(YeuCauTaoSuaChua yeuCau) {
        if (yeuCau == null
                || yeuCau.phongId() == null
                || yeuCau.hangMuc() == null || yeuCau.hangMuc().isBlank()
                || yeuCau.moTa() == null || yeuCau.moTa().isBlank()
                || yeuCau.mucDo() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE);
        }
    }

    private void kiemTraPhamVi(Phong phong, NguoiDung nguoiDung) {
        if (nguoiDung.vaiTro() == VaiTro.CHU || nguoiDung.vaiTro() == VaiTro.QUAN_LY) {
            phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, phong.toaNhaId());
            return;
        }

        if (nguoiDung.nguoiThueId() == null
                || !yeuCauSuaChuaRepository.coHopDongHieuLucCuaNguoiThue(
                phong.id(),
                nguoiDung.nguoiThueId(),
                LocalDate.now(clock)
        )) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }
}
