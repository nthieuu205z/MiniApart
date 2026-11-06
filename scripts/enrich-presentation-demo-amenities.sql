-- Explicit one-time enrichment of the owned presentation fixture, not a Flyway migration.
-- Set app.demo_expected_database on the SAME connection before executing this file.
BEGIN;
DO $$
DECLARE
    room RECORD;
    equipment RECORD;
    ordinal INTEGER;
    building_index INTEGER;
    furnished_vacancy BOOLEAN;
    merged TEXT[];
    actor BIGINT;
    before_dossiers TEXT;
    before_invoices TEXT;
    before_payments TEXT;
    before_deposits TEXT;
BEGIN
    IF current_database() !~ '^miniapart_demo_[a-z0-9_]+$'
       OR current_database() IS DISTINCT FROM current_setting('app.demo_expected_database',true) THEN
        RAISE EXCEPTION 'Refusing database: explicitly confirm an isolated miniapart_demo_* database';
    END IF;
    PERFORM pg_advisory_xact_lock(72620261105);
    SELECT nguoi_dung_id INTO actor FROM NHAT_KY_THAO_TAC
    WHERE hanh_dong='DEMO_DATASET_READY' AND doi_tuong='PRESENTATION_DEMO_V1';
    IF actor IS NULL THEN RAISE EXCEPTION 'Presentation dataset ownership marker is missing'; END IF;
    IF (SELECT count(*) FROM PHONG p JOIN TOA_NHA t ON t.id=p.toa_nha_id
        WHERE t.ma_toa IN ('DEMO-P1','DEMO-P2','DEMO-P3','DEMO-P4','DEMO-P5','DEMO-P6')) <> 72 THEN
        RAISE EXCEPTION 'Expected exactly 72 owned presentation rooms';
    END IF;
    LOCK TABLE HOP_DONG_HO_SO, HOA_DON, THANH_TOAN, GIAO_DICH_COC IN SHARE MODE;
    SELECT md5(string_agg(h::text,'|' ORDER BY id)) INTO before_dossiers FROM HOP_DONG_HO_SO h;
    SELECT md5(string_agg(h::text,'|' ORDER BY id)) INTO before_invoices FROM HOA_DON h;
    SELECT md5(string_agg(h::text,'|' ORDER BY id)) INTO before_payments FROM THANH_TOAN h;
    SELECT md5(string_agg(h::text,'|' ORDER BY id)) INTO before_deposits FROM GIAO_DICH_COC h;
    FOR room IN SELECT p.id,p.so_phong,p.tien_ich,t.ma_toa FROM PHONG p JOIN TOA_NHA t ON t.id=p.toa_nha_id
        WHERE t.ma_toa IN ('DEMO-P1','DEMO-P2','DEMO-P3','DEMO-P4','DEMO-P5','DEMO-P6') ORDER BY p.id
    LOOP
        IF room.so_phong !~ '^[1-4]0[1-3]$' THEN RAISE EXCEPTION 'Unknown presentation room numbering'; END IF;
        ordinal:=(left(room.so_phong,1)::integer-1)*3+right(room.so_phong,2)::integer;
        building_index:=right(room.ma_toa,1)::integer-1;
        furnished_vacancy:=ordinal=11 AND building_index%2=0;
        SELECT COALESCE(array_agg(btrim(x)) FILTER (WHERE btrim(x)<>''),ARRAY[]::text[]) INTO merged
        FROM unnest(string_to_array(COALESCE(room.tien_ich,''),',')) x;
        FOR equipment IN SELECT * FROM (VALUES
            ('Tủ lạnh','Tủ lạnh hai cửa 180 lít','DIEN_LANH',3200000,ordinal%4 IN (0,2) OR furnished_vacancy),
            ('Giường nệm','Giường gỗ kèm nệm 1,6 m','NOI_THAT',2800000,(ordinal%4<>3 AND ordinal NOT IN (5,9)) OR furnished_vacancy),
            ('Máy giặt','Máy giặt cửa trên 8 kg','DIEN_TU',4500000,ordinal%4=0 OR (furnished_vacancy AND building_index<4)),
            ('Bếp riêng','Bếp điện từ đơn','DIEN_TU',900000,ordinal%2=0 OR furnished_vacancy)
        ) AS v(amenity,asset_name,category,asset_value,included) WHERE included
        LOOP
            IF NOT EXISTS (SELECT 1 FROM unnest(merged) x WHERE lower(x)=lower(equipment.amenity)) THEN
                merged:=array_append(merged,equipment.amenity);
            END IF;
            INSERT INTO TAI_SAN_PHONG(phong_id,ten_tai_san,loai_tai_san,so_luong,tinh_trang,gia_tri_uoc_tinh,ghi_chu)
            SELECT room.id,equipment.asset_name,equipment.category,1,'HOAT_DONG_TOT',equipment.asset_value,
                   '[PRESENTATION-AMENITIES-V2] Bổ sung trang bị cho bộ dữ liệu trình diễn'
            WHERE NOT EXISTS(SELECT 1 FROM TAI_SAN_PHONG a WHERE a.phong_id=room.id AND a.ten_tai_san=equipment.asset_name);
        END LOOP;
        UPDATE PHONG SET tien_ich=array_to_string(merged,', ') WHERE id=room.id AND tien_ich IS DISTINCT FROM array_to_string(merged,', ');
    END LOOP;
    -- Existing contracts, signed snapshots and accounting history must remain byte-for-byte unchanged.
    IF before_dossiers IS DISTINCT FROM (SELECT md5(string_agg(h::text,'|' ORDER BY id)) FROM HOP_DONG_HO_SO h)
       OR before_invoices IS DISTINCT FROM (SELECT md5(string_agg(h::text,'|' ORDER BY id)) FROM HOA_DON h)
       OR before_payments IS DISTINCT FROM (SELECT md5(string_agg(h::text,'|' ORDER BY id)) FROM THANH_TOAN h)
       OR before_deposits IS DISTINCT FROM (SELECT md5(string_agg(h::text,'|' ORDER BY id)) FROM GIAO_DICH_COC h) THEN
        RAISE EXCEPTION 'Historical contract or accounting data changed; rolling back';
    END IF;
    INSERT INTO NHAT_KY_THAO_TAC(nguoi_dung_id,hanh_dong,doi_tuong,gia_tri_sau)
    SELECT actor,'DEMO_AMENITIES_ENRICHED','PRESENTATION_AMENITIES_V2','Chỉ bổ sung tiện ích và tài sản hiện tại; giữ nguyên hồ sơ đã ký và sổ tiền'
    WHERE NOT EXISTS(SELECT 1 FROM NHAT_KY_THAO_TAC WHERE hanh_dong='DEMO_AMENITIES_ENRICHED' AND doi_tuong='PRESENTATION_AMENITIES_V2');
END $$;
COMMIT;
