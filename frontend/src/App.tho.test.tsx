// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { clearStoredToken, storeToken } from './authSession'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const mockTongQuanData = {
  kpi: {
    dangXuLy: 4,
    choXacNhan: 3,
    tyLeHoanThanh: {
      tyLe: 82.5,
      daHoanThanh: 10,
      tongDuocGiao: 12,
      moTa: '10/12 đơn hoàn thành',
      coDuLieu: true,
    },
    giaTriDaChot: 12500000,
    daNhan: 9000000,
    conPhaiTra: 3500000,
  },
  bieuDoTrangThai: [
    { trangThai: 'DANG_XU_LY', tenTrangThai: 'Đang xử lý', soLuong: 4, mauSac: '#2563EB' },
    { trangThai: 'CHO_XAC_NHAN', tenTrangThai: 'Chờ xác nhận', soLuong: 3, mauSac: '#F59E0B' },
    { trangThai: 'DA_DONG', tenTrangThai: 'Đã hoàn thành', soLuong: 10, mauSac: '#10B981' },
  ],
  bieuDoXuHuong: [
    { nhan: 'T10', giaTriDaChot: 6000000, daNhan: 4500000, soViecXong: 5 },
    { nhan: 'T11', giaTriDaChot: 6500000, daNhan: 4500000, soViecXong: 5 },
  ],
  viecCanXuLy: [
    {
      id: 101,
      maYeuCau: 'SC-20261101-001',
      hangMuc: 'Vòi lavabo rò rỉ nước',
      moTa: 'Khớp nối vòi bồn rửa mặt bị rò',
      toaNhaId: 1,
      toaNha: 'Tòa Central',
      diaChiToaNha: '123 Cầu Giấy',
      soPhong: 'P.201',
      tang: 2,
      nguoiLienHeHoTen: 'Nguyễn Văn An',
      soDienThoaiLienHe: '0987654321',
      mucDo: 'GAP',
      tenMucDo: 'Gấp',
      trangThai: 'DANG_XU_LY',
      tenTrangThai: 'Đang xử lý',
      trangThaiHieuLuc: 'DANG_XU_LY',
      tenTrangThaiHieuLuc: 'Đang xử lý',
      phanCongLuc: '2026-11-01T08:00:00Z',
      taoLuc: '2026-11-01T07:30:00Z',
      daThanhToan: 0,
      conPhaiTra: 450000,
    },
  ],
  baoGiaCanBoSung: [],
  danhSachToa: [{ id: 1, ten: 'Tòa Central' }],
}

describe('App worker entry point (V2)', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    window.history.replaceState({}, '', '/')
    clearStoredToken()
  })

  afterEach(async () => {
    await act(async () => root?.unmount())
    container.remove()
    clearStoredToken()
    vi.restoreAllMocks()
  })

  it('sends worker to /tho/tong-quan overview dashboard while keeping navigation and topbar available', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url
      if (url === '/api/health') return jsonResponse({ status: 'UP', database: 'UP' })
      if (url === '/api/auth/me') {
        return jsonResponse({
          id: 4,
          hoTen: 'Lê Quốc Huy',
          soDienThoai: '0999000031',
          vaiTro: 'THO',
          tenVaiTro: 'Thợ sửa chữa',
        })
      }
      if (url.startsWith('/api/tho/tong-quan')) return jsonResponse(mockTongQuanData)
      if (url.startsWith('/api/tho/cong-viec')) return jsonResponse(mockTongQuanData.viecCanXuLy)
      if (url === '/api/thong-bao') return jsonResponse({ thongBao: [], soChuaDoc: 2 })
      throw new Error(`Unexpected request ${url}`)
    }))
    storeToken('worker-token')
    const historyLengthBeforeMount = window.history.length

    root = createRoot(container)
    await act(async () => root.render(<App />))

    await vi.waitFor(() => {
      expect(window.location.pathname).toBe('/tho/tong-quan')
    })

    expect(window.history.length).toBe(historyLengthBeforeMount)
    expect(container.querySelector('nav')).not.toBeNull()
    expect(container.textContent).toContain('Bàn làm việc thợ')
    expect(container.textContent).toContain('Tổng quan công việc của thợ')

    // Topbar notification badge
    expect(container.querySelector('[data-testid="topbar-notifications"]')?.getAttribute('href')).toBe('/thong-bao')
    expect(container.querySelector('[data-testid="topbar-unread-count"]')?.textContent).toBe('2')

    // Navigation links for THO
    expect(container.querySelector('nav a[href="/tho/tong-quan"]')).not.toBeNull()
    expect(container.querySelector('nav a[href="/viec-cua-toi"]')).not.toBeNull()
    expect(container.querySelector('nav a[href="/tho/chi-phi"]')).not.toBeNull()
    expect(container.querySelector('nav a[href="/thong-bao"]')).not.toBeNull()
  })

  it('lets a worker navigate to jobs screen /viec-cua-toi and open notifications', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url
      if (url === '/api/health') return jsonResponse({ status: 'UP', database: 'UP' })
      if (url === '/api/auth/me') {
        return jsonResponse({
          id: 4,
          hoTen: 'Lê Quốc Huy',
          soDienThoai: '0999000031',
          vaiTro: 'THO',
          tenVaiTro: 'Thợ sửa chữa',
        })
      }
      if (url.startsWith('/api/tho/tong-quan')) return jsonResponse(mockTongQuanData)
      if (url.startsWith('/api/tho/cong-viec')) return jsonResponse([])
      if (url === '/api/thong-bao') return jsonResponse({ thongBao: [], soChuaDoc: 0 })
      throw new Error(`Unexpected request ${url}`)
    }))
    storeToken('worker-token')

    root = createRoot(container)
    await act(async () => root.render(<App />))

    await vi.waitFor(() => {
      expect(window.location.pathname).toBe('/tho/tong-quan')
    })

    // Click on /viec-cua-toi navigation link
    const viecCuaToiLink = container.querySelector('nav a[href="/viec-cua-toi"]') as HTMLAnchorElement
    expect(viecCuaToiLink).not.toBeNull()
    await act(async () => viecCuaToiLink.click())

    await vi.waitFor(() => {
      expect(window.location.pathname).toBe('/viec-cua-toi')
      expect(container.textContent).toContain('Danh sách công việc')
    })

    // Open notifications
    const notificationLink = container.querySelector('[data-testid="topbar-notifications"]') as HTMLAnchorElement
    await act(async () => notificationLink.click())

    await vi.waitFor(() => {
      expect(window.location.pathname).toBe('/thong-bao')
      expect(container.querySelector('[data-testid="notification-screen"]')).not.toBeNull()
    })
  })
})
