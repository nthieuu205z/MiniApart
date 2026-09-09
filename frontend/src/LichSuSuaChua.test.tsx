// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LichSuSuaChua } from './LichSuSuaChua'

describe('LichSuSuaChua', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    window.history.replaceState({}, '', '/su-co')
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('FR-MNT-08 distinguishes first load from an empty filtered repair history and keeps filters in the URL', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([{ id: 1, maToa: 'A', ten: 'Toà A' }])
      if (url.startsWith('/api/yeu-cau-sua-chua/lich-su?')) {
        return jsonResponse({ yeuCau: [], tongChiPhiChuNha: '0', tongChiPhiNguoiThue: '0' })
      }
      return jsonResponse([])
    })
    vi.stubGlobal('fetch', fetchMock)

    await act(async () => root.render(<LichSuSuaChua token="test-token" />))
    await vi.waitFor(() => expect(container.querySelector('[data-repair-history-first-empty]')).not.toBeNull())
    expect(container.textContent).toContain('Chọn ít nhất một bộ lọc để tra cứu lịch sử sửa chữa.')

    const category = container.querySelector('[name="hangMuc"]') as HTMLInputElement
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(category, 'Điện')
      category.dispatchEvent(new Event('input', { bubbles: true }))
    })

    await vi.waitFor(() => expect(container.querySelector('[data-repair-history-filter-empty]')).not.toBeNull())
    expect(window.location.search).toBe('?hangMuc=%C4%90i%E1%BB%87n')
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/yeu-cau-sua-chua/lich-su?hangMuc=%C4%90i%E1%BB%87n',
      expect.objectContaining({ headers: { Authorization: 'Bearer test-token' } }),
    )
  })

  it('FR-MNT-08 renders string money totals and includes cancelled repairs only when requested', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 360 })
    window.history.replaceState({}, '', '/su-co?toaNhaId=1&hienThiDaHuy=true')
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([{ id: 1, maToa: 'A', ten: 'Toà A' }])
      if (url.startsWith('/api/yeu-cau-sua-chua/lich-su?')) {
        return jsonResponse({
          yeuCau: [{ id: 8, toaNha: 'Toà A', phongId: 21, soPhong: '301', hangMuc: 'Điện', moTa: 'Thay aptomat', trangThai: 'DA_HUY', tenTrangThai: 'Đã huỷ', chiPhi: '125000.50', benChiuChiPhi: 'CHU_NHA', taoLuc: '2026-09-08T12:00:00Z' }],
          tongChiPhiChuNha: '125000.50',
          tongChiPhiNguoiThue: '0',
        })
      }
      return jsonResponse([])
    }))

    await act(async () => root.render(<LichSuSuaChua token="test-token" mobile />))
    const row = await vi.waitFor(() => {
      const item = container.querySelector('[data-repair-history-item="8"]')
      expect(item).not.toBeNull()
      return item as HTMLElement
    })
    expect(row.style.gridTemplateColumns).toBe('minmax(0, 1fr)')
    expect(row.textContent).toContain('Phòng 301')
    expect(row.textContent).toContain('Điện')
    expect(row.textContent).toContain('Đã huỷ')
    expect(row.textContent).toContain('Thay aptomat')
    expect(container.textContent).toContain('125.000,5 ₫')
    expect(container.querySelector('[data-layout-variant="mobile"]')).not.toBeNull()
  })

  it('FR-MNT-08 converts repair Instants to the Ho Chi Minh calendar date before formatting', async () => {
    window.history.replaceState({}, '', '/su-co?toaNhaId=1')
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([{ id: 1, maToa: 'A', ten: 'Toà A' }])
      if (url.startsWith('/api/yeu-cau-sua-chua/lich-su?')) {
        return jsonResponse({
          yeuCau: [{ id: 9, toaNha: 'Toà A', phongId: 22, soPhong: '302', hangMuc: 'Nước', moTa: 'Thay van', trangThai: 'DA_DONG', tenTrangThai: 'Đã đóng', chiPhi: null, benChiuChiPhi: null, taoLuc: '2026-09-08T18:30:00Z' }],
          tongChiPhiChuNha: '0',
          tongChiPhiNguoiThue: '0',
        })
      }
      return jsonResponse([])
    }))

    await act(async () => root.render(<LichSuSuaChua token="test-token" />))
    await vi.waitFor(() => expect(container.querySelector('[data-repair-history-item="9"]')).not.toBeNull())
    expect(container.querySelector('[data-repair-history-item="9"]')?.textContent).toContain('09/09/2026')
  })
})

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
}
