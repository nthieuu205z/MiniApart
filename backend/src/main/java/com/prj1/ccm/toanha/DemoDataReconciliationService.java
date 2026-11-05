package com.prj1.ccm.toanha;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Quy trình đối soát dữ liệu mẫu đã chèn (Demo Data Reconciliation Service).
 * Tuân thủ nghiêm ngặt nguyên tắc: KHÔNG xoá dữ liệu chỉ bằng tên hoặc ID.
 * Căn cứ nguồn gốc mẫu kết hợp đối soát lịch sử giao dịch phát sinh:
 * - Nếu phòng/tài sản mẫu đã phát sinh hợp đồng thật, chỉ số công tơ, hoặc hóa đơn thanh toán:
 *   BẢO TOÀN NGUYÊN TRẠNG, xem như dữ liệu nghiệp vụ chính thức.
 * - Nếu hoàn toàn không phát sinh giao dịch thật:
 *   Gắn cờ nhận diện để quản trị viên kiểm tra và quyết định lưu trữ (archive).
 */
@Service
public class DemoDataReconciliationService {

    private static final Logger log = LoggerFactory.getLogger(DemoDataReconciliationService.class);
    private final JdbcTemplate jdbcTemplate;

    public DemoDataReconciliationService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public record PhongDoiSoat(
            Long id,
            Long toaNhaId,
            String soPhong,
            boolean coHopDong,
            boolean coHoaDon,
            boolean coChiSo,
            boolean trungKhopMauDemo,
            String khuyenNghi
    ) {}

    public List<PhongDoiSoat> doiSoatPhongMau() {
        String sql = """
                SELECT p.id, p.toa_nha_id, p.so_phong,
                       EXISTS(SELECT 1 FROM HOP_DONG hd WHERE hd.phong_id = p.id) AS co_hop_dong,
                       EXISTS(SELECT 1 FROM HOA_DON h JOIN HOP_DONG hd ON hd.id = h.hop_dong_id WHERE hd.phong_id = p.id) AS co_hoa_don,
                       EXISTS(SELECT 1 FROM CHI_SO_DICH_VU cs WHERE cs.phong_id = p.id) AS co_chi_so,
                       (p.mo_ta LIKE '%Phòng tầng 1 thuận tiện đi lại%' OR p.mo_ta LIKE '%Căn hộ dịch vụ trung tâm%') AS trung_khop_mau
                FROM PHONG p
                WHERE p.id IN (101, 102, 201, 202, 301, 302, 20101, 20201)
                ORDER BY p.id
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            boolean coHd = rs.getBoolean("co_hop_dong");
            boolean coHdon = rs.getBoolean("co_hoa_don");
            boolean coCs = rs.getBoolean("co_chi_so");
            boolean trungMau = rs.getBoolean("trung_khop_mau");

            String khuyenNghi;
            if (coHd || coHdon || coCs) {
                khuyenNghi = "GIU_NGUYEN_VI_DA_PHAT_SINH_GIAO_DICH";
            } else if (trungMau) {
                khuyenNghi = "DU_LIEU_DEMO_CHUA_PHAT_SINH_GIAO_DICH_CAN_XAC_NHAN";
            } else {
                khuyenNghi = "DU_LIEU_THAT_GIU_NGUYEN";
            }

            return new PhongDoiSoat(
                    rs.getLong("id"),
                    rs.getLong("toa_nha_id"),
                    rs.getString("so_phong"),
                    coHd,
                    coHdon,
                    coCs,
                    trungMau,
                    khuyenNghi
            );
        });
    }
}

