package com.prj1.ccm.toanha;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Quy trình đối soát và nhận diện ứng viên dữ liệu mẫu (Demo Data Reconciliation).
 * Tuân thủ nghiêm ngặt nguyên tắc an toàn dữ liệu:
 * 1. Tuyệt đối KHÔNG tự ý xóa, lưu trữ (archive), hoặc gắn nhãn dữ liệu dựa trên phỏng đoán heuristic.
 * 2. Chỉ truy vấn và trả về danh sách các ứng viên cần quản trị viên kiểm tra và xác nhận thủ công.
 * 3. Cung cấp đầy đủ thông tin giao dịch (hợp đồng, hóa đơn, chỉ số điện nước) để đảm bảo không chạm vào dữ liệu thật.
 */
@Service
public class DemoDataReconciliationService {

    private static final Logger log = LoggerFactory.getLogger(DemoDataReconciliationService.class);
    private final JdbcTemplate jdbcTemplate;

    public DemoDataReconciliationService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public record UngVienDoiSoat(
            Long phongId,
            Long toaNhaId,
            String soPhong,
            boolean coHopDong,
            boolean coHoaDon,
            boolean coChiSo,
            boolean coTaiSan,
            boolean chuaTienToDemo,
            String ghiChuKiemTra
    ) {}

    /**
     * Lấy danh sách các phòng có dấu hiệu dữ liệu mẫu để quản trị viên đối soát thủ công.
     * Phương thức này ở chế độ READ-ONLY, hoàn toàn không thay đổi cơ sở dữ liệu.
     */
    public List<UngVienDoiSoat> timUngVienCanDoiSoat() {
        String sql = """
                SELECT p.id, p.toa_nha_id, p.so_phong,
                       EXISTS(SELECT 1 FROM HOP_DONG hd WHERE hd.phong_id = p.id) AS co_hop_dong,
                       EXISTS(SELECT 1 FROM HOA_DON h JOIN HOP_DONG hd ON hd.id = h.hop_dong_id WHERE hd.phong_id = p.id) AS co_hoa_don,
                       EXISTS(SELECT 1 FROM CHI_SO_DICH_VU cs WHERE cs.phong_id = p.id) AS co_chi_so,
                       EXISTS(SELECT 1 FROM TAI_SAN_PHONG ts WHERE ts.phong_id = p.id) AS co_tai_san,
                       (p.mo_ta LIKE '[DEMO]%' OR p.mo_ta LIKE '%Phòng tầng 1 thuận tiện đi lại%') AS chua_tien_to_demo
                FROM PHONG p
                WHERE p.mo_ta LIKE '[DEMO]%' 
                   OR p.mo_ta LIKE '%Phòng tầng 1 thuận tiện đi lại%'
                   OR p.mo_ta LIKE '%Căn hộ dịch vụ trung tâm%'
                   OR p.id IN (101, 102, 201, 202, 301, 302, 20101, 20201)
                ORDER BY p.id
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            boolean coHd = rs.getBoolean("co_hop_dong");
            boolean coHdon = rs.getBoolean("co_hoa_don");
            boolean coCs = rs.getBoolean("co_chi_so");
            boolean coTs = rs.getBoolean("co_tai_san");
            boolean coDemoPrefix = rs.getBoolean("chua_tien_to_demo");

            String ghiChu;
            if (coHd || coHdon || coCs) {
                ghiChu = "DỮ LIỆU ĐÃ PHÁT SINH GIAO DỊCH NGHIỆP VỤ: KHUYẾN NGHỊ BẢO TOÀN NGUYÊN TRẠNG";
            } else if (coDemoPrefix) {
                ghiChu = "ỨNG VIÊN DỮ LIỆU MẪU CHƯA PHÁT SINH GIAO DỊCH: CẦN QUẢN TRỊ VIÊN XÁC NHẬN";
            } else {
                ghiChu = "TRÙNG ID/SỐ PHÒNG MẪU NHƯNG KHÔNG CÓ TIỀN TỐ DEMO: CẦN ĐỐI SOÁT KỸ";
            }

            return new UngVienDoiSoat(
                    rs.getLong("id"),
                    rs.getLong("toa_nha_id"),
                    rs.getString("so_phong"),
                    coHd,
                    coHdon,
                    coCs,
                    coTs,
                    coDemoPrefix,
                    ghiChu
            );
        });
    }
}
