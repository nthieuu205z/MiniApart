package com.prj1.ccm.toanha;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.Clock;
import java.time.LocalDate;

@Service
public class TrangThaiPhongService {
    private final PhongRepository phongRepository;
    private final Clock clock;

    public TrangThaiPhongService(PhongRepository phongRepository, Clock clock) {
        this.phongRepository = phongRepository;
        this.clock = clock;
    }

    @Transactional
    public void dongBoTheoPhongId(Long phongId) {
        Phong phong = phongRepository.findByIdKemHopDong(phongId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        capNhatTrangThaiDem(phong, LocalDate.now(clock));
    }

    @Transactional
    public void dongBoTheoToaNhaId(Long toaNhaId) {
        LocalDate homNay = LocalDate.now(clock);
        for (Phong phong : phongRepository.findByToaNhaIdKemHopDong(toaNhaId)) {
            capNhatTrangThaiDem(phong, homNay);
        }
    }

    private void capNhatTrangThaiDem(Phong phong, LocalDate homNay) {
        TrangThaiPhong trangThaiMoi = phong.tinhLaiTrangThai(homNay);
        if (phong.trangThaiDem() != trangThaiMoi) {
            phongRepository.updateTrangThaiDem(phong.id(), trangThaiMoi);
        }
    }
}
