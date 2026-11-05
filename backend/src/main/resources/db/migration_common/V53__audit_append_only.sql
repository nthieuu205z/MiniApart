ALTER TABLE NHAT_KY_THAO_TAC ADD COLUMN toa_nha_id BIGINT NULL REFERENCES TOA_NHA(id);
CREATE INDEX ix_nhat_ky_toa_thoi_diem ON NHAT_KY_THAO_TAC(toa_nha_id, thoi_diem DESC, id DESC);

-- Persist the building when the event happens. Permission changes and later tenant
-- moves must not move old events into another owner's audit history.
CREATE FUNCTION toa_nha_cua_nhat_ky(p_doi_tuong TEXT, p_phong_id BIGINT, p_dich_vu_id BIGINT)
RETURNS BIGINT LANGUAGE plpgsql STABLE AS $$
DECLARE
    loai TEXT := split_part(p_doi_tuong, ':', 1);
    khoa TEXT := split_part(p_doi_tuong, ':', 2);
    doi_tuong_id BIGINT;
    toa_id BIGINT;
BEGIN
    IF khoa ~ '^[0-9]+$' THEN
        BEGIN doi_tuong_id := khoa::BIGINT;
        EXCEPTION WHEN numeric_value_out_of_range THEN RETURN NULL;
        END;
    END IF;
    CASE loai
      WHEN 'TOA_NHA' THEN SELECT id INTO toa_id FROM TOA_NHA WHERE id=doi_tuong_id;
      WHEN 'PHONG' THEN SELECT toa_nha_id INTO toa_id FROM PHONG WHERE id=doi_tuong_id;
      WHEN 'DICH_VU' THEN SELECT toa_nha_id INTO toa_id FROM DICH_VU WHERE id=doi_tuong_id;
      WHEN 'BANG_GIA' THEN SELECT d.toa_nha_id INTO toa_id FROM BANG_GIA g JOIN DICH_VU d ON d.id=g.dich_vu_id WHERE g.id=doi_tuong_id;
      WHEN 'BANG_GIA_BAC_THANG' THEN SELECT d.toa_nha_id INTO toa_id FROM BANG_GIA_BAC_THANG g JOIN DICH_VU d ON d.id=g.dich_vu_id WHERE g.id=doi_tuong_id;
      WHEN 'HOP_DONG' THEN SELECT p.toa_nha_id INTO toa_id FROM HOP_DONG h JOIN PHONG p ON p.id=h.phong_id WHERE h.id=doi_tuong_id;
      WHEN 'HOA_DON' THEN SELECT p.toa_nha_id INTO toa_id FROM HOA_DON i JOIN HOP_DONG h ON h.id=i.hop_dong_id JOIN PHONG p ON p.id=h.phong_id WHERE i.id=doi_tuong_id;
      WHEN 'THANH_TOAN' THEN SELECT p.toa_nha_id INTO toa_id FROM THANH_TOAN t JOIN HOA_DON i ON i.id=t.hoa_don_id JOIN HOP_DONG h ON h.id=i.hop_dong_id JOIN PHONG p ON p.id=h.phong_id WHERE t.id=doi_tuong_id;
      WHEN 'GIAO_DICH_COC' THEN SELECT p.toa_nha_id INTO toa_id FROM GIAO_DICH_COC t JOIN HOP_DONG h ON h.id=t.hop_dong_id JOIN PHONG p ON p.id=h.phong_id WHERE t.id=doi_tuong_id;
      WHEN 'KHOAN_PHAT_SINH' THEN SELECT p.toa_nha_id INTO toa_id FROM KHOAN_PHAT_SINH t JOIN HOP_DONG h ON h.id=t.hop_dong_id JOIN PHONG p ON p.id=h.phong_id WHERE t.id=doi_tuong_id;
      WHEN 'CHI_SO_DICH_VU' THEN
        IF p_phong_id IS NOT NULL THEN SELECT toa_nha_id INTO toa_id FROM PHONG WHERE id=p_phong_id;
        ELSIF doi_tuong_id IS NOT NULL THEN SELECT p.toa_nha_id INTO toa_id FROM CHI_SO_DICH_VU c JOIN PHONG p ON p.id=c.phong_id WHERE c.id=doi_tuong_id;
        ELSIF p_dich_vu_id IS NOT NULL THEN SELECT toa_nha_id INTO toa_id FROM DICH_VU WHERE id=p_dich_vu_id;
        END IF;
      WHEN 'YEU_CAU_SUA_CHUA' THEN SELECT p.toa_nha_id INTO toa_id FROM YEU_CAU_SUA_CHUA y JOIN PHONG p ON p.id=y.phong_id WHERE y.id=doi_tuong_id;
      WHEN 'PCCC_HO_SO' THEN SELECT toa_nha_id INTO toa_id FROM PCCC_HO_SO WHERE id=doi_tuong_id;
      WHEN 'PCCC_THIET_BI' THEN SELECT toa_nha_id INTO toa_id FROM PCCC_THIET_BI WHERE id=doi_tuong_id;
      WHEN 'PCCC_KIEM_TRA' THEN SELECT toa_nha_id INTO toa_id FROM PCCC_KIEM_TRA WHERE id=doi_tuong_id;
      WHEN 'LICH_HEN_XEM_PHONG' THEN SELECT toa_nha_id INTO toa_id FROM LICH_HEN_XEM_PHONG WHERE id=doi_tuong_id;
      WHEN 'NGUOI_THUE' THEN
        SELECT CASE WHEN COUNT(DISTINCT toa_nha_id)=1 THEN MIN(toa_nha_id) ELSE NULL END INTO toa_id
        FROM (
          SELECT p.toa_nha_id FROM HOP_DONG h JOIN PHONG p ON p.id=h.phong_id WHERE h.nguoi_thue_id=doi_tuong_id
          UNION ALL
          SELECT p.toa_nha_id FROM NGUOI_O_CUNG n JOIN HOP_DONG h ON h.id=n.hop_dong_id JOIN PHONG p ON p.id=h.phong_id WHERE n.nguoi_thue_id=doi_tuong_id
        ) cac_toa;
      ELSE toa_id := NULL;
    END CASE;
    RETURN toa_id;
END;
$$;

UPDATE NHAT_KY_THAO_TAC SET toa_nha_id=toa_nha_cua_nhat_ky(doi_tuong,phong_id,dich_vu_id);
CREATE FUNCTION gan_toa_nha_nhat_ky() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.toa_nha_id IS NULL THEN
        NEW.toa_nha_id := toa_nha_cua_nhat_ky(NEW.doi_tuong,NEW.phong_id,NEW.dich_vu_id);
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER trg_nhat_ky_gan_toa BEFORE INSERT ON NHAT_KY_THAO_TAC FOR EACH ROW EXECUTE FUNCTION gan_toa_nha_nhat_ky();

-- The application login is separate from the migration/backup owner. Maintenance by
-- the database administrator remains possible; no application role may mutate history.
CREATE FUNCTION bao_ve_nhat_ky() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = CURRENT_USER AND rolsuper) THEN
        RAISE EXCEPTION 'Nhat ky chi duoc them, khong duoc sua hoac xoa' USING ERRCODE = '42501';
    END IF;
    IF TG_OP = 'UPDATE' THEN RETURN NEW; END IF;
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NULL;
END;
$$;
CREATE TRIGGER trg_nhat_ky_bat_bien BEFORE UPDATE OR DELETE ON NHAT_KY_THAO_TAC
    FOR EACH ROW EXECUTE FUNCTION bao_ve_nhat_ky();
CREATE TRIGGER trg_nhat_ky_cam_truncate BEFORE TRUNCATE ON NHAT_KY_THAO_TAC
    FOR EACH STATEMENT EXECUTE FUNCTION bao_ve_nhat_ky();
REVOKE UPDATE, DELETE, TRUNCATE ON NHAT_KY_THAO_TAC FROM PUBLIC;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'miniapart_app') THEN
        GRANT USAGE ON SCHEMA public TO miniapart_app;
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO miniapart_app;
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO miniapart_app;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO miniapart_app;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO miniapart_app;
        REVOKE UPDATE, DELETE, TRUNCATE ON NHAT_KY_THAO_TAC FROM miniapart_app;
    END IF;
END;
$$;
