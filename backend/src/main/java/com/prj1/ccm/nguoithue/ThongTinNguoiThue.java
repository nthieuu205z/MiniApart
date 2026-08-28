package com.prj1.ccm.nguoithue;

import com.fasterxml.jackson.annotation.JsonInclude;

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
        List<String> canhBao
) {
    public static ThongTinNguoiThue tuDanhSach(NguoiThue nguoiThue, List<String> canhBao) {
        return new ThongTinNguoiThue(
                nguoiThue.id(),
                nguoiThue.hoTen(),
                nguoiThue.ngaySinh().toString(),
                nguoiThue.soDienThoai(),
                SoGiayToFormatter.che(nguoiThue.soGiayTo()),
                null,
                nguoiThue.queQuan(),
                List.copyOf(canhBao)
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
                List.copyOf(canhBao)
        );
    }
}
