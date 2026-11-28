// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QuanLyBaoGiaVaThanhToan } from './QuanLyBaoGiaVaThanhToan'
import { dinhDangTien } from './design/core/format'

const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } })
const dong = { tenHangMuc: 'Thay vòi nước', soLuong: 1, donVi: 'cái', donGia: 600000, thanhTien: 600000 }
const baoGia = (over: object) => ({ id: 1, maBaoGia: 'BG-1', yeuCauId: 7, phienBan: 1, trangThai: 'CHO_DUYET', tongTien: 600000, nguoiTaoId: 4, taoLuc: '2026-11-01T08:00:00', dongBaoGia: [dong], ...over })
const thanhToan = { id: 5, maThanhToan: 'TT-5', yeuCauId: 7, soTien: 200000, phuongThuc: 'CHUYEN_KHOAN', nguoiXacNhanId: 2, xacNhanLuc: '2026-11-03T08:00:00' }

let container: HTMLDivElement
let root: Root
let calls: Array<[string, RequestInit | undefined]>
function mock(quotes: object[], payments: object[]) {
  calls = []
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    calls.push([url, init])
    if (init?.method === 'POST') return new Response(null, { status: 204 })
    if (url.endsWith('/bao-gia')) return json(quotes)
    if (url.endsWith('/thanh-toan-tho')) return json(payments)
    throw new Error(`Unexpected request ${url}`)
  }))
}
const render = async () => { await act(async () => root.render(<QuanLyBaoGiaVaThanhToan token="t" yeuCauId={7} />)) }
const button = (label: string) => Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes(label))

beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.append(container); root = createRoot(container) })
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('QuanLyBaoGiaVaThanhToan', () => {
  it('nói rõ khi thợ chưa gửi báo giá', async () => {
    mock([], [])
    await render()
    await vi.waitFor(() => expect(container.textContent).toContain('Thợ chưa gửi báo giá'))
    expect(button('Phê duyệt')).toBeUndefined()
  })

  it('báo giá chờ duyệt: hiện dòng hạng mục, duyệt gọi đúng endpoint sau khi xác nhận', async () => {
    mock([baoGia({})], [])
    vi.stubGlobal('confirm', vi.fn(() => true))
    await render()
    await vi.waitFor(() => expect(container.textContent).toContain('Chờ duyệt'))
    expect(container.textContent).toContain('BG-1')
    expect(container.textContent).toContain('Thay vòi nước')
    await act(async () => button('Phê duyệt')!.click())
    expect(calls.some(([url, init]) => url === '/api/yeu-cau-sua-chua/7/bao-gia/1/duyet' && init?.method === 'POST')).toBe(true)
  })

  it('từ chối bắt buộc có lý do rồi gửi lyDoTuChoi', async () => {
    mock([baoGia({})], [])
    await render()
    await vi.waitFor(() => expect(button('Từ chối')).toBeDefined())
    await act(async () => button('Từ chối')!.click())
    await act(async () => button('Xác nhận từ chối')!.click())
    expect(container.querySelector('[role="alert"]')?.textContent ?? container.textContent).toContain('Vui lòng nhập lý do từ chối')
    const input = container.querySelector<HTMLInputElement>('input[type="text"]')!
    await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'Giá vật tư cao'); input.dispatchEvent(new Event('input', { bubbles: true })) })
    await act(async () => button('Xác nhận từ chối')!.click())
    const post = calls.find(([url, init]) => url.endsWith('/bao-gia/1/tu-choi') && init?.method === 'POST')
    expect(JSON.parse(post![1]!.body as string)).toEqual({ lyDoTuChoi: 'Giá vật tư cao' })
  })

  it('báo giá đã duyệt: tính đã trả / còn lại và mở form ghi nhận với số tiền còn lại', async () => {
    mock([baoGia({ trangThai: 'DA_DUYET' })], [thanhToan])
    await render()
    await vi.waitFor(() => expect(container.textContent).toContain('TT-5'))
    const t = container.textContent ?? ''
    expect(t).toContain(dinhDangTien(600000))
    expect(t).toContain(dinhDangTien(200000))
    expect(t).toContain(dinhDangTien(400000))
    await act(async () => button('Ghi nhận trả thợ')!.click())
    expect(container.querySelector<HTMLInputElement>('input[type="number"]')!.value).toBe('400000')
    // step=1000 + min=1 từng chặn số tròn nghìn như 50.030.000 (trình duyệt đòi 50.029.001)
    expect(container.querySelector<HTMLInputElement>('input[type="number"]')!.step).toBe('1')
    expect(button('Lưu giao dịch thanh toán')).toBeDefined()
  })

  it('không còn nợ thợ thì ẩn nút ghi nhận', async () => {
    mock([baoGia({ trangThai: 'DA_DUYET' })], [{ ...thanhToan, soTien: 600000 }])
    await render()
    await vi.waitFor(() => expect(container.textContent).toContain('TT-5'))
    expect(button('Ghi nhận trả thợ')).toBeUndefined()
  })
})
