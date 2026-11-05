package com.prj1.ccm.nguoithue;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDate;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ThongTinNguoiThue(
        Long id,
        String hoTen,
        String ngaySinh,
        String soDienThoai,
        String soGiayToChe,
        String soGiayTo,
        String queQuan,
        List<String> canhBao,
        String loaiGiayTo,
        LocalDate ngayCapGiayTo,
        String noiCapGiayTo,
        String diaChiThuongTru,
        String diaChiLienHe,
        String email
) {
    public ThongTinNguoiThue(
            Long id,
            String hoTen,
            String ngaySinh,
            String soDienThoai,
            String soGiayToChe,
            String soGiayTo,
            String queQuan,
            List<String> canhBao
    ) {
        this(id, hoTen, ngaySinh, soDienThoai, soGiayToChe, soGiayTo, queQuan, canhBao, "CCCD", null, null, null, null, null);
    }

    public static ThongTinNguoiThue tuDanhSach(NguoiThue nguoiThue, List<String> canhBao) {
        return new ThongTinNguoiThue(
                nguoiThue.id(),
                nguoiThue.hoTen(),
                nguoiThue.ngaySinh().toString(),
                nguoiThue.soDienThoai(),
                SoGiayToFormatter.che(nguoiThue.soGiayTo()),
                null,
                nguoiThue.queQuan(),
                List.copyOf(canhBao),
                nguoiThue.loaiGiayTo(),
                nguoiThue.ngayCapGiayTo(),
                nguoiThue.noiCapGiayTo(),
                nguoiThue.diaChiThuongTru(),
                nguoiThue.diaChiLienHe(),
                nguoiThue.email()
        );
    }

    public static ThongTinNguoiThue tuChiTiet(NguoiThue nguoiThue, List<String> canhBao) {
        return new ThongTinNguoiThue(
                nguoiThue.id(),
                nguoiThue.hoTen(),
                nguoiThue.ngaySinh().toString(),
                nguoiThue.soDienThoai(),
                SoGiayToFormatter.che(nguoiThue.soGiayTo()),
                nguoiThue.soGiayTo(),
                nguoiThue.queQuan(),
                List.copyOf(canhBao),
                nguoiThue.loaiGiayTo(),
                nguoiThue.ngayCapGiayTo(),
                nguoiThue.noiCapGiayTo(),
                nguoiThue.diaChiThuongTru(),
                nguoiThue.diaChiLienHe(),
                nguoiThue.email()
        );
    }
}
