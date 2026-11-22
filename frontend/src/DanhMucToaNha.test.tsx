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
  ngayChotSo: 28, soNgayHanTt: 7, maNganHang: '970405', tkNganHang: '0123456789', nguongThatThoat: '1.25', batBuocAnhCongTo: false,
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

  it('FR-BLD-01 FR-INV-10 creates a building with its bank BIN through the actual client contract', async () => {
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
    const bankBin = document.querySelector('input[name="maNganHang"]') as HTMLInputElement | null
    expect(bankBin).not.toBeNull()
    expect(bankBin?.pattern).toBe('[0-9]{6}')
    expect(bankBin?.maxLength).toBe(6)
    const bankAccount = document.querySelector('input[name="tkNganHang"]') as HTMLInputElement
    expect(bankAccount.pattern).toBe('[0-9]{1,19}')
    expect(bankAccount.maxLength).toBe(19)
    await fill('maNganHang', '970422')
    await fill('tkNganHang', '000000000202')
    await fill('nguongThatThoat', '0.75')
    await act(async () => submitForm('building-form'))

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/toa-nha', expect.objectContaining({
      method: 'POST', body: JSON.stringify({ maToa: 'B', ten: 'Toà B', diaChi: '2 Đường B', soTang: 1, ngayChotSo: 28, soNgayHanTt: 7, maNganHang: '970422', tkNganHang: '000000000202', nguongThatThoat: '0.75', batBuocAnhCongTo: false }),
    })))
    expect(container.textContent).toContain('Đã khai báo toà nhà mới.')
  })

  it('NFR-USA-01 renders the dedicated mobile building layout', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse([toaA, toaB])))

    await renderScreen('CHU', true)

    await vi.waitFor(() => expect(container.querySelector('[data-testid="building-catalog"]')).not.toBeNull())
    expect(container.querySelector('[data-layout-variant="mobile"]')).not.toBeNull()
    expect(container.querySelector('[data-mobile-building-list]')).not.toBeNull()
  })

  it('mỗi toà là liên kết tới /toa-nha/{id}; không còn thẻ chi tiết hay nút Sửa dưới bảng', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse([toaA, toaB])))
    await renderScreen('CHU')
    await vi.waitFor(() => expect(container.textContent).toContain('Toà B'))
    expect([...container.querySelectorAll('a.td-main')].map((a) => a.getAttribute('href'))).toEqual(['/toa-nha/1', '/toa-nha/2'])
    expect(container.querySelectorAll('.btn-primary')).toHaveLength(1)
    expect([...container.querySelectorAll('button')].some((b) => b.textContent?.startsWith('Sửa'))).toBe(false)
  })

  it('lỗi tải có Thử lại và câu "Dữ liệu chưa bị thay đổi."', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ thongBao: 'Máy chủ bận.' }, 500)))
    await renderScreen('CHU')
    await vi.waitFor(() => expect(container.textContent).toContain('Dữ liệu chưa bị thay đổi.'))
    expect(container.textContent).toContain('Thử lại')
  })
})

async function renderScreen(vaiTro: string, mobile = false) {
  root = createRoot(container)
  await act(async () => root.render(<DanhMucToaNha token="building-token" vaiTro={vaiTro} mobile={mobile} />))
}

function clickButton(label: string) {
  const button = [...document.querySelectorAll('button')].find((item) => item.textContent?.trim() === label) as HTMLButtonElement
  button.click()
}

async function fill(name: string, value: string) {
  const input = document.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLTextAreaElement
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value')?.set
    setter?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

function submitForm(testId: string) {
  const form = document.querySelector(`[data-testid="${testId}"]`) as HTMLFormElement
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
