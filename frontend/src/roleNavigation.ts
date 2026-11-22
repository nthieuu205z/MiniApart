// Cấu hình điều hướng UX v2 (ux-v2/02 §2): nhóm theo công việc, không theo bảng dữ liệu.
// Không đổi quyền: quyền do dinhTuyen.ts quyết định; file này chỉ chọn mục hiện trên sidebar / bottom-nav.
import type { IconName } from './design/core/Icon'

export type VaiTroDieuHuong = 'QTHT' | 'CHU' | 'QUAN_LY' | 'THO' | 'NGUOI_THUE'

export type MucDieuHuong = {
  duongDan: string
  nhan: string
  icon: IconName
  /** Đường dẫn làm mục này sáng: khớp đúng hoặc là tiền tố (`/toa-nha` sáng cả ở `/toa-nha/3`). */
  activeFor: string[]
  /** Nhãn ngắn cho bottom-nav. */
  nhanNgan?: string
  /** Khoá số đếm lấy từ soDemDieuHuong. */
  dem?: 'suCo' | 'lichHen' | 'chuKy'
  /** Số đếm đỏ (cần xử lý ngay) thay vì xám. */
  nong?: boolean
}

export type NhomDieuHuong = { nhan: string; muc: MucDieuHuong[] }
export type CauHinhDieuHuong = { nhom: NhomDieuHuong[]; chanSidebar: MucDieuHuong[]; bottomNav: boolean }

const m = (duongDan: string, nhan: string, icon: IconName, extra: Partial<MucDieuHuong> = {}): MucDieuHuong => ({ duongDan, nhan, icon, activeFor: [duongDan], ...extra })

const HOM_NAY = m('/hom-nay', 'Hôm nay', 'dashboard')
const THU_TIEN = m('/thu-tien', 'Thu tiền', 'wallet', { activeFor: ['/thu-tien', '/hoa-don'] })
const CHU_KY = m('/chu-ky', 'Chu kỳ tháng', 'meter')
const NGUOI_THUE = m('/nguoi-thue', 'Người thuê', 'users', { activeFor: ['/nguoi-thue', '/cu-tru'] })
const HOP_DONG = m('/hop-dong', 'Hợp đồng', 'contract')
const LICH_HEN = m('/lich-hen', 'Lịch hẹn', 'calendar', { dem: 'lichHen' })
const SU_CO = m('/su-co', 'Sự cố', 'wrench', { dem: 'suCo', nong: true })
const AN_TOAN = m('/an-toan', 'An toàn PCCC', 'shield')
const DICH_VU = m('/dich-vu', 'Dịch vụ & đơn giá', 'settings')

const CAU_HINH: Record<VaiTroDieuHuong, CauHinhDieuHuong> = {
  CHU: {
    bottomNav: false,
    chanSidebar: [DICH_VU],
    nhom: [
      { nhan: '', muc: [HOM_NAY] },
      { nhan: 'Thu tiền', muc: [THU_TIEN, CHU_KY] },
      { nhan: 'Phòng & người thuê', muc: [m('/toa-nha', 'Toà & phòng', 'building', { activeFor: ['/toa-nha', '/phong'] }), NGUOI_THUE, HOP_DONG, LICH_HEN] },
      { nhan: 'Vận hành', muc: [SU_CO, AN_TOAN] },
      { nhan: 'Báo cáo', muc: [m('/tong-quan', 'Báo cáo', 'chart', { activeFor: ['/tong-quan', '/bao-cao', '/bao-cao/tieu-thu', '/bao-cao/chi-phi-bao-tri', '/nhat-ky-thao-tac'] })] },
    ],
  },
  QUAN_LY: {
    bottomNav: false,
    chanSidebar: [DICH_VU],
    nhom: [
      { nhan: '', muc: [HOM_NAY] },
      { nhan: 'Thu tiền', muc: [{ ...CHU_KY, dem: 'chuKy', nong: true }, THU_TIEN] },
      { nhan: 'Phòng & người thuê', muc: [m('/phong', 'Phòng', 'door'), NGUOI_THUE, HOP_DONG, LICH_HEN] },
      { nhan: 'Vận hành', muc: [SU_CO, AN_TOAN, m('/thong-bao', 'Thông báo cư dân', 'megaphone')] },
    ],
  },
  QTHT: {
    bottomNav: false,
    chanSidebar: [],
    nhom: [{ nhan: '', muc: [m('/tai-khoan', 'Tài khoản', 'key'), m('/toa-nha', 'Toà nhà', 'building'), m('/nhat-ky-thao-tac', 'Nhật ký thao tác', 'history')] }],
  },
  THO: {
    bottomNav: true,
    chanSidebar: [],
    nhom: [{ nhan: '', muc: [m('/viec-cua-toi', 'Việc', 'wrench'), m('/tho/chi-phi', 'Tiền công', 'wallet'), m('/thong-bao', 'Thông báo', 'bell')] }],
  },
  NGUOI_THUE: {
    bottomNav: true,
    chanSidebar: [],
    nhom: [{ nhan: '', muc: [m('/hoa-don-cua-toi', 'Cần trả', 'receipt', { activeFor: ['/hoa-don-cua-toi', '/lich-su', '/hoa-don'] }), m('/bao-hong', 'Báo hỏng', 'wrench'), m('/hop-dong', 'Phòng của tôi', 'home', { nhanNgan: 'Phòng tôi', activeFor: ['/hop-dong', '/tieu-thu'] })] }],
  },
}

const DANH_SACH_VAI_TRO = Object.keys(CAU_HINH)

export function layCauHinhDieuHuong(vaiTro: string): CauHinhDieuHuong {
  return DANH_SACH_VAI_TRO.includes(vaiTro) ? CAU_HINH[vaiTro as VaiTroDieuHuong] : { nhom: [], chanSidebar: [], bottomNav: false }
}

/** Mọi mục của vai trò (nhóm + chân sidebar), theo thứ tự hiện. */
export function layMenuTheoVaiTro(vaiTro: string): MucDieuHuong[] {
  const cauHinh = layCauHinhDieuHuong(vaiTro)
  return [...cauHinh.nhom.flatMap((nhom) => nhom.muc), ...(cauHinh.chanSidebar ?? [])]
}

function chuanHoa(duongDan: string) {
  return duongDan.length > 1 && duongDan.endsWith('/') ? duongDan.slice(0, -1) : duongDan
}

export function mucDangChon(muc: MucDieuHuong, duongDan: string): boolean {
  const p = chuanHoa(duongDan)
  return muc.activeFor.some((a) => p === a || p.startsWith(`${a}/`))
}

/** Mục của vai trò khớp đường dẫn (dùng cho tiêu đề trang và nút "Mở …" của trang Không có quyền). */
export function timMucTheoDuongDan(vaiTro: string, duongDan: string): MucDieuHuong | undefined {
  return layMenuTheoVaiTro(vaiTro).find((muc) => mucDangChon(muc, duongDan))
}
