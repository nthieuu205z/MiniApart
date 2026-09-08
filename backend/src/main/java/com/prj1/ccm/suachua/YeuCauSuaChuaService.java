package com.prj1.ccm.suachua;

import com.prj1.ccm.nguoithue.AnhDinhKemService;
import com.prj1.ccm.nguoithue.NhatKyThaoTacRepository;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
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

@Service
public class YeuCauSuaChuaService {
    private static final int SO_ANH_TOI_DA = 5;
    private static final String THONG_BAO_YEU_CAU_KHONG_HOP_LE = "Yêu cầu sửa chữa không hợp lệ";
    private static final String THONG_BAO_QUA_NAM_ANH = "Mỗi yêu cầu chỉ được đính kèm tối đa 5 ảnh";

    private final YeuCauSuaChuaRepository yeuCauSuaChuaRepository;
    private final PhongRepository phongRepository;
    private final PhanQuyenToaService phanQuyenToaService;
    private final AnhDinhKemService anhDinhKemService;
    private final NhatKyThaoTacRepository nhatKyThaoTacRepository;
    private final Clock clock;

    public YeuCauSuaChuaService(
            YeuCauSuaChuaRepository yeuCauSuaChuaRepository,
            PhongRepository phongRepository,
            PhanQuyenToaService phanQuyenToaService,
            AnhDinhKemService anhDinhKemService,
            NhatKyThaoTacRepository nhatKyThaoTacRepository,
            Clock clock
    ) {
        this.yeuCauSuaChuaRepository = yeuCauSuaChuaRepository;
        this.phongRepository = phongRepository;
        this.phanQuyenToaService = phanQuyenToaService;
        this.anhDinhKemService = anhDinhKemService;
        this.nhatKyThaoTacRepository = nhatKyThaoTacRepository;
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
        return ThongTinYeuCauSuaChua.tu(daLuu, anhIds);
    }

    private void kiemTraVaiTroTao(NguoiDung nguoiDung) {
        if (nguoiDung == null
                || (nguoiDung.vaiTro() != VaiTro.CHU
                && nguoiDung.vaiTro() != VaiTro.QUAN_LY
                && nguoiDung.vaiTro() != VaiTro.NGUOI_THUE)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
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
