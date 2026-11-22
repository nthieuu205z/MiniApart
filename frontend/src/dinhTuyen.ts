// Bảng định tuyến UX v2: một chỗ quyết định đường dẫn → màn, quyền theo vai trò và đường dẫn cũ tự chuyển.
// Thay chuỗi `hienThi*` + `xacDinhTrangTheoVaiTro` trong App.tsx. Không đổi quyền: mọi cặp (vai trò, đường dẫn)
// app cũ mở được vẫn mở được (trực tiếp hoặc qua chuyển hướng); không mở thêm đường dẫn nào cho vai trò khác.

export type VaiTro = 'QTHT' | 'CHU' | 'QUAN_LY' | 'THO' | 'NGUOI_THUE'

export type KhoaTrang =
  | 'hom-nay' | 'chu-ky' | 'thu-tien' | 'hoa-don'
  | 'toa-nha' | 'ho-so-toa' | 'phong' | 'ho-so-phong'
  | 'nguoi-thue' | 'ho-so-nguoi-thue' | 'cu-tru'
  | 'hop-dong' | 'tao-hop-dong' | 'ho-so-hop-dong'
  | 'lich-hen' | 'su-co' | 'an-toan' | 'dich-vu' | 'thong-bao'
  | 'tong-quan' | 'bao-cao' | 'bao-cao-tieu-thu' | 'bao-cao-chi-phi' | 'nhat-ky'
  | 'tai-khoan'
  | 'viec-tho' | 'tien-cong'
  | 'can-tra' | 'lich-su-hoa-don' | 'bao-hong' | 'hop-dong-cua-toi' | 'tieu-thu-cua-toi'

export type KetQuaTuyen =
  | { loai: 'trang'; khoa: KhoaTrang; thamSo: Record<string, string> }
  | { loai: 'chuyen'; toi: string }
  | { loai: 'khong-co-quyen'; vaiTroSoHuu: VaiTro[] }

type Tuyen = { mau: string; vaiTro: VaiTro[]; khoa: KhoaTrang }

/** Props chung của màn cấp trang mới (HomNay, ChuKyThang, HoSo*360, TaoHopDong, TrangSuCo): App truyền, lô sau chỉ đọc. */
export type TrangProps = { token: string; vaiTro: VaiTro; mobile: boolean; thamSo: Record<string, string>; dieuHuong: (href: string) => void }

const CHU_QL: VaiTro[] = ['CHU', 'QUAN_LY']

// Thứ tự quan trọng: mẫu cụ thể ('/hop-dong/moi') đứng trước mẫu tham số ('/hop-dong/:id').
// Một đường dẫn có thể thuộc nhiều dòng (vd /hop-dong: Chủ/QL → bảng hợp đồng, khách → hợp đồng của tôi).
const TUYEN: Tuyen[] = [
  { mau: '/hom-nay', vaiTro: CHU_QL, khoa: 'hom-nay' },
  { mau: '/chu-ky', vaiTro: CHU_QL, khoa: 'chu-ky' },
  { mau: '/thu-tien', vaiTro: CHU_QL, khoa: 'thu-tien' },
  { mau: '/hoa-don', vaiTro: ['QTHT', 'CHU', 'QUAN_LY'], khoa: 'hoa-don' }, // QTHT: giữ đúng hành vi cũ của App (nhánh hienThiHoaDon)
  { mau: '/toa-nha', vaiTro: ['QTHT', 'CHU', 'QUAN_LY'], khoa: 'toa-nha' },
  { mau: '/toa-nha/:id', vaiTro: ['QTHT', 'CHU', 'QUAN_LY'], khoa: 'ho-so-toa' },
  { mau: '/phong', vaiTro: ['QUAN_LY'], khoa: 'phong' },
  { mau: '/phong/:id', vaiTro: CHU_QL, khoa: 'ho-so-phong' }, // Chủ vào hồ sơ phòng từ Toà & phòng; /phong (danh sách) vẫn chỉ của QL
  { mau: '/nguoi-thue', vaiTro: CHU_QL, khoa: 'nguoi-thue' },
  { mau: '/nguoi-thue/:id', vaiTro: CHU_QL, khoa: 'ho-so-nguoi-thue' },
  { mau: '/cu-tru', vaiTro: CHU_QL, khoa: 'cu-tru' },
  { mau: '/hop-dong', vaiTro: CHU_QL, khoa: 'hop-dong' },
  { mau: '/hop-dong', vaiTro: ['NGUOI_THUE'], khoa: 'hop-dong-cua-toi' },
  { mau: '/hop-dong/moi', vaiTro: CHU_QL, khoa: 'tao-hop-dong' },
  { mau: '/hop-dong/:id', vaiTro: CHU_QL, khoa: 'ho-so-hop-dong' },
  { mau: '/lich-hen', vaiTro: CHU_QL, khoa: 'lich-hen' },
  { mau: '/su-co', vaiTro: CHU_QL, khoa: 'su-co' },
  { mau: '/an-toan', vaiTro: CHU_QL, khoa: 'an-toan' },
  { mau: '/dich-vu', vaiTro: CHU_QL, khoa: 'dich-vu' },
  { mau: '/thong-bao', vaiTro: ['CHU', 'QUAN_LY', 'THO', 'NGUOI_THUE'], khoa: 'thong-bao' },
  { mau: '/tong-quan', vaiTro: ['CHU'], khoa: 'tong-quan' },
  { mau: '/bao-cao', vaiTro: ['CHU'], khoa: 'bao-cao' },
  { mau: '/bao-cao/tieu-thu', vaiTro: ['CHU'], khoa: 'bao-cao-tieu-thu' },
  { mau: '/bao-cao/chi-phi-bao-tri', vaiTro: ['CHU'], khoa: 'bao-cao-chi-phi' },
  { mau: '/nhat-ky-thao-tac', vaiTro: ['QTHT', 'CHU'], khoa: 'nhat-ky' },
  { mau: '/tai-khoan', vaiTro: ['QTHT'], khoa: 'tai-khoan' },
  { mau: '/viec-cua-toi', vaiTro: ['THO'], khoa: 'viec-tho' },
  { mau: '/tho/chi-phi', vaiTro: ['THO'], khoa: 'tien-cong' },
  { mau: '/hoa-don-cua-toi', vaiTro: ['NGUOI_THUE'], khoa: 'can-tra' },
  { mau: '/lich-su', vaiTro: ['NGUOI_THUE'], khoa: 'lich-su-hoa-don' },
  { mau: '/bao-hong', vaiTro: ['NGUOI_THUE'], khoa: 'bao-hong' },
  { mau: '/tieu-thu', vaiTro: ['NGUOI_THUE'], khoa: 'tieu-thu-cua-toi' },
]

// Màn cũ đã bị gộp hẳn vào màn mới → tự chuyển, giữ nguyên query (toaNhaId, kyId…).
const CHUYEN_CU: Array<{ tu: string; vaiTro: VaiTro[]; toi: string }> = [
  { tu: '/nhac-viec', vaiTro: ['QUAN_LY'], toi: '/hom-nay' },
  { tu: '/cong-no', vaiTro: ['CHU'], toi: '/thu-tien' },
  { tu: '/ghi-chi-so', vaiTro: CHU_QL, toi: '/chu-ky' },
  { tu: '/tho/tong-quan', vaiTro: ['THO'], toi: '/viec-cua-toi' },
]

export const TRANG_DAU: Record<VaiTro, string> = {
  CHU: '/hom-nay',
  QUAN_LY: '/hom-nay',
  QTHT: '/tai-khoan',
  THO: '/viec-cua-toi',
  NGUOI_THUE: '/hoa-don-cua-toi',
}

export function laVaiTro(v: string): v is VaiTro {
  return v in TRANG_DAU
}

function chuanHoa(duongDan: string) {
  if (!duongDan || duongDan === '/') return '/'
  return duongDan.length > 1 && duongDan.endsWith('/') ? duongDan.slice(0, -1) : duongDan
}

function khop(mau: string, duongDan: string): Record<string, string> | null {
  const a = mau.split('/'), b = duongDan.split('/')
  if (a.length !== b.length) return null
  const thamSo: Record<string, string> = {}
  for (let i = 0; i < a.length; i += 1) {
    if (a[i].startsWith(':')) {
      if (!b[i]) return null
      thamSo[a[i].slice(1)] = decodeURIComponent(b[i])
    } else if (a[i] !== b[i]) {
      return null
    }
  }
  return thamSo
}

/** `search` là `location.search` (có hoặc không có dấu `?`). */
export function timTuyen(vaiTro: string, duongDanVao: string, search = ''): KetQuaTuyen {
  const duongDan = chuanHoa(duongDanVao)
  const q = search && !search.startsWith('?') ? `?${search}` : search
  if (!laVaiTro(vaiTro)) return { loai: 'khong-co-quyen', vaiTroSoHuu: [] }

  if (['/', '/dang-nhap', '/kham-pha'].includes(duongDan)) {
    // Khách thuê ở '/' trước đây xem hoá đơn của mình → giữ query (hoaDonId) khi chuyển.
    return { loai: 'chuyen', toi: TRANG_DAU[vaiTro] + (vaiTro === 'NGUOI_THUE' && duongDan === '/' ? q : '') }
  }

  const cu = CHUYEN_CU.find((c) => c.tu === duongDan && c.vaiTro.includes(vaiTro))
  if (cu) return { loai: 'chuyen', toi: cu.toi + q }

  const tuyen = TUYEN.find((t) => t.vaiTro.includes(vaiTro) && khop(t.mau, duongDan))
  if (tuyen) return { loai: 'trang', khoa: tuyen.khoa, thamSo: khop(tuyen.mau, duongDan)! }

  // Thợ chỉ có 3 màn: đường dẫn lạ đưa về Việc (giữ hành vi cũ: App luôn ép về màn chính của thợ).
  if (vaiTro === 'THO') return { loai: 'chuyen', toi: TRANG_DAU.THO }

  const soHuu = new Set<VaiTro>()
  for (const t of TUYEN) if (khop(t.mau, duongDan)) t.vaiTro.forEach((v) => soHuu.add(v))
  for (const c of CHUYEN_CU) if (c.tu === duongDan) c.vaiTro.forEach((v) => soHuu.add(v))
  return { loai: 'khong-co-quyen', vaiTroSoHuu: [...soHuu] }
}

/** Nhóm tab: các đường dẫn cũ vẫn là trang thật, chỉ đứng chung một nhóm tab và một mục nav. */
export type MucTab = { nhan: string; href: string }
export const NHOM_TAB: Record<string, { vaiTro: VaiTro[]; tab: MucTab[] }> = {
  'thu-tien': { vaiTro: CHU_QL, tab: [
    { nhan: 'Cần thu', href: '/thu-tien' },
    { nhan: 'Hoá đơn', href: '/hoa-don' },
    { nhan: 'Đã thu', href: '/thu-tien?tab=da-thu' },
    { nhan: 'Tiền cọc', href: '/thu-tien?tab=coc' },
  ] },
  'nguoi-thue': { vaiTro: CHU_QL, tab: [
    { nhan: 'Danh sách', href: '/nguoi-thue' },
    { nhan: 'Khai báo cư trú', href: '/cu-tru' },
  ] },
  'bao-cao': { vaiTro: ['CHU'], tab: [
    { nhan: 'Tổng quan', href: '/tong-quan' },
    { nhan: 'Doanh thu & lấp đầy', href: '/bao-cao' },
    { nhan: 'Tiêu thụ điện nước', href: '/bao-cao/tieu-thu' },
    { nhan: 'Chi phí bảo trì', href: '/bao-cao/chi-phi-bao-tri' },
    { nhan: 'Nhật ký thao tác', href: '/nhat-ky-thao-tac' },
  ] },
  'can-tra': { vaiTro: ['NGUOI_THUE'], tab: [
    { nhan: 'Cần trả', href: '/hoa-don-cua-toi' },
    { nhan: 'Lịch sử', href: '/lich-su' },
  ] },
  'phong-cua-toi': { vaiTro: ['NGUOI_THUE'], tab: [
    { nhan: 'Hợp đồng', href: '/hop-dong' },
    { nhan: 'Tiêu thụ', href: '/tieu-thu' },
  ] },
}

/** Tab nào đang chọn: khớp đường dẫn + tham số `tab` (thiếu `tab` = tab không có `?tab=`). */
export function tabDangChon(nhom: string, duongDan: string, search = ''): string | null {
  const g = NHOM_TAB[nhom]
  if (!g) return null
  const tab = new URLSearchParams(search).get('tab')
  const hit = g.tab.find((t) => {
    const u = new URL(t.href, 'http://x')
    return u.pathname === chuanHoa(duongDan) && (u.searchParams.get('tab') ?? null) === tab
  }) ?? g.tab.find((t) => new URL(t.href, 'http://x').pathname === chuanHoa(duongDan))
  return hit ? hit.href : null
}

/** Nhóm tab cho một vai trò + đường dẫn (QTHT ở /nhat-ky-thao-tac không có tab Báo cáo). */
export function nhomTabCua(vaiTro: string, duongDan: string): string | null {
  const p = chuanHoa(duongDan)
  for (const [ten, g] of Object.entries(NHOM_TAB)) {
    if (!laVaiTro(vaiTro) || !g.vaiTro.includes(vaiTro)) continue
    if (g.tab.some((t) => new URL(t.href, 'http://x').pathname === p)) return ten
  }
  return null
}
