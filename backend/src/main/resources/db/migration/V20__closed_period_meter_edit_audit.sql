ALTER TABLE NHAT_KY_THAO_TAC
    ADD COLUMN phong_id BIGINT NULL REFERENCES PHONG(id),
    ADD COLUMN dich_vu_id BIGINT NULL REFERENCES DICH_VU(id),
    ADD COLUMN ly_do TEXT NULL;

CREATE INDEX idx_nhat_ky_thao_tac_chi_so_thoi_diem
    ON NHAT_KY_THAO_TAC (doi_tuong, phong_id, dich_vu_id, thoi_diem DESC);
