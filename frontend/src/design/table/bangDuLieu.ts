/** Trạng thái hiển thị của một bảng nghiệp vụ: tìm → lọc chip → sắp xếp → phân trang. Thuần, không React. */
export type ChieuSapXep = 'ascending' | 'descending'

export type TuyChonBang<T> = {
  tuKhoa?: string
  /** Chuỗi để tìm theo từ khoá (đã gộp các cột cần tìm). */
  timTheo?: (dong: T) => string
  /** Bộ lọc của chip đang bật; không có = tất cả. */
  loc?: (dong: T) => boolean
  sapXep?: { cot: string; chieu: ChieuSapXep } | null
  /** Giá trị so sánh theo cột; số so số, chuỗi so theo tiếng Việt có số tự nhiên (101 < 1001). */
  layGiaTri?: (dong: T, cot: string) => string | number | null | undefined
  trang?: number
  coTrang?: number
}

export type KetQuaBang<T> = {
  hienThi: T[]
  tongSauLoc: number
  soTrang: number
  /** Trang thực tế sau khi kẹp vào [1, soTrang]. */
  trang: number
  tu: number
  den: number
}

/** Bỏ dấu + chữ thường để "nguyen" tìm ra "Nguyễn". */
export function chuanHoaTimKiem(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().trim()
}

export function apDungBang<T>(dong: readonly T[], tc: TuyChonBang<T> = {}): KetQuaBang<T> {
  const tuKhoa = chuanHoaTimKiem(tc.tuKhoa ?? '')
  const ketQua = dong.filter((d) => (!tc.loc || tc.loc(d)) && (!tuKhoa || !tc.timTheo || chuanHoaTimKiem(tc.timTheo(d)).includes(tuKhoa)))

  if (tc.sapXep && tc.layGiaTri) {
    const { cot, chieu } = tc.sapXep
    const dau = chieu === 'ascending' ? 1 : -1
    const lay = tc.layGiaTri
    // Ô rỗng luôn nằm cuối, bất kể chiều sắp xếp.
    ketQua.sort((a, b) => { // ketQua là mảng mới từ filter, sắp tại chỗ không đụng mảng gốc
      const x = lay(a, cot)
      const y = lay(b, cot)
      const xRong = x === null || x === undefined || x === ''
      const yRong = y === null || y === undefined || y === ''
      if (xRong || yRong) return xRong === yRong ? 0 : xRong ? 1 : -1
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * dau
      return String(x).localeCompare(String(y), 'vi', { numeric: true, sensitivity: 'base' }) * dau
    })
  }

  const tongSauLoc = ketQua.length
  const coTrang = Math.max(1, Math.floor(tc.coTrang ?? (tongSauLoc || 1)))
  const soTrang = Math.max(1, Math.ceil(tongSauLoc / coTrang))
  const trang = Math.min(Math.max(1, Math.floor(tc.trang ?? 1)), soTrang)
  const batDau = (trang - 1) * coTrang
  const hienThi = ketQua.slice(batDau, batDau + coTrang)
  return { hienThi, tongSauLoc, soTrang, trang, tu: hienThi.length ? batDau + 1 : 0, den: batDau + hienThi.length }
}

/** Số đếm cho từng chip lọc, tính trên danh sách đã qua tìm kiếm (chip hiện số khớp với ô tìm). */
export function demTheoChip<T>(dong: readonly T[], chip: Record<string, (d: T) => boolean>): Record<string, number> {
  const dem: Record<string, number> = {}
  for (const [ma, khop] of Object.entries(chip)) dem[ma] = dong.filter(khop).length
  return dem
}

/** Đổi chiều khi bấm lại cùng cột; cột mới bắt đầu tăng dần. Trả về giá trị cho aria-sort. */
export function doiSapXep(hienTai: { cot: string; chieu: ChieuSapXep } | null, cot: string): { cot: string; chieu: ChieuSapXep } {
  if (hienTai?.cot === cot) return { cot, chieu: hienTai.chieu === 'ascending' ? 'descending' : 'ascending' }
  return { cot, chieu: 'ascending' }
}
