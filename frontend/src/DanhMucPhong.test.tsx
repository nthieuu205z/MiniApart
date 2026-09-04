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
    await act(async () => tile.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })))
    await vi.waitFor(() => expect(container.querySelector('[data-testid="room-detail"]')?.textContent).toContain('Chi tiết phòng 101'))
  })

  it('NFR-USA-01 owns a responsive room layout without legacy CSS rules', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      if (String(input) === '/api/toa-nha') return jsonResponse([toaA])
      return jsonResponse([phong101, phong201])
    }))

    await renderScreen()
    const catalog = await vi.waitFor(() => container.querySelector('[data-testid="room-catalog"]') as HTMLElement)
    const layout = catalog.querySelector('.building-layout') as HTMLElement
    const list = catalog.querySelector('.building-list') as HTMLElement
    const detail = catalog.querySelector('.building-detail') as HTMLElement
    const summary = catalog.querySelector('.room-status-summary') as HTMLElement
    const form = catalog.querySelector('[data-testid="room-form"]') as HTMLElement

    expect(catalog.style.display).toBe('flex')
    expect(catalog.style.flexDirection).toBe('column')
    expect(catalog.style.gap).toBe('var(--ma-space-6)')
    expect(layout.style.display).toBe('grid')
    expect(layout.style.gridTemplateColumns).toBe('repeat(auto-fit, minmax(min(100%, 30rem), 1fr))')
    expect(layout.style.minWidth).toBe('0px')
    expect(list.style.display).toBe('grid')
    expect(list.style.minWidth).toBe('0px')
    expect(detail.style.display).toBe('grid')
    expect(detail.style.minWidth).toBe('0px')

    for (const panel of [summary, form]) {
      expect(panel.style.background).toBe('var(--ma-bg-card)')
      expect(panel.style.border).toBe('var(--ma-border-width) solid var(--ma-border-default)')
      expect(panel.style.padding).toBe('var(--ma-space-6)')
      expect(panel.style.gap).toBe('var(--ma-space-4)')
    }

    expect((summary.querySelector('.room-status-summary__grid') as HTMLElement).style.gridTemplateColumns)
      .toBe('repeat(auto-fit, minmax(min(100%, 9rem), 1fr))')
    const formRow = form.querySelector('.building-form__row') as HTMLElement
    expect(formRow.style.gridTemplateColumns)
      .toBe('repeat(auto-fit, minmax(min(100%, 14rem), 1fr))')
    const actions = form.querySelector('.building-form__actions') as HTMLElement
    expect(actions.style.display).toBe('flex')
    expect(actions.style.flexWrap).toBe('wrap')
    expect((form.querySelector('.building-form__hint') as HTMLElement).style.flex).toBe('1 1 14rem')
    expect((catalog.querySelector('.room-floor-section') as HTMLElement).style.gridTemplateColumns)
      .toBe('34px repeat(3, minmax(0, 1fr)) 30px')

    await act(async () => (catalog.querySelector('[data-testid="room-tile"]') as HTMLElement).click())
    const facts = catalog.querySelector('.building-summary__facts') as HTMLElement
    expect(facts.style.display).toBe('grid')
    expect(facts.style.minWidth).toBe('0px')
  })

  it('FR-BLD-03 gives persisted room statuses distinct token-owned color treatments and preserves labels and hooks', async () => {
    const rooms = [
      { ...phong201, id: 21, soPhong: '101', trangThai: 'TRONG', tenTrangThai: 'Trống' },
      { ...phong101, id: 22, soPhong: '102', trangThai: 'DA_COC', tenTrangThai: 'Đã đặt cọc' },
      { ...phong101, id: 23, soPhong: '103', trangThai: 'DANG_THUE', tenTrangThai: 'Đang thuê' },
      { ...phong101, id: 24, soPhong: '104', trangThai: 'DANG_SUA', tenTrangThai: 'Đang sửa' },
      { ...phong101, id: 25, soPhong: '105', trangThai: 'NGUNG', tenTrangThai: 'Ngừng' },
    ]
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      if (String(input) === '/api/toa-nha') return jsonResponse([toaA])
      return jsonResponse(rooms)
    }))

    await renderScreen()
    await vi.waitFor(() => expect(container.querySelectorAll('[data-testid="room-tile"]')).toHaveLength(5))

    const readTile = (room: string) => {
      const tile = [...container.querySelectorAll('[data-testid="room-tile"]')]
        .find((candidate) => candidate.querySelector('.room-tile__number')?.textContent?.trim() === room) as HTMLElement
      const status = tile.querySelector('.room-tile__status') as HTMLElement
      return {
        tile,
        text: status.textContent?.trim(),
        color: status.style.color,
        border: tile.style.border,
        glyph: tile.querySelector('svg')?.getAttribute('stroke'),
      }
    }

    expect(readTile('101')).toMatchObject({ text: 'Trống', color: 'var(--ma-text-disabled)', border: '1px dashed var(--ma-border-dashed)' })
    expect(readTile('102')).toMatchObject({ text: 'Đã đặt cọc', color: 'var(--ma-waiting)', border: '1px solid var(--ma-waiting-border)', glyph: 'var(--ma-waiting)' })
    expect(readTile('103')).toMatchObject({ text: 'Đang thuê', color: 'var(--ma-done-text)', border: '1px solid var(--ma-done-text)', glyph: 'var(--ma-done-text)' })
    expect(readTile('104')).toMatchObject({ text: 'Đang sửa', color: 'var(--ma-waiting)' })
    expect(readTile('105')).toMatchObject({ text: 'Ngừng', color: 'var(--ma-ink-900)', border: '1px solid var(--ma-border-strong)', glyph: 'var(--ma-ink-900)' })
    expect(readTile('102').tile.className).toContain('room-tile--da_coc')
    expect(readTile('103').tile.className).toContain('room-tile--dang_thue')
    expect(readTile('105').tile.className).toContain('room-tile--ngung')
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
    expect(fetchMock).toHaveBeenCalledWith('/api/toa-nha/1/phong/hang-loat/xem-truoc', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        soBatDau: '301',
        soKetThuc: '302',
        tang: 1,
        dienTich: '20.00',
        sucChua: 2,
        giaThueMacDinh: '0.00',
        loaiPhong: 'Studio',
      }),
    }))
    expect(fetchMock).not.toHaveBeenCalledWith('/api/toa-nha/1/phong/hang-loat', expect.anything())
    await act(async () => clickButton('Xác nhận tạo dãy phòng'))
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/toa-nha/1/phong/hang-loat', expect.objectContaining({ method: 'POST' })))
  })

  it('FR-BLD-02 ignores a second batch confirmation while the first request is pending', async () => {
    const preview = [{ ...phong101, id: null, soPhong: '301', tang: 3 }]
    let resolveCreate: ((response: Response) => void) | undefined
    const createRequest = new Promise<Response>((resolve) => {
      resolveCreate = resolve
    })
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([toaA])
      if (url === '/api/toa-nha/1/phong') return jsonResponse([])
      if (url.endsWith('/xem-truoc') && init?.method === 'POST') return jsonResponse({ phong: preview })
      if (url === '/api/toa-nha/1/phong/hang-loat' && init?.method === 'POST') return createRequest
      return jsonResponse([])
    })
    vi.stubGlobal('fetch', fetchMock)

    await renderScreen()
    await vi.waitFor(() => expect(container.textContent).toContain('Xem trước dãy phòng'))
    await act(async () => clickButton('Xem trước dãy phòng'))
    await fillBatch('soBatDau', '301')
    await fillBatch('soKetThuc', '301')
    await fillBatch('loaiPhong', 'Studio')
    await act(async () => submitForm('room-batch-form'))
    await vi.waitFor(() => expect(container.textContent).toContain('301'))

    await act(async () => {
      clickButton('Xác nhận tạo dãy phòng')
      clickButton('Xác nhận tạo dãy phòng')
    })

    expect(fetchMock.mock.calls.filter(([input, init]) => String(input) === '/api/toa-nha/1/phong/hang-loat' && init?.method === 'POST')).toHaveLength(1)
    resolveCreate?.(jsonResponse({ phong: [{ ...preview[0], id: 31 }] }, 201))
    await vi.waitFor(() => expect(container.textContent).toContain('Đã tạo dãy phòng 301 - 301.'))
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

  it('NFR-USA-01 renders the dedicated mobile room layout', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      if (String(input) === '/api/toa-nha') return jsonResponse([toaA])
      return jsonResponse([phong101, phong201])
    }))

    await renderScreen(true)

    await vi.waitFor(() => expect(container.querySelector('[data-testid="room-catalog"]')).not.toBeNull())
    expect(container.querySelector('[data-layout-variant="mobile"]')).not.toBeNull()
    expect(container.querySelector('[data-mobile-room-list]')).not.toBeNull()
    expect(container.querySelector('[data-mobile-room-card]')).not.toBeNull()
  })
})

async function renderScreen(mobile = false) {
  root = createRoot(container)
  await act(async () => root.render(<DanhMucPhong token="room-token" mobile={mobile} />))
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
