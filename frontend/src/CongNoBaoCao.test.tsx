// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CongNoBaoCao from './CongNoBaoCao'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

describe('CongNoBaoCao', () => {
  let root: Root | null = null
  let container: HTMLDivElement | null = null

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    window.history.replaceState({}, '', '/cong-no?toaNhaId=1')
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(async () => {
    if (root) {
      await act(async () => root?.unmount())
      root = null
    }
    container?.remove()
    container = null
    vi.restoreAllMocks()
  })

  it('FR-RPT-02 FR-RPT-03 renders server-sorted debt rows and links each invoice, including settlement invoices', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([{ id: 1, ten: 'Toà A' }])
      if (url === '/api/bao-cao/cong-no?toaNhaId=1') {
        return jsonResponse({
          toaNhaId: 1,
          tinhLuc: '2040-08-15T10:00+07:00',
          congNo: [
            row({ hoaDonId: 11, maHoaDon: 'RPT-11', soPhong: '101', hoTenNguoiThue: 'Người thuê 101', soNgayQuaHan: 23, conLai: '500000.00', kyId: 8 }),
            row({ hoaDonId: 12, maHoaDon: 'QUYET-12', soPhong: '102', hoTenNguoiThue: 'Người thuê 102', soNgayQuaHan: 0, conLai: '1250000.00', kyId: null }),
          ],
        })
      }
      throw new Error(`Unexpected fetch: ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    await act(async () => {
      root = createRoot(container!)
      root.render(<CongNoBaoCao token="report-token" mobile />)
    })

    await vi.waitFor(() => expect(container!.querySelectorAll('[data-debt-row]')).toHaveLength(2))
    expect(container!.querySelector('[data-layout-variant="mobile"]')).not.toBeNull()
    expect(container!.querySelector('[data-debt-row="11"]')?.textContent).toContain('23 ngày')
    expect(container!.querySelector('[data-debt-row="11"]')?.textContent).toContain('500.000 ₫')
    expect(container!.querySelector('[data-debt-row="12"]')?.textContent).toContain('0 ngày')
    expect(container!.querySelector('[data-debt-row="12"]')?.textContent).toContain('1.250.000 ₫')
    expect(container!.querySelector('[data-debt-row="11"] a')?.getAttribute('href')).toBe('/hoa-don?hoaDonId=11')
    expect(container!.querySelector('[data-debt-row="12"] a')?.getAttribute('href')).toBe('/hoa-don?hoaDonId=12')
    expect(container!.querySelector('[data-debt-list]')?.getAttribute('aria-label')).toContain('sắp xếp từ nợ quá hạn lâu nhất')
    expect(container!.textContent).toContain('Tính lúc 2040-08-15T10:00+07:00')
  })

  it('FR-RPT-02 reloads the building filter from browser history and keeps the URL shareable', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([{ id: 1, ten: 'Toà A' }, { id: 2, ten: 'Toà B' }])
      return jsonResponse({ toaNhaId: url.includes('toaNhaId=2') ? 2 : 1, tinhLuc: '2040-08-15T10:00+07:00', congNo: [] })
    })
    vi.stubGlobal('fetch', fetchMock)

    await act(async () => {
      root = createRoot(container!)
      root.render(<CongNoBaoCao token="report-token" mobile={false} />)
    })
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/bao-cao/cong-no?toaNhaId=1', expect.anything()))

    window.history.pushState({}, '', '/cong-no?toaNhaId=2')
    window.dispatchEvent(new PopStateEvent('popstate'))
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/bao-cao/cong-no?toaNhaId=2', expect.anything()))
  })

  it('FR-RPT-03 exposes loading, API error, and empty debt states', async () => {
    let rejectReport: ((reason: Error) => void) | null = null
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') return Promise.resolve(jsonResponse([]))
      return new Promise<Response>((_resolve, reject) => { rejectReport = reject })
    })
    vi.stubGlobal('fetch', fetchMock)

    await act(async () => {
      root = createRoot(container!)
      root.render(<CongNoBaoCao token="report-token" mobile />)
    })
    expect(container!.textContent).toContain('Đang tải báo cáo công nợ…')

    await act(async () => rejectReport?.(new Error('mất kết nối')))
    await vi.waitFor(() => expect(container!.querySelector('[role="alert"]')).not.toBeNull())
    expect(container!.textContent).toContain('Không thể tải báo cáo công nợ.')
  })

  it('NFR-USA-03 renders a bounded 250-row snapshot without client-side request fan-out', async () => {
    const rows = Array.from({ length: 250 }, (_, index) => row({
      hoaDonId: index + 1,
      maHoaDon: `RPT-${index + 1}`,
      soPhong: String(100 + index),
      hoTenNguoiThue: `Người thuê ${index + 1}`,
      soNgayQuaHan: 250 - index,
      conLai: '1000000.00',
      kyId: index + 1,
    }))
    let reportCalls = 0
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([])
      reportCalls += 1
      return jsonResponse({ toaNhaId: 1, tinhLuc: '2040-08-15T10:00+07:00', congNo: rows })
    })
    vi.stubGlobal('fetch', fetchMock)
    const startedAt = performance.now()

    await act(async () => {
      root = createRoot(container!)
      root.render(<CongNoBaoCao token="report-token" mobile />)
    })
    await vi.waitFor(() => expect(container!.querySelectorAll('[data-debt-row]')).toHaveLength(250))
    expect(reportCalls).toBe(1)
    expect(performance.now() - startedAt).toBeLessThan(3000)
  })
})

function row(overrides: Partial<DebtRow> = {}): DebtRow {
  return {
    hoaDonId: 10,
    maHoaDon: 'RPT-10',
    kyId: 8,
    hopDongId: 20,
    toaNhaId: 1,
    tenToaNha: 'Toà A',
    soPhong: '101',
    nguoiThueId: 30,
    hoTenNguoiThue: 'Người thuê',
    ngayPhatHanh: '2040-08-01',
    hanThanhToan: '2040-08-07',
    tongTien: '1000000.00',
    daThu: '0.00',
    conLai: '1000000.00',
    soNgayQuaHan: 8,
    ...overrides,
  }
}

type DebtRow = {
  hoaDonId: number
  maHoaDon: string
  kyId: number | null
  hopDongId: number
  toaNhaId: number
  tenToaNha: string
  soPhong: string
  nguoiThueId: number
  hoTenNguoiThue: string
  ngayPhatHanh: string
  hanThanhToan: string
  tongTien: string
  daThu: string
  conLai: string
  soNgayQuaHan: number
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
