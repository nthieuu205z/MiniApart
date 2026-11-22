import { describe, expect, it } from 'vitest'
import { boDau, catDanhDau, taoChiMuc, timNhanh, type MucTim } from './timNhanh'

const chiMuc = taoChiMuc({
  nguoiThue: [
    { id: 1, hoTen: 'Trần Quang Huy', soDienThoai: '0999100001' },
    { id: 71, hoTen: 'Nguyễn Quang Huy', soDienThoai: '0999100071' },
    { id: 5, hoTen: 'Đặng Hoài An', soDienThoai: '0999100005' },
  ],
  toa: [{
    id: 3,
    ten: 'An Nhiên Residence',
    phong: [{ id: 1, soPhong: '101', tenTrangThai: 'Đang thuê' }, { id: 10, soPhong: '401', tenTrangThai: 'Trống' }],
    hopDong: [{ id: 1, soPhong: '101', hoTenNguoiThue: 'Trần Quang Huy', tenTrangThai: 'Hiệu lực', nguoiThueId: 1 }],
    hoaDon: [
      { hoaDonId: 31, maHoaDon: 'DEMO-P5-01-2026-10', kyId: 4, soPhong: '101', nguoiThue: 'Trần Quang Huy', conLai: '1895000' },
      { hoaDonId: 99, maHoaDon: 'QT-HD-9', kyId: null, soPhong: '101', nguoiThue: 'Trần Quang Huy', conLai: '0' },
    ],
  }],
})

describe('boDau', () => {
  it('bỏ dấu và đ/Đ', () => {
    expect(boDau('Nguyễn Quang Huy')).toBe('nguyen quang huy')
    expect(boDau('Đặng Hoài An')).toBe('dang hoai an')
    expect(boDau('Phường Đồng Tâm, đường số 3')).toBe('phuong dong tam, duong so 3')
  })
})

describe('timNhanh', () => {
  it('"quang huy" ra cả hai người, gõ không dấu, nhóm Người thuê đứng đầu', () => {
    const kq = timNhanh(chiMuc, 'quang huy')
    expect(kq[0].nhom).toBe('Người thuê')
    expect(kq[0].muc.map((m) => m.tieuDe)).toEqual(['Trần Quang Huy', 'Nguyễn Quang Huy'])
    expect(kq.map((g) => g.nhom)).toEqual(['Người thuê', 'Hợp đồng', 'Hoá đơn'])
  })
  it('người thuê có hợp đồng hiện phòng · toà; không có thì hiện SĐT', () => {
    expect(chiMuc.find((m) => m.href === '/nguoi-thue/1')?.phu).toBe('An Nhiên Residence · Phòng 101')
    expect(chiMuc.find((m) => m.href === '/nguoi-thue/71')?.phu).toBe('0999100071')
  })
  it('tìm theo số phòng, mã hoá đơn, SĐT; khoảng trắng thừa không làm trượt', () => {
    expect(timNhanh(chiMuc, '401')[0].muc[0].href).toBe('/phong/10?toaNhaId=3')
    expect(timNhanh(chiMuc, '  demo-p5 ')[0].muc[0].href).toBe('/hoa-don?toaNhaId=3&kyId=4&hoaDonId=31')
    expect(timNhanh(chiMuc, 'QT-HD')[0].muc[0].href).toBe('/hoa-don?toaNhaId=3&hoaDonId=99')
    expect(timNhanh(chiMuc, '0999100005')[0].muc[0].tieuDe).toBe('Đặng Hoài An')
  })
  it('truy vấn rỗng / không thấy → mảng rỗng', () => {
    expect(timNhanh(chiMuc, '   ')).toEqual([])
    expect(timNhanh(chiMuc, 'zzz')).toEqual([])
  })
  it('mỗi nhóm tối đa 4 dòng nhưng tổng vẫn đếm đủ', () => {
    const nhieu: MucTim[] = Array.from({ length: 9 }, (_, i) => ({ nhom: 'Phòng', tieuDe: `Phòng 10${i}`, phu: 'An Nhiên', href: `/phong/${i}` }))
    const [g] = timNhanh(nhieu, 'phong')
    expect(g.tong).toBe(9)
    expect(g.muc).toHaveLength(4)
  })
})

describe('catDanhDau', () => {
  it('tô đúng đoạn khớp trên chuỗi có dấu', () => {
    expect(catDanhDau('Nguyễn Quang Huy', 'quang')).toEqual(['Nguyễn ', 'Quang', ' Huy'])
    expect(catDanhDau('Nguyễn Quang Huy', 'nguyen')).toEqual(['', 'Nguyễn', ' Quang Huy'])
    expect(catDanhDau('Đặng Hoài An', 'hoai')).toEqual(['Đặng ', 'Hoài', ' An'])
  })
  it('chuỗi gốc dạng NFD vẫn cắt đúng (chuẩn hoá về NFC trước)', () => {
    expect(catDanhDau('Nguyễn Quang Huy'.normalize('NFD'), 'quang')).toEqual(['Nguyễn ', 'Quang', ' Huy'])
  })
  it('không khớp hoặc truy vấn rỗng → nguyên chuỗi', () => {
    expect(catDanhDau('Phòng 101', 'zz')).toEqual(['Phòng 101', '', ''])
    expect(catDanhDau('Phòng 101', '')).toEqual(['Phòng 101', '', ''])
  })
})
