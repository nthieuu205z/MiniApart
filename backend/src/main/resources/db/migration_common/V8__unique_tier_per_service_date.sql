ALTER TABLE BANG_GIA_BAC_THANG
    ADD CONSTRAINT uq_bang_gia_bac_thang_dich_vu_ngay_bac
        UNIQUE (dich_vu_id, ngay_hieu_luc, bac);
