-- scripts/enrich-presentation-demo-utility-meters.sql
-- Bổ sung công tơ khu vực chung, chỉ số thực tế và cảnh báo bất thường cho bộ dữ liệu demo.
-- Đảm bảo an toàn: kiểm tra database isolated, chạy trong transaction, bảo toàn hợp đồng & hóa đơn.
BEGIN;

DO $$
DECLARE
    actor BIGINT;
    b3_id BIGINT;
    b4_id BIGINT;
    b5_id BIGINT;
    b6_id BIGINT;
    b7_id BIGINT;
    b8_id BIGINT;
    k1 BIGINT; k2 BIGINT; k3 BIGINT; k4 BIGINT;
    k6 BIGINT; k7 BIGINT; k8 BIGINT; k9 BIGINT;
    k_b5 BIGINT;
    dd_tong_p1 BIGINT;
    dd_tong_nuoc_p1 BIGINT;
    dd_hl_p1 BIGINT;
    dd_tm_p1 BIGINT;
    dd_bom_p1 BIGINT;
    dd_san_p1 BIGINT;
    dd_tong_p2 BIGINT;
    dd_hl_p2 BIGINT;
    dd_bom_p2 BIGINT;
    dd_tong_p3 BIGINT;
    dd_hl_p3 BIGINT;
    dd_tong_p4 BIGINT;
BEGIN
    -- 0. BIÊN BẢO VỆ DATABASE & DEMO MARKER BẮT BUỘC
    IF current_database() !~ '^miniapart_demo_[a-z0-9_]+$'
       OR current_database() IS DISTINCT FROM current_setting('app.demo_expected_database', true) THEN
        RAISE EXCEPTION 'Refusing database: explicitly confirm an isolated miniapart_demo_* database matching app.demo_expected_database. Current: %', current_database();
    END IF;

    -- Lấy khóa advisory để tránh xung đột concurrent
    PERFORM pg_advisory_xact_lock(1793926001);

    SELECT nguoi_dung_id INTO actor FROM NHAT_KY_THAO_TAC
    WHERE hanh_dong='DEMO_DATASET_READY' AND doi_tuong='PRESENTATION_DEMO_V1';
    IF actor IS NULL THEN
        RAISE EXCEPTION 'PRESENTATION_DEMO_V1 marker bat buoc trong NHAT_KY_THAO_TAC khong tim thay. Khong the chay seed tren database chua khoi tao.';
    END IF;

    SELECT id INTO b3_id FROM TOA_NHA WHERE ma_toa = 'DEMO-P1';
    SELECT id INTO b4_id FROM TOA_NHA WHERE ma_toa = 'DEMO-P2';
    SELECT id INTO b5_id FROM TOA_NHA WHERE ma_toa = 'DEMO-P3';
    SELECT id INTO b6_id FROM TOA_NHA WHERE ma_toa = 'DEMO-P4';
    SELECT id INTO b7_id FROM TOA_NHA WHERE ma_toa = 'DEMO-P5';
    SELECT id INTO b8_id FROM TOA_NHA WHERE ma_toa = 'DEMO-P6';

    IF b3_id IS NULL THEN
        RAISE EXCEPTION 'Demo building DEMO-P1 not found';
    END IF;

    -- Lấy ID các kỳ của tòa 3 (DEMO-P1)
    SELECT id INTO k1 FROM KY_THANH_TOAN WHERE toa_nha_id = b3_id AND thang = 7 AND nam = 2026;
    SELECT id INTO k2 FROM KY_THANH_TOAN WHERE toa_nha_id = b3_id AND thang = 8 AND nam = 2026;
    SELECT id INTO k3 FROM KY_THANH_TOAN WHERE toa_nha_id = b3_id AND thang = 9 AND nam = 2026;
    SELECT id INTO k4 FROM KY_THANH_TOAN WHERE toa_nha_id = b3_id AND thang = 10 AND nam = 2026;

    -- Lấy ID các kỳ của tòa 4 (DEMO-P2)
    SELECT id INTO k6 FROM KY_THANH_TOAN WHERE toa_nha_id = b4_id AND thang = 7 AND nam = 2026;
    SELECT id INTO k7 FROM KY_THANH_TOAN WHERE toa_nha_id = b4_id AND thang = 8 AND nam = 2026;
    SELECT id INTO k8 FROM KY_THANH_TOAN WHERE toa_nha_id = b4_id AND thang = 9 AND nam = 2026;
    SELECT id INTO k9 FROM KY_THANH_TOAN WHERE toa_nha_id = b4_id AND thang = 10 AND nam = 2026;

    -- Lấy ID kỳ mục tiêu của tòa 5 (DEMO-P3)
    SELECT id INTO k_b5 FROM KY_THANH_TOAN WHERE toa_nha_id = b5_id AND thang = 10 AND nam = 2026;
    IF k_b5 IS NULL THEN
        SELECT id INTO k_b5 FROM KY_THANH_TOAN WHERE toa_nha_id = b5_id ORDER BY nam DESC, thang DESC, id DESC LIMIT 1;
    END IF;

    -- 1. TÒA 3: An Nhiên Residence (Bình thường, đủ lịch sử, khớp đối soát)
    INSERT INTO DIEM_DO_DUNG_CHUNG (toa_nha_id, ma_cong_to, ten_cong_to, loai_dich_vu, don_vi, loai_diem_do, khu_vuc, don_gia_mua, hoat_dong)
    VALUES (b3_id, 'CT-TONG-P1', 'Công tơ tổng điện tòa nhà', 'DIEN', 'kWh', 'TONG', 'TONG_TOA_NHA', 2400.00, true)
    ON CONFLICT (toa_nha_id, ma_cong_to) DO UPDATE SET ten_cong_to = EXCLUDED.ten_cong_to
    RETURNING id INTO dd_tong_p1;

    INSERT INTO DIEM_DO_DUNG_CHUNG (toa_nha_id, ma_cong_to, ten_cong_to, loai_dich_vu, don_vi, loai_diem_do, khu_vuc, don_gia_mua, hoat_dong)
    VALUES (b3_id, 'CT-TONG-NUOC-P1', 'Đồng hồ tổng nước tòa nhà', 'NUOC', 'm3', 'TONG', 'TONG_TOA_NHA', 15000.00, true)
    ON CONFLICT (toa_nha_id, ma_cong_to) DO UPDATE SET ten_cong_to = EXCLUDED.ten_cong_to
    RETURNING id INTO dd_tong_nuoc_p1;

    INSERT INTO DIEM_DO_DUNG_CHUNG (toa_nha_id, ma_cong_to, ten_cong_to, loai_dich_vu, don_vi, loai_diem_do, khu_vuc, don_gia_mua, hoat_dong, cong_to_cha_id)
    VALUES (b3_id, 'CT-HL-P1', 'Chiếu sáng hành lang & cầu thang', 'DIEN', 'kWh', 'KHU_VUC_CHUNG', 'HANH_LANG', 2400.00, true, dd_tong_p1)
    ON CONFLICT (toa_nha_id, ma_cong_to) DO UPDATE SET ten_cong_to = EXCLUDED.ten_cong_to
    RETURNING id INTO dd_hl_p1;

    INSERT INTO DIEM_DO_DUNG_CHUNG (toa_nha_id, ma_cong_to, ten_cong_to, loai_dich_vu, don_vi, loai_diem_do, khu_vuc, don_gia_mua, hoat_dong, cong_to_cha_id)
    VALUES (b3_id, 'CT-TM-P1', 'Thang máy toà nhà', 'DIEN', 'kWh', 'KHU_VUC_CHUNG', 'THANG_MAY', 2400.00, true, dd_tong_p1)
    ON CONFLICT (toa_nha_id, ma_cong_to) DO UPDATE SET ten_cong_to = EXCLUDED.ten_cong_to
    RETURNING id INTO dd_tm_p1;

    INSERT INTO DIEM_DO_DUNG_CHUNG (toa_nha_id, ma_cong_to, ten_cong_to, loai_dich_vu, don_vi, loai_diem_do, khu_vuc, don_gia_mua, hoat_dong, cong_to_cha_id)
    VALUES (b3_id, 'CT-BOM-P1', 'Máy bơm cấp nước', 'DIEN', 'kWh', 'KHU_VUC_CHUNG', 'MAY_BOM', 2400.00, true, dd_tong_p1)
    ON CONFLICT (toa_nha_id, ma_cong_to) DO UPDATE SET ten_cong_to = EXCLUDED.ten_cong_to
    RETURNING id INTO dd_bom_p1;

    INSERT INTO DIEM_DO_DUNG_CHUNG (toa_nha_id, ma_cong_to, ten_cong_to, loai_dich_vu, don_vi, loai_diem_do, khu_vuc, don_gia_mua, hoat_dong, cong_to_cha_id)
    VALUES (b3_id, 'CT-SAN-P1', 'Nước khu giặt & sân bãi', 'NUOC', 'm3', 'KHU_VUC_CHUNG', 'GIAT_LA', 15000.00, true, dd_tong_nuoc_p1)
    ON CONFLICT (toa_nha_id, ma_cong_to) DO UPDATE SET ten_cong_to = EXCLUDED.ten_cong_to
    RETURNING id INTO dd_san_p1;

    -- Chỉ số ghi nhận cho 4 kỳ tòa 3
    -- Tổng điện: 1570, 1575, 1565, 1570
    INSERT INTO CHI_SO_DUNG_CHUNG (diem_do_id, ky_id, chi_so_dau, chi_so_cuoi, muc_tieu_thu, nguoi_ghi_id)
    VALUES (dd_tong_p1, k1, 10000.00, 11570.00, 1570.00, actor),
           (dd_tong_p1, k2, 11570.00, 13145.00, 1575.00, actor),
           (dd_tong_p1, k3, 13145.00, 14710.00, 1565.00, actor),
           (dd_tong_p1, k4, 14710.00, 16280.00, 1570.00, actor)
    ON CONFLICT (diem_do_id, ky_id) DO NOTHING;

    -- Hành lang: 120, 122, 118, 120
    INSERT INTO CHI_SO_DUNG_CHUNG (diem_do_id, ky_id, chi_so_dau, chi_so_cuoi, muc_tieu_thu, nguoi_ghi_id)
    VALUES (dd_hl_p1, k1, 1000.00, 1120.00, 120.00, actor),
           (dd_hl_p1, k2, 1120.00, 1242.00, 122.00, actor),
           (dd_hl_p1, k3, 1242.00, 1360.00, 118.00, actor),
           (dd_hl_p1, k4, 1360.00, 1480.00, 120.00, actor)
    ON CONFLICT (diem_do_id, ky_id) DO NOTHING;

    -- Thang máy: 350, 355, 345, 350
    INSERT INTO CHI_SO_DUNG_CHUNG (diem_do_id, ky_id, chi_so_dau, chi_so_cuoi, muc_tieu_thu, nguoi_ghi_id)
    VALUES (dd_tm_p1, k1, 5000.00, 5350.00, 350.00, actor),
           (dd_tm_p1, k2, 5350.00, 5705.00, 355.00, actor),
           (dd_tm_p1, k3, 5705.00, 6050.00, 345.00, actor),
           (dd_tm_p1, k4, 6050.00, 6400.00, 350.00, actor)
    ON CONFLICT (diem_do_id, ky_id) DO NOTHING;

    -- Bơm điện: 85, 87, 83, 85
    INSERT INTO CHI_SO_DUNG_CHUNG (diem_do_id, ky_id, chi_so_dau, chi_so_cuoi, muc_tieu_thu, nguoi_ghi_id)
    VALUES (dd_bom_p1, k1, 2000.00, 2085.00, 85.00, actor),
           (dd_bom_p1, k2, 2085.00, 2172.00, 87.00, actor),
           (dd_bom_p1, k3, 2172.00, 2255.00, 83.00, actor),
           (dd_bom_p1, k4, 2255.00, 2340.00, 85.00, actor)
    ON CONFLICT (diem_do_id, ky_id) DO NOTHING;

    -- Tổng nước & sân bãi kỳ 4
    INSERT INTO CHI_SO_DUNG_CHUNG (diem_do_id, ky_id, chi_so_dau, chi_so_cuoi, muc_tieu_thu, nguoi_ghi_id)
    VALUES (dd_tong_nuoc_p1, k4, 500.00, 582.00, 82.00, actor),
           (dd_san_p1, k4, 100.00, 120.00, 20.00, actor)
    ON CONFLICT (diem_do_id, ky_id) DO NOTHING;

    -- 2. TÒA 4: Nhà Xanh Cầu Giấy (Cảnh báo vượt ngưỡng: Máy bơm nước tăng 2.1x)
    INSERT INTO DIEM_DO_DUNG_CHUNG (toa_nha_id, ma_cong_to, ten_cong_to, loai_dich_vu, don_vi, loai_diem_do, khu_vuc, don_gia_mua, hoat_dong)
    VALUES (b4_id, 'CT-TONG-P2', 'Công tơ tổng điện', 'DIEN', 'kWh', 'TONG', 'TONG_TOA_NHA', 2400.00, true)
    ON CONFLICT (toa_nha_id, ma_cong_to) DO UPDATE SET ten_cong_to = EXCLUDED.ten_cong_to
    RETURNING id INTO dd_tong_p2;

    INSERT INTO DIEM_DO_DUNG_CHUNG (toa_nha_id, ma_cong_to, ten_cong_to, loai_dich_vu, don_vi, loai_diem_do, khu_vuc, don_gia_mua, hoat_dong)
    VALUES (b4_id, 'CT-HL-P2', 'Chiếu sáng hành lang', 'DIEN', 'kWh', 'KHU_VUC_CHUNG', 'HANH_LANG', 2400.00, true)
    ON CONFLICT (toa_nha_id, ma_cong_to) DO UPDATE SET ten_cong_to = EXCLUDED.ten_cong_to
    RETURNING id INTO dd_hl_p2;

    INSERT INTO DIEM_DO_DUNG_CHUNG (toa_nha_id, ma_cong_to, ten_cong_to, loai_dich_vu, don_vi, loai_diem_do, khu_vuc, don_gia_mua, hoat_dong)
    VALUES (b4_id, 'CT-BOM-P2', 'Đồng hồ máy bơm cấp nước', 'NUOC', 'm3', 'KHU_VUC_CHUNG', 'MAY_BOM', 15000.00, true)
    ON CONFLICT (toa_nha_id, ma_cong_to) DO UPDATE SET ten_cong_to = EXCLUDED.ten_cong_to
    RETURNING id INTO dd_bom_p2;

    -- Lịch sử máy bơm nước tòa 4: 40, 42, 38 -> Kỳ 9 (tháng 10): 84 (gấp 2.1 lần)
    INSERT INTO CHI_SO_DUNG_CHUNG (diem_do_id, ky_id, chi_so_dau, chi_so_cuoi, muc_tieu_thu, nguoi_ghi_id)
    VALUES (dd_bom_p2, k6, 200.00, 240.00, 40.00, actor),
           (dd_bom_p2, k7, 240.00, 282.00, 42.00, actor),
           (dd_bom_p2, k8, 282.00, 320.00, 38.00, actor),
           (dd_bom_p2, k9, 320.00, 404.00, 84.00, actor)
    ON CONFLICT (diem_do_id, ky_id) DO NOTHING;

    -- Cảnh báo vượt ngưỡng cho máy bơm nước tòa 4 (idempotent, không tạo trùng)
    INSERT INTO CANH_BAO_TIEU_THU (
        toa_nha_id, diem_do_id, ky_id, loai_dich_vu, loai_canh_bao,
        muc_tieu_thu_ky_nay, muc_tham_chieu, muc_tang, ty_le_tang,
        ly_do, trang_thai
    )
    SELECT
        b4_id, dd_bom_p2, k9, 'NUOC', 'TIEU_THU_TANG_CAO',
        84.00, 40.00, 44.00, 2.10,
        'Mức tiêu thụ máy bơm kỳ này là 84.00 m3, trung bình 3 kỳ trước là 40.00 m3, gấp 2.10 lần (tăng 44.00 m3). Nghi ngờ rò rỉ van phao bể ngầm.',
        'MOI_PHAT_HIEN'
    WHERE NOT EXISTS (
        SELECT 1 FROM CANH_BAO_TIEU_THU
        WHERE toa_nha_id = b4_id AND diem_do_id = dd_bom_p2 AND ky_id = k9 AND loai_canh_bao = 'TIEU_THU_TANG_CAO'
    );

    -- 3. TÒA 5: Mộc Lan Home (Cảnh báo thiếu chỉ số sau ngày chốt)
    INSERT INTO DIEM_DO_DUNG_CHUNG (toa_nha_id, ma_cong_to, ten_cong_to, loai_dich_vu, don_vi, loai_diem_do, khu_vuc, don_gia_mua, hoat_dong)
    VALUES (b5_id, 'CT-TONG-P3', 'Công tơ tổng điện', 'DIEN', 'kWh', 'TONG', 'TONG_TOA_NHA', 2400.00, true)
    ON CONFLICT (toa_nha_id, ma_cong_to) DO UPDATE SET ten_cong_to = EXCLUDED.ten_cong_to
    RETURNING id INTO dd_tong_p3;

    INSERT INTO DIEM_DO_DUNG_CHUNG (toa_nha_id, ma_cong_to, ten_cong_to, loai_dich_vu, don_vi, loai_diem_do, khu_vuc, don_gia_mua, hoat_dong)
    VALUES (b5_id, 'CT-HL-P3', 'Chiếu sáng hành lang', 'DIEN', 'kWh', 'KHU_VUC_CHUNG', 'HANH_LANG', 2400.00, true)
    ON CONFLICT (toa_nha_id, ma_cong_to) DO UPDATE SET ten_cong_to = EXCLUDED.ten_cong_to
    RETURNING id INTO dd_hl_p3;

    INSERT INTO CANH_BAO_TIEU_THU (
        toa_nha_id, ky_id, loai_dich_vu, loai_canh_bao,
        ly_do, trang_thai
    )
    SELECT
        b5_id, k_b5, 'DIEN', 'THIEU_CHI_SO',
        'Còn 2 phòng và 1 điểm đo khu vực chung chưa ghi chỉ số sau ngày chốt số (25 hàng tháng).',
        'MOI_PHAT_HIEN'
    WHERE k_b5 IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM CANH_BAO_TIEU_THU
        WHERE toa_nha_id = b5_id AND ky_id = k_b5 AND loai_canh_bao = 'THIEU_CHI_SO'
    );

    -- 4. TÒA 6: Phố Nhỏ Studio (Chưa đủ dữ liệu đối soát: Chưa có số đo công tơ tổng)
    INSERT INTO DIEM_DO_DUNG_CHUNG (toa_nha_id, ma_cong_to, ten_cong_to, loai_dich_vu, don_vi, loai_diem_do, khu_vuc, don_gia_mua, hoat_dong)
    VALUES (b6_id, 'CT-TONG-P4', 'Công tơ tổng điện mới lắp', 'DIEN', 'kWh', 'TONG', 'TONG_TOA_NHA', 2400.00, true)
    ON CONFLICT (toa_nha_id, ma_cong_to) DO UPDATE SET ten_cong_to = EXCLUDED.ten_cong_to
    RETURNING id INTO dd_tong_p4;
    -- Cố ý không ghi chỉ số cho CT-TONG-P4 để kiểm tra kịch bản "Chưa đủ dữ liệu đối soát"!

    -- 5. TÒA 7 & TÒA 8
    INSERT INTO DIEM_DO_DUNG_CHUNG (toa_nha_id, ma_cong_to, ten_cong_to, loai_dich_vu, don_vi, loai_diem_do, khu_vuc, don_gia_mua, hoat_dong)
    VALUES (b7_id, 'CT-TONG-P5', 'Công tơ tổng điện', 'DIEN', 'kWh', 'TONG', 'TONG_TOA_NHA', 2400.00, true)
    ON CONFLICT (toa_nha_id, ma_cong_to) DO UPDATE SET ten_cong_to = EXCLUDED.ten_cong_to;

    INSERT INTO DIEM_DO_DUNG_CHUNG (toa_nha_id, ma_cong_to, ten_cong_to, loai_dich_vu, don_vi, loai_diem_do, khu_vuc, don_gia_mua, hoat_dong)
    VALUES (b8_id, 'CT-TONG-P6', 'Công tơ tổng điện', 'DIEN', 'kWh', 'TONG', 'TONG_TOA_NHA', 2400.00, true)
    ON CONFLICT (toa_nha_id, ma_cong_to) DO UPDATE SET ten_cong_to = EXCLUDED.ten_cong_to;

    -- 6. GHI NHẬT KÝ AUDIT
    INSERT INTO NHAT_KY_THAO_TAC(toa_nha_id, nguoi_dung_id, hanh_dong, doi_tuong, gia_tri_sau)
    VALUES (b3_id, actor, 'ENRICH_UTILITY_METERS', 'DEMO_DATASET_V2', 'Seeded presentation demo utility meters and anomalies');

    RAISE NOTICE 'Demo utility meters and anomalies seeded successfully.';
END $$;

COMMIT;
