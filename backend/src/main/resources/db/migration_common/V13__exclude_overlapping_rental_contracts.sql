CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE HOP_DONG
    ADD CONSTRAINT ex_hop_dong_phong_khong_chong_ngay
        EXCLUDE USING gist (
            phong_id WITH =,
            daterange(ngay_bat_dau, ngay_ket_thuc, '[]') WITH &&
        )
        WHERE (trang_thai <> 'DA_THANH_LY');
