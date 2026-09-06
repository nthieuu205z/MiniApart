ALTER TABLE TOA_NHA
    ADD COLUMN ma_ngan_hang VARCHAR(6);

UPDATE TOA_NHA
SET ma_ngan_hang = CASE id
                       WHEN 1 THEN '970405'
                       WHEN 2 THEN '970422'
                       ELSE '970405'
                   END,
    tk_ngan_hang = regexp_replace(
        regexp_replace(tk_ngan_hang, '^9704[- ]?', ''),
        '[^0-9]', '', 'g'
    );

ALTER TABLE TOA_NHA
    ALTER COLUMN ma_ngan_hang SET NOT NULL,
    ALTER COLUMN tk_ngan_hang TYPE VARCHAR(19);

ALTER TABLE TOA_NHA
    ADD CONSTRAINT ck_toa_nha_ma_ngan_hang_6_so
        CHECK (ma_ngan_hang ~ '^[0-9]{6}$'),
    ADD CONSTRAINT ck_toa_nha_tk_ngan_hang_1_19_so
        CHECK (tk_ngan_hang ~ '^[0-9]{1,19}$');
