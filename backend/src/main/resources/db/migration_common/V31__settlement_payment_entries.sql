ALTER TABLE THANH_TOAN DROP CONSTRAINT thanh_toan_loai_check;

ALTER TABLE THANH_TOAN
    ADD CONSTRAINT ck_thanh_toan_loai
        CHECK (loai IN ('THU', 'DOI_UNG', 'QUYET_TOAN'));
