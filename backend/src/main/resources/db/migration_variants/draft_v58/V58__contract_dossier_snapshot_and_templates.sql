-- V58: Hoàn thiện hồ sơ hợp đồng thuê phòng MiniApart
-- Bao gồm:
-- 1. Bổ sung thông tin định danh và địa chỉ đầy đủ cho NGUOI_THUE
-- 2. Cấu hình thông tin pháp lý Bên A (Bên cho thuê) theo toà nhà
-- 3. Mẫu 10 điều khoản hợp đồng chuẩn mực theo toà nhà (quản lý phiên bản)
-- 4. Bảng hồ sơ hợp đồng (HOP_DONG_HO_SO) lưu snapshot bất biến, phân tách vòng đời tài liệu (DRAFT, DA_CHOT, DA_GHI_NHAN_KY)
-- 5. Bảng phụ lục sửa đổi (HOP_DONG_PHU_LUC) cho các thay đổi sau chốt

-- 1. Bổ sung cột cho NGUOI_THUE
ALTER TABLE NGUOI_THUE
    ADD COLUMN IF NOT EXISTS loai_giay_to VARCHAR(20) DEFAULT 'CCCD',
    ADD COLUMN IF NOT EXISTS ngay_cap_giay_to DATE,
    ADD COLUMN IF NOT EXISTS noi_cap_giay_to VARCHAR(255),
    ADD COLUMN IF NOT EXISTS dia_chi_thuong_tru TEXT,
    ADD COLUMN IF NOT EXISTS dia_chi_lien_he TEXT,
    ADD COLUMN IF NOT EXISTS email VARCHAR(100);

-- 2. Cấu hình thông tin pháp lý Bên A theo toà nhà
CREATE TABLE IF NOT EXISTS CAU_HINH_BEN_A_TOA_NHA (
    id BIGSERIAL PRIMARY KEY,
    toa_nha_id BIGINT UNIQUE NOT NULL REFERENCES TOA_NHA(id) ON DELETE CASCADE,
    loai_chu_the VARCHAR(20) NOT NULL DEFAULT 'CA_NHAN' CHECK (loai_chu_the IN ('CA_NHAN', 'TO_CHUC')),
    ten_chu_the VARCHAR(255) NOT NULL,
    ma_so_dinh_danh VARCHAR(50) NOT NULL,
    dia_chi_lien_he TEXT NOT NULL,
    so_dien_thoai VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    ho_ten_nguoi_ky VARCHAR(255) NOT NULL,
    chuc_vu_nguoi_ky VARCHAR(100) DEFAULT 'Chủ sở hữu',
    tu_cach_ky VARCHAR(50) NOT NULL DEFAULT 'CHU_SO_HUU' CHECK (tu_cach_ky IN ('CHU_SO_HUU', 'DAI_DIEN_PHAP_LUAT', 'NGUOI_DUOC_UY_QUYEN')),
    can_cu_uy_quyen TEXT,
    thong_tin_don_vi_quan_ly TEXT,
    so_tai_khoan VARCHAR(50),
    ten_ngan_hang VARCHAR(100),
    chu_tai_khoan VARCHAR(255),
    cap_nhat_luc TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cau_hinh_ben_a_toa ON CAU_HINH_BEN_A_TOA_NHA(toa_nha_id);

-- 3. Bảng Mẫu hợp đồng theo toà nhà
CREATE TABLE IF NOT EXISTS MAU_HOP_DONG (
    id BIGSERIAL PRIMARY KEY,
    toa_nha_id BIGINT REFERENCES TOA_NHA(id) ON DELETE CASCADE,
    ten_mau VARCHAR(255) NOT NULL,
    phien_ban INT NOT NULL DEFAULT 1,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED' CHECK (trang_thai IN ('DRAFT', 'PUBLISHED', 'LUU_TRU')),
    tieu_de VARCHAR(255) NOT NULL DEFAULT 'HỢP ĐỒNG THUÊ PHÒNG',
    noi_dung_dieu_khoan TEXT NOT NULL,
    nguoi_tao_id BIGINT REFERENCES NGUOI_DUNG(id),
    tao_luc TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cap_nhat_luc TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_mau_hop_dong_toa_phien_ban UNIQUE (toa_nha_id, phien_ban)
);

CREATE INDEX IF NOT EXISTS idx_mau_hop_dong_toa ON MAU_HOP_DONG(toa_nha_id);

-- 4. Bảng Hồ sơ Hợp đồng (Lưu Revision & Snapshot bất biến)
CREATE TABLE IF NOT EXISTS HOP_DONG_HO_SO (
    id BIGSERIAL PRIMARY KEY,
    hop_dong_id BIGINT NOT NULL REFERENCES HOP_DONG(id) ON DELETE CASCADE,
    revision INT NOT NULL DEFAULT 1,
    trang_thai_tai_lieu VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK (trang_thai_tai_lieu IN ('DRAFT', 'DA_CHOT', 'DA_GHI_NHAN_KY')),
    mau_hop_dong_id BIGINT REFERENCES MAU_HOP_DONG(id),
    mau_phien_ban INT,
    tieu_de VARCHAR(255) NOT NULL DEFAULT 'HỢP ĐỒNG THUÊ PHÒNG',
    ngay_lap DATE NOT NULL DEFAULT CURRENT_DATE,
    dia_diem_lap VARCHAR(255) NOT NULL DEFAULT 'Hà Nội',
    muc_dich_thue VARCHAR(255) NOT NULL DEFAULT 'Để ở',
    pham_vi_su_dung TEXT DEFAULT 'Sử dụng riêng diện tích phòng thuê và sử dụng chung các tiện ích công cộng của toà nhà theo nội quy.',
    ngay_nhan_phong DATE,
    phuong_thuc_thanh_toan VARCHAR(50) NOT NULL DEFAULT 'CHUYEN_KHOAN',
    ky_thanh_toan_thang INT NOT NULL DEFAULT 1,
    han_thanh_toan_ngay INT NOT NULL DEFAULT 5,
    tai_khoan_nhan_tien TEXT,
    dieu_kien_dieu_chinh_gia TEXT,
    bien_ban_ban_giao_id BIGINT REFERENCES BIEN_BAN_BAN_GIAO_TAI_SAN(id),

    -- Snapshot Bên A
    ben_a_loai_chu_the VARCHAR(20),
    ben_a_ten_chu_the VARCHAR(255),
    ben_a_dinh_danh VARCHAR(50),
    ben_a_dia_chi TEXT,
    ben_a_dien_thoai VARCHAR(20),
    ben_a_email VARCHAR(100),
    ben_a_nguoi_ky VARCHAR(255),
    ben_a_chuc_vu VARCHAR(100),
    ben_a_tu_cach_ky VARCHAR(50),
    ben_a_can_cu_uy_quyen TEXT,
    ben_a_don_vi_quan_ly TEXT,

    -- Snapshot Bên B
    ben_b_ho_ten VARCHAR(255),
    ben_b_ngay_sinh DATE,
    ben_b_loai_giay_to VARCHAR(20),
    ben_b_so_giay_to VARCHAR(50),
    ben_b_ngay_cap DATE,
    ben_b_noi_cap VARCHAR(255),
    ben_b_thuong_tru TEXT,
    ben_b_lien_he TEXT,
    ben_b_dien_thoai VARCHAR(20),
    ben_b_email VARCHAR(100),

    -- Snapshot Bất động sản
    bds_ten_toa_nha VARCHAR(255),
    bds_dia_chi_toa_nha TEXT,
    bds_so_phong VARCHAR(50),
    bds_tang INT,
    bds_dien_tich NUMERIC(10, 2),

    -- Snapshot Điều khoản & Phụ lục (JSON snapshot)
    dieu_khoan_tuy_bien TEXT,
    snapshot_dich_vu_json TEXT,
    snapshot_tai_san_json TEXT,

    -- Metadata chốt hợp đồng & Ghi nhận ký
    chot_boi_nguoi_dung_id BIGINT REFERENCES NGUOI_DUNG(id),
    thoi_diem_chot TIMESTAMP,
    ghi_nhan_ky_boi_id BIGINT REFERENCES NGUOI_DUNG(id),
    thoi_diem_ghi_nhan_ky TIMESTAMP,
    ghi_chu_ky TEXT,
    file_scan_dinh_kem VARCHAR(500),

    tao_luc TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cap_nhat_luc TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_hop_dong_ho_so_revision UNIQUE (hop_dong_id, revision)
);

CREATE INDEX IF NOT EXISTS idx_hop_dong_ho_so_hop_dong ON HOP_DONG_HO_SO(hop_dong_id);

-- 5. Bảng Phụ lục Hợp đồng
CREATE TABLE IF NOT EXISTS HOP_DONG_PHU_LUC (
    id BIGSERIAL PRIMARY KEY,
    hop_dong_id BIGINT NOT NULL REFERENCES HOP_DONG(id) ON DELETE CASCADE,
    so_phu_luc INT NOT NULL,
    tieu_de VARCHAR(255) NOT NULL,
    ngay_lap DATE NOT NULL DEFAULT CURRENT_DATE,
    ngay_hieu_luc DATE NOT NULL,
    noi_dung_thay_doi TEXT NOT NULL,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'DA_CHOT' CHECK (trang_thai IN ('DRAFT', 'DA_CHOT')),
    nguoi_tao_id BIGINT REFERENCES NGUOI_DUNG(id),
    tao_luc TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_hop_dong_phu_luc_so UNIQUE (hop_dong_id, so_phu_luc)
);

CREATE INDEX IF NOT EXISTS idx_hop_dong_phu_luc_hd ON HOP_DONG_PHU_LUC(hop_dong_id);

-- 6. Seed cấu hình Bên A mẫu cho Toà 1 và Toà 2 (nếu tồn tại)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM TOA_NHA WHERE id = 1) THEN
        INSERT INTO CAU_HINH_BEN_A_TOA_NHA (
            toa_nha_id, loai_chu_the, ten_chu_the, ma_so_dinh_danh, dia_chi_lien_he,
            so_dien_thoai, email, ho_ten_nguoi_ky, chuc_vu_nguoi_ky, tu_cach_ky,
            so_tai_khoan, ten_ngan_hang, chu_tai_khoan
        ) VALUES (
            1, 'CA_NHAN', 'Chủ sở hữu mẫu Toà A', '001090000002', 'Số 12 ngõ 34 đường Hoà Bình, Phường Mẫu, Hà Nội',
            '0900000002', 'chusohootoaA@miniapart.local', 'Chủ sở hữu mẫu', 'Chủ sở hữu', 'CHU_SO_HUU',
            '9704-0000-0000-0101', 'Ngân hàng TMCP Quân Đội (MB)', 'CHU SO HUU TOA A'
        ) ON CONFLICT (toa_nha_id) DO NOTHING;
    END IF;

    IF EXISTS (SELECT 1 FROM TOA_NHA WHERE id = 2) THEN
        INSERT INTO CAU_HINH_BEN_A_TOA_NHA (
            toa_nha_id, loai_chu_the, ten_chu_the, ma_so_dinh_danh, dia_chi_lien_he,
            so_dien_thoai, email, ho_ten_nguoi_ky, chuc_vu_nguoi_ky, tu_cach_ky,
            so_tai_khoan, ten_ngan_hang, chu_tai_khoan
        ) VALUES (
            2, 'CA_NHAN', 'Chủ sở hữu mẫu Toà B', '001090000002', 'Số 8 đường Bến Vân Đồn, Phường Mẫu, TP. Hồ Chí Minh',
            '0900000002', 'chusohootoaB@miniapart.local', 'Chủ sở hữu mẫu', 'Chủ sở hữu', 'CHU_SO_HUU',
            '9704-0000-0000-0202', 'Ngân hàng TMCP Ngoại Thương (Vietcombank)', 'CHU SO HUU TOA B'
        ) ON CONFLICT (toa_nha_id) DO NOTHING;
    END IF;
END $$;

-- 7. Seed Mẫu 10 Điều khoản chuẩn tiếng Việt cho Toà 1 và Toà 2
DO $$
DECLARE
    mau_van_ban TEXT := 'Điều 1. Đối tượng thuê và phạm vi sử dụng
1. Bên A đồng ý cho Bên B thuê và Bên B đồng ý thuê diện tích phòng thuộc toà nhà theo thông tin mô tả tại hợp đồng này.
2. Mục đích thuê: Sử dụng để ở. Bên B cam kết không sử dụng phòng thuê vào mục đích kinh doanh trái phép, tàng trữ hàng cấm, vũ khí, chất cháy nổ hoặc các hoạt động vi phạm pháp luật.
3. Phạm vi sử dụng: Bên B được quyền sử dụng riêng không gian phòng thuê và sử dụng chung các tiện ích công cộng, lối đi chung, thang bộ, thang máy (nếu có) của toà nhà theo đúng nội quy.

Điều 2. Thời hạn, giá thuê, đặt cọc và thanh toán
1. Thời hạn thuê tính từ ngày bắt đầu đến ngày kết thúc ghi nhận tại hợp đồng này.
2. Tiền thuê phòng được thanh toán theo định kỳ thỏa thuận vào trước ngày hạn nộp hàng tháng.
3. Tiền đặt cọc được ghi nhận nhằm bảo đảm việc thực hiện hợp đồng, giữ gìn tài sản và nghĩa vụ thanh toán của Bên B. Tiền đặt cọc không được sử dụng để cấn trừ tiền thuê hàng tháng trừ khi có thỏa thuận bằng văn bản của Bên A.
4. Phương thức thanh toán: Bằng chuyển khoản ngân hàng theo thông tin tài khoản của Bên A hoặc tiền mặt có biên nhận.

Điều 3. Quyền và nghĩa vụ của Bên cho thuê (Bên A)
1. Bàn giao phòng thuê, trang thiết bị và tài sản gắn liền theo đúng thời gian và tình trạng ghi nhận tại Biên bản bàn giao.
2. Bảo đảm quyền sử dụng phòng thuê ổn định, hợp pháp cho Bên B trong suốt thời hạn hợp đồng.
3. Hướng dẫn Bên B thực hiện các quy định về an ninh trật tự, phòng cháy chữa cháy và đăng ký cư trú.
4. Thu tiền thuê phòng, tiền dịch vụ và tiền cọc đúng kỳ hạn thỏa thuận; bảo dưỡng kết cấu công trình chính của toà nhà.

Điều 4. Quyền và nghĩa vụ của Bên thuê (Bên B)
1. Sử dụng phòng đúng mục đích, đúng số lượng người cư trú đã đăng ký với Bên A.
2. Thanh toán đầy đủ, đúng hạn tiền thuê phòng, tiền dịch vụ sinh hoạt (điện, nước, internet, rác...) theo chỉ số thực tế và đơn giá thỏa thuận.
3. Chấp hành nghiêm chỉnh các quy định pháp luật về an ninh trật tự, phòng cháy chữa cháy, bảo vệ môi trường và nội quy toà nhà.
4. Cung cấp đầy đủ giấy tờ tùy thân hợp lệ để Bên A thực hiện thủ tục thông báo lưu trú/đăng ký tạm trú theo quy định.

Điều 5. Sử dụng và bảo quản tài sản, thiết bị
1. Tiếp nhận và bảo quản toàn bộ trang thiết bị, tài sản tại phòng thuê theo đúng Biên bản bàn giao đính kèm hợp đồng.
2. Không được tự ý đục phá tường, thay đổi kết cấu kiến trúc, cơi nới hoặc thay đổi hệ thống điện, nước của phòng thuê khi chưa có sự đồng ý bằng văn bản của Bên A.
3. Khi hết hạn hợp đồng hoặc chấm dứt hợp đồng, Bên B có nghĩa vụ bàn giao lại đầy đủ tài sản cho Bên A theo hiện trạng đã nhận, trừ hao mòn tự nhiên trong quá trình sử dụng hợp lý.

Điều 6. Sửa chữa, bảo trì, hao mòn và hư hỏng
1. Đối với các hư hỏng do hao mòn tự nhiên hoặc lỗi kỹ thuật khách quan của hệ thống chung toà nhà, Bên A có trách nhiệm kiểm tra, sửa chữa và chịu chi phí trong thời gian hợp lý.
2. Đối với các hư hỏng, mất mát phát sinh do lỗi sử dụng, bất cẩn hoặc cố ý của Bên B (hoặc người ở cùng/khách của Bên B), Bên B có trách nhiệm sửa chữa, bồi thường hoặc chịu khấu trừ tiền cọc theo chi phí thực tế đã được hai bên đối chiếu, xác nhận.

Điều 7. Sinh hoạt, khu vực chung, an toàn, PCCC và cư trú
1. Giữ gìn vệ sinh chung, trật tự, không gây tiếng ồn lớn ảnh hưởng đến các phòng lân cận sau 22h00.
2. Nghiêm cấm đun nấu bằng bếp than, củi hoặc các thiết bị tiềm ẩn nguy cơ cháy nổ cao tại phòng không được phép; nghiêm cấm tích trữ hóa chất độc hại, chất cháy nổ.
3. Người đến ở cùng hoặc khách lưu trú qua đêm phải được khai báo với Bên A và cơ quan chức năng theo quy định pháp luật.

Điều 8. Gia hạn, vi phạm, chấm dứt và hoàn trả phòng
1. Khi có nhu cầu gia hạn hợp đồng, Bên B phải thông báo trước cho Bên A bằng văn bản hoặc thông điệp dữ liệu theo thời hạn báo trước đã thỏa thuận. Hai bên sẽ lập Phụ lục hợp đồng hoặc ký Hợp đồng mới.
2. Mỗi bên có quyền đơn phương chấm dứt hợp đồng trước hạn nếu bên kia vi phạm nghiêm trọng nghĩa vụ hợp đồng và không khắc phục trong thời hạn 15 ngày kể từ ngày nhận được thông báo.
3. Khi chấm dứt hợp đồng, Bên B phải dọn sạch đồ đạc cá nhân, hoàn trả phòng và chìa khóa/thẻ ra vào cho Bên A vào đúng ngày kết thúc.

Điều 9. Công nợ, khấu trừ và quyết toán tiền cọc
1. Khi thanh lý hợp đồng và trả phòng, hai bên tiến hành lập Biên bản bàn giao trả phòng, đối chiếu tài sản và chốt chỉ số dịch vụ cuối cùng.
2. Tiền đặt cọc thực thu sẽ được hoàn trả cho Bên B sau khi đã khấu trừ đầy đủ: các khoản tiền thuê còn thiếu, tiền dịch vụ kỳ cuối và chi phí bồi thường thiệt hại tài sản (nếu có căn cứ biên bản và đã được hai bên xác nhận).
3. Mọi khoản khấu trừ phải có căn cứ rõ ràng, được đối soát với Biên bản bàn giao và ghi nhận vào hồ sơ quyết toán.

Điều 10. Hiệu lực, sửa đổi, giải quyết tranh chấp và chữ ký
1. Hợp đồng có hiệu lực kể từ ngày bắt đầu đến ngày kết thúc thỏa thuận tại Điều 2.
2. Mọi sửa đổi, bổ sung hợp đồng chỉ có giá trị khi được lập thành Phụ lục hợp đồng có xác nhận của hai bên.
3. Trong quá trình thực hiện, nếu phát sinh tranh chấp, hai bên ưu tiên thương lượng, hòa giải trên tinh thần hợp tác. Trường hợp không hòa giải được, tranh chấp sẽ được giải quyết tại Tòa án có thẩm quyền theo quy định của pháp luật Việt Nam.
4. Hợp đồng được lập thành 02 (hai) bản có giá trị pháp lý như nhau, mỗi bên giữ 01 (một) bản để thực hiện.';
BEGIN
    IF EXISTS (SELECT 1 FROM TOA_NHA WHERE id = 1) THEN
        INSERT INTO MAU_HOP_DONG (
            toa_nha_id, ten_mau, phien_ban, trang_thai, tieu_de, noi_dung_dieu_khoan, nguoi_tao_id
        ) VALUES (
            1, 'Mẫu hợp đồng chuẩn Toà A (Phiên bản 1)', 1, 'PUBLISHED', 'HỢP ĐỒNG THUÊ PHÒNG', mau_van_ban, 1
        ) ON CONFLICT (toa_nha_id, phien_ban) DO NOTHING;
    END IF;

    IF EXISTS (SELECT 1 FROM TOA_NHA WHERE id = 2) THEN
        INSERT INTO MAU_HOP_DONG (
            toa_nha_id, ten_mau, phien_ban, trang_thai, tieu_de, noi_dung_dieu_khoan, nguoi_tao_id
        ) VALUES (
            2, 'Mẫu hợp đồng chuẩn Toà B (Phiên bản 1)', 1, 'PUBLISHED', 'HỢP ĐỒNG THUÊ PHÒNG', mau_van_ban, 1
        ) ON CONFLICT (toa_nha_id, phien_ban) DO NOTHING;
    END IF;
END $$;

