// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BaoHongKhach from './BaoHongKhach'

let container: HTMLDivElement
let root: Root | undefined
beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.append(container) })
afterEach(async () => { await act(async () => root?.unmount()); root = undefined; container.remove(); vi.unstubAllGlobals() })
const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } })
const set = (el: HTMLInputElement | HTMLTextAreaElement, v: string) => {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(el, v)
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('Báo hỏng (khách thuê)', () => {
  it('liệt kê yêu cầu của mình, chọn sẵn phòng duy nhất, gửi form bằng POST /api/yeu-cau-sua-chua', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/api/cong/hop-dong') return json([{ id: 4, phongId: 11, soPhong: '101', trangThai: 'HIEU_LUC' }])
      if (url.startsWith('/api/cong/yeu-cau-sua-chua')) return json([{ id: 7, maYeuCau: 'SC-7', soPhong: '101', hangMuc: 'Điện', moTa: 'Đèn hành lang hỏng', tenMucDo: 'Bình thường', trangThai: 'MOI_TIEP_NHAN', tenTrangThai: 'Mới', taoLuc: '2026-11-20T08:00:00', anh: [] }])
      if (url === '/api/yeu-cau-sua-chua' && init?.method === 'POST') return json({ id: 8 })
      throw new Error(`Unexpected request ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)
    root = createRoot(container)
    await act(async () => root!.render(<BaoHongKhach token="tenant-token" />))
    await vi.waitFor(() => expect(container.textContent).toContain('SC-7'))
    expect(container.textContent).toContain('Mới')
    expect(container.textContent).not.toContain('Phân công thợ')
    expect(fetchMock.mock.calls.some(([u]) => String(u) === '/api/toa-nha')).toBe(false)
    await vi.waitFor(() => expect((container.querySelector('select') as HTMLSelectElement).value).toBe('11'))
    expect(container.querySelector('button[type="submit"]')?.textContent).toBe('Gửi yêu cầu sửa chữa')

    const form = container.querySelector('form') as HTMLFormElement
    await act(async () => {
      set(form.querySelector('input.input') as HTMLInputElement, 'Vòi nước rỉ')
      set(form.querySelector('textarea') as HTMLTextAreaElement, 'Vòi bếp rỉ nước liên tục')
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
    const post = fetchMock.mock.calls.find(([u, i]) => String(u) === '/api/yeu-cau-sua-chua' && i?.method === 'POST')
    expect(post).toBeTruthy()
    const body = (post![1] as RequestInit).body as FormData
    expect(body.get('phongId')).toBe('11')
    expect(body.get('hangMuc')).toBe('Vòi nước rỉ')
  })
})
