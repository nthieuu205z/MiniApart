package com.prj1.ccm.toanha;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class PhanQuyenToaService {
    private final ToaNhaRepository toaNhaRepository;

    public PhanQuyenToaService(ToaNhaRepository toaNhaRepository) {
        this.toaNhaRepository = toaNhaRepository;
    }

    public List<ToaNha> danhSachToaNhaNguoiDungDuocXem(NguoiDung nguoiDung) {
        return toaNhaRepository.findAllVisibleByNguoiDung(nguoiDung);
    }

    public ToaNha layToaNhaNeuNguoiDungDuocXem(NguoiDung nguoiDung, Long toaNhaId) {
        ToaNha toaNha = toaNhaRepository.findById(toaNhaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (nguoiDung.vaiTro() == VaiTro.QTHT || toaNhaRepository.existsPhanQuyenToa(nguoiDung.id(), toaNhaId)) {
            return toaNha;
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }
}
