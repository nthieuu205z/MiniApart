// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HoaDon, { dinhDangTien } from './HoaDon'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

let container: HTMLDivElement
let root: Root

describe('HoaDon detail and print view', () => {
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(async () => {
    await act(async () => root?.unmount())
    container.remove()
    vi.restoreAllMocks()
  })

  it('FR-INV-02 shows hand-recomputable lines, every tariff tier, resident conversion, negative rounding and signed meter image', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      hoaDonId: 10,
      maHoaDon: 'TN-A-101-202608',
      kyId: 8,
      hopDongId: 11,
      soPhong: '101',
      nguoiThue: 'Người thuê 101',
      ngayPhatHanh: '2026-08-31',
      hanThanhToan: '2026-09-07',
      trangThai: 'DA_PHAT_HANH',
      tongTien: '3889500.00',
      daThu: '0.00',
      conLai: '3889500.00',
      soNguoiO: 5,
      soHoQuyDoi: 2,
      giaiThichSoHo: '1 ho quy doi cho moi 4 nguoi o',
      cacDong: [
        {
          tenKhoan: 'Tien dien',
          chiSoDau: '1240.00',
          chiSoCuoi: '1350.00',
          soLuong: '110.00',
          thanhTien: '390000.00',
          loaiKhoan: 'DICH_VU',
          dienGiai: '(1350.00 - 1240.00) = 110.00; xem chi tiet tung bac',
          anhCongToUrl: '/api/anh/77/xem?hetHan=1788159775&chuKy=signed',
          cacBac: [
            { bac: 1, tuSoLuong: '0.00', denSoLuong: '50.00', dinhMucQuyDoi: '100.00', soLuong: '100.00', donGia: '3500.00', thanhTien: '350000.00', dienGiai: 'Bac 1' },
            { bac: 2, tuSoLuong: '51.00', denSoLuong: '100.00', dinhMucQuyDoi: '100.00', soLuong: '10.00', donGia: '4000.00', thanhTien: '40000.00', dienGiai: 'Bac 2' },
          ],
        },
        { tenKhoan: 'Lam tron', thanhTien: '-500.00', loaiKhoan: 'LAM_TRON', dienGiai: 'Lam tron = -500.00', cacBac: [] },
      ],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))

    root = createRoot(container)
    await act(async () => {
      root.render(<HoaDon token="invoice-token" toaNhaId={1} kyId={8} hoaDonId={10} />)
    })

    await vi.waitFor(() => expect(container.textContent).toContain('TN-A-101-202608'))
    expect(container.textContent).toContain('1240.00')
    expect(container.textContent).toContain('1350.00')
    expect(container.textContent).toContain('Định mức sau quy đổi: 100.00')
    expect(container.textContent).toContain('3.889.500')
    expect(container.textContent).toContain('-500')
    expect(container.textContent).toContain('5 người')
    expect(container.textContent).toContain('2 hộ quy đổi')
    expect(container.querySelector('img[src="/api/anh/77/xem?hetHan=1788159775&chuKy=signed"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="invoice-detail"]')?.className).toContain('invoice-printable')
  })

  it('FR-INV-02 prints the readable A4 representation without starting PDF export', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      hoaDonId: 10,
      maHoaDon: 'TN-A-101-202608',
      kyId: 8,
      hopDongId: 11,
      soPhong: '101',
      nguoiThue: 'Người thuê 101',
      ngayPhatHanh: '2026-08-31',
      hanThanhToan: '2026-09-07',
      trangThai: 'DA_PHAT_HANH',
      tongTien: '1000.00',
      daThu: '0.00',
      conLai: '1000.00',
      cacDong: [],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))
    const print = vi.fn()
    vi.stubGlobal('print', print)

    root = createRoot(container)
    await act(async () => root.render(<HoaDon token="invoice-token" toaNhaId={1} kyId={8} hoaDonId={10} />))
    const button = await vi.waitFor(() => container.querySelector('[data-print-invoice]') as HTMLButtonElement)
    await act(async () => button.click())

    expect(print).toHaveBeenCalledOnce()
  })

  it('FR-INV-02 formats large and negative NUMERIC money strings without floating-point conversion', () => {
    expect(dinhDangTien('99999999999999.99')).toBe('99.999.999.999.999,99')
    expect(dinhDangTien('-12345678901234.56')).toBe('-12.345.678.901.234,56')
    expect(dinhDangTien('3714500.00')).toBe('3.714.500')
  })
})
