-- V2: Du lieu mau cho phat trien va trinh dien.
--
-- TOAN BO du lieu duoi day la BIA DAT. Khong co ho ten, so dien thoai, hay dia chi
-- nao cua nguoi that. Day la bien phap giam rui ro R-13 trong ke hoach trien khai:
-- may chu do an khong duoc chua du lieu ca nhan that cua nguoi that.
--
-- Mat khau cua ca sau tai khoan deu la: MatKhau@123
-- Bam bang bcorypt he so 10. Moi tai khoan mot ma bam khac nhau du cung mat khau -
-- day la muoi ngau nhien cua bcrypt, va la ly do khong the nhin ma bam ma doan ra
-- hai nguoi dung chung mat khau.

INSERT INTO TOA_NHA (ma_toa, ten, dia_chi, so_tang, ngay_chot_so, so_ngay_han_tt, tk_ngan_hang, nguong_that_thoat)
VALUES
    ('TN-A', 'Toa A - Ngo Hoa Binh',  'So 12 ngo 34 duong Hoa Binh, Phuong Mau, Ha Noi', 5, 1,  7, '0123456789 - Ngan hang Mau', 10.00),
    ('TN-B', 'Toa B - Ngach Ban Mai', 'So 7 ngach 8 duong Ban Mai, Phuong Mau, Ha Noi',  4, 28, 5, '0123456789 - Ngan hang Mau', 12.50);

INSERT INTO NGUOI_DUNG (ho_ten, so_dien_thoai, mat_khau_hash, vai_tro)
VALUES
    ('Quan tri He thong', '0900000001', '$2y$10$1eIyLWAR/RtpM7TH4x.he.LJ3M9RWJjCYMZy7szB8L4neI0Zji5/e', 'QTHT'),
    ('Chu so huu Mau',    '0900000002', '$2y$10$Ulv3dTOFEmR78BdOkx5NVehRyzCOAAu0CWPwfY8FlCpvICg1.jFCa', 'CHU'),
    ('Quan ly Toa A',     '0900000003', '$2y$10$mqOZKEghGH7i12DM/Yl1RehYU/JX8xOFJH1h3N9UfnmGZm20dAe5K', 'QUAN_LY'),
    ('Quan ly Toa B',     '0900000004', '$2y$10$bM369cQseJMgSTgi7BDcwOXRhzd2HWa74WGUJMK66RGqnTKPAf0ua', 'QUAN_LY'),
    ('Tho sua chua Mau',  '0900000005', '$2y$10$x/zh6TcqL5PPJDXusibpNuVlEMe.u5fCi1fao8l7GI82uc.Dq.9r.', 'THO'),
    ('Nguoi thue Mau',    '0900000006', '$2y$10$5EbWG2I7QG.1QwcvijrWBOPvB7QGjXIResIHUJwtYNSjm.wiP6cle', 'NGUOI_THUE');

-- Pham vi truy cap. Chu ý cach gan nay: no dung de kiem thu FR-AUT-05.
--   Quan ly Toa A  -> chi toa A
--   Quan ly Toa B  -> chi toa B
--   Chu so huu     -> ca hai toa
--   Tho, Nguoi thue-> toa A
-- Nho co hai quan ly moi toa mot nguoi ma ticket 06 moi thu duoc phep tan cong:
-- dang nhap bang Quan ly Toa A roi goi thang du lieu toa B.
INSERT INTO PHAN_QUYEN_TOA (nguoi_dung_id, toa_nha_id)
SELECT nd.id, tn.id
FROM NGUOI_DUNG nd
JOIN TOA_NHA tn ON (
        (nd.so_dien_thoai = '0900000002')                                 -- Chu so huu: ca hai toa
     OR (nd.so_dien_thoai = '0900000003' AND tn.ma_toa = 'TN-A')
     OR (nd.so_dien_thoai = '0900000004' AND tn.ma_toa = 'TN-B')
     OR (nd.so_dien_thoai = '0900000005' AND tn.ma_toa = 'TN-A')
     OR (nd.so_dien_thoai = '0900000006' AND tn.ma_toa = 'TN-A')
);

-- Quan tri He thong (0900000001) co y KHONG co dong nao trong PHAN_QUYEN_TOA.
-- Vai tro do thay tat ca theo vai tro, khong theo danh sach gan. Ticket 06 phai
-- xu ly dung truong hop nay: bang phan quyen rong khong co nghia la khong thay gi.
