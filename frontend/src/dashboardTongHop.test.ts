import { describe, expect, it } from 'vitest'
import type { ThongTinDongTieuThuBaoCao, ThongTinKhoanNoBaoCao } from './api'
import { chuoiDoanhThu, nhomNoQuaHanTheoNguoiThue, tieuThuTheoToaKyGanNhat } from './dashboardTongHop'

function no(nguoiThueId: number, conLai: string, soNgayQuaHan: number, extra: Partial<ThongTinKhoanNoBaoCao> = {}): ThongTinKhoanNoBaoCao {
  return {
    hoaDonId: Math.floor(Math.random() * 1e9), maHoaDon: 'HD', kyId: 1, hopDongId: 1, toaNhaId: 3, tenToaNha: 'An Nhiên Residence',
    soPhong: String(100 + nguoiThueId), nguoiThueId, hoTenNguoiThue: `Người ${nguoiThueId}`, ngayPhatHanh: '2026-07-25',
    hanThanhToan: '2026-08-05', tongTien: conLai, daThu: '0.00', conLai, soNgayQuaHan, ...extra,
  }
}

describe('nhomNoQuaHanTheoNguoiThue', () => {
  const ds = [
    no(1, '4419000.00', 78), no(1, '4419000.00', 139), no(1, '4419000.00', 108), // trễ lâu nhất không nằm ở dòng đầu
    no(2, '9000000.00', 20),
    no(3, '1000000.00', 0), // chưa quá hạn → bỏ
    no(4, '0.00', 50), // đã trả hết → bỏ
    no(5, '500000.00', 200),
  ]

  it('gộp theo người thuê: số hoá đơn, tổng còn lại, trễ lâu nhất', () => {
    const [dau] = nhomNoQuaHanTheoNguoiThue(ds)
    expect(dau).toMatchObject({ nguoiThueId: 1, soHoaDon: 3, conLai: 13257000, soNgayQuaHanLonNhat: 139 })
  })

  it('bỏ hoá đơn chưa quá hạn và hoá đơn đã hết nợ', () => {
    const ids = nhomNoQuaHanTheoNguoiThue(ds).map((n) => n.nguoiThueId)
    expect(ids).not.toContain(3)
    expect(ids).not.toContain(4)
  })

  it('xếp theo tiền hoặc theo số ngày trễ', () => {
    expect(nhomNoQuaHanTheoNguoiThue(ds, 'tien').map((n) => n.nguoiThueId)).toEqual([1, 2, 5])
    expect(nhomNoQuaHanTheoNguoiThue(ds, 'ngay').map((n) => n.nguoiThueId)).toEqual([5, 1, 2])
  })

  it('giới hạn số dòng', () => {
    expect(nhomNoQuaHanTheoNguoiThue(ds, 'tien', 2)).toHaveLength(2)
  })
})

function tt(toaNhaId: number, nam: number, thang: number, muc: string | null, laDien = true): ThongTinDongTieuThuBaoCao {
  return {
    kyId: nam * 100 + thang, nam, thang, nhanKy: `${String(thang).padStart(2, '0')}/${nam}`, tuNgay: '', denNgay: '', toaNhaId,
    maToa: `T${toaNhaId}`, tenToaNha: `Toà ${toaNhaId}`, phongId: toaNhaId * 100, soPhong: '101', tang: 1, hopDongId: 1, dichVuId: laDien ? 1 : 2,
    tenDichVu: laDien ? 'Điện' : 'Nước', donVi: laDien ? 'kWh' : 'm³', laDien, chiSoDau: null, chiSoCuoi: null, coThayCongTo: false,
    chiSoCuoiCongToCu: null, chiSoDauCongToMoi: null, mucTieuThu: muc, coDuLieu: muc !== null,
  }
}

describe('tieuThuTheoToaKyGanNhat', () => {
  it('lấy kỳ mới nhất có số, cộng theo toà, xếp giảm dần, bỏ nước khi xem điện', () => {
    const r = tieuThuTheoToaKyGanNhat([
      tt(1, 2026, 9, '900.00'), tt(1, 2026, 10, '600.00'), tt(1, 2026, 10, '406.00'),
      tt(2, 2026, 10, '1246.00'), tt(3, 2026, 11, null), tt(2, 2026, 10, '50.00', false),
    ])
    expect(r.nhanKy).toBe('10/2026')
    expect(r.donVi).toBe('kWh')
    expect(r.toa).toEqual([
      { toaNhaId: 2, tenToaNha: 'Toà 2', tong: 1246 },
      { toaNhaId: 1, tenToaNha: 'Toà 1', tong: 1006 },
    ])
  })

  it('kỳ sang năm mới vẫn là mới nhất (01/2027 > 12/2026)', () => {
    expect(tieuThuTheoToaKyGanNhat([tt(1, 2026, 12, '5'), tt(1, 2027, 1, '7')]).nhanKy).toBe('01/2027')
  })

  it('không có số liệu thì trả rỗng, không ném lỗi', () => {
    expect(tieuThuTheoToaKyGanNhat([tt(1, 2026, 10, null)])).toEqual({ nhanKy: null, donVi: null, toa: [] })
  })
})

describe('chuoiDoanhThu', () => {
  const t = (nhan: string, thucThu: number, doanhThuPhatHanh: number) => ({ nhan, thucThu, doanhThuPhatHanh })
  const thang = [t('09/2026', 0, 0), t('10/2026', 80, 100), t('11/2026', 0, 0)]

  it('tháng đang mở mà cả hai chuỗi bằng 0: để trống (null), không nét đứt, có ghi chú', () => {
    const r = chuoiDoanhThu(thang, '11/2026')
    expect(r.thucThu).toEqual([null, 80, null])
    expect(r.phatHanh).toEqual([null, 100, null])
    expect(r.kyCuoiDangMo).toBe(false)
    expect(r.thangChuaCoSo).toBe('11/2026')
  })

  it('tháng đang mở có số thì vẫn là kỳ cuối đang mở; tháng cuối đã chốt bằng 0 vẫn vẽ 0', () => {
    expect(chuoiDoanhThu([t('10/2026', 80, 100), t('11/2026', 5, 0)], '11/2026')).toMatchObject({ kyCuoiDangMo: true, thangChuaCoSo: null })
    expect(chuoiDoanhThu(thang, '12/2026')).toMatchObject({ thucThu: [null, 80, 0], kyCuoiDangMo: false, thangChuaCoSo: null })
  })

  it('không tháng nào có số: dauCoSo = -1', () => {
    expect(chuoiDoanhThu([t('11/2026', 0, 0)], '11/2026').dauCoSo).toBe(-1)
  })
})
