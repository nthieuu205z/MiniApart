-- V62__utility_alert_unique_and_audit.sql
-- Thêm ràng buộc duy nhất và bảo vệ chống trùng lặp cảnh báo tiêu thụ
-- An toàn dữ liệu: lưu lại mọi bản ghi trùng vào bảng lịch sử trước khi tạo unique index

-- 1. Bảng lưu trữ lịch sử các bản ghi trùng (nếu có từ trước)
CREATE TABLE IF NOT EXISTS CANH_BAO_TIEU_THU_LICH_SU (LIKE CANH_BAO_TIEU_THU INCLUDING ALL);

-- 2. Sao lưu các bản ghi trùng vào bảng lịch sử
INSERT INTO CANH_BAO_TIEU_THU_LICH_SU
SELECT cb.* FROM CANH_BAO_TIEU_THU cb
WHERE cb.id NOT IN (
    SELECT MAX(id) FROM CANH_BAO_TIEU_THU
    GROUP BY toa_nha_id, COALESCE(diem_do_id, -1), COALESCE(phong_id, -1), ky_id, loai_canh_bao
)
ON CONFLICT DO NOTHING;

-- 3. Chỉ giữ lại bản ghi mới nhất cho mỗi bộ khoá nghiệp vụ trong bảng chính
DELETE FROM CANH_BAO_TIEU_THU
WHERE id NOT IN (
    SELECT MAX(id) FROM CANH_BAO_TIEU_THU
    GROUP BY toa_nha_id, COALESCE(diem_do_id, -1), COALESCE(phong_id, -1), ky_id, loai_canh_bao
);

-- 4. Unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS uq_canh_bao_tieu_thu_diem_do
ON CANH_BAO_TIEU_THU (toa_nha_id, diem_do_id, ky_id, loai_canh_bao)
WHERE diem_do_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_canh_bao_tieu_thu_phong
ON CANH_BAO_TIEU_THU (toa_nha_id, phong_id, ky_id, loai_canh_bao)
WHERE phong_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_canh_bao_tieu_thu_chung
ON CANH_BAO_TIEU_THU (toa_nha_id, ky_id, loai_canh_bao)
WHERE diem_do_id IS NULL AND phong_id IS NULL;
