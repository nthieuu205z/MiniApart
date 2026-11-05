-- V59: Chuẩn hóa cột ngay_ky và snapshot_nguoi_o_cung_json cho HOP_DONG_HO_SO
-- Đảm bảo tương thích với các database đã áp dụng V58 draft và bảo toàn snapshot cam kết

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = CURRENT_SCHEMA
          AND table_name = 'hop_dong_ho_so'
    ) THEN
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = CURRENT_SCHEMA
              AND table_name = 'hop_dong_ho_so'
              AND column_name = 'ngay_ky'
        ) THEN
            ALTER TABLE HOP_DONG_HO_SO ADD COLUMN ngay_ky DATE;
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = CURRENT_SCHEMA
              AND table_name = 'hop_dong_ho_so'
              AND column_name = 'snapshot_nguoi_o_cung_json'
        ) THEN
            ALTER TABLE HOP_DONG_HO_SO ADD COLUMN snapshot_nguoi_o_cung_json TEXT;
        END IF;
    END IF;
END $$;

