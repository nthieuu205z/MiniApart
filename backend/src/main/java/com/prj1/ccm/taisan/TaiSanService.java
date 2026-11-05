package com.prj1.ccm.taisan;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
public class TaiSanService {
    private final TaiSanRepository taiSanRepository;

    public TaiSanService(TaiSanRepository taiSanRepository) {
        this.taiSanRepository = taiSanRepository;
    }

    public List<TaiSanPhongDto> layDanhSachTaiSan(Long phongId) {
        Objects.requireNonNull(phongId, "Mã phòng không được để trống");
        return taiSanRepository.layDanhSachTaiSan(phongId);
    }

    @Transactional
    public Long themTaiSan(Long phongId, YeuCauKhaiBaoTaiSan yeuCau) {
        Objects.requireNonNull(phongId, "Mã phòng không được để trống");
        Objects.requireNonNull(yeuCau, "Yêu cầu khai báo tài sản không được để trống");
        if (yeuCau.tenTaiSan() == null || yeuCau.tenTaiSan().trim().isEmpty()) {
            throw new IllegalArgumentException("Tên tài sản không được để trống");
        }
        return taiSanRepository.themTaiSan(phongId, yeuCau);
    }

    @Transactional
    public boolean xoaTaiSan(Long id) {
        Objects.requireNonNull(id, "Mã tài sản không được để trống");
        return taiSanRepository.xoaTaiSan(id);
    }

    public List<BienBanBanGiaoDto> layDanhSachBienBan(Long hopDongId) {
        Objects.requireNonNull(hopDongId, "Mã hợp đồng không được để trống");
        return taiSanRepository.layDanhSachBienBan(hopDongId);
    }

    @Transactional
    public Long lapBienBan(Long hopDongId, Long nguoiLapId, YeuCauLapBienBan yeuCau) {
        Objects.requireNonNull(hopDongId, "Mã hợp đồng không được để trống");
        Objects.requireNonNull(nguoiLapId, "Người lập không được để trống");
        Objects.requireNonNull(yeuCau, "Dữ liệu biên bản không được để trống");

        if (!List.of("NHAN_PHONG", "TRA_PHONG").contains(yeuCau.loaiBienBan())) {
            throw new IllegalArgumentException("Loại biên bản không hợp lệ: " + yeuCau.loaiBienBan());
        }

        Long phongId = taiSanRepository.layPhongIdTheoHopDong(hopDongId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hợp đồng #" + hopDongId));

        return taiSanRepository.lapBienBan(hopDongId, phongId, nguoiLapId, yeuCau);
    }
}

