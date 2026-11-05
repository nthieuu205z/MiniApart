-- V58: Hoàn thiện hồ sơ hợp đồng thuê phòng MiniApart (Pure DDL)
-- Bao gồm:
-- 1. Bổ sung thông tin định danh và địa chỉ đầy đủ cho NGUOI_THUE
-- 2. Cấu hình thông tin pháp lý Bên A (Bên cho thuê) theo toà nhà
-- 3. Mẫu 10 điều khoản hợp đồng chuẩn mực theo toà nhà (quản lý phiên bản)
-- 4. Bảng hồ sơ hợp đồng (HOP_DONG_HO_SO) lưu snapshot bất biến, phân tách vòng đời tài liệu (DRAFT, DA_CHOT, DA_GHI_NHAN_KY)
-- 5. Bảng phụ lục sửa đổi (HOP_DONG_PHU_LUC) cho các thay đổi sau chốt

-- 1. Bổ sung cột cho NGUOI_THUE
ALTER TABLE NGUOI_THUE
    ADD COLUMN IF NOT EXISTS loai_giay_to VARCHAR(20) DEFAULT 'CCCD',
    ADD COLUMN IF NOT EXISTS ngay_cap_giay_to DATE,
    ADD COLUMN IF NOT EXISTS noi_cap_giay_to VARCHAR(255),
    ADD COLUMN IF NOT EXISTS dia_chi_thuong_tru TEXT,
    ADD COLUMN IF NOT EXISTS dia_chi_lien_he TEXT,
    ADD COLUMN IF NOT EXISTS email VARCHAR(100);

-- 2. Cấu hình thông tin pháp lý Bên A theo toà nhà
CREATE TABLE IF NOT EXISTS CAU_HINH_BEN_A_TOA_NHA (
    id BIGSERIAL PRIMARY KEY,
    toa_nha_id BIGINT UNIQUE NOT NULL REFERENCES TOA_NHA(id) ON DELETE CASCADE,
    loai_chu_the VARCHAR(20) NOT NULL DEFAULT 'CA_NHAN' CHECK (loai_chu_the IN ('CA_NHAN', 'TO_CHUC')),
    ten_chu_the VARCHAR(255) NOT NULL,
    ma_so_dinh_danh VARCHAR(50) NOT NULL,
    dia_chi_lien_he TEXT NOT NULL,
    so_dien_thoai VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    ho_ten_nguoi_ky VARCHAR(255) NOT NULL,
    chuc_vu_nguoi_ky VARCHAR(100) DEFAULT 'Chủ sở hữu',
    tu_cach_ky VARCHAR(50) NOT NULL DEFAULT 'CHU_SO_HUU' CHECK (tu_cach_ky IN ('CHU_SO_HUU', 'DAI_DIEN_PHAP_LUAT', 'NGUOI_DUOC_UY_QUYEN')),
    can_cu_uy_quyen TEXT,
    thong_tin_don_vi_quan_ly TEXT,
    so_tai_khoan VARCHAR(50),
    ten_ngan_hang VARCHAR(100),
    chu_tai_khoan VARCHAR(255),
    cap_nhat_luc TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cau_hinh_ben_a_toa ON CAU_HINH_BEN_A_TOA_NHA(toa_nha_id);

-- 3. Bảng Mẫu hợp đồng theo toà nhà
CREATE TABLE IF NOT EXISTS MAU_HOP_DONG (
    id BIGSERIAL PRIMARY KEY,
    toa_nha_id BIGINT REFERENCES TOA_NHA(id) ON DELETE CASCADE,
    ten_mau VARCHAR(255) NOT NULL,
    phien_ban INT NOT NULL DEFAULT 1,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED' CHECK (trang_thai IN ('DRAFT', 'PUBLISHED', 'LUU_TRU')),
    tieu_de VARCHAR(255) NOT NULL DEFAULT 'HỢP ĐỒNG THUÊ PHÒNG',
    noi_dung_dieu_khoan TEXT NOT NULL,
    nguoi_tao_id BIGINT REFERENCES NGUOI_DUNG(id),
    tao_luc TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cap_nhat_luc TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_mau_hop_dong_toa_phien_ban UNIQUE (toa_nha_id, phien_ban)
);

CREATE INDEX IF NOT EXISTS idx_mau_hop_dong_toa ON MAU_HOP_DONG(toa_nha_id);

-- 4. Bảng Hồ sơ Hợp đồng (Lưu Revision & Snapshot bất biến)
CREATE TABLE IF NOT EXISTS HOP_DONG_HO_SO (
    id BIGSERIAL PRIMARY KEY,
    hop_dong_id BIGINT NOT NULL REFERENCES HOP_DONG(id) ON DELETE CASCADE,
    revision INT NOT NULL DEFAULT 1,
    trang_thai_tai_lieu VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK (trang_thai_tai_lieu IN ('DRAFT', 'DA_CHOT', 'DA_GHI_NHAN_KY')),
    mau_hop_dong_id BIGINT REFERENCES MAU_HOP_DONG(id),
    mau_phien_ban INT,
    tieu_de VARCHAR(255) NOT NULL DEFAULT 'HỢP ĐỒNG THUÊ PHÒNG',
    ngay_lap DATE NOT NULL DEFAULT CURRENT_DATE,
    dia_diem_lap VARCHAR(255) NOT NULL DEFAULT 'Hà Nội',
    muc_dich_thue VARCHAR(255) NOT NULL DEFAULT 'Để ở',
    phamViSuDung TEXT DEFAULT 'Sử dụng riêng diện tích phòng thuê và sử dụng chung các tiện ích công cộng của toà nhà theo nội quy.',
    ngay_nhan_phong DATE,
    phuong_thuc_thanh_toan VARCHAR(50) NOT NULL DEFAULT 'CHUYEN_KHOAN',
    ky_thanh_toan_thang INT NOT NULL DEFAULT 1,
    han_thanh_toan_ngay INT NOT NULL DEFAULT 5,
    tai_khoan_nhan_tien TEXT,
    dieu_kien_dieu_chinh_gia TEXT,
    bien_ban_ban_giao_id BIGINT REFERENCES BIEN_BAN_BAN_GIAO_TAI_SAN(id),

    -- Snapshot Bên A
    ben_a_loai_chu_the VARCHAR(20),
    ben_a_ten_chu_the VARCHAR(255),
    ben_a_dinh_danh VARCHAR(50),
    ben_a_dia_chi TEXT,
    ben_a_dien_thoai VARCHAR(20),
    ben_a_email VARCHAR(100),
    ben_a_nguoi_ky VARCHAR(255),
    ben_a_chuc_vu VARCHAR(100),
    ben_a_tu_cach_ky VARCHAR(50),
    ben_a_can_cu_uy_quyen TEXT,
    ben_a_don_vi_quan_ly TEXT,

    -- Snapshot Bên B
    ben_b_ho_ten VARCHAR(255),
    ben_b_ngay_sinh DATE,
    ben_b_loai_giay_to VARCHAR(20),
    ben_b_so_giay_to VARCHAR(50),
    ben_b_ngay_cap DATE,
    ben_b_noi_cap VARCHAR(255),
    ben_b_thuong_tru TEXT,
    ben_b_lien_he TEXT,
    ben_b_dien_thoai VARCHAR(20),
    ben_b_email VARCHAR(100),

    -- Snapshot Bất động sản
    bds_ten_toa_nha VARCHAR(255),
    bds_dia_chi_toa_nha TEXT,
    bds_so_phong VARCHAR(50),
    bds_tang INT,
    bds_dien_tich NUMERIC(10, 2),

    -- Snapshot Điều khoản & Phụ lục (JSON snapshot)
    dieu_khoan_tuy_bien TEXT,
    snapshot_dich_vu_json TEXT,
    snapshot_tai_san_json TEXT,

    -- Metadata chốt hợp đồng & Ghi nhận ký
    chot_boi_nguoi_dung_id BIGINT REFERENCES NGUOI_DUNG(id),
    thoi_diem_chot TIMESTAMP,
    ghi_nhan_ky_boi_id BIGINT REFERENCES NGUOI_DUNG(id),
    ngay_ky DATE,
    thoi_diem_ghi_nhan_ky TIMESTAMP,
    ghi_chu_ky TEXT,
    file_scan_dinh_kem VARCHAR(500),

    tao_luc TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cap_nhat_luc TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_hop_dong_ho_so_revision UNIQUE (hop_dong_id, revision)
);

CREATE INDEX IF NOT EXISTS idx_hop_dong_ho_so_hop_dong ON HOP_DONG_HO_SO(hop_dong_id);

-- 5. Bảng Phụ lục Hợp đồng
CREATE TABLE IF NOT EXISTS HOP_DONG_PHU_LUC (
    id BIGSERIAL PRIMARY KEY,
    hop_dong_id BIGINT NOT NULL REFERENCES HOP_DONG(id) ON DELETE CASCADE,
    so_phu_luc INT NOT NULL,
    tieu_de VARCHAR(255) NOT NULL,
    ngay_lap DATE NOT NULL DEFAULT CURRENT_DATE,
    ngay_hieu_luc DATE NOT NULL,
    noi_dung_thay_doi TEXT NOT NULL,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'DA_CHOT' CHECK (trang_thai IN ('DRAFT', 'DA_CHOT')),
    nguoi_tao_id BIGINT REFERENCES NGUOI_DUNG(id),
    tao_luc TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_hop_dong_phu_luc_so UNIQUE (hop_dong_id, so_phu_luc)
);

CREATE INDEX IF NOT EXISTS idx_hop_dong_phu_luc_hd ON HOP_DONG_PHU_LUC(hop_dong_id);
