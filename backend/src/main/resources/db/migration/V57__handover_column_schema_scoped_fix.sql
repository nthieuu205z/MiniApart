-- V57: Schema-scoped compatibility fix for CHI_TIET_BIEN_BAN_TAI_SAN
-- Khắc phục triệt để lỗi unscoped information_schema.columns ở V56 khi nâng cấp đa schema:
-- 1. Chỉ kiểm tra và thao tác trên đúng schema đích (CURRENT_SCHEMA) của Flyway.
-- 2. Cột cũ 'tien_khautru' có, cột chuẩn 'tien_khau_tru' chưa có: RENAME bảo toàn 100% dữ liệu.
-- 3. Cột chuẩn 'tien_khau_tru' đã có: giữ nguyên, không thay đổi dữ liệu.
-- 4. Cả hai cột cùng tồn tại: kiểm tra xung đột dữ liệu giữa hai giá trị non-null khác nhau (kể cả 0 so với số dương).
--    Nếu có bất kỳ bản ghi nào khác nhau -> DỪNG RÕ RÀNG (RAISE EXCEPTION), rollback transaction, giữ nguyên cả hai cột và dữ liệu để đối soát.
--    Nếu không có xung đột (bằng nhau hoặc một bên NULL) -> hợp nhất dữ liệu sang tien_khau_tru rồi drop tien_khautru mà không làm mất thông tin.
DO $$
DECLARE
    cur_schema text := current_schema();
    has_table boolean;
    has_old boolean;
    has_std boolean;
    conflict_count int;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = cur_schema
          AND table_name = 'chi_tiet_bien_ban_tai_san'
    ) INTO has_table;

    IF NOT has_table THEN
        RETURN;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = cur_schema
          AND table_name = 'chi_tiet_bien_ban_tai_san'
          AND column_name = 'tien_khautru'
    ) INTO has_old;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = cur_schema
          AND table_name = 'chi_tiet_bien_ban_tai_san'
          AND column_name = 'tien_khau_tru'
    ) INTO has_std;

    -- TH1: Cả hai cột cùng tồn tại
    IF has_old AND has_std THEN
        EXECUTE format(
            'SELECT COUNT(*) FROM %I.%I WHERE tien_khautru IS NOT NULL AND tien_khau_tru IS NOT NULL AND tien_khautru <> tien_khau_tru',
            cur_schema, 'chi_tiet_bien_ban_tai_san'
        ) INTO conflict_count;

        IF conflict_count > 0 THEN
            RAISE EXCEPTION 'Xung đột dữ liệu schema %: phát hiện % bản ghi có giá trị khác nhau giữa tien_khautru và tien_khau_tru (kể cả 0 so với số dương). Dừng migration để đối soát, bảo toàn cả hai cột.', cur_schema, conflict_count;
        END IF;

        EXECUTE format(
            'UPDATE %I.%I SET tien_khau_tru = tien_khautru WHERE tien_khau_tru IS NULL AND tien_khautru IS NOT NULL',
            cur_schema, 'chi_tiet_bien_ban_tai_san'
        );

        EXECUTE format(
            'ALTER TABLE %I.%I DROP COLUMN tien_khautru',
            cur_schema, 'chi_tiet_bien_ban_tai_san'
        );

    -- TH2: Cột cũ có, cột chuẩn chưa có -> Rename bảo toàn dữ liệu
    ELSIF has_old AND NOT has_std THEN
        EXECUTE format(
            'ALTER TABLE %I.%I RENAME COLUMN tien_khautru TO tien_khau_tru',
            cur_schema, 'chi_tiet_bien_ban_tai_san'
        );

    -- TH3: Cột chuẩn đã có (clean DB hoặc đã chuẩn hoá) -> Không làm gì
    END IF;
END $$;

