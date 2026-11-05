INSERT INTO THEO_DOI_DANG_NHAP (so_dien_thoai_key, so_lan_sai, lan_sai_dau_tien, khoa_den)
SELECT
    so_dien_thoai,
    so_lan_sai,
    lan_sai_dau_tien,
    CASE
        WHEN khoa_den > CURRENT_TIMESTAMP THEN khoa_den
        ELSE NULL
    END
FROM NGUOI_DUNG
ON CONFLICT (so_dien_thoai_key) DO UPDATE
SET so_lan_sai = GREATEST(THEO_DOI_DANG_NHAP.so_lan_sai, EXCLUDED.so_lan_sai),
    lan_sai_dau_tien = CASE
        WHEN THEO_DOI_DANG_NHAP.lan_sai_dau_tien IS NULL THEN EXCLUDED.lan_sai_dau_tien
        WHEN EXCLUDED.lan_sai_dau_tien IS NULL THEN THEO_DOI_DANG_NHAP.lan_sai_dau_tien
        ELSE LEAST(THEO_DOI_DANG_NHAP.lan_sai_dau_tien, EXCLUDED.lan_sai_dau_tien)
    END,
    khoa_den = CASE
        WHEN EXCLUDED.khoa_den IS NOT NULL THEN EXCLUDED.khoa_den
        ELSE THEO_DOI_DANG_NHAP.khoa_den
    END;
