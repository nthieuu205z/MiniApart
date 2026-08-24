-- V1: Luoc do nen cho Vertical Slice 0.
-- Ba bang: NGUOI_DUNG, TOA_NHA, PHAN_QUYEN_TOA. Theo ERD o Chuong 3
-- (Doc/diagrams-v2/07-erd-v2.mmd).
--
-- QUY UOC 2: tep nay da chay thi KHONG duoc sua. Moi thay doi ve sau di qua
-- mot tep V2, V3... moi. Flyway luu ma bam cua tung tep va tu choi khoi dong
-- neu phat hien tep cu bi thay doi.

CREATE TABLE NGUOI_DUNG (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ho_ten            VARCHAR(100) NOT NULL,
    so_dien_thoai     VARCHAR(15)  NOT NULL,
    mat_khau_hash     VARCHAR(100) NOT NULL,
    vai_tro           VARCHAR(20)  NOT NULL,
    trang_thai        VARCHAR(20)  NOT NULL DEFAULT 'HOAT_DONG',

    -- ADR-0001: moi access token mang claim `ver` bang gia tri nay. Tang len mot
    -- la moi token da phat cho nguoi nay het hieu luc ngay lap tuc. Day la cach
    -- FR-AUT-07 (thu hoi quyen thi phien chet trong 5 phut) duoc thoa.
    phien_ban_token   INTEGER      NOT NULL DEFAULT 0,

    -- FR-AUT-02: khoa tam sau 5 lan dang nhap sai trong 15 phut. Ticket 04 dung den.
    so_lan_sai        INTEGER      NOT NULL DEFAULT 0,
    lan_sai_dau_tien  TIMESTAMPTZ,
    khoa_den          TIMESTAMPTZ,

    tao_luc           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    sua_luc           TIMESTAMPTZ  NOT NULL DEFAULT now(),

    -- FR-AUT-01: so dien thoai la danh tinh dang nhap, phai duy nhat. Ep o tang
    -- CSDL chu khong chi kiem trong ma ung dung: hai nguoi cung bam Luu mot luc
    -- thi phep kiem o tang ung dung ho, con rang buoc o day thi khong.
    CONSTRAINT uk_nguoi_dung_sdt UNIQUE (so_dien_thoai),

    -- FR-AUT-04: dung nam vai tro. Dat o day de du lieu rac khong vao duoc bang,
    -- ke ca khi co ai do sua truc tiep bang psql.
    CONSTRAINT ck_nguoi_dung_vai_tro
        CHECK (vai_tro IN ('QTHT', 'CHU', 'QUAN_LY', 'THO', 'NGUOI_THUE')),
    CONSTRAINT ck_nguoi_dung_trang_thai
        CHECK (trang_thai IN ('HOAT_DONG', 'BI_KHOA'))
);

COMMENT ON TABLE  NGUOI_DUNG IS 'Tai khoan dang nhap. Tach khoi NGUOI_THUE vi khong phai nguoi thue nao cung co tai khoan (CR-001)';
COMMENT ON COLUMN NGUOI_DUNG.phien_ban_token IS 'ADR-0001: tang len mot de thu hoi moi token da phat';

CREATE TABLE TOA_NHA (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ma_toa            VARCHAR(20)   NOT NULL,
    ten               VARCHAR(100)  NOT NULL,
    dia_chi           VARCHAR(255)  NOT NULL,
    so_tang           INTEGER       NOT NULL,

    -- Ngay trong thang chot so cong to, 1..28. Khong cho 29-31 vi thang hai
    -- khong co nhung ngay do, va mot ky khong chot duoc la ca toa nha khong ra
    -- duoc hoa don.
    ngay_chot_so      INTEGER       NOT NULL DEFAULT 1,
    so_ngay_han_tt    INTEGER       NOT NULL DEFAULT 7,
    tk_ngan_hang      VARCHAR(100),

    -- QUY UOC 1: moi so tien va moi dai luong tham gia tinh tien deu la NUMERIC,
    -- khong bao gio la kieu dau phay dong.
    nguong_that_thoat NUMERIC(15,2) NOT NULL DEFAULT 10.00,

    tao_luc           TIMESTAMPTZ   NOT NULL DEFAULT now(),
    sua_luc           TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT uk_toa_nha_ma UNIQUE (ma_toa),
    CONSTRAINT ck_toa_nha_ngay_chot CHECK (ngay_chot_so BETWEEN 1 AND 28),
    CONSTRAINT ck_toa_nha_so_tang   CHECK (so_tang > 0),
    CONSTRAINT ck_toa_nha_han_tt    CHECK (so_ngay_han_tt >= 0)
);

COMMENT ON COLUMN TOA_NHA.ngay_chot_so IS 'Gioi han 1..28 de ky nao cung chot duoc, ke ca thang hai';

-- FR-AUT-05: nguoi dung chi thay du lieu cua toa duoc gan. Bang nay la nguon
-- su that cua pham vi do.
CREATE TABLE PHAN_QUYEN_TOA (
    nguoi_dung_id BIGINT      NOT NULL,
    toa_nha_id    BIGINT      NOT NULL,
    tao_luc       TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (nguoi_dung_id, toa_nha_id),

    -- Xoa nguoi dung thi don theo phan quyen. Nhung FR-AUT-06 cam xoa tai khoan
    -- da phat sinh du lieu, nen duong nay tren thuc te khong dung toi.
    CONSTRAINT fk_pqt_nguoi_dung FOREIGN KEY (nguoi_dung_id)
        REFERENCES NGUOI_DUNG (id) ON DELETE CASCADE,
    CONSTRAINT fk_pqt_toa_nha FOREIGN KEY (toa_nha_id)
        REFERENCES TOA_NHA (id) ON DELETE CASCADE
);

-- Truy van chay nhieu nhat: "nguoi nay duoc vao nhung toa nao". Khoa chinh da
-- phuc vu chieu do; chi muc nay phuc vu chieu nguoc lai.
CREATE INDEX idx_pqt_toa_nha ON PHAN_QUYEN_TOA (toa_nha_id);
