// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ChuongThongBao from './ChuongThongBao'

declare global { var IS_REACT_ACT_ENVIRONMENT: boolean | undefined }

let container: HTMLDivElement
let root: Root
const dieuHuong = vi.fn()
const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
const tb = (i: number, daDoc = false) => ({ maThamChieu: `m${i}`, tieuDe: `Tin ${i}`, noiDung: `Nội dung ${i}`, daDoc, docLuc: null, taoLuc: '2026-09-10T12:00:00Z' })

function fetchGia() {
  let tinh = Array.from({ length: 7 }, (_, i) => tb(i + 1, i >= 6)) // 6 chưa đọc, 1 đã đọc
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    const m = /^\/api\/thong-bao\/(m\d+)\/da-doc$/.exec(url)
    if (m) { tinh = tinh.map((t) => (t.maThamChieu === m[1] ? { ...t, daDoc: true } : t)); return json(tinh.find((t) => t.maThamChieu === m[1])) }
    if (url === '/api/thong-bao') return json({ thongBao: tinh, soChuaDoc: tinh.filter((t) => !t.daDoc).length })
    throw new Error(`unexpected request: ${url}`)
  })
}
const nut = () => container.querySelector('[data-testid="chuong-nut"]') as HTMLButtonElement

describe('ChuongThongBao', () => {
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    dieuHuong.mockReset()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals() })

  const mount = () => act(async () => root.render(<ChuongThongBao token="t" vaiTro="QUAN_LY" mobile={false} thamSo={{}} dieuHuong={dieuHuong} />))

  it('hiện số chưa đọc; huy hiệu là phần tử riêng ngoài biểu tượng chuông', async () => {
    vi.stubGlobal('fetch', fetchGia())
    await mount()
    await vi.waitFor(() => expect(nut().getAttribute('aria-label')).toBe('Thông báo, 6 chưa đọc'))
    expect(nut().querySelector('.chuong-n')?.textContent).toBe('6')
    expect(nut().querySelector('svg')?.contains(nut().querySelector('.chuong-n'))).toBe(false)
  })

  it('mở hộp 5 tin, Esc đóng và trả focus, "Xem tất cả" mở /thong-bao', async () => {
    vi.stubGlobal('fetch', fetchGia())
    await mount()
    await vi.waitFor(() => expect(nut().getAttribute('aria-label')).toContain('6'))
    await act(async () => nut().click())
    expect(container.querySelectorAll('.pop[role="dialog"] a.irow')).toHaveLength(5)
    await act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })) })
    expect(container.querySelector('.pop')).toBeNull()
    expect(document.activeElement).toBe(nut())
    await act(async () => nut().click())
    await act(async () => ([...container.querySelectorAll('a')].find((a) => a.textContent === 'Xem tất cả') as HTMLAnchorElement).click())
    expect(dieuHuong).toHaveBeenCalledWith('/thong-bao')
  })

  it('"Đánh dấu đã đọc" gọi API từng tin chưa đọc rồi số về 0', async () => {
    const f = fetchGia()
    vi.stubGlobal('fetch', f)
    await mount()
    await vi.waitFor(() => expect(nut().getAttribute('aria-label')).toContain('6'))
    await act(async () => nut().click())
    await act(async () => ([...container.querySelectorAll('button')].find((b) => b.textContent === 'Đánh dấu đã đọc') as HTMLButtonElement).click())
    await vi.waitFor(() => expect(nut().getAttribute('aria-label')).toBe('Thông báo'))
    expect(f.mock.calls.filter(([u]) => /da-doc$/.test(String(u)))).toHaveLength(6)
    expect(container.querySelector('.chuong-n')).toBeNull()
  })
})
