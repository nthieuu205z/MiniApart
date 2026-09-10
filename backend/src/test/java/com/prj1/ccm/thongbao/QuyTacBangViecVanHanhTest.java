package com.prj1.ccm.thongbao;

import com.prj1.ccm.billing.calc.TrangThaiHoaDon;
import com.prj1.ccm.hopdong.HopDong;
import com.prj1.ccm.hopdong.TrangThaiHopDong;
import com.prj1.ccm.suachua.TrangThaiYeuCau;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class QuyTacBangViecVanHanhTest {
    private static final LocalDate HOM_NAY = LocalDate.of(2040, 8, 15);
    private static final Instant HIEN_TAI = Instant.parse("2040-08-15T03:00:00Z");

    @Test
    void FR_NTF_01_BR_14_hopDongConDungBaMuoiNgayVanLaViecCanXuLyNhungBaMuoiMotNgayThiKhong() {
        QuyTacBangViecVanHanh quyTac = new QuyTacBangViecVanHanh();

        assertThat(quyTac.hopDongSapHetHan(hopDong(HOM_NAY.plusDays(30)), HOM_NAY)).isTrue();
        assertThat(quyTac.hopDongSapHetHan(hopDong(HOM_NAY.plusDays(31)), HOM_NAY)).isFalse();
        assertThat(quyTac.hopDongSapHetHan(hopDong(HOM_NAY.minusDays(1)), HOM_NAY)).isFalse();
    }

    @Test
    void FR_NTF_01_hoaDonQuaHanDungNgayHanVaDaHuyKhongTaoViec() {
        QuyTacBangViecVanHanh quyTac = new QuyTacBangViecVanHanh();

        assertThat(quyTac.hoaDonQuaHanChuaThanhToan(
                HOM_NAY, HOM_NAY, new BigDecimal("100.00"), BigDecimal.ZERO, TrangThaiHoaDon.DA_PHAT_HANH
        )).isFalse();
        assertThat(quyTac.hoaDonQuaHanChuaThanhToan(
                HOM_NAY, HOM_NAY.minusDays(1), new BigDecimal("100.00"), BigDecimal.ZERO, TrangThaiHoaDon.DA_PHAT_HANH
        )).isTrue();
        assertThat(quyTac.hoaDonQuaHanChuaThanhToan(
                HOM_NAY, HOM_NAY.minusDays(1), new BigDecimal("100.00"), BigDecimal.ZERO, TrangThaiHoaDon.DA_HUY
        )).isFalse();
        assertThat(quyTac.hoaDonQuaHanChuaThanhToan(
                HOM_NAY, HOM_NAY.minusDays(1), new BigDecimal("100.00"), new BigDecimal("40.00"), TrangThaiHoaDon.DA_THANH_TOAN
        )).isTrue();
        assertThat(quyTac.hoaDonQuaHanChuaThanhToan(
                HOM_NAY, HOM_NAY.minusDays(1), new BigDecimal("100.00"), new BigDecimal("125.00"), TrangThaiHoaDon.DA_THANH_TOAN
        )).isFalse();
    }

    @Test
    void FR_NTF_01_suCoQuaDungHaiMuoiTamGioMoiCanXuLyVaKhongTinhSuCoVuaDong() {
        QuyTacBangViecVanHanh quyTac = new QuyTacBangViecVanHanh();
        Instant taoLuc = HIEN_TAI.minus(Duration.ofHours(48));

        assertThat(quyTac.suCoTonDongQuaHaiMuoiTamGio(
                taoLuc, TrangThaiYeuCau.MOI_TIEP_NHAN, null, HIEN_TAI
        )).isFalse();
        assertThat(quyTac.suCoTonDongQuaHaiMuoiTamGio(
                taoLuc.minusSeconds(1), TrangThaiYeuCau.MOI_TIEP_NHAN, null, HIEN_TAI
        )).isTrue();
        assertThat(quyTac.suCoTonDongQuaHaiMuoiTamGio(
                taoLuc.minus(Duration.ofHours(24)), TrangThaiYeuCau.DA_DONG, null, HIEN_TAI
        )).isFalse();
        assertThat(quyTac.suCoTonDongQuaHaiMuoiTamGio(
                taoLuc.minus(Duration.ofHours(24)), TrangThaiYeuCau.DA_HUY, null, HIEN_TAI
        )).isFalse();
    }

    @Test
    void FR_NTF_01_suCoChoXacNhanQuaBayMuoiHaiGioCoTrangThaiHieuLucDaDongVaKhongConTrongBangViec() {
        QuyTacBangViecVanHanh quyTac = new QuyTacBangViecVanHanh();
        Instant choXacNhanLuc = HIEN_TAI.minus(Duration.ofHours(72)).minusSeconds(1);

        assertThat(quyTac.suCoTonDongQuaHaiMuoiTamGio(
                HIEN_TAI.minus(Duration.ofHours(96)), TrangThaiYeuCau.CHO_XAC_NHAN, choXacNhanLuc, HIEN_TAI
        )).isFalse();
    }

    @Test
    void FR_NTF_01_nhomRongDuocDanhDauDaXongVaPcccKhongCoNguonKhongDuocGiaLaSoKhong() {
        QuyTacBangViecVanHanh quyTac = new QuyTacBangViecVanHanh();

        assertThat(quyTac.trangThaiNhom(0)).isEqualTo("DA_XONG");
        assertThat(quyTac.trangThaiNhom(2)).isEqualTo("CAN_XU_LY");
        assertThat(QuyTacBangViecVanHanh.PCCC_TRANG_THAI).isEqualTo("CHUA_SAN_SANG");
        assertThat(QuyTacBangViecVanHanh.PCCC_SO_LUONG).isNull();
    }

    private HopDong hopDong(LocalDate ngayKetThuc) {
        return new HopDong(
                1L, 1L, 1L, HOM_NAY.minusDays(30), ngayKetThuc,
                new BigDecimal("100.00"), new BigDecimal("100.00"), 30, TrangThaiHopDong.HIEU_LUC
        );
    }
}
