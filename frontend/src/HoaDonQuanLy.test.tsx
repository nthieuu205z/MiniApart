// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HoaDonQuanLy from './HoaDonQuanLy'
import { ToaDangChonProvider } from './toaDangChon'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
const hoaDon = (o: Record<string, unknown>) => ({ hopDongId: 1, nguoiThue: 'Người thuê', hanThanhToan: '2026-09-07', tongTien: '3000000.00', daThu: '0.00', conLai: '3000000.00', ...o })

describe('HoaDonQuanLy', () => {
  let root: Root
  let container: HTMLDivElement
  const calls: { url: string; method?: string }[] = []

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    window.history.replaceState({}, '', '/hoa-don?toaNhaId=3')
    container = document.createElement('div')
    document.body.appendChild(container)
    calls.length = 0
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      calls.push({ url, method: init?.method })
      if (url === '/api/toa-nha') return json([{ id: 3, ten: 'An Nhiên' }])
      if (url === '/api/toa-nha/3/ky-thanh-toan') return json([{ id: 8, thang: 8, nam: 2026, trangThai: 'DANG_MO' }])
      if (url.startsWith('/api/hoa-don?')) {
        return json([
          hoaDon({ hoaDonId: 10, maHoaDon: 'HD-10', kyId: 8, soPhong: '101', trangThai: 'QUA_HAN', conLai: '3000000.00' }),
          hoaDon({ hoaDonId: 11, maHoaDon: 'QT-11', kyId: null, soPhong: '102', trangThai: 'DA_PHAT_HANH', tongTien: '1000.00', conLai: '1000.00' }),
          hoaDon({ hoaDonId: 12, maHoaDon: 'HD-12', kyId: 8, soPhong: '103', trangThai: 'DA_THANH_TOAN', conLai: '0.00' }),
        ])
      }
      throw new Error(`Unexpected fetch: ${url}`)
    }))
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
  })

  async function mount() {
    await act(async () => { root = createRoot(container); root.render(<HoaDonQuanLy token="t" />) })
    await vi.waitFor(() => expect(container.querySelectorAll('[data-invoice-row]')).toHaveLength(3))
  }

  it('hiện từng hoá đơn với số tiền, trạng thái, liên kết chi tiết (trừ hoá đơn quyết toán)', async () => {
    await mount()
    expect(container.querySelector('[data-testid="manager-invoice-screen"]')).not.toBeNull()
    const dong = container.querySelector('[data-invoice-row="10"]')!
    expect(dong.textContent).toContain('HD-10')
    expect(dong.textContent).toContain('Quá hạn')
    expect(dong.textContent).toContain('3.000.000')
    expect(dong.querySelector('a')?.getAttribute('href')).toBe('/hoa-don?toaNhaId=3&kyId=8&hoaDonId=10')
    expect(container.querySelector('[data-invoice-row="11"] a')).toBeNull()
    expect(container.querySelector('[data-invoice-row="11"]')?.textContent).toContain('quyết toán')
    expect(calls.some((c) => c.url === '/api/hoa-don?toaNhaId=3&trangThai=NO_QUA_HAN')).toBe(true)
  })

  it('nút hàng loạt bị chặn tới khi chọn kỳ, chọn kỳ rồi mới mở', async () => {
    await mount()
    const tao = () => Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Tạo hoá đơn nháp hàng loạt'))!
    expect(tao().getAttribute('aria-disabled')).toBe('true')
    const chonKy = container.querySelector('select[aria-label="Lọc tháng hoá đơn"]') as HTMLSelectElement
    await vi.waitFor(() => expect(chonKy.options.length).toBe(2))
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!.call(chonKy, '8')
      chonKy.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(tao().getAttribute('aria-disabled')).toBeNull()
  })

  it('toà lấy từ khung: Chủ chọn một toà ở sidebar thì không còn ô chọn toà riêng; có link sang Chu kỳ tháng', async () => {
    const taiToa = async () => [{ id: 3, ten: 'An Nhiên' }, { id: 4, ten: 'Mộc Lan' }] as never
    await act(async () => { root = createRoot(container); root.render(<ToaDangChonProvider token="t" vaiTro="CHU" search="?toaNhaId=3" taiToa={taiToa}><HoaDonQuanLy token="t" /></ToaDangChonProvider>) })
    await vi.waitFor(() => expect(container.querySelectorAll('[data-invoice-row]')).toHaveLength(3))
    expect(container.querySelector('[data-invoice-building-select], #hoa-don-toa')).toBeNull()
    expect(container.querySelector('a[href="/chu-ky"]')?.textContent).toContain('Tháng này')
    expect(container.querySelector('h1')?.textContent).toBe('Thu tiền')
    expect(calls.some((c) => c.url === '/api/toa-nha')).toBe(false) // không tự gọi fetchToaNha ngoài provider
  })

  it('hàng tổng cộng đủ số hoá đơn; gửi hàng loạt qua ConfirmDialog với nhãn "Gửi"', async () => {
    await mount()
    expect(container.querySelector('tfoot')?.textContent).toContain('Cộng 3 hoá đơn')
    const chonKy = container.querySelector('select[aria-label="Lọc tháng hoá đơn"]') as HTMLSelectElement
    await vi.waitFor(() => expect(chonKy.options.length).toBe(2))
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!.call(chonKy, '8')
      chonKy.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await act(async () => { Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Gửi hoá đơn trong tháng'))!.click() })
    const hop = container.querySelector('[role="dialog"]')!
    expect(hop.textContent).toContain('Người thuê sẽ thấy hoá đơn và hoá đơn không còn sửa được.')
    await act(async () => { Array.from(hop.querySelectorAll('button')).find((b) => b.textContent === 'Chưa, xem lại')!.click() })
    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })

  it('Chủ đang "Tất cả toà": tự chọn toà đầu (ô toà của khung đổi theo) rồi gọi API hoá đơn của toà đó', async () => {
    window.history.replaceState({}, '', '/hoa-don')
    localStorage.clear()
    const taiToa = async () => [{ id: 3, ten: 'An Nhiên' }, { id: 4, ten: 'Mộc Lan' }] as never
    await act(async () => { root = createRoot(container); root.render(<ToaDangChonProvider token="t" vaiTro="CHU" search="" taiToa={taiToa}><HoaDonQuanLy token="t" /></ToaDangChonProvider>) })
    await vi.waitFor(() => expect(calls.some((c) => c.url.startsWith('/api/hoa-don?') && c.url.includes('toaNhaId=3'))).toBe(true))
    expect(container.textContent).not.toContain('Chọn một toà nhà để xem hoá đơn.')
  })
})
