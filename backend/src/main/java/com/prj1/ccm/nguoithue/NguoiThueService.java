package com.prj1.ccm.nguoithue;

import com.prj1.ccm.auth.SoDienThoaiKey;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class NguoiThueService {
    private static final String THONG_BAO_YEU_CAU_KHONG_HOP_LE = "Yêu cầu không hợp lệ";
    private static final String CANH_BAO_TRUNG_SO_GIAY_TO = "Số giấy tờ đang trùng với hồ sơ khác.";
    private static final String HANH_DONG_XEM_SO_GIAY_TO = "XEM_SO_GIAY_TO_NGUOI_THUE";

    private final NguoiThueRepository nguoiThueRepository;
    private final NhatKyThaoTacRepository nhatKyThaoTacRepository;

    public NguoiThueService(NguoiThueRepository nguoiThueRepository, NhatKyThaoTacRepository nhatKyThaoTacRepository) {
        this.nguoiThueRepository = nguoiThueRepository;
        this.nhatKyThaoTacRepository = nhatKyThaoTacRepository;
    }

    @Transactional(readOnly = true)
    public List<ThongTinNguoiThue> danhSach(String q, NguoiDung nguoiDung) {
        kiemTraQuyen(nguoiDung);
        List<NguoiThue> nguoiThue = (q == null || q.isBlank())
                ? nguoiThueRepository.findAll()
                : nguoiThueRepository.search(q);
        return nguoiThue.stream()
                .map(item -> ThongTinNguoiThue.tuDanhSach(item, canhBaoCho(item.id(), item.soGiayTo())))
                .toList();
    }

    @Transactional
    public ThongTinNguoiThue tao(YeuCauNguoiThue yeuCau, NguoiDung nguoiDung) {
        kiemTraQuyen(nguoiDung);
        NguoiThue nguoiThue = chuanHoa(null, yeuCau);
        Long id = nguoiThueRepository.insert(nguoiThue);
        NguoiThue daLuu = layNguoiThue(id);
        return ThongTinNguoiThue.tuDanhSach(daLuu, canhBaoCho(daLuu.id(), daLuu.soGiayTo()));
    }

    @Transactional
    public ThongTinNguoiThue capNhat(Long nguoiThueId, YeuCauNguoiThue yeuCau, NguoiDung nguoiDung) {
        kiemTraQuyen(nguoiDung);
        layNguoiThue(nguoiThueId);
        NguoiThue capNhat = chuanHoa(nguoiThueId, yeuCau);
        nguoiThueRepository.update(capNhat);
        NguoiThue daLuu = layNguoiThue(nguoiThueId);
        return ThongTinNguoiThue.tuDanhSach(daLuu, canhBaoCho(daLuu.id(), daLuu.soGiayTo()));
    }

    @Transactional
    public ThongTinNguoiThue chiTiet(Long nguoiThueId, NguoiDung nguoiDung) {
        kiemTraQuyen(nguoiDung);
        NguoiThue nguoiThue = layNguoiThue(nguoiThueId);
        nhatKyThaoTacRepository.ghi(
                nguoiDung.id(),
                HANH_DONG_XEM_SO_GIAY_TO,
                "NGUOI_THUE:" + nguoiThue.id(),
                null,
                "soGiayToChe=" + SoGiayToFormatter.che(nguoiThue.soGiayTo())
        );
        return ThongTinNguoiThue.tuChiTiet(nguoiThue, canhBaoCho(nguoiThue.id(), nguoiThue.soGiayTo()));
    }

    private void kiemTraQuyen(NguoiDung nguoiDung) {
        if (nguoiDung == null || (nguoiDung.vaiTro() != VaiTro.QTHT
                && nguoiDung.vaiTro() != VaiTro.CHU
                && nguoiDung.vaiTro() != VaiTro.QUAN_LY)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private NguoiThue layNguoiThue(Long nguoiThueId) {
        return nguoiThueRepository.findById(nguoiThueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private NguoiThue chuanHoa(Long nguoiThueId, YeuCauNguoiThue yeuCau) {
        if (yeuCau == null
                || yeuCau.hoTen() == null || yeuCau.hoTen().isBlank()
                || yeuCau.ngaySinh() == null
                || yeuCau.soDienThoai() == null || yeuCau.soDienThoai().isBlank()
                || yeuCau.soGiayTo() == null || yeuCau.soGiayTo().isBlank()
                || yeuCau.queQuan() == null || yeuCau.queQuan().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE);
        }

        String soDienThoai = SoDienThoaiKey.tu(yeuCau.soDienThoai());
        String soGiayTo = SoGiayToFormatter.chuanHoa(yeuCau.soGiayTo());
        if (soDienThoai.isBlank() || soGiayTo.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE);
        }

        return new NguoiThue(
                nguoiThueId,
                yeuCau.hoTen().trim(),
                yeuCau.ngaySinh(),
                soDienThoai,
                soGiayTo,
                yeuCau.queQuan().trim(),
                null
        );
    }

    private List<String> canhBaoCho(Long nguoiThueId, String soGiayTo) {
        if (nguoiThueRepository.existsBySoGiayToExceptId(soGiayTo, nguoiThueId)) {
            return List.of(CANH_BAO_TRUNG_SO_GIAY_TO);
        }
        return List.of();
    }
}
