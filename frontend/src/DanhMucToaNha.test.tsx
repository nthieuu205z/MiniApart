// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DanhMucToaNha from './DanhMucToaNha'

declare global { var IS_REACT_ACT_ENVIRONMENT: boolean | undefined }

let container: HTMLDivElement
let root: Root

const toaA = {
  id: 1, maToa: 'A', ten: 'Toà A', diaChi: '1 Đường A', soTang: 5,
  ngayChotSo: 28, soNgayHanTt: 7, tkNganHang: '0123456789', nguongThatThoat: '1.25', batBuocAnhCongTo: false,
}
const toaB = { ...toaA, id: 2, maToa: 'B', ten: 'Toà B', diaChi: '2 Đường B' }

describe('DanhMucToaNha', () => {
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

  it('FR-BLD-01 lists only buildings returned for the assigned scope', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse([toaA])))

    await renderScreen('NHAN_VIEN')

    await vi.waitFor(() => expect(container.textContent).toContain('Toà A'))
    expect(container.textContent).not.toContain('Toà B')
    expect(container.textContent).not.toContain('Khai báo toà mới')
  })

  it('FR-BLD-01 creates a building and preserves the decimal loss threshold in its request', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'POST') return jsonResponse({ ...toaB, nguongThatThoat: '0.75' }, 201)
      return jsonResponse([toaA])
    })
    vi.stubGlobal('fetch', fetchMock)

    await renderScreen('CHU')
    await vi.waitFor(() => expect(container.textContent).toContain('Toà A'))
    await act(async () => clickButton('Khai báo toà mới'))
    await fill('maToa', 'B')
    await fill('ten', 'Toà B')
    await fill('diaChi', '2 Đường B')
    await fill('nguongThatThoat', '0.75')
    await act(async () => submitForm('building-form'))

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/toa-nha', expect.objectContaining({
      method: 'POST', body: JSON.stringify({ maToa: 'B', ten: 'Toà B', diaChi: '2 Đường B', soTang: 1, ngayChotSo: 28, soNgayHanTt: 7, tkNganHang: '', nguongThatThoat: '0.75', batBuocAnhCongTo: false }),
    })))
    expect(container.textContent).toContain('Đã khai báo toà nhà mới.')
  })

  it('FR-BLD-01 edits the selected building and shows duplicate-code and invalid-closing-date errors from the server', async () => {
    let putCount = 0
    vi.stubGlobal('fetch', vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'PUT') {
        putCount += 1
        return putCount === 1
          ? jsonResponse({ thongBao: 'Mã toà A đã tồn tại.' }, 409)
          : jsonResponse({ thongBao: 'Ngày chốt số phải từ 1 đến 28.' }, 400)
      }
      return jsonResponse([toaA])
    }))

    await renderScreen('QTHT')
    await vi.waitFor(() => expect(container.textContent).toContain('Sửa Toà A'))
    await act(async () => clickButton('Sửa Toà A'))
    await act(async () => submitForm('building-form'))
    await vi.waitFor(() => expect(container.textContent).toContain('Mã toà A đã tồn tại.'))
    await fill('ngayChotSo', '29')
    await act(async () => submitForm('building-form'))
    await vi.waitFor(() => expect(container.textContent).toContain('Ngày chốt số phải từ 1 đến 28.'))
  })

  it('NFR-USA-01 renders the dedicated mobile building layout', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse([toaA, toaB])))

    await renderScreen('CHU', true)

    await vi.waitFor(() => expect(container.querySelector('[data-testid="building-catalog"]')).not.toBeNull())
    expect(container.querySelector('[data-layout-variant="mobile"]')).not.toBeNull()
    expect(container.querySelector('[data-mobile-building-list]')).not.toBeNull()
  })

  it('NFR-USA-01 wraps the selected building action label on mobile', async () => {
    const longBuilding = { ...toaA, ten: 'Toà nhà có tên rất dài để kiểm tra giao diện điện thoại' }
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse([longBuilding])))

    await renderScreen('CHU', true)

    const actionButton = [...container.querySelectorAll<HTMLButtonElement>('button')]
      .find((item) => item.textContent?.startsWith('Sửa'))
    expect(actionButton).toBeDefined()
    expect(actionButton?.style.maxWidth).toBe('100%')
    expect(actionButton?.style.minWidth).toBe('0px')
    expect(actionButton?.style.whiteSpace).toBe('normal')
    expect(actionButton?.style.overflowWrap).toBe('anywhere')
  })
})

async function renderScreen(vaiTro: string, mobile = false) {
  root = createRoot(container)
  await act(async () => root.render(<DanhMucToaNha token="building-token" vaiTro={vaiTro} mobile={mobile} />))
}

function clickButton(label: string) {
  const button = [...container.querySelectorAll('button')].find((item) => item.textContent?.trim() === label) as HTMLButtonElement
  button.click()
}

async function fill(name: string, value: string) {
  const input = container.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLTextAreaElement
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value')?.set
    setter?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

function submitForm(testId: string) {
  const form = container.querySelector(`[data-testid="${testId}"]`) as HTMLFormElement
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
