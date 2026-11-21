import { describe, expect, it } from 'vitest'
import { apDungBang, chuanHoaTimKiem, demTheoChip, doiSapXep } from './bangDuLieu'

type HD = { id: number; soPhong: string; ten: string; giaThue: string; trangThai: string; sapHetHan: boolean }
const ds: HD[] = [
  { id: 1, soPhong: '1001', ten: 'Trần Quang Huy', giaThue: '3200000.00', trangThai: 'HIEU_LUC', sapHetHan: false },
  { id: 2, soPhong: '101', ten: 'Lê Thu Trang', giaThue: '3600000.00', trangThai: 'HIEU_LUC', sapHetHan: true },
  { id: 3, soPhong: '202', ten: 'Đinh Nhật Quang', giaThue: '', trangThai: 'DA_THANH_LY', sapHetHan: false },
  { id: 4, soPhong: '303', ten: 'Ngô Hải Nam', giaThue: '2800000.00', trangThai: 'CHO_KY', sapHetHan: false },
]
const lay = (d: HD, cot: string) => (cot === 'gia' ? (d.giaThue ? Number(d.giaThue) : null) : cot === 'phong' ? d.soPhong : d.ten)

describe('apDungBang', () => {
  it('tìm không dấu và theo cả chữ đ', () => {
    expect(chuanHoaTimKiem('Đinh Nhật')).toBe('dinh nhat')
    const r = apDungBang(ds, { tuKhoa: 'dinh', timTheo: (d) => `${d.soPhong} ${d.ten}` })
    expect(r.hienThi.map((d) => d.id)).toEqual([3])
  })

  it('lọc chip rồi mới tìm, tổng đếm sau lọc', () => {
    const r = apDungBang(ds, { loc: (d) => d.trangThai === 'HIEU_LUC', tuKhoa: 'trang', timTheo: (d) => d.ten })
    expect(r.hienThi.map((d) => d.id)).toEqual([2])
    expect(r.tongSauLoc).toBe(1)
  })

  it('sắp số phòng theo số tự nhiên: 101 trước 1001', () => {
    const r = apDungBang(ds, { sapXep: { cot: 'phong', chieu: 'ascending' }, layGiaTri: lay })
    expect(r.hienThi.map((d) => d.soPhong)).toEqual(['101', '202', '303', '1001'])
  })

  it('sắp tiền giảm dần, ô rỗng luôn cuối ở cả hai chiều', () => {
    const giam = apDungBang(ds, { sapXep: { cot: 'gia', chieu: 'descending' }, layGiaTri: lay })
    expect(giam.hienThi.map((d) => d.id)).toEqual([2, 1, 4, 3])
    const tang = apDungBang(ds, { sapXep: { cot: 'gia', chieu: 'ascending' }, layGiaTri: lay })
    expect(tang.hienThi.map((d) => d.id)).toEqual([4, 1, 2, 3])
  })

  it('không làm đổi mảng gốc khi sắp xếp', () => {
    const banGoc = ds.map((d) => d.id)
    apDungBang(ds, { sapXep: { cot: 'gia', chieu: 'descending' }, layGiaTri: lay })
    expect(ds.map((d) => d.id)).toEqual(banGoc)
  })

  it('phân trang và kẹp trang vượt quá về trang cuối', () => {
    const r = apDungBang(ds, { coTrang: 3, trang: 9 })
    expect(r).toMatchObject({ soTrang: 2, trang: 2, tu: 4, den: 4 })
    expect(r.hienThi.map((d) => d.id)).toEqual([4])
  })

  it('danh sách rỗng vẫn có 1 trang và tu = 0', () => {
    expect(apDungBang([] as HD[], { coTrang: 20 })).toMatchObject({ soTrang: 1, trang: 1, tu: 0, den: 0, tongSauLoc: 0 })
  })
})

describe('demTheoChip / doiSapXep', () => {
  it('đếm từng chip, chip chồng nhau được (sắp hết hạn vẫn là hiệu lực)', () => {
    expect(demTheoChip(ds, {
      TAT_CA: () => true,
      HIEU_LUC: (d) => d.trangThai === 'HIEU_LUC',
      SAP_HET_HAN: (d) => d.sapHetHan,
    })).toEqual({ TAT_CA: 4, HIEU_LUC: 2, SAP_HET_HAN: 1 })
  })

  it('bấm lại cùng cột thì đảo chiều, cột mới bắt đầu tăng dần', () => {
    expect(doiSapXep(null, 'phong')).toEqual({ cot: 'phong', chieu: 'ascending' })
    expect(doiSapXep({ cot: 'phong', chieu: 'ascending' }, 'phong')).toEqual({ cot: 'phong', chieu: 'descending' })
    expect(doiSapXep({ cot: 'phong', chieu: 'descending' }, 'gia')).toEqual({ cot: 'gia', chieu: 'ascending' })
  })
})
