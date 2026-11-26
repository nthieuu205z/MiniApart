// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DichVuVaKy from './DichVuVaKy'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })

describe('DichVuVaKy', () => {
  let root: Root
  let container: HTMLDivElement
  const calls: { url: string; method?: string }[] = []

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    calls.length = 0
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      calls.push({ url, method: init?.method })
      if (url === '/api/toa-nha') return json([{ id: 3, ten: 'An Nhiên' }])
      if (url === '/api/toa-nha/3/dich-vu') return json([
        { id: 1, toaNhaId: 3, ten: 'Điện sinh hoạt', cachTinh: 'THEO_CHI_SO', cheDoGia: 'BAC_THANG', donVi: 'kWh', laDien: true, dangSuDung: true },
        { id: 2, toaNhaId: 3, ten: 'Internet Wifi', cachTinh: 'CO_DINH', cheDoGia: 'CO_DINH', donVi: 'Phòng', laDien: false, dangSuDung: false },
      ])
      if (url === '/api/toa-nha/3/ky-thanh-toan') return json([
        { id: 8, thang: 8, nam: 2026, trangThai: 'DA_CHOT' },
        { id: 9, thang: 9, nam: 2026, trangThai: 'DANG_MO' },
      ])
      if (url === '/api/dich-vu/2/bang-gia') return json([{ id: 5, donGia: '100000', ngayHieuLuc: '2026-01-01', dangApDung: true }])
      if (url === '/api/dich-vu/2/bac-thang') return json([])
      throw new Error(`Unexpected fetch: ${url}`)
    }))
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
  })

  async function mount() {
    await act(async () => { root = createRoot(container); root.render(<DichVuVaKy token="t" />) })
    await vi.waitFor(() => expect(container.textContent).toContain('Internet Wifi'))
  }

  it('liệt kê dịch vụ (cách tính, chế độ giá, đơn vị, trạng thái) và tháng tính tiền, chỉ đọc khi mở màn', async () => {
    await mount()
    const text = container.textContent ?? ''
    expect(text).toContain('Điện sinh hoạt')
    expect(text).toContain('Theo chỉ số')
    expect(text).toContain('Bậc thang')
    expect(text).toContain('Ngừng sử dụng')
    expect(text).toContain('Tháng đang mở: 9/2026')
    expect(text).not.toContain('Đã chốt')
    expect(container.querySelector('a[href="/chu-ky"]')?.textContent).toContain('Tháng tính tiền')
    expect(calls.every((c) => !c.method || c.method === 'GET')).toBe(true)
  })

  it('bấm "Sửa dịch vụ và giá" nạp form sửa và bảng giá đang áp dụng', async () => {
    await mount()
    const nut = Array.from(container.querySelectorAll('button')).filter((b) => b.textContent?.includes('Sửa dịch vụ và giá'))[1]
    await act(async () => { nut.click() })
    await vi.waitFor(() => expect(container.textContent).toContain('Đang áp dụng'))
    expect(container.textContent).toContain('Sửa dịch vụ')
    expect(container.textContent).toContain('100000 đồng')
    expect((container.querySelector('input[required]:not([type])') as HTMLInputElement).value).toBe('Internet Wifi')
  })
})
