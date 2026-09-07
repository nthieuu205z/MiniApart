package com.prj1.ccm.billing;
import java.math.BigDecimal;
public record ThongTinQuyetToan(Long hoaDonCuoiId, BigDecimal tongHoaDonCuoi, BigDecimal daThuCoc, BigDecimal congNo, BigDecimal khauTru, BigDecimal hoanCoc, Long hoaDonQuyetToanId) {}
