// Gộp công nợ theo người thuê (hoặc theo phòng) cho tab "Cần thu" của Thu tiền — làm phía client, không cần API mới.
// Chủ: nguồn /api/bao-cao/cong-no (mọi toà một lần). Quản lý: /api/bao-cao/cong-no trả 403 → dựng từ /api/hoa-don?toaNhaId=.
import type { ThongTinHoaDonQuanLy, ThongTinKhoanNoBaoCao } from './api'
import { boDau } from './timNhanh'

export type DongNo = {
  hoaDonId: number
  maHoaDon: string
  kyId: number | null
  toaNhaId: number
  tenToaNha: string
  soPhong: string
  hopDongId: number
  nguoiThueId: number | null
  hoTen: string
  ngayPhatHanh: string | null
  hanThanhToan: string
  tongTien: number
  daThu: number
  conLai: number
  soNgayQuaHan: number
}

export type NhomNo = {
  khoa: string
  nguoiThueId: number | null
  hoTen: string
  toaNhaId: number
  tenToaNha: string
  soPhong: string
  hopDongId: number
  hoaDon: DongNo[] // hạn sớm nhất trước
  daThu: number
  conLai: number
  treLauNhat: number
  coTraMotPhan: boolean
}

export type BoLocNo = 'tat-ca' | 'tre-30' | 'mot-phan'

const so = (v: string | number | null | undefined) => {
  const n = Number(v ?? 0)
  return Number.isFinite(n) ? n : 0
}

export function tuCongNo(rows: ThongTinKhoanNoBaoCao[]): DongNo[] {
  return rows.filter((r) => so(r.conLai) > 0).map((r) => ({
    hoaDonId: r.hoaDonId, maHoaDon: r.maHoaDon, kyId: r.kyId, toaNhaId: r.toaNhaId, tenToaNha: r.tenToaNha,
    soPhong: r.soPhong, hopDongId: r.hopDongId, nguoiThueId: r.nguoiThueId, hoTen: r.hoTenNguoiThue,
    ngayPhatHanh: r.ngayPhatHanh, hanThanhToan: r.hanThanhToan,
    tongTien: so(r.tongTien), daThu: so(r.daThu), conLai: so(r.conLai), soNgayQuaHan: Math.max(0, r.soNgayQuaHan),
  }))
}

/** Số ngày từ hạn tới `homNay` (YYYY-MM-DD, giờ Việt Nam), âm thì 0. */
export function soNgayTre(han: string, homNay: string): number {
  const d = (Date.parse(`${homNay.slice(0, 10)}T00:00:00Z`) - Date.parse(`${han.slice(0, 10)}T00:00:00Z`)) / 864e5
  return Number.isFinite(d) ? Math.max(0, Math.round(d)) : 0
}

type HopDongGon = { id: number; soPhong: string; hoTenNguoiThue: string; nguoiThueId: number }

/**
 * Quản lý: hoá đơn của một toà (GET /api/hoa-don?toaNhaId=) + hợp đồng của toà (fetchHopDongQuanLy) để biết nguoiThueId.
 * Lần kiểm 22/11/2026: JSON thật của /api/hoa-don KHÔNG có `hopDongId` (type ThongTinHoaDonQuanLy ghi có) → ghép theo phòng + họ tên.
 */
export function tuHoaDonQuanLy(rows: ThongTinHoaDonQuanLy[], toa: { id: number; ten: string }, homNay: string, hopDong: HopDongGon[] = []): DongNo[] {
  const theoPhongTen = new Map(hopDong.map((h) => [`${h.soPhong}|${h.hoTenNguoiThue}`, h]))
  return rows.filter((r) => so(r.conLai) > 0 && r.trangThai !== 'NHAP' && r.trangThai !== 'DA_HUY').map((r) => {
    const h = theoPhongTen.get(`${r.soPhong}|${r.nguoiThue}`)
    return {
      hoaDonId: r.hoaDonId, maHoaDon: r.maHoaDon, kyId: r.kyId, toaNhaId: toa.id, tenToaNha: toa.ten,
      soPhong: r.soPhong, hopDongId: h?.id ?? 0, nguoiThueId: h?.nguoiThueId ?? null, hoTen: r.nguoiThue,
      ngayPhatHanh: (r as { ngayPhatHanh?: string }).ngayPhatHanh ?? null, hanThanhToan: r.hanThanhToan,
      tongTien: so(r.tongTien), daThu: so(r.daThu), conLai: so(r.conLai), soNgayQuaHan: soNgayTre(r.hanThanhToan, homNay),
    }
  })
}

/** Gộp theo người (mặc định) hoặc theo phòng; nhóm nợ nhiều nhất lên đầu. */
export function nhomNo(dong: DongNo[], theo: 'nguoi' | 'phong' = 'nguoi'): NhomNo[] {
  const map = new Map<string, NhomNo>()
  for (const d of dong) {
    // Người: nguoiThueId; thiếu id (Quản lý không ghép được hợp đồng) thì theo toà + phòng + họ tên. Phòng: toà + số phòng.
    const khoa = theo === 'phong' ? `p:${d.toaNhaId}:${d.soPhong}` : d.nguoiThueId !== null ? `n:${d.nguoiThueId}` : `t:${d.toaNhaId}:${d.soPhong}:${d.hoTen}`
    const g = map.get(khoa) ?? { khoa, nguoiThueId: d.nguoiThueId, hoTen: d.hoTen, toaNhaId: d.toaNhaId, tenToaNha: d.tenToaNha, soPhong: d.soPhong, hopDongId: d.hopDongId, hoaDon: [], daThu: 0, conLai: 0, treLauNhat: 0, coTraMotPhan: false }
    g.hoaDon.push(d)
    g.daThu += d.daThu
    g.conLai += d.conLai
    g.treLauNhat = Math.max(g.treLauNhat, d.soNgayQuaHan)
    g.coTraMotPhan ||= d.daThu > 0
    map.set(khoa, g)
  }
  const ds = [...map.values()]
  for (const g of ds) g.hoaDon.sort((a, b) => a.hanThanhToan.localeCompare(b.hanThanhToan))
  return ds.sort((a, b) => b.conLai - a.conLai || b.treLauNhat - a.treLauNhat || a.hoTen.localeCompare(b.hoTen, 'vi'))
}

export function demBoLoc(ds: NhomNo[]): Record<BoLocNo, number> {
  return { 'tat-ca': ds.length, 'tre-30': ds.filter((g) => g.treLauNhat > 30).length, 'mot-phan': ds.filter((g) => g.coTraMotPhan).length }
}

/** Lọc theo chip + ô tìm (tên, phòng, mã hoá đơn; gõ không dấu được). */
export function locNo(ds: NhomNo[], boLoc: BoLocNo, tim = ''): NhomNo[] {
  const q = boDau(tim).trim()
  return ds.filter((g) => (boLoc === 'tat-ca' || (boLoc === 'tre-30' ? g.treLauNhat > 30 : g.coTraMotPhan))
    && (!q || boDau(`${g.hoTen} ${g.tenToaNha} phòng ${g.soPhong} ${g.hoaDon.map((h) => h.maHoaDon).join(' ')}`).includes(q)))
}

/** Hàng tổng dưới bảng — tính trên danh sách đang hiện (sau lọc), không chỉ trang hiện tại. */
export function hangTong(ds: NhomNo[]) {
  return { soNhom: ds.length, soKy: ds.reduce((t, g) => t + g.hoaDon.length, 0), daThu: ds.reduce((t, g) => t + g.daThu, 0), conLai: ds.reduce((t, g) => t + g.conLai, 0) }
}
