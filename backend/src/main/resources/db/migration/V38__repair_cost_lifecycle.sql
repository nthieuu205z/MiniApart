ALTER TABLE KHOAN_PHAT_SINH
    DROP CONSTRAINT IF EXISTS khoan_phat_sinh_trang_thai_check;

ALTER TABLE KHOAN_PHAT_SINH
    ADD CONSTRAINT ck_khoan_phat_sinh_trang_thai
    CHECK (trang_thai IN ('CHO_TINH', 'DA_TINH', 'VO_HIEU'));

ALTER TABLE YEU_CAU_SUA_CHUA
    ADD COLUMN hop_dong_id BIGINT NULL REFERENCES HOP_DONG(id);

UPDATE YEU_CAU_SUA_CHUA yc
SET hop_dong_id = ung_vien.hop_dong_id
FROM (
    SELECT yc0.id AS yeu_cau_id, MIN(hd.id) AS hop_dong_id
    FROM YEU_CAU_SUA_CHUA yc0
    JOIN HOP_DONG hd ON hd.phong_id = yc0.phong_id
    WHERE hd.ngay_bat_dau <= yc0.tao_luc::DATE
      AND hd.ngay_ket_thuc >= yc0.tao_luc::DATE
    GROUP BY yc0.id
    HAVING COUNT(*) = 1
) ung_vien
WHERE yc.id = ung_vien.yeu_cau_id
  AND yc.hop_dong_id IS NULL;

CREATE INDEX idx_yeu_cau_sua_chua_hop_dong
    ON YEU_CAU_SUA_CHUA (hop_dong_id);
