// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CanTra from './CanTra'
import type { ThongTinHoaDonChiTiet, ThongTinHoaDonLichSu } from './api'

declare global { var IS_REACT_ACT_ENVIRONMENT: boolean | undefined }

const kyLs = (id: number, thang: number, conLai: string): ThongTinHoaDonLichSu => ({
  hoaDonId: id, maHoaDon: `DEMO-${thang}`, toaNhaId: 3, kyId: id, hopDongId: 1, nam: 2026, thang, ngayBatDau: null, ngayKetThuc: null,
  soPhong: '101', maToa: 'AN', tenToaNha: 'An Nhiên Residence', ngayPhatHanh: `2026-${thang}-25`, hanThanhToan: `2026-${String(thang).padStart(2, '0')}-05`,
  trangThai: 'QUA_HAN', trangThaiThanhToan: Number(conLai) > 0 ? 'QUA_HAN' : 'DA_THANH_TOAN', hopDongTrangThai: 'HIEU_LUC', tongTien: '3790000.00', daThu: '1895000.00', conLai,
})
const hoaDon = { hoaDonId: 10, maHoaDon: 'DEMO-10', soPhong: '101', nguoiThue: 'Huy', ngayPhatHanh: '2026-10-25', hanThanhToan: '2026-10-05', tongTien: '3790000.00', daThu: '1895000.00', conLai: '1895000.00', cacDong: [{ tenKhoan: 'Tiền phòng', soLuong: '29.00', donGia: '3200000.00', thanhTien: '3200000.00', loaiKhoan: 'DICH_VU', dienGiai: '', cacBac: [] }] } as unknown as ThongTinHoaDonChiTiet
const bonKy = [kyLs(31, 10, '1895000.00'), kyLs(21, 9, '1895000.00'), kyLs(11, 8, '1895000.00'), kyLs(1, 7, '1895000.00')]

let container: HTMLDivElement
let root: Root
const ve = async (lichSu: ThongTinHoaDonLichSu[], tra: string | null, mobile = false) => {
  root = createRoot(container)
  await act(async () => root.render(<CanTra mobile={mobile} hoaDon={hoaDon} lichSu={lichSu} tra={tra} />))
}

describe('CanTra (khách thuê)', () => {
  beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.appendChild(container) })
  afterEach(async () => { await act(async () => root?.unmount()); container.remove(); vi.restoreAllMocks() })

  it('tổng = Σ conLai bốn tháng (7.580.000), 4 tháng chưa trả đủ, nút chính đúng nhãn và href', async () => {
    await ve(bonKy, null)
    expect(container.querySelector('[data-can-tra-tong]')?.textContent).toBe('7.580.000 ₫')
    expect(container.textContent).toContain('4 tháng chưa trả đủ. Tháng cũ nhất quá hạn từ 05/07/2026.')
    const chinh = container.querySelector('[data-tra-tat-ca]')!
    expect(chinh.textContent).toBe('Trả 7.580.000 ₫')
    expect(chinh.getAttribute('href')).toBe('/hoa-don-cua-toi?tra=tat-ca')
    expect(container.querySelector('[data-tra-mot-ky]')?.getAttribute('href')).toBe('/hoa-don-cua-toi?tra=1')
    expect(container.querySelector('[data-tra-mot-ky]')?.textContent).toBe('Chỉ trả tháng 7 trước · 1.895.000 ₫')
    expect(container.querySelectorAll('[data-ky-hoa-don]')).toHaveLength(4)
    expect(container.querySelector('[data-ky-hoa-don="9"], [data-ky-hoa-don="21"]')?.getAttribute('href')).toBe('/hoa-don-cua-toi?hoaDonId=21')
  })

  it('máy tính: một h1, hiện cả nợ cũ, một nút chính, không chuỗi IN_HOA_GẠCH_DƯỚI; điện thoại: h1 do thanh trên của khung', async () => {
    await ve(bonKy, null)
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(container.querySelector('.can-tra-rong')).not.toBeNull()
    expect(container.querySelectorAll('[data-ky-hoa-don]')).toHaveLength(4)
    expect(container.querySelectorAll('.btn-primary')).toHaveLength(1)
    expect(container.textContent).not.toMatch(/[A-Z]{2,}(_[A-Z0-9]+)+/)
    await act(async () => root.unmount())
    await ve(bonKy, null, true)
    expect(container.querySelectorAll('h1')).toHaveLength(0)
    expect(container.querySelector('.can-tra-rong')).toBeNull()
  })

  it('không nợ → không có nút Trả', async () => {
    await ve(bonKy.map((h) => ({ ...h, conLai: '0.00', trangThaiThanhToan: 'DA_THANH_TOAN' })), null)
    expect(container.textContent).toContain('Bạn đã trả đủ mọi hoá đơn.')
    expect(container.querySelector('[data-tra-tat-ca]')).toBeNull()
    expect(container.querySelectorAll('.btn-primary')).toHaveLength(0)
    expect(container.querySelector('[data-xem-lich-su]')?.getAttribute('href')).toBe('/lich-su')
  })

  const TT = { toaNhaId: 3, tenToaNha: 'An Nhiên Residence', maNganHang: '970405', tenNganHang: null, soTaiKhoan: '000000000101', chuTaiKhoan: null, noiDungMau: 'Phong 101 AN' }
  const gia = (kq: Record<string, unknown>) => vi.fn(async (url: string, init?: RequestInit) => {
    const key = `${init?.method ?? 'GET'} ${url}`
    const r = kq[key]
    if (r === undefined) return new Response('{}', { status: 404 })
    return new Response(JSON.stringify(r), { status: 200, headers: { 'Content-Type': 'application/json' } })
  })
  const veTra = async (tra: string, f: ReturnType<typeof gia>, ls = bonKy) => {
    vi.stubGlobal('fetch', f)
    root = createRoot(container)
    await act(async () => root.render(<CanTra token="t" hoaDon={hoaDon} lichSu={ls} tra={tra} />))
    await act(async () => { await new Promise((r) => setTimeout(r, 30)) })
  }

  it('trả tất cả: số tài khoản thật từ backend + QR + nội dung chép được + nút chính "Tôi đã chuyển khoản", không còn nhãn "cần backend"', async () => {
    const ghi = vi.fn(async () => undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText: ghi } })
    await veTra('tat-ca', gia({ 'GET /api/cong/thanh-toan': TT }))
    expect(container.querySelector('[data-tra-so-tien]')?.textContent).toBe('7.580.000 ₫')
    expect(container.querySelector('[data-noi-dung-ck]')?.textContent).toBe('DEMO-10 DEMO-9 DEMO-8 DEMO-7')
    expect(container.textContent).toContain('4 tháng, từ 7/2026 đến 10/2026')
    expect(container.querySelector('[data-so-tai-khoan]')?.textContent).toBe('000000000101')
    expect(container.textContent).toContain('Ngân hàng (mã 970405)')
    expect(container.querySelector('img[data-qr]')?.getAttribute('src')).toMatch(/^data:image\/svg\+xml/)
    expect(container.querySelector('.ma-nhanmh')).toBeNull()
    expect(container.querySelectorAll('.btn-primary')).toHaveLength(1)
    expect(container.querySelector('[data-toi-da-chuyen]')?.textContent).toBe('Tôi đã chuyển khoản')
    await act(async () => (container.querySelector('[data-chep-noi-dung]') as HTMLButtonElement).click())
    expect(ghi).toHaveBeenCalledWith('DEMO-10 DEMO-9 DEMO-8 DEMO-7')
    expect(container.querySelector('[data-da-chep]')?.textContent).toContain('Đã chép')
    await act(async () => (container.querySelector('[data-chep-so-tai-khoan]') as HTMLButtonElement).click())
    expect(ghi).toHaveBeenCalledWith('000000000101')
  })

  it('"Tôi đã chuyển khoản": POST từng hoá đơn rồi hiện "Đã báo chuyển, chờ quản lý xác nhận"; hoá đơn đã báo từ trước thì không POST lại', async () => {
    const f = gia({ 'GET /api/cong/thanh-toan': TT, 'POST /api/cong/hoa-don/31/bao-da-chuyen': { hoaDonId: 31, baoLuc: 'x', daBaoTruoc: false }, 'POST /api/cong/hoa-don/21/bao-da-chuyen': { hoaDonId: 21, baoLuc: 'x', daBaoTruoc: false } })
    await veTra('tat-ca', f, [bonKy[0], bonKy[1], { ...bonKy[2], baoDaChuyenLuc: '2026-10-26T01:00:00Z' }, { ...bonKy[3], baoDaChuyenLuc: '2026-10-26T01:00:00Z' }])
    await act(async () => (container.querySelector('[data-toi-da-chuyen]') as HTMLButtonElement).click())
    await act(async () => { await new Promise((r) => setTimeout(r, 10)) })
    expect(f.mock.calls.filter(([, i]) => i?.method === 'POST').map(([u]) => u)).toEqual(['/api/cong/hoa-don/31/bao-da-chuyen', '/api/cong/hoa-don/21/bao-da-chuyen'])
    expect(container.querySelector('[data-da-bao]')?.textContent).toBe('Đã báo chuyển, chờ quản lý xác nhận.')
    expect(container.querySelector('[data-toi-da-chuyen]')).toBeNull()
  })

  it('đã báo hết từ trước → mở lên là thấy trạng thái chờ xác nhận; không lấy được tài khoản → nói thật, không số giả', async () => {
    await veTra('31', gia({}), [{ ...bonKy[0], baoDaChuyenLuc: '2026-10-26T01:00:00Z' }])
    expect(container.querySelector('[data-da-bao]')).not.toBeNull()
    expect(container.querySelector('[data-tra-khong-co-tk]')?.textContent).toContain('Hỏi quản lý')
    expect(container.querySelector('[data-so-tai-khoan], img')).toBeNull()
  })

  it('trả một kỳ: số tiền và nội dung chỉ của kỳ đó', async () => {
    await ve(bonKy, '31')
    expect(container.textContent).toContain('Tháng 10/2026')
    expect(container.querySelector('[data-noi-dung-ck]')?.textContent).toBe('DEMO-10')
    expect(container.textContent).not.toMatch(/\b[Kk]ỳ\b/)
  })
})
