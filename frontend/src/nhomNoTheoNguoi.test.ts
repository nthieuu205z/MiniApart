import { describe, expect, it } from 'vitest'
import type { ThongTinHoaDonQuanLy, ThongTinKhoanNoBaoCao } from './api'
import { demBoLoc, hangTong, locNo, nhomNo, soNgayTre, tuCongNo, tuHoaDonQuanLy } from './nhomNoTheoNguoi'

const cn = (o: Partial<ThongTinKhoanNoBaoCao>): ThongTinKhoanNoBaoCao => ({
  hoaDonId: 1, maHoaDon: 'HD-1', kyId: 1, hopDongId: 1, toaNhaId: 3, tenToaNha: 'An Nhiên Residence', soPhong: '101',
  nguoiThueId: 1, hoTenNguoiThue: 'Trần Quang Huy', ngayPhatHanh: '2026-07-25', hanThanhToan: '2026-07-05',
  tongTien: '3790000.00', daThu: '1895000.00', conLai: '1895000.00', soNgayQuaHan: 140, ...o,
})

const congNo = [
  cn({ hoaDonId: 1, maHoaDon: 'DEMO-1-07', hanThanhToan: '2026-07-05', soNgayQuaHan: 140 }),
  cn({ hoaDonId: 2, maHoaDon: 'DEMO-1-10', hanThanhToan: '2026-10-05', soNgayQuaHan: 48 }),
  cn({ hoaDonId: 3, maHoaDon: 'DEMO-52-07', nguoiThueId: 52, hoTenNguoiThue: 'Nguyễn Quang Huy', toaNhaId: 1, tenToaNha: 'Bình Minh Riverside', soPhong: '201', hopDongId: 52, tongTien: '4419000', daThu: '0', conLai: '4419000', soNgayQuaHan: 140 }),
  cn({ hoaDonId: 4, maHoaDon: 'DEMO-52-08', nguoiThueId: 52, hoTenNguoiThue: 'Nguyễn Quang Huy', toaNhaId: 1, tenToaNha: 'Bình Minh Riverside', soPhong: '201', hopDongId: 52, tongTien: '4419000', daThu: '0', conLai: '4419000', soNgayQuaHan: 109, hanThanhToan: '2026-08-05' }),
  cn({ hoaDonId: 5, maHoaDon: 'DEMO-9-10', nguoiThueId: 9, hoTenNguoiThue: 'Lê An', soPhong: '102', hopDongId: 9, tongTien: '2000000', daThu: '0', conLai: '2000000', soNgayQuaHan: 12, hanThanhToan: '2026-11-10' }),
  cn({ hoaDonId: 6, maHoaDon: 'QT-0', nguoiThueId: 9, hoTenNguoiThue: 'Lê An', soPhong: '102', conLai: '0', daThu: '500000', soNgayQuaHan: 0 }), // đã thu đủ → không vào Cần thu
]

describe('nhomNo — Chủ (nguồn công nợ)', () => {
  const ds = nhomNo(tuCongNo(congNo))
  it('một người một nhóm, nợ nhiều nhất lên đầu, kỳ trong nhóm theo hạn', () => {
    expect(ds.map((g) => g.hoTen)).toEqual(['Nguyễn Quang Huy', 'Trần Quang Huy', 'Lê An'])
    expect(ds[1].hoaDon.map((h) => h.maHoaDon)).toEqual(['DEMO-1-07', 'DEMO-1-10'])
  })
  it('cộng đúng còn nợ, đã thu, trễ lâu nhất, cờ trả một phần', () => {
    expect(ds[0]).toMatchObject({ conLai: 8838000, daThu: 0, treLauNhat: 140, coTraMotPhan: false, nguoiThueId: 52 })
    expect(ds[1]).toMatchObject({ conLai: 3790000, daThu: 3790000, treLauNhat: 140, coTraMotPhan: true })
  })
  it('hoá đơn conLai = 0 không vào Cần thu', () => {
    expect(ds[2].hoaDon).toHaveLength(1)
  })
  it('chip đếm + lọc + tìm không dấu theo tên, phòng, mã hoá đơn', () => {
    expect(demBoLoc(ds)).toEqual({ 'tat-ca': 3, 'tre-30': 2, 'mot-phan': 1 })
    expect(locNo(ds, 'tre-30').map((g) => g.hoTen)).toEqual(['Nguyễn Quang Huy', 'Trần Quang Huy'])
    expect(locNo(ds, 'mot-phan').map((g) => g.hoTen)).toEqual(['Trần Quang Huy'])
    expect(locNo(ds, 'tat-ca', 'quang huy')).toHaveLength(2)
    expect(locNo(ds, 'tat-ca', 'phong 102').map((g) => g.hoTen)).toEqual(['Lê An'])
    expect(locNo(ds, 'tat-ca', 'demo-52-08').map((g) => g.hoTen)).toEqual(['Nguyễn Quang Huy'])
  })
  it('hàng tổng trên danh sách đang hiện', () => {
    expect(hangTong(ds)).toEqual({ soNhom: 3, soKy: 5, daThu: 3790000, conLai: 14628000 })
    expect(hangTong(locNo(ds, 'tre-30'))).toEqual({ soNhom: 2, soKy: 4, daThu: 3790000, conLai: 12628000 })
  })
  it('nợ nhiều xếp trước kể cả khi trễ ít hơn; kỳ trong nhóm theo hạn dù dữ liệu vào lộn xộn', () => {
    const lon = nhomNo(tuCongNo([
      cn({ hoaDonId: 7, nguoiThueId: 70, hoTenNguoiThue: 'An Trễ Lâu', conLai: '100000', daThu: '0', soNgayQuaHan: 200 }),
      cn({ hoaDonId: 8, nguoiThueId: 80, hoTenNguoiThue: 'Bình Nợ Nhiều', conLai: '9000000', daThu: '0', soNgayQuaHan: 5, hanThanhToan: '2026-11-17' }),
      cn({ hoaDonId: 9, nguoiThueId: 80, hoTenNguoiThue: 'Bình Nợ Nhiều', conLai: '1000', daThu: '0', soNgayQuaHan: 20, hanThanhToan: '2026-11-02' }),
    ]))
    expect(lon.map((g) => g.hoTen)).toEqual(['Bình Nợ Nhiều', 'An Trễ Lâu'])
    expect(lon[0].hoaDon.map((h) => h.hoaDonId)).toEqual([9, 8])
  })
  it('nhóm theo phòng gộp theo toà + số phòng', () => {
    const p = nhomNo(tuCongNo(congNo), 'phong')
    expect(p.map((g) => `${g.tenToaNha}/${g.soPhong}`)).toEqual(['Bình Minh Riverside/201', 'An Nhiên Residence/101', 'An Nhiên Residence/102'])
  })
})

describe('nhomNo — Quản lý (nguồn hoá đơn của toà, không có hopDongId)', () => {
  const hd = (o: Partial<ThongTinHoaDonQuanLy> & { ngayPhatHanh?: string }) => ({ hoaDonId: 1, maHoaDon: 'HD', kyId: 1, soPhong: '101', nguoiThue: 'Trần Quang Huy', hanThanhToan: '2026-07-05', trangThai: 'QUA_HAN', tongTien: '3790000.00', daThu: '1895000.00', conLai: '1895000.00', ...o }) as ThongTinHoaDonQuanLy
  const rows = [
    hd({ hoaDonId: 1 }),
    hd({ hoaDonId: 2, hanThanhToan: '2026-10-05', ngayPhatHanh: '2026-10-25' }),
    hd({ hoaDonId: 3, trangThai: 'DA_THANH_TOAN', daThu: '3790000', conLai: '0' }),
    hd({ hoaDonId: 4, trangThai: 'NHAP', conLai: '3790000', daThu: '0' }),
    hd({ hoaDonId: 5, soPhong: '202', nguoiThue: 'Người Lạ', conLai: '100000', daThu: '0', hanThanhToan: '2026-11-30' }),
    hd({ hoaDonId: 6, soPhong: '203', nguoiThue: 'Người Khác', conLai: '50000', daThu: '0', hanThanhToan: '2026-11-30' }),
  ]
  const dong = tuHoaDonQuanLy(rows, { id: 3, ten: 'An Nhiên Residence' }, '2026-11-22', [{ id: 1, soPhong: '101', hoTenNguoiThue: 'Trần Quang Huy', nguoiThueId: 1 }])
  it('bỏ hoá đơn đã thu đủ và bản nháp; ghép người qua phòng + họ tên', () => {
    expect(dong.map((d) => d.hoaDonId)).toEqual([1, 2, 5, 6])
    expect(dong[0]).toMatchObject({ nguoiThueId: 1, hopDongId: 1, tenToaNha: 'An Nhiên Residence', soNgayQuaHan: 140 })
    expect(dong[1].ngayPhatHanh).toBe('2026-10-25')
  })
  it('không ghép được hợp đồng → vẫn có nhóm riêng (không gộp nhầm), nguoiThueId null', () => {
    const ds = nhomNo(dong)
    expect(ds).toHaveLength(3)
    expect(ds.find((g) => g.hoTen === 'Người Lạ')).toMatchObject({ nguoiThueId: null, treLauNhat: 0 })
  })
  it('soNgayTre: chưa tới hạn = 0, qua hạn đếm theo ngày lịch', () => {
    expect(soNgayTre('2026-11-30', '2026-11-22')).toBe(0)
    expect(soNgayTre('2026-11-12', '2026-11-22')).toBe(10)
    expect(soNgayTre('lung tung', '2026-11-22')).toBe(0)
  })
})
