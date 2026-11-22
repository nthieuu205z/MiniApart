import { describe, expect, it } from 'vitest'
import { tinhBuoc } from './tinhBuocChuKy'

const mo = { trangThai: 'DANG_MO', ngayBatDau: '2026-10-26' }
const chot = { trangThai: 'DA_CHOT', ngayBatDau: '2026-10-26' }
const nhap = { trangThai: 'NHAP' }
const phatHanh = { trangThai: 'DA_PHAT_HANH', conLai: '100000' }
const daThu = { trangThai: 'DA_THANH_TOAN', conLai: '0' }

describe('tinhBuoc', () => {
  it.each([
    ['kỳ mở thiếu công tơ', { ky: mo, soCongToThieu: 2, tongCongTo: 9, hoaDon: [] }, 1, ['dang', 'chua', 'chua', 'chua'], '7/9 phòng · còn 2'],
    ['đủ công tơ chưa chốt', { ky: mo, soCongToThieu: 0, hoaDon: [] }, 2, ['xong', 'dang', 'chua', 'chua'], 'mở từ 26/10/2026'],
    ['đã chốt chưa tạo hoá đơn', { ky: chot, soCongToThieu: 0, hoaDon: [] }, 3, ['xong', 'xong', 'dang', 'chua'], '0 nháp · 0 đã phát hành'],
    ['có nháp', { ky: chot, soCongToThieu: 0, hoaDon: [nhap, nhap, phatHanh] }, 3, ['xong', 'xong', 'dang', 'chua'], '2 nháp · 1 đã phát hành'],
    ['đã phát hành hết', { ky: chot, soCongToThieu: 0, hoaDon: [phatHanh, daThu] }, 4, ['xong', 'xong', 'xong', 'dang'], '0 nháp · 2 đã phát hành'],
  ] as const)('%s', (_ten, vao, hienTai, trangThai, tomTat3) => {
    const r = tinhBuoc({ ...vao, hoaDon: [...vao.hoaDon] })
    expect(r.buocHienTai).toBe(hienTai)
    expect(r.buoc.map((b) => b.trangThai)).toEqual(trangThai)
    expect(r.buoc.map((b) => b.tomTat)).toContain(tomTat3)
  })
  it('bước 4 đếm hoá đơn còn nợ', () => {
    expect(tinhBuoc({ ky: chot, soCongToThieu: 0, hoaDon: [phatHanh, daThu] }).buoc[3].tomTat).toBe('còn 1 hoá đơn chưa thu đủ')
  })
  it('kỳ không tồn tại → rỗng', () => {
    expect(tinhBuoc({ ky: null, soCongToThieu: 0, hoaDon: [] })).toEqual({ buocHienTai: 1, buoc: [] })
  })
})
