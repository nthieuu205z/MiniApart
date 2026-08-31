package com.prj1.ccm.billing;

import com.prj1.ccm.billing.calc.KetQuaTinhHoaDon;
import com.prj1.ccm.billing.calc.KhoanPhatSinh;
import com.prj1.ccm.billing.calc.LyDoBoQua;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.toanha.KyThanhToan;
import com.prj1.ccm.toanha.KyThanhToanRepository;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import com.prj1.ccm.toanha.ToaNha;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class TaoHoaDonHangLoatService {
    private final PhanQuyenToaService phanQuyenToaService;
    private final KyThanhToanRepository kyThanhToanRepository;
    private final TinhHoaDonRepository tinhHoaDonRepository;
    private final TinhHoaDonService tinhHoaDonService;
    private final Clock clock;
    private final TransactionTemplate giaoDichMoi;

    public TaoHoaDonHangLoatService(
            PhanQuyenToaService phanQuyenToaService,
            KyThanhToanRepository kyThanhToanRepository,
            TinhHoaDonRepository tinhHoaDonRepository,
            TinhHoaDonService tinhHoaDonService,
            PlatformTransactionManager transactionManager,
            Clock clock
    ) {
        this.phanQuyenToaService = phanQuyenToaService;
        this.kyThanhToanRepository = kyThanhToanRepository;
        this.tinhHoaDonRepository = tinhHoaDonRepository;
        this.tinhHoaDonService = tinhHoaDonService;
        this.clock = clock;
        this.giaoDichMoi = new TransactionTemplate(transactionManager);
        this.giaoDichMoi.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    public ThongTinTaoHoaDonHangLoat taoHoaDonHangLoat(Long toaNhaId, Long kyId, NguoiDung nguoiDung) {
        ToaNha toaNha = kiemTraQuyen(toaNhaId, nguoiDung);
        KyThanhToan kyThanhToan = kyThanhToanRepository.findByIdAndToaNhaId(kyId, toaNhaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        int soHoaDonTaoMoi = 0;
        int soHoaDonDaTonTai = 0;
        List<LyDoBoQua> cacLyDoBoQua = new ArrayList<>();

        for (TinhHoaDonRepository.HopDongTrongKy hopDong : tinhHoaDonRepository
                .layHopDongHieuLucTrongKy(toaNhaId, kyThanhToan.ngayBatDau(), kyThanhToan.ngayKetThuc())) {
            KetQuaXuLyHopDong ketQua = xuLyHopDong(toaNha, kyThanhToan, hopDong);
            switch (ketQua.loai()) {
                case TAO_MOI -> soHoaDonTaoMoi++;
                case DA_TON_TAI -> soHoaDonDaTonTai++;
                case BO_QUA -> cacLyDoBoQua.addAll(ketQua.lyDoBoQua());
            }
        }

        return ThongTinTaoHoaDonHangLoat.tu(
                kyId,
                soHoaDonTaoMoi,
                soHoaDonDaTonTai,
                demPhongBoQua(cacLyDoBoQua),
                cacLyDoBoQua
        );
    }

    private ToaNha kiemTraQuyen(Long toaNhaId, NguoiDung nguoiDung) {
        if (nguoiDung == null || (nguoiDung.vaiTro() != VaiTro.QTHT
                && nguoiDung.vaiTro() != VaiTro.CHU
                && nguoiDung.vaiTro() != VaiTro.QUAN_LY)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return phanQuyenToaService.layToaNhaNeuNguoiDungDuocXem(nguoiDung, toaNhaId);
    }

    private KetQuaXuLyHopDong xuLyHopDong(ToaNha toaNha, KyThanhToan kyThanhToan, TinhHoaDonRepository.HopDongTrongKy hopDong) {
        try {
            return giaoDichMoi.execute(status -> taoHoaDonTrongGiaoDichMoi(toaNha, kyThanhToan, hopDong));
        } catch (DataIntegrityViolationException exception) {
            if (tinhHoaDonRepository.laXungDotHoaDonTrung(exception)) {
                return KetQuaXuLyHopDong.daTonTai();
            }
            throw exception;
        }
    }

    private KetQuaXuLyHopDong taoHoaDonTrongGiaoDichMoi(
            ToaNha toaNha,
            KyThanhToan kyThanhToan,
            TinhHoaDonRepository.HopDongTrongKy hopDong
    ) {
        DuLieuTinhHoaDon duLieu = tinhHoaDonRepository.layDuLieuTinhHoaDonDeTaoHoaDon(
                toaNha.id(),
                kyThanhToan.id(),
                hopDong.hopDongId()
        );
        if (!duLieu.coTheTinh()) {
            return KetQuaXuLyHopDong.boQua(duLieu.lyDoKhongTheTinh());
        }

        KetQuaTinhHoaDon ketQua = tinhHoaDonService.tinh(toaNha.id(), duLieu.boiCanh());
        if (!ketQua.thanhCong()) {
            return KetQuaXuLyHopDong.boQua(ketQua.lyDoBoQua());
        }

        Long hoaDonId = tinhHoaDonRepository.taoHoaDon(
                taoHoaDonMoi(toaNha, kyThanhToan, hopDong, ketQua),
                ketQua
        );
        tinhHoaDonRepository.danhDauKhoanPhatSinhDaTinh(
                duLieu.boiCanh().khoanChoTinh().stream().map(KhoanPhatSinh::id).toList(),
                hoaDonId
        );
        return KetQuaXuLyHopDong.taoMoi();
    }

    private TinhHoaDonRepository.HoaDonMoi taoHoaDonMoi(
            ToaNha toaNha,
            KyThanhToan kyThanhToan,
            TinhHoaDonRepository.HopDongTrongKy hopDong,
            KetQuaTinhHoaDon ketQua
    ) {
        LocalDate ngayPhatHanh = LocalDate.now(clock);
        return new TinhHoaDonRepository.HoaDonMoi(
                maHoaDon(toaNha.maToa(), hopDong.soPhong(), kyThanhToan),
                kyThanhToan.id(),
                hopDong.hopDongId(),
                ngayPhatHanh,
                kyThanhToan.ngayKetThuc().plusDays(toaNha.soNgayHanTt()),
                ketQua.tongTien().giaTri(),
                ketQua.soNguoiOTrongKy(),
                ketQua.soHoQuyDoi(),
                ketQua.soHoQuyDoi() == null ? null : "1 ho quy doi cho moi 4 nguoi o"
        );
    }

    private String maHoaDon(String maToa, String soPhong, KyThanhToan kyThanhToan) {
        return maToa + "-" + soPhong + "-" + "%04d%02d".formatted(kyThanhToan.nam(), kyThanhToan.thang());
    }

    private int demPhongBoQua(List<LyDoBoQua> cacLyDoBoQua) {
        Set<Long> phongIds = new LinkedHashSet<>();
        for (LyDoBoQua lyDo : cacLyDoBoQua) {
            phongIds.add(lyDo.phongId());
        }
        return phongIds.size();
    }

    private record KetQuaXuLyHopDong(Loai loai, List<LyDoBoQua> lyDoBoQua) {
        private KetQuaXuLyHopDong {
            lyDoBoQua = List.copyOf(lyDoBoQua);
        }

        static KetQuaXuLyHopDong taoMoi() {
            return new KetQuaXuLyHopDong(Loai.TAO_MOI, List.of());
        }

        static KetQuaXuLyHopDong daTonTai() {
            return new KetQuaXuLyHopDong(Loai.DA_TON_TAI, List.of());
        }

        static KetQuaXuLyHopDong boQua(List<LyDoBoQua> lyDoBoQua) {
            return new KetQuaXuLyHopDong(Loai.BO_QUA, lyDoBoQua);
        }
    }

    private enum Loai {
        TAO_MOI,
        DA_TON_TAI,
        BO_QUA
    }
}
