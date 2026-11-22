import { dinhDangNgayIso } from './design/core/format'

export type TrangThaiBuoc = 'xong' | 'dang' | 'chua'
export type BuocChuKy = { ten: string; tomTat: string; trangThai: TrangThaiBuoc }
export type KetQuaBuoc = { buocHienTai: 1 | 2 | 3 | 4; buoc: BuocChuKy[] }

type Vao = {
  /** null = kỳ không tồn tại. */
  ky: { trangThai: string; ngayBatDau: string } | null
  soCongToThieu: number
  /** Tổng số phòng cần ghi (để hiện "n/m"); chưa biết thì bỏ trống. */
  tongCongTo?: number
  /** Hoá đơn của đúng kỳ này. */
  hoaDon: { trangThai: string; conLai?: string }[]
}

const TEN = ['Ghi chỉ số', 'Chốt kỳ', 'Phát hành hoá đơn', 'Thu tiền']
const conNo = (h: { trangThai: string; conLai?: string }) => h.trangThai !== 'NHAP' && h.trangThai !== 'DA_HUY' && Number(h.conLai ?? 0) > 0

export function tinhBuoc({ ky, soCongToThieu, tongCongTo, hoaDon }: Vao): KetQuaBuoc {
  if (!ky) return { buocHienTai: 1, buoc: [] }
  const daChot = ky.trangThai === 'DA_CHOT'
  const nhap = hoaDon.filter((h) => h.trangThai === 'NHAP').length
  const xong = [
    daChot || soCongToThieu === 0,
    daChot,
    hoaDon.length > 0 && nhap === 0,
    false, // bước theo dõi: không bao giờ "xong" trong kỳ
  ]
  const tomTat = [
    tongCongTo === undefined ? `còn ${soCongToThieu} chưa ghi` : `${Math.max(tongCongTo - soCongToThieu, 0)}/${tongCongTo} phòng · còn ${soCongToThieu}`,
    `mở từ ${dinhDangNgayIso(ky.ngayBatDau)}`,
    `${nhap} nháp · ${hoaDon.length - nhap} đã phát hành`,
    `còn ${hoaDon.filter(conNo).length} hoá đơn chưa thu đủ`,
  ]
  const idx = xong.indexOf(false)
  const buocHienTai = (idx + 1) as 1 | 2 | 3 | 4
  return {
    buocHienTai,
    buoc: TEN.map((ten, i) => ({ ten, tomTat: tomTat[i], trangThai: i < idx ? 'xong' : i === idx ? 'dang' : 'chua' })),
  }
}
