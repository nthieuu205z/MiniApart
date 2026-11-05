package com.prj1.ccm.hopdong;

public record YeuCauChotHoSo(
        Integer expectedRevision,
        Integer revision,
        YeuCauLuuDraftHoSo duLieuHoSo
) {
    public Integer getEffectiveRevision() {
        return expectedRevision != null ? expectedRevision : revision;
    }
}
