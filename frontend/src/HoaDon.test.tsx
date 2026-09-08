// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HoaDon from './HoaDon'
import { dinhDangTien } from './design/core/format'

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
    vi.useRealTimers()
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
    expect([...document.querySelectorAll('style')].some((style) => style.textContent?.includes('@page') && style.textContent.includes('A4'))).toBe(true)
  })

  it('FR-INV-02 formats large and negative NUMERIC money strings without floating-point conversion', () => {
    expect(dinhDangTien('99999999999999.99')).toBe('99.999.999.999.999,99')
    expect(dinhDangTien('-12345678901234.56')).toBe('-12.345.678.901.234,56')
    expect(dinhDangTien('3714500.00')).toBe('3.714.500')
  })

  it('NFR-USA-01 renders invoice lines as mobile cards instead of the desktop table', async () => {
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
      cacDong: [{ tenKhoan: 'Tiền điện', thanhTien: '1000.00', loaiKhoan: 'DICH_VU', dienGiai: '10 × 100 = 1000', cacBac: [] }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))

    root = createRoot(container)
    await act(async () => root.render(<HoaDon token="invoice-token" toaNhaId={1} kyId={8} hoaDonId={10} mobile />))

    await vi.waitFor(() => expect(container.querySelector('[data-testid="invoice-detail"]')).not.toBeNull())
    expect(container.querySelector('[data-layout-variant="mobile"]')).not.toBeNull()
    expect(container.querySelector('[data-mobile-invoice-lines]')).not.toBeNull()
    expect(container.querySelector('table')).toBeNull()
  })

  it('FR-POR-02 renders labeled readings, consumption, unit price and amount for every invoice line', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      coHoaDon: true,
      hoaDon: {
        hoaDonId: 10,
        maHoaDon: 'PORTAL-A-101-202608',
        kyId: 8,
        hopDongId: 11,
        soPhong: '101',
        nguoiThue: 'Người thuê 101',
        ngayPhatHanh: '2026-08-31',
        hanThanhToan: '2026-09-07',
        trangThai: 'DA_PHAT_HANH',
        tongTien: '3890000.00',
        daThu: '0.00',
        conLai: '3890000.00',
        cacDong: [
          {
            tenKhoan: 'Tiền điện',
            chiSoDau: '1240.00',
            chiSoCuoi: '1350.00',
            soLuong: '110.00',
            thanhTien: '390000.00',
            loaiKhoan: 'DICH_VU',
            dienGiai: '(1350.00 - 1240.00) = 110.00; xem chi tiết từng bậc',
            cacBac: [{
              bac: 1,
              tuSoLuong: '0.00',
              denSoLuong: '50.00',
              dinhMucQuyDoi: '100.00',
              soLuong: '100.00',
              donGia: '3500.00',
              thanhTien: '350000.00',
              dienGiai: 'Bậc 1',
            }],
          },
          {
            tenKhoan: 'Tiền phòng',
            soLuong: '31.00',
            donGia: '3500000.00',
            thanhTien: '3500000.00',
            loaiKhoan: 'TIEN_PHONG',
            dienGiai: '31.00 × 3500000.00 = 3500000.00',
            cacBac: [],
          },
        ],
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))

    root = createRoot(container)
    await act(async () => root.render(<HoaDon token="tenant-token" cheDoNguoiThue />))

    const invoice = await vi.waitFor(() => {
      const element = container.querySelector('[data-testid="invoice-detail"]')
      expect(element).not.toBeNull()
      return element as HTMLElement
    })
    expect(invoice?.textContent).toContain('Chỉ số đầu:')
    expect(invoice?.textContent).toContain('FR-POR-02')
    expect(invoice?.textContent).toContain('1240.00')
    expect(invoice?.textContent).toContain('Chỉ số cuối:')
    expect(invoice?.textContent).toContain('1350.00')
    expect(invoice?.textContent).toContain('Mức tiêu thụ:')
    expect(invoice?.textContent).toContain('110.00')
    expect(invoice?.textContent).toContain('Đơn giá:')
    expect(invoice?.textContent).toContain('Theo bậc thang')
    expect(invoice?.textContent).toContain('3.500.000 ₫')
    expect(invoice?.textContent).toContain('Thành tiền:')
    expect(invoice?.textContent).toContain('390.000 ₫')
    expect(invoice?.textContent).toContain('3.500.000 ₫')
    expect(invoice?.textContent).toContain('Bậc 1')
  })

  it('FR-POR-03 opens a selected tenant history invoice through the tenant-scoped detail endpoint', async () => {
    const response = {
      hoaDonId: 10,
      maHoaDon: 'PORTAL-A-101-202608',
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
    }
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))
    vi.stubGlobal('fetch', fetchMock)

    root = createRoot(container)
    await act(async () => root.render(<HoaDon token="tenant-token" hoaDonId={10} cheDoNguoiThue />))

    await vi.waitFor(() => expect(container.textContent).toContain('PORTAL-A-101-202608'))
    expect(fetchMock).toHaveBeenCalledWith('/api/cong/hoa-don/10', {
      headers: { Authorization: 'Bearer tenant-token' },
    })
  })

  it('FR-POR-02_BR-15 keeps negative rounding visible and explains the half-up rule', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      coHoaDon: true,
      hoaDon: {
        hoaDonId: 10,
        maHoaDon: 'PORTAL-A-101-202608',
        kyId: 8,
        hopDongId: 11,
        soPhong: '101',
        nguoiThue: 'Người thuê 101',
        ngayPhatHanh: '2026-08-31',
        hanThanhToan: '2026-09-07',
        trangThai: 'DA_PHAT_HANH',
        tongTien: '1887000.00',
        daThu: '0.00',
        conLai: '1887000.00',
        cacDong: [{
          tenKhoan: 'Làm tròn',
          thanhTien: '-200.00',
          loaiKhoan: 'LAM_TRON',
          dienGiai: 'Làm tròn = -200.00',
          cacBac: [],
        }],
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))

    root = createRoot(container)
    await act(async () => root.render(<HoaDon token="tenant-token" cheDoNguoiThue />))

    const rounding = await vi.waitFor(() => {
      const element = container.querySelector('[data-invoice-rounding]')
      expect(element).not.toBeNull()
      return element as HTMLElement
    })
    expect(rounding?.textContent).toContain('-200')
    expect(rounding?.textContent).toContain('làm tròn nửa lên đến 1.000 đồng')
    expect(rounding?.textContent).toContain('Số âm là phần điều chỉnh giảm')
  })

  it('FR-POR-06 shows an expired meter link and renews it without reloading the invoice', async () => {
    const initialImageUrl = `/api/anh/77/xem?hetHan=${Math.floor(Date.now() / 1000) + 900}&chuKy=expired`
    const renewedImageUrl = `/api/anh/77/xem?hetHan=${Math.floor(Date.now() / 1000) + 1800}&chuKy=renewed`
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input) === '/api/anh/77/lien-ket') {
        return new Response(JSON.stringify({ url: renewedImageUrl }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({
        coHoaDon: true,
        hoaDon: {
          hoaDonId: 10,
          maHoaDon: 'PORTAL-A-101-202608',
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
          cacDong: [{
            tenKhoan: 'Tiền điện',
            chiSoDau: '100.00',
            chiSoCuoi: '125.00',
            soLuong: '25.00',
            donGia: '3500.00',
            thanhTien: '1000.00',
            loaiKhoan: 'DICH_VU',
            dienGiai: '25.00 × 3500.00 = 1000.00',
            anhCongToId: 77,
            anhCongToUrl: initialImageUrl,
            cacBac: [],
          }],
        },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    })
    vi.stubGlobal('fetch', fetchMock)

    root = createRoot(container)
    await act(async () => root.render(<HoaDon token="tenant-token" cheDoNguoiThue />))

    const image = await vi.waitFor(() => container.querySelector('img[alt="Ảnh công tơ Tiền điện"]') as HTMLImageElement)
    expect(container.textContent).toContain('Đang lấy ảnh công tơ')
    const fullImageLink = container.querySelector('[data-view-meter="77"]') as HTMLAnchorElement
    expect(fullImageLink).not.toBeNull()
    expect(fullImageLink.textContent).toContain('Mở ảnh công tơ bản đầy đủ')
    expect(fullImageLink.getAttribute('href')).toBe(initialImageUrl)

    await act(async () => image.dispatchEvent(new Event('error')))
    expect(container.textContent).toContain('Liên kết ảnh công tơ đã hết hạn')

    const renewButton = container.querySelector('[data-refresh-meter="77"]') as HTMLButtonElement
    await act(async () => renewButton.click())

    await vi.waitFor(() => expect(image.getAttribute('src')).toBe(renewedImageUrl))
    expect(fetchMock).toHaveBeenCalledWith('/api/anh/77/lien-ket', {
      headers: { Authorization: 'Bearer tenant-token' },
    })
    expect(container.textContent).not.toContain('Liên kết ảnh công tơ đã hết hạn')
  })

  it('FR-POR-06 exposes in-place renewal when a loaded signed meter link reaches its expiry', async () => {
    vi.useFakeTimers()
    const expiryEpoch = Math.floor(Date.now() / 1000) + 900
    const imageUrl = `/api/anh/77/xem?hetHan=${expiryEpoch}&chuKy=valid`
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
      cacDong: [{
        tenKhoan: 'Tiền điện',
        chiSoDau: '100.00',
        chiSoCuoi: '125.00',
        soLuong: '25.00',
        donGia: '3500.00',
        thanhTien: '1000.00',
        loaiKhoan: 'DICH_VU',
        dienGiai: '25.00 × 3500.00 = 1000.00',
        anhCongToId: 77,
        anhCongToUrl: imageUrl,
        cacBac: [],
      }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))

    root = createRoot(container)
    await act(async () => {
      root.render(<HoaDon token="tenant-token" toaNhaId={1} kyId={8} hoaDonId={10} />)
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    const image = container.querySelector('img[alt="Ảnh công tơ Tiền điện"]') as HTMLImageElement
    expect(image).not.toBeNull()
    await act(async () => image.dispatchEvent(new Event('load')))
    expect(container.querySelector('[data-refresh-meter="77"]')).toBeNull()

    await act(async () => vi.advanceTimersByTime(900_000))
    expect(container.textContent).toContain('Liên kết ảnh công tơ đã hết hạn')
    expect(container.querySelector('[data-refresh-meter="77"]')).not.toBeNull()
  })

  it('FR-POR-02 offers an in-place retry when the tenant invoice request fails', async () => {
    const response = {
      coHoaDon: true,
      hoaDon: {
        hoaDonId: 10,
        maHoaDon: 'PORTAL-A-101-202608',
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
      },
    }
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error('temporary network failure'))
      .mockResolvedValueOnce(new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
    vi.stubGlobal('fetch', fetchMock)

    root = createRoot(container)
    await act(async () => root.render(<HoaDon token="tenant-token" cheDoNguoiThue />))

    const retry = await vi.waitFor(() => {
      const button = container.querySelector('[data-retry-invoice]')
      expect(button).not.toBeNull()
      return button as HTMLButtonElement
    })
    expect(container.textContent).toContain('Không thể tải chi tiết hoá đơn.')

    await act(async () => retry.click())
    await vi.waitFor(() => expect(container.textContent).toContain('PORTAL-A-101-202608'))
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
