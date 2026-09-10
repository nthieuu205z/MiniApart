package com.prj1.ccm.report;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import com.prj1.ccm.toanha.ToaNha;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** FR-RPT-01 builds one consistent financial and operational overview snapshot. */
@Service
public class TongQuanBaoCaoService {
    private static final String TEN_TAT_CA_TOA = "Tất cả toà được phân quyền";
    private static final BigDecimal KHONG = BigDecimal.ZERO.setScale(2);

    private final TongQuanBaoCaoRepository repository;
    private final PhanQuyenToaService phanQuyenToaService;
    private final QuyTacBaoCaoTongQuan quyTac;
    private final Clock clock;

    public TongQuanBaoCaoService(
            TongQuanBaoCaoRepository repository,
            PhanQuyenToaService phanQuyenToaService,
            Clock clock
    ) {
        this.repository = repository;
        this.phanQuyenToaService = phanQuyenToaService;
        this.quyTac = new QuyTacBaoCaoTongQuan();
        this.clock = clock;
    }

    /** FR-RPT-01/FR-RPT-02 allows only CHU to read an aggregate report in assigned buildings. */
    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public ThongTinTongQuanBaoCao layTongQuan(
            Long toaNhaId,
            String tuNgayThamSo,
            String denNgayThamSo,
            NguoiDung nguoiDung
    ) {
        kiemTraQuyen(nguoiDung);
        KhoangNgay khoangNgay = chuanHoaKhoangNgay(tuNgayThamSo, denNgayThamSo);

        String tenToaNha = TEN_TAT_CA_TOA;
        if (toaNhaId != null) {
            ToaNha toaNha = phanQuyenToaService.layToaNhaNeuNguoiDungDuocXem(nguoiDung, toaNhaId);
            if (!repository.xacNhanPhanQuyenToa(nguoiDung.id(), toaNhaId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            }
            tenToaNha = toaNha.ten();
        }

        List<TongHopBaoCaoTheoThang> tongTheoThang = repository.findTongHopTheoThang(
                nguoiDung.id(),
                toaNhaId,
                khoangNgay.tuNgay(),
                khoangNgay.denNgay()
        );
        HienTrangBaoCao hienTrang = repository.layHienTrang(
                nguoiDung.id(),
                toaNhaId,
                LocalDate.now(clock),
                clock.instant()
        );
        CacTongTongQuan cacTong = tongHop(tongTheoThang);

        ThongTinKpiTongQuan kpi = new ThongTinKpiTongQuan(
                dinhDangTien(cacTong.doanhThu()),
                dinhDangTien(cacTong.daThu()),
                dinhDangTien(cacTong.congNo()),
                dinhDangTien(quyTac.tyLeLapDay(hienTrang.soPhongDangThue(), hienTrang.tongSoPhong())),
                hienTrang.tongSoPhong(),
                hienTrang.soPhongDangThue(),
                hienTrang.soPhongTrong(),
                hienTrang.soSuCoDangMo()
        );

        return new ThongTinTongQuanBaoCao(
                toaNhaId,
                tenToaNha,
                khoangNgay.tuNgay().toString(),
                khoangNgay.denNgay().toString(),
                OffsetDateTime.now(clock).toString(),
                !tongTheoThang.isEmpty(),
                kpi,
                lapBangTheoThang(tongTheoThang, khoangNgay)
        );
    }

    private List<ThongTinBaoCaoTheoThang> lapBangTheoThang(List<TongHopBaoCaoTheoThang> tongTheoThang, KhoangNgay khoangNgay) {
        Map<YearMonth, CacTongTongQuan> tongTheoThangTheoKy = new HashMap<>();
        for (TongHopBaoCaoTheoThang item : tongTheoThang) {
            YearMonth thang = YearMonth.from(item.thang());
            CacTongTongQuan hienTai = tongTheoThangTheoKy.getOrDefault(thang, CacTongTongQuan.rong());
            tongTheoThangTheoKy.put(thang, new CacTongTongQuan(
                    hienTai.doanhThu().add(item.doanhThuPhatHanh()),
                    hienTai.daThu().add(item.daThu()),
                    hienTai.congNo().add(item.congNo())
            ));
        }

        List<ThongTinBaoCaoTheoThang> ketQua = new ArrayList<>();
        YearMonth thang = YearMonth.from(khoangNgay.tuNgay());
        YearMonth thangCuoi = YearMonth.from(khoangNgay.denNgay());
        while (!thang.isAfter(thangCuoi)) {
            CacTongTongQuan tong = tongTheoThangTheoKy.getOrDefault(thang, CacTongTongQuan.rong());
            ketQua.add(new ThongTinBaoCaoTheoThang(
                    thang.toString(),
                    "%02d/%d".formatted(thang.getMonthValue(), thang.getYear()),
                    dinhDangTien(tong.doanhThu()),
                    dinhDangTien(tong.daThu()),
                    dinhDangTien(tong.congNo())
            ));
            thang = thang.plusMonths(1);
        }
        return ketQua;
    }

    private CacTongTongQuan tongHop(List<TongHopBaoCaoTheoThang> tongTheoThang) {
        CacTongTongQuan tong = CacTongTongQuan.rong();
        for (TongHopBaoCaoTheoThang item : tongTheoThang) {
            tong = new CacTongTongQuan(
                    tong.doanhThu().add(item.doanhThuPhatHanh()),
                    tong.daThu().add(item.daThu()),
                    tong.congNo().add(item.congNo())
            );
        }
        return tong;
    }

    private KhoangNgay chuanHoaKhoangNgay(String tuNgayThamSo, String denNgayThamSo) {
        LocalDate homNay = LocalDate.now(clock);
        LocalDate tuNgay = docNgay(tuNgayThamSo, homNay.withDayOfMonth(1));
        LocalDate denNgay = docNgay(denNgayThamSo, homNay);
        if (tuNgay.isAfter(denNgay)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "khoảng ngày không hợp lệ");
        }
        return new KhoangNgay(tuNgay, denNgay);
    }

    private LocalDate docNgay(String thamSo, LocalDate macDinh) {
        if (thamSo == null || thamSo.isBlank()) {
            return macDinh;
        }
        try {
            return LocalDate.parse(thamSo);
        } catch (DateTimeParseException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "khoảng ngày không hợp lệ", exception);
        }
    }

    private void kiemTraQuyen(NguoiDung nguoiDung) {
        if (nguoiDung == null || nguoiDung.vaiTro() != VaiTro.CHU) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private String dinhDangTien(BigDecimal giaTri) {
        return giaTri.setScale(2, RoundingMode.UNNECESSARY).toPlainString();
    }

    private record KhoangNgay(LocalDate tuNgay, LocalDate denNgay) {
    }

    private record CacTongTongQuan(BigDecimal doanhThu, BigDecimal daThu, BigDecimal congNo) {
        private static CacTongTongQuan rong() {
            return new CacTongTongQuan(KHONG, KHONG, KHONG);
        }
    }
}
