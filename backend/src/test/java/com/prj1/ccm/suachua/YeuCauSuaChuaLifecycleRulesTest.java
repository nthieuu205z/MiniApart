package com.prj1.ccm.suachua;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import java.time.Duration;
import java.time.Instant;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class YeuCauSuaChuaLifecycleRulesTest {
    private static final String LY_DO_HUY = "Khach bao nham yeu cau";
    private static final Map<TrangThaiYeuCau, Set<TrangThaiYeuCau>> CAC_BUOC_HOP_LE = taoBangChuyenHopLe();

    @Test
    void BR_16_containsTheSevenDocumentedRepairRequestStates() {
        assertThat(TrangThaiYeuCau.values()).containsExactly(
                TrangThaiYeuCau.MOI_TIEP_NHAN,
                TrangThaiYeuCau.DA_TIEP_NHAN,
                TrangThaiYeuCau.DA_PHAN_CONG,
                TrangThaiYeuCau.DANG_XU_LY,
                TrangThaiYeuCau.CHO_XAC_NHAN,
                TrangThaiYeuCau.DA_DONG,
                TrangThaiYeuCau.DA_HUY
        );
    }

    @ParameterizedTest
    @MethodSource("cacCapChuyenHopLe")
    void FR_MNT_03_BR_16_allowsEveryDocumentedTransition(
            TrangThaiYeuCau hienTai,
            TrangThaiYeuCau mongMuon
    ) {
        assertThat(new QuyTacTrangThaiYeuCau().chuyen(hienTai, mongMuon, LY_DO_HUY))
                .isEqualTo(mongMuon);
    }

    @ParameterizedTest
    @MethodSource("cacCapChuyenKhongHopLe")
    void FR_MNT_03_BR_16_rejectsEveryTransitionOutsideTheDocumentedGraph(
            TrangThaiYeuCau hienTai,
            TrangThaiYeuCau mongMuon
    ) {
        assertThatThrownBy(() -> new QuyTacTrangThaiYeuCau().chuyen(hienTai, mongMuon, LY_DO_HUY))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(hienTai.name())
                .hasMessageContaining(mongMuon.name());
    }

    @ParameterizedTest
    @MethodSource("cacTrangThaiTruocKhiDong")
    void FR_MNT_03_BR_16_allowsCancellationFromEveryStateBeforeClosed(
            TrangThaiYeuCau hienTai
    ) {
        assertThat(new QuyTacTrangThaiYeuCau().huy(hienTai, LY_DO_HUY))
                .isEqualTo(TrangThaiYeuCau.DA_HUY);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "\t", "\n"})
    void FR_MNT_03_BR_16_requiresAReasonWhenCancelling(String lyDo) {
        assertThatThrownBy(() -> new QuyTacTrangThaiYeuCau().huy(
                TrangThaiYeuCau.DA_TIEP_NHAN,
                lyDo
        )).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void FR_MNT_03_BR_16_exposesOneActionMethodForEachForwardTransition() {
        QuyTacTrangThaiYeuCau quyTac = new QuyTacTrangThaiYeuCau();

        assertThat(quyTac.tiepNhan(TrangThaiYeuCau.MOI_TIEP_NHAN)).isEqualTo(TrangThaiYeuCau.DA_TIEP_NHAN);
        assertThat(quyTac.phanCong(TrangThaiYeuCau.DA_TIEP_NHAN)).isEqualTo(TrangThaiYeuCau.DA_PHAN_CONG);
        assertThat(quyTac.batDauXuLy(TrangThaiYeuCau.DA_PHAN_CONG)).isEqualTo(TrangThaiYeuCau.DANG_XU_LY);
        assertThat(quyTac.baoDaSuaXong(TrangThaiYeuCau.DANG_XU_LY)).isEqualTo(TrangThaiYeuCau.CHO_XAC_NHAN);
        assertThat(quyTac.xacNhanDong(TrangThaiYeuCau.CHO_XAC_NHAN)).isEqualTo(TrangThaiYeuCau.DA_DONG);
    }

    @Test
    void FR_MNT_07_BR_16_derivesClosedAtExactly72HoursWithoutMutatingStoredState() {
        QuyTacTrangThaiYeuCau quyTac = new QuyTacTrangThaiYeuCau();
        Instant choXacNhanLuc = Instant.parse("2040-08-15T03:00:00Z");

        assertThat(quyTac.trangThaiHieuLuc(
                TrangThaiYeuCau.CHO_XAC_NHAN,
                choXacNhanLuc,
                choXacNhanLuc.plus(Duration.ofHours(72)).minusSeconds(1)
        )).isEqualTo(TrangThaiYeuCau.CHO_XAC_NHAN);
        assertThat(quyTac.trangThaiHieuLuc(
                TrangThaiYeuCau.CHO_XAC_NHAN,
                choXacNhanLuc,
                choXacNhanLuc.plus(Duration.ofHours(72))
        )).isEqualTo(TrangThaiYeuCau.DA_DONG);
        assertThat(quyTac.trangThaiHieuLuc(
                TrangThaiYeuCau.DANG_XU_LY,
                choXacNhanLuc,
                choXacNhanLuc.plus(Duration.ofDays(10))
        )).isEqualTo(TrangThaiYeuCau.DANG_XU_LY);
    }

    static Stream<Arguments> cacCapChuyenHopLe() {
        return CAC_BUOC_HOP_LE.entrySet().stream()
                .flatMap(entry -> entry.getValue().stream()
                        .map(mongMuon -> Arguments.of(entry.getKey(), mongMuon)));
    }

    static Stream<Arguments> cacCapChuyenKhongHopLe() {
        return Stream.of(TrangThaiYeuCau.values())
                .flatMap(hienTai -> Stream.of(TrangThaiYeuCau.values())
                        .filter(mongMuon -> !CAC_BUOC_HOP_LE.get(hienTai).contains(mongMuon))
                        .map(mongMuon -> Arguments.of(hienTai, mongMuon)));
    }

    static Stream<Arguments> cacTrangThaiTruocKhiDong() {
        return Stream.of(
                TrangThaiYeuCau.MOI_TIEP_NHAN,
                TrangThaiYeuCau.DA_TIEP_NHAN,
                TrangThaiYeuCau.DA_PHAN_CONG,
                TrangThaiYeuCau.DANG_XU_LY,
                TrangThaiYeuCau.CHO_XAC_NHAN
        ).map(Arguments::of);
    }

    private static Map<TrangThaiYeuCau, Set<TrangThaiYeuCau>> taoBangChuyenHopLe() {
        Map<TrangThaiYeuCau, Set<TrangThaiYeuCau>> hopLe = new EnumMap<>(TrangThaiYeuCau.class);
        hopLe.put(TrangThaiYeuCau.MOI_TIEP_NHAN, EnumSet.of(TrangThaiYeuCau.DA_TIEP_NHAN, TrangThaiYeuCau.DA_HUY));
        hopLe.put(TrangThaiYeuCau.DA_TIEP_NHAN, EnumSet.of(TrangThaiYeuCau.DA_PHAN_CONG, TrangThaiYeuCau.DA_HUY));
        hopLe.put(TrangThaiYeuCau.DA_PHAN_CONG, EnumSet.of(TrangThaiYeuCau.DANG_XU_LY, TrangThaiYeuCau.DA_HUY));
        hopLe.put(TrangThaiYeuCau.DANG_XU_LY, EnumSet.of(TrangThaiYeuCau.CHO_XAC_NHAN, TrangThaiYeuCau.DA_HUY));
        hopLe.put(TrangThaiYeuCau.CHO_XAC_NHAN, EnumSet.of(TrangThaiYeuCau.DA_DONG, TrangThaiYeuCau.DA_HUY));
        hopLe.put(TrangThaiYeuCau.DA_DONG, EnumSet.noneOf(TrangThaiYeuCau.class));
        hopLe.put(TrangThaiYeuCau.DA_HUY, EnumSet.noneOf(TrangThaiYeuCau.class));
        return Map.copyOf(hopLe);
    }
}
