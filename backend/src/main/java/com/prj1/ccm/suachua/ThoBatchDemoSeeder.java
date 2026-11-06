package com.prj1.ccm.suachua;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.*;
import java.util.*;

@Component
@Profile("presentation-demo")
@ConditionalOnProperty(name = "app.presentation-demo.enabled", havingValue = "true")
@Order(100)
public class ThoBatchDemoSeeder implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(ThoBatchDemoSeeder.class);
    public static final String FIXTURE_MARKER = "THO_DEMO_V2_BATCH_44";
    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final JdbcTemplate jdbcTemplate;
    private final Environment env;
    private final BaoGiaSuaChuaRepository baoGiaRepo;
    private final ThanhToanThoRepository thanhToanRepo;
    private final String expectedDatabase;
    private final String referenceDateStr;

    public ThoBatchDemoSeeder(
            JdbcTemplate jdbcTemplate,
            Environment env,
            BaoGiaSuaChuaRepository baoGiaRepo,
            ThanhToanThoRepository thanhToanRepo,
            @Value("${app.presentation-demo.expected-database:}") String expectedDatabase,
            @Value("${app.presentation-demo.reference-date:}") String referenceDateStr
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.env = env;
        this.baoGiaRepo = baoGiaRepo;
        this.thanhToanRepo = thanhToanRepo;
        this.expectedDatabase = expectedDatabase;
        this.referenceDateStr = referenceDateStr;
    }

    @Override
    public void run(String... args) {
        Long roomCount = jdbcTemplate.queryForObject("SELECT count(*) FROM PHONG", Long.class);
        if (roomCount == null || roomCount == 0) {
            log.info("Baseline PHONG is not yet seeded; skipping initial CommandLineRunner execution for ThoBatchDemoSeeder.");
            return;
        }
        LocalDate ref = referenceDateStr != null && !referenceDateStr.isBlank()
                ? LocalDate.parse(referenceDateStr)
                : LocalDate.now(VIETNAM_ZONE);
        seed(ref, expectedDatabase);
    }

    public record SeedStats(
            int tongYeuCauTruoc,
            int tongBaoGiaTruoc,
            int tongThanhToanTruoc,
            int tongYeuCauSau,
            int tongBaoGiaSau,
            int tongThanhToanSau,
            int soYeuCauMoi,
            int soBaoGiaMoi,
            int soThanhToanMoi
    ) {}

    @Transactional(rollbackFor = Exception.class)
    public SeedStats seed(LocalDate referenceDate, String expectedDatabase) {
        // 1. Safety validation
        String currentDb = jdbcTemplate.queryForObject("SELECT current_database()", String.class);
        if (Arrays.stream(env.getActiveProfiles()).anyMatch(p -> p.equalsIgnoreCase("prod") || p.equalsIgnoreCase("production"))) {
            throw new IllegalStateException("Tho demo batch seeder is forbidden with production profiles.");
        }
        if (currentDb == null || !currentDb.matches("miniapart_(demo|worker|test)_[a-z0-9_]+") ||
                (expectedDatabase != null && !expectedDatabase.isBlank() && !currentDb.equals(expectedDatabase))) {
            throw new IllegalStateException("Tho demo batch requires an explicitly confirmed demo/worker database: " + currentDb);
        }

        // Lock to avoid concurrent execution
        jdbcTemplate.queryForObject("SELECT pg_advisory_xact_lock(72620261108)", Object.class);

        int ycTruoc = demYeuCau();
        int bgTruoc = demBaoGia();
        int ttTruoc = demThanhToan();

        // 2. Idempotency check
        List<String> prior = jdbcTemplate.queryForList(
                "SELECT gia_tri_sau FROM NHAT_KY_THAO_TAC WHERE hanh_dong = 'THO_DEMO_BATCH_READY' AND doi_tuong = ?",
                String.class, FIXTURE_MARKER
        );
        if (!prior.isEmpty()) {
            log.info("Tho demo batch {} has already been seeded at {}. Skipping duplicate execution.", FIXTURE_MARKER, prior.getFirst());
            return new SeedStats(ycTruoc, bgTruoc, ttTruoc, ycTruoc, bgTruoc, ttTruoc, 0, 0, 0);
        }

        // 3. Find demo actors
        NguoiDung huy = timThoTheoSoDienThoai("0999000031");
        NguoiDung thanh = timThoTheoSoDienThoai("0999000032");

        // If Huy / Thanh not in DB, fallback to worker id 4 or existing worker
        if (huy == null) {
            huy = timThoDauTien();
        }
        if (thanh == null) {
            thanh = huy;
        }

        NguoiDung admin = timAdmin();

        // 4. Find buildings and rooms
        List<Long> buildings = jdbcTemplate.queryForList("SELECT id FROM TOA_NHA ORDER BY id ASC", Long.class);
        if (buildings.isEmpty()) {
            throw new IllegalStateException("No buildings found in database to seed repair requests.");
        }

        // Find managers
        List<Long> managerIds = jdbcTemplate.queryForList("SELECT id FROM NGUOI_DUNG WHERE vai_tro = 'QUAN_LY' ORDER BY id ASC", Long.class);
        Long defaultManagerId = managerIds.isEmpty() ? admin.id() : managerIds.getFirst();

        // Seed tickets for Huy (24) and Thanh (20)
        LocalDate ref = referenceDate != null ? referenceDate : LocalDate.now(VIETNAM_ZONE);

        taoBatchChoTho(huy, defaultManagerId, admin, buildings, ref, true);
        taoBatchChoTho(thanh, defaultManagerId, admin, buildings, ref, false);

        int ycSau = demYeuCau();
        int bgSau = demBaoGia();
        int ttSau = demThanhToan();

        jdbcTemplate.update(
                "INSERT INTO NHAT_KY_THAO_TAC (nguoi_dung_id, hanh_dong, doi_tuong, gia_tri_sau) VALUES (?, 'THO_DEMO_BATCH_READY', ?, ?)",
                admin.id(), FIXTURE_MARKER, ref.toString()
        );

        log.info("Successfully seeded Tho Batch 44! Repairs: {} -> {} (+{}), Quotes: {} -> {} (+{}), Payments: {} -> {} (+{})",
                ycTruoc, ycSau, ycSau - ycTruoc, bgTruoc, bgSau, bgSau - bgTruoc, ttTruoc, ttSau, ttSau - ttTruoc);

        return new SeedStats(ycTruoc, bgTruoc, ttTruoc, ycSau, bgSau, ttSau, ycSau - ycTruoc, bgSau - bgTruoc, ttSau - ttTruoc);
    }

    private void taoBatchChoTho(
            NguoiDung tho,
            Long defaultManagerId,
            NguoiDung admin,
            List<Long> buildings,
            LocalDate ref,
            boolean laHuy
    ) {
        // Tickets distribution per worker:
        // Huy: 5 DA_PHAN_CONG, 4 DANG_XU_LY, 3 CHO_XAC_NHAN, 10 DA_DONG (5 full, 3 part, 2 unpaid, 1 with 0 VND), 2 DA_HUY = 24
        // Thanh: 4 DA_PHAN_CONG, 5 DANG_XU_LY, 3 CHO_XAC_NHAN, 7 DA_DONG (3 full, 2 part, 2 unpaid, 1 with 0 VND), 1 DA_HUY = 20

        int soPhanCong = laHuy ? 5 : 4;
        int soDangXuLy = laHuy ? 4 : 5;
        int soChoXacNhan = 3;
        int soDaDong = laHuy ? 10 : 7;
        int soDaHuy = laHuy ? 2 : 1;

        int offset = laHuy ? 0 : 24;

        // 1. DA_PHAN_CONG
        for (int i = 0; i < soPhanCong; i++) {
            int idx = offset + i + 1;
            LocalDate ngayTao = ref.minusDays(5 + i * 3);
            Long roomId = timPhongPhuHop(buildings, idx);
            Long tenantId = timNguoiThueCuaPhong(roomId);

            Long ycId = taoYeuCau(
                    idx, roomId, tenantId, defaultManagerId, tho.id(),
                    hangMucMau(idx), moTaMau(idx), mucDoMau(idx),
                    TrangThaiYeuCau.DA_PHAN_CONG,
                    ngayTao, ngayTao.plusDays(1), ngayTao.plusDays(1), null, null, null,
                    null, null, null
            );
        }

        // 2. DANG_XU_LY (has quotes: some NHAP, some CHO_DUYET, some revised)
        for (int i = 0; i < soDangXuLy; i++) {
            int idx = offset + soPhanCong + i + 1;
            LocalDate ngayTao = ref.minusDays(10 + i * 4);
            Long roomId = timPhongPhuHop(buildings, idx);
            Long tenantId = timNguoiThueCuaPhong(roomId);

            Long ycId = taoYeuCau(
                    idx, roomId, tenantId, defaultManagerId, tho.id(),
                    hangMucMau(idx), moTaMau(idx), mucDoMau(idx),
                    TrangThaiYeuCau.DANG_XU_LY,
                    ngayTao, ngayTao.plusDays(1), ngayTao.plusDays(1), null, null, null,
                    "Đã đến khảo sát thực tế tại phòng, xác nhận lỗi như mô tả.", null, null
            );

            // Add quote variations
            if (i % 3 == 0) {
                // Draft quote
                taoBaoGia(ycId, tho.id(), 1, TrangThaiBaoGia.NHAP, "Báo giá khảo sát linh kiện thay thế", null, null, null,
                        List.of(new DongBaoGia(null, null, 1, "Vật tư thay thế", new BigDecimal("1.00"), "bộ", new BigDecimal("220000.00"), new BigDecimal("220000.00")),
                                new DongBaoGia(null, null, 2, "Công thợ sửa chữa", new BigDecimal("1.00"), "lần", new BigDecimal("80000.00"), new BigDecimal("80000.00"))));
            } else if (i % 3 == 1) {
                // Submitted quote awaiting approval
                taoBaoGia(ycId, tho.id(), 1, TrangThaiBaoGia.CHO_DUYET, "Đề xuất thay mới và bảo dưỡng", null, null, null,
                        List.of(new DongBaoGia(null, null, 1, "Bộ linh kiện mới", new BigDecimal("1.00"), "chiếc", new BigDecimal("350000.00"), new BigDecimal("350000.00")),
                                new DongBaoGia(null, null, 2, "Công thợ xử lý", new BigDecimal("1.00"), "lần", new BigDecimal("100000.00"), new BigDecimal("100000.00"))));
            } else {
                // Version 1 TU_CHOI -> Version 2 CHO_DUYET
                taoBaoGia(ycId, tho.id(), 1, TrangThaiBaoGia.TU_CHOI, "Báo giá ban đầu", "Đơn giá vật tư quá cao so với mặt bằng chung, đề nghị tối ưu lại", defaultManagerId, ngayTao.plusDays(2).atTime(10, 0).toInstant(ZoneOffset.UTC),
                        List.of(new DongBaoGia(null, null, 1, "Vật tư cao cấp", new BigDecimal("1.00"), "bộ", new BigDecimal("550000.00"), new BigDecimal("550000.00"))));
                taoBaoGia(ycId, tho.id(), 2, TrangThaiBaoGia.CHO_DUYET, "Báo giá điều chỉnh theo yêu cầu ban quản lý", null, null, null,
                        List.of(new DongBaoGia(null, null, 1, "Vật tư tiêu chuẩn", new BigDecimal("1.00"), "bộ", new BigDecimal("320000.00"), new BigDecimal("320000.00")),
                                new DongBaoGia(null, null, 2, "Công lắp đặt", new BigDecimal("1.00"), "lần", new BigDecimal("80000.00"), new BigDecimal("80000.00"))));
            }
        }

        // 3. CHO_XAC_NHAN (< 72h from reference date!)
        for (int i = 0; i < soChoXacNhan; i++) {
            int idx = offset + soPhanCong + soDangXuLy + i + 1;
            LocalDate ngayTao = ref.minusDays(3 + i);
            Instant choXacNhanLuc = ref.atStartOfDay(VIETNAM_ZONE).toInstant().minus(Duration.ofHours(16 + i * 14)); // 16h, 30h, 44h (< 72h)
            Long roomId = timPhongPhuHop(buildings, idx);
            Long tenantId = timNguoiThueCuaPhong(roomId);

            Long ycId = taoYeuCau(
                    idx, roomId, tenantId, defaultManagerId, tho.id(),
                    hangMucMau(idx), moTaMau(idx), mucDoMau(idx),
                    TrangThaiYeuCau.CHO_XAC_NHAN,
                    ngayTao, ngayTao.plusDays(1), ngayTao.plusDays(1), choXacNhanLuc, null, null,
                    "Đã kiểm tra và xử lý dứt điểm.", "Đã thay linh kiện, chạy thử nghiệm thu đạt yêu cầu.", choXacNhanLuc
            );

            // Approved quote
            BigDecimal cost = new BigDecimal(150000 + i * 80000);
            taoBaoGia(ycId, tho.id(), 1, TrangThaiBaoGia.DA_DUYET, "Báo giá sửa chữa đã được duyệt", null, defaultManagerId, ngayTao.plusDays(1).atTime(15, 0).toInstant(ZoneOffset.UTC),
                    List.of(new DongBaoGia(null, null, 1, "Vật tư & công", new BigDecimal("1.00"), "gói", cost, cost)));
            jdbcTemplate.update("UPDATE YEU_CAU_SUA_CHUA SET chi_phi = ? WHERE id = ?", cost, ycId);
        }

        // 4. DA_DONG (with payments: full, partial, unpaid, 0 VND)
        int soTraDu = laHuy ? 5 : 3;
        int soTraMotPhan = laHuy ? 3 : 2;
        int soChuaTra = 2;

        for (int i = 0; i < soDaDong; i++) {
            int idx = offset + soPhanCong + soDangXuLy + soChoXacNhan + i + 1;
            int weeksAgo = 2 + (i * 8) / soDaDong; // distributed across 2..10 weeks
            LocalDate ngayTao = ref.minusWeeks(weeksAgo).minusDays(i % 5);
            Instant dongLuc = ngayTao.plusDays(3).atTime(16, 0).toInstant(ZoneOffset.UTC);
            Long roomId = timPhongPhuHop(buildings, idx);
            Long tenantId = timNguoiThueCuaPhong(roomId);

            // Determine payment pattern
            boolean laDonKhongThuPhi = (i == soTraDu - 1); // 1 warranty order in the fully-paid group
            BigDecimal quoteTotal;
            if (laDonKhongThuPhi) {
                quoteTotal = BigDecimal.ZERO;
            } else {
                quoteTotal = new BigDecimal(180000 + (idx % 7) * 90000);
            }

            Long ycId = taoYeuCau(
                    idx, roomId, tenantId, defaultManagerId, tho.id(),
                    hangMucMau(idx), moTaMau(idx), mucDoMau(idx),
                    TrangThaiYeuCau.DA_DONG,
                    ngayTao, ngayTao.plusDays(1), ngayTao.plusDays(1), dongLuc.minus(Duration.ofHours(24)), dongLuc, null,
                    laDonKhongThuPhi ? "Sự cố trong thời hạn bảo hành kỹ thuật." : "Khảo sát hoàn tất, linh kiện tương thích.",
                    laDonKhongThuPhi ? "Đã căn chỉnh và siết lại ốc định vị, bảo hành không thu phí." : "Đã hoàn thành sửa chữa, khách hàng đã nghiệm thu hài lòng.",
                    dongLuc.minus(Duration.ofHours(24))
            );

            // Quote DA_DUYET
            Long bgId = taoBaoGia(ycId, tho.id(), 1, TrangThaiBaoGia.DA_DUYET,
                    laDonKhongThuPhi ? "Bảo hành kỹ thuật không phát sinh chi phí" : "Báo giá sửa chữa hoàn thiện",
                    null, defaultManagerId, ngayTao.plusDays(1).atTime(14, 0).toInstant(ZoneOffset.UTC),
                    List.of(new DongBaoGia(null, null, 1, laDonKhongThuPhi ? "Bảo hành kỹ thuật" : "Vật tư và nhân công",
                            new BigDecimal("1.00"), laDonKhongThuPhi ? "lần" : "gói", quoteTotal, quoteTotal)));
            jdbcTemplate.update("UPDATE YEU_CAU_SUA_CHUA SET chi_phi = ? WHERE id = ?", quoteTotal, ycId);

            // Payment logic
            if (i < soTraDu) {
                if (laDonKhongThuPhi) {
                    // Record 0 VND payment / warranty settlement
                    taoThanhToan(ycId, bgId, BigDecimal.ZERO, PhuongThucThanhToanTho.KHONG_THU_PHI, "BH-ZERO-" + idx, defaultManagerId, dongLuc.plus(Duration.ofHours(2)), "Xác nhận đối soát bảo hành, không phát sinh dòng tiền.");
                } else {
                    // Fully paid in 1 transaction
                    PhuongThucThanhToanTho pt = (i % 2 == 0) ? PhuongThucThanhToanTho.CHUYEN_KHOAN : PhuongThucThanhToanTho.TIEN_MAT;
                    taoThanhToan(ycId, bgId, quoteTotal, pt, "REF-FULL-" + idx, defaultManagerId, dongLuc.plus(Duration.ofHours(4)), "Thanh toán đủ sau nghiệm thu công việc.");
                }
            } else if (i < soTraDu + soTraMotPhan) {
                // Partial payment
                BigDecimal part = quoteTotal.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
                taoThanhToan(ycId, bgId, part, PhuongThucThanhToanTho.CHUYEN_KHOAN, "REF-PART-" + idx, defaultManagerId, dongLuc.plus(Duration.ofHours(4)), "Tạm ứng đợt 1 tiền vật tư sửa chữa.");
            } else {
                // Unpaid (no payments inserted, quote remains payable)
            }
        }

        // 5. DA_HUY
        for (int i = 0; i < soDaHuy; i++) {
            int idx = offset + soPhanCong + soDangXuLy + soChoXacNhan + soDaDong + i + 1;
            LocalDate ngayTao = ref.minusWeeks(3 + i * 2);
            Long roomId = timPhongPhuHop(buildings, idx);
            Long tenantId = timNguoiThueCuaPhong(roomId);

            taoYeuCau(
                    idx, roomId, tenantId, defaultManagerId, tho.id(),
                    hangMucMau(idx), moTaMau(idx), mucDoMau(idx),
                    TrangThaiYeuCau.DA_HUY,
                    ngayTao, ngayTao.plusDays(1), ngayTao.plusDays(1), null, null,
                    i == 0 ? "Khách hàng tự xử lý được sự cố, yêu cầu hủy đơn." : "Trùng lặp với lịch bảo dưỡng định kỳ của tòa nhà.",
                    null, null, null
            );
        }
    }

    private Long taoYeuCau(
            int stt,
            Long roomId,
            Long tenantId,
            Long managerId,
            Long workerId,
            String hangMuc,
            String moTa,
            MucDo mucDo,
            TrangThaiYeuCau trangThai,
            LocalDate ngayTao,
            LocalDate ngayTiepNhan,
            LocalDate ngayPhanCong,
            Instant choXacNhanLuc,
            Instant dongLuc,
            String lyDoHuy,
            String ghiChuKhaoSat,
            String ketQuaSuaChua,
            Instant daSuaXongLuc
    ) {
        String maYeuCau = String.format("SC-%s-%04d", ngayTao.format(java.time.format.DateTimeFormatter.ofPattern("yyyyMM")), stt + 100);
        Instant taoLuc = ngayTao.atTime(8 + (stt % 8), (stt * 7) % 60).toInstant(ZoneOffset.UTC);
        Instant tiepNhanLuc = ngayTiepNhan != null ? ngayTiepNhan.atTime(10, 0).toInstant(ZoneOffset.UTC) : null;
        Instant phanCongLuc = ngayPhanCong != null ? ngayPhanCong.atTime(14, 0).toInstant(ZoneOffset.UTC) : null;

        Long ycId = jdbcTemplate.queryForObject(
                """
                INSERT INTO YEU_CAU_SUA_CHUA (
                    ma_yeu_cau, phong_id, nguoi_tao_id, hang_muc, mo_ta, muc_do, trang_thai,
                    nguoi_tiep_nhan_id, tiep_nhan_luc, nguoi_xu_ly_id, phan_cong_luc,
                    cho_xac_nhan_luc, ly_do_huy, tao_luc, ghi_chu_khao_sat, ket_qua_sua_chua,
                    da_sua_xong_luc, dong_luc, fixture_key
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING id
                """,
                Long.class,
                maYeuCau, roomId, tenantId, hangMuc, moTa, mucDo.name(), trangThai.name(),
                managerId, tiepNhanLuc != null ? Timestamp.from(tiepNhanLuc) : null,
                workerId, phanCongLuc != null ? Timestamp.from(phanCongLuc) : null,
                choXacNhanLuc != null ? Timestamp.from(choXacNhanLuc) : null,
                lyDoHuy, Timestamp.from(taoLuc), ghiChuKhaoSat, ketQuaSuaChua,
                daSuaXongLuc != null ? Timestamp.from(daSuaXongLuc) : null,
                dongLuc != null ? Timestamp.from(dongLuc) : null,
                FIXTURE_MARKER
        );

        // Audit log for creation
        ghiAudit(tenantId, "TAO_YEU_CAU_SUA_CHUA", "YEU_CAU_SUA_CHUA:" + ycId, null, trangThai.name(), taoLuc);
        if (tiepNhanLuc != null) {
            ghiAudit(managerId, "TIEP_NHAN_YEU_CAU_SUA_CHUA", "YEU_CAU_SUA_CHUA:" + ycId, "MOI_TIEP_NHAN", "DA_TIEP_NHAN", tiepNhanLuc);
        }
        if (phanCongLuc != null) {
            ghiAudit(managerId, "PHAN_CONG_YEU_CAU_SUA_CHUA", "YEU_CAU_SUA_CHUA:" + ycId, "DA_TIEP_NHAN", "DA_PHAN_CONG", phanCongLuc);
        }
        if (trangThai == TrangThaiYeuCau.DANG_XU_LY || trangThai == TrangThaiYeuCau.CHO_XAC_NHAN || trangThai == TrangThaiYeuCau.DA_DONG) {
            ghiAudit(workerId, "BAT_DAU_XU_LY_YEU_CAU_SUA_CHUA", "YEU_CAU_SUA_CHUA:" + ycId, "DA_PHAN_CONG", "DANG_XU_LY", phanCongLuc != null ? phanCongLuc.plus(Duration.ofHours(2)) : taoLuc);
        }
        if (choXacNhanLuc != null) {
            ghiAudit(workerId, "HOAN_THANH_YEU_CAU_SUA_CHUA", "YEU_CAU_SUA_CHUA:" + ycId, "DANG_XU_LY", "CHO_XAC_NHAN", choXacNhanLuc);
        }
        if (dongLuc != null) {
            ghiAudit(managerId, "XAC_NHAN_DONG_YEU_CAU_SUA_CHUA", "YEU_CAU_SUA_CHUA:" + ycId, "CHO_XAC_NHAN", "DA_DONG", dongLuc);
        }
        if (lyDoHuy != null) {
            ghiAudit(managerId, "HUY_YEU_CAU_SUA_CHUA", "YEU_CAU_SUA_CHUA:" + ycId, "DA_PHAN_CONG", "DA_HUY", taoLuc.plus(Duration.ofDays(1)));
        }

        return ycId;
    }

    private Long taoBaoGia(
            Long ycId,
            Long workerId,
            int version,
            TrangThaiBaoGia status,
            String moTa,
            String lyDoTuChoi,
            Long managerId,
            Instant duyetLuc,
            List<DongBaoGia> dong
    ) {
        BigDecimal tong = dong.stream().map(DongBaoGia::thanhTien).reduce(BigDecimal.ZERO, BigDecimal::add);
        String maBaoGia = String.format("BG-%05d-v%d", ycId, version);

        Long bgId = jdbcTemplate.queryForObject(
                """
                INSERT INTO BAO_GIA_SUA_CHUA (
                    ma_bao_gia, yeu_cau_id, phien_ban, trang_thai, tong_tien,
                    mo_ta, ly_do_tu_choi, nguoi_tao_id, tao_luc,
                    nguoi_duyet_id, duyet_luc, fixture_key
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING id
                """,
                Long.class,
                maBaoGia, ycId, version, status.name(), tong, moTa, lyDoTuChoi,
                workerId, duyetLuc != null ? Timestamp.from(duyetLuc.minus(Duration.ofHours(3))) : Timestamp.from(Instant.now()),
                managerId, duyetLuc != null ? Timestamp.from(duyetLuc) : null,
                FIXTURE_MARKER
        );

        if (bgId != null) {
            baoGiaRepo.insertDongBaoGia(bgId, dong);
        }
        return bgId;
    }

    private Long taoThanhToan(
            Long ycId,
            Long bgId,
            BigDecimal soTien,
            PhuongThucThanhToanTho phuongThuc,
            String maThamChieu,
            Long managerId,
            Instant xacNhanLuc,
            String ghiChu
    ) {
        String maThanhToan = thanhToanRepo.sinhMaThanhToan();
        return jdbcTemplate.queryForObject(
                """
                INSERT INTO THANH_TOAN_THO (
                    ma_thanh_toan, yeu_cau_id, bao_gia_id, so_tien, phuong_thuc,
                    ma_tham_chieu, nguoi_xac_nhan_id, xac_nhan_luc, ghi_chu, fixture_key
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING id
                """,
                Long.class,
                maThanhToan, ycId, bgId, soTien, phuongThuc.name(), maThamChieu,
                managerId, Timestamp.from(xacNhanLuc), ghiChu, FIXTURE_MARKER
        );
    }

    private void ghiAudit(Long userId, String action, String target, String valBefore, String valAfter, Instant time) {
        if (userId == null) return;
        jdbcTemplate.update(
                "INSERT INTO NHAT_KY_THAO_TAC (nguoi_dung_id, hanh_dong, doi_tuong, gia_tri_truoc, gia_tri_sau, thoi_diem) VALUES (?, ?, ?, ?, ?, ?)",
                userId, action, target, valBefore, valAfter, Timestamp.from(time)
        );
    }

    private Long timPhongPhuHop(List<Long> buildings, int stt) {
        Long buildingId = buildings.get(stt % buildings.size());
        List<Long> rooms = jdbcTemplate.queryForList("SELECT id FROM PHONG WHERE toa_nha_id = ? ORDER BY id ASC", Long.class, buildingId);
        if (rooms.isEmpty()) {
            return jdbcTemplate.queryForObject("SELECT id FROM PHONG ORDER BY id ASC LIMIT 1", Long.class);
        }
        return rooms.get((stt / buildings.size()) % rooms.size());
    }

    private Long timNguoiThueCuaPhong(Long roomId) {
        List<Long> tenants = jdbcTemplate.queryForList(
                """
                SELECT COALESCE(nd.id, hd.nguoi_thue_id)
                FROM HOP_DONG hd
                LEFT JOIN NGUOI_DUNG nd ON nd.nguoi_thue_id = hd.nguoi_thue_id
                WHERE hd.phong_id = ? ORDER BY hd.id DESC LIMIT 1
                """,
                Long.class, roomId
        );
        if (!tenants.isEmpty() && tenants.getFirst() != null) {
            return tenants.getFirst();
        }
        return jdbcTemplate.queryForObject("SELECT id FROM NGUOI_DUNG WHERE vai_tro = 'NGUOI_THUE' ORDER BY id ASC LIMIT 1", Long.class);
    }

    private NguoiDung timThoTheoSoDienThoai(String phone) {
        return jdbcTemplate.query(
                "SELECT id, ho_ten, so_dien_thoai, vai_tro FROM NGUOI_DUNG WHERE so_dien_thoai = ?",
                (rs, n) -> new NguoiDung(rs.getLong("id"), rs.getString("ho_ten"), rs.getString("so_dien_thoai"), "", VaiTro.valueOf(rs.getString("vai_tro")), null, 0, null),
                phone
        ).stream().findFirst().orElse(null);
    }

    private NguoiDung timThoDauTien() {
        return jdbcTemplate.query(
                "SELECT id, ho_ten, so_dien_thoai, vai_tro FROM NGUOI_DUNG WHERE vai_tro = 'THO' ORDER BY id ASC LIMIT 1",
                (rs, n) -> new NguoiDung(rs.getLong("id"), rs.getString("ho_ten"), rs.getString("so_dien_thoai"), "", VaiTro.valueOf(rs.getString("vai_tro")), null, 0, null)
        ).stream().findFirst().orElseThrow(() -> new IllegalStateException("No worker account found in database."));
    }

    private NguoiDung timAdmin() {
        return jdbcTemplate.query(
                "SELECT id, ho_ten, so_dien_thoai, vai_tro FROM NGUOI_DUNG WHERE vai_tro = 'QTHT' ORDER BY id ASC LIMIT 1",
                (rs, n) -> new NguoiDung(rs.getLong("id"), rs.getString("ho_ten"), rs.getString("so_dien_thoai"), "", VaiTro.valueOf(rs.getString("vai_tro")), null, 0, null)
        ).stream().findFirst().orElseThrow(() -> new IllegalStateException("No admin account found in database."));
    }

    private int demYeuCau() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM YEU_CAU_SUA_CHUA", Integer.class);
        return count != null ? count : 0;
    }

    private int demBaoGia() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM BAO_GIA_SUA_CHUA", Integer.class);
        return count != null ? count : 0;
    }

    private int demThanhToan() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM THANH_TOAN_THO", Integer.class);
        return count != null ? count : 0;
    }

    private String hangMucMau(int idx) {
        String[] items = {
                "Vòi sen tắm rò rỉ", "Ổ cắm điện chập chờn", "Quạt thông gió kêu to", "Bản lề cửa sổ kẹt", "Bình nóng lạnh ngắt sớm",
                "Điều hòa không mát", "Lavabo thoát nước chậm", "Đèn trần nhấp nháy", "Khóa vân tay kẹt chốt", "Vòi xịt bồn cầu rỉ",
                "Mất nước khu bếp", "Router Wi-Fi lỗi nguồn", "Thay gioăng vòi nước", "Chập aptomat bếp", "Bảo dưỡng điều hòa",
                "Phao bồn cầu hỏng", "Bảo hành vòi sen rò", "Bơm tăng áp mini", "Khóa tay gạt inox", "Thấm nứt mép kính",
                "Sục rửa bình nóng lạnh", "Công tắc đèn hút mùi", "Mạng Wi-Fi chập chờn", "Nước nhỏ giọt điều hòa",
                "Đèn ban công hỏng", "Vòi rửa bát rò cổ", "Bình nóng lạnh nhảy ELCB", "Cửa phòng tắm kẹt", "Điều hòa chảy nước",
                "Mùi hôi thoát sàn", "Bếp từ báo lỗi E2", "Bồn cầu xả liên tục", "Mất điện phòng ngủ", "Bóng tuýp LED cháy",
                "Tay nắm cửa lỏng", "Dây cấp máy giặt nứt", "Bảo dưỡng điều hòa Panasonic", "Vòi chậu rửa mặt Inax", "Bảo hành ổ cắm âm",
                "Quạt hút mùi Sunhouse", "Rơ-le nhiệt Ariston", "Lõi khóa cửa chính", "Gioăng bồn cầu rò", "Mất nước vòi ban công"
        };
        return items[(idx - 1) % items.length];
    }

    private String moTaMau(int idx) {
        String[] desc = {
                "Nước nhỏ giọt liên tục ở khớp nối dây cấp, làm sàn nhà vệ sinh luôn ướt.",
                "Cắm phích vào phát ra tia lửa nhỏ và chập chờn, đề nghị kiểm tra nguồn.",
                "Khi bật công tắc quạt hút kêu rè rè rất to, nghi vỡ cánh hoặc khô dầu.",
                "Cửa sổ ban công bị kẹt cứng một bên bản lề khi mở đón gió.",
                "Bật bình khoảng 5 phút là tự ngắt trong khi nước chỉ hơi ấm.",
                "Bật nhiệt độ 22 độ nhưng gió thổi ra không mát, dàn lạnh kêu to.",
                "Nước trong chậu rửa mặt ứ đọng, xả nước mất 10 phút mới rút hết.",
                "Bóng đèn LED trần chớp tắt liên tục gây mỏi mắt.",
                "Màn hình khóa cửa báo pin yếu, chốt điện tử thỉnh thoảng không thụt vào.",
                "Đầu vòi xịt vệ sinh bị nứt ren nhựa, nước phun tia ngang tường.",
                "Đường cấp nước bồn rửa bát mất hoàn toàn, các khu vực khác vẫn có nước.",
                "Đèn nguồn router nháy đỏ liên tục, không phát sóng Wi-Fi.",
                "Nước rò rỉ dưới gầm chậu lavabo làm ướt tủ để đồ.",
                "Bật bếp từ nấu ăn thì aptomat tổng nhánh bếp bị nhảy liên tục.",
                "Điều hòa chạy lâu ngày bám nhiều bụi, gió yếu và có mùi ẩm mốc.",
                "Két nước bồn cầu không ngắt khi đầy, nước tràn qua ống xả tràn liên tục.",
                "Vòi sen mới thay tuần trước bị rỉ nước ở đầu gá, cần kiểm tra bảo hành.",
                "Nước lên tầng cao rất yếu, cần thay bơm tăng áp mini hỗ trợ máy giặt.",
                "Tay gạt khóa cửa phòng bị xệ, chốt gió không vào khít miệng khóa.",
                "Mưa lớn nước mưa ngấm qua khe silicone mép kính cửa sổ chảy vào sàn gỗ.",
                "Nước bình nóng lạnh có cặn vàng và mùi tanh nhẹ, cần sục cặn và thay thanh magie.",
                "Bật công tắc máy hút mùi không thấy quạt quay, đèn chiếu vẫn sáng.",
                "Sóng Wi-Fi trong phòng chập chờn, kết nối thường xuyên bị ngắt quãng.",
                "Dàn lạnh điều hòa nhỏ giọt nước xuống đệm ngủ khi bật qua đêm."
        };
        return desc[(idx - 1) % desc.length];
    }

    private MucDo mucDoMau(int idx) {
        if (idx % 7 == 0) return MucDo.KHAN_CAP;
        if (idx % 3 == 0) return MucDo.GAP;
        return MucDo.THUONG;
    }
}
