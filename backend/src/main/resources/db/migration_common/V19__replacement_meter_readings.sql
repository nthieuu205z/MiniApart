ALTER TABLE CHI_SO_DICH_VU
    ADD COLUMN chi_so_cuoi_cong_to_cu NUMERIC(15,2),
    ADD COLUMN chi_so_dau_cong_to_moi NUMERIC(15,2),
    ADD CONSTRAINT chi_so_dich_vu_thay_cong_to_check CHECK (
        (co_thay_cong_to = FALSE
            AND chi_so_cuoi_cong_to_cu IS NULL
            AND chi_so_dau_cong_to_moi IS NULL)
        OR
        (co_thay_cong_to = TRUE
            AND chi_so_cuoi_cong_to_cu IS NOT NULL
            AND chi_so_dau_cong_to_moi IS NOT NULL)
    );
