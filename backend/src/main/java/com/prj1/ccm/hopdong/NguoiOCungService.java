package com.prj1.ccm.hopdong;

import com.prj1.ccm.auth.NguoiDungRepository;
import com.prj1.ccm.auth.PasswordHasher;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.TrangThaiNguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.nguoithue.NguoiThue;
import com.prj1.ccm.nguoithue.NguoiThueRepository;
import com.prj1.ccm.nguoithue.NhatKyThaoTacRepository;
import com.prj1.ccm.nguoithue.SoGiayToFormatter;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import com.prj1.ccm.toanha.Phong;
import com.prj1.ccm.toanha.PhongRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class NguoiOCungService {
    private static final String THONG_BAO_YEU_CAU_KHONG_HOP_LE = "Yêu cầu người ở cùng không hợp lệ.";

    private final NguoiOCungRepository nguoiOCungRepository;
    private final HopDongRepository hopDongRepository;
    private final NguoiThueRepository nguoiThueRepository;
    private final PhongRepository phongRepository;
    private final PhanQuyenToaService phanQuyenToaService;
    private final HopDongHoSoRepository hopDongHoSoRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final PasswordHasher passwordHasher;
    private final NhatKyThaoTacRepository nhatKy;
    private final Clock clock;

    public NguoiOCungService(
            NguoiOCungRepository nguoiOCungRepository,
            HopDongRepository hopDongRepository,
            NguoiThueRepository nguoiThueRepository,
            PhongRepository phongRepository,
            PhanQuyenToaService phanQuyenToaService
    ) {
        this(nguoiOCungRepository, hopDongRepository, nguoiThueRepository, phongRepository, phanQuyenToaService, null, null, null, null, Clock.systemDefaultZone());
    }

    @Autowired
    public NguoiOCungService(
            NguoiOCungRepository nguoiOCungRepository,
            HopDongRepository hopDongRepository,
            NguoiThueRepository nguoiThueRepository,
            PhongRepository phongRepository,
            PhanQuyenToaService phanQuyenToaService,
            @Autowired(required = false) HopDongHoSoRepository hopDongHoSoRepository,
            @Autowired(required = false) NguoiDungRepository nguoiDungRepository,
            @Autowired(required = false) PasswordHasher passwordHasher,
            @Autowired(required = false) NhatKyThaoTacRepository nhatKy,
            @Autowired(required = false) Clock clock
    ) {
        this.nguoiOCungRepository = nguoiOCungRepository;
        this.hopDongRepository = hopDongRepository;
        this.nguoiThueRepository = nguoiThueRepository;
        this.phongRepository = phongRepository;
        this.phanQuyenToaService = phanQuyenToaService;
        this.hopDongHoSoRepository = hopDongHoSoRepository;
        this.nguoiDungRepository = nguoiDungRepository;
        this.passwordHasher = passwordHasher;
        this.nhatKy = nhatKy;
        this.clock = clock != null ? clock : Clock.systemDefaultZone();
    }

    /** FR-TNT-02 lists the temporal occupants of one rental contract within scope. */
    @Transactional(readOnly = true)
    public List<ThongTinNguoiOCung> danhSach(Long hopDongId, NguoiDung nguoiDung) {
        layHopDongTrongPhamVi(hopDongId, nguoiDung, true);
        return nguoiOCungRepository.findByHopDongIdWithDetails(hopDongId);
    }

    /** FR-TNT-02 creates one occupant interval; tenant creates CHO_DUYET, manager creates DA_DUYET. */
    @Transactional
    public ThongTinThemNguoiOCung tao(Long hopDongId, YeuCauNguoiOCung yeuCau, NguoiDung nguoiDung) {
        HopDongRepository.HopDongView hopDongView = layHopDongTrongPhamVi(hopDongId, nguoiDung, true);
        if (yeuCau == null
                || yeuCau.nguoiThueId() == null
                || yeuCau.tuNgay() == null
                || (yeuCau.denNgay() != null && yeuCau.denNgay().isBefore(yeuCau.tuNgay()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE);
        }
        String quanHe = yeuCau.quanHe() != null && !yeuCau.quanHe().isBlank() ? yeuCau.quanHe().trim() : null;
        String vaiTro = yeuCau.vaiTro() != null && !yeuCau.vaiTro().isBlank() ? yeuCau.vaiTro().trim() : "NGUOI_O";

        NguoiThue nt = nguoiThueRepository.findById(yeuCau.nguoiThueId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ người thuê."));

        boolean laNguoiThue = nguoiDung != null && nguoiDung.vaiTro() == VaiTro.NGUOI_THUE;
        String trangThai = laNguoiThue ? "CHO_DUYET" : "DA_DUYET";
        LocalDateTime now = LocalDateTime.now(clock);

        if (!laNguoiThue) {
            // Mọi đường tạo người DA_DUYET, gồm quản lý thêm trực tiếp, đều phải dùng cùng kiểm tra sức chứa trong khóa bi quan
            kiemTraSucChuaVaKhoaPhong(hopDongId, hopDongView.hopDong().phongId(), yeuCau.tuNgay(), yeuCau.denNgay(), null, "thêm");
        }

        Long id = nguoiOCungRepository.insert(new NguoiOCung(
                null,
                hopDongId,
                yeuCau.nguoiThueId(),
                nt.hoTen(),
                quanHe,
                yeuCau.tuNgay(),
                yeuCau.denNgay(),
                vaiTro,
                trangThai,
                nguoiDung != null ? nguoiDung.id() : null,
                now,
                laNguoiThue ? null : (nguoiDung != null ? nguoiDung.id() : null),
                laNguoiThue ? null : now,
                null,
                null
        ));

        NguoiOCung nguoiOCung = nguoiOCungRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        Phong phong = phongRepository.findById(hopDongView.hopDong().phongId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        int soNguoiHienTai = nguoiOCungRepository.countByPhongIdAndNgay(phong.id(), yeuCau.tuNgay());
        String thongBao = soNguoiHienTai > phong.sucChua()
                ? "Phòng %s đang có %d người trên sức chứa %d.".formatted(phong.soPhong(), soNguoiHienTai, phong.sucChua())
                : null;

        if (nhatKy != null && nguoiDung != null) {
            nhatKy.ghi(
                    nguoiDung.id(),
                    "THEM_NGUOI_O_CUNG",
                    "HOP_DONG:" + hopDongId + ";NGUOI_O_CUNG:" + id,
                    null,
                    "trangThai=" + trangThai + ";nguoiThueId=" + yeuCau.nguoiThueId()
            );
        }

        return ThongTinThemNguoiOCung.tu(nguoiOCung, soNguoiHienTai, phong.sucChua(), thongBao);
    }

    private void kiemTraSucChuaVaKhoaPhong(Long hopDongId, Long phongId, LocalDate tuNgay, LocalDate denNgay, Long excludeNocId, String thaoTac) {
        Phong phong = phongRepository.findById(phongId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy phòng."));
        nguoiOCungRepository.lockPhongForUpdate(phong.id());

        int approvedCoOccupants = nguoiOCungRepository.countApprovedOccupantsInInterval(
                hopDongId, tuNgay, denNgay, excludeNocId
        );
        int totalOccupants = 1 + approvedCoOccupants + 1; // 1 người đứng tên + người đã duyệt + người mới

        int limit = phong.sucChua();
        if (hopDongHoSoRepository != null) {
            Optional<HopDongHoSo> hoSoOpt = hopDongHoSoRepository.findLatestByHopDongId(hopDongId);
            if (hoSoOpt.isPresent() && hoSoOpt.get().soNguoiToiDa() != null && hoSoOpt.get().soNguoiToiDa() > 0) {
                limit = Math.min(limit, hoSoOpt.get().soNguoiToiDa());
            }
        }

        if (totalOccupants > limit) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Không thể %s vì vượt quá sức chứa tối đa (%d người). Hiện đã có %d người được duyệt cư trú.".formatted(thaoTac, limit, 1 + approvedCoOccupants)
            );
        }
    }

    /** Approves an occupant registration with pessimistic lock and capacity validation. */
    @Transactional
    public ThongTinNguoiOCung duyet(Long hopDongId, Long nguoiOCungId, NguoiDung nguoiDung) {
        HopDongRepository.HopDongView hopDongView = layHopDongTrongPhamVi(hopDongId, nguoiDung, false);
        NguoiOCung noc = nguoiOCungRepository.findById(nguoiOCungId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người ở cùng."));

        if (!noc.hopDongId().equals(hopDongId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Người ở cùng không thuộc hợp đồng này.");
        }

        if ("DA_DUYET".equals(noc.trangThai())) {
            return timThongTinChiTiet(hopDongId, nguoiOCungId);
        }

        kiemTraSucChuaVaKhoaPhong(hopDongId, hopDongView.hopDong().phongId(), noc.tuNgay(), noc.denNgay(), noc.id(), "duyệt");

        LocalDateTime now = LocalDateTime.now(clock);
        nguoiOCungRepository.updateTrangThai(noc.id(), "DA_DUYET", nguoiDung.id(), now, null);

        if (nhatKy != null) {
            nhatKy.ghi(
                    nguoiDung.id(),
                    "DUYET_NGUOI_O_CUNG",
                    "HOP_DONG:" + hopDongId + ";NGUOI_O_CUNG:" + noc.id(),
                    noc.trangThai(),
                    "DA_DUYET"
            );
        }

        return timThongTinChiTiet(hopDongId, nguoiOCungId);
    }

    /** Rejects an occupant registration with mandatory reason. */
    @Transactional
    public ThongTinNguoiOCung tuChoi(Long hopDongId, Long nguoiOCungId, String lyDo, NguoiDung nguoiDung) {
        layHopDongTrongPhamVi(hopDongId, nguoiDung, false);
        NguoiOCung noc = nguoiOCungRepository.findById(nguoiOCungId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người ở cùng."));

        if (!noc.hopDongId().equals(hopDongId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Người ở cùng không thuộc hợp đồng này.");
        }

        if (lyDo == null || lyDo.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lý do từ chối không được để trống.");
        }

        LocalDateTime now = LocalDateTime.now(clock);
        nguoiOCungRepository.updateTrangThai(noc.id(), "TU_CHOI", nguoiDung.id(), now, lyDo.trim());

        if (nhatKy != null) {
            nhatKy.ghi(
                    nguoiDung.id(),
                    "TU_CHOI_NGUOI_O_CUNG",
                    "HOP_DONG:" + hopDongId + ";NGUOI_O_CUNG:" + noc.id(),
                    noc.trangThai(),
                    "TU_CHOI;lyDo=" + lyDo.trim()
            );
        }

        return timThongTinChiTiet(hopDongId, nguoiOCungId);
    }

    /** Records occupant departure from room. */
    @Transactional
    public ThongTinNguoiOCung roiPhong(Long hopDongId, Long nguoiOCungId, LocalDate ngayRoiDi, String lyDo, NguoiDung nguoiDung) {
        layHopDongTrongPhamVi(hopDongId, nguoiDung, false);
        NguoiOCung noc = nguoiOCungRepository.findById(nguoiOCungId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người ở cùng."));

        if (!noc.hopDongId().equals(hopDongId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Người ở cùng không thuộc hợp đồng này.");
        }

        LocalDate ngayRoi = ngayRoiDi != null ? ngayRoiDi : LocalDate.now(clock);
        nguoiOCungRepository.updateRoiPhong(noc.id(), ngayRoi, lyDo != null ? lyDo.trim() : null);

        if (nhatKy != null) {
            nhatKy.ghi(
                    nguoiDung.id(),
                    "ROI_PHONG_NGUOI_O_CUNG",
                    "HOP_DONG:" + hopDongId + ";NGUOI_O_CUNG:" + noc.id(),
                    noc.trangThai(),
                    "DA_ROI_DI;ngay=" + ngayRoi
            );
        }

        return timThongTinChiTiet(hopDongId, nguoiOCungId);
    }

    /** Activates a resident account without using CCCD as credentials. */
    @Transactional
    public ThongTinNguoiOCung kichHoatTaiKhoan(Long hopDongId, Long nguoiOCungId, NguoiDung nguoiDung) {
        layHopDongTrongPhamVi(hopDongId, nguoiDung, false);
        NguoiOCung noc = nguoiOCungRepository.findById(nguoiOCungId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người ở cùng."));

        if (!noc.hopDongId().equals(hopDongId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Người ở cùng không thuộc hợp đồng này.");
        }

        if (!"DA_DUYET".equals(noc.trangThai())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ người ở cùng đã được phê duyệt mới có thể kích hoạt tài khoản cư trú.");
        }

        NguoiThue nt = nguoiThueRepository.findById(noc.nguoiThueId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy thông tin cá nhân người thuê."));

        if (nt.soDienThoai() == null || nt.soDienThoai().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Người ở cùng chưa có số điện thoại để tạo tài khoản.");
        }

        String sdt = nt.soDienThoai().trim();
        if (nguoiDungRepository != null) {
            Optional<NguoiDung> existing = nguoiDungRepository.findBySoDienThoai(sdt);
            if (existing.isPresent()) {
                if (nt.id().equals(existing.get().nguoiThueId())) {
                    return timThongTinChiTiet(hopDongId, nguoiOCungId);
                }
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Số điện thoại " + sdt + " đã được liên kết với một tài khoản người dùng khác.");
            }

            String randomPass = UUID.randomUUID().toString().substring(0, 8);
            String hash = passwordHasher != null ? passwordHasher.hash(randomPass) : "temporary";

            NguoiDung account = new NguoiDung(
                    null,
                    nt.hoTen(),
                    sdt,
                    hash,
                    VaiTro.NGUOI_THUE,
                    TrangThaiNguoiDung.HOAT_DONG,
                    1,
                    nt.id()
            );
            nguoiDungRepository.insert(account);

            if (nhatKy != null) {
                nhatKy.ghi(
                        nguoiDung.id(),
                        "KICH_HOAT_TAI_KHOAN_NGUOI_O_CUNG",
                        "NGUOI_THUE:" + nt.id() + ";SO_DIEN_THOAI:" + sdt,
                        null,
                        "TAI_KHOAN_HOAT_DONG"
                );
            }
        }

        return timThongTinChiTiet(hopDongId, nguoiOCungId);
    }

    /** FR-TNT-03 returns the occupant count of a room at an inclusive calendar date. */
    @Transactional(readOnly = true)
    public ThongTinSoNguoiO soLuong(Long hopDongId, LocalDate ngay, NguoiDung nguoiDung) {
        HopDongRepository.HopDongView hopDongView = layHopDongTrongPhamVi(hopDongId, nguoiDung, true);
        if (ngay == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE);
        }
        Phong phong = phongRepository.findById(hopDongView.hopDong().phongId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        int soNguoi = nguoiOCungRepository.countByPhongIdAndNgay(phong.id(), ngay);
        return new ThongTinSoNguoiO(phong.id(), phong.soPhong(), ngay, soNguoi, phong.sucChua(), soNguoi > phong.sucChua());
    }

    private ThongTinNguoiOCung timThongTinChiTiet(Long hopDongId, Long nguoiOCungId) {
        return nguoiOCungRepository.findByHopDongIdWithDetails(hopDongId).stream()
                .filter(item -> item.id().equals(nguoiOCungId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private HopDongRepository.HopDongView layHopDongTrongPhamVi(Long hopDongId, NguoiDung nguoiDung, boolean choPhepNguoiThue) {
        if (nguoiDung == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        if (nguoiDung.vaiTro() == VaiTro.NGUOI_THUE) {
            if (!choPhepNguoiThue) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            }
            HopDongRepository.HopDongView hopDongView = hopDongRepository.findViewById(hopDongId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
            if (hopDongView.hopDong().nguoiThueId() == null || !hopDongView.hopDong().nguoiThueId().equals(nguoiDung.nguoiThueId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            }
            return hopDongView;
        }

        kiemTraVaiTro(nguoiDung);
        HopDongRepository.HopDongView hopDongView = hopDongRepository.findViewById(hopDongId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, hopDongView.toaNhaId());
        return hopDongView;
    }

    private void kiemTraVaiTro(NguoiDung nguoiDung) {
        if (nguoiDung == null || (nguoiDung.vaiTro() != VaiTro.CHU
                && nguoiDung.vaiTro() != VaiTro.QUAN_LY)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }
}
