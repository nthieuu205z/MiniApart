// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import QuanLyTaiKhoan from './QuanLyTaiKhoan'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

const buildings = [
  { id: 1, maToa: 'A', ten: 'Toà A', diaChi: '', soTang: 5, ngayChotSo: 25, soNgayHanTt: 7, tkNganHang: '', nguongThatThoat: '20.00', batBuocAnhCongTo: false },
  { id: 2, maToa: 'B', ten: 'Toà B', diaChi: '', soTang: 5, ngayChotSo: 25, soNgayHanTt: 7, tkNganHang: '', nguongThatThoat: '20.00', batBuocAnhCongTo: false },
]
const roles = [
  { vaiTro: 'QTHT', tenVaiTro: 'Quản trị hệ thống' },
  { vaiTro: 'THO', tenVaiTro: 'Thợ sửa chữa' },
]

function createFetchMock() {
  const accounts = [
    { id: 1, hoTen: 'Người quản lý', soDienThoai: '0900000001', vaiTro: 'QTHT', tenVaiTro: 'Quản trị hệ thống', trangThai: 'HOAT_DONG', tenTrangThai: 'Hoạt động', toaNhaIds: [1] },
  ]
  let nextId = 2
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const method = init?.method ?? 'GET'
    if (url === '/api/nguoi-dung' && method === 'GET') return response(accounts)
    if (url === '/api/toa-nha' && method === 'GET') return response(buildings)
    if (url === '/api/nguoi-dung/vai-tro' && method === 'GET') return response(roles)
    if (url === '/api/nguoi-dung' && method === 'POST') {
      const payload = JSON.parse(String(init?.body))
      if (accounts.some((account) => account.soDienThoai === payload.soDienThoai)) {
        return response({ thongBao: 'Số điện thoại đã tồn tại.' }, 409)
      }
      const created = { ...payload, id: nextId++, tenVaiTro: payload.vaiTro === 'THO' ? 'Thợ sửa chữa' : 'Quản trị hệ thống', trangThai: 'HOAT_DONG', tenTrangThai: 'Hoạt động' }
      accounts.push(created)
      return response(created, 201)
    }
    const editMatch = url.match(/^\/api\/nguoi-dung\/(\d+)$/)
    if (editMatch && method === 'PUT') {
      const index = accounts.findIndex((account) => account.id === Number(editMatch[1]))
      const updated = { ...accounts[index], ...JSON.parse(String(init?.body)) }
      accounts[index] = updated
      return response(updated)
    }
    const lockMatch = url.match(/^\/api\/nguoi-dung\/(\d+)\/khoa$/)
    if (lockMatch && method === 'POST') {
      const index = accounts.findIndex((account) => account.id === Number(lockMatch[1]))
      const locked = { ...accounts[index], trangThai: 'BI_KHOA', tenTrangThai: 'Bị khoá' }
      accounts[index] = locked
      return response(locked)
    }
    return response({ thongBao: 'Số điện thoại đã tồn tại.' }, 409)
  })
  return { fetchMock, accounts }
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

let container: HTMLDivElement
let root: Root

async function renderScreen() {
  await act(async () => root.render(<QuanLyTaiKhoan token="test-token" />))
  await vi.waitFor(() => expect(container.textContent).toContain('Người quản lý'))
}

function button(label: string) {
  const found = [...container.querySelectorAll('button')].find((item) => item.textContent?.trim() === label)
  expect(found).toBeDefined()
  return found as HTMLButtonElement
}

async function setInput(input: HTMLInputElement, value: string) {
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    setter?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

describe('Quản lý tài khoản', () => {
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.restoreAllMocks()
  })

  it('FR-AUT-06 liệt kê tài khoản từ máy chủ', async () => {
    vi.stubGlobal('fetch', createFetchMock().fetchMock)
    await renderScreen()
    expect(container.textContent).toContain('0900000001')
    expect(container.textContent).toContain('Toà A')
  })

  it('FR-AUT-06 tạo tài khoản với vai trò và phân công toà', async () => {
    const { fetchMock } = createFetchMock()
    vi.stubGlobal('fetch', fetchMock)
    await renderScreen()
    await act(async () => button('Tạo tài khoản').click())
    const form = container.querySelector('[data-testid="account-form"]') as HTMLFormElement
    await setInput(form.querySelector('input[name="hoTen"]')!, 'Thợ mới')
    await setInput(form.querySelector('input[name="soDienThoai"]')!, '0900000002')
    const role = form.querySelector('select[name="vaiTro"]') as HTMLSelectElement
    role.value = 'THO'
    role.dispatchEvent(new Event('change', { bubbles: true }))
    const building = form.querySelector('input[name="toaNhaIds"][value="2"]') as HTMLInputElement
    building.click()
    await act(async () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    await vi.waitFor(() => expect(container.textContent).toContain('Thợ mới'))
    expect(fetchMock).toHaveBeenCalledWith('/api/nguoi-dung', expect.objectContaining({ method: 'POST' }))
    const call = fetchMock.mock.calls.find(([input, init]) => String(input) === '/api/nguoi-dung' && init?.method === 'POST')
    expect(JSON.parse(String(call?.[1]?.body))).toMatchObject({ vaiTro: 'THO', toaNhaIds: [2] })
  })

  it('FR-AUT-06 vai trò quyết định trường tiếp theo và vẫn cho phân công toà', async () => {
    vi.stubGlobal('fetch', createFetchMock().fetchMock)
    await renderScreen()
    await act(async () => button('Tạo tài khoản').click())
    const form = container.querySelector('[data-testid="account-form"]')!
    const role = form.querySelector('select[name="vaiTro"]') as HTMLSelectElement
    role.value = 'THO'
    role.dispatchEvent(new Event('change', { bubbles: true }))
    expect(form.querySelector('input[name="toaNhaIds"][value="1"]')).not.toBeNull()
    expect(container.textContent).toContain('Toà nhà được giao')
  })

  it('FR-AUT-06 khoá tài khoản qua API và giữ bản ghi, không xoá', async () => {
    const { fetchMock } = createFetchMock()
    vi.stubGlobal('fetch', fetchMock)
    await renderScreen()
    await act(async () => button('Khoá Người quản lý').click())
    expect(container.querySelector('[role="dialog"]')).not.toBeNull()
    const confirm = button('Khoá tài khoản')
    expect(fetchMock).not.toHaveBeenCalledWith('/api/nguoi-dung/1/khoa', expect.objectContaining({ method: 'POST' }))
    await act(async () => confirm.click())
    await vi.waitFor(() => expect(container.textContent).toContain('Bị khoá'))
    expect(container.textContent).toContain('Người quản lý')
    expect(container.textContent).not.toContain('Xoá')
    expect(fetchMock).toHaveBeenCalledWith('/api/nguoi-dung/1/khoa', expect.objectContaining({ method: 'POST' }))
  })

  it('FR-AUT-06 yêu cầu xác nhận khoá và giải thích lịch sử vẫn được giữ', async () => {
    vi.stubGlobal('fetch', createFetchMock().fetchMock)
    await renderScreen()
    await act(async () => button('Khoá Người quản lý').click())
    await vi.waitFor(() => expect(container.querySelector('[role="dialog"]')).not.toBeNull())
    expect(container.textContent).toContain('không đăng nhập được nữa')
    expect(container.textContent).toContain('lịch sử thao tác và bản ghi đã tạo vẫn giữ nguyên')
    expect(container.textContent).toContain('mở khoá lại được')
  })

  it('FR-AUT-06 sửa tài khoản hiện có', async () => {
    vi.stubGlobal('fetch', createFetchMock().fetchMock)
    await renderScreen()
    await act(async () => button('Sửa Người quản lý').click())
    const form = container.querySelector('[data-testid="account-form"]') as HTMLFormElement
    await setInput(form.querySelector('input[name="hoTen"]')!, 'Người quản lý mới')
    await act(async () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    await vi.waitFor(() => expect(container.textContent).toContain('Người quản lý mới'))
  })

  it('FR-AUT-06 chặn trùng số điện thoại', async () => {
    const { fetchMock } = createFetchMock()
    vi.stubGlobal('fetch', fetchMock)
    await renderScreen()
    await act(async () => button('Tạo tài khoản').click())
    const form = container.querySelector('[data-testid="account-form"]') as HTMLFormElement
    await setInput(form.querySelector('input[name="hoTen"]')!, 'Tài khoản trùng')
    await setInput(form.querySelector('input[name="soDienThoai"]')!, '0900000001')
    await act(async () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    await vi.waitFor(() => expect(container.textContent).toContain('Số điện thoại đã tồn tại.'))
  })
})
