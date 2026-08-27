package com.prj1.ccm.auth;

public class DangNhapThatBaiException extends RuntimeException {
    public DangNhapThatBaiException() {
        super("Số điện thoại hoặc mật khẩu không đúng");
    }
}
