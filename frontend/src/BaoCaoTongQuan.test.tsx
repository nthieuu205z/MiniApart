// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BaoCaoTongQuan from './BaoCaoTongQuan'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

describe('BaoCaoTongQuan', () => {
  let root: Root | null = null
  let container: HTMLDivElement | null = null

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    window.history.replaceState({}, '', '/bao-cao?toaNhaId=2&tuNgay=2040-08-01&denNgay=2040-08-31')
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
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('FR-RPT-01 FR-RPT-02 renders six KPIs, a shared monthly table/chart, and the mobile layout', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') {
        return jsonResponse([{ id: 1, ten: 'Toà A' }, { id: 2, ten: 'Toà B' }])
      }
      if (url.startsWith('/api/bao-cao/tong-quan?')) {
        return jsonResponse({
          toaNhaId: 2,
          tenToaNha: 'Toà B',
          tuNgay: '2040-08-01',
          denNgay: '2040-08-31',
          tinhLuc: '2040-08-15T10:00+07:00',
          coDuLieuTaiChinh: true,
          kpi: {
            doanhThuPhatHanh: '1000000.00',
            daThu: '500000.00',
            congNo: '500000.00',
            tyLeLapDay: '50.00',
            tongSoPhong: 2,
            soPhongDangThue: 1,
            soPhongTrong: 1,
            soSuCoDangMo: 0,
          },
          theoThang: [{
            thang: '2040-08',
            nhan: '08/2040',
            doanhThuPhatHanh: '1000000.00',
            daThu: '500000.00',
            congNo: '500000.00',
          }],
        })
      }
      throw new Error(`Unexpected fetch: ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    await act(async () => {
      root = createRoot(container!)
      root.render(<BaoCaoTongQuan token="report-token" mobile />)
    })

    await vi.waitFor(() => {
      expect(container!.querySelector('[data-testid="report-overview-screen"]')).not.toBeNull()
      expect(container!.querySelectorAll('[data-report-kpi]')).toHaveLength(6)
    })

    expect(container!.querySelector('[data-layout-variant="mobile"]')).not.toBeNull()
    expect((container!.querySelector('[aria-label="Sáu chỉ số chính"]') as HTMLElement).style.gridTemplateColumns)
      .toBe('minmax(0, 1fr)')
    expect(container!.querySelector('[data-report-monthly-table]')).not.toBeNull()
    expect(container!.querySelector('[data-report-chart]')).not.toBeNull()
    expect(container!.textContent).toContain('1.000.000 ₫')
    expect(container!.textContent).toContain('50,00%')
    expect(container!.textContent).toContain('Tính lúc 2040-08-15T10:00+07:00')
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/bao-cao/tong-quan?tuNgay=2040-08-01&denNgay=2040-08-31&toaNhaId=2',
      expect.objectContaining({ headers: { Authorization: 'Bearer report-token' } }),
    )
  })

  it('FR-RPT-02 uses the Asia/Ho_Chi_Minh business date for default filters', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2040-08-15T18:00:00.000Z'))
    window.history.replaceState({}, '', '/bao-cao')
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([])
      if (url === '/api/bao-cao/tong-quan?tuNgay=2040-08-01&denNgay=2040-08-16') {
        return jsonResponse({
          toaNhaId: null,
          tenToaNha: 'Tất cả toà được phân quyền',
          tuNgay: '2040-08-01',
          denNgay: '2040-08-16',
          tinhLuc: '2040-08-15T10:00+07:00',
          coDuLieuTaiChinh: false,
          kpi: {
            doanhThuPhatHanh: '0.00', daThu: '0.00', congNo: '0.00', tyLeLapDay: '0.00',
            tongSoPhong: 0, soPhongDangThue: 0, soPhongTrong: 0, soSuCoDangMo: 0,
          },
          theoThang: [{ thang: '2040-08', nhan: '08/2040', doanhThuPhatHanh: '0.00', daThu: '0.00', congNo: '0.00' }],
        })
      }
      throw new Error(`Unexpected fetch: ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    await act(async () => {
      root = createRoot(container!)
      root.render(<BaoCaoTongQuan token="report-token" mobile />)
    })

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/bao-cao/tong-quan?tuNgay=2040-08-01&denNgay=2040-08-16',
      expect.objectContaining({ headers: { Authorization: 'Bearer report-token' } }),
    ))
  })

  it('FR-RPT-02 reloads filters when browser history emits popstate', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([])
      return jsonResponse({
        toaNhaId: url.includes('toaNhaId=1') ? 1 : 2,
        tenToaNha: 'Toà được chọn',
        tuNgay: url.includes('tuNgay=2040-09-01') ? '2040-09-01' : '2040-08-01',
        denNgay: url.includes('denNgay=2040-09-30') ? '2040-09-30' : '2040-08-31',
        tinhLuc: '2040-08-15T10:00+07:00',
        coDuLieuTaiChinh: false,
        kpi: {
          doanhThuPhatHanh: '0.00', daThu: '0.00', congNo: '0.00', tyLeLapDay: '0.00',
          tongSoPhong: 0, soPhongDangThue: 0, soPhongTrong: 0, soSuCoDangMo: 0,
        },
        theoThang: [{ thang: '2040-08', nhan: '08/2040', doanhThuPhatHanh: '0.00', daThu: '0.00', congNo: '0.00' }],
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    await act(async () => {
      root = createRoot(container!)
      root.render(<BaoCaoTongQuan token="report-token" mobile />)
    })
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/bao-cao/tong-quan?tuNgay=2040-08-01&denNgay=2040-08-31&toaNhaId=2',
      expect.anything(),
    ))

    window.history.pushState({}, '', '/bao-cao?toaNhaId=1&tuNgay=2040-09-01&denNgay=2040-09-30')
    window.dispatchEvent(new PopStateEvent('popstate'))

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/bao-cao/tong-quan?tuNgay=2040-09-01&denNgay=2040-09-30&toaNhaId=1',
      expect.anything(),
    ))
  })

  it('FR-RPT-01 distinguishes loading and API error states', async () => {
    let rejectReport: ((reason: Error) => void) | null = null
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') return Promise.resolve(jsonResponse([]))
      return new Promise<Response>((_resolve, reject) => { rejectReport = reject })
    })
    vi.stubGlobal('fetch', fetchMock)

    await act(async () => {
      root = createRoot(container!)
      root.render(<BaoCaoTongQuan token="report-token" mobile={false} />)
    })
    expect(container!.textContent).toContain('Đang tải báo cáo tổng quan…')

    await act(async () => rejectReport?.(new Error('mất kết nối')))
    await vi.waitFor(() => expect(container!.querySelector('[role="alert"]')).not.toBeNull())
    expect(container!.textContent).toContain('Không thể tải báo cáo tổng quan.')
  })

  it('FR-RPT-01 keeps the monthly structure and empty financial state when no invoice exists', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([])
      return jsonResponse({
        toaNhaId: null,
        tenToaNha: 'Tất cả toà được phân quyền',
        tuNgay: '2040-08-01',
        denNgay: '2040-08-31',
        tinhLuc: '2040-08-15T10:00+07:00',
        coDuLieuTaiChinh: false,
        kpi: {
          doanhThuPhatHanh: '0.00', daThu: '0.00', congNo: '0.00', tyLeLapDay: '0.00',
          tongSoPhong: 0, soPhongDangThue: 0, soPhongTrong: 0, soSuCoDangMo: 0,
        },
        theoThang: [{ thang: '2040-08', nhan: '08/2040', doanhThuPhatHanh: '0.00', daThu: '0.00', congNo: '0.00' }],
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    await act(async () => {
      root = createRoot(container!)
      root.render(<BaoCaoTongQuan token="report-token" mobile />)
    })

    await vi.waitFor(() => expect(container!.querySelector('[data-report-empty]')).not.toBeNull())
    expect(container!.querySelector('[data-report-monthly-table]')).not.toBeNull()
    expect(container!.textContent).toContain('Chưa có dữ liệu tài chính trong khoảng ngày đã chọn.')
  })

  it('NFR-USA-03 measures one bounded snapshot for 24 monthly points without request fan-out', async () => {
    const theoThang = Array.from({ length: 24 }, (_, index) => {
      const month = String((index % 12) + 1).padStart(2, '0')
      const year = index < 12 ? '2039' : '2040'
      return {
        thang: `${year}-${month}`,
        nhan: `${month}/${year}`,
        doanhThuPhatHanh: '1000000.00',
        daThu: '500000.00',
        congNo: '500000.00',
      }
    })
    let reportCalls = 0
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([])
      reportCalls += 1
      return jsonResponse({
        toaNhaId: null,
        tenToaNha: 'Tất cả toà được phân quyền',
        tuNgay: '2039-01-01',
        denNgay: '2040-12-31',
        tinhLuc: '2040-08-15T10:00+07:00',
        coDuLieuTaiChinh: true,
        kpi: {
          doanhThuPhatHanh: '24000000.00', daThu: '12000000.00', congNo: '12000000.00', tyLeLapDay: '50.00',
          tongSoPhong: 250, soPhongDangThue: 125, soPhongTrong: 100, soSuCoDangMo: 3,
        },
        theoThang,
      })
    })
    vi.stubGlobal('fetch', fetchMock)
    const startedAt = performance.now()

    await act(async () => {
      root = createRoot(container!)
      root.render(<BaoCaoTongQuan token="report-token" mobile />)
    })
    await vi.waitFor(() => expect(container!.querySelectorAll('[data-report-chart-month]')).toHaveLength(24))

    expect(container!.querySelectorAll('[data-report-monthly-table] tbody tr')).toHaveLength(24)
    expect(reportCalls).toBe(1)
    expect(performance.now() - startedAt).toBeLessThan(3000)
  })
})

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
