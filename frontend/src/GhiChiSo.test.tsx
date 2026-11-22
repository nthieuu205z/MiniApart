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

describe('GhiChiSo mobile screen', () => {
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(async () => {
    await act(async () => root?.unmount())
    container.remove()
    vi.restoreAllMocks()
    window.history.replaceState({}, '', '/')
  })

  it('FR-MTR-01 keeps the building from toaNhaId in the URL instead of falling back to the first building', async () => {
    window.history.replaceState({}, '', '/ghi-chi-so?toaNhaId=2')
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([{ id: 1, ten: 'Toà A' }, { id: 2, ten: 'Toà B' }])
      if (url === '/api/toa-nha/2/ky-thanh-toan') return jsonResponse([{ id: 8, nam: 2026, thang: 8, trangThai: 'DANG_MO' }])
      if (url === '/api/toa-nha/2/ky-thanh-toan/8/thieu-chi-so') return jsonResponse([])
      if (url === '/api/toa-nha/2/ky-thanh-toan/8/chi-so') return jsonResponse({ tongPhong: 0, daGhi: 0, phong: [] })
      throw new Error(`Unexpected request ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    await renderScreen()

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/toa-nha/2/ky-thanh-toan',
      expect.objectContaining({ headers: { Authorization: 'Bearer meter-token' } }),
    ))
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/api/toa-nha/1/'))).toBe(false)
  })

  it('FR-MTR-01 lists only eligible rooms with previous closing readings in floor-room order', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([{ id: 1, ten: 'Toà A' }])
      if (url === '/api/toa-nha/1/ky-thanh-toan') return jsonResponse([{ id: 8, nam: 2026, thang: 8, trangThai: 'DANG_MO' }])
      return jsonResponse({
        tongPhong: 2,
        daGhi: 0,
        phong: [
          { id: 11, soPhong: '101', tang: 1, dichVu: [{ id: 21, tenDichVu: 'Điện', donVi: 'kWh', chiSoDau: '1240.00' }] },
          { id: 12, soPhong: '201', tang: 2, dichVu: [{ id: 21, tenDichVu: 'Điện', donVi: 'kWh', chiSoDau: '980.00' }] },
        ],
      })
    }))

    await renderScreen()

    await vi.waitFor(() => expect(container.textContent).toContain('101'))
    expect(container.textContent).toContain('201')
    expect(container.textContent).toContain('0 / 2 phòng')
    expect((container.querySelector('input[name="chiSoCuoi-11-21"]') as HTMLInputElement).inputMode).toBe('decimal')
    expect((container.querySelector('input[name="chiSoCuoi-11-21"]') as HTMLInputElement).type).toBe('number')
  })

  it('NFR-USA-01 renders the dedicated mobile meter layout', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([{ id: 1, ten: 'Toà A' }])
      if (url === '/api/toa-nha/1/ky-thanh-toan') return jsonResponse([{ id: 8, nam: 2026, thang: 8, trangThai: 'DANG_MO' }])
      if (url.endsWith('/thieu-chi-so')) return jsonResponse([])
      return jsonResponse({ tongPhong: 1, daGhi: 0, phong: [{ id: 11, soPhong: '101', tang: 1, dichVu: [{ id: 21, tenDichVu: 'Điện', donVi: 'kWh', chiSoDau: '1240.00' }] }] })
    }))

    await renderScreen(true)

    await vi.waitFor(() => expect(container.querySelector('[data-testid="meter-screen"]')).not.toBeNull())
    expect(container.querySelector('[data-layout-variant="mobile"]')).not.toBeNull()
    expect(container.querySelector('[data-mobile-meter-list]')).not.toBeNull()
  })

  it('FR-MTR-02 calculates consumption immediately and advances focus after saving one room', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([{ id: 1, ten: 'Toà A' }])
      if (url === '/api/toa-nha/1/ky-thanh-toan') return jsonResponse([{ id: 8, nam: 2026, thang: 8, trangThai: 'DANG_MO' }])
      if (url.endsWith('/chi-so') && init?.method === 'POST') return jsonResponse({ phongId: 11, chiSoDau: '1240.00', chiSoCuoi: '1252.75', mucTieuThu: '12.75' }, 201)
      return jsonResponse({
        tongPhong: 2,
        daGhi: 0,
        phong: [
          { id: 11, soPhong: '101', tang: 1, dichVu: [{ id: 21, tenDichVu: 'Điện', donVi: 'kWh', chiSoDau: '1240.00' }] },
          { id: 12, soPhong: '201', tang: 2, dichVu: [{ id: 21, tenDichVu: 'Điện', donVi: 'kWh', chiSoDau: '980.00' }] },
        ],
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    await renderScreen()
    const firstInput = await vi.waitFor(() => container.querySelector('input[name="chiSoCuoi-11-21"]') as HTMLInputElement)

    await act(async () => {
      setInputValue(firstInput, '1252.75')
    })

    expect(container.textContent).toContain('Mức tiêu thụ: 12.75 kWh')

    await act(async () => {
      firstInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/toa-nha/1/ky-thanh-toan/8/chi-so',
      expect.objectContaining({ method: 'POST' }),
    ))
    await vi.waitFor(() => expect(document.activeElement).toBe(container.querySelector('input[name="chiSoCuoi-12-21"]')))
    expect(container.textContent).toContain('1 / 2 phòng')
  })

  it('FR-MTR-02 keeps room progress incomplete until every metered service in that room is saved', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([{ id: 1, ten: 'Toà A' }])
      if (url === '/api/toa-nha/1/ky-thanh-toan') return jsonResponse([{ id: 8, nam: 2026, thang: 8, trangThai: 'DANG_MO' }])
      if (url.endsWith('/chi-so') && init?.method === 'POST') {
        const body = JSON.parse(String(init.body))
        if (body.dichVuId === 21) {
          return jsonResponse({ phongId: 11, dichVuId: 21, chiSoDau: '1240.00', chiSoCuoi: '1252.75', mucTieuThu: '12.75' }, 201)
        }
        return jsonResponse({ phongId: 11, dichVuId: 22, chiSoDau: '45.00', chiSoCuoi: '51.25', mucTieuThu: '6.25' }, 201)
      }
      return jsonResponse({
        tongPhong: 1,
        daGhi: 0,
        phong: [
          {
            id: 11,
            soPhong: '101',
            tang: 1,
            dichVu: [
              { id: 21, tenDichVu: 'Điện', donVi: 'kWh', chiSoDau: '1240.00' },
              { id: 22, tenDichVu: 'Nước', donVi: 'm3', chiSoDau: '45.00' },
            ],
          },
        ],
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    await renderScreen()
    const dienInput = await vi.waitFor(() => container.querySelector('input[name="chiSoCuoi-11-21"]') as HTMLInputElement)
    const nuocInput = await vi.waitFor(() => container.querySelector('input[name="chiSoCuoi-11-22"]') as HTMLInputElement)

    await act(async () => {
      setInputValue(dienInput, '1252.75')
    })

    await act(async () => {
      dienInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/toa-nha/1/ky-thanh-toan/8/chi-so',
      expect.objectContaining({ method: 'POST' }),
    ))
    expect(container.textContent).toContain('0 / 1 phòng')

    await act(async () => {
      setInputValue(nuocInput, '51.25')
    })

    await act(async () => {
      nuocInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })

    await vi.waitFor(() => expect(container.textContent).toContain('1 / 1 phòng'))
  })

  it('FR-MTR-04 presents exact anomalous-consumption details and saves only after confirmation', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([{ id: 1, ten: 'Toà A' }])
      if (url === '/api/toa-nha/1/ky-thanh-toan') return jsonResponse([{ id: 8, nam: 2026, thang: 8, trangThai: 'DANG_MO' }])
      if (url.endsWith('/chi-so') && init?.method === 'POST') {
        return jsonResponse({
          phongId: 11,
          dichVuId: 21,
          chiSoDau: '136.00',
          chiSoCuoi: '160.00',
          mucTieuThu: '24.00',
          coThayCongTo: false,
          canhBaoTieuThuBatThuong: {
            coCanhBao: true,
            thongBaoCanhBao: 'Mức tiêu thụ kỳ này là 24.00, trung bình ba kỳ trước là 12.00, gấp 2.00 lần.',
            mucTieuThuKyNay: '24.00',
            trungBinhBaKyTruoc: '12.00',
            gapTrungBinh: '2.00',
            nguongCanhBao: '1.50',
          },
        }, 201)
      }
      return jsonResponse({
        tongPhong: 1,
        daGhi: 0,
        phong: [{
          id: 11,
          soPhong: '101',
          tang: 1,
          dichVu: [{
            id: 21,
            tenDichVu: 'Điện',
            donVi: 'kWh',
            chiSoDau: '136.00',
            coThayCongTo: false,
            thongTinCanhBaoTieuThu: {
              soKyLichSu: 3,
              trungBinhBaKyTruoc: '12.00',
              nguongCanhBao: '1.50',
            },
          }],
        }],
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    await renderScreen()
    const input = await vi.waitFor(() => container.querySelector('input[name="chiSoCuoi-11-21"]') as HTMLInputElement)

    await act(async () => {
      setInputValue(input, '160.00')
    })

    expect(container.textContent).toContain('Mức tiêu thụ kỳ này là 24.00, trung bình ba kỳ trước là 12.00, gấp 2.00 lần.')
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('24.00')
    expect(fetchMock).not.toHaveBeenCalledWith(
      '/api/toa-nha/1/ky-thanh-toan/8/chi-so',
      expect.objectContaining({ method: 'POST' }),
    )

    const confirmButton = container.querySelector('button[data-confirm-warning-key="11-21"]') as HTMLButtonElement
    await act(async () => {
      confirmButton.click()
    })

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/toa-nha/1/ky-thanh-toan/8/chi-so',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ phongId: 11, dichVuId: 21, chiSoCuoi: '160.00', coThayCongTo: false, xacNhanCanhBao: true }),
      }),
    ))
  })

  it('FR-MTR-04 re-saves a persisted acknowledged anomaly without showing confirmation again', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([{ id: 1, ten: 'Toà A' }])
      if (url === '/api/toa-nha/1/ky-thanh-toan') return jsonResponse([{ id: 8, nam: 2026, thang: 8, trangThai: 'DANG_MO' }])
      if (url.endsWith('/chi-so') && init?.method === 'POST') {
        return jsonResponse({
          phongId: 11,
          dichVuId: 21,
          chiSoDau: '136.00',
          chiSoCuoi: '160.00',
          mucTieuThu: '24.00',
          coThayCongTo: false,
          canhBaoTieuThuBatThuong: {
            coCanhBao: true,
          },
        }, 201)
      }
      return jsonResponse({
        tongPhong: 1,
        daGhi: 1,
        phong: [{
          id: 11,
          soPhong: '101',
          tang: 1,
          dichVu: [{
            id: 21,
            tenDichVu: 'Điện',
            donVi: 'kWh',
            chiSoDau: '136.00',
            chiSoCuoi: '160.00',
            mucTieuThu: '24.00',
            coThayCongTo: false,
            daXacNhanCanhBao: true,
            thongTinCanhBaoTieuThu: {
              soKyLichSu: 3,
              trungBinhBaKyTruoc: '12.00',
              nguongCanhBao: '1.50',
            },
          }],
        }],
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    await renderScreen()
    await moSua()

    expect(container.querySelector('button[data-confirm-warning-key="11-21"]')).toBeNull()
    const saveButton = await vi.waitFor(() => container.querySelector('button[data-save-key="11-21"]') as HTMLButtonElement)
    expect(saveButton.disabled).toBe(false)

    await act(async () => {
      saveButton.click()
    })

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/toa-nha/1/ky-thanh-toan/8/chi-so',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ phongId: 11, dichVuId: 21, chiSoCuoi: '160.00', coThayCongTo: false }),
      }),
    ))
  })

  it('FR-MTR-06 exposes a camera-capture input for meter photos', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([{ id: 1, ten: 'Toà A' }])
      if (url === '/api/toa-nha/1/ky-thanh-toan') return jsonResponse([{ id: 8, nam: 2026, thang: 8, trangThai: 'DANG_MO' }])
      return jsonResponse({
        tongPhong: 1,
        daGhi: 0,
        phong: [
          { id: 11, soPhong: '101', tang: 1, dichVu: [{ id: 21, tenDichVu: 'Điện', donVi: 'kWh', chiSoDau: '1240.00' }] },
        ],
      })
    }))

    await renderScreen()

    const photoInput = await vi.waitFor(() => container.querySelector('input[name="anhCongTo-11-21"]') as HTMLInputElement)
    expect(photoInput.type).toBe('file')
    expect(photoInput.accept).toBe('image/*')
    expect(photoInput.getAttribute('capture')).toBe('environment')
  })

  it('FR-MTR-08 shows missing rooms and jumps to the matching room input when selected', async () => {
    const missingRooms = [{ id: 11, soPhong: '101', tang: 1 }]
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([{ id: 1, ten: 'Toà A' }])
      if (url === '/api/toa-nha/1/ky-thanh-toan') return jsonResponse([{ id: 8, nam: 2026, thang: 8, trangThai: 'DANG_MO' }])
      if (url === '/api/toa-nha/1/ky-thanh-toan/8/thieu-chi-so') return jsonResponse(missingRooms)
      if (url === '/api/toa-nha/1/ky-thanh-toan/8/chot' && init?.method === 'POST') {
        return jsonResponse(missingRooms, 409)
      }
      return jsonResponse({
        tongPhong: 1,
        daGhi: 0,
        phong: [
          { id: 11, soPhong: '101', tang: 1, dichVu: [{ id: 21, tenDichVu: 'Điện', donVi: 'kWh', chiSoDau: '1240.00' }] },
        ],
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    await renderScreen()
    await vi.waitFor(() => expect(container.textContent).toContain('Phòng còn thiếu'))
    await vi.waitFor(() => expect(container.textContent).toContain('101'))

    const roomButton = await vi.waitFor(() => container.querySelector('button[data-missing-room-key="11"]') as HTMLButtonElement)
    await act(async () => {
      roomButton.click()
    })

    expect(document.activeElement).toBe(container.querySelector('input[name="chiSoCuoi-11-21"]'))

    const closeButton = await vi.waitFor(() => container.querySelector('button[data-close-period]') as HTMLButtonElement)
    await act(async () => {
      closeButton.click()
    })

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/toa-nha/1/ky-thanh-toan/8/chot',
      expect.objectContaining({ method: 'POST' }),
    ))
    await vi.waitFor(() => expect(container.textContent).toContain('Phòng còn thiếu'))
  })

  it('anNutChot ẩn nút Chốt kỳ nhưng vẫn tải dữ liệu kỳ', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([{ id: 1, ten: 'Toà A' }])
      if (url === '/api/toa-nha/1/ky-thanh-toan') return jsonResponse([{ id: 8, nam: 2026, thang: 8, trangThai: 'DANG_MO' }])
      if (url.endsWith('/thieu-chi-so')) return jsonResponse([])
      return jsonResponse({ tongPhong: 0, daGhi: 0, phong: [] })
    }))
    root = createRoot(container)
    await act(async () => root.render(<GhiChiSo token="meter-token" anNutChot />))
    await vi.waitFor(() => expect(container.textContent).toContain('Kỳ 8/2026'))
    expect(container.querySelector('button[data-close-period]')).toBeNull()
  })

  it('FR-MTR-08 blocks closing when the selected period is already closed', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([{ id: 1, ten: 'Toà A' }])
      if (url === '/api/toa-nha/1/ky-thanh-toan') return jsonResponse([{ id: 8, nam: 2026, thang: 8, trangThai: 'DA_CHOT' }])
      if (url === '/api/toa-nha/1/ky-thanh-toan/8/thieu-chi-so') return jsonResponse([])
      return jsonResponse({
        tongPhong: 1,
        daGhi: 1,
        phong: [
          { id: 11, soPhong: '101', tang: 1, dichVu: [{ id: 21, tenDichVu: 'Điện', donVi: 'kWh', chiSoDau: '1240.00', chiSoCuoi: '1250.00', mucTieuThu: '10.00', coThayCongTo: false }] },
        ],
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    await renderScreen()

    const closeButton = await vi.waitFor(() => container.querySelector('button[data-close-period]') as HTMLButtonElement)
    expect(closeButton.disabled).toBe(false)
    expect(closeButton.getAttribute('aria-disabled')).toBe('true')
    closeButton.focus()
    expect(document.activeElement).toBe(closeButton)
  })

  it('FR-MTR-03 blocks lower readings until replacement meter is declared', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([{ id: 1, ten: 'Toà A' }])
      if (url === '/api/toa-nha/1/ky-thanh-toan') return jsonResponse([{ id: 8, nam: 2026, thang: 8, trangThai: 'DANG_MO' }])
      if (url.endsWith('/chi-so') && init?.method === 'POST') {
        return jsonResponse({
          phongId: 11, dichVuId: 21, chiSoDau: '1240.00', chiSoCuoi: '1239.99', mucTieuThu: '1239.99', coThayCongTo: true,
          chiSoCuoiCongToCu: '1240.00', chiSoDauCongToMoi: '0.00',
        }, 201)
      }
      return jsonResponse({
        tongPhong: 1,
        daGhi: 0,
        phong: [
          { id: 11, soPhong: '101', tang: 1, dichVu: [{ id: 21, tenDichVu: 'Điện', donVi: 'kWh', chiSoDau: '1240.00' }] },
        ],
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    await renderScreen()
    const input = await vi.waitFor(() => container.querySelector('input[name="chiSoCuoi-11-21"]') as HTMLInputElement)
    const replacementCheckbox = await vi.waitFor(() => container.querySelector('input[name="coThayCongTo-11-21"]') as HTMLInputElement)
    const saveButton = await vi.waitFor(() => container.querySelector('button[data-save-key="11-21"]') as HTMLButtonElement)

    await act(async () => {
      setInputValue(input, '1239.99')
    })

    expect(container.textContent).toContain("Chỉ số mới không được nhỏ hơn chỉ số cũ (1240.00). Nếu vừa thay công tơ, hãy chọn 'Thay công tơ'.")
    expect(saveButton.disabled).toBe(false)
    expect(saveButton.getAttribute('aria-disabled')).toBe('true')

    await act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })

    expect(fetchMock).not.toHaveBeenCalledWith(
      '/api/toa-nha/1/ky-thanh-toan/8/chi-so',
      expect.objectContaining({ method: 'POST' }),
    )

    await act(async () => {
      replacementCheckbox.click()
    })

    expect(container.textContent).not.toContain("Chỉ số mới không được nhỏ hơn chỉ số cũ (1240.00). Nếu vừa thay công tơ, hãy chọn 'Thay công tơ'.")
    const chiSoCuoiCongToCu = container.querySelector('input[name="chiSoCuoiCongToCu-11-21"]') as HTMLInputElement
    const chiSoDauCongToMoi = container.querySelector('input[name="chiSoDauCongToMoi-11-21"]') as HTMLInputElement
    await act(async () => {
      setInputValue(chiSoCuoiCongToCu, '1240.00')
      setInputValue(chiSoDauCongToMoi, '0.00')
    })
    expect(saveButton.disabled).toBe(false)

    await act(async () => {
      saveButton.click()
    })

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/toa-nha/1/ky-thanh-toan/8/chi-so',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          phongId: 11, dichVuId: 21, chiSoCuoi: '1239.99', coThayCongTo: true,
          chiSoCuoiCongToCu: '1240.00', chiSoDauCongToMoi: '0.00',
        }),
      }),
    ))
  })

  it('FR-MTR-09 CR-004 BR-09 reveals replacement inputs and saves their two-segment consumption through JSON', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([{ id: 1, ten: 'Toà A' }])
      if (url === '/api/toa-nha/1/ky-thanh-toan') return jsonResponse([{ id: 8, nam: 2026, thang: 8, trangThai: 'DANG_MO' }])
      if (url.endsWith('/chi-so') && init?.method === 'POST') return jsonResponse({
        phongId: 11, dichVuId: 21, chiSoDau: '1240.00', chiSoCuoi: '15.25', mucTieuThu: '50.75', coThayCongTo: true,
        chiSoCuoiCongToCu: '1275.50', chiSoDauCongToMoi: '0.00',
      }, 201)
      return jsonResponse({
        tongPhong: 1,
        daGhi: 0,
        phong: [{ id: 11, soPhong: '101', tang: 1, dichVu: [{ id: 21, tenDichVu: 'Điện', donVi: 'kWh', chiSoDau: '1240.00', coThayCongTo: false }] }],
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    await renderScreen()
    expect(container.querySelector('input[name="chiSoCuoiCongToCu-11-21"]')).toBeNull()
    expect(container.querySelector('input[name="chiSoDauCongToMoi-11-21"]')).toBeNull()

    const checkbox = await vi.waitFor(() => container.querySelector('input[name="coThayCongTo-11-21"]') as HTMLInputElement)
    await act(async () => checkbox.click())

    const chiSoCuoi = container.querySelector('input[name="chiSoCuoi-11-21"]') as HTMLInputElement
    const chiSoCuoiCongToCu = container.querySelector('input[name="chiSoCuoiCongToCu-11-21"]') as HTMLInputElement
    const chiSoDauCongToMoi = container.querySelector('input[name="chiSoDauCongToMoi-11-21"]') as HTMLInputElement
    expect(chiSoCuoiCongToCu).toBeTruthy()
    expect(chiSoDauCongToMoi).toBeTruthy()

    await act(async () => {
      setInputValue(chiSoCuoi, '15.25')
      setInputValue(chiSoCuoiCongToCu, '1275.50')
      setInputValue(chiSoDauCongToMoi, '0.00')
    })

    expect(container.textContent).toContain('Mức tiêu thụ: 50.75 kWh')
    await act(async () => (container.querySelector('button[data-save-key="11-21"]') as HTMLButtonElement).click())

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/toa-nha/1/ky-thanh-toan/8/chi-so',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          phongId: 11, dichVuId: 21, chiSoCuoi: '15.25', coThayCongTo: true,
          chiSoCuoiCongToCu: '1275.50', chiSoDauCongToMoi: '0.00',
        }),
      }),
    ))
  })

  it('FR-MTR-03 re-saves a server-marked replacement meter with its persisted flag', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([{ id: 1, ten: 'Toà A' }])
      if (url === '/api/toa-nha/1/ky-thanh-toan') return jsonResponse([{ id: 8, nam: 2026, thang: 8, trangThai: 'DANG_MO' }])
      if (url.endsWith('/chi-so') && init?.method === 'POST') {
        return jsonResponse({
          phongId: 11, dichVuId: 21, chiSoDau: '1240.00', chiSoCuoi: '1239.99', mucTieuThu: '1239.99', coThayCongTo: true,
          chiSoCuoiCongToCu: '1240.00', chiSoDauCongToMoi: '0.00',
        }, 201)
      }
      return jsonResponse({
        tongPhong: 1,
        daGhi: 1,
        phong: [
          {
            id: 11, soPhong: '101', tang: 1,
            dichVu: [{
              id: 21, tenDichVu: 'Điện', donVi: 'kWh', chiSoDau: '1240.00', chiSoCuoi: '1239.99', coThayCongTo: true,
              chiSoCuoiCongToCu: '1240.00', chiSoDauCongToMoi: '0.00',
            }],
          },
        ],
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const savePromise = new Promise<void>((resolve, reject) => {
      let timeoutId: ReturnType<typeof setTimeout> | undefined
      const observer = new MutationObserver(() => {
        const input = container.querySelector('input[name="chiSoCuoi-11-21"]')
        const saveButton = container.querySelector('button[data-save-key="11-21"]')
        // Công tơ đã ghi nằm trong bảng gọn: phải bấm "Sửa" mới có ô nhập.
        if (!input) container.querySelector<HTMLButtonElement>('button[aria-label^="Sửa"]')?.click()
        if (!(input instanceof HTMLInputElement) || !(saveButton instanceof HTMLButtonElement)) return
        if (input.value !== '1239.99') {
          setInputValue(input, '1239.99')
          return
        }
        if (saveButton.disabled) return
        observer.disconnect()
        if (timeoutId !== undefined) clearTimeout(timeoutId)
        saveButton.click()
        resolve()
      })
      observer.observe(container, { childList: true, subtree: true, attributes: true })
      timeoutId = setTimeout(() => {
        observer.disconnect()
        reject(new Error('server-marked replacement meter was not saved'))
      }, 1000)
    })

    root = createRoot(container)
    root.render(<GhiChiSo token="meter-token" />)
    await savePromise

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/toa-nha/1/ky-thanh-toan/8/chi-so',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          phongId: 11, dichVuId: 21, chiSoCuoi: '1239.99', coThayCongTo: true,
          chiSoCuoiCongToCu: '1240.00', chiSoDauCongToMoi: '0.00',
        }),
      }),
    ))
  })

  it('NFR-USA-01 mobile only warns when consumption exceeds the backend threshold, not a fixed 1.5 ratio', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([{ id: 1, ten: 'Toà A' }])
      if (url === '/api/toa-nha/1/ky-thanh-toan') return jsonResponse([{ id: 8, nam: 2026, thang: 8, trangThai: 'DANG_MO' }])
      if (url.endsWith('/thieu-chi-so')) return jsonResponse([])
      return jsonResponse({
        tongPhong: 1,
        daGhi: 0,
        phong: [{
          id: 11,
          soPhong: '101',
          tang: 1,
          dichVu: [{ id: 21, tenDichVu: 'Điện', donVi: 'kWh', chiSoDau: '100.00', thongTinCanhBaoTieuThu: { soKyLichSu: 3, trungBinhBaKyTruoc: '12.00', nguongCanhBao: '2.00' } }],
        }],
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    await renderScreen(true)
    const input = await vi.waitFor(() => container.querySelector('input[name="chiSoCuoi-11-21"]') as HTMLInputElement)

    await act(async () => setInputValue(input, '121.60'))
    expect(container.textContent).toContain('TB 3 kỳ 12 kWh')
    expect(container.querySelector('[role="alert"]')).toBeNull()

    await act(async () => setInputValue(input, '125'))
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('Cao gấp 2,1 lần trung bình.')
  })

  it('NFR-USA-01 mobile primary button names the next meter or room after saving', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([{ id: 1, ten: 'Toà A' }])
      if (url === '/api/toa-nha/1/ky-thanh-toan') return jsonResponse([{ id: 8, nam: 2026, thang: 8, trangThai: 'DANG_MO' }])
      if (url.endsWith('/thieu-chi-so')) return jsonResponse([])
      if (url.endsWith('/chi-so') && init?.method === 'POST') return jsonResponse({ phongId: 11, dichVuId: 21, chiSoDau: '1240.00', chiSoCuoi: '1252.00', mucTieuThu: '12.00', coThayCongTo: false }, 201)
      return jsonResponse({
        tongPhong: 2,
        daGhi: 0,
        phong: [
          { id: 11, soPhong: '101', tang: 1, dichVu: [{ id: 21, tenDichVu: 'Điện', donVi: 'kWh', chiSoDau: '1240.00' }, { id: 22, tenDichVu: 'Nước', donVi: 'm3', chiSoDau: '45.00' }] },
          { id: 12, soPhong: '201', tang: 2, dichVu: [{ id: 21, tenDichVu: 'Điện', donVi: 'kWh', chiSoDau: '980.00' }] },
        ],
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    await renderScreen(true)
    const saveButton = await vi.waitFor(() => container.querySelector('button[data-save-key="11-21"]') as HTMLButtonElement)
    expect(saveButton.textContent).toContain('Lưu, sang 101 · Nước')

    await act(async () => setInputValue(container.querySelector('input[name="chiSoCuoi-11-21"]') as HTMLInputElement, '1252'))
    await act(async () => saveButton.click())

    await vi.waitFor(() => expect(container.querySelector('button[data-save-key="11-22"]')?.textContent).toContain('Lưu, sang 201 · Điện'))
    await vi.waitFor(() => expect(document.activeElement).toBe(container.querySelector('input[name="chiSoCuoi-11-22"]')))
  })
  describe('x8 bước 1 Chu kỳ tháng', () => {
    const duLieuHaiPhong = {
      tongPhong: 2,
      daGhi: 1,
      phong: [
        { id: 11, soPhong: '101', tang: 1, dichVu: [{ id: 21, tenDichVu: 'Điện', donVi: 'kWh', chiSoDau: '100.00', chiSoCuoi: '150.00', mucTieuThu: '50.00', coThayCongTo: false }] },
        { id: 12, soPhong: '201', tang: 2, dichVu: [{ id: 21, tenDichVu: 'Điện', donVi: 'kWh', chiSoDau: '980.00', coThayCongTo: false }, { id: 22, tenDichVu: 'Nước', donVi: 'm3', chiSoDau: '45.00', coThayCongTo: false }] },
      ],
    }
    const taoFetch = (postResponse: () => Response = () => jsonResponse({ phongId: 12, dichVuId: 21, chiSoDau: '980.00', chiSoCuoi: '1000.00', mucTieuThu: '20.00', coThayCongTo: false }, 201)) =>
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        if (url === '/api/toa-nha') return jsonResponse([{ id: 1, ten: 'Toà A' }])
        if (url === '/api/toa-nha/1/ky-thanh-toan') return jsonResponse([{ id: 8, nam: 2026, thang: 8, trangThai: 'DANG_MO' }])
        if (url.endsWith('/thieu-chi-so')) return jsonResponse([])
        if (url.endsWith('/chi-so') && init?.method === 'POST') return postResponse()
        return jsonResponse(duLieuHaiPhong)
      })

    it('desktop: công tơ chưa ghi hiện trước, phòng đã ghi nằm trong bảng gọn, chỉ một nút chính', async () => {
      vi.stubGlobal('fetch', taoFetch())
      await renderScreen()
      await vi.waitFor(() => expect(container.querySelector('#cong-to-12-21')).not.toBeNull())
      const chua = container.querySelector('#cong-to-12-21') as HTMLElement
      const bang = container.querySelector('table') as HTMLTableElement
      expect(chua.compareDocumentPosition(bang) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(bang.textContent).toContain('101')
      expect(bang.querySelector('input')).toBeNull()
      expect(container.querySelector('#cong-to-12-22')).not.toBeNull()
      expect(container.querySelectorAll('.btn-primary').length).toBe(1)
      expect(container.textContent).toContain('Chưa ghi (2)')
    })

    it('desktop: "Lưu k chỉ số" gửi từng ô đã nhập đúng URL và payload cũ', async () => {
      const fetchMock = taoFetch()
      vi.stubGlobal('fetch', fetchMock)
      await renderScreen()
      const dien = await vi.waitFor(() => container.querySelector('input[name="chiSoCuoi-12-21"]') as HTMLInputElement)
      const nuoc = container.querySelector('input[name="chiSoCuoi-12-22"]') as HTMLInputElement
      await act(async () => { setInputValue(dien, '1000'); setInputValue(nuoc, '50') })
      const nutLuu = container.querySelector('button[data-save-all]') as HTMLButtonElement
      expect(nutLuu.textContent).toBe('Lưu 2 chỉ số')
      await act(async () => nutLuu.click())
      await vi.waitFor(() => expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST').length).toBe(2))
      const bodies = fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST').map(([url, init]) => [url, JSON.parse(String(init?.body))])
      expect(bodies[0]).toEqual(['/api/toa-nha/1/ky-thanh-toan/8/chi-so', { phongId: 12, dichVuId: 21, chiSoCuoi: '1000', coThayCongTo: false }])
      expect(bodies[1][1]).toEqual({ phongId: 12, dichVuId: 22, chiSoCuoi: '50', coThayCongTo: false })
    })

    it('desktop: anNutChot không render khối chốt kỳ', async () => {
      vi.stubGlobal('fetch', taoFetch())
      root = createRoot(container)
      await act(async () => root.render(<GhiChiSo token="meter-token" anNutChot />))
      await vi.waitFor(() => expect(container.querySelector('#cong-to-12-21')).not.toBeNull())
      expect(container.querySelector('[data-close-period]')).toBeNull()
      expect(container.textContent).not.toContain('Chốt kỳ')
    })

    it('mobile: một công tơ mỗi màn; "Lưu, sang" gọi API một lần rồi chuyển công tơ kế', async () => {
      const fetchMock = taoFetch()
      vi.stubGlobal('fetch', fetchMock)
      await renderScreen(true)
      const nut = await vi.waitFor(() => container.querySelector('button[data-save-key="12-21"]') as HTMLButtonElement)
      expect(container.querySelectorAll('input[name^="chiSoCuoi-"]').length).toBe(1)
      expect(container.textContent).toContain('Bước 1/4 Ghi chỉ số · 1/3')
      expect(nut.textContent).toBe('Lưu, sang 201 · Nước')
      const o = container.querySelector('input[name="chiSoCuoi-12-21"]') as HTMLInputElement
      expect(o.inputMode).toBe('numeric')
      await act(async () => setInputValue(o, '1000'))
      await act(async () => nut.click())
      await vi.waitFor(() => expect(container.querySelector('input[name="chiSoCuoi-12-22"]')).not.toBeNull())
      expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST').length).toBe(1)
      expect((container.querySelector('button[data-save-key="12-22"]') as HTMLElement).textContent).toBe('Lưu và xong')
    })

    it('mobile: lỗi API giữ nguyên công tơ và số đã nhập, báo lỗi dưới ô', async () => {
      vi.stubGlobal('fetch', taoFetch(() => jsonResponse({ message: 'Máy chủ bận' }, 500)))
      await renderScreen(true)
      const nut = await vi.waitFor(() => container.querySelector('button[data-save-key="12-21"]') as HTMLButtonElement)
      await act(async () => setInputValue(container.querySelector('input[name="chiSoCuoi-12-21"]') as HTMLInputElement, '1000'))
      await act(async () => nut.click())
      await vi.waitFor(() => expect(container.querySelector('.ghi-m-loi')).not.toBeNull())
      expect((container.querySelector('input[name="chiSoCuoi-12-21"]') as HTMLInputElement).value).toBe('1000')
      expect(container.querySelector('input[name="chiSoCuoi-12-22"]')).toBeNull()
    })
  })

})

async function moSua() {
  const nut = await vi.waitFor(() => container.querySelector('button[aria-label^="Sửa"]') as HTMLButtonElement)
  await act(async () => nut.click())
}

async function renderScreen(mobile = false) {
  root = createRoot(container)
  await act(async () => root.render(<GhiChiSo token="meter-token" mobile={mobile} />))
}

function setInputValue(input: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  valueSetter?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
