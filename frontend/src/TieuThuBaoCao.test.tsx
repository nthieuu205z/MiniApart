// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TieuThuBaoCao from './TieuThuBaoCao'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

describe('TieuThuBaoCao', () => {
  let root: Root | null = null
  let container: HTMLDivElement | null = null

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    window.history.replaceState({}, '', '/bao-cao/tieu-thu?toaNhaId=1&phongId=101&kyId=81')
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

  it('FR-RPT-02 FR-RPT-05 uses one snapshot for the table and chart without mixing units', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([{ id: 1, ten: 'Toà A' }])
      if (url === '/api/toa-nha/1/phong') return jsonResponse([{ id: 101, toaNhaId: 1, soPhong: '101', tang: 1 }])
      if (url === '/api/toa-nha/1/ky-thanh-toan') return jsonResponse([{ id: 81, nam: 2040, thang: 8 }])
      if (url === '/api/bao-cao/tieu-thu?toaNhaId=1&phongId=101&kyId=81') {
        return jsonResponse(baoCao())
      }
      throw new Error(`Unexpected fetch: ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    await act(async () => {
      root = createRoot(container!)
      root.render(<TieuThuBaoCao token="report-token" mobile />)
    })

    await vi.waitFor(() => expect(container!.querySelectorAll('[data-consumption-report-row]')).toHaveLength(3))

    expect(container!.querySelector('[data-layout-variant="mobile"]')).not.toBeNull()
    expect(container!.querySelector('[data-consumption-report-table]')).not.toBeNull()
    expect(container!.querySelector('[data-consumption-report-chart]')).not.toBeNull()
    expect(container!.textContent).toContain('50,00 kWh')
    expect(container!.textContent).toContain('60,00 m³')
    expect(container!.querySelector('[data-consumption-report-row="102-81-electricity"]')?.textContent).toContain('Chưa có chỉ số')
    expect(container!.querySelector('[data-consumption-report-row="102-81-electricity"]')?.textContent).not.toContain('0,00')
    expect(container!.querySelectorAll('[data-consumption-report-chart-point]')).toHaveLength(2)
    expect(container!.querySelector('[data-consumption-report-chart-point="kWh"]')).not.toBeNull()
    expect(container!.querySelector('[data-consumption-report-chart-point="m³"]')).not.toBeNull()
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/bao-cao/tieu-thu?toaNhaId=1&phongId=101&kyId=81',
      expect.objectContaining({ headers: { Authorization: 'Bearer report-token' } }),
    )
  })

  it('FR-RPT-02 keeps filters shareable and reloads them from browser history', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([{ id: 1, ten: 'Toà A' }, { id: 2, ten: 'Toà B' }])
      if (url === '/api/toa-nha/1/phong' || url === '/api/toa-nha/2/phong') return jsonResponse([{ id: 101, toaNhaId: 1, soPhong: '101', tang: 1 }])
      if (url === '/api/toa-nha/1/ky-thanh-toan' || url === '/api/toa-nha/2/ky-thanh-toan') return jsonResponse([{ id: 81, nam: 2040, thang: 8 }])
      return jsonResponse(baoCao())
    })
    vi.stubGlobal('fetch', fetchMock)

    await act(async () => {
      root = createRoot(container!)
      root.render(<TieuThuBaoCao token="report-token" />)
    })
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/bao-cao/tieu-thu?toaNhaId=1&phongId=101&kyId=81',
      expect.anything(),
    ))

    window.history.pushState({}, '', '/bao-cao/tieu-thu?toaNhaId=2&phongId=202&kyId=82')
    window.dispatchEvent(new PopStateEvent('popstate'))

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/bao-cao/tieu-thu?toaNhaId=2&phongId=202&kyId=82',
      expect.anything(),
    ))
  })

  it('FR-RPT-05 distinguishes loading, API error, and empty states', async () => {
    let rejectReport: ((reason: Error) => void) | null = null
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') return Promise.resolve(jsonResponse([]))
      return new Promise<Response>((_resolve, reject) => { rejectReport = reject })
    })
    vi.stubGlobal('fetch', fetchMock)

    await act(async () => {
      root = createRoot(container!)
      root.render(<TieuThuBaoCao token="report-token" />)
    })
    expect(container!.textContent).toContain('Đang tải báo cáo tiêu thụ')

    await act(async () => rejectReport?.(new Error('mất kết nối')))
    await vi.waitFor(() => expect(container!.querySelector('[role="alert"]')).not.toBeNull())
    expect(container!.textContent).toContain('Không thể tải báo cáo tiêu thụ.')
  })

  it('FR-RPT-05 explains an empty snapshot without inventing zero values', async () => {
    window.history.replaceState({}, '', '/bao-cao/tieu-thu')
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([])
      return jsonResponse({ toaNhaId: null, phongId: null, kyId: null, tinhLuc: '2040-08-15T10:00+07:00', cacDong: [], bieuDo: [] })
    })
    vi.stubGlobal('fetch', fetchMock)

    await act(async () => {
      root = createRoot(container!)
      root.render(<TieuThuBaoCao token="report-token" />)
    })

    await vi.waitFor(() => expect(container!.textContent).toContain('Không có dữ liệu tiêu thụ phù hợp bộ lọc.'))
    expect(container!.textContent).not.toContain('0,00 kWh')
  })
})

function baoCao() {
  return {
    toaNhaId: 1,
    phongId: 101,
    kyId: 81,
    tinhLuc: '2040-08-15T10:00+07:00',
    cacDong: [
      dong({ phongId: 101, soPhong: '101', dichVuId: 1, tenDichVu: 'Điện', donVi: 'kWh', laDien: true, mucTieuThu: '50.00' }),
      dong({ phongId: 101, soPhong: '101', dichVuId: 2, tenDichVu: 'Nước', donVi: 'm³', laDien: false, mucTieuThu: '60.00', coThayCongTo: true, chiSoCuoiCongToCu: '140.00', chiSoDauCongToMoi: '10.00' }),
      dong({ phongId: 102, soPhong: '102', dichVuId: 1, tenDichVu: 'Điện', donVi: 'kWh', laDien: true, mucTieuThu: null, coDuLieu: false, chiSoDau: null, chiSoCuoi: null }),
    ],
    bieuDo: [
      { kyId: 81, nam: 2040, thang: 8, nhanKy: '08/2040', donVi: 'kWh', laDien: true, mucTieuThu: '50.00', soDong: 2, soDongCoDuLieu: 1 },
      { kyId: 81, nam: 2040, thang: 8, nhanKy: '08/2040', donVi: 'm³', laDien: false, mucTieuThu: '60.00', soDong: 1, soDongCoDuLieu: 1 },
    ],
  }
}

function dong(overrides: Record<string, unknown> = {}) {
  return {
    kyId: 81,
    nam: 2040,
    thang: 8,
    nhanKy: '08/2040',
    tuNgay: '2040-08-01',
    denNgay: '2040-08-31',
    toaNhaId: 1,
    maToa: 'A',
    tenToaNha: 'Toà A',
    phongId: 101,
    soPhong: '101',
    tang: 1,
    hopDongId: 10,
    dichVuId: 1,
    tenDichVu: 'Điện',
    donVi: 'kWh',
    laDien: true,
    chiSoDau: '100.00',
    chiSoCuoi: '150.00',
    coThayCongTo: false,
    chiSoCuoiCongToCu: null,
    chiSoDauCongToMoi: null,
    mucTieuThu: '50.00',
    coDuLieu: true,
    ...overrides,
  }
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
