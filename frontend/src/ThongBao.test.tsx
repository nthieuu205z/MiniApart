// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThongBao } from './ThongBao'
import type { ThongTinThongBao } from './api'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

let container: HTMLDivElement
let root: Root

describe('ThongBao', () => {
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(async () => {
    await act(async () => root?.unmount())
    container.remove()
    vi.restoreAllMocks()
  })

  it('FR-MNT-02 FR-MNT-04 FR-INV-08 renders an inbox with unread count and human-readable content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      thongBao: [
        notificationFixture({ maThamChieu: '11111111-1111-4111-8111-111111111111', daDoc: false, hetHanLuc: '2026-09-10T12:00:00Z' }),
        notificationFixture({ maThamChieu: '22222222-2222-4222-8222-222222222222', daDoc: true, tieuDe: 'Hoá đơn mới' }),
      ],
      soChuaDoc: 1,
    })))

    await mount()

    await vi.waitFor(() => {
      expect(container.querySelectorAll('[data-testid="notification-item"]')).toHaveLength(2)
    })

    expect(container.querySelector('[data-testid="notification-unread-count"]')?.textContent).toContain('1 chưa đọc')
    expect(container.querySelectorAll('[data-testid="notification-item"]')[0]?.textContent).toContain('Phòng 302 báo hỏng')
    expect(container.querySelectorAll('[data-testid="notification-item"]')[0]?.textContent).toContain('Chưa đọc')
    expect(container.querySelectorAll('[data-testid="notification-item"]')[0]?.textContent).toContain('Hết hạn:')
    expect(container.textContent).not.toContain('YEU_CAU_SUA_CHUA')
    expect(container.textContent).not.toContain('id=')
  })

  it('NFR-USA-03 exposes a busy state while the inbox is loading', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)))

    await mount()

    expect(container.querySelector('[data-testid="notification-screen"]')?.getAttribute('aria-busy')).toBe('true')
    expect(container.querySelector('[data-testid="notification-loading"]')).not.toBeNull()
  })

  it('FR-MNT-02 gives the user a distinct empty state when there are no notifications', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ thongBao: [], soChuaDoc: 0 })))

    await mount()

    await vi.waitFor(() => {
      expect(container.querySelector('[data-testid="notification-empty"]')).not.toBeNull()
    })
    expect(container.textContent).toContain('Chưa có thông báo nào.')
  })

  it('FR-NTF-07 loads the immutable archive without changing the active unread badge', async () => {
    const archived = notificationFixture({ tieuDe: 'Thông báo đã hết hạn', daDoc: false })
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ thongBao: [], soChuaDoc: 0 }))
      .mockResolvedValueOnce(jsonResponse({ thongBao: [archived], soChuaDoc: 0 }))
    vi.stubGlobal('fetch', fetchMock)

    await mount()
    await vi.waitFor(() => expect(container.querySelector('[data-testid="notification-empty"]')).not.toBeNull())
    const archiveButton = [...container.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Kho lưu trữ')
    await act(async () => archiveButton?.click())

    await vi.waitFor(() => expect(container.querySelector('[data-testid="notification-item"]')?.textContent).toContain('Thông báo đã hết hạn'))
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/thong-bao/luu-tru', {
      headers: { Authorization: 'Bearer worker-token' },
    })
    expect(container.querySelector('[data-testid="notification-unread-count"]')).toBeNull()
  })

  it('FR-MNT-02 offers a retryable error state without exposing technical errors', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('database host leaked'))
    vi.stubGlobal('fetch', fetchMock)

    await mount()

    await vi.waitFor(() => {
      expect(container.querySelector('[data-testid="notification-error"]')).not.toBeNull()
    })
    expect(container.querySelector('[data-testid="notification-error"]')?.getAttribute('role')).toBe('alert')
    expect(container.textContent).toContain('Không tải được hộp thông báo.')
    expect(container.textContent).not.toContain('database host leaked')

    const retry = [...container.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Thử lại')
    expect(retry).not.toBeUndefined()
    await act(async () => retry?.click())
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('FR-MNT-02 marks one unread notification as read and updates the count in place', async () => {
    const notification = notificationFixture({ maThamChieu: '11111111-1111-4111-8111-111111111111', daDoc: false })
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ thongBao: [notification], soChuaDoc: 1 }))
      .mockResolvedValueOnce(jsonResponse({ ...notification, daDoc: true, docLuc: '2026-09-08T12:05:00Z' }))
    vi.stubGlobal('fetch', fetchMock)

    await mount()
    await vi.waitFor(() => expect(container.querySelector('[data-testid="mark-read"]')).not.toBeNull())

    await act(async () => (container.querySelector('[data-testid="mark-read"]') as HTMLButtonElement).click())

    await vi.waitFor(() => {
      expect(container.querySelector('[data-testid="notification-unread-count"]')?.textContent).toContain('0 chưa đọc')
    })
    expect(container.querySelector('[data-testid="notification-item"][data-read="true"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="mark-read"]')).toBeNull()
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/thong-bao/11111111-1111-4111-8111-111111111111/da-doc', {
      method: 'POST',
      headers: { Authorization: 'Bearer worker-token' },
    })
  })

  it('FR-MNT-02 keeps the unread badge accurate when two notifications are marked together', async () => {
    const firstRead = deferred<Response>()
    const secondRead = deferred<Response>()
    const first = notificationFixture({ maThamChieu: '11111111-1111-4111-8111-111111111111', daDoc: false })
    const second = notificationFixture({ maThamChieu: '22222222-2222-4222-8222-222222222222', daDoc: false, tieuDe: 'Hoá đơn mới' })
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ thongBao: [first, second], soChuaDoc: 2 }))
      .mockImplementationOnce(() => firstRead.promise)
      .mockImplementationOnce(() => secondRead.promise)
    const onUnreadCountChange = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await mount(onUnreadCountChange)
    await vi.waitFor(() => {
      expect(container.querySelectorAll('[data-testid="mark-read"]')).toHaveLength(2)
    })

    const [firstButton, secondButton] = [...container.querySelectorAll('[data-testid="mark-read"]')] as HTMLButtonElement[]
    await act(async () => {
      firstButton.click()
      secondButton.click()
    })

    await act(async () => {
      firstRead.resolve(jsonResponse({ ...first, daDoc: true, docLuc: '2026-09-08T12:05:00Z' }))
      secondRead.resolve(jsonResponse({ ...second, daDoc: true, docLuc: '2026-09-08T12:05:01Z' }))
      await Promise.all([firstRead.promise, secondRead.promise])
    })

    await vi.waitFor(() => {
      expect(onUnreadCountChange).toHaveBeenLastCalledWith(0)
    })
    expect(container.querySelector('[data-testid="notification-unread-count"]')?.textContent).toContain('0 chưa đọc')
  })

  it('FR-NTF-02 keeps one idempotency key across a send retry', async () => {
    let sendAttempts = 0
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/api/thong-bao') return jsonResponse({ thongBao: [], soChuaDoc: 0 })
      if (url === '/api/toa-nha') return jsonResponse([{ id: 1, ten: 'Toà A' }])
      if (url === '/api/thong-bao/chung/xem-truoc') return jsonResponse({ soNguoiNhan: 2, soPhongNhan: 2, soPhongKhongCoTaiKhoan: 0 })
      if (url === '/api/thong-bao/chung') {
        void init
        sendAttempts += 1
        if (sendAttempts === 1) throw new Error('temporary network failure')
        return jsonResponse({ maThamChieu: '33333333-3333-4333-8333-333333333333', soNguoiNhan: 2, soPhongNhan: 2, soPhongKhongCoTaiKhoan: 0 }, 201)
      }
      throw new Error(`unexpected request: ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    await mount(undefined, 'QUAN_LY')
    await vi.waitFor(() => expect(container.querySelector('[data-testid="open-common-notification"]')).not.toBeNull())
    await act(async () => (container.querySelector('[data-testid="open-common-notification"]') as HTMLButtonElement).click())
    await vi.waitFor(() => expect(container.querySelector('form')).not.toBeNull())
    const form = container.querySelector('form') as HTMLFormElement
    await act(async () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    await vi.waitFor(() => expect(container.textContent).toContain('2 tài khoản'))

    const sendButton = [...container.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Gửi thông báo') as HTMLButtonElement
    await act(async () => sendButton.click())
    await vi.waitFor(() => expect(container.textContent).toContain('Không thể gửi thông báo chung.'))
    const retryButton = [...container.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Gửi thông báo') as HTMLButtonElement
    await act(async () => retryButton.click())
    await vi.waitFor(() => expect(container.textContent).toContain('Đã gửi tới 2 tài khoản'))

    const sendCalls = fetchMock.mock.calls.filter(([input]) => String(input) === '/api/thong-bao/chung')
    expect(sendCalls).toHaveLength(2)
    const firstHeaders = (sendCalls[0]?.[1] as RequestInit).headers as Record<string, string>
    const secondHeaders = (sendCalls[1]?.[1] as RequestInit).headers as Record<string, string>
    expect(firstHeaders['Idempotency-Key']).toBeTruthy()
    expect(secondHeaders['Idempotency-Key']).toBe(firstHeaders['Idempotency-Key'])
  })

  it('FR-NTF-02 clears an old recipient preview when the form changes', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/thong-bao') return jsonResponse({ thongBao: [], soChuaDoc: 0 })
      if (url === '/api/toa-nha') return jsonResponse([{ id: 1, ten: 'Toà A' }])
      if (url === '/api/thong-bao/chung/xem-truoc') return jsonResponse({ soNguoiNhan: 1, soPhongNhan: 1, soPhongKhongCoTaiKhoan: 0 })
      throw new Error(`unexpected request: ${url}`)
    }))

    await mount(undefined, 'QUAN_LY')
    await vi.waitFor(() => expect(container.querySelector('[data-testid="open-common-notification"]')).not.toBeNull())
    await act(async () => (container.querySelector('[data-testid="open-common-notification"]') as HTMLButtonElement).click())
    await vi.waitFor(() => expect(container.querySelector('form')).not.toBeNull())
    const form = container.querySelector('form') as HTMLFormElement
    await act(async () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    await vi.waitFor(() => expect(container.textContent).toContain('1 tài khoản'))

    const title = container.querySelector('input[maxlength="255"]') as HTMLInputElement
    await setInput(title, 'Nội dung mới')
    await vi.waitFor(() => expect(container.textContent).not.toContain('1 tài khoản'))
    expect([...container.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Gửi thông báo')).toBeUndefined()
  })
})

function notificationFixture(overrides: Partial<ThongTinThongBao> = {}): ThongTinThongBao {
  return {
    maThamChieu: '11111111-1111-4111-8111-111111111111',
    tieuDe: 'Yêu cầu sửa chữa mới',
    noiDung: 'Phòng 302 báo hỏng: vòi nước bồn rửa bị rỉ — Gấp',
    daDoc: false,
    docLuc: null,
    taoLuc: '2026-09-08T12:00:00Z',
    ...overrides,
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function mount(onUnreadCountChange?: (count: number) => void, vaiTro?: string) {
  root = createRoot(container)
  await act(async () => {
    root.render(<ThongBao token="worker-token" vaiTro={vaiTro} onUnreadCountChange={onUnreadCountChange} />)
  })
}

async function setInput(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  setter?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
  await act(async () => undefined)
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}
