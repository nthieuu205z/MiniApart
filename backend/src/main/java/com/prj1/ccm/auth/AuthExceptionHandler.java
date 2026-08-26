package com.prj1.ccm.auth;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class AuthExceptionHandler {

    @ExceptionHandler(DangNhapThatBaiException.class)
    public ResponseEntity<ThongBaoLoi> handleDangNhapThatBai(DangNhapThatBaiException exception) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ThongBaoLoi(exception.getMessage()));
    }
}
