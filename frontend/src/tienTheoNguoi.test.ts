import { describe, expect, it } from 'vitest'
import { chuanSdt, dinhDangSdt, docSoTien, ghiThuLanLuot, linkZalo, nhanThang, phanBoThu, tinNhacNo } from './tienTheoNguoi'

const hd = (hoaDonId: number, hanThanhToan: string, conLai: number) => ({ hoaDonId, hanThanhToan, conLai })
// Người nợ 4 tháng (dữ liệu demo kiểu khách phòng 101): trả lộn thứ tự để chắc hàm tự sắp.
const BON_THANG = [hd(4, '2026-10-05', 1_895_000), hd(1, '2026-07-05', 1_895_000), hd(3, '2026-09-05', 1_895_000), hd(2, '2026-08-05', 1_895_000)]

describe('nhanThang', () => {
  it('theo ngày gửi, thiếu thì theo hạn trả; bỏ số 0 đầu', () => {
    // Hoá đơn tháng 7 gửi 25/07, hạn 05/08: nhãn phải là tháng gửi, không phải tháng của hạn.
    expect(nhanThang({ ngayPhatHanh: '2026-07-25', hanThanhToan: '2026-08-05' })).toBe('7/2026')
    expect(nhanThang({ ngayPhatHanh: null, hanThanhToan: '2026-11-05' })).toBe('11/2026')
  })
})

describe('docSoTien', () => {
  it('nhận dấu chấm, khoảng trắng, ký hiệu ₫', () => {
    expect(docSoTien('7.580.000')).toBe(7_580_000)
    expect(docSoTien('7 580 000 ₫')).toBe(7_580_000)
  })
  it('từ chối 0, âm, thập phân, chữ', () => {
    for (const s of ['0', '-5', '1,5', 'abc', '', '007']) expect(docSoTien(s)).toBeNull()
  })
})

describe('phanBoThu', () => {
  it('thu đủ: một lần cho cả 4 tháng, tháng cũ trước', () => {
    const { phanBo, loi } = phanBoThu(BON_THANG, 7_580_000)
    expect(loi).toBeNull()
    expect(phanBo.map((p) => p.hoaDonId)).toEqual([1, 2, 3, 4])
    expect(phanBo.every((p) => p.soTien === 1_895_000)).toBe(true)
  })
  it('thu thiếu: trừ dần từ tháng cũ, tháng cuối nhận phần lẻ, tháng sau không có dòng', () => {
    expect(phanBoThu(BON_THANG, 2_000_000).phanBo).toEqual([{ hoaDonId: 1, soTien: 1_895_000 }, { hoaDonId: 2, soTien: 105_000 }])
  })
  it('thu dư thì báo lỗi, không chia gì', () => {
    const r = phanBoThu(BON_THANG, 9_000_000)
    expect(r.phanBo).toEqual([])
    expect(r.loi).toBe('Lớn hơn số còn nợ (7.580.000 ₫). Thu dư thì ghi vào tháng sau.')
  })
  it('số ≤ 0 hoặc không nguyên thì báo lỗi', () => {
    expect(phanBoThu(BON_THANG, 0).loi).not.toBeNull()
    expect(phanBoThu(BON_THANG, 10.5).loi).not.toBeNull()
  })
  it('bỏ hoá đơn đã trả đủ; cùng hạn thì hoá đơn id nhỏ trước', () => {
    const r = phanBoThu([hd(9, '2026-08-05', 100), hd(7, '2026-08-05', 100), hd(5, '2026-07-05', 0)], 150)
    expect(r.phanBo).toEqual([{ hoaDonId: 7, soTien: 100 }, { hoaDonId: 9, soTien: 50 }])
  })
})

describe('ghiThuLanLuot', () => {
  it('ghi theo đúng thứ tự, một lần mỗi phần', async () => {
    const goi: number[] = []
    const r = await ghiThuLanLuot([{ hoaDonId: 1, soTien: 1 }, { hoaDonId: 2, soTien: 2 }], async (p) => { goi.push(p.hoaDonId) })
    expect(goi).toEqual([1, 2])
    expect(r).toEqual({ daGhi: [{ hoaDonId: 1, soTien: 1 }, { hoaDonId: 2, soTien: 2 }], loi: null })
  })
  it('dừng ở lỗi đầu tiên, không gọi phần sau, giữ danh sách đã ghi', async () => {
    const goi: number[] = []
    const r = await ghiThuLanLuot([{ hoaDonId: 1, soTien: 1 }, { hoaDonId: 2, soTien: 2 }, { hoaDonId: 3, soTien: 3 }], async (p) => {
      goi.push(p.hoaDonId)
      if (p.hoaDonId === 2) throw new Error('Hoá đơn đã khoá')
    })
    expect(goi).toEqual([1, 2])
    expect(r.daGhi).toEqual([{ hoaDonId: 1, soTien: 1 }])
    expect(r.loi).toEqual({ hoaDonId: 2, thongBao: 'Hoá đơn đã khoá' })
  })
})

describe('số điện thoại và Zalo', () => {
  it('chuẩn hoá, định dạng 4-3-3, link Zalo', () => {
    expect(chuanSdt('0999 100 001')).toBe('0999100001')
    expect(chuanSdt('+84 999 100 001')).toBe('0999100001')
    expect(dinhDangSdt('0999100001')).toBe('0999 100 001')
    expect(linkZalo('0999100001')).toBe('https://zalo.me/0999100001')
  })
  it('số sai dạng → null, không tạo link chết', () => {
    for (const s of ['', null, undefined, '12345', '1999100001']) expect(linkZalo(s)).toBeNull()
  })
})

describe('tinNhacNo', () => {
  const n = { hoTen: 'Nguyễn Văn Quang Huy', soPhong: '101', tenToaNha: 'An Nhiên Residence', conLai: 7_580_000, hoaDon: [] as { hanThanhToan: string; ngayPhatHanh?: string | null }[] }
  it('nhiều tháng cùng năm: gọi tên cuối, khoảng tháng gọn, tiền có dấu chấm', () => {
    const t = tinNhacNo({ ...n, hoaDon: [{ hanThanhToan: '2026-07-05' }, { hanThanhToan: '2026-10-05' }] }, '30/11/2026')
    expect(t).toBe('Chào anh/chị Huy, phòng 101 An Nhiên Residence còn nợ 7.580.000 ₫ tiền nhà tháng 7–10/2026. Anh/chị vui lòng thanh toán trước ngày 30/11/2026. Cảm ơn anh/chị.')
  })
  it('một tháng; và khác năm giữ đủ năm đầu', () => {
    expect(tinNhacNo({ ...n, hoaDon: [{ hanThanhToan: '2026-07-05' }] }, '30/11/2026')).toContain('tiền nhà tháng 7/2026.')
    expect(tinNhacNo({ ...n, hoaDon: [{ hanThanhToan: '2025-12-05' }, { hanThanhToan: '2026-01-05' }] }, '30/11/2026')).toContain('tháng 12/2025–1/2026.')
  })
})
