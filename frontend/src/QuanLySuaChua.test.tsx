// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import QuanLySuaChua from './QuanLySuaChua'

const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } })
const yc = (id: number, over: object) => ({ id, maYeuCau: `SC-${id}`, phongId: 11, toaNha: 'Toà A', soPhong: '101', tang: 1, hangMuc: 'Điện', moTa: 'Đèn hành lang hỏng', mucDo: 'THUONG', tenMucDo: 'Thường', trangThai: 'MOI_TIEP_NHAN', tenTrangThai: 'Mới', nguoiTiepNhanId: null, tiepNhanLuc: null, nguoiXuLyId: null, phanCongLuc: null, choXacNhanLuc: null, lyDoHuy: null, soDienThoaiLienHe: null, anh: [], chiPhi: null, benChiuChiPhi: null, taoLuc: '2026-11-01T01:00:00Z', ...over })
let DATA: object[] = []
const ALL = [yc(1, {}), yc(2, { trangThai: 'DA_DONG', tenTrangThai: 'Đã đóng', hangMuc: 'Nước', soPhong: '202', chiPhi: '250000', benChiuChiPhi: 'CHU_NHA' })]

let container: HTMLDivElement
let root: Root
let calls: Array<[string, RequestInit | undefined]>
beforeEach(() => {
  window.history.replaceState({}, '', '/su-co')
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
  calls = []
  DATA = ALL
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    calls.push([url, init])
    if (init?.method === 'POST' || init?.method === 'PUT') return new Response(null, { status: 204 })
    if (url === '/api/toa-nha') return json([{ id: 1, ten: 'Toà A' }])
    if (url === '/api/toa-nha/1/phong') return json([{ id: 11, soPhong: '101' }])
    if (url.startsWith('/api/yeu-cau-sua-chua/tho')) return json([{ id: 4, hoTen: 'Thợ Huy', soDienThoai: '0999000031' }])
    if (url.startsWith('/api/yeu-cau-sua-chua?')) return json(DATA)
    if (url.includes('/bao-gia') || url.includes('/thanh-toan-tho')) return json([])
    throw new Error(`Unexpected request ${url}`)
  }))
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
// Thiết kế mới mở chi tiết bằng nút "Mở"; bản cũ hiện sẵn nên bỏ qua.
const mo = async (i = 0) => { const b = Array.from(container.querySelectorAll<HTMLElement>('a.irow')); if (b.length) await act(async () => b[i].click()) }
const button = (label: string) => Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes(label))

describe('QuanLySuaChua (quản lý)', () => {
  it('liệt kê mọi yêu cầu của toà với mã, phòng, hạng mục, trạng thái, chi phí', async () => {
    await act(async () => root.render(<QuanLySuaChua token="m" />))
    await vi.waitFor(() => expect(container.textContent).toContain('SC-1'))
    for (const s of ['SC-1', '101', 'Điện', 'Đang mở', 'Đã xong']) expect(container.textContent).toContain(s)
    // Một danh sách: yêu cầu đã đóng nằm sau chip "Đã xong" (chi phí hiện trong ngăn).
    await act(async () => Array.from(container.querySelectorAll<HTMLElement>('a.chip')).find((c) => c.textContent?.startsWith('Đã xong'))!.click())
    for (const s of ['SC-2', '202', 'Nước', '250.000']) expect(container.textContent).toContain(s)
    expect(calls.some(([u]) => u === '/api/yeu-cau-sua-chua?toaNhaId=1')).toBe(true)
  })

  it('yêu cầu mới: Giao thợ cần chọn thợ, rồi gọi tiep-nhan và phan-cong', async () => {
    await act(async () => root.render(<QuanLySuaChua token="m" />))
    await vi.waitFor(() => expect(container.textContent).toContain('SC-1'))
    await mo(0)
    await vi.waitFor(() => expect(button('Giao thợ')).toBeDefined())
    expect(button('Giao thợ')?.getAttribute('aria-disabled')).toBe('true')
    await vi.waitFor(() => expect(container.querySelector('.sc-ct select option[value="4"]')).not.toBeNull())
    const sel = container.querySelector<HTMLSelectElement>('.sc-ct select')!
    await act(async () => { Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!.call(sel, '4'); sel.dispatchEvent(new Event('change', { bubbles: true })) })
    await act(async () => button('Giao thợ')!.click())
    expect(calls.some(([u, i]) => u === '/api/yeu-cau-sua-chua/1/tiep-nhan' && i?.method === 'POST')).toBe(true)
    expect(calls.some(([u, i]) => u === '/api/yeu-cau-sua-chua/1/phan-cong' && i?.method === 'POST')).toBe(true)
  })

  it('yêu cầu đã đóng không còn nút tiếp nhận / huỷ / phân công', async () => {
    DATA = [ALL[1]]
    window.history.replaceState({}, '', '/su-co?id=2')
    await act(async () => root.render(<QuanLySuaChua token="m" />))
    await vi.waitFor(() => expect(container.textContent).toContain('SC-2'))
    await vi.waitFor(() => expect(container.querySelector('.sc-ct')).not.toBeNull())
    expect(button('Lưu chi phí')).toBeUndefined() // ngăn đã đóng chỉ đọc
    expect(button('Huỷ yêu cầu')).toBeUndefined()
    expect(button('Giao thợ')).toBeUndefined()
  })

  it('form báo sự cố gửi multipart tới /api/yeu-cau-sua-chua', async () => {
    await act(async () => root.render(<QuanLySuaChua token="m" />))
    await vi.waitFor(() => expect(container.textContent).toContain('SC-1'))
    await act(async () => button('Ghi sự cố mới')?.click())
    const set = (el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, v: string) => { const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, v); el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true })) }
    await vi.waitFor(() => expect(container.querySelector('textarea')).not.toBeNull())
    await act(async () => { set(container.querySelector('select[required]')!, '11'); set(container.querySelector('input[required]')!, 'Khoá'); set(container.querySelector('textarea')!, 'Kẹt khoá') })
    await act(async () => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    const post = calls.find(([u, i]) => u === '/api/yeu-cau-sua-chua' && i?.method === 'POST')
    expect(post).toBeDefined()
    const body = post![1]!.body as FormData
    expect([body.get('phongId'), body.get('hangMuc'), body.get('moTa')]).toEqual(['11', 'Khoá', 'Kẹt khoá'])
  })
})
