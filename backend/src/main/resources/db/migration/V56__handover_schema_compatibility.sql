-- V56: Schema compatibility for CHI_TIET_BIEN_BAN_TAI_SAN
-- Đảm bảo tên cột tien_khau_tru nhất quán cho cả database mới và database nâng cấp từ bản thử nghiệm
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'chi_tiet_bien_ban_tai_san' AND column_name = 'tien_khautru'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'chi_tiet_bien_ban_tai_san' AND column_name = 'tien_khau_tru'
    ) THEN
        ALTER TABLE CHI_TIET_BIEN_BAN_TAI_SAN RENAME COLUMN tien_khautru TO tien_khau_tru;
    END IF;
END $$;

