-- V60: Bổ sung quản lý người cư trú, sức chứa, bảng giá dịch vụ theo phòng và chính sách hợp đồng
-- 1. NGUOI_O_CUNG: hỗ trợ vai trò (NGUOI_DUNG_TEN / NGUOI_O_CUNG), trạng thái (CHO_DUYET / DA_DUYET / TU_CHOI / DA_ROI_DI),
--    người đề nghị, người duyệt, thời gian duyệt và lý do.
--    quan_he chuyển thành NULLABLE (người cư trú không bắt buộc có quan hệ gia đình).
-- 2. HOP_DONG_HO_SO: bổ sung so_nguoi_toi_da, so_ngay_bao_truoc_gia_han, so_ngay_hoan_coc, khung_gio_yen_tinh.
-- 3. BANG_GIA_PHONG: hỗ trợ ghi đè đơn giá dịch vụ (như điện) theo từng phòng cụ thể, kế thừa bảng giá toà nhà nếu chưa có.

-- 1. Cập nhật NGUOI_O_CUNG
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = CURRENT_SCHEMA
          AND table_name = 'nguoi_o_cung'
    ) THEN
        -- Cho phép quan_he là nullable
        ALTER TABLE NGUOI_O_CUNG ALTER COLUMN quan_he DROP NOT NULL;

        -- Bổ sung vai_tro
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = CURRENT_SCHEMA AND table_name = 'nguoi_o_cung' AND column_name = 'vai_tro'
        ) THEN
            ALTER TABLE NGUOI_O_CUNG ADD COLUMN vai_tro VARCHAR(30) NOT NULL DEFAULT 'NGUOI_O'
                CHECK (vai_tro IN ('NGUOI_DUNG_TEN', 'NGUOI_O', 'NGUOI_O_CUNG'));
        ELSE
            ALTER TABLE NGUOI_O_CUNG DROP CONSTRAINT IF EXISTS nguoi_o_cung_vai_tro_check;
            ALTER TABLE NGUOI_O_CUNG ADD CONSTRAINT nguoi_o_cung_vai_tro_check
                CHECK (vai_tro IN ('NGUOI_DUNG_TEN', 'NGUOI_O', 'NGUOI_O_CUNG'));
        END IF;

        -- Bổ sung trang_thai (mặc định DA_DUYET cho bản ghi cũ để bảo toàn tính cư trú của người đang ở)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = CURRENT_SCHEMA AND table_name = 'nguoi_o_cung' AND column_name = 'trang_thai'
        ) THEN
            ALTER TABLE NGUOI_O_CUNG ADD COLUMN trang_thai VARCHAR(30) NOT NULL DEFAULT 'DA_DUYET'
                CHECK (trang_thai IN ('CHO_DUYET', 'DA_DUYET', 'TU_CHOI', 'DA_ROI_DI'));
        END IF;

        -- Bổ sung thông tin đề nghị và duyệt
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = CURRENT_SCHEMA AND table_name = 'nguoi_o_cung' AND column_name = 'nguoi_de_nghi_id'
        ) THEN
            ALTER TABLE NGUOI_O_CUNG ADD COLUMN nguoi_de_nghi_id BIGINT REFERENCES NGUOI_DUNG(id);
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = CURRENT_SCHEMA AND table_name = 'nguoi_o_cung' AND column_name = 'thoi_diem_de_nghi'
        ) THEN
            ALTER TABLE NGUOI_O_CUNG ADD COLUMN thoi_diem_de_nghi TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = CURRENT_SCHEMA AND table_name = 'nguoi_o_cung' AND column_name = 'nguoi_duyet_id'
        ) THEN
            ALTER TABLE NGUOI_O_CUNG ADD COLUMN nguoi_duyet_id BIGINT REFERENCES NGUOI_DUNG(id);
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = CURRENT_SCHEMA AND table_name = 'nguoi_o_cung' AND column_name = 'thoi_diem_duyet'
        ) THEN
            ALTER TABLE NGUOI_O_CUNG ADD COLUMN thoi_diem_duyet TIMESTAMP;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = CURRENT_SCHEMA AND table_name = 'nguoi_o_cung' AND column_name = 'ly_do_tu_choi'
        ) THEN
            ALTER TABLE NGUOI_O_CUNG ADD COLUMN ly_do_tu_choi TEXT;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = CURRENT_SCHEMA AND table_name = 'nguoi_o_cung' AND column_name = 'ly_do_roi_di'
        ) THEN
            ALTER TABLE NGUOI_O_CUNG ADD COLUMN ly_do_roi_di TEXT;
        END IF;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_nguoi_o_cung_trang_thai ON NGUOI_O_CUNG(hop_dong_id, trang_thai);

-- 2. Cập nhật HOP_DONG_HO_SO
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = CURRENT_SCHEMA
          AND table_name = 'hop_dong_ho_so'
    ) THEN
        -- Chuẩn hóa pham_vi_su_dung (nếu schema cũ tạo phamvisudung do camelCase)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = CURRENT_SCHEMA AND table_name = 'hop_dong_ho_so' AND column_name = 'phamvisudung'
        ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = CURRENT_SCHEMA AND table_name = 'hop_dong_ho_so' AND column_name = 'pham_vi_su_dung'
        ) THEN
            ALTER TABLE HOP_DONG_HO_SO RENAME COLUMN phamvisudung TO pham_vi_su_dung;
        ELSIF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = CURRENT_SCHEMA AND table_name = 'hop_dong_ho_so' AND column_name = 'pham_vi_su_dung'
        ) THEN
            ALTER TABLE HOP_DONG_HO_SO ADD COLUMN pham_vi_su_dung TEXT DEFAULT 'Sử dụng riêng diện tích phòng thuê và sử dụng chung các tiện ích công cộng của toà nhà theo nội quy.';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = CURRENT_SCHEMA AND table_name = 'hop_dong_ho_so' AND column_name = 'so_nguoi_toi_da'
        ) THEN
            ALTER TABLE HOP_DONG_HO_SO ADD COLUMN so_nguoi_toi_da INT;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = CURRENT_SCHEMA AND table_name = 'hop_dong_ho_so' AND column_name = 'so_ngay_bao_truoc_gia_han'
        ) THEN
            ALTER TABLE HOP_DONG_HO_SO ADD COLUMN so_ngay_bao_truoc_gia_han INT DEFAULT 30;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = CURRENT_SCHEMA AND table_name = 'hop_dong_ho_so' AND column_name = 'so_ngay_hoan_coc'
        ) THEN
            ALTER TABLE HOP_DONG_HO_SO ADD COLUMN so_ngay_hoan_coc INT DEFAULT 7;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = CURRENT_SCHEMA AND table_name = 'hop_dong_ho_so' AND column_name = 'khung_gio_yen_tinh'
        ) THEN
            ALTER TABLE HOP_DONG_HO_SO ADD COLUMN khung_gio_yen_tinh VARCHAR(50) DEFAULT '22h00 - 06h00';
        END IF;
    END IF;
END $$;

-- 3. Tạo bảng BANG_GIA_PHONG
CREATE TABLE IF NOT EXISTS BANG_GIA_PHONG (
    id BIGSERIAL PRIMARY KEY,
    phong_id BIGINT NOT NULL REFERENCES PHONG(id) ON DELETE CASCADE,
    dich_vu_id BIGINT NOT NULL REFERENCES DICH_VU(id) ON DELETE CASCADE,
    don_gia NUMERIC(15, 2) NOT NULL CHECK (don_gia >= 0),
    ngay_hieu_luc DATE NOT NULL,
    nguoi_tao_id BIGINT REFERENCES NGUOI_DUNG(id),
    tao_luc TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_bang_gia_phong_dich_vu_ngay UNIQUE (phong_id, dich_vu_id, ngay_hieu_luc)
);

CREATE INDEX IF NOT EXISTS idx_bang_gia_phong_lookup ON BANG_GIA_PHONG(phong_id, dich_vu_id, ngay_hieu_luc DESC);

