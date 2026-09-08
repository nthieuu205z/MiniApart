// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ViecCuaToi } from './ViecCuaToi'
import type { ThongTinViecCuaToi } from './api'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

let container: HTMLDivElement
let root: Root

describe('ViecCuaToi', () => {
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(async () => {
    await act(async () => root?.unmount())
    container.remove()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('FR-MNT-04 puts urgent work first and exposes the room, phone, and signed images without navigation', async () => {
    const work = [
      workFixture({ id: 7, soPhong: '401', mucDo: 'THUONG', tenMucDo: 'Thường', anh: [] }),
      workFixture({ id: 8, soPhong: '302', mucDo: 'KHAN_CAP', tenMucDo: 'Khẩn cấp', anh: [{ id: 801 }] }),
    ]
    const fetchMock = createFetchMock(work)
    vi.stubGlobal('fetch', fetchMock)

    await mount()

    await vi.waitFor(() => {
      expect(container.querySelectorAll('[data-testid="repair-task"]')).toHaveLength(2)
    })

    const rooms = [...container.querySelectorAll('[data-testid="repair-task"] h2')]
      .map((heading) => heading.textContent)
    expect(rooms).toEqual(['Phòng 302', 'Phòng 401'])
    expect(container.querySelector('a[href="tel:0907000110"]')?.textContent).toContain('0907000110')
    expect(container.querySelector('img[src="https://cdn.example/anh-801.jpg"]')).not.toBeNull()
    expect((container.querySelector('[data-task-id="8"] button') as HTMLButtonElement).style.minHeight).toBe('48px')
    expect(container.querySelector('nav')).toBeNull()
    expect(container.textContent).not.toContain('Tìm kiếm')
    expect(container.textContent).not.toContain('Bộ lọc')
  })

  it('NFR-USA-03 exposes an accessible busy state while the work list is loading', async () => {
    const fetchMock = vi.fn(() => new Promise<Response>(() => undefined))
    vi.stubGlobal('fetch', fetchMock)

    await mount()

    expect(container.querySelector('[data-testid="worker-screen"]')?.getAttribute('aria-busy')).toBe('true')
    expect(container.querySelector('[data-testid="worker-loading"]')).not.toBeNull()
  })

  it('FR-MNT-04 gives the worker the exact empty state when there are no active tasks', async () => {
    vi.stubGlobal('fetch', createFetchMock([]))

    await mount()

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Hôm nay không có việc nào.')
    })
    expect(container.querySelector('[data-testid="worker-error"]')).toBeNull()
  })

  it('FR-MNT-04 gives the worker an exact retryable error state', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'))
    vi.stubGlobal('fetch', fetchMock)

    await mount()

    await vi.waitFor(() => {
      expect(container.querySelector('[data-testid="worker-error"]')).not.toBeNull()
    })
    expect(container.textContent).toContain('Không tải được danh sách việc. Thử lại')
    expect(container.textContent).not.toContain('network down')

    const retry = [...container.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Thử lại')
    expect(retry).not.toBeUndefined()
    expect((retry as HTMLButtonElement).style.minHeight).toBe('44px')
    await act(async () => retry?.click())
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('FR-MNT-04 keeps independent undo windows when two tasks are completed close together', async () => {
    vi.useFakeTimers()
    const work = [
      workFixture({ id: 42, soPhong: '302', anh: [] }),
      workFixture({ id: 43, soPhong: '401', anh: [], mucDo: 'GAP', tenMucDo: 'Gấp' }),
    ]
    const fetchMock = createFetchMock(work)
    vi.stubGlobal('fetch', fetchMock)

    await mount()
    await vi.waitFor(() => expect(container.querySelectorAll('[data-testid="repair-task"]')).toHaveLength(2))

    const buttons = [...container.querySelectorAll('[data-testid="complete-work"]')] as HTMLButtonElement[]
    await act(async () => buttons[0].click())
    await act(async () => buttons[1].click())

    expect(container.querySelectorAll('[data-testid^="undo-"]')).toHaveLength(2)
    await act(async () => (container.querySelector('[data-testid="undo-42"] button') as HTMLButtonElement).click())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000)
    })

    expect(container.querySelector('[data-task-id="42"]')).not.toBeNull()
    expect(container.querySelector('[data-task-id="43"]')).toBeNull()
  })

  it('FR-MNT-04 exposes a retry when a signed image link cannot be loaded', async () => {
    let imageAttempts = 0
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url
      if (url === '/api/tho/viec-cua-toi') return jsonResponse([workFixture({ id: 51, anh: [{ id: 5101 }] })])
      if (url === '/api/anh/5101/lien-ket') {
        imageAttempts += 1
        if (imageAttempts === 1) throw new Error('signed link expired')
        return jsonResponse({ url: 'https://cdn.example/anh-5101.jpg' })
      }
      throw new Error(`Unexpected request ${url} ${init?.method ?? 'GET'}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    await mount()
    await vi.waitFor(() => expect(container.textContent).toContain('Không thể tải ảnh hiện trạng.'))
    const retryImage = [...container.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Thử tải ảnh lại')
    expect(retryImage).not.toBeUndefined()
    await act(async () => retryImage?.click())
    await vi.waitFor(() => expect(container.querySelector('img[src="https://cdn.example/anh-5101.jpg"]')).not.toBeNull())
  })

  it('FR-MNT-04 keeps a ten-second undo window and only then commits start followed by finish', async () => {
    vi.useFakeTimers()
    const work = [workFixture({ id: 42, anh: [] })]
    const fetchMock = createFetchMock(work)
    vi.stubGlobal('fetch', fetchMock)

    await mount()
    await vi.waitFor(() => expect(container.querySelector('[data-task-id="42"]')).not.toBeNull())

    const completeButton = container.querySelector('[data-task-id="42"] button') as HTMLButtonElement
    await act(async () => completeButton.click())

    expect(container.querySelector('[data-task-id="42"]')?.getAttribute('data-pending')).toBe('true')
    expect(container.textContent).toContain('Đã báo xong')
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(0)

    const undoButton = [...container.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Hoàn tác')
    expect(undoButton).not.toBeUndefined()
    await act(async () => undoButton?.click())
    expect(container.querySelector('[data-task-id="42"]')?.getAttribute('data-pending')).toBeNull()
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(0)

    await act(async () => (container.querySelector('[data-task-id="42"] button') as HTMLButtonElement).click())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000)
    })

    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/yeu-cau-sua-chua/42/bat-dau-xu-ly', {
      method: 'POST',
      headers: { Authorization: 'Bearer worker-token' },
    })
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/yeu-cau-sua-chua/42/hoan-thanh', {
      method: 'POST',
      headers: { Authorization: 'Bearer worker-token' },
    })
    expect(container.querySelector('[data-task-id="42"]')).toBeNull()
  })
})

function workFixture(overrides: Partial<ThongTinViecCuaToi> = {}): ThongTinViecCuaToi {
  return {
    id: 7,
    maYeuCau: 'SC-7',
    phongId: 302,
    soPhong: '302',
    tang: 3,
    toaNha: 'Toà A',
    hangMuc: 'Nước',
    moTa: 'Vòi nước bồn rửa bị rỉ',
    mucDo: 'KHAN_CAP',
    tenMucDo: 'Khẩn cấp',
    soDienThoaiLienHe: '0907000110',
    anh: [{ id: 801 }],
    trangThai: 'DA_PHAN_CONG',
    ...overrides,
  }
}

function createFetchMock(work: ThongTinViecCuaToi[]) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url
    if (url === '/api/tho/viec-cua-toi') return jsonResponse(work)
    if (url.startsWith('/api/anh/')) return jsonResponse({ url: `https://cdn.example/anh-${url.split('/')[3]}.jpg` })
    if (url.endsWith('/bat-dau-xu-ly')) return jsonResponse({ trangThai: 'DANG_XU_LY' })
    if (url.endsWith('/hoan-thanh')) return jsonResponse({ trangThai: 'CHO_XAC_NHAN' })
    throw new Error(`Unexpected request ${url} ${init?.method ?? 'GET'}`)
  })
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function mount() {
  root = createRoot(container)
  await act(async () => {
    root.render(<ViecCuaToi token="worker-token" />)
  })
}
