package com.prj1.ccm.thongbao;

import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

@Service
public class NhacTienService {
    private static final ZoneId ZONE_KINH_DOANH = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final List<Integer> MOC_NGUOI_THUE = List.of(-3, 1, 5);
    private static final int MOC_QUAN_LY = 5;
    private static final int DO_DAI_LOI_TOI_DA = 128;
    private static final String THONG_BAO_LOI_AN_TOAN = "Reminder processing failed";

    private final NhacTienRepository nhacTienRepository;
    private final ThongBaoRepository thongBaoRepository;
    private final Clock clock;
    private final TransactionTemplate giaoDichNhacTien;
    private final TransactionTemplate giaoDichGhiLoi;

    public NhacTienService(
            NhacTienRepository nhacTienRepository,
            ThongBaoRepository thongBaoRepository,
            Clock clock,
            PlatformTransactionManager transactionManager
    ) {
        this.nhacTienRepository = nhacTienRepository;
        this.thongBaoRepository = thongBaoRepository;
        this.clock = clock;
        this.giaoDichNhacTien = new TransactionTemplate(transactionManager);
        this.giaoDichNhacTien.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        this.giaoDichGhiLoi = new TransactionTemplate(transactionManager);
        this.giaoDichGhiLoi.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    /** FR-NTF-04, FR-NTF-05, and FR-NTF-07 process reminders for the current Asia/Ho_Chi_Minh business date. */
    public KetQuaXuLy xuLy() {
        return xuLy(LocalDate.now(clock.withZone(ZONE_KINH_DOANH)));
    }

    /** FR-NTF-04, FR-NTF-05, and FR-NTF-07 provide the deterministic processor/retry entry point. */
    public KetQuaXuLy xuLy(LocalDate ngayNghiepVu) {
        Objects.requireNonNull(ngayNghiepVu, "ngayNghiepVu");
        int soThanhCong = 0;
        int soThatBai = 0;
        for (Long hoaDonId : nhacTienRepository.timHoaDonDenMoc(ngayNghiepVu)) {
            try {
                List<DaGui> daGui = giaoDichNhacTien.execute(status -> xuLyMotHoaDon(hoaDonId, ngayNghiepVu));
                soThanhCong += daGui == null ? 0 : daGui.size();
            } catch (RuntimeException exception) {
                soThatBai++;
                ghiNhatKyThatBai(hoaDonId, ngayNghiepVu, exception);
            }
        }
        return new KetQuaXuLy(soThanhCong, soThatBai);
    }

    private List<DaGui> xuLyMotHoaDon(Long hoaDonId, LocalDate ngayNghiepVu) {
        NhacTienRepository.HoaDonNhacTien hoaDon = nhacTienRepository.timHoaDonKhoa(hoaDonId).orElse(null);
        if (hoaDon == null || "NHAP".equals(hoaDon.trangThai()) || "DA_HUY".equals(hoaDon.trangThai())) {
            return List.of();
        }

        BigDecimal daThu = nhacTienRepository.tongDaThu(hoaDonId);
        if (daThu.compareTo(hoaDon.tongTien()) >= 0) {
            return List.of();
        }

        Map<Long, Integer> nguoiNhanVaMoc = new LinkedHashMap<>();
        Optional<Long> taiKhoanNguoiThue = nhacTienRepository.timTaiKhoanNguoiThue(hoaDon, ngayNghiepVu);
        taiKhoanNguoiThue
                .flatMap(nguoiNhanId -> chonMoc(hoaDon, nguoiNhanId, MOC_NGUOI_THUE, ngayNghiepVu)
                        .map(moc -> new NguoiNhanVaMoc(nguoiNhanId, moc)))
                .ifPresent(nguoiNhanVaMocValue -> nguoiNhanVaMoc.put(
                        nguoiNhanVaMocValue.nguoiNhanId(),
                        nguoiNhanVaMocValue.mocNgay()
                ));

        if (!ngayNghiepVu.isBefore(hoaDon.hanThanhToan().plusDays(MOC_QUAN_LY))) {
            for (Long nguoiQuanLyId : timNguoiQuanLy(hoaDon.toaNhaId())) {
                if (chonMoc(hoaDon, nguoiQuanLyId, List.of(MOC_QUAN_LY), ngayNghiepVu).isPresent()) {
                    nguoiNhanVaMoc.putIfAbsent(nguoiQuanLyId, MOC_QUAN_LY);
                }
            }
        }

        List<DaGui> daGui = new ArrayList<>();
        Instant thoiDiem = Instant.now(clock);
        for (Map.Entry<Long, Integer> entry : nguoiNhanVaMoc.entrySet()) {
            Long nguoiNhanId = entry.getKey();
            int mocNgay = entry.getValue();
            if (!nhacTienRepository.ghiNhanMoc(hoaDonId, nguoiNhanId, mocNgay, thoiDiem)) {
                continue;
            }
            thongBaoRepository.insert(new ThongBao(
                    null,
                    null,
                    nguoiNhanId,
                    LoaiDoiTuongThongBao.HOA_DON,
                    hoaDonId,
                    "Nhắc thanh toán hoá đơn",
                    noiDung(hoaDon.maHoaDon(), mocNgay),
                    false,
                    null,
                    thoiDiem,
                    null,
                    List.of()
            ));
            nhacTienRepository.ghiNhatKyThanhCong(hoaDonId, nguoiNhanId, mocNgay, ngayNghiepVu, thoiDiem);
            daGui.add(new DaGui(nguoiNhanId, mocNgay));
        }
        return daGui;
    }

    private Optional<Integer> chonMoc(
            NhacTienRepository.HoaDonNhacTien hoaDon,
            Long nguoiNhanId,
            List<Integer> cacMoc,
            LocalDate ngayNghiepVu
    ) {
        Set<Integer> daGui = new HashSet<>(nhacTienRepository.mocDaGui(hoaDon.hoaDonId(), nguoiNhanId));
        int mocCuoiDaGui = daGui.stream().mapToInt(Integer::intValue).max().orElse(Integer.MIN_VALUE);
        return cacMoc.stream()
                .filter(moc -> !daGui.contains(moc))
                .filter(moc -> moc > mocCuoiDaGui)
                .filter(moc -> !hoaDon.hanThanhToan().plusDays(moc).isAfter(ngayNghiepVu))
                .max(Integer::compareTo);
    }

    private List<Long> timNguoiQuanLy(Long toaNhaId) {
        return thongBaoRepository.findNguoiQuanLyIdTheoToa(toaNhaId);
    }

    private String noiDung(String maHoaDon, int mocNgay) {
        return switch (mocNgay) {
            case -3 -> "Hoá đơn " + maHoaDon + " sẽ đến hạn thanh toán sau 3 ngày.";
            case 1 -> "Hoá đơn " + maHoaDon + " đã quá hạn thanh toán 1 ngày.";
            case 5 -> "Hoá đơn " + maHoaDon + " đã quá hạn thanh toán 5 ngày.";
            default -> throw new IllegalArgumentException("Mốc nhắc tiền không hợp lệ");
        };
    }

    private void ghiNhatKyThatBai(Long hoaDonId, LocalDate ngayNghiepVu, RuntimeException exception) {
        String loiDayDu = exception.getClass().getSimpleName() + ": " + THONG_BAO_LOI_AN_TOAN;
        String loi = loiDayDu.length() > DO_DAI_LOI_TOI_DA
                ? loiDayDu.substring(0, DO_DAI_LOI_TOI_DA)
                : loiDayDu;
        giaoDichGhiLoi.executeWithoutResult(status -> nhacTienRepository.ghiNhatKyThatBai(
                hoaDonId,
                ngayNghiepVu,
                Instant.now(clock),
                loi
        ));
    }

    private record DaGui(Long nguoiNhanId, int mocNgay) {
    }

    private record NguoiNhanVaMoc(Long nguoiNhanId, int mocNgay) {
    }

    public record KetQuaXuLy(int soThanhCong, int soThatBai) {
    }
}
