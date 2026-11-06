package com.prj1.ccm.suachua;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public class ThoDashboardDto {

    public record ThongTinViecThoRow(
            Long id,
            String maYeuCau,
            String hangMuc,
            String moTa,
            Long toaNhaId,
            String toaNha,
            String diaChiToaNha,
            String soPhong,
            int tang,
            String nguoiLienHeHoTen,
            String soDienThoaiLienHe,
            MucDo mucDo,
            String tenMucDo,
            TrangThaiYeuCau trangThai,
            String tenTrangThai,
            TrangThaiYeuCau trangThaiHieuLuc,
            String tenTrangThaiHieuLuc,
            Instant phanCongLuc,
            Instant taoLuc,
            Instant choXacNhanLuc,
            Instant dongLuc,
            BigDecimal giaTriBaoGia,
            TrangThaiBaoGia trangThaiBaoGia,
            String tenTrangThaiBaoGia,
            BigDecimal daThanhToan,
            BigDecimal conPhaiTra
    ) {}

    public record ThoTongQuanDto(
            KpiThoDto kpi,
            List<ThongKeTrangThaiDto> bieuDoTrangThai,
            List<XuHuongThoDto> bieuDoXuHuong,
            List<ThongTinViecThoRow> viecCanXuLy,
            List<BaoGiaCanXuLyDto> baoGiaCanBoSung,
            List<ToaNhaOptionDto> danhSachToa
    ) {
        public record KpiThoDto(
                int dangXuLy,
                int choXacNhan,
                TyLeHoanThanhDto tyLeHoanThanh,
                BigDecimal giaTriDaChot,
                BigDecimal daNhan,
                BigDecimal conPhaiTra
        ) {}

        public record TyLeHoanThanhDto(
                Double tyLe,
                int daHoanThanh,
                int tongDuocGiao,
                String moTa,
                boolean coDuLieu
        ) {}

        public record ThongKeTrangThaiDto(
                String trangThai,
                String tenTrangThai,
                int soLuong,
                String mauSac
        ) {}

        public record XuHuongThoDto(
                String nhan,
                BigDecimal giaTriDaChot,
                BigDecimal daNhan,
                int soViecXong
        ) {}

        public record BaoGiaCanXuLyDto(
                Long baoGiaId,
                Long yeuCauId,
                String maYeuCau,
                String hangMuc,
                String soPhong,
                String toaNha,
                int phienBan,
                TrangThaiBaoGia trangThai,
                String tenTrangThai,
                BigDecimal tongTien,
                String lyDoTuChoi,
                Instant taoLuc
        ) {}

        public record ToaNhaOptionDto(
                Long id,
                String ten
        ) {}
    }

    public record ChiTietViecThoDto(
            Long id,
            String maYeuCau,
            String hangMuc,
            String moTa,
            MucDo mucDo,
            String tenMucDo,
            TrangThaiYeuCau trangThai,
            String tenTrangThai,
            TrangThaiYeuCau trangThaiHieuLuc,
            String tenTrangThaiHieuLuc,

            // Dia diem
            Long toaNhaId,
            String toaNha,
            String diaChiToaNha,
            String soPhong,
            int tang,

            // Lien he
            Long nguoiBaoId,
            String nguoiBaoHoTen,
            String nguoiBaoSoDienThoai,
            String nguoiLienHeHoTen,
            String soDienThoaiLienHe,
            boolean laNguoiDungTenHopDong,

            // Quan ly
            Long quanLyPhuTrachId,
            String quanLyPhuTrachHoTen,
            String quanLyPhuTrachSoDienThoai,

            // Moc thoi gian
            Instant taoLuc,
            Instant tiepNhanLuc,
            Instant phanCongLuc,
            Instant choXacNhanLuc,
            Instant dongLuc,
            String lyDoHuy,

            // Khao sat & sua chua
            String ghiChuKhaoSat,
            String ketQuaSuaChua,

            // Anh
            List<Long> anhTruocIds,
            List<Long> anhSauIds,

            // Lich su
            List<LichSuThaoTacThoDto> lichSuTrangThai,

            // Bao gia & thanh toan
            BaoGiaSuaChua baoGiaHieuLuc,
            List<BaoGiaSuaChua> danhSachBaoGia,
            List<ThanhToanTho> danhSachThanhToan,
            BigDecimal tongTienBaoGia,
            BigDecimal tongDaNhan,
            BigDecimal tongConLai,
            String trangThaiThanhToan
    ) {
        public record LichSuThaoTacThoDto(
                Instant thoiDiem,
                String hanhDong,
                String tenHanhDong,
                String nguoiThucHien,
                String chiTiet,
                boolean laTuDong
        ) {}
    }

    public record YeuCauTaoBaoGia(
            String moTa,
            String ghiChu,
            List<DongBaoGiaReq> dongBaoGia,
            boolean guiDuyetNgay
    ) {
        public record DongBaoGiaReq(
                String tenHangMuc,
                BigDecimal soLuong,
                String donVi,
                BigDecimal donGia
        ) {}
    }

    public static class ThoActionRequests {
        public record KhaoSatReq(String ghiChuKhaoSat) {}
        public record BaoXongReq(String ketQuaSuaChua) {}
        public record TuChoiBaoGiaReq(String lyDoTuChoi) {}
        public record GhiNhanThanhToanReq(
                BigDecimal soTien,
                PhuongThucThanhToanTho phuongThuc,
                String maThamChieu,
                String ghiChu
        ) {}

        public record ChungTuThanhToanThoDto(
                String maChungTu,
                LocalDate ngayLap,
                Long yeuCauId,
                String maYeuCau,
                String hangMuc,
                String toaNha,
                String diaChiToaNha,
                String soPhong,
                int tang,
                String tenTho,
                String sdtTho,
                String tenQuanLy,
                String sdtQuanLy,
                String tenNguoiBao,
                String sdtNguoiBao,
                String trangThaiYeuCau,
                int baoGiaPhienBan,
                List<DongBaoGia> dongBaoGia,
                BigDecimal tongTienBaoGia,
                List<ThanhToanTho> lichSuThanhToan,
                BigDecimal tongDaTra,
                BigDecimal conLai,
                String ghiChu
        ) {}
    }
}
