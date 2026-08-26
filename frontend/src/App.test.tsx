// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { clearStoredToken, storeToken } from './authSession'
import type { ThongTinNguoiDung } from './api'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

type MountedApp = {
  container: HTMLDivElement
  root: Root
}

const MENU_BY_ROLE: Array<{
  nguoiDung: ThongTinNguoiDung
  menuLabels: string[]
}> = [
  {
    nguoiDung: {
      id: 1,
      hoTen: 'Quản trị hệ thống',
      soDienThoai: '0900000001',
      vaiTro: 'QTHT',
      tenVaiTro: 'Quản trị hệ thống',
    },
    menuLabels: ['Tài khoản', 'Toà nhà', 'Nhật ký thao tác'],
  },
  {
    nguoiDung: {
      id: 2,
      hoTen: 'Chủ sở hữu mẫu',
      soDienThoai: '0900000002',
      vaiTro: 'CHU',
      tenVaiTro: 'Chủ sở hữu',
    },
    menuLabels: ['Tổng quan', 'Toà nhà', 'Hoá đơn', 'Công nợ', 'Báo cáo', 'Sự cố', 'An toàn'],
  },
  {
    nguoiDung: {
      id: 3,
      hoTen: 'Quản lý Toà A',
      soDienThoai: '0900000003',
      vaiTro: 'QUAN_LY',
      tenVaiTro: 'Quản lý toà nhà',
    },
    menuLabels: ['Nhắc việc', 'Ghi chỉ số', 'Hoá đơn', 'Thu tiền', 'Phòng', 'Hợp đồng', 'Sự cố', 'Thông báo'],
  },
  {
    nguoiDung: {
      id: 4,
      hoTen: 'Thợ sửa chữa mẫu',
      soDienThoai: '0900000004',
      vaiTro: 'THO',
      tenVaiTro: 'Thợ sửa chữa',
    },
    menuLabels: ['Việc của tôi'],
  },
  {
    nguoiDung: {
      id: 5,
      hoTen: 'Người thuê mẫu',
      soDienThoai: '0900000006',
      vaiTro: 'NGUOI_THUE',
      tenVaiTro: 'Người thuê',
    },
    menuLabels: ['Hoá đơn của tôi', 'Lịch sử', 'Hợp đồng', 'Báo hỏng'],
  },
]

describe('App role navigation', () => {
  let mountedApp: MountedApp | null = null

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    vi.restoreAllMocks()
    clearStoredToken()
    window.history.replaceState({}, '', '/')
    document.body.innerHTML = ''
  })

  afterEach(async () => {
    if (mountedApp) {
      await act(async () => {
        mountedApp?.root.unmount()
      })
      mountedApp = null
    }
    clearStoredToken()
    vi.restoreAllMocks()
  })

  it.each(MENU_BY_ROLE)(
    'FR-AUT-04 shows the exact menu for server role $nguoiDung.vaiTro',
    async ({ nguoiDung, menuLabels }) => {
      mountedApp = await mountAuthenticatedApp(nguoiDung)

      await vi.waitFor(() => {
        expect(readMenuLabels(mountedApp!.container)).toEqual(menuLabels)
      })

      expect(mountedApp.container.textContent).toContain(nguoiDung.tenVaiTro)
      expect(mountedApp.container.textContent).toContain('Trang chủ')
    },
  )

  it('FR-AUT-04 shows a friendly no-permission state for a typed route outside the role menu', async () => {
    const chuSoHuu = MENU_BY_ROLE[1]
    mountedApp = await mountAuthenticatedApp(chuSoHuu.nguoiDung, '/tai-khoan')

    await vi.waitFor(() => {
      expect(mountedApp!.container.textContent).toContain('Không có quyền')
    })

    expect(readMenuLabels(mountedApp.container)).toEqual(chuSoHuu.menuLabels)
    expect(mountedApp.container.textContent).toContain('Đường dẫn không thuộc vai trò hiện tại')
  })
})

async function mountAuthenticatedApp(nguoiDung: ThongTinNguoiDung, path = '/') {
  storeToken('header.payload.signature')
  window.history.replaceState({}, '', path)
  vi.stubGlobal('fetch', buildFetchMock(nguoiDung))

  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)

  await act(async () => {
    root.render(<App />)
  })

  return { container, root }
}

function buildFetchMock(nguoiDung: ThongTinNguoiDung) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url

    if (url === '/api/health') {
      return new Response(JSON.stringify({ status: 'UP', database: 'UP' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (url === '/api/auth/me') {
      return new Response(JSON.stringify(nguoiDung), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    throw new Error(`Unexpected fetch: ${url}`)
  })
}

function readMenuLabels(container: HTMLDivElement) {
  return [...container.querySelectorAll('nav a')].map((link) => link.textContent?.trim() ?? '')
}
