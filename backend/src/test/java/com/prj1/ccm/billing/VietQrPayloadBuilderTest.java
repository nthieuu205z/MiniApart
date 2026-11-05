package com.prj1.ccm.billing;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class VietQrPayloadBuilderTest {

    @Test
    void FR_INV_10_buildsVerifiedVietQrGoldenPayloadWithServiceAsMerchantAccountSibling() {
        String payload = VietQrPayloadBuilder.tao(
                "970422",
                "000000000202",
                new BigDecimal("888000.00"),
                "TN-B-201-202608"
        );

        assertThat(payload).isEqualTo(
                "00020101021238560010A000000727012600069704220112000000000202"
                        + "0208QRIBFTTA53037045409888000.005802VN62190815TN-B-201-20260863048514"
        );
    }
}
