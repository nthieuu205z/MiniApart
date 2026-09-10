// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ChiPhiBaoTriBaoCao from './ChiPhiBaoTriBaoCao'
import { fetchChiPhiBaoTriBaoCao } from './api'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

describe('ChiPhiBaoTriBaoCao', () => {
  let root: Root | null = null
  let container: HTMLDivElement | null = null

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    window.history.replaceState({}, '', '/bao-cao/chi-phi-bao-tri?toaNhaId=1&phongId=101&tuNgay=2040-08-01&denNgay=2040-08-31')
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

  it('FR-RPT-04 renders one owner/tenant snapshot for the table and monthly chart without turning missing cost into zero', async () => {
    let reportCalls = 0
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([{ id: 1, ten: 'Toà A' }])
      if (url === '/api/toa-nha/1/phong') return jsonResponse([{ id: 101, toaNhaId: 1, soPhong: '101', tang: 1 }])
      if (url === '/api/bao-cao/chi-phi-bao-tri?toaNhaId=1&phongId=101&tuNgay=2040-08-01&denNgay=2040-08-31') {
        reportCalls += 1
        return jsonResponse(baoCao())
      }
      throw new Error(`Unexpected fetch: ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    await act(async () => {
      root = createRoot(container!)
      root.render(<ChiPhiBaoTriBaoCao token="report-token" mobile />)
    })

    await vi.waitFor(() => expect(container!.querySelectorAll('[data-maintenance-cost-row]')).toHaveLength(3))

    expect(container!.querySelector('[data-testid="maintenance-cost-report-screen"]')).not.toBeNull()
    expect(container!.querySelector('[data-layout-variant="mobile"]')).not.toBeNull()
    expect(container!.querySelector('[data-maintenance-cost-table]')).not.toBeNull()
    expect(container!.querySelector('[data-maintenance-cost-chart]')).not.toBeNull()
    expect(container!.querySelector('[data-maintenance-cost-row="41"] a')?.getAttribute('href')).toBe('/su-co?yeuCauId=41')
    expect(container!.textContent).toContain('1.000 ₫')
    expect(container!.textContent).toContain('300,25 ₫')
    expect(container!.textContent).toContain('Chưa ghi nhận')
    expect(container!.querySelector('[data-maintenance-cost-row="42"]')?.textContent).not.toContain('0,00 ₫')
    expect(container!.querySelectorAll('[data-maintenance-cost-chart-point]')).toHaveLength(1)
    expect(container!.textContent).toContain('Tính lúc 2040-08-15T10:00+07:00')
    expect(reportCalls).toBe(1)
  })

  it('FR-RPT-04 reloads the building, room, and date scope from browser history', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([{ id: 1, ten: 'Toà A' }, { id: 2, ten: 'Toà B' }])
      if (url.endsWith('/phong')) return jsonResponse([{ id: 101, toaNhaId: 1, soPhong: '101', tang: 1 }])
      return jsonResponse({ ...baoCao(), toaNhaId: url.includes('toaNhaId=2') ? 2 : 1 })
    })
    vi.stubGlobal('fetch', fetchMock)

    await act(async () => {
      root = createRoot(container!)
      root.render(<ChiPhiBaoTriBaoCao token="report-token" />)
    })

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/bao-cao/chi-phi-bao-tri?toaNhaId=1&phongId=101&tuNgay=2040-08-01&denNgay=2040-08-31',
      expect.anything(),
    ))

    window.history.pushState({}, '', '/bao-cao/chi-phi-bao-tri?toaNhaId=2&phongId=202&tuNgay=2040-09-01&denNgay=2040-09-30')
    window.dispatchEvent(new PopStateEvent('popstate'))

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/bao-cao/chi-phi-bao-tri?toaNhaId=2&phongId=202&tuNgay=2040-09-01&denNgay=2040-09-30',
      expect.anything(),
    ))
  })

  it('FR-RPT-04 distinguishes loading, API error, and empty snapshot states', async () => {
    let rejectReport: ((reason: Error) => void) | null = null
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') return Promise.resolve(jsonResponse([]))
      return new Promise<Response>((_resolve, reject) => { rejectReport = reject })
    })
    vi.stubGlobal('fetch', fetchMock)

    await act(async () => {
      root = createRoot(container!)
      root.render(<ChiPhiBaoTriBaoCao token="report-token" />)
    })
    expect(container!.textContent).toContain('Đang tải báo cáo chi phí bảo trì')

    await act(async () => rejectReport?.(new Error('mất kết nối')))
    await vi.waitFor(() => expect(container!.querySelector('[role="alert"]')).not.toBeNull())
    expect(container!.textContent).toContain('Không thể tải báo cáo chi phí bảo trì.')
  })

  it('FR-RPT-04 asks the API for explicit inclusive date and room filters', async () => {
    const response = baoCao()
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(response))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchChiPhiBaoTriBaoCao('report-token', {
      toaNhaId: 1,
      phongId: 101,
      tuNgay: '2040-08-01',
      denNgay: '2040-08-31',
    })).resolves.toEqual(response)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/bao-cao/chi-phi-bao-tri?toaNhaId=1&phongId=101&tuNgay=2040-08-01&denNgay=2040-08-31',
      { headers: { Authorization: 'Bearer report-token' } },
    )
  })
})

function baoCao() {
  return {
    toaNhaId: 1,
    phongId: 101,
    tuNgay: '2040-08-01',
    denNgay: '2040-08-31',
    tinhLuc: '2040-08-15T10:00+07:00',
    tongChiPhiChuNha: '1000.00',
    tongChiPhiNguoiThue: '300.25',
    soDong: 3,
    soDongCoChiPhi: 2,
    soDongThieuChiPhi: 1,
    cacDong: [
      dong({ id: 41, yeuCauId: 41, hangMuc: 'Dien', chiPhi: '1000.00', benChiuChiPhi: 'CHU_NHA', trangThaiChiPhi: 'DA_GHI_NHAN', coChiPhi: true }),
      dong({ id: 42, yeuCauId: 42, hangMuc: 'Son', chiPhi: null, benChiuChiPhi: null, trangThaiChiPhi: 'CHUA_GHI_NHAN', tenTrangThaiChiPhi: 'Chưa ghi nhận', coChiPhi: false }),
      dong({ id: 43, yeuCauId: 43, hangMuc: 'Ong nuoc', chiPhi: '300.25', benChiuChiPhi: 'NGUOI_THUE', trangThaiChiPhi: 'DA_GHI_NHAN', coChiPhi: true }),
    ],
    cacNhom: [],
    bieuDo: [{ thang: '2040-08', nhan: '08/2040', chiPhiChuNha: '1000.00', chiPhiNguoiThue: '300.25', soDong: 3, soDongCoChiPhi: 2, soDongThieuChiPhi: 1 }],
  }
}

function dong(overrides: Record<string, unknown> = {}) {
  return {
    id: 41,
    yeuCauId: 41,
    toaNhaId: 1,
    maToa: 'TN-A',
    tenToaNha: 'Toà A',
    phongId: 101,
    soPhong: '101',
    hangMuc: 'Dien',
    thang: '2040-08',
    nhanThang: '08/2040',
    trangThai: 'DANG_XU_LY',
    tenTrangThai: 'Đang xử lý',
    chiPhi: '1000.00',
    benChiuChiPhi: 'CHU_NHA',
    coChiPhi: true,
    trangThaiChiPhi: 'DA_GHI_NHAN',
    tenTrangThaiChiPhi: 'Đã ghi nhận',
    taoLuc: '2040-08-01T23:30:00+07:00',
    lienKet: '/su-co?yeuCauId=41',
    ...overrides,
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
