// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BieuDoTieuThu from './BieuDoTieuThu'

const diem = (kyId: number, thang: number, muc: string, donVi: string, dichVuId: number) => ({
  kyId, hoaDonId: kyId + 100, nam: 2026, thang, hopDongId: 1, soPhong: '101', dichVuId, tenDichVu: 'Dịch vụ', donVi,
  chiSoDau: '100.00', chiSoCuoi: '125.00', mucTieuThu: muc,
})

const DATA = {
  dien: [diem(10, 10, '96.00', 'kWh', 21), diem(9, 9, '80.00', 'kWh', 21), diem(8, 8, '25.00', 'kWh', 21)],
  nuoc: [diem(10, 10, '5.00', 'm3', 22), diem(9, 9, '0.00', 'm3', 22)],
}

describe('BieuDoTieuThu', () => {
  let container: HTMLDivElement
  let root: Root

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

  async function render(body: unknown, status = 200, mobile = true) {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })))
    root = createRoot(container)
    await act(async () => {
      root.render(<BieuDoTieuThu token="tenant-token" mobile={mobile} />)
    })
  }

  it.each([true, false])('hiện đủ biểu đồ điện + nước, mỗi kỳ một cột bấm được, kèm bảng số (mobile=%s)', async (mobile) => {
    await render(DATA, 200, mobile)
    await vi.waitFor(() => expect(container.querySelector('[data-testid="consumption-screen"]')).not.toBeNull())
    expect(container.querySelector('[data-consumption-chart="electricity"]')).not.toBeNull()
    expect(container.querySelector('[data-consumption-chart="water"]')).not.toBeNull()
    expect(container.querySelectorAll('[data-consumption-bar^="electricity-"]')).toHaveLength(3)
    expect(container.querySelectorAll('[data-consumption-bar^="water-"]')).toHaveLength(2)
    expect(container.querySelectorAll('[data-consumption-table]')).toHaveLength(2)
    const text = container.textContent ?? ''
    expect(text).toContain('Tiêu thụ điện và nước')
    expect(text).not.toMatch(/[0-9][.][0-9]{2}(?![0-9])/) // không còn số thô dạng 96.00
    expect(text).not.toMatch(/[A-Z]{2,}(_[A-Z0-9]+)+/)
    expect(container.querySelectorAll('h1')).toHaveLength(mobile ? 0 : 1)
    expect(text).toContain('96 kWh')
    expect(text).toContain('5 m3')
    expect(text).toContain('Đầu 100 · cuối 125')
  })

  it('bấm một cột hiện đúng kỳ và số', async () => {
    await render(DATA)
    await vi.waitFor(() => expect(container.querySelector('[data-consumption-bar="electricity-8"]')).not.toBeNull())
    const cot = container.querySelector('[data-consumption-bar="electricity-8"]') as HTMLButtonElement
    await act(async () => cot.click())
    expect(cot.getAttribute('aria-pressed')).toBe('true')
    expect(container.textContent).toContain('Tháng 8/2026 · Phòng 101: 25 kWh')
  })

  it('một loại chưa có số: báo riêng, loại kia vẫn vẽ', async () => {
    await render({ dien: DATA.dien, nuoc: [] })
    await vi.waitFor(() => expect(container.querySelector('[data-consumption-chart="water"]')).not.toBeNull())
    expect(container.textContent).toContain('Nước chưa có dữ liệu')
    expect(container.querySelectorAll('[data-consumption-bar^="electricity-"]')).toHaveLength(3)
  })

  it('rỗng cả hai: EmptyState, không phải lỗi', async () => {
    await render({ dien: [], nuoc: [] })
    await vi.waitFor(() => expect(container.querySelector('[data-consumption-empty]')).not.toBeNull())
    expect(container.textContent).toContain('Chưa có dữ liệu tiêu thụ')
    expect(container.querySelector('[role="alert"]')).toBeNull()
  })

  it('lỗi: thông báo + nút Thử lại', async () => {
    await render({ message: 'Máy chủ bận' }, 500)
    await vi.waitFor(() => expect(container.querySelector('[role="alert"]')).not.toBeNull())
    expect(container.querySelector('[data-retry-consumption]')).not.toBeNull()
  })
})
