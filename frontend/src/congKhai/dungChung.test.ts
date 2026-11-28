import { describe, expect, it } from 'vitest'
import type { PublicPhong } from '../api'
import { layTuyenCongKhai } from './tuyen'
import { locPhong, tinhThang } from './dungChung'
import { timTuyen } from '../dinhTuyen'

const dv = (o: Partial<PublicPhong['danhSachDichVu'][number]>) => ({ id: 1, maDichVu: '1', tenDichVu: 'x', loaiThu: 'CO_DINH', donGia: 0, donViTinh: 'phòng', ghiChu: '', ...o })
const phong = (o: Partial<PublicPhong>): PublicPhong => ({ id: 1, soPhong: '101', toaNhaId: 1, tenToaNha: 'Toà A', diaChiToaNha: 'Số 1, Hà Nội', tang: 1, dienTich: 20, sucChua: 2, giaThueMacDinh: 4000000, loaiPhong: 'Studio', trangThai: 'TRONG', tienIch: [], moTa: '', anhDaiDien: '', danhSachDichVu: [], ...o })

describe('tinhThang', () => {
  it('cộng tiền phòng, điện nước theo chỉ số, cố định, theo người, xe máy; khoản chưa có giá nằm ở chuaTinh', () => {
    const r = tinhThang(phong({ giaThueMacDinh: 1000, danhSachDichVu: [
      dv({ tenDichVu: 'Điện', loaiThu: 'THEO_CHI_SO', donGia: 10, donViTinh: 'kWh' }),
      dv({ tenDichVu: 'Nước', loaiThu: 'THEO_CHI_SO', donGia: null as unknown as number, donViTinh: 'm³', cheDoGia: 'BAC_THANG' }),
      dv({ tenDichVu: 'Rác', loaiThu: 'CO_DINH', donGia: 5 }),
      dv({ tenDichVu: 'Vệ sinh', loaiThu: 'THEO_NGUOI', donGia: 3, donViTinh: 'người' }),
      dv({ tenDichVu: 'Gửi xe máy', loaiThu: 'THEO_SO_LUONG', donGia: 7, donViTinh: 'xe' }),
      dv({ tenDichVu: 'Giặt sấy', loaiThu: 'THEO_SO_LUONG', donGia: 99, donViTinh: 'kg' }),
    ] }), { nguoi: 2, xe: 1, kwh: 10, m3: 4 })
    expect(r.tong).toBe(1118)
    expect(r.chuaTinh).toEqual(['Nước'])
  })
})

describe('locPhong', () => {
  const ds = [
    phong({ id: 1, giaThueMacDinh: 5200000, tienIch: ['Điều hòa'] }),
    phong({ id: 2, giaThueMacDinh: 3000000, tienIch: ['Điều hoà', 'Ban công'] }),
    phong({ id: 3, giaThueMacDinh: 3200000, trangThai: 'DANG_THUE', toaNhaId: 2, diaChiToaNha: 'Số 2, Đà Nẵng' }),
  ]
  it('mặc định chỉ phòng trống, trống trước và giá thấp đến cao', () => {
    expect(locPhong(ds, {}).map((p) => p.id)).toEqual([2, 1])
    expect(locPhong(ds, { tatca: true }).map((p) => p.id)).toEqual([2, 1, 3])
  })
  it('lọc theo giá, toà, thành phố, tiện ích (hòa/hoà là một), từ khoá', () => {
    expect(locPhong(ds, { gia: 'TREN_5' }).map((p) => p.id)).toEqual([1])
    expect(locPhong(ds, { tatca: true, toa: '2' }).map((p) => p.id)).toEqual([3])
    expect(locPhong(ds, { tatca: true, tp: 'Đà Nẵng' }).map((p) => p.id)).toEqual([3])
    expect(locPhong(ds, { ti: ['Điều hoà'] }).map((p) => p.id)).toEqual([2, 1])
    expect(locPhong(ds, { ti: ['Điều hoà', 'Ban công'] }).map((p) => p.id)).toEqual([2])
    expect(locPhong(ds, { q: ' 101 ' }).length).toBe(2)
  })
})

describe('đường dẫn công khai', () => {
  it('nhận diện trang công khai và route cũ /kham-pha', () => {
    expect(layTuyenCongKhai('/')).toEqual({ loai: 'trang-chu' })
    expect(layTuyenCongKhai('/tim-phong')).toEqual({ loai: 'tim-phong' })
    expect(layTuyenCongKhai('/kham-pha')).toEqual({ loai: 'tim-phong' })
    expect(layTuyenCongKhai('/dang-nhap')).toEqual({ loai: 'dang-nhap' })
    expect(layTuyenCongKhai('/phong-trong/12')).toEqual({ loai: 'phong', id: 12 })
  })
  it('không nuốt route của app: /phong và /phong/:id vẫn của Chủ/Quản lý', () => {
    for (const d of ['/phong', '/phong/12', '/hom-nay', '/hoa-don-cua-toi', '/phong-trong/abc']) expect(layTuyenCongKhai(d)).toBeNull()
    expect(timTuyen('CHU', '/phong/12')).toMatchObject({ loai: 'trang', khoa: 'ho-so-phong' })
    expect(timTuyen('QUAN_LY', '/phong')).toMatchObject({ loai: 'trang', khoa: 'phong' })
  })
})
