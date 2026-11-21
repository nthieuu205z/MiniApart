// @vitest-environment jsdom

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { clearStoredToken } from './authSession'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

afterEach(() => {
  clearStoredToken()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('Màn đăng nhập', () => {
  it('lỗi server hiện ngay dưới ô mật khẩu, nối bằng aria-describedby', async () => {
    window.history.replaceState({}, '', '/')
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url
      if (url === '/api/auth/login') return json(401, { thongBao: 'Mật khẩu chưa đúng.' })
      return json(200, { status: 'UP', database: 'UP' })
    }))
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    await act(async () => { root.render(<App />) })
    const form = await vi.waitFor(() => {
      const f = container.querySelector('form')
      expect(f).not.toBeNull()
      return f as HTMLFormElement
    })
    const set = (el: HTMLInputElement, v: string) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(el, v)
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }
    const mk = form.querySelector('input[autocomplete="current-password"]') as HTMLInputElement
    expect(form.querySelector('input[autocomplete="username"]')).not.toBeNull()
    expect(form.querySelector('button[type="submit"]')).not.toBeNull()
    await act(async () => {
      set(form.querySelector('input[autocomplete="username"]') as HTMLInputElement, '0900000099')
      set(mk, 'sai')
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
    const err = await vi.waitFor(() => {
      const id = mk.getAttribute('aria-describedby')
      expect(id).toBeTruthy()
      const e = document.getElementById(id as string)
      expect(e?.textContent).toContain('Mật khẩu chưa đúng.')
      return e as HTMLElement
    })
    expect(mk.getAttribute('aria-invalid')).toBe('true')
    expect(err.getAttribute('role')).toBe('alert')
    await act(async () => root.unmount())
  })
})
