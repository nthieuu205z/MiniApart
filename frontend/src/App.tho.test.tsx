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

  it('FR-MNT-04 sends a worker straight to the only work screen without app navigation', async () => {
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
    expect(container.querySelector('nav')).toBeNull()
    expect(container.querySelector('[data-testid="app-top-bar"]')).toBeNull()
    expect(container.textContent).toContain('Hôm nay không có việc nào.')
  })
})

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
