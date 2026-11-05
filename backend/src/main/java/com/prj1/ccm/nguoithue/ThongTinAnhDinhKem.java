package com.prj1.ccm.nguoithue;

record ThongTinAnhDinhKem(Long id, String doiTuongLoai, Long doiTuongId, String ghiChu, String loaiNoiDung, long kichThuoc) {
    static ThongTinAnhDinhKem tu(AnhDinhKem anh) {
        return new ThongTinAnhDinhKem(anh.id(), anh.doiTuongLoai(), anh.doiTuongId(), anh.ghiChu(), anh.loaiNoiDung(), anh.kichThuoc());
    }
}
