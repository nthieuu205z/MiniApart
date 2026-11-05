package com.prj1.ccm.toanha;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Cơ chế nạp dữ liệu mẫu (Demo Data Seeder) an toàn và idempotent:
 * 1. Mặc định TẮT; CHỈ hoạt động khi app.seed-demo=true.
 * 2. An toàn tuyệt đối với dữ liệu thực:
 *    - Không dùng ID cố định để chèn dịch vụ/bảng giá.
 *    - Không ghi đè hoặc gán đơn giá vào dịch vụ thật của người dùng.
 *    - Không gắn tài sản vào phòng thật trùng tên; chỉ gắn vào phòng có định danh [DEMO].
 * 3. Idempotent 100%: Chạy 2 lần hoặc nhiều lần không nhân bản phòng, dịch vụ, bảng giá hay tài sản.
 * 4. Transactional: Toàn bộ quá trình seed được bao bọc trong giao dịch; lỗi giữa chừng sẽ rollback toàn bộ.
 */
@Component
@Order(100)
@ConditionalOnProperty(name = "app.seed-demo", havingValue = "true")
public class DemoDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);
    private final JdbcTemplate jdbcTemplate;

    public DemoDataSeeder(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void run(String... args) {
        log.info("Kích hoạt nạp dữ liệu mẫu DemoDataSeeder (app.seed-demo=true)...");
        seedToaNhaNeuChuaCo();
        seedDichVuVaBangGia();
        seedPhongMau();
        seedTaiSanMau();
        seedCauHinhBenAVaMauHopDongNeuChuaCo();
        log.info("Hoàn tất nạp dữ liệu mẫu an toàn và idempotent.");
    }

    public void seedToaNhaNeuChuaCo() {
        // Đảm bảo toà nhà 1 và toà nhà 2 tồn tại để liên kết
        jdbcTemplate.update("""
                INSERT INTO TOA_NHA (id, ma_toa, ten, dia_chi, so_tang, ngay_chot_so, so_ngay_han_tt, tk_ngan_hang, nguong_that_thoat, ma_ngan_hang)
                VALUES 
                    (1, 'TN-A', 'Toà A — Ngõ Hoà Bình', 'Số 12 ngõ 34 đường Hoà Bình, Phường Mẫu, Hà Nội', 6, 25, 7, '9704000000000101', 150000.00, '970422'),
                    (2, 'TN-B', 'Toà B — Bến Vân Đồn', 'Số 8 đường Bến Vân Đồn, Phường Mẫu, Thành phố Hồ Chí Minh', 5, 26, 7, '9704000000000202', 175000.00, '970422')
                ON CONFLICT (id) DO NOTHING
                """);
        jdbcTemplate.execute("SELECT setval('TOA_NHA_id_seq', (SELECT COALESCE(MAX(id), 1) FROM TOA_NHA))");
    }

    public void seedDichVuVaBangGia() {
        record MauDichVu(String ten, String cachTinh, String cheDoGia, String donVi, boolean laDien, BigDecimal donGia) {}

        List<MauDichVu> danhSach = List.of(
                new MauDichVu("Điện sinh hoạt", "THEO_CHI_SO", "CO_DINH", "kWh", true, new BigDecimal("3800.00")),
                new MauDichVu("Nước sinh hoạt", "THEO_CHI_SO", "CO_DINH", "m³", false, new BigDecimal("28000.00")),
                new MauDichVu("Internet tốc độ cao", "CO_DINH", "CO_DINH", "phòng", false, new BigDecimal("100000.00")),
                new MauDichVu("Vệ sinh & thang máy", "THEO_NGUOI", "CO_DINH", "người", false, new BigDecimal("50000.00")),
                new MauDichVu("Gửi xe máy", "THEO_SO_LUONG", "CO_DINH", "xe", false, new BigDecimal("120000.00"))
        );

        for (MauDichVu m : danhSach) {
            // 1. Kiểm tra xem đã tồn tại bất kỳ dịch vụ nào cùng tên ở toà 1 chưa (kể cả 1 hay nhiều bản ghi)
            List<Long> existingIds = jdbcTemplate.query(
                    "SELECT id FROM DICH_VU WHERE toa_nha_id = 1 AND ten = ?",
                    (rs, rowNum) -> rs.getLong("id"),
                    m.ten
            );

            // 2. Nếu đã tồn tại dịch vụ cùng tên:
            // BỎ QUA HOÀN TOÀN: không gán giá demo, không sửa thuộc tính, không suy đoán nguồn gốc
            // Tuyệt đối không thay đổi bất kỳ bảng giá nào của dịch vụ đã có (dù đã có giá, có giá tương lai, hay chưa có giá)
            if (!existingIds.isEmpty()) {
                log.info("Dịch vụ '{}' đã tồn tại ở toà 1. Bỏ qua hoàn toàn để bảo vệ dữ liệu, không chèn bảng giá demo.", m.ten);
                continue;
            }

            // 3. Chỉ khi CHƯA TỒN TẠI bất kỳ dịch vụ nào cùng tên mới tạo dịch vụ demo mới và gán giá ban đầu
            Long dichVuId = jdbcTemplate.queryForObject("""
                    INSERT INTO DICH_VU (toa_nha_id, ten, cach_tinh, che_do_gia, don_vi, la_dien, dang_su_dung)
                    VALUES (1, ?, ?, ?, ?, ?, TRUE)
                    RETURNING id
                    """,
                    Long.class,
                    m.ten, m.cachTinh, m.cheDoGia, m.donVi, m.laDien
            );

            jdbcTemplate.update("""
                    INSERT INTO BANG_GIA (dich_vu_id, don_gia, ngay_hieu_luc)
                    VALUES (?, ?, '2026-01-01')
                    """,
                    dichVuId, m.donGia
            );
        }
    }

    public void seedPhongMau() {
        // Chỉ chèn các phòng mẫu khi chưa có phòng trùng (toa_nha_id, so_phong)
        // Tất cả phòng mẫu đều có tiền tố [DEMO] trong mô tả để định danh nguồn gốc rõ ràng
        jdbcTemplate.update("""
                INSERT INTO PHONG (toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai, tien_ich, mo_ta)
                SELECT v.toa_nha_id, v.so_phong, v.tang, v.dien_tich, v.suc_chua, v.gia_thue_mac_dinh, v.loai_phong, v.trang_thai, v.tien_ich, v.mo_ta
                FROM (VALUES
                    (1, 'P.101', 1, 28.5, 2, 3800000.00, 'Studio khép kín', 'TRONG', 
                     'Điều hoà inverter, Nóng lạnh, Tủ lạnh 180L, Giường đệm 1m6x2m, Tủ quần áo, Bàn làm việc, Cửa sổ thoáng',
                     '[DEMO] Phòng tầng 1 thuận tiện đi lại, đầy đủ đồ cơ bản chỉ việc xách vali về ở. Vệ sinh khép kín sạch sẽ.'),
                    (1, 'P.102', 1, 32.0, 3, 4200000.00, '1 ngủ 1 khách', 'DANG_THUE', 
                     'Điều hoà, Nóng lạnh, Tủ lạnh, Máy giặt riêng, Giường đệm, Sofa, Kệ bếp, Ban công riêng',
                     '[DEMO] Căn hộ 1 phòng ngủ tách biệt phòng khách, có ban công phơi đồ riêng, máy giặt riêng.'),
                    (1, 'P.201', 2, 30.0, 2, 4000000.00, 'Studio ban công', 'TRONG', 
                     'Điều hoà, Nóng lạnh, Tủ lạnh, Giường đệm cao cấp, Tủ âm tường, Bàn trà, Ban công view thoáng, Khóa vân tay',
                     '[DEMO] Phòng tầng 2 view đẹp, ban công rộng đón ánh sáng tự nhiên. Khóa cửa vân tay bảo mật cao.'),
                    (1, 'P.202', 2, 26.0, 2, 3600000.00, 'Studio tiêu chuẩn', 'TRONG', 
                     'Điều hoà, Nóng lạnh, Giường đệm, Tủ quần áo, Kệ bếp nấu ăn, Cửa sổ giếng trời',
                     '[DEMO] Phòng nhỏ gọn ấm cúng, thiết kế tối ưu công năng, bếp nấu tiện lợi, phù hợp sinh viên hoặc người đi làm.'),
                    (1, 'P.301', 3, 35.0, 3, 4800000.00, 'Gác lửng Duplex', 'TRONG', 
                     'Điều hoà 2 chiều, Nóng lạnh, Tủ lạnh 2 cánh, Máy giặt riêng, Sofa bed, Tủ bếp trên dưới, Ban công thoáng mát',
                     '[DEMO] Căn hộ duplex gác lửng hiện đại, trần cao thoáng đãng, khu ngủ tách biệt bên trên, tiếp khách bên dưới.'),
                    (1, 'P.302', 3, 28.0, 2, 3900000.00, 'Studio khép kín', 'DA_COC', 
                     'Điều hoà, Nóng lạnh, Tủ lạnh, Giường đệm, Tủ gỗ, Bàn ăn, Cửa sổ lớn',
                     '[DEMO] Phòng tầng 3 yên tĩnh, thoáng gió, đầy đủ tiện nghi.'),
                    (2, 'B.101', 1, 25.0, 2, 4500000.00, 'Studio hiện đại', 'TRONG', 
                     'Máy lạnh Daikin, Máy nước nóng, Tủ lạnh, Tủ quần áo gỗ, Bếp từ, Cửa sổ kính lớn, Thang máy, Khóa thẻ từ',
                     '[DEMO] Căn hộ dịch vụ trung tâm, gần cầu Ông Lãnh, tiện đi lại Quận 1. Giờ giấc tự do, không chung chủ.'),
                    (2, 'B.201', 2, 34.0, 3, 5500000.00, '1 phòng ngủ riêng', 'TRONG', 
                     '2 Máy lạnh, Nóng lạnh, Tủ lạnh lớn, Máy giặt riêng, Giường đệm, Bàn ăn, Sofa, Ban công thoáng',
                     '[DEMO] Căn 1PN rộng rãi tầng 2, ánh sáng tràn ngập, ban công nhìn ra đường nội khu yên tĩnh.')
                ) AS v(toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai, tien_ich, mo_ta)
                WHERE NOT EXISTS (
                    SELECT 1 FROM PHONG p WHERE p.toa_nha_id = v.toa_nha_id AND p.so_phong = v.so_phong
                )
                """);
    }

    public void seedTaiSanMau() {
        // CHỈ gắn tài sản vào các phòng mẫu (có định danh [DEMO] trong mo_ta)
        // VÀ sử dụng NOT EXISTS để chạy nhiều lần không bao giờ bị nhân bản tài sản
        jdbcTemplate.update("""
                INSERT INTO TAI_SAN_PHONG (phong_id, ten_tai_san, loai_tai_san, so_luong, tinh_trang, gia_tri_uoc_tinh, ghi_chu)
                SELECT p.id, d.ten_tai_san, d.loai_tai_san, d.so_luong, d.tinh_trang, d.gia_tri_uoc_tinh, d.ghi_chu
                FROM (VALUES
                    ('P.101', 'Điều hoà Casper 9000 BTU Inverter', 'DIEN_LANH', 1, 'Mới 100%, làm lạnh tốt, kèm điều khiển', 6500000.00, '[DEMO-SEED] Lắp đặt tháng 01/2026'),
                    ('P.101', 'Tủ lạnh Toshiba 180L 2 cánh', 'DIEN_LANH', 1, 'Hoạt động tốt, sạch sẽ không mùi', 4800000.00, '[DEMO-SEED] Đầy đủ khay kính chịu lực'),
                    ('P.102', 'Điều hoà Casper 9000 BTU Inverter', 'DIEN_LANH', 1, 'Mới 100%, làm lạnh tốt, kèm điều khiển', 6500000.00, '[DEMO-SEED] Lắp đặt tháng 01/2026'),
                    ('P.201', 'Điều hoà Casper 9000 BTU Inverter', 'DIEN_LANH', 1, 'Mới 100%, làm lạnh tốt, kèm điều khiển', 6500000.00, '[DEMO-SEED] Lắp đặt tháng 01/2026'),
                    ('P.202', 'Điều hoà Casper 9000 BTU Inverter', 'DIEN_LANH', 1, 'Mới 100%, làm lạnh tốt, kèm điều khiển', 6500000.00, '[DEMO-SEED] Lắp đặt tháng 01/2026'),
                    ('P.202', 'Tủ lạnh Toshiba 180L 2 cánh', 'DIEN_LANH', 1, 'Hoạt động tốt, sạch sẽ không mùi', 4800000.00, '[DEMO-SEED] Đầy đủ khay kính chịu lực'),
                    ('B.101', 'Máy lạnh Daikin 9000 BTU', 'DIEN_LANH', 1, 'Mới 100%, kèm điều khiển', 7200000.00, '[DEMO-SEED] Lắp đặt tháng 01/2026'),
                    ('B.201', 'Máy lạnh Daikin 9000 BTU', 'DIEN_LANH', 1, 'Mới 100%, kèm điều khiển', 7200000.00, '[DEMO-SEED] Lắp đặt tháng 01/2026')
                ) AS d(so_phong, ten_tai_san, loai_tai_san, so_luong, tinh_trang, gia_tri_uoc_tinh, ghi_chu)
                JOIN PHONG p ON p.so_phong = d.so_phong AND p.mo_ta LIKE '[DEMO]%'
                WHERE NOT EXISTS (
                    SELECT 1 FROM TAI_SAN_PHONG ts 
                    WHERE ts.phong_id = p.id AND ts.ten_tai_san = d.ten_tai_san
                )
                """);
    }

    public void seedCauHinhBenAVaMauHopDongNeuChuaCo() {
        try {
            jdbcTemplate.update("""
                    INSERT INTO CAU_HINH_BEN_A_TOA_NHA (
                        toa_nha_id, loai_chu_the, ten_chu_the, ma_so_dinh_danh, dia_chi_lien_he,
                        so_dien_thoai, email, ho_ten_nguoi_ky, chuc_vu_nguoi_ky, tu_cach_ky,
                        so_tai_khoan, ten_ngan_hang, chu_tai_khoan
                    ) VALUES 
                        (1, 'CA_NHAN', 'Chủ sở hữu mẫu Toà A', '001090000002', 'Số 12 ngõ 34 đường Hoà Bình, Phường Mẫu, Hà Nội',
                         '0900000002', 'chusohootoaA@miniapart.local', 'Chủ sở hữu mẫu', 'Chủ sở hữu', 'CHU_SO_HUU',
                         '9704000000000101', 'Ngân hàng TMCP Quân Đội (MB)', 'CHU SO HUU TOA A'),
                        (2, 'CA_NHAN', 'Chủ sở hữu mẫu Toà B', '001090000002', 'Số 8 đường Bến Vân Đồn, Phường Mẫu, TP. Hồ Chí Minh',
                         '0900000002', 'chusohootoaB@miniapart.local', 'Chủ sở hữu mẫu', 'Chủ sở hữu', 'CHU_SO_HUU',
                         '9704000000000202', 'Ngân hàng TMCP Ngoại Thương (Vietcombank)', 'CHU SO HUU TOA B')
                    ON CONFLICT (toa_nha_id) DO NOTHING
                    """);

            String mauVanBan = MauHopDongChuan.NOI_DUNG_DIEU_KHOAN_CHUAN;

            jdbcTemplate.update("""
                    INSERT INTO MAU_HOP_DONG (
                        toa_nha_id, ten_mau, phien_ban, trang_thai, tieu_de, noi_dung_dieu_khoan, nguoi_tao_id
                    ) VALUES 
                        (1, 'Mẫu hợp đồng chuẩn Toà A (12 điều khoản)', 1, 'PUBLISHED', 'HỢP ĐỒNG THUÊ PHÒNG', ?, 1),
                        (2, 'Mẫu hợp đồng chuẩn Toà B (12 điều khoản)', 1, 'PUBLISHED', 'HỢP ĐỒNG THUÊ PHÒNG', ?, 1)
                    ON CONFLICT (toa_nha_id, phien_ban) DO NOTHING
                    """, mauVanBan, mauVanBan);
        } catch (Exception ex) {
            log.warn("Bỏ qua seed Bên A/Mẫu HĐ demo nếu bảng chưa tồn tại: {}", ex.getMessage());
        }
    }
}
