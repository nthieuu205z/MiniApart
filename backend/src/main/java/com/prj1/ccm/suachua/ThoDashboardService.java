package com.prj1.ccm.suachua;

import com.prj1.ccm.auth.NguoiDungRepository;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.nguoithue.NhatKyThaoTacRepository;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import com.prj1.ccm.toanha.PhongRepository;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class ThoDashboardService {
    private static final QuyTacTrangThaiYeuCau QUY_TAC_TRANG_THAI = new QuyTacTrangThaiYeuCau();
    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final JdbcTemplate jdbcTemplate;
    private final YeuCauSuaChuaRepository yeuCauSuaChuaRepository;
    private final YeuCauSuaChuaService yeuCauSuaChuaService;
    private final BaoGiaSuaChuaRepository baoGiaSuaChuaRepository;
    private final ThanhToanThoRepository thanhToanThoRepository;
    private final PhanQuyenToaService phanQuyenToaService;
    private final NguoiDungRepository nguoiDungRepository;
    private final NhatKyThaoTacRepository nhatKyThaoTacRepository;
    private final Clock clock;

    public ThoDashboardService(
            JdbcTemplate jdbcTemplate,
            YeuCauSuaChuaRepository yeuCauSuaChuaRepository,
            YeuCauSuaChuaService yeuCauSuaChuaService,
            BaoGiaSuaChuaRepository baoGiaSuaChuaRepository,
            ThanhToanThoRepository thanhToanThoRepository,
            PhanQuyenToaService phanQuyenToaService,
            NguoiDungRepository nguoiDungRepository,
            NhatKyThaoTacRepository nhatKyThaoTacRepository,
            Clock clock
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.yeuCauSuaChuaRepository = yeuCauSuaChuaRepository;
        this.yeuCauSuaChuaService = yeuCauSuaChuaService;
        this.baoGiaSuaChuaRepository = baoGiaSuaChuaRepository;
        this.thanhToanThoRepository = thanhToanThoRepository;
        this.phanQuyenToaService = phanQuyenToaService;
        this.nguoiDungRepository = nguoiDungRepository;
        this.nhatKyThaoTacRepository = nhatKyThaoTacRepository;
        this.clock = clock;
    }

    public void kiemTraVaiTroTho(NguoiDung nguoiDung) {
        if (nguoiDung == null || nguoiDung.vaiTro() != VaiTro.THO) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Khu vực chỉ dành cho thợ sửa chữa");
        }
    }

    @Transactional(readOnly = true)
    public ThoDashboardDto.ThoTongQuanDto layTongQuan(
            NguoiDung tho,
            LocalDate tuNgay,
            LocalDate denNgay,
            Long toaNhaId
    ) {
        kiemTraVaiTroTho(tho);
        Instant hienTai = clock.instant();

        // 1. Fetch repairs assigned to this worker
        List<ThoDashboardDto.ThongTinViecThoRow> tatCaViec = layDanhSachCongViec(tho, toaNhaId, null, null, null, tuNgay, denNgay, null);

        // 2. Compute KPIs
        int dangXuLy = 0;
        int choXacNhan = 0;
        int daHoanThanh = 0;
        int tongDuocGiao = 0;

        BigDecimal giaTriDaChot = BigDecimal.ZERO;
        BigDecimal conPhaiTra = BigDecimal.ZERO;

        Map<String, Integer> demTheoTrangThai = new LinkedHashMap<>();
        demTheoTrangThai.put("DANG_XU_LY", 0);
        demTheoTrangThai.put("CHO_XAC_NHAN", 0);
        demTheoTrangThai.put("DA_DONG", 0);
        demTheoTrangThai.put("DA_HUY", 0);

        List<ThoDashboardDto.ThongTinViecThoRow> viecCanXuLy = new ArrayList<>();

        for (ThoDashboardDto.ThongTinViecThoRow row : tatCaViec) {
            TrangThaiYeuCau tt = row.trangThaiHieuLuc();

            if (tt != TrangThaiYeuCau.DA_HUY) {
                tongDuocGiao++;
            }

            if (tt == TrangThaiYeuCau.DA_PHAN_CONG || tt == TrangThaiYeuCau.DANG_XU_LY) {
                dangXuLy++;
                demTheoTrangThai.put("DANG_XU_LY", demTheoTrangThai.get("DANG_XU_LY") + 1);
                viecCanXuLy.add(row);
            } else if (tt == TrangThaiYeuCau.CHO_XAC_NHAN) {
                choXacNhan++;
                demTheoTrangThai.put("CHO_XAC_NHAN", demTheoTrangThai.get("CHO_XAC_NHAN") + 1);
            } else if (tt == TrangThaiYeuCau.DA_DONG) {
                daHoanThanh++;
                demTheoTrangThai.put("DA_DONG", demTheoTrangThai.get("DA_DONG") + 1);
            } else if (tt == TrangThaiYeuCau.DA_HUY) {
                demTheoTrangThai.put("DA_HUY", demTheoTrangThai.get("DA_HUY") + 1);
            }

            if (row.giaTriBaoGia() != null && row.trangThaiBaoGia() == TrangThaiBaoGia.DA_DUYET) {
                giaTriDaChot = giaTriDaChot.add(row.giaTriBaoGia());
                // Only count payable for eligible jobs (finished or awaiting confirmation)
                if (tt == TrangThaiYeuCau.DA_DONG || tt == TrangThaiYeuCau.CHO_XAC_NHAN) {
                    conPhaiTra = conPhaiTra.add(row.conPhaiTra() != null ? row.conPhaiTra() : BigDecimal.ZERO);
                }
            }
        }

        // Completion rate
        ThoDashboardDto.ThoTongQuanDto.TyLeHoanThanhDto tyLeHoanThanh;
        if (tongDuocGiao == 0) {
            tyLeHoanThanh = new ThoDashboardDto.ThoTongQuanDto.TyLeHoanThanhDto(null, 0, 0, "Chưa có dữ liệu", false);
        } else {
            double rate = Math.round((daHoanThanh * 1000.0) / tongDuocGiao) / 10.0;
            String moTa = String.format("%d/%d việc hoàn tất trong kỳ", daHoanThanh, tongDuocGiao);
            tyLeHoanThanh = new ThoDashboardDto.ThoTongQuanDto.TyLeHoanThanhDto(rate, daHoanThanh, tongDuocGiao, moTa, true);
        }

        // Actual received money
        Instant tuLuc = tuNgay != null ? tuNgay.atStartOfDay(VIETNAM_ZONE).toInstant() : null;
        Instant denLuc = denNgay != null ? denNgay.plusDays(1).atStartOfDay(VIETNAM_ZONE).toInstant() : null;
        BigDecimal daNhan = thanhToanThoRepository.tinhTongTienNhanCuaTho(tho.id(), tuLuc, denLuc, toaNhaId);

        ThoDashboardDto.ThoTongQuanDto.KpiThoDto kpi = new ThoDashboardDto.ThoTongQuanDto.KpiThoDto(
                dangXuLy,
                choXacNhan,
                tyLeHoanThanh,
                giaTriDaChot,
                daNhan,
                conPhaiTra
        );

        // 3. Status chart
        List<ThoDashboardDto.ThoTongQuanDto.ThongKeTrangThaiDto> bieuDoTrangThai = List.of(
                new ThoDashboardDto.ThoTongQuanDto.ThongKeTrangThaiDto("DANG_XU_LY", "Đang xử lý / Phân công", demTheoTrangThai.get("DANG_XU_LY"), "#2563EB"),
                new ThoDashboardDto.ThoTongQuanDto.ThongKeTrangThaiDto("CHO_XAC_NHAN", "Chờ xác nhận", demTheoTrangThai.get("CHO_XAC_NHAN"), "#F59E0B"),
                new ThoDashboardDto.ThoTongQuanDto.ThongKeTrangThaiDto("DA_DONG", "Đã hoàn thành", demTheoTrangThai.get("DA_DONG"), "#10B981"),
                new ThoDashboardDto.ThoTongQuanDto.ThongKeTrangThaiDto("DA_HUY", "Đã hủy", demTheoTrangThai.get("DA_HUY"), "#9CA3AF")
        );

        // 4. Trend chart
        List<ThoDashboardDto.ThoTongQuanDto.XuHuongThoDto> bieuDoXuHuong = tinhBieuDoXuHuong(tho.id(), toaNhaId, hienTai);

        // 5. Quotes needing action (TU_CHOI or CHO_DUYET)
        List<ThoDashboardDto.ThoTongQuanDto.BaoGiaCanXuLyDto> baoGiaCanBoSung = layBaoGiaCanBoSung(tho.id());

        // 6. Buildings assigned to this worker
        List<ThoDashboardDto.ThoTongQuanDto.ToaNhaOptionDto> danhSachToa = layDanhSachToaCuaTho(tho.id());

        // Sort urgent jobs to top
        viecCanXuLy.sort(Comparator.comparing((ThoDashboardDto.ThongTinViecThoRow r) -> r.mucDo() == MucDo.KHAN_CAP ? 0 : (r.mucDo() == MucDo.GAP ? 1 : 2))
                .thenComparing(ThoDashboardDto.ThongTinViecThoRow::taoLuc, Comparator.reverseOrder()));
        if (viecCanXuLy.size() > 8) {
            viecCanXuLy = viecCanXuLy.subList(0, 8);
        }

        return new ThoDashboardDto.ThoTongQuanDto(
                kpi,
                bieuDoTrangThai,
                bieuDoXuHuong,
                viecCanXuLy,
                baoGiaCanBoSung,
                danhSachToa
        );
    }

    @Transactional(readOnly = true)
    public List<ThoDashboardDto.ThongTinViecThoRow> layDanhSachCongViec(
            NguoiDung tho,
            Long toaNhaId,
            String trangThai,
            String nhom,
            String mucDo,
            LocalDate tuNgay,
            LocalDate denNgay,
            String tuKhoa
    ) {
        kiemTraVaiTroTho(tho);
        Instant hienTai = clock.instant();

        StringBuilder sql = new StringBuilder("""
                SELECT yc.id, yc.ma_yeu_cau, yc.hang_muc, yc.mo_ta,
                       p.toa_nha_id, tn.ten AS ten_toa_nha, tn.dia_chi AS dia_chi_toa_nha,
                       p.so_phong, p.tang,
                       yc.muc_do, yc.trang_thai, yc.cho_xac_nhan_luc,
                       yc.phan_cong_luc, yc.tao_luc, yc.dong_luc,
                       -- safe reporter/contact name
                       COALESCE(nt_hd.ho_ten, nd_tao.ho_ten, 'Chưa có thông tin') AS nguoi_lien_he,
                       COALESCE(nt_hd.so_dien_thoai, yc_sdt.so_dien_thoai, nd_tao.so_dien_thoai, 'Chưa có thông tin') AS sdt_lien_he,
                       -- latest approved quote
                       bg_duyet.tong_tien AS bg_tong_tien,
                       bg_duyet.trang_thai AS bg_trang_thai,
                       -- total paid
                       COALESCE(tt.tong_da_tra, 0) AS tong_da_tra
                FROM YEU_CAU_SUA_CHUA yc
                JOIN PHONG p ON p.id = yc.phong_id
                JOIN TOA_NHA tn ON tn.id = p.toa_nha_id
                LEFT JOIN NGUOI_DUNG nd_tao ON nd_tao.id = yc.nguoi_tao_id
                LEFT JOIN HOP_DONG hd ON hd.id = yc.hop_dong_id
                LEFT JOIN NGUOI_THUE nt_hd ON nt_hd.id = hd.nguoi_thue_id
                LEFT JOIN LATERAL (
                    SELECT nt_sub.so_dien_thoai
                    FROM HOP_DONG hd_sub
                    JOIN NGUOI_THUE nt_sub ON nt_sub.id = hd_sub.nguoi_thue_id
                    WHERE hd_sub.phong_id = yc.phong_id
                    ORDER BY hd_sub.ngay_bat_dau DESC LIMIT 1
                ) yc_sdt ON TRUE
                LEFT JOIN LATERAL (
                    SELECT bg.tong_tien, bg.trang_thai
                    FROM BAO_GIA_SUA_CHUA bg
                    WHERE bg.yeu_cau_id = yc.id AND bg.trang_thai = 'DA_DUYET'
                    LIMIT 1
                ) bg_duyet ON TRUE
                LEFT JOIN LATERAL (
                    SELECT SUM(tt_sub.so_tien) AS tong_da_tra
                    FROM THANH_TOAN_THO tt_sub
                    WHERE tt_sub.yeu_cau_id = yc.id
                ) tt ON TRUE
                WHERE yc.nguoi_xu_ly_id = ?
                """);

        List<Object> params = new ArrayList<>();
        params.add(tho.id());

        if (toaNhaId != null) {
            sql.append(" AND p.toa_nha_id = ?");
            params.add(toaNhaId);
        }

        if (mucDo != null && !mucDo.isBlank()) {
            sql.append(" AND yc.muc_do = ?");
            params.add(mucDo);
        }

        if (tuNgay != null) {
            sql.append(" AND yc.tao_luc >= ?");
            params.add(Timestamp.from(tuNgay.atStartOfDay(VIETNAM_ZONE).toInstant()));
        }
        if (denNgay != null) {
            sql.append(" AND yc.tao_luc <= ?");
            params.add(Timestamp.from(denNgay.plusDays(1).atStartOfDay(VIETNAM_ZONE).toInstant()));
        }

        if (tuKhoa != null && !tuKhoa.isBlank()) {
            String kw = "%" + tuKhoa.trim().toLowerCase() + "%";
            sql.append(" AND (LOWER(yc.ma_yeu_cau) LIKE ? OR LOWER(yc.hang_muc) LIKE ? OR LOWER(yc.mo_ta) LIKE ? OR LOWER(p.so_phong) LIKE ?)");
            params.add(kw);
            params.add(kw);
            params.add(kw);
            params.add(kw);
        }

        sql.append(" ORDER BY yc.tao_luc DESC, yc.id DESC");

        List<ThoDashboardDto.ThongTinViecThoRow> rows = jdbcTemplate.query(
                sql.toString(),
                (rs, rowNum) -> mapViecThoRow(rs, hienTai),
                params.toArray()
        );

        // In-memory filter for status / nhom to respect 72h auto-close rule
        if (nhom != null && !nhom.isBlank()) {
            rows = rows.stream().filter(r -> switch (nhom) {
                case "DANG_LAM" -> r.trangThaiHieuLuc() == TrangThaiYeuCau.DA_PHAN_CONG || r.trangThaiHieuLuc() == TrangThaiYeuCau.DANG_XU_LY;
                case "CHO_XAC_NHAN" -> r.trangThaiHieuLuc() == TrangThaiYeuCau.CHO_XAC_NHAN;
                case "LICH_SU" -> r.trangThaiHieuLuc() == TrangThaiYeuCau.DA_DONG || r.trangThaiHieuLuc() == TrangThaiYeuCau.DA_HUY;
                default -> true;
            }).toList();
        } else if (trangThai != null && !trangThai.isBlank()) {
            rows = rows.stream().filter(r -> r.trangThaiHieuLuc().name().equalsIgnoreCase(trangThai)).toList();
        }

        return rows;
    }

    @Transactional(readOnly = true)
    public ThoDashboardDto.ChiTietViecThoDto layChiTietCongViec(NguoiDung tho, Long yeuCauId) {
        kiemTraVaiTroTho(tho);
        Instant hienTai = clock.instant();

        var viewOpt = yeuCauSuaChuaRepository.findById(yeuCauId);
        if (viewOpt.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu sửa chữa");
        }
        var view = viewOpt.get();
        if (!Objects.equals(view.yeuCau().nguoiXuLyId(), tho.id())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không được phân công yêu cầu này");
        }

        var yc = view.yeuCau();
        TrangThaiYeuCau ttHieuLuc = QUY_TAC_TRANG_THAI.trangThaiHieuLuc(yc.trangThai(), yc.choXacNhanLuc(), hienTai);

        // Building info
        String diaChiToaNha = jdbcTemplate.queryForObject("SELECT dia_chi FROM TOA_NHA WHERE id = ?", String.class, view.toaNhaId());

        // Reporter info
        NguoiDung nguoiBao = nguoiDungRepository.findById(yc.nguoiTaoId()).orElse(null);

        // Contact info from contract at ticket creation
        String tenLienHe = "Chưa có thông tin";
        String sdtLienHe = view.soDienThoaiLienHe() != null ? view.soDienThoaiLienHe() : "Chưa có thông tin";
        boolean laDungTenHopDong = false;

        if (yc.hopDongId() != null) {
            var tenantOpt = jdbcTemplate.query(
                    """
                    SELECT nt.ho_ten, nt.so_dien_thoai
                    FROM HOP_DONG hd
                    JOIN NGUOI_THUE nt ON nt.id = hd.nguoi_thue_id
                    WHERE hd.id = ?
                    """,
                    (rs, n) -> new String[]{rs.getString("ho_ten"), rs.getString("so_dien_thoai")},
                    yc.hopDongId()
            ).stream().findFirst();
            if (tenantOpt.isPresent()) {
                tenLienHe = tenantOpt.get()[0];
                sdtLienHe = tenantOpt.get()[1];
                laDungTenHopDong = true;
            }
        }
        if ("Chưa có thông tin".equals(tenLienHe) && nguoiBao != null) {
            tenLienHe = nguoiBao.hoTen();
            sdtLienHe = nguoiBao.soDienThoai();
        }

        // Manager info
        NguoiDung quanLy = yc.nguoiTiepNhanId() != null ? nguoiDungRepository.findById(yc.nguoiTiepNhanId()).orElse(null) : null;

        // Extra details from DB
        String ghiChuKhaoSat = jdbcTemplate.queryForObject("SELECT ghi_chu_khao_sat FROM YEU_CAU_SUA_CHUA WHERE id = ?", String.class, yeuCauId);
        String ketQuaSuaChua = jdbcTemplate.queryForObject("SELECT ket_qua_sua_chua FROM YEU_CAU_SUA_CHUA WHERE id = ?", String.class, yeuCauId);
        Timestamp dongLucTs = jdbcTemplate.queryForObject("SELECT dong_luc FROM YEU_CAU_SUA_CHUA WHERE id = ?", Timestamp.class, yeuCauId);
        Instant dongLuc = dongLucTs != null ? dongLucTs.toInstant() : null;

        // Photos
        List<Long> anhTruocIds = yeuCauSuaChuaRepository.findAnhIds(yeuCauId);
        List<Long> anhSauIds = jdbcTemplate.queryForList(
                "SELECT id FROM ANH_DINH_KEM WHERE doi_tuong_loai = 'YEU_CAU_SUA_CHUA' AND doi_tuong_id = ? AND ghi_chu = 'ANH_SAU' ORDER BY id",
                Long.class, yeuCauId
        );

        // Status history
        List<ThoDashboardDto.ChiTietViecThoDto.LichSuThaoTacThoDto> lichSu = layLichSuThaoTac(yeuCauId, yc, ttHieuLuc);

        // Quotes and payments
        List<BaoGiaSuaChua> quotes = baoGiaSuaChuaRepository.findByYeuCauId(yeuCauId);
        BaoGiaSuaChua approvedQuote = baoGiaSuaChuaRepository.findBaoGiaHieuLuc(yeuCauId).orElse(null);
        List<ThanhToanTho> payments = thanhToanThoRepository.findByYeuCauId(yeuCauId);

        BigDecimal tongBaoGia = approvedQuote != null ? approvedQuote.tongTien() : BigDecimal.ZERO;
        BigDecimal tongDaNhan = thanhToanThoRepository.tinhTongDaThanhToan(yeuCauId);
        BigDecimal tongConLai = tongBaoGia.compareTo(tongDaNhan) > 0 ? tongBaoGia.subtract(tongDaNhan) : BigDecimal.ZERO;

        String trangThaiThanhToan;
        if (approvedQuote == null) {
            trangThaiThanhToan = "CHUA_CO_BAO_GIA";
        } else if (approvedQuote.tongTien().compareTo(BigDecimal.ZERO) == 0) {
            trangThaiThanhToan = "KHONG_PHAT_SINH_TIEN";
        } else if (tongDaNhan.compareTo(BigDecimal.ZERO) == 0) {
            trangThaiThanhToan = "CHUA_THANH_TOAN";
        } else if (tongDaNhan.compareTo(tongBaoGia) < 0) {
            trangThaiThanhToan = "THANH_TOAN_MOT_PHAN";
        } else {
            trangThaiThanhToan = "DA_THANH_TOAN_DU";
        }

        return new ThoDashboardDto.ChiTietViecThoDto(
                yc.id(),
                yc.maYeuCau(),
                yc.hangMuc(),
                yc.moTa(),
                yc.mucDo(),
                yc.mucDo().tenHienThi(),
                yc.trangThai(),
                yc.trangThai().tenHienThi(),
                ttHieuLuc,
                ttHieuLuc.tenHienThi(),
                view.toaNhaId(),
                view.toaNha(),
                diaChiToaNha != null ? diaChiToaNha : "Chưa có thông tin",
                view.soPhong(),
                view.tang(),
                nguoiBao != null ? nguoiBao.id() : null,
                nguoiBao != null ? nguoiBao.hoTen() : "Chưa có thông tin",
                nguoiBao != null ? nguoiBao.soDienThoai() : "Chưa có thông tin",
                tenLienHe,
                sdtLienHe,
                laDungTenHopDong,
                quanLy != null ? quanLy.id() : null,
                quanLy != null ? quanLy.hoTen() : "Chưa có thông tin",
                quanLy != null ? quanLy.soDienThoai() : "Chưa có thông tin",
                yc.taoLuc(),
                yc.tiepNhanLuc(),
                yc.phanCongLuc(),
                yc.choXacNhanLuc(),
                dongLuc,
                yc.lyDoHuy(),
                ghiChuKhaoSat != null ? ghiChuKhaoSat : "Chưa có ghi chú",
                ketQuaSuaChua != null ? ketQuaSuaChua : "Chưa có kết quả",
                anhTruocIds,
                anhSauIds,
                lichSu,
                approvedQuote,
                quotes,
                payments,
                tongBaoGia,
                tongDaNhan,
                tongConLai,
                trangThaiThanhToan
        );
    }

    @Transactional
    public void capNhatKhaoSat(NguoiDung tho, Long yeuCauId, String ghiChu) {
        kiemTraVaiTroTho(tho);
        var view = kiemTraVaLayViec(tho, yeuCauId);
        if (view.yeuCau().trangThai() == TrangThaiYeuCau.DA_PHAN_CONG) {
            yeuCauSuaChuaService.batDauXuLy(yeuCauId, tho);
        }
        jdbcTemplate.update("UPDATE YEU_CAU_SUA_CHUA SET ghi_chu_khao_sat = ? WHERE id = ?", ghiChu, yeuCauId);
        nhatKyThaoTacRepository.ghi(tho.id(), "KHAO_SAT_YEU_CAU_SUA_CHUA", "YEU_CAU_SUA_CHUA:" + yeuCauId, null, ghiChu, null, null, null, null);
    }

    @Transactional
    public BaoGiaSuaChua taoBaoGia(NguoiDung tho, Long yeuCauId, ThoDashboardDto.YeuCauTaoBaoGia req) {
        kiemTraVaiTroTho(tho);
        kiemTraVaLayViec(tho, yeuCauId);

        if (req.dongBaoGia() == null || req.dongBaoGia().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Báo giá phải có ít nhất một dòng vật tư hoặc công sửa");
        }

        BigDecimal tong = BigDecimal.ZERO;
        List<DongBaoGia> dongList = new ArrayList<>();
        int stt = 1;
        for (var d : req.dongBaoGia()) {
            if (d.tenHangMuc() == null || d.tenHangMuc().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên hạng mục báo giá không được để trống");
            }
            if (d.soLuong() == null || d.soLuong().compareTo(BigDecimal.ZERO) <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số lượng phải lớn hơn 0");
            }
            if (d.donGia() == null || d.donGia().compareTo(BigDecimal.ZERO) < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đơn giá không được âm");
            }
            BigDecimal thanhTien = d.soLuong().multiply(d.donGia()).setScale(2, RoundingMode.HALF_UP);
            tong = tong.add(thanhTien);
            dongList.add(new DongBaoGia(null, null, stt++, d.tenHangMuc().trim(), d.soLuong(), d.donVi() != null ? d.donVi().trim() : "gói", d.donGia(), thanhTien));
        }

        int phienBan = baoGiaSuaChuaRepository.layPhienBanTiepTheo(yeuCauId);
        String maBaoGia = baoGiaSuaChuaRepository.sinhMaBaoGia(yeuCauId, phienBan);
        TrangThaiBaoGia trangThai = req.guiDuyetNgay() ? TrangThaiBaoGia.CHO_DUYET : TrangThaiBaoGia.NHAP;

        BaoGiaSuaChua bg = new BaoGiaSuaChua(
                null,
                maBaoGia,
                yeuCauId,
                phienBan,
                trangThai,
                tong,
                req.moTa(),
                req.ghiChu(),
                null,
                tho.id(),
                clock.instant(),
                null,
                null,
                null,
                dongList
        );

        Long id = baoGiaSuaChuaRepository.insertBaoGia(bg);
        nhatKyThaoTacRepository.ghi(tho.id(), "TAO_BAO_GIA_SUA_CHUA", "BAO_GIA_SUA_CHUA:" + id, null, trangThai.name(), null, null, "Phiên bản " + phienBan, null);
        return baoGiaSuaChuaRepository.findById(id).orElseThrow();
    }

    @Transactional
    public BaoGiaSuaChua guiDuyetBaoGia(NguoiDung tho, Long yeuCauId, Long baoGiaId) {
        kiemTraVaiTroTho(tho);
        kiemTraVaLayViec(tho, yeuCauId);

        BaoGiaSuaChua bg = baoGiaSuaChuaRepository.findById(baoGiaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy báo giá"));

        if (!Objects.equals(bg.yeuCauId(), yeuCauId) || !Objects.equals(bg.nguoiTaoId(), tho.id())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không có quyền gửi duyệt báo giá này");
        }

        if (bg.trangThai() != TrangThaiBaoGia.NHAP) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ có thể gửi duyệt báo giá đang ở trạng thái bản nháp");
        }

        baoGiaSuaChuaRepository.capNhatTrangThai(baoGiaId, TrangThaiBaoGia.CHO_DUYET);
        nhatKyThaoTacRepository.ghi(tho.id(), "GUI_DUYET_BAO_GIA", "BAO_GIA_SUA_CHUA:" + baoGiaId, TrangThaiBaoGia.NHAP.name(), TrangThaiBaoGia.CHO_DUYET.name(), null, null, null, null);
        return baoGiaSuaChuaRepository.findById(baoGiaId).orElseThrow();
    }

    @Transactional
    public void baoXong(NguoiDung tho, Long yeuCauId, String ketQua) {
        kiemTraVaiTroTho(tho);
        kiemTraVaLayViec(tho, yeuCauId);
        yeuCauSuaChuaService.baoDaSuaXong(yeuCauId, tho);
        jdbcTemplate.update(
                "UPDATE YEU_CAU_SUA_CHUA SET ket_qua_sua_chua = ?, da_sua_xong_luc = ? WHERE id = ?",
                ketQua, Timestamp.from(clock.instant()), yeuCauId
        );
        nhatKyThaoTacRepository.ghi(tho.id(), "BAO_XONG_SUA_CHUA", "YEU_CAU_SUA_CHUA:" + yeuCauId, null, ketQua, null, null, null, null);
    }

    // --- QUAN LY / CHU ACTIONS ---

    @Transactional
    public void duyetBaoGia(NguoiDung nguoiQuanLy, Long yeuCauId, Long baoGiaId) {
        var view = yeuCauSuaChuaRepository.findById(yeuCauId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu"));
        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiQuanLy, view.toaNhaId());

        BaoGiaSuaChua bg = baoGiaSuaChuaRepository.findById(baoGiaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy báo giá"));
        if (!Objects.equals(bg.yeuCauId(), yeuCauId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Báo giá không thuộc yêu cầu sửa chữa này");
        }
        if (bg.trangThai() != TrangThaiBaoGia.CHO_DUYET) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Báo giá phải ở trạng thái Chờ duyệt mới được phê duyệt");
        }

        baoGiaSuaChuaRepository.duyetBaoGia(baoGiaId, yeuCauId, nguoiQuanLy.id(), clock.instant());
        // Also sync chi_phi on YEU_CAU_SUA_CHUA
        jdbcTemplate.update("UPDATE YEU_CAU_SUA_CHUA SET chi_phi = ? WHERE id = ?", bg.tongTien(), yeuCauId);
        nhatKyThaoTacRepository.ghi(nguoiQuanLy.id(), "DUYET_BAO_GIA_SUA_CHUA", "BAO_GIA_SUA_CHUA:" + baoGiaId, TrangThaiBaoGia.CHO_DUYET.name(), TrangThaiBaoGia.DA_DUYET.name(), null, null, "Duyệt số tiền: " + bg.tongTien(), null);
    }

    @Transactional
    public void tuChoiBaoGia(NguoiDung nguoiQuanLy, Long yeuCauId, Long baoGiaId, String lyDo) {
        if (lyDo == null || lyDo.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lý do từ chối là bắt buộc");
        }
        var view = yeuCauSuaChuaRepository.findById(yeuCauId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu"));
        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiQuanLy, view.toaNhaId());

        BaoGiaSuaChua bg = baoGiaSuaChuaRepository.findById(baoGiaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy báo giá"));
        if (!Objects.equals(bg.yeuCauId(), yeuCauId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Báo giá không thuộc yêu cầu sửa chữa này");
        }
        if (bg.trangThai() != TrangThaiBaoGia.CHO_DUYET) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ có thể từ chối báo giá đang chờ duyệt");
        }

        baoGiaSuaChuaRepository.tuChoiBaoGia(baoGiaId, lyDo.trim(), nguoiQuanLy.id(), clock.instant());
        nhatKyThaoTacRepository.ghi(nguoiQuanLy.id(), "TU_CHOI_BAO_GIA_SUA_CHUA", "BAO_GIA_SUA_CHUA:" + baoGiaId, TrangThaiBaoGia.CHO_DUYET.name(), TrangThaiBaoGia.TU_CHOI.name(), null, null, lyDo.trim(), null);
    }

    @Transactional
    public ThanhToanTho ghiNhanThanhToan(NguoiDung nguoiQuanLy, Long yeuCauId, ThoDashboardDto.ThoActionRequests.GhiNhanThanhToanReq req) {
        var view = yeuCauSuaChuaRepository.findById(yeuCauId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu"));
        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiQuanLy, view.toaNhaId());

        if (req.soTien() == null || (req.phuongThuc() != PhuongThucThanhToanTho.KHONG_THU_PHI && req.soTien().compareTo(BigDecimal.ZERO) <= 0)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số tiền thanh toán phải lớn hơn 0");
        }

        BaoGiaSuaChua approvedQuote = baoGiaSuaChuaRepository.findBaoGiaHieuLuc(yeuCauId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Yêu cầu chưa có báo giá được duyệt"));

        BigDecimal daTra = thanhToanThoRepository.tinhTongDaThanhToan(yeuCauId);
        BigDecimal conPhaiTra = approvedQuote.tongTien().subtract(daTra);

        BigDecimal soTienGhiNhan = req.phuongThuc() == PhuongThucThanhToanTho.KHONG_THU_PHI ? BigDecimal.ZERO : req.soTien();

        if (soTienGhiNhan.compareTo(conPhaiTra) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    String.format("Số tiền thanh toán (%s) vượt quá số tiền còn lại (%s)", soTienGhiNhan, conPhaiTra));
        }

        String maThanhToan = thanhToanThoRepository.sinhMaThanhToan();
        ThanhToanTho tt = new ThanhToanTho(
                null,
                maThanhToan,
                yeuCauId,
                approvedQuote.id(),
                soTienGhiNhan,
                req.phuongThuc(),
                req.maThamChieu(),
                nguoiQuanLy.id(),
                clock.instant(),
                req.ghiChu(),
                null
        );

        Long id = thanhToanThoRepository.insert(tt);
        nhatKyThaoTacRepository.ghi(
                nguoiQuanLy.id(),
                "GHI_NHAN_THANH_TOAN_THO",
                "THANH_TOAN_THO:" + id,
                null,
                soTienGhiNhan.toString(),
                null,
                null,
                "Phương thức: " + req.phuongThuc() + (req.maThamChieu() != null ? " Ref: " + req.maThamChieu() : ""),
                null
        );

        return new ThanhToanTho(
                id, maThanhToan, yeuCauId, approvedQuote.id(), soTienGhiNhan, req.phuongThuc(),
                req.maThamChieu(), nguoiQuanLy.id(), tt.xacNhanLuc(), req.ghiChu(), null
        );
    }

    @Transactional(readOnly = true)
    public ThoDashboardDto.ThoActionRequests.ChungTuThanhToanThoDto layChungTu(NguoiDung nguoiDung, Long yeuCauId) {
        var view = yeuCauSuaChuaRepository.findById(yeuCauId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu"));

        if (nguoiDung.vaiTro() == VaiTro.THO) {
            if (!Objects.equals(view.yeuCau().nguoiXuLyId(), nguoiDung.id())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không được phép xem chứng từ của thợ khác");
            }
        } else {
            phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, view.toaNhaId());
        }

        var yc = view.yeuCau();
        String diaChiToaNha = jdbcTemplate.queryForObject("SELECT dia_chi FROM TOA_NHA WHERE id = ?", String.class, view.toaNhaId());

        NguoiDung tho = yc.nguoiXuLyId() != null ? nguoiDungRepository.findById(yc.nguoiXuLyId()).orElse(null) : null;
        NguoiDung quanLy = yc.nguoiTiepNhanId() != null ? nguoiDungRepository.findById(yc.nguoiTiepNhanId()).orElse(null) : null;
        NguoiDung nguoiBao = nguoiDungRepository.findById(yc.nguoiTaoId()).orElse(null);

        BaoGiaSuaChua bg = baoGiaSuaChuaRepository.findBaoGiaHieuLuc(yeuCauId).orElse(null);
        List<ThanhToanTho> payments = thanhToanThoRepository.findByYeuCauId(yeuCauId);

        BigDecimal tongBaoGia = bg != null ? bg.tongTien() : BigDecimal.ZERO;
        BigDecimal daTra = thanhToanThoRepository.tinhTongDaThanhToan(yeuCauId);
        BigDecimal conLai = tongBaoGia.compareTo(daTra) > 0 ? tongBaoGia.subtract(daTra) : BigDecimal.ZERO;

        return new ThoDashboardDto.ThoActionRequests.ChungTuThanhToanThoDto(
                "CT-SC-" + yeuCauId,
                LocalDate.now(VIETNAM_ZONE),
                yeuCauId,
                yc.maYeuCau(),
                yc.hangMuc(),
                view.toaNha(),
                diaChiToaNha != null ? diaChiToaNha : "",
                view.soPhong(),
                view.tang(),
                tho != null ? tho.hoTen() : "Chưa phân công",
                tho != null ? tho.soDienThoai() : "",
                quanLy != null ? quanLy.hoTen() : "Chưa tiếp nhận",
                quanLy != null ? quanLy.soDienThoai() : "",
                nguoiBao != null ? nguoiBao.hoTen() : "Chưa có thông tin",
                nguoiBao != null ? nguoiBao.soDienThoai() : "",
                yc.trangThai().tenHienThi(),
                bg != null ? bg.phienBan() : 0,
                bg != null ? bg.dongBaoGia() : List.of(),
                tongBaoGia,
                payments,
                daTra,
                conLai,
                bg != null ? bg.ghiChu() : ""
        );
    }

    // --- HELPER METHODS ---

    private YeuCauSuaChuaRepository.YeuCauSuaChuaView kiemTraVaLayViec(NguoiDung tho, Long yeuCauId) {
        var viewOpt = yeuCauSuaChuaRepository.findById(yeuCauId);
        if (viewOpt.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu sửa chữa");
        }
        var view = viewOpt.get();
        if (!Objects.equals(view.yeuCau().nguoiXuLyId(), tho.id())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền thao tác trên yêu cầu này");
        }
        return view;
    }

    private ThoDashboardDto.ThongTinViecThoRow mapViecThoRow(ResultSet rs, Instant hienTai) throws SQLException {
        Timestamp phanCong = rs.getTimestamp("phan_cong_luc");
        Timestamp taoLuc = rs.getTimestamp("tao_luc");
        Timestamp choXacNhan = rs.getTimestamp("cho_xac_nhan_luc");
        Timestamp dongLuc = rs.getTimestamp("dong_luc");

        TrangThaiYeuCau ttLuu = TrangThaiYeuCau.valueOf(rs.getString("trang_thai"));
        Instant choXacNhanInstant = choXacNhan != null ? choXacNhan.toInstant() : null;
        TrangThaiYeuCau ttHieuLuc = QUY_TAC_TRANG_THAI.trangThaiHieuLuc(ttLuu, choXacNhanInstant, hienTai);

        BigDecimal bgTongTien = rs.getBigDecimal("bg_tong_tien");
        String bgTrangThaiStr = rs.getString("bg_trang_thai");
        TrangThaiBaoGia bgTrangThai = bgTrangThaiStr != null ? TrangThaiBaoGia.valueOf(bgTrangThaiStr) : null;

        BigDecimal daTra = rs.getBigDecimal("tong_da_tra");
        if (daTra == null) daTra = BigDecimal.ZERO;

        BigDecimal conPhaiTra = BigDecimal.ZERO;
        if (bgTongTien != null && bgTrangThai == TrangThaiBaoGia.DA_DUYET) {
            conPhaiTra = bgTongTien.compareTo(daTra) > 0 ? bgTongTien.subtract(daTra) : BigDecimal.ZERO;
        }

        return new ThoDashboardDto.ThongTinViecThoRow(
                rs.getLong("id"),
                rs.getString("ma_yeu_cau"),
                rs.getString("hang_muc"),
                rs.getString("mo_ta"),
                rs.getLong("toa_nha_id"),
                rs.getString("ten_toa_nha"),
                rs.getString("dia_chi_toa_nha"),
                rs.getString("so_phong"),
                rs.getInt("tang"),
                rs.getString("nguoi_lien_he"),
                rs.getString("sdt_lien_he"),
                MucDo.valueOf(rs.getString("muc_do")),
                MucDo.valueOf(rs.getString("muc_do")).tenHienThi(),
                ttLuu,
                ttLuu.tenHienThi(),
                ttHieuLuc,
                ttHieuLuc.tenHienThi(),
                phanCong != null ? phanCong.toInstant() : null,
                taoLuc != null ? taoLuc.toInstant() : Instant.EPOCH,
                choXacNhanInstant,
                dongLuc != null ? dongLuc.toInstant() : null,
                bgTongTien,
                bgTrangThai,
                bgTrangThai != null ? bgTrangThai.getTenHienThi() : "Chưa có báo giá",
                daTra,
                conPhaiTra
        );
    }

    private List<ThoDashboardDto.ChiTietViecThoDto.LichSuThaoTacThoDto> layLichSuThaoTac(Long yeuCauId, YeuCauSuaChua yc, TrangThaiYeuCau ttHieuLuc) {
        List<ThoDashboardDto.ChiTietViecThoDto.LichSuThaoTacThoDto> list = jdbcTemplate.query(
                """
                SELECT nk.thoi_diem, nk.hanh_dong, nk.gia_tri_truoc, nk.gia_tri_sau,
                       COALESCE(nd.ho_ten, 'Hệ thống') AS ten_nguoi_thuc_hien
                FROM NHAT_KY_THAO_TAC nk
                LEFT JOIN NGUOI_DUNG nd ON nd.id = nk.nguoi_dung_id
                WHERE nk.doi_tuong = ? OR nk.doi_tuong LIKE ?
                ORDER BY nk.thoi_diem ASC, nk.id ASC
                """,
                (rs, n) -> new ThoDashboardDto.ChiTietViecThoDto.LichSuThaoTacThoDto(
                        rs.getTimestamp("thoi_diem").toInstant(),
                        rs.getString("hanh_dong"),
                        dichTenHanhDong(rs.getString("hanh_dong")),
                        rs.getString("ten_nguoi_thuc_hien"),
                        rs.getString("gia_tri_sau"),
                        false
                ),
                "YEU_CAU_SUA_CHUA:" + yeuCauId,
                "%BAO_GIA_SUA_CHUA:%"
        );

        // If system derived auto-close after 72h
        if (yc.trangThai() == TrangThaiYeuCau.CHO_XAC_NHAN && ttHieuLuc == TrangThaiYeuCau.DA_DONG && yc.choXacNhanLuc() != null) {
            Instant autoCloseTime = yc.choXacNhanLuc().plus(Duration.ofHours(72));
            list.add(new ThoDashboardDto.ChiTietViecThoDto.LichSuThaoTacThoDto(
                    autoCloseTime,
                    "HE_THONG_TU_DONG_DONG",
                    "Hệ thống tự động đóng",
                    "Quy tắc hệ thống (sau 72 giờ)",
                    "Tự động đóng do người thuê không phản hồi trong vòng 72 giờ",
                    true
            ));
        }

        return list;
    }

    private String dichTenHanhDong(String action) {
        if (action == null) return "Thao tác";
        return switch (action) {
            case "TAO_YEU_CAU_SUA_CHUA" -> "Tạo yêu cầu";
            case "TIEP_NHAN_YEU_CAU_SUA_CHUA" -> "Tiếp nhận";
            case "PHAN_CONG_YEU_CAU_SUA_CHUA" -> "Phân công";
            case "BAT_DAU_XU_LY_YEU_CAU_SUA_CHUA" -> "Bắt đầu xử lý";
            case "KHAO_SAT_YEU_CAU_SUA_CHUA" -> "Cập nhật khảo sát";
            case "TAO_BAO_GIA_SUA_CHUA" -> "Tạo báo giá";
            case "GUI_DUYET_BAO_GIA" -> "Gửi duyệt báo giá";
            case "DUYET_BAO_GIA_SUA_CHUA" -> "Duyệt báo giá";
            case "TU_CHOI_BAO_GIA_SUA_CHUA" -> "Từ chối báo giá";
            case "HOAN_THANH_YEU_CAU_SUA_CHUA" -> "Báo hoàn thành";
            case "BAO_XONG_SUA_CHUA" -> "Báo xong sửa chữa";
            case "XAC_NHAN_DONG_YEU_CAU_SUA_CHUA" -> "Xác nhận đóng";
            case "HUY_YEU_CAU_SUA_CHUA" -> "Hủy yêu cầu";
            case "GHI_NHAN_THANH_TOAN_THO" -> "Ghi nhận thanh toán";
            default -> action;
        };
    }

    private List<ThoDashboardDto.ThoTongQuanDto.XuHuongThoDto> tinhBieuDoXuHuong(Long thoId, Long toaNhaId, Instant hienTai) {
        LocalDate end = LocalDate.ofInstant(hienTai, VIETNAM_ZONE);
        List<ThoDashboardDto.ThoTongQuanDto.XuHuongThoDto> list = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM");

        for (int i = 7; i >= 0; i--) {
            LocalDate wStart = end.minusWeeks(i).minusDays(6);
            LocalDate wEnd = end.minusWeeks(i);
            Instant startInst = wStart.atStartOfDay(VIETNAM_ZONE).toInstant();
            Instant endInst = wEnd.plusDays(1).atStartOfDay(VIETNAM_ZONE).toInstant();

            String nhan = wStart.format(fmt) + " - " + wEnd.format(fmt);

            // Approved quotes in week
            StringBuilder bgSql = new StringBuilder("""
                    SELECT COALESCE(SUM(bg.tong_tien), 0)
                    FROM BAO_GIA_SUA_CHUA bg
                    JOIN YEU_CAU_SUA_CHUA yc ON yc.id = bg.yeu_cau_id
                    JOIN PHONG p ON p.id = yc.phong_id
                    WHERE yc.nguoi_xu_ly_id = ? AND bg.trang_thai = 'DA_DUYET'
                      AND bg.duyet_luc >= ? AND bg.duyet_luc <= ?
                    """);
            List<Object> bgParams = new ArrayList<>(List.of(thoId, Timestamp.from(startInst), Timestamp.from(endInst)));
            if (toaNhaId != null) {
                bgSql.append(" AND p.toa_nha_id = ?");
                bgParams.add(toaNhaId);
            }
            BigDecimal giaTriChot = jdbcTemplate.queryForObject(bgSql.toString(), BigDecimal.class, bgParams.toArray());

            // Received payment in week
            BigDecimal daNhan = thanhToanThoRepository.tinhTongTienNhanCuaTho(thoId, startInst, endInst, toaNhaId);

            // Completed jobs in week
            StringBuilder xgSql = new StringBuilder("""
                    SELECT COUNT(*)
                    FROM YEU_CAU_SUA_CHUA yc
                    JOIN PHONG p ON p.id = yc.phong_id
                    WHERE yc.nguoi_xu_ly_id = ? AND yc.trang_thai = 'DA_DONG'
                      AND yc.tao_luc >= ? AND yc.tao_luc <= ?
                    """);
            List<Object> xgParams = new ArrayList<>(List.of(thoId, Timestamp.from(startInst), Timestamp.from(endInst)));
            if (toaNhaId != null) {
                xgSql.append(" AND p.toa_nha_id = ?");
                xgParams.add(toaNhaId);
            }
            Integer soXong = jdbcTemplate.queryForObject(xgSql.toString(), Integer.class, xgParams.toArray());

            list.add(new ThoDashboardDto.ThoTongQuanDto.XuHuongThoDto(
                    nhan,
                    giaTriChot != null ? giaTriChot : BigDecimal.ZERO,
                    daNhan != null ? daNhan : BigDecimal.ZERO,
                    soXong != null ? soXong : 0
            ));
        }

        return list;
    }

    private List<ThoDashboardDto.ThoTongQuanDto.BaoGiaCanXuLyDto> layBaoGiaCanBoSung(Long thoId) {
        return jdbcTemplate.query(
                """
                SELECT bg.id, bg.yeu_cau_id, yc.ma_yeu_cau, yc.hang_muc, p.so_phong, tn.ten AS toa_nha,
                       bg.phien_ban, bg.trang_thai, bg.tong_tien, bg.ly_do_tu_choi, bg.tao_luc
                FROM BAO_GIA_SUA_CHUA bg
                JOIN YEU_CAU_SUA_CHUA yc ON yc.id = bg.yeu_cau_id
                JOIN PHONG p ON p.id = yc.phong_id
                JOIN TOA_NHA tn ON tn.id = p.toa_nha_id
                WHERE yc.nguoi_xu_ly_id = ? AND bg.trang_thai IN ('TU_CHOI', 'CHO_DUYET')
                ORDER BY bg.tao_luc DESC LIMIT 5
                """,
                (rs, n) -> new ThoDashboardDto.ThoTongQuanDto.BaoGiaCanXuLyDto(
                        rs.getLong("id"),
                        rs.getLong("yeu_cau_id"),
                        rs.getString("ma_yeu_cau"),
                        rs.getString("hang_muc"),
                        rs.getString("so_phong"),
                        rs.getString("toa_nha"),
                        rs.getInt("phien_ban"),
                        TrangThaiBaoGia.valueOf(rs.getString("trang_thai")),
                        TrangThaiBaoGia.valueOf(rs.getString("trang_thai")).getTenHienThi(),
                        rs.getBigDecimal("tong_tien"),
                        rs.getString("ly_do_tu_choi"),
                        rs.getTimestamp("tao_luc").toInstant()
                ),
                thoId
        );
    }

    private List<ThoDashboardDto.ThoTongQuanDto.ToaNhaOptionDto> layDanhSachToaCuaTho(Long thoId) {
        return jdbcTemplate.query(
                """
                SELECT DISTINCT tn.id, tn.ten
                FROM TOA_NHA tn
                JOIN PHONG p ON p.toa_nha_id = tn.id
                JOIN YEU_CAU_SUA_CHUA yc ON yc.phong_id = p.id
                WHERE yc.nguoi_xu_ly_id = ?
                ORDER BY tn.ten ASC
                """,
                (rs, n) -> new ThoDashboardDto.ThoTongQuanDto.ToaNhaOptionDto(rs.getLong("id"), rs.getString("ten")),
                thoId
        );
    }
}
