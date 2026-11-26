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

const TEN = ['Ghi chỉ số', 'Khoá chỉ số', 'Gửi hoá đơn', 'Thu tiền']
const daGuiHoSo = (h: { trangThai: string }) => h.trangThai !== 'NHAP' && h.trangThai !== 'DA_HUY'
const conNo = (h: { trangThai: string; conLai?: string }) => daGuiHoSo(h) && Number(h.conLai ?? 0) > 0

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
  const daGui = hoaDon.filter(daGuiHoSo)
  const tomTat = [
    tongCongTo === undefined ? `còn ${soCongToThieu} chưa ghi` : `đã ghi ${Math.max(tongCongTo - soCongToThieu, 0)}/${tongCongTo} phòng · thiếu ${soCongToThieu}`,
    daChot ? 'đã khoá' : 'chưa khoá',
    `${nhap} hoá đơn nháp${daGui.length ? ` · ${daGui.length} đã gửi` : ''}`,
    `đã thu ${daGui.length - daGui.filter(conNo).length}/${daGui.length}`,
  ]
  const idx = xong.indexOf(false)
  const buocHienTai = (idx + 1) as 1 | 2 | 3 | 4
  return {
    buocHienTai,
    buoc: TEN.map((ten, i) => ({ ten, tomTat: tomTat[i], trangThai: i < idx ? 'xong' : i === idx ? 'dang' : 'chua' })),
  }
}
