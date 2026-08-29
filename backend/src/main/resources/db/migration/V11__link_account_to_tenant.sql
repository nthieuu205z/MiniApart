ALTER TABLE NGUOI_DUNG
    ADD COLUMN nguoi_thue_id BIGINT NULL;

ALTER TABLE NGUOI_DUNG
    ADD CONSTRAINT fk_nguoi_dung_nguoi_thue
        FOREIGN KEY (nguoi_thue_id) REFERENCES NGUOI_THUE(id);

ALTER TABLE NGUOI_DUNG
    ADD CONSTRAINT uk_nguoi_dung_nguoi_thue
        UNIQUE (nguoi_thue_id);
