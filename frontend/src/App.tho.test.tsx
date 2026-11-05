// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { clearStoredToken, storeToken } from './authSession'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

describe('App worker entry point', () => {
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

  it('FR-MNT-04 sends a worker to the work screen while keeping the shared app shell available', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url
      if (url === '/api/health') return jsonResponse({ status: 'UP', database: 'UP' })
      if (url === '/api/auth/me') {
        return jsonResponse({
          id: 4,
          hoTen: 'Thợ sửa chữa mẫu',
          soDienThoai: '0900000004',
          vaiTro: 'THO',
          tenVaiTro: 'Thợ sửa chữa',
        })
      }
      if (url === '/api/tho/viec-cua-toi') return jsonResponse([])
      if (url === '/api/thong-bao') return jsonResponse({ thongBao: [], soChuaDoc: 2 })
      throw new Error(`Unexpected request ${url}`)
    }))
    storeToken('worker-token')
    const historyLengthBeforeMount = window.history.length

    root = createRoot(container)
    await act(async () => root.render(<App />))

    await vi.waitFor(() => {
      expect(container.querySelector('[data-testid="worker-screen"]')).not.toBeNull()
    })
    expect(window.location.pathname).toBe('/viec-cua-toi')
    expect(window.history.length).toBe(historyLengthBeforeMount)
    expect(container.querySelector('nav')).not.toBeNull()
    expect(container.querySelector('[data-testid="topbar-notifications"]')?.getAttribute('href')).toBe('/thong-bao')
    expect(container.querySelector('[data-testid="topbar-unread-count"]')?.textContent).toBe('2')
    expect(container.querySelector('nav a[href="/thong-bao"]')).not.toBeNull()
    expect(container.textContent).toContain('Hôm nay không có việc nào.')
  })

  it('FR-MNT-04 lets a worker open the shared notification inbox from the shell', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url
      if (url === '/api/health') return jsonResponse({ status: 'UP', database: 'UP' })
      if (url === '/api/auth/me') {
        return jsonResponse({
          id: 4,
          hoTen: 'Thợ sửa chữa mẫu',
          soDienThoai: '0900000004',
          vaiTro: 'THO',
          tenVaiTro: 'Thợ sửa chữa',
        })
      }
      if (url === '/api/tho/viec-cua-toi') return jsonResponse([])
      if (url === '/api/thong-bao') return jsonResponse({ thongBao: [], soChuaDoc: 0 })
      throw new Error(`Unexpected request ${url}`)
    }))
    storeToken('worker-token')

    root = createRoot(container)
    await act(async () => root.render(<App />))

    const notificationLink = await vi.waitFor(() => {
      const link = container.querySelector('[data-testid="topbar-notifications"]')
      expect(link).not.toBeNull()
      return link as HTMLAnchorElement
    })
    await act(async () => notificationLink.click())

    await vi.waitFor(() => {
      expect(window.location.pathname).toBe('/thong-bao')
      expect(container.querySelector('[data-testid="notification-screen"]')).not.toBeNull()
    })
  })
})

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
