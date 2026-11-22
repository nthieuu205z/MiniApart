// @vitest-environment jsdom
import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TimNhanh from './TimNhanh'
import type { VaiTro } from './dinhTuyen'
import { ToaDangChonProvider } from './toaDangChon'
import type { ThongTinToaNha } from './api'

declare global { var IS_REACT_ACT_ENVIRONMENT: boolean | undefined }

let container: HTMLDivElement
let root: Root
const dieuHuong = vi.fn()
const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
const toa = [{ id: 3, ten: 'An Nhiên Residence' }] as ThongTinToaNha[]

function fetchGia() {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url === '/api/nguoi-thue') return json([{ id: 1, hoTen: 'Trần Quang Huy', soDienThoai: '0999100001' }, { id: 71, hoTen: 'Nguyễn Quang Huy', soDienThoai: '0999100071' }, { id: 5, hoTen: 'Đặng Hoài An', soDienThoai: '0999100005' }])
    if (url.endsWith('/phong')) return json([{ id: 1, toaNhaId: 3, soPhong: '101', tenTrangThai: 'Đang thuê' }])
    if (url.startsWith('/api/hop-dong')) return json([{ id: 1, soPhong: '101', hoTenNguoiThue: 'Trần Quang Huy', tenTrangThai: 'Hiệu lực', nguoiThueId: 1 }])
    if (url.startsWith('/api/hoa-don')) return json([{ hoaDonId: 31, maHoaDon: 'DEMO-P5-01-2026-10', kyId: 4, soPhong: '101', nguoiThue: 'Trần Quang Huy', conLai: '1895000' }])
    throw new Error(`unexpected request: ${url}`)
  })
}

function Khung({ vaiTro }: { vaiTro: VaiTro }) {
  const [mo, datMo] = useState(false)
  return (
    <ToaDangChonProvider token="t" vaiTro={vaiTro} search="" taiToa={async () => toa}>
      <button id="nut" onClick={() => datMo(true)}>Tìm</button>
      <TimNhanh token="t" vaiTro={vaiTro} mobile={false} thamSo={{}} dieuHuong={dieuHuong} mo={mo} datMo={datMo} />
    </ToaDangChonProvider>
  )
}

const mount = (vaiTro: VaiTro = 'CHU') => act(async () => root.render(<Khung vaiTro={vaiTro} />))
const phim = (el: EventTarget, key: string, init: KeyboardEventInit = {}) => act(async () => { el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })) })
const hop = () => document.querySelector('[role="dialog"][aria-label="Tìm nhanh"]')
const o = () => document.querySelector('input[role="combobox"]') as HTMLInputElement
async function go(q: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(o(), q)
    o().dispatchEvent(new Event('input', { bubbles: true }))
  })
}
const options = () => [...document.querySelectorAll('[role="option"]')].map((e) => e.textContent ?? '')

describe('TimNhanh', () => {
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    dieuHuong.mockReset()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals() })

  it('không tải API trước khi mở; Ctrl+K mở, Esc đóng và trả focus', async () => {
    const f = fetchGia()
    vi.stubGlobal('fetch', f)
    await mount()
    expect(f).not.toHaveBeenCalled()
    const nut = container.querySelector('#nut') as HTMLButtonElement
    nut.focus()
    await phim(window, 'k', { ctrlKey: true })
    await vi.waitFor(() => expect(hop()).not.toBeNull())
    expect(hop()?.getAttribute('aria-modal')).toBe('true')
    await vi.waitFor(() => expect(f.mock.calls.some(([u]) => String(u) === '/api/nguoi-thue')).toBe(true))
    await phim(o(), 'Escape')
    expect(hop()).toBeNull()
    expect(document.activeElement).toBe(nut)
  })

  it('"/" mở khi focus ngoài ô nhập, không mở khi đang gõ', async () => {
    vi.stubGlobal('fetch', fetchGia())
    await mount()
    await phim(container.querySelector('#nut')!, '/')
    await vi.waitFor(() => expect(hop()).not.toBeNull())
    await phim(o(), 'Escape')
    const lai = document.createElement('input'); document.body.appendChild(lai)
    await phim(lai, '/')
    expect(hop()).toBeNull()
    lai.remove()
  })

  it('gõ "quang huy" ra 2 người thuê, tô đậm phần khớp', async () => {
    vi.stubGlobal('fetch', fetchGia())
    await mount()
    await phim(window, 'k', { metaKey: true })
    await vi.waitFor(() => expect(o()).not.toBeNull())
    await go('quang huy')
    await vi.waitFor(() => expect(options().filter((t) => /^(Trần|Nguyễn) Quang Huy/.test(t))).toHaveLength(2))
    expect(document.querySelector('.cmdk mark')?.textContent).toBe('Quang Huy')
    expect(options().at(-1)).toContain('Báo sự cố')
  })

  it('mũi tên + Enter mở hoá đơn có kyId bằng dieuHuong', async () => {
    vi.stubGlobal('fetch', fetchGia())
    await mount()
    await phim(window, 'k', { ctrlKey: true })
    await vi.waitFor(() => expect(o()).not.toBeNull())
    await go('DEMO-P5')
    await vi.waitFor(() => expect(options()[0]).toContain('DEMO-P5-01-2026-10'))
    await phim(o(), 'ArrowDown')
    await phim(o(), 'ArrowUp')
    expect(document.querySelector('[role="option"][aria-selected="true"]')?.textContent).toContain('DEMO-P5')
    await phim(o(), 'Enter')
    expect(dieuHuong).toHaveBeenCalledWith('/hoa-don?toaNhaId=3&kyId=4&hoaDonId=31')
    expect(hop()).toBeNull()
  })

  it('Quản lý không gọi công nợ; không thấy thì vẫn có 3 Lệnh', async () => {
    const f = fetchGia()
    vi.stubGlobal('fetch', f)
    await mount('QUAN_LY')
    await phim(window, 'k', { ctrlKey: true })
    await vi.waitFor(() => expect(o()).not.toBeNull())
    await go('zzzz')
    await vi.waitFor(() => expect(document.body.textContent).toContain('Không thấy “zzzz” trong dữ liệu đã tải.'))
    expect(options()).toHaveLength(3)
    expect(f.mock.calls.some(([u]) => String(u).includes('/api/bao-cao/cong-no'))).toBe(false)
  })
})
