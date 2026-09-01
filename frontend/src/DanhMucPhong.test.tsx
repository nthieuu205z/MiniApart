// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DanhMucPhong from './DanhMucPhong'

declare global { var IS_REACT_ACT_ENVIRONMENT: boolean | undefined }

let container: HTMLDivElement
let root: Root

const toaA = { id: 1, maToa: 'A', ten: 'Toà A', diaChi: '1 Đường A', soTang: 3, ngayChotSo: 28, soNgayHanTt: 7, tkNganHang: '0123', nguongThatThoat: '1.25', batBuocAnhCongTo: false }
const toaB = { ...toaA, id: 2, maToa: 'B', ten: 'Toà B' }
const phong101 = { id: 11, toaNhaId: 1, soPhong: '101', tang: 1, dienTich: '20.00', sucChua: 2, giaThueMacDinh: '2500000.00', loaiPhong: 'Studio', trangThai: 'DANG_THUE', tenTrangThai: 'Đang thuê' }
const phong201 = { ...phong101, id: 12, soPhong: '201', tang: 2, trangThai: 'TRONG', tenTrangThai: 'Trống' }

describe('DanhMucPhong', () => {
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

  it('FR-BLD-02 lists rooms for the selected building and reloads by floor filter', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([toaA, toaB])
      if (url === '/api/toa-nha/1/phong') return jsonResponse([phong101, phong201])
      if (url === '/api/toa-nha/1/phong?tang=2') return jsonResponse([phong201])
      return jsonResponse([])
    })
    vi.stubGlobal('fetch', fetchMock)

    await renderScreen()
    await vi.waitFor(() => expect(container.textContent).toContain('101'))
    expect(container.textContent).toContain('201')
    await select('tangLoc', '2')
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/toa-nha/1/phong?tang=2', expect.anything()))
    expect(container.textContent).toContain('201')
    expect(container.textContent).not.toContain('101')
  })

  it('FR-BLD-02 creates one room without a client-controlled status', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'POST') return jsonResponse({ ...phong101, id: 13, soPhong: '102', trangThai: 'TRONG', tenTrangThai: 'Trống' }, 201)
      if (String(input) === '/api/toa-nha') return jsonResponse([toaA])
      return jsonResponse([phong101])
    })
    vi.stubGlobal('fetch', fetchMock)

    await renderScreen()
    await vi.waitFor(() => expect(container.textContent).toContain('101'))
    await fill('soPhong', '102')
    await fill('loaiPhong', 'Studio')
    await act(async () => submitForm('room-form'))

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/toa-nha/1/phong', expect.objectContaining({
      method: 'POST', body: JSON.stringify({ soPhong: '102', tang: 1, dienTich: '20.00', sucChua: 2, giaThueMacDinh: '0.00', loaiPhong: 'Studio' }),
    })))
    expect(container.textContent).toContain('Trống')
  })

  it('FR-BLD-02 opens room detail with Enter and Space from the room map', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      if (String(input) === '/api/toa-nha') return jsonResponse([toaA])
      return jsonResponse([phong101])
    }))
    await renderScreen()
    const tile = await vi.waitFor(() => container.querySelector('[data-testid="room-tile"]') as HTMLButtonElement)
    await act(async () => tile.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })))
    await vi.waitFor(() => expect(container.querySelector('[data-testid="room-detail"]')?.textContent).toContain('Chi tiết phòng 101'))
  })

  it('FR-BLD-02 previews a batch without creating it, then creates the exact preview only after confirmation', async () => {
    const preview = [{ ...phong101, id: null, soPhong: '301', tang: 3 }, { ...phong101, id: null, soPhong: '302', tang: 3 }]
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([toaA])
      if (url === '/api/toa-nha/1/phong') return jsonResponse([])
      if (url.endsWith('/xem-truoc') && init?.method === 'POST') return jsonResponse({ phong: preview })
      if (url === '/api/toa-nha/1/phong/hang-loat' && init?.method === 'POST') return jsonResponse({ phong: preview.map((phong, index) => ({ ...phong, id: 30 + index })) }, 201)
      return jsonResponse([])
    })
    vi.stubGlobal('fetch', fetchMock)

    await renderScreen()
    await vi.waitFor(() => expect(container.textContent).toContain('Xem trước dãy phòng'))
    await act(async () => clickButton('Xem trước dãy phòng'))
    await fillBatch('soBatDau', '301')
    await fillBatch('soKetThuc', '302')
    await fillBatch('loaiPhong', 'Studio')
    await act(async () => submitForm('room-batch-form'))
    await vi.waitFor(() => expect(container.textContent).toContain('301, 302'))
    expect(fetchMock).not.toHaveBeenCalledWith('/api/toa-nha/1/phong/hang-loat', expect.anything())
    await act(async () => clickButton('Xác nhận tạo dãy phòng'))
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/toa-nha/1/phong/hang-loat', expect.objectContaining({ method: 'POST' })))
  })

  it('FR-BLD-02 shows duplicate room numbers as a preview error and does not create them', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([toaA])
      if (url === '/api/toa-nha/1/phong') return jsonResponse([])
      if (url.endsWith('/xem-truoc') && init?.method === 'POST') return jsonResponse({ thongBao: 'Số phòng 301 đã tồn tại.' }, 409)
      return jsonResponse([])
    })
    vi.stubGlobal('fetch', fetchMock)

    await renderScreen()
    await vi.waitFor(() => expect(container.textContent).toContain('Xem trước dãy phòng'))
    await act(async () => clickButton('Xem trước dãy phòng'))
    await fillBatch('soBatDau', '301')
    await fillBatch('soKetThuc', '302')
    await fillBatch('loaiPhong', 'Studio')
    await act(async () => submitForm('room-batch-form'))

    await vi.waitFor(() => expect(container.textContent).toContain('Số phòng 301 đã tồn tại.'))
    expect(container.querySelector('button')?.textContent).not.toContain('Xác nhận tạo dãy phòng')
    expect(fetchMock).not.toHaveBeenCalledWith('/api/toa-nha/1/phong/hang-loat', expect.anything())
  })
})

async function renderScreen() {
  root = createRoot(container)
  await act(async () => root.render(<DanhMucPhong token="room-token" />))
}

function clickButton(label: string) {
  const button = [...container.querySelectorAll('button')].find((item) => item.textContent?.trim() === label) as HTMLButtonElement
  button.click()
}

async function fill(name: string, value: string) {
  const input = container.querySelector(`[data-testid="room-form"] [name="${name}"]`) as HTMLInputElement
  await setValue(input, value)
}

async function fillBatch(name: string, value: string) {
  const input = container.querySelector(`[data-testid="room-batch-form"] [name="${name}"]`) as HTMLInputElement
  await setValue(input, value)
}

async function setValue(input: HTMLInputElement, value: string) {
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    setter?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

async function select(name: string, value: string) {
  const input = container.querySelector(`select[name="${name}"]`) as HTMLSelectElement
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set
    setter?.call(input, value)
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

function submitForm(testId: string) {
  const form = container.querySelector(`[data-testid="${testId}"]`) as HTMLFormElement
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
