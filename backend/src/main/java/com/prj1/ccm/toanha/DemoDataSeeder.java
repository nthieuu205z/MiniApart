package com.prj1.ccm.toanha;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Cơ chế nạp dữ liệu mẫu (Demo Data Seeder) chủ động.
 * CHỈ hoạt động khi cấu hình explicitly bật: app.seed-demo=true hoặc profile demo.
 * Trong môi trường production (mặc định app.seed-demo=false), seeder này hoàn toàn không chạy,
 * bảo vệ 100% dữ liệu thực và cấu trúc phòng/dịch vụ thực tế của khách hàng.
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
    public void run(String... args) {
        log.info("Kích hoạt nạp dữ liệu mẫu DemoDataSeeder (app.seed-demo=true)...");
        seedDichVuToaA();
        seedBangGiaDichVu();
        seedPhongMau();
        seedTaiSanMau();
        log.info("Hoàn tất nạp dữ liệu mẫu an toàn.");
    }

    public void seedDichVuToaA() {
        jdbcTemplate.update("""
                INSERT INTO DICH_VU (id, toa_nha_id, ten, cach_tinh, che_do_gia, don_vi, la_dien, dang_su_dung)
                VALUES 
                    (1, 1, 'Điện sinh hoạt', 'THEO_CHI_SO', 'CO_DINH', 'kWh', TRUE, TRUE),
                    (2, 1, 'Nước sinh hoạt', 'THEO_CHI_SO', 'CO_DINH', 'm³', FALSE, TRUE),
                    (3, 1, 'Internet tốc độ cao', 'CO_DINH', 'CO_DINH', 'phòng', FALSE, TRUE),
                    (4, 1, 'Vệ sinh & thang máy', 'THEO_NGUOI', 'CO_DINH', 'người', FALSE, TRUE),
                    (5, 1, 'Gửi xe máy', 'THEO_SO_LUONG', 'CO_DINH', 'xe', FALSE, TRUE)
                ON CONFLICT (id) DO NOTHING
                """);
        jdbcTemplate.execute("SELECT setval('DICH_VU_id_seq', (SELECT COALESCE(MAX(id), 1) FROM DICH_VU))");
    }

    public void seedBangGiaDichVu() {
        jdbcTemplate.update("""
                INSERT INTO BANG_GIA (id, dich_vu_id, don_gia, ngay_hieu_luc)
                VALUES
                    (1, 1, 3800.00, '2026-01-01'),
                    (2, 2, 28000.00, '2026-01-01'),
                    (3, 3, 100000.00, '2026-01-01'),
                    (4, 4, 50000.00, '2026-01-01'),
                    (5, 5, 120000.00, '2026-01-01')
                ON CONFLICT (id) DO NOTHING
                """);
        jdbcTemplate.execute("SELECT setval('BANG_GIA_id_seq', (SELECT COALESCE(MAX(id), 1) FROM BANG_GIA))");
    }

    public void seedPhongMau() {
        // Sử dụng ON CONFLICT (toa_nha_id, so_phong) DO NOTHING để tuyệt đối không crash nếu phòng đã tồn tại
        jdbcTemplate.update("""
                INSERT INTO PHONG (toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai, tien_ich, mo_ta)
                VALUES
                    (1, 'P.101', 1, 28.5, 2, 3800000.00, 'Studio khép kín', 'TRONG', 
                     'Điều hoà inverter, Nóng lạnh, Tủ lạnh 180L, Giường đệm 1m6x2m, Tủ quần áo, Bàn làm việc, Cửa sổ thoáng',
                     'Phòng tầng 1 thuận tiện đi lại, đầy đủ đồ cơ bản chỉ việc xách vali về ở. Vệ sinh khép kín sạch sẽ.'),
                    (1, 'P.102', 1, 32.0, 3, 4200000.00, '1 ngủ 1 khách', 'DANG_THUE', 
                     'Điều hoà, Nóng lạnh, Tủ lạnh, Máy giặt riêng, Giường đệm, Sofa, Kệ bếp, Ban công riêng',
                     'Căn hộ 1 phòng ngủ tách biệt phòng khách, có ban công phơi đồ riêng, máy giặt riêng.'),
                    (1, 'P.201', 2, 30.0, 2, 4000000.00, 'Studio ban công', 'TRONG', 
                     'Điều hoà, Nóng lạnh, Tủ lạnh, Giường đệm cao cấp, Tủ âm tường, Bàn trà, Ban công view thoáng, Khóa vân tay',
                     'Phòng tầng 2 view đẹp, ban công rộng đón ánh sáng tự nhiên. Khóa cửa vân tay bảo mật cao.'),
                    (1, 'P.202', 2, 26.0, 2, 3600000.00, 'Studio tiêu chuẩn', 'TRONG', 
                     'Điều hoà, Nóng lạnh, Giường đệm, Tủ quần áo, Kệ bếp nấu ăn, Cửa sổ giếng trời',
                     'Phòng nhỏ gọn ấm cúng, thiết kế tối ưu công năng, bếp nấu tiện lợi, phù hợp sinh viên hoặc người đi làm.'),
                    (1, 'P.301', 3, 35.0, 3, 4800000.00, 'Gác lửng Duplex', 'TRONG', 
                     'Điều hoà 2 chiều, Nóng lạnh, Tủ lạnh 2 cánh, Máy giặt riêng, Sofa bed, Tủ bếp trên dưới, Ban công thoáng mát',
                     'Căn hộ duplex gác lửng hiện đại, trần cao thoáng đãng, khu ngủ tách biệt bên trên, tiếp khách bên dưới.'),
                    (1, 'P.302', 3, 28.0, 2, 3900000.00, 'Studio khép kín', 'DA_COC', 
                     'Điều hoà, Nóng lạnh, Tủ lạnh, Giường đệm, Tủ gỗ, Bàn ăn, Cửa sổ lớn',
                     'Phòng tầng 3 yên tĩnh, thoáng gió, đầy đủ tiện nghi.'),
                    (2, 'B.101', 1, 25.0, 2, 4500000.00, 'Studio hiện đại', 'TRONG', 
                     'Máy lạnh Daikin, Máy nước nóng, Tủ lạnh, Tủ quần áo gỗ, Bếp từ, Cửa sổ kính lớn, Thang máy, Khóa thẻ từ',
                     'Căn hộ dịch vụ trung tâm, gần cầu Ông Lãnh, tiện đi lại Quận 1. Giờ giấc tự do, không chung chủ.'),
                    (2, 'B.201', 2, 34.0, 3, 5500000.00, '1 phòng ngủ riêng', 'TRONG', 
                     '2 Máy lạnh, Nóng lạnh, Tủ lạnh lớn, Máy giặt riêng, Giường đệm, Bàn ăn, Sofa, Ban công thoáng',
                     'Căn 1PN rộng rãi tầng 2, ánh sáng tràn ngập, ban công nhìn ra đường nội khu yên tĩnh.')
                ON CONFLICT (toa_nha_id, so_phong) DO NOTHING
                """);
        jdbcTemplate.execute("SELECT setval('PHONG_id_seq', (SELECT COALESCE(MAX(id), 1) FROM PHONG))");
    }

    public void seedTaiSanMau() {
        jdbcTemplate.update("""
                INSERT INTO TAI_SAN_PHONG (phong_id, ten_tai_san, loai_tai_san, so_luong, tinh_trang, gia_tri_uoc_tinh, ghi_chu)
                SELECT id, 'Điều hoà Casper 9000 BTU Inverter', 'DIEN_LANH', 1, 'Mới 100%, làm lạnh tốt, kèm điều khiển', 6500000.00, 'Lắp đặt tháng 01/2026'
                FROM PHONG WHERE so_phong IN ('P.101', 'P.102', 'P.201', 'P.202') AND toa_nha_id = 1
                ON CONFLICT DO NOTHING
                """);
        jdbcTemplate.update("""
                INSERT INTO TAI_SAN_PHONG (phong_id, ten_tai_san, loai_tai_san, so_luong, tinh_trang, gia_tri_uoc_tinh, ghi_chu)
                SELECT id, 'Tủ lạnh Toshiba 180L 2 cánh', 'DIEN_LANH', 1, 'Hoạt động tốt, sạch sẽ không mùi', 4800000.00, 'Đầy đủ khay kính chịu lực'
                FROM PHONG WHERE so_phong IN ('P.101', 'P.102', 'P.201', 'P.202') AND toa_nha_id = 1
                ON CONFLICT DO NOTHING
                """);
    }
}

