package com.prj1.ccm.auth;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class AuthExceptionHandler {

    @ExceptionHandler(DangNhapThatBaiException.class)
    public ResponseEntity<ThongBaoLoi> handleDangNhapThatBai(DangNhapThatBaiException exception) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ThongBaoLoi(exception.getMessage()));
    }

    @ExceptionHandler(DangNhapTamKhoaException.class)
    public ResponseEntity<ThongBaoLoi> handleDangNhapTamKhoa(DangNhapTamKhoaException exception) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ThongBaoLoi(exception.getMessage()));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ThongBaoLoi> handleResponseStatus(ResponseStatusException exception) {
        return ResponseEntity.status(exception.getStatusCode())
                .body(new ThongBaoLoi(thongBaoCho(exception)));
    }

    private String thongBaoCho(ResponseStatusException exception) {
        if (exception.getReason() != null && !exception.getReason().isBlank()) {
            return exception.getReason();
        }

        return switch (exception.getStatusCode().value()) {
            case 400 -> "Dữ liệu không hợp lệ";
            case 403 -> "Bạn không có quyền thực hiện thao tác này";
            case 404 -> "Không tìm thấy dữ liệu";
            case 409 -> "Dữ liệu đã tồn tại";
            case 503 -> "Dịch vụ tạm thời không khả dụng";
            default -> "Yêu cầu không thể thực hiện";
        };
    }
}
