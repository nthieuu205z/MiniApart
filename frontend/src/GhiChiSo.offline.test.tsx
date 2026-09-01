// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import GhiChiSo from './GhiChiSo'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

let container: HTMLDivElement
let root: Root
let storage: Storage

describe('GhiChiSo offline flow', () => {
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    storage = createStorage()
    vi.stubGlobal('localStorage', storage)
    localStorage.clear()
  })

  afterEach(async () => {
    await act(async () => root?.unmount())
    container.remove()
    vi.restoreAllMocks()
    localStorage.clear()
    setOnlineState(true)
  })

  it('FR-MTR-05 saves pending readings on device while offline and auto-syncs them when the network returns', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([{ id: 1, ten: 'Toà A' }])
      if (url === '/api/toa-nha/1/ky-thanh-toan') return jsonResponse([{ id: 8, nam: 2026, thang: 8, trangThai: 'DANG_MO' }])
      if (url.endsWith('/chi-so') && init?.method === 'POST') {
        return jsonResponse({
          phongId: 11,
          dichVuId: 21,
          chiSoDau: '1240.00',
          chiSoCuoi: '1252.75',
          mucTieuThu: '12.75',
          coThayCongTo: false,
        }, 201)
      }
      if (url.endsWith('/thieu-chi-so')) return jsonResponse([])
      return jsonResponse({
        tongPhong: 1,
        daGhi: 0,
        phong: [
          { id: 11, soPhong: '101', tang: 1, dichVu: [{ id: 21, tenDichVu: 'Điện', donVi: 'kWh', chiSoDau: '1240.00', coThayCongTo: false }] },
        ],
      })
    })
    vi.stubGlobal('fetch', fetchMock)
    setOnlineState(false)

    await renderScreen()
    const input = await vi.waitFor(() => container.querySelector('input[name="chiSoCuoi-11-21"]') as HTMLInputElement)
    const saveButton = await vi.waitFor(() => container.querySelector('button[data-save-key="11-21"]') as HTMLButtonElement)

    await act(async () => {
      setInputValue(input, '1252.75')
    })

    await act(async () => {
      saveButton.click()
    })

    expect(fetchMock).not.toHaveBeenCalledWith(
      '/api/toa-nha/1/ky-thanh-toan/8/chi-so',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(container.textContent).toContain('Đang ngoại tuyến — đã lưu 1 phòng trên máy, sẽ tự gửi khi có mạng')
    expect(container.textContent).toContain('CHỜ GỬI')
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(localStorage.getItem('miniapart-ghi-chi-so-1-8')).toContain('"chiSoCuoi":"1252.75"')

    await act(async () => {
      setOnlineState(true)
      window.dispatchEvent(new Event('online'))
    })

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/toa-nha/1/ky-thanh-toan/8/chi-so',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ phongId: 11, dichVuId: 21, chiSoCuoi: '1252.75', coThayCongTo: false }),
      }),
    ), { timeout: 1500 })
    await vi.waitFor(() => expect(container.textContent).toContain('Đã gửi xong 1 phòng chờ gửi'), { timeout: 1500 })
    expect(container.textContent).not.toContain('CHỜ GỬI')
    expect(localStorage.getItem('miniapart-ghi-chi-so-1-8')).toBeNull()
  })

  it('FR-MTR-05 keeps pending readings and shows a readable message when sync hits a conflict', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([{ id: 1, ten: 'Toà A' }])
      if (url === '/api/toa-nha/1/ky-thanh-toan') return jsonResponse([{ id: 8, nam: 2026, thang: 8, trangThai: 'DANG_MO' }])
      if (url.endsWith('/chi-so') && init?.method === 'POST') {
        return jsonResponse({ thongBao: 'Phòng 101 đã được ghi ở nơi khác. Giữ lại bản chờ gửi để bạn chọn cách xử lý.' }, 409)
      }
      if (url.endsWith('/thieu-chi-so')) return jsonResponse([])
      return jsonResponse({
        tongPhong: 1,
        daGhi: 0,
        phong: [
          { id: 11, soPhong: '101', tang: 1, dichVu: [{ id: 21, tenDichVu: 'Điện', donVi: 'kWh', chiSoDau: '1240.00', coThayCongTo: false }] },
        ],
      })
    })
    vi.stubGlobal('fetch', fetchMock)
    setOnlineState(false)

    await renderScreen()
    const input = await vi.waitFor(() => container.querySelector('input[name="chiSoCuoi-11-21"]') as HTMLInputElement)
    const saveButton = await vi.waitFor(() => container.querySelector('button[data-save-key="11-21"]') as HTMLButtonElement)

    await act(async () => {
      setInputValue(input, '1252.75')
    })

    await act(async () => {
      saveButton.click()
    })

    setOnlineState(true)
    await act(async () => {
      window.dispatchEvent(new Event('online'))
    })

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/toa-nha/1/ky-thanh-toan/8/chi-so',
      expect.objectContaining({ method: 'POST' }),
    ))
    await vi.waitFor(() => expect(container.querySelector('[role="alert"]')?.textContent).toContain('Phòng 101 đã được ghi ở nơi khác.'))
    expect(container.textContent).toContain('CHỜ GỬI')
    expect(localStorage.getItem('miniapart-ghi-chi-so-1-8')).toContain('"chiSoCuoi":"1252.75"')
  })

  it('FR-MTR-05 restores the stored queue and replacement draft after the server payload loads', async () => {
    const storedState = {
      banNhap: {
        '11-21': {
          chiSoCuoi: '1252.75',
          coThayCongTo: true,
          chiSoCuoiCongToCu: '1240.00',
          chiSoDauCongToMoi: '0.00',
        },
      },
      hangCho: {
        '11-21': {
          phongId: 11,
          dichVuId: 21,
          chiSoCuoi: '1252.75',
          coThayCongTo: true,
          chiSoCuoiCongToCu: '1240.00',
          chiSoDauCongToMoi: '0.00',
        },
      },
    }
    localStorage.setItem('miniapart-ghi-chi-so-1-8', JSON.stringify(storedState))
    setOnlineState(false)

    let resolvePayload!: (response: Response) => void
    const payload = new Promise<Response>((resolve) => {
      resolvePayload = resolve
    })
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([{ id: 1, ten: 'Toà A' }])
      if (url === '/api/toa-nha/1/ky-thanh-toan') return jsonResponse([{ id: 8, nam: 2026, thang: 8, trangThai: 'DANG_MO' }])
      if (url.endsWith('/thieu-chi-so')) return jsonResponse([])
      return payload
    })
    vi.stubGlobal('fetch', fetchMock)

    await renderScreen()
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/toa-nha/1/ky-thanh-toan/8/chi-so', expect.anything()))
    expect(localStorage.getItem('miniapart-ghi-chi-so-1-8')).toContain('"chiSoCuoi":"1252.75"')

    await act(async () => {
      resolvePayload(jsonResponse({
        tongPhong: 1,
        daGhi: 0,
        phong: [{
          id: 11,
          soPhong: '101',
          tang: 1,
          dichVu: [{ id: 21, tenDichVu: 'Điện', donVi: 'kWh', chiSoDau: '1240.00', coThayCongTo: false }],
        }],
      }))
    })

    await vi.waitFor(() => expect(container.querySelector('input[name="chiSoCuoi-11-21"]')).not.toBeNull())
    const input = container.querySelector('input[name="chiSoCuoi-11-21"]') as HTMLInputElement
    expect(input.value).toBe('1252.75')
    expect((container.querySelector('input[name="coThayCongTo-11-21"]') as HTMLInputElement).checked).toBe(true)
    expect((container.querySelector('input[name="chiSoCuoiCongToCu-11-21"]') as HTMLInputElement).value).toBe('1240.00')
    expect((container.querySelector('input[name="chiSoDauCongToMoi-11-21"]') as HTMLInputElement).value).toBe('0.00')
    expect(container.textContent).toContain('CHỜ GỬI')
  })

  it('FR-MTR-05 restores the working building, period, rows, and queue when the server is unavailable on reload', async () => {
    const storedState = {
      banNhap: {
        '11-21': {
          chiSoCuoi: '1252.75',
          coThayCongTo: false,
          chiSoCuoiCongToCu: '',
          chiSoDauCongToMoi: '',
        },
      },
      hangCho: {
        '11-21': {
          phongId: 11,
          dichVuId: 21,
          chiSoCuoi: '1252.75',
          coThayCongTo: false,
        },
      },
    }
    localStorage.setItem('miniapart-ghi-chi-so-1-8', JSON.stringify(storedState))
    localStorage.setItem('miniapart-ghi-chi-so-bootstrap', JSON.stringify({
      toaNhaId: 1,
      kyId: 8,
      danhSachToaNha: [{ id: 1, ten: 'Toà A' }],
      danhSachKy: [{ id: 8, nam: 2026, thang: 8, trangThai: 'DANG_MO' }],
      duLieu: {
        tongPhong: 1,
        daGhi: 0,
        phong: [{
          id: 11,
          soPhong: '101',
          tang: 1,
          dichVu: [{ id: 21, tenDichVu: 'Điện', donVi: 'kWh', chiSoDau: '1240.00', coThayCongTo: false }],
        }],
      },
      danhSachPhongChuaGhiChiSo: [],
    }))
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('offline')
    }))
    setOnlineState(false)

    await renderScreen()

    await vi.waitFor(() => expect(container.querySelector('input[name="chiSoCuoi-11-21"]')).not.toBeNull())
    expect(container.textContent).toContain('Toà A')
    expect(container.textContent).toContain('Kỳ 8/2026')
    expect(container.textContent).toContain('101')
    expect((container.querySelector('input[name="chiSoCuoi-11-21"]') as HTMLInputElement).value).toBe('1252.75')
    expect(container.textContent).toContain('CHỜ GỬI')
  })

  it('FR-MTR-05 preserves the stored queue while the cached screen state is restoring', async () => {
    const storedState = {
      banNhap: {},
      hangCho: {
        '11-21': {
          phongId: 11,
          dichVuId: 21,
          chiSoCuoi: '1252.75',
          coThayCongTo: false,
        },
      },
    }
    localStorage.setItem('miniapart-ghi-chi-so-1-8', JSON.stringify(storedState))
    localStorage.setItem('miniapart-ghi-chi-so-bootstrap', JSON.stringify({
      toaNhaId: 1,
      kyId: 8,
      danhSachToaNha: [{ id: 1, ten: 'Toà A' }],
      danhSachKy: [{ id: 8, nam: 2026, thang: 8, trangThai: 'DANG_MO' }],
      duLieu: {
        tongPhong: 1,
        daGhi: 0,
        phong: [{
          id: 11,
          soPhong: '101',
          tang: 1,
          dichVu: [{ id: 21, tenDichVu: 'Điện', donVi: 'kWh', chiSoDau: '1240.00', coThayCongTo: false }],
        }],
      },
      danhSachPhongChuaGhiChiSo: [],
    }))
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('offline')
    }))
    setOnlineState(false)

    await renderScreen()

    await vi.waitFor(() => expect(container.textContent).toContain('CHỜ GỬI'))
    expect(localStorage.getItem('miniapart-ghi-chi-so-1-8')).toContain('"chiSoCuoi":"1252.75"')
  })
})

async function renderScreen() {
  root = createRoot(container)
  await act(async () => root.render(<GhiChiSo token="meter-token" />))
}

function setInputValue(input: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  valueSetter?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function setOnlineState(isOnline: boolean) {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    get: () => isOnline,
  })
}

function createStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    clear() {
      data.clear()
    },
    getItem(key) {
      return data.has(key) ? data.get(key) ?? null : null
    },
    key(index) {
      return Array.from(data.keys())[index] ?? null
    },
    removeItem(key) {
      data.delete(key)
    },
    setItem(key, value) {
      data.set(key, value)
    },
  }
}
