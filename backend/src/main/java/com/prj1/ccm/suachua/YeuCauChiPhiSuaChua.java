package com.prj1.ccm.suachua;

/** FR-MNT-05/FR-MNT-06 command; chiPhi stays textual so the API can reject exponent and over-precision forms. */
public record YeuCauChiPhiSuaChua(
        String chiPhi,
        BenChiuChiPhi benChiuChiPhi
) {
}
