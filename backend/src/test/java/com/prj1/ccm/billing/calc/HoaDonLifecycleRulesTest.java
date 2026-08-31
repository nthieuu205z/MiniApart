package com.prj1.ccm.billing.calc;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

import java.time.LocalDate;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class HoaDonLifecycleRulesTest {

    @Test
    void FR_INV_05_BR_08_allowsDraftInvoiceContentEditsButLocksReleasedStates() {
        QuyTacTrangThaiHoaDon quyTac = new QuyTacTrangThaiHoaDon();

        assertThat(quyTac.choPhepSuaNoiDung(TrangThaiHoaDon.NHAP)).isTrue();
        assertThat(quyTac.choPhepSuaNoiDung(TrangThaiHoaDon.DA_PHAT_HANH)).isFalse();
    }

    @Test
    void FR_INV_06_BR_08_marksInvoiceOverdueWhenDueDatePassedAndPaymentIsStillIncomplete() {
        TrangThaiHoaDon trangThai = new QuyTacTrangThaiHoaDon().ghiNhanThanhToan(
                TrangThaiHoaDon.DA_PHAT_HANH,
                BillingCalcTestFixtures.tien("1888000"),
                BillingCalcTestFixtures.tien("1000000"),
                LocalDate.of(2026, 9, 5),
                LocalDate.of(2026, 9, 2)
        );

        assertThat(trangThai).isEqualTo(TrangThaiHoaDon.QUA_HAN);
    }

    @Test
    void FR_INV_06_BR_08_requiresOwnerRoleAndCancellationReasonToCancelReleasedInvoice() {
        TrangThaiHoaDon trangThai = new QuyTacTrangThaiHoaDon()
                .huy(TrangThaiHoaDon.DA_PHAT_HANH, true, "Sai bang gia ap dung");

        assertThat(trangThai).isEqualTo(TrangThaiHoaDon.DA_HUY);
    }

    @Test
    void BR_08_allowsOnlyTheDocumentedInvoiceLifecycleSteps() {
        QuyTacTrangThaiHoaDon quyTac = new QuyTacTrangThaiHoaDon();

        assertThat(quyTac.chuyen(TrangThaiHoaDon.NHAP, TrangThaiHoaDon.DA_PHAT_HANH))
                .isEqualTo(TrangThaiHoaDon.DA_PHAT_HANH);
        assertThat(quyTac.chuyen(TrangThaiHoaDon.DA_PHAT_HANH, TrangThaiHoaDon.DA_THU_MOT_PHAN))
                .isEqualTo(TrangThaiHoaDon.DA_THU_MOT_PHAN);
        assertThat(quyTac.chuyen(TrangThaiHoaDon.DA_THU_MOT_PHAN, TrangThaiHoaDon.DA_THANH_TOAN))
                .isEqualTo(TrangThaiHoaDon.DA_THANH_TOAN);
        assertThat(quyTac.chuyen(TrangThaiHoaDon.DA_PHAT_HANH, TrangThaiHoaDon.QUA_HAN))
                .isEqualTo(TrangThaiHoaDon.QUA_HAN);
        assertThat(quyTac.chuyen(TrangThaiHoaDon.DA_THU_MOT_PHAN, TrangThaiHoaDon.QUA_HAN))
                .isEqualTo(TrangThaiHoaDon.QUA_HAN);
        assertThat(quyTac.chuyen(TrangThaiHoaDon.QUA_HAN, TrangThaiHoaDon.DA_THANH_TOAN))
                .isEqualTo(TrangThaiHoaDon.DA_THANH_TOAN);
        assertThat(quyTac.chuyen(TrangThaiHoaDon.DA_PHAT_HANH, TrangThaiHoaDon.DA_HUY))
                .isEqualTo(TrangThaiHoaDon.DA_HUY);
        assertThat(quyTac.chuyen(TrangThaiHoaDon.NHAP, TrangThaiHoaDon.DA_HUY))
                .isEqualTo(TrangThaiHoaDon.DA_HUY);
    }

    @ParameterizedTest
    @MethodSource("cacBuocChuyenKhongHopLe")
    void BR_08_rejectsEveryInvalidInvoiceStateTransition(TrangThaiHoaDon hienTai, TrangThaiHoaDon mongMuon) {
        assertThatThrownBy(() -> new QuyTacTrangThaiHoaDon().chuyen(hienTai, mongMuon))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(hienTai.name())
                .hasMessageContaining(mongMuon.name());
    }

    @Test
    void BR_08_paidInvoiceCannotTransitionBackwardAfterItBecomesTerminal() {
        QuyTacTrangThaiHoaDon quyTac = new QuyTacTrangThaiHoaDon();

        for (TrangThaiHoaDon mongMuon : EnumSet.of(
                TrangThaiHoaDon.NHAP,
                TrangThaiHoaDon.DA_PHAT_HANH,
                TrangThaiHoaDon.DA_THU_MOT_PHAN,
                TrangThaiHoaDon.QUA_HAN,
                TrangThaiHoaDon.DA_HUY
        )) {
            assertThatThrownBy(() -> quyTac.chuyen(TrangThaiHoaDon.DA_THANH_TOAN, mongMuon))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    static Stream<org.junit.jupiter.params.provider.Arguments> cacBuocChuyenKhongHopLe() {
        Map<TrangThaiHoaDon, EnumSet<TrangThaiHoaDon>> hopLe = new EnumMap<>(TrangThaiHoaDon.class);
        hopLe.put(TrangThaiHoaDon.NHAP, EnumSet.of(TrangThaiHoaDon.DA_PHAT_HANH, TrangThaiHoaDon.DA_HUY));
        hopLe.put(TrangThaiHoaDon.DA_PHAT_HANH, EnumSet.of(
                TrangThaiHoaDon.DA_THU_MOT_PHAN,
                TrangThaiHoaDon.QUA_HAN,
                TrangThaiHoaDon.DA_HUY
        ));
        hopLe.put(TrangThaiHoaDon.DA_THU_MOT_PHAN, EnumSet.of(
                TrangThaiHoaDon.DA_THANH_TOAN,
                TrangThaiHoaDon.QUA_HAN
        ));
        hopLe.put(TrangThaiHoaDon.QUA_HAN, EnumSet.of(TrangThaiHoaDon.DA_THANH_TOAN));
        hopLe.put(TrangThaiHoaDon.DA_THANH_TOAN, EnumSet.noneOf(TrangThaiHoaDon.class));
        hopLe.put(TrangThaiHoaDon.DA_HUY, EnumSet.noneOf(TrangThaiHoaDon.class));

        return Stream.of(TrangThaiHoaDon.values())
                .flatMap(hienTai -> Stream.of(TrangThaiHoaDon.values())
                        .filter(mongMuon -> hienTai != mongMuon)
                        .filter(mongMuon -> !hopLe.get(hienTai).contains(mongMuon))
                        .map(mongMuon -> org.junit.jupiter.params.provider.Arguments.of(hienTai, mongMuon)));
    }
}
