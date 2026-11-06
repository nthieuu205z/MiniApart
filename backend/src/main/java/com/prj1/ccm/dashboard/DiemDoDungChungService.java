package com.prj1.ccm.dashboard;

import com.prj1.ccm.billing.calc.TinhMucTieuThuCongTo;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.nguoithue.NhatKyThaoTacRepository;
import com.prj1.ccm.toanha.KyThanhToan;
import com.prj1.ccm.toanha.KyThanhToanRepository;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import com.prj1.ccm.toanha.TrangThaiKy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class DiemDoDungChungService {
    private final DiemDoDungChungRepository repository;
    private final DoiSoatDienNuocService doiSoatService;
    private final CanhBaoTieuThuRepository canhBaoRepository;
    private final KyThanhToanRepository kyThanhToanRepository;
    private final PhanQuyenToaService phanQuyenToaService;
    private final NhatKyThaoTacRepository nhatKyThaoTacRepository;

    public DiemDoDungChungService(
            DiemDoDungChungRepository repository,
            DoiSoatDienNuocService doiSoatService,
            CanhBaoTieuThuRepository canhBaoRepository,
            KyThanhToanRepository kyThanhToanRepository,
            PhanQuyenToaService phanQuyenToaService,
            NhatKyThaoTacRepository nhatKyThaoTacRepository
    ) {
        this.repository = repository;
        this.doiSoatService = doiSoatService;
        this.canhBaoRepository = canhBaoRepository;
        this.kyThanhToanRepository = kyThanhToanRepository;
        this.phanQuyenToaService = phanQuyenToaService;
        this.nhatKyThaoTacRepository = nhatKyThaoTacRepository;
    }

    public List<DiemDoDungChungRepository.DiemDoRecord> layDanhSach(NguoiDung nguoiDung, Long toaNhaId) {
        kiemTraVaiTroNhanVien(nguoiDung);
        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, toaNhaId);
        return repository.findByToaNha(toaNhaId);
    }

    public List<DiemDoDungChungRepository.ChiSoDungChungRecord> layChiSoTheoKy(NguoiDung nguoiDung, Long kyId) {
        if (kyId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu định danh kỳ thanh toán.");
        }
        kiemTraVaiTroNhanVien(nguoiDung);

        KyThanhToan ky = kyThanhToanRepository.findById(kyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy kỳ thanh toán."));

        // Kiểm tra quyền trên toà nhà sở hữu kỳ này
        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, ky.toaNhaId());

        return repository.findChiSoByKy(kyId);
    }

    @Transactional
    public void ghiChiSo(NguoiDung nguoiDung, DiemDoDungChungController.YeuCauGhiChiSo yeuCau) {
        kiemTraVaiTroNhanVien(nguoiDung);

        if (yeuCau == null || yeuCau.diemDoId() == null || yeuCau.kyId() == null || yeuCau.chiSoCuoi() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu thông tin bắt buộc để ghi chỉ số.");
        }

        var diemDo = repository.findById(yeuCau.diemDoId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy điểm đo."));

        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, diemDo.toaNhaId());

        KyThanhToan ky = kyThanhToanRepository.findById(yeuCau.kyId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy kỳ thanh toán."));

        if (!ky.toaNhaId().equals(diemDo.toaNhaId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kỳ thanh toán không thuộc cùng toà nhà với điểm đo.");
        }

        if (ky.trangThai() == TrangThaiKy.DA_CHOT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kỳ thanh toán đã chốt sổ, không thể ghi chỉ số mới.");
        }

        BigDecimal chiSoDau = yeuCau.chiSoDau();
        if (chiSoDau == null) {
            Optional<BigDecimal> cuoiKyTruoc = repository.findChiSoCuoiKyTruoc(diemDo.id(), ky.id());
            if (cuoiKyTruoc.isPresent()) {
                chiSoDau = cuoiKyTruoc.get();
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ số đầu là bắt buộc đối với kỳ ghi đầu tiên của điểm đo.");
            }
        }

        if (chiSoDau.compareTo(BigDecimal.ZERO) < 0 || yeuCau.chiSoCuoi().compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ số công tơ không được là số âm.");
        }

        BigDecimal mucTieuThu;
        if (!yeuCau.coThayCongTo()) {
            if (yeuCau.chiSoCuoi().compareTo(chiSoDau) < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ số cuối không được nhỏ hơn chỉ số đầu khi không thay công tơ.");
            }
            mucTieuThu = yeuCau.chiSoCuoi().subtract(chiSoDau);
        } else {
            if (yeuCau.chiSoCuoiCongToCu() == null || yeuCau.chiSoDauCongToMoi() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng nhập đầy đủ chỉ số công tơ cũ và mới khi khai báo thay công tơ.");
            }
            if (yeuCau.chiSoCuoiCongToCu().compareTo(BigDecimal.ZERO) < 0 || yeuCau.chiSoDauCongToMoi().compareTo(BigDecimal.ZERO) < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ số thay công tơ không được là số âm.");
            }
            if (yeuCau.chiSoCuoiCongToCu().compareTo(chiSoDau) < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ số chốt công tơ cũ không được nhỏ hơn chỉ số đầu kỳ.");
            }
            if (yeuCau.chiSoCuoi().compareTo(yeuCau.chiSoDauCongToMoi()) < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ số cuối không được nhỏ hơn chỉ số khởi tạo công tơ mới.");
            }
            mucTieuThu = TinhMucTieuThuCongTo.tinh(
                    chiSoDau,
                    yeuCau.chiSoCuoi(),
                    yeuCau.chiSoCuoiCongToCu(),
                    yeuCau.chiSoDauCongToMoi()
            );
        }

        repository.luuChiSo(
                yeuCau.diemDoId(),
                yeuCau.kyId(),
                chiSoDau,
                yeuCau.chiSoCuoi(),
                mucTieuThu,
                yeuCau.coThayCongTo(),
                yeuCau.chiSoCuoiCongToCu(),
                yeuCau.chiSoDauCongToMoi(),
                nguoiDung.id(),
                yeuCau.ghiChu()
        );

        // Ghi audit log
        nhatKyThaoTacRepository.ghiTrongToa(
                diemDo.toaNhaId(),
                nguoiDung.id(),
                "GHI_CHI_SO_DUNG_CHUNG",
                "DIEM_DO_" + diemDo.id(),
                null,
                "Dau: " + chiSoDau + ", Cuoi: " + yeuCau.chiSoCuoi() + ", TieuThu: " + mucTieuThu
        );

        // Đánh giá bất thường và cập nhật/kích hoạt hoặc giải quyết cảnh báo (R05)
        DoiSoatDienNuocService.KiemTraBatThuong kqua = doiSoatService.kiemTraBatThuongDiemDo(diemDo.id(), ky.id());
        if (kqua.batThuong()) {
            canhBaoRepository.taoHoacCapNhatCanhBao(
                    diemDo.toaNhaId(),
                    diemDo.id(),
                    null,
                    ky.id(),
                    diemDo.loaiDichVu(),
                    "TIEU_THU_TANG_CAO",
                    mucTieuThu,
                    kqua.mucThamChieu(),
                    kqua.mucTang(),
                    kqua.tyLeTang(),
                    kqua.lyDo()
            );
        } else {
            canhBaoRepository.giaiQuyetCanhBaoKhiChiSoVeBinhThuong(diemDo.id(), ky.id());
        }
    }

    public DoiSoatDienNuocService.KetQuaDoiSoat doiSoat(NguoiDung nguoiDung, Long toaNhaId, Long kyId, String loaiDichVu) {
        if (toaNhaId == null || kyId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu toà nhà hoặc kỳ thanh toán.");
        }
        kiemTraVaiTroNhanVien(nguoiDung);
        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, toaNhaId);

        KyThanhToan ky = kyThanhToanRepository.findById(kyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy kỳ thanh toán."));

        if (!ky.toaNhaId().equals(toaNhaId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kỳ thanh toán không thuộc toà nhà chỉ định.");
        }

        return doiSoatService.doiSoatKy(toaNhaId, kyId, loaiDichVu);
    }

    private void kiemTraVaiTroNhanVien(NguoiDung nguoiDung) {
        if (nguoiDung == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Chưa đăng nhập.");
        }
        if (nguoiDung.vaiTro() != VaiTro.CHU && nguoiDung.vaiTro() != VaiTro.QUAN_LY && nguoiDung.vaiTro() != VaiTro.QTHT) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền truy cập thông tin công tơ dùng chung.");
        }
    }
}
