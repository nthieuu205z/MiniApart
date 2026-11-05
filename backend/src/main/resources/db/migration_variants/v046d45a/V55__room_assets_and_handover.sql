-- V55: Quß║ún l├╜ t├ái sß║ún ph├▓ng v├á bi├¬n bß║ún b├án giao, ─æß╗æi chiß║┐u khß║Ñu trß╗½ cß╗ìc (FR-BLD-09, US-07)

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
    tien_khau_tru NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    ly_do_khau_tru TEXT,
    anh_minh_chung VARCHAR(500)
);

CREATE INDEX IF NOT EXISTS idx_chi_tiet_bien_ban ON CHI_TIET_BIEN_BAN_TAI_SAN(bien_ban_id);

-- Dß╗» liß╗çu mß║½u t├ái sß║ún cho c├íc ph├▓ng ─æang c├│
INSERT INTO TAI_SAN_PHONG (phong_id, ten_tai_san, loai_tai_san, so_luong, tinh_trang, gia_tri_uoc_tinh, ghi_chu)
SELECT id, '─Éiß╗üu ho├á Casper 9000 BTU Inverter', 'DIEN_LANH', 1, 'Mß╗¢i 100%, l├ám lß║ính tß╗æt, k├¿m ─æiß╗üu khiß╗ân', 6500000.00, 'Lß║»p ─æß║╖t th├íng 01/2026'
FROM PHONG WHERE so_phong IN ('P.101', 'P.102', 'P.201', 'P.202', 'B.101', 'B.201');

INSERT INTO TAI_SAN_PHONG (phong_id, ten_tai_san, loai_tai_san, so_luong, tinh_trang, gia_tri_uoc_tinh, ghi_chu)
SELECT id, 'Tß╗º lß║ính Toshiba 180L 2 c├ính', 'DIEN_LANH', 1, 'Hoß║ít ─æß╗Öng tß╗æt, sß║ích sß║╜ kh├┤ng m├╣i', 4800000.00, '─Éß║ºy ─æß╗º khay k├¡nh chß╗ïu lß╗▒c'
FROM PHONG WHERE so_phong IN ('P.101', 'P.102', 'P.201', 'P.202', 'B.101');

INSERT INTO TAI_SAN_PHONG (phong_id, ten_tai_san, loai_tai_san, so_luong, tinh_trang, gia_tri_uoc_tinh, ghi_chu)
SELECT id, 'B├¼nh n╞░ß╗¢c n├│ng Ariston 20L', 'THIET_BI_VE_SINH', 1, 'Hoß║ít ─æß╗Öng tß╗æt, c├│ chß╗æng giß║¡t ELCB', 2800000.00, 'Bß║úo h├ánh ch├¡nh h├úng'
FROM PHONG WHERE so_phong IN ('P.101', 'P.102', 'P.201', 'P.202', 'P.301', 'B.101', 'B.201');

INSERT INTO TAI_SAN_PHONG (phong_id, ten_tai_san, loai_tai_san, so_luong, tinh_trang, gia_tri_uoc_tinh, ghi_chu)
SELECT id, 'Gi╞░ß╗¥ng ngß╗º gß╗ù MDF An C╞░ß╗¥ng 1m6 x 2m', 'NOI_THAT', 1, 'Chß║»c chß║»n, k├¿m ─æß╗çm b├┤ng ├⌐p 10cm', 3500000.00, '─Éß╗çm sß║ích bß╗ìc ga'
FROM PHONG WHERE so_phong IN ('P.101', 'P.102', 'P.201', 'P.202', 'B.101', 'B.201');

INSERT INTO TAI_SAN_PHONG (phong_id, ten_tai_san, loai_tai_san, so_luong, tinh_trang, gia_tri_uoc_tinh, ghi_chu)
SELECT id, 'Tß╗º quß║ºn ├ío 2 c├ính gß╗ù MDF', 'NOI_THAT', 1, 'Tß╗æt, bß║ún lß╗ü ├¬m', 2200000.00, 'C├│ ng─ân kho├í'
FROM PHONG WHERE so_phong IN ('P.101', 'P.102', 'P.201', 'P.202', 'B.101');

INSERT INTO TAI_SAN_PHONG (phong_id, ten_tai_san, loai_tai_san, so_luong, tinh_trang, gia_tri_uoc_tinh, ghi_chu)
SELECT id, 'B├án l├ám viß╗çc 1m2 k├¿m ghß║┐ xoay', 'NOI_THAT', 1, 'Mß╗¢i, kh├┤ng trß║ºy x╞░ß╗¢c', 1200000.00, 'Ghß║┐ l╞░ß╗¢i tho├íng'
FROM PHONG WHERE so_phong IN ('P.101', 'P.201', 'B.101');

