ALTER TABLE TOA_NHA
    ADD COLUMN ma_ngan_hang VARCHAR(6);

UPDATE TOA_NHA
SET ma_ngan_hang = CASE ma_toa
                       WHEN 'TN-A' THEN '970405'
                       WHEN 'TN-B' THEN '970422'
                   END,
    tk_ngan_hang = CASE
                       WHEN ma_toa = 'TN-A' AND tk_ngan_hang = '9704-0000-0000-0101'
                           THEN '000000000101'
                       WHEN ma_toa = 'TN-B' AND tk_ngan_hang = '9704-0000-0000-0202'
                           THEN '000000000202'
                       ELSE regexp_replace(tk_ngan_hang, '[^0-9]', '', 'g')
                   END;

DO $$
DECLARE
    unresolved_buildings TEXT;
BEGIN
    SELECT string_agg(ma_toa, ', ' ORDER BY ma_toa)
    INTO unresolved_buildings
    FROM TOA_NHA
    WHERE ma_ngan_hang IS NULL;

    IF unresolved_buildings IS NOT NULL THEN
        RAISE EXCEPTION 'V28 requires explicit BIN mapping for legacy buildings: %', unresolved_buildings;
    END IF;
END
$$;

ALTER TABLE TOA_NHA
    ALTER COLUMN ma_ngan_hang SET NOT NULL,
    ALTER COLUMN tk_ngan_hang TYPE VARCHAR(19);

ALTER TABLE TOA_NHA
    ADD CONSTRAINT ck_toa_nha_ma_ngan_hang_6_so
        CHECK (ma_ngan_hang ~ '^[0-9]{6}$'),
    ADD CONSTRAINT ck_toa_nha_tk_ngan_hang_1_19_so
        CHECK (tk_ngan_hang ~ '^[0-9]{1,19}$');
