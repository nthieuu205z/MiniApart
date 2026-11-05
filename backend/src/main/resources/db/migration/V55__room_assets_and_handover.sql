-- V55: Quản lý tài sản phòng và biên bản bàn giao, đối chiếu khấu trừ cọc (FR-BLD-09, US-07)

CREATE TABLE IF NOT EXISTS TAI_SAN_PHONG (
    id BIGSERIAL PRIMARY KEY,
    phong_id BIGINT NOT NULL REFERENCES PHONG(id) ON DELETE CASCADE,
    ten_tai_san VARCHAR(150) NOT NULL,
    loai_tai_san VARCHAR(50) NOT NULL DEFAULT 'KHAC', -- DIEN_LANH, DIEN_TU, NOI_THAT, THIET_BI_VE_SINH, KHAC
    so_luong INT NOT NULL DEFAULT 1 CHECK (so_luong > 0),
    tinh_trang VARCHAR(255) NOT NULL DEFAULT 'HOAT_DONG_TOT',
    gia_tri_uoc_tinh NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    ghi_chu TEXT,
    ngay_lap DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_tai_san_phong_id ON TAI_SAN_PHONG(phong_id);

CREATE TABLE IF NOT EXISTS BIEN_BAN_BAN_GIAO_TAI_SAN (
    id BIGSERIAL PRIMARY KEY,
    hop_dong_id BIGINT NOT NULL REFERENCES HOP_DONG(id) ON DELETE CASCADE,
    phong_id BIGINT NOT NULL REFERENCES PHONG(id),
    loai_bien_ban VARCHAR(30) NOT NULL CHECK (loai_bien_ban IN ('NHAN_PHONG', 'TRA_PHONG')),
    ngay_thuc_hien DATE NOT NULL DEFAULT CURRENT_DATE,
    nguoi_lap_id BIGINT NOT NULL REFERENCES NGUOI_DUNG(id),
    ghi_chu_chung TEXT,
    tong_tien_khau_tru NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    tao_luc TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bien_ban_hop_dong ON BIEN_BAN_BAN_GIAO_TAI_SAN(hop_dong_id);

CREATE TABLE IF NOT EXISTS CHI_TIET_BIEN_BAN_TAI_SAN (
    id BIGSERIAL PRIMARY KEY,
    bien_ban_id BIGINT NOT NULL REFERENCES BIEN_BAN_BAN_GIAO_TAI_SAN(id) ON DELETE CASCADE,
    tai_san_id BIGINT REFERENCES TAI_SAN_PHONG(id) ON DELETE SET NULL,
    ten_tai_san VARCHAR(150) NOT NULL,
    so_luong INT NOT NULL DEFAULT 1,
    tinh_trang_luc_giao VARCHAR(255) NOT NULL,
    tinh_trang_luc_tra VARCHAR(255),
    tien_khauTru NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    ly_do_khau_tru TEXT,
    anh_minh_chung VARCHAR(500)
);

CREATE INDEX IF NOT EXISTS idx_chi_tiet_bien_ban ON CHI_TIET_BIEN_BAN_TAI_SAN(bien_ban_id);

-- Dữ liệu mẫu tài sản cho các phòng đang có (chỉ chèn khi chưa tồn tại để tách biệt và bảo vệ dữ liệu thực)
INSERT INTO TAI_SAN_PHONG (phong_id, ten_tai_san, loai_tai_san, so_luong, tinh_trang, gia_tri_uoc_tinh, ghi_chu)
SELECT id, 'Điều hoà Casper 9000 BTU Inverter', 'DIEN_LANH', 1, 'Mới 100%, làm lạnh tốt, kèm điều khiển', 6500000.00, 'Lắp đặt tháng 01/2026'
FROM PHONG p
WHERE p.so_phong IN ('P.101', 'P.102', 'P.201', 'P.202', 'B.101', 'B.201')
  AND NOT EXISTS (
      SELECT 1 FROM TAI_SAN_PHONG ts WHERE ts.phong_id = p.id AND ts.ten_tai_san = 'Điều hoà Casper 9000 BTU Inverter'
  );

INSERT INTO TAI_SAN_PHONG (phong_id, ten_tai_san, loai_tai_san, so_luong, tinh_trang, gia_tri_uoc_tinh, ghi_chu)
SELECT id, 'Tủ lạnh Toshiba 180L 2 cánh', 'DIEN_LANH', 1, 'Hoạt động tốt, sạch sẽ không mùi', 4800000.00, 'Đầy đủ khay kính chịu lực'
FROM PHONG p
WHERE p.so_phong IN ('P.101', 'P.102', 'P.201', 'P.202', 'B.101')
  AND NOT EXISTS (
      SELECT 1 FROM TAI_SAN_PHONG ts WHERE ts.phong_id = p.id AND ts.ten_tai_san = 'Tủ lạnh Toshiba 180L 2 cánh'
  );

INSERT INTO TAI_SAN_PHONG (phong_id, ten_tai_san, loai_tai_san, so_luong, tinh_trang, gia_tri_uoc_tinh, ghi_chu)
SELECT id, 'Bình nước nóng Ariston 20L', 'THIET_BI_VE_SINH', 1, 'Hoạt động tốt, có chống giật ELCB', 2800000.00, 'Bảo hành chính hãng'
FROM PHONG p
WHERE p.so_phong IN ('P.101', 'P.102', 'P.201', 'P.202', 'P.301', 'B.101', 'B.201')
  AND NOT EXISTS (
      SELECT 1 FROM TAI_SAN_PHONG ts WHERE ts.phong_id = p.id AND ts.ten_tai_san = 'Bình nước nóng Ariston 20L'
  );

INSERT INTO TAI_SAN_PHONG (phong_id, ten_tai_san, loai_tai_san, so_luong, tinh_trang, gia_tri_uoc_tinh, ghi_chu)
SELECT id, 'Giường ngủ gỗ MDF An Cường 1m6 x 2m', 'NOI_THAT', 1, 'Chắc chắn, kèm đệm bông ép 10cm', 3500000.00, 'Đệm sạch bọc ga'
FROM PHONG p
WHERE p.so_phong IN ('P.101', 'P.102', 'P.201', 'P.202', 'B.101', 'B.201')
  AND NOT EXISTS (
      SELECT 1 FROM TAI_SAN_PHONG ts WHERE ts.phong_id = p.id AND ts.ten_tai_san = 'Giường ngủ gỗ MDF An Cường 1m6 x 2m'
  );

INSERT INTO TAI_SAN_PHONG (phong_id, ten_tai_san, loai_tai_san, so_luong, tinh_trang, gia_tri_uoc_tinh, ghi_chu)
SELECT id, 'Tủ quần áo 2 cánh gỗ MDF', 'NOI_THAT', 1, 'Tốt, bản lề êm', 2200000.00, 'Có ngăn khoá'
FROM PHONG p
WHERE p.so_phong IN ('P.101', 'P.102', 'P.201', 'P.202', 'B.101')
  AND NOT EXISTS (
      SELECT 1 FROM TAI_SAN_PHONG ts WHERE ts.phong_id = p.id AND ts.ten_tai_san = 'Tủ quần áo 2 cánh gỗ MDF'
  );

INSERT INTO TAI_SAN_PHONG (phong_id, ten_tai_san, loai_tai_san, so_luong, tinh_trang, gia_tri_uoc_tinh, ghi_chu)
SELECT id, 'Bàn làm việc 1m2 kèm ghế xoay', 'NOI_THAT', 1, 'Mới, không trầy xước', 1200000.00, 'Ghế lưới thoáng'
FROM PHONG p
WHERE p.so_phong IN ('P.101', 'P.201', 'B.101')
  AND NOT EXISTS (
      SELECT 1 FROM TAI_SAN_PHONG ts WHERE ts.phong_id = p.id AND ts.ten_tai_san = 'Bàn làm việc 1m2 kèm ghế xoay'
  );
