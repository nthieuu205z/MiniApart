import type { ThongTinDongTieuThuBaoCao, ThongTinKhoanNoBaoCao } from './api'

export type NoTheoNguoiThue = {
  nguoiThueId: number
  hoTenNguoiThue: string
  tenToaNha: string
  soPhong: string
  soHoaDon: number
  conLai: number
  soNgayQuaHanLonNhat: number
}

/** Khối "Nợ quá hạn nhiều nhất" (màn 03): gộp hoá đơn quá hạn theo người thuê, xếp theo số tiền còn lại. */
export function nhomNoQuaHanTheoNguoiThue(
  congNo: readonly ThongTinKhoanNoBaoCao[],
  theo: 'tien' | 'ngay' = 'tien',
  gioiHan = 5,
): NoTheoNguoiThue[] {
  const nhom = new Map<number, NoTheoNguoiThue>()
  for (const k of congNo) {
    const conLai = Number(k.conLai)
    if (!(k.soNgayQuaHan > 0) || !(conLai > 0)) continue // chỉ nợ đã quá hạn và còn tiền
    const cu = nhom.get(k.nguoiThueId)
    if (cu) {
      cu.soHoaDon += 1
      cu.conLai += conLai
      cu.soNgayQuaHanLonNhat = Math.max(cu.soNgayQuaHanLonNhat, k.soNgayQuaHan)
    } else {
      nhom.set(k.nguoiThueId, {
        nguoiThueId: k.nguoiThueId,
        hoTenNguoiThue: k.hoTenNguoiThue,
        tenToaNha: k.tenToaNha,
        soPhong: k.soPhong,
        soHoaDon: 1,
        conLai,
        soNgayQuaHanLonNhat: k.soNgayQuaHan,
      })
    }
  }
  const khoa = theo === 'tien'
    ? (a: NoTheoNguoiThue, b: NoTheoNguoiThue) => b.conLai - a.conLai || b.soNgayQuaHanLonNhat - a.soNgayQuaHanLonNhat
    : (a: NoTheoNguoiThue, b: NoTheoNguoiThue) => b.soNgayQuaHanLonNhat - a.soNgayQuaHanLonNhat || b.conLai - a.conLai
  return [...nhom.values()].sort(khoa).slice(0, gioiHan)
}

export type TieuThuToa = { toaNhaId: number; tenToaNha: string; tong: number }

/** Khối "Tiêu thụ điện theo toà" (màn 03): kỳ gần nhất có số liệu, cộng mức tiêu thụ theo toà, xếp giảm dần. */
export function tieuThuTheoToaKyGanNhat(
  cacDong: readonly ThongTinDongTieuThuBaoCao[],
  laDien = true,
): { nhanKy: string | null; donVi: string | null; toa: TieuThuToa[] } {
  const coSo = cacDong.filter((d) => d.laDien === laDien && d.coDuLieu && d.mucTieuThu !== null && !Number.isNaN(Number(d.mucTieuThu)))
  if (coSo.length === 0) return { nhanKy: null, donVi: null, toa: [] }
  const moiNhat = coSo.reduce((a, b) => (b.nam * 12 + b.thang > a.nam * 12 + a.thang ? b : a))
  const theoToa = new Map<number, TieuThuToa>()
  for (const d of coSo) {
    if (d.nam !== moiNhat.nam || d.thang !== moiNhat.thang) continue
    const cu = theoToa.get(d.toaNhaId) ?? { toaNhaId: d.toaNhaId, tenToaNha: d.tenToaNha, tong: 0 }
    cu.tong += Number(d.mucTieuThu)
    theoToa.set(d.toaNhaId, cu)
  }
  return { nhanKy: moiNhat.nhanKy, donVi: moiNhat.donVi, toa: [...theoToa.values()].sort((a, b) => b.tong - a.tong) }
}
