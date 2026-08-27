ALTER TABLE LAN_DANG_NHAP_SAI
    ADD COLUMN so_dien_thoai_key VARCHAR(20);

UPDATE LAN_DANG_NHAP_SAI lan
SET so_dien_thoai_key = nguoi_dung.so_dien_thoai
FROM NGUOI_DUNG nguoi_dung
WHERE nguoi_dung.id = lan.nguoi_dung_id;

ALTER TABLE LAN_DANG_NHAP_SAI
    ALTER COLUMN so_dien_thoai_key SET NOT NULL;

ALTER TABLE LAN_DANG_NHAP_SAI
    ALTER COLUMN nguoi_dung_id DROP NOT NULL;

DROP INDEX idx_lan_dang_nhap_sai_nguoi_dung_thoi_diem;

CREATE INDEX idx_lan_dang_nhap_sai_sdt_thoi_diem
    ON LAN_DANG_NHAP_SAI(so_dien_thoai_key, thoi_diem);

CREATE TABLE THEO_DOI_DANG_NHAP (
    so_dien_thoai_key VARCHAR(20) PRIMARY KEY,
    so_lan_sai INTEGER NOT NULL DEFAULT 0,
    lan_sai_dau_tien TIMESTAMP NULL,
    khoa_den TIMESTAMP NULL
);

INSERT INTO THEO_DOI_DANG_NHAP (so_dien_thoai_key, so_lan_sai, lan_sai_dau_tien, khoa_den)
SELECT so_dien_thoai_key, COUNT(*), MIN(thoi_diem), NULL
FROM LAN_DANG_NHAP_SAI
GROUP BY so_dien_thoai_key;
