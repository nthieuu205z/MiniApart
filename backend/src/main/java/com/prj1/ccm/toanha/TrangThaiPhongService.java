package com.prj1.ccm.toanha;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

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
    public void dongBoTheoToaNhaId(Long toaNhaId, LocalDate tai) {
        LocalDate ngayTinh = tai != null ? tai : LocalDate.now(clock);
        List<Phong> phong = phongRepository.findByToaNhaIdKemHopDong(toaNhaId);
        Set<Long> phongCoYeuCauKhanCapDangMo = phongRepository.phongIdsCoYeuCauKhanCapDangMo(
                phong.stream().map(Phong::id).toList(),
                Instant.now(clock)
        );
        for (Phong item : phong) {
            capNhatTrangThaiDem(item, ngayTinh, phongCoYeuCauKhanCapDangMo.contains(item.id()));
        }
    }

    private void capNhatTrangThaiDem(Phong phong, LocalDate tai) {
        capNhatTrangThaiDem(
                phong,
                tai,
                phongRepository.coYeuCauKhanCapDangMo(phong.id(), Instant.now(clock))
        );
    }

    private void capNhatTrangThaiDem(Phong phong, LocalDate tai, boolean coYeuCauKhanCapDangMo) {
        TrangThaiPhong trangThaiMoi = phong.tinhLaiTrangThai(
                tai,
                coYeuCauKhanCapDangMo
        );
        if (phong.trangThaiDem() != trangThaiMoi) {
            phongRepository.updateTrangThaiDem(phong.id(), trangThaiMoi);
        }
    }
}
