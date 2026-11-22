// Tìm nhanh (Ctrl/⌘+K) phía client trên dữ liệu đã tải — chưa có API tìm toàn cục (phụ thuộc backend, xem 02 §4).
// shortcut: lọc chuỗi con trên vài trăm dòng trong bộ nhớ, đổi sang API tìm server khi dữ liệu > vài nghìn dòng.

export type NhomKetQua = 'Người thuê' | 'Phòng' | 'Hợp đồng' | 'Hoá đơn'
export type MucTim = { nhom: NhomKetQua; tieuDe: string; phu: string; href: string }
export type NhomTim = { nhom: NhomKetQua; tong: number; muc: MucTim[] }

const THU_TU: NhomKetQua[] = ['Người thuê', 'Phòng', 'Hợp đồng', 'Hoá đơn']

/** Bỏ dấu tiếng Việt + chữ thường: "Nguyễn Quang Huy" → "nguyen quang huy"; "Đ" → "d". */
export function boDau(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
}

/** Gom mọi từ khoá trên một dòng; khoảng trắng thừa trong truy vấn không làm trượt kết quả. */
function chuan(s: string) {
  return boDau(s).replace(/\s+/g, ' ').trim()
}

/** Lọc + nhóm theo loại, tối đa `moiNhom` dòng mỗi nhóm (đếm tổng vẫn đủ). Truy vấn rỗng → không có kết quả. */
export function timNhanh(chiMuc: MucTim[], truyVan: string, moiNhom = 4): NhomTim[] {
  const q = chuan(truyVan)
  if (!q) return []
  const nhom = new Map<NhomKetQua, MucTim[]>()
  for (const m of chiMuc) {
    if (!chuan(`${m.tieuDe} ${m.phu}`).includes(q)) continue
    const ds = nhom.get(m.nhom) ?? []
    ds.push(m)
    nhom.set(m.nhom, ds)
  }
  return THU_TU.filter((n) => nhom.has(n)).map((n) => ({ nhom: n, tong: nhom.get(n)!.length, muc: nhom.get(n)!.slice(0, moiNhom) }))
}

/**
 * Cắt chuỗi gốc (giữ dấu) thành [trước, khớp, sau] để tô đậm phần khớp. Không khớp → [s, '', ''].
 * Bỏ dấu không đổi độ dài theo ký tự dựng sẵn (NFC) của tiếng Việt, nên vị trí trên chuỗi đã bỏ dấu dùng lại được.
 */
export function catDanhDau(s: string, truyVan: string): [string, string, string] {
  const q = chuan(truyVan)
  const goc = s.normalize('NFC')
  if (!q) return [goc, '', '']
  const i = boDau(goc).indexOf(q)
  if (i < 0) return [goc, '', '']
  return [goc.slice(0, i), goc.slice(i, i + q.length), goc.slice(i + q.length)]
}

// Dựng chỉ mục từ đúng kiểu dữ liệu API đang trả (api.ts). Chỉ lấy vài trường cần hiện.
type NguoiThueTho = { id: number; hoTen: string; soDienThoai?: string | null }
type PhongTho = { id: number; soPhong: string; tenTrangThai?: string | null }
type HopDongTho = { id: number; soPhong: string; hoTenNguoiThue: string; tenTrangThai?: string | null; nguoiThueId?: number }
type HoaDonTho = { hoaDonId: number; maHoaDon: string; kyId: number | null; soPhong: string; nguoiThue: string; conLai: string }

export function taoChiMuc(nguon: {
  nguoiThue?: NguoiThueTho[]
  toa?: Array<{ id: number; ten: string; phong?: PhongTho[]; hopDong?: HopDongTho[]; hoaDon?: HoaDonTho[] }>
}): MucTim[] {
  const out: MucTim[] = []
  const phongCuaNguoi = new Map<number, string>()
  for (const t of nguon.toa ?? []) for (const h of t.hopDong ?? []) if (h.nguoiThueId) phongCuaNguoi.set(h.nguoiThueId, `${t.ten} · Phòng ${h.soPhong}`)
  for (const n of nguon.nguoiThue ?? []) out.push({ nhom: 'Người thuê', tieuDe: n.hoTen, phu: phongCuaNguoi.get(n.id) ?? n.soDienThoai ?? '', href: `/nguoi-thue/${n.id}` })
  for (const t of nguon.toa ?? []) {
    for (const p of t.phong ?? []) out.push({ nhom: 'Phòng', tieuDe: `Phòng ${p.soPhong}`, phu: [t.ten, p.tenTrangThai].filter(Boolean).join(' · '), href: `/phong/${p.id}?toaNhaId=${t.id}` })
    for (const h of t.hopDong ?? []) out.push({ nhom: 'Hợp đồng', tieuDe: `Hợp đồng #${h.id} · ${h.hoTenNguoiThue}`, phu: [`${t.ten} · Phòng ${h.soPhong}`, h.tenTrangThai].filter(Boolean).join(' · '), href: `/hop-dong/${h.id}?toaNhaId=${t.id}` })
    for (const h of t.hoaDon ?? []) out.push({ nhom: 'Hoá đơn', tieuDe: h.maHoaDon, phu: `${h.nguoiThue} · ${t.ten} · Phòng ${h.soPhong}`, // Chi tiết hoá đơn của App cần đủ toaNhaId + kyId + hoaDonId (Quản lý); Chủ thiếu kyId vẫn mở được dạng công nợ.
      href: `/hoa-don?toaNhaId=${t.id}${h.kyId ? `&kyId=${h.kyId}` : ''}&hoaDonId=${h.hoaDonId}` })
  }
  return out
}
