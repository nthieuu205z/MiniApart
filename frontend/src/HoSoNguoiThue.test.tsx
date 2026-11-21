// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HoSoNguoiThue from './HoSoNguoiThue'

declare global { var IS_REACT_ACT_ENVIRONMENT: boolean | undefined }

let container: HTMLDivElement
let root: Root | undefined
beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.append(container) })
afterEach(async () => { await act(async () => root?.unmount()); root = undefined; container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const huy = { id: 1, hoTen: 'Trần Quang Huy', ngaySinh: '2003-11-10', soDienThoai: '0999100001', soGiayToChe: '*********ON-1', queQuan: 'Nam Định', canhBao: [] as string[] }
const ha = { id: 2, hoTen: 'Bùi Ngọc Hà', ngaySinh: '1991-11-10', soDienThoai: '0999100067', soGiayToChe: '', queQuan: '', canhBao: ['Thiếu ảnh giấy tờ'] }

async function render(fetchMock: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) {
  vi.stubGlobal('fetch', fetchMock)
  root = createRoot(container)
  await act(async () => root!.render(<HoSoNguoiThue token="t" />))
}
function button(prefix: string) {
  const found = [...container.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim().startsWith(prefix))
  expect(found, prefix).toBeDefined()
  return found!
}
async function setValue(input: HTMLInputElement, value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

describe('Hồ sơ người thuê', () => {
  it('liệt kê hồ sơ với SĐT, giấy tờ đã che, quê quán và cảnh báo', async () => {
    await render(vi.fn(async (_i: RequestInfo | URL, _n?: RequestInit) => json([huy, ha])))
    await vi.waitFor(() => expect(container.textContent).toContain('Trần Quang Huy'))
    const text = container.textContent ?? ''
    expect(text).toContain('Bùi Ngọc Hà')
    expect(text).toContain('0999 100 001')
    expect(text).toContain('*********ON-1')
    expect(text).toContain('Nam Định')
    expect(text).toContain('Thiếu ảnh giấy tờ')
    expect(text).toContain('Chưa cập nhật')
    expect(container.querySelectorAll('button')).not.toBeNull()
    expect([...container.querySelectorAll('button')].filter((b) => b.textContent?.includes('Xem và sửa'))).toHaveLength(2)
  })

  it('hiện trạng thái rỗng khi chưa có hồ sơ và khi tìm không ra', async () => {
    const fetchMock = vi.fn(async (_i: RequestInfo | URL, _n?: RequestInit) => json([]))
    await render(fetchMock)
    await vi.waitFor(() => expect(container.textContent).toContain('Chưa có hồ sơ người thuê nào trong hệ thống.'))
    await setValue(container.querySelector('input[type="search"]')!, 'zzz')
    await vi.waitFor(() => expect(container.textContent).toContain('Không tìm thấy hồ sơ người thuê nào phù hợp từ khoá.'))
  })

  it('tìm kiếm gửi từ khoá lên máy chủ', async () => {
    const fetchMock = vi.fn(async (_i: RequestInfo | URL, _n?: RequestInit) => json([huy]))
    await render(fetchMock)
    await vi.waitFor(() => expect(container.textContent).toContain('Trần Quang Huy'))
    await setValue(container.querySelector('input[type="search"]')!, 'Huy')
    await vi.waitFor(() => expect(fetchMock.mock.calls.some(([u]) => String(u) === '/api/nguoi-thue?q=Huy')).toBe(true))
  })

  it('mở hồ sơ để sửa nạp đúng dữ liệu rồi lưu bằng PUT', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = String(input)
      if (url === '/api/nguoi-thue/1' && (init?.method ?? 'GET') === 'GET') return json({ ...huy, soGiayTo: '012345678901' })
      if (url === '/api/nguoi-thue/1' && init?.method === 'PUT') return json(huy)
      return json([huy])
    })
    await render(fetchMock)
    await vi.waitFor(() => expect(container.textContent).toContain('Trần Quang Huy'))
    await act(async () => button('Xem và sửa').click())
    await vi.waitFor(() => expect(container.textContent).toContain('Chỉnh sửa hồ sơ: Trần Quang Huy'))
    const cccd = [...container.querySelectorAll<HTMLInputElement>('form input')].find((i) => i.value === '012345678901')
    expect(cccd).toBeDefined()
    await setValue([...container.querySelectorAll<HTMLInputElement>('form input')].find((i) => i.value === 'Nam Định')!, 'Hà Nội')
    await act(async () => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    const put = fetchMock.mock.calls.find(([, init]) => (init as RequestInit | undefined)?.method === 'PUT')!
    expect(put[0]).toBe('/api/nguoi-thue/1')
    expect(JSON.parse(String((put[1] as RequestInit).body))).toMatchObject({ hoTen: 'Trần Quang Huy', soGiayTo: '012345678901', queQuan: 'Hà Nội' })
    await vi.waitFor(() => expect(container.textContent).toContain('Đã cập nhật thông tin hồ sơ người thuê.'))
    expect(container.textContent).toContain('Ảnh giấy tờ của hồ sơ #1')
  })

  it('thêm hồ sơ mới gửi POST', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => init?.method === 'POST' ? json({ ...huy, id: 9 }, 201) : json([huy]))
    await render(fetchMock)
    await vi.waitFor(() => expect(container.textContent).toContain('Trần Quang Huy'))
    await act(async () => button('Thêm hồ sơ mới').click())
    await vi.waitFor(() => expect(container.textContent).toContain('Thêm hồ sơ người thuê mới'))
    const inputs = [...container.querySelectorAll<HTMLInputElement>('form input')]
    expect(inputs).toHaveLength(5)
    const values = ['Nguyễn Văn A', '2000-01-02', '0900000009', '079200000009', 'Hà Nam']
    for (let i = 0; i < 5; i++) await setValue(inputs[i], values[i])
    await act(async () => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    const post = fetchMock.mock.calls.find(([, init]) => (init as RequestInit | undefined)?.method === 'POST')!
    expect(post[0]).toBe('/api/nguoi-thue')
    expect(JSON.parse(String((post[1] as RequestInit).body))).toEqual({ hoTen: 'Nguyễn Văn A', ngaySinh: '2000-01-02', soDienThoai: '0900000009', soGiayTo: '079200000009', queQuan: 'Hà Nam' })
    await vi.waitFor(() => expect(container.textContent).toContain('Đã tạo hồ sơ người thuê mới thành công.'))
  })
})
