// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { clearStoredToken } from './authSession'
import type { ThongTinNguoiDung, ThongTinQuanLyNguoiDung, ThongTinToaNha } from './api'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

type MountedApp = {
  container: HTMLDivElement
  root: Root
}

const MENU_BY_ROLE: Array<{
  nguoiDung: ThongTinNguoiDung
  menuLabels: string[]
}> = [
  {
    nguoiDung: {
      id: 1,
      hoTen: 'Quản trị hệ thống',
      soDienThoai: '0900000001',
      vaiTro: 'QTHT',
      tenVaiTro: 'Quản trị hệ thống',
    },
    menuLabels: ['Tài khoản', 'Toà nhà', 'Nhật ký thao tác'],
  },
  {
    nguoiDung: {
      id: 2,
      hoTen: 'Chủ sở hữu mẫu',
      soDienThoai: '0900000002',
      vaiTro: 'CHU',
      tenVaiTro: 'Chủ sở hữu',
    },
    menuLabels: ['Tổng quan', 'Toà nhà', 'Hoá đơn', 'Công nợ', 'Báo cáo', 'Sự cố', 'An toàn'],
  },
  {
    nguoiDung: {
      id: 3,
      hoTen: 'Quản lý Toà A',
      soDienThoai: '0900000003',
      vaiTro: 'QUAN_LY',
      tenVaiTro: 'Quản lý toà nhà',
    },
    menuLabels: ['Nhắc việc', 'Ghi chỉ số', 'Hoá đơn', 'Thu tiền', 'Phòng', 'Hợp đồng', 'Sự cố', 'Thông báo'],
  },
  {
    nguoiDung: {
      id: 4,
      hoTen: 'Thợ sửa chữa mẫu',
      soDienThoai: '0900000004',
      vaiTro: 'THO',
      tenVaiTro: 'Thợ sửa chữa',
    },
    menuLabels: ['Việc của tôi'],
  },
  {
    nguoiDung: {
      id: 5,
      hoTen: 'Người thuê mẫu',
      soDienThoai: '0900000006',
      vaiTro: 'NGUOI_THUE',
      tenVaiTro: 'Người thuê',
    },
    menuLabels: ['Hoá đơn của tôi', 'Lịch sử', 'Hợp đồng', 'Báo hỏng'],
  },
]

describe('App role navigation', () => {
  let mountedApp: MountedApp | null = null

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    vi.restoreAllMocks()
    clearStoredToken()
    window.history.replaceState({}, '', '/')
    document.body.innerHTML = ''
  })

  afterEach(async () => {
    if (mountedApp) {
      await act(async () => {
        mountedApp?.root.unmount()
      })
      mountedApp = null
    }
    clearStoredToken()
    vi.restoreAllMocks()
  })

  it.each(MENU_BY_ROLE)(
    'FR-AUT-04 shows the exact menu for server role $nguoiDung.vaiTro',
    async ({ nguoiDung, menuLabels }) => {
      mountedApp = await mountAppAndLogin(nguoiDung)

      await vi.waitFor(() => {
        expect(readMenuLabels(mountedApp!.container)).toEqual(menuLabels)
      })

      expect(mountedApp.container.textContent).toContain(nguoiDung.tenVaiTro)
      expect(mountedApp.container.textContent).toContain('Trang chủ')
    },
  )

  it('FR-AUT-04 shows a friendly no-permission state for a typed route outside the role menu', async () => {
    const chuSoHuu = MENU_BY_ROLE[1]
    mountedApp = await mountAppAndLogin(chuSoHuu.nguoiDung, '/tai-khoan')

    await vi.waitFor(() => {
      expect(mountedApp!.container.textContent).toContain('Không có quyền')
    })

    expect(readMenuLabels(mountedApp.container)).toEqual(chuSoHuu.menuLabels)
    expect(mountedApp.container.textContent).toContain('Đường dẫn không thuộc vai trò hiện tại')
  })

  it('FR-AUT-06 gives QTHT an account management screen with records and safe actions', async () => {
    const quanTriHeThong = MENU_BY_ROLE[0]
    mountedApp = await mountAppAndLogin(quanTriHeThong.nguoiDung, '/tai-khoan')

    await vi.waitFor(() => {
      expect(mountedApp!.container.querySelector('[data-testid="account-management"]')).not.toBeNull()
      expect(mountedApp!.container.textContent).toContain('Chủ sở hữu mẫu')
    })

    expect(mountedApp.container.textContent).toContain('Quản lý tài khoản')
    expect(mountedApp.container.textContent).toContain('Hoạt động (máy chủ)')
    expect(mountedApp.container.textContent).toContain('Tạo tài khoản')
    expect(mountedApp.container.textContent).toContain('Khoá')
    expect(mountedApp.container.textContent).not.toContain('Mật khẩu của người dùng khác')
  })

  it('FR-AUT-06 lets QTHT create, edit, assign buildings, and lock an account without a password field', async () => {
    const quanTriHeThong = MENU_BY_ROLE[0]
    const fetchMock = buildFetchMock(quanTriHeThong.nguoiDung)
    vi.stubGlobal('fetch', fetchMock)
    mountedApp = await mountAppAndLogin(quanTriHeThong.nguoiDung, '/tai-khoan', fetchMock)

    await vi.waitFor(() => {
      expect(mountedApp!.container.querySelector('[data-testid="account-management"]')).not.toBeNull()
    })

    const createButton = findButton(mountedApp.container, 'Tạo tài khoản')
    await act(async () => {
      createButton.click()
    })

    const accountForm = await vi.waitFor(() => {
      const form = mountedApp!.container.querySelector('[data-testid="account-form"]')
      expect(form).not.toBeNull()
      return form as HTMLFormElement
    })
    expect((accountForm.querySelector('option[value="THO"]') as HTMLOptionElement).textContent).toBe('Thợ sửa chữa (máy chủ)')
    await act(async () => {
      setInputValue(accountForm.querySelector('input[name="hoTen"]') as HTMLInputElement, 'Thợ trực mới')
      setInputValue(accountForm.querySelector('input[name="soDienThoai"]') as HTMLInputElement, '0901000001')
      setSelectValue(accountForm.querySelector('select[name="vaiTro"]') as HTMLSelectElement, 'THO')
      ;(accountForm.querySelector('input[name="toaNhaIds"][value="2"]') as HTMLInputElement).click()
      accountForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/nguoi-dung', expect.objectContaining({ method: 'POST' }))
      expect(mountedApp!.container.textContent).toContain('Thợ trực mới')
    })
    const createCall = fetchMock.mock.calls.find(([input, init]) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url
      return url === '/api/nguoi-dung' && init?.method === 'POST'
    })
    expect(JSON.parse(String(createCall?.[1]?.body))).toEqual({
      hoTen: 'Thợ trực mới',
      soDienThoai: '0901000001',
      vaiTro: 'THO',
      toaNhaIds: [2],
    })

    const editButton = findButton(mountedApp.container, 'Sửa Thợ trực mới')
    await act(async () => {
      editButton.click()
    })
    const editForm = await vi.waitFor(() => {
      const form = mountedApp!.container.querySelector('[data-testid="account-form"]')
      expect(form).not.toBeNull()
      return form as HTMLFormElement
    })
    await act(async () => {
      setInputValue(editForm.querySelector('input[name="hoTen"]') as HTMLInputElement, 'Thợ trực mới đã sửa')
      editForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    await vi.waitFor(() => {
      expect(mountedApp!.container.textContent).toContain('Thợ trực mới đã sửa')
    })
    const lockButton = findButton(mountedApp.container, 'Khoá Thợ trực mới đã sửa')
    await act(async () => {
      lockButton.click()
    })

    await vi.waitFor(() => {
      expect(mountedApp!.container.textContent).toContain('Bị khoá')
    })
    expect(mountedApp.container.textContent).not.toContain('Xoá')
  })
})

async function mountAppAndLogin(nguoiDung: ThongTinNguoiDung, path = '/', fetchMock = buildFetchMock(nguoiDung)) {
  window.history.replaceState({}, '', '/')
  vi.stubGlobal('fetch', fetchMock)

  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)

  await act(async () => {
    root.render(<App />)
  })

  const form = await vi.waitFor(() => {
    const loginForm = container.querySelector('form')
    expect(loginForm).not.toBeNull()
    return loginForm as HTMLFormElement
  })
  const phoneInput = form.querySelector('input[autocomplete="username"]') as HTMLInputElement
  const passwordInput = form.querySelector('input[type="password"]') as HTMLInputElement

  await act(async () => {
    setInputValue(phoneInput, '0900000099')
    setInputValue(passwordInput, 'runtime-ticket-05')
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })

  if (path !== '/') {
    window.history.replaceState({}, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return { container, root }
}

function setInputValue(input: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  valueSetter?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

function setSelectValue(select: HTMLSelectElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set
  valueSetter?.call(select, value)
  select.dispatchEvent(new Event('change', { bubbles: true }))
}

function findButton(container: HTMLDivElement, label: string) {
  const button = [...container.querySelectorAll('button')].find((candidate) => candidate.textContent?.trim() === label)
  expect(button).not.toBeUndefined()
  return button as HTMLButtonElement
}

function buildFetchMock(nguoiDung: ThongTinNguoiDung) {
  const accounts: ThongTinQuanLyNguoiDung[] = [
    {
      id: 1,
      hoTen: 'Quản trị hệ thống',
      soDienThoai: '0900000001',
      vaiTro: 'QTHT',
      tenVaiTro: 'Quản trị hệ thống',
      trangThai: 'HOAT_DONG',
      tenTrangThai: 'Hoạt động',
      toaNhaIds: [],
    },
    {
      id: 2,
      hoTen: 'Chủ sở hữu mẫu',
      soDienThoai: '0900000002',
      vaiTro: 'CHU',
      tenVaiTro: 'Chủ sở hữu',
      trangThai: 'HOAT_DONG',
      tenTrangThai: 'Hoạt động (máy chủ)',
      toaNhaIds: [1, 2],
    },
  ]
  const buildings: ThongTinToaNha[] = [
    {
      id: 1,
      maToa: 'A',
      ten: 'Toà A',
      diaChi: 'Địa chỉ Toà A',
      soTang: 5,
      ngayChotSo: 25,
      soNgayHanTt: 7,
      tkNganHang: '123456789',
      nguongThatThoat: '20.00',
    },
    {
      id: 2,
      maToa: 'B',
      ten: 'Toà B',
      diaChi: 'Địa chỉ Toà B',
      soTang: 5,
      ngayChotSo: 25,
      soNgayHanTt: 7,
      tkNganHang: '987654321',
      nguongThatThoat: '20.00',
    },
  ]
  const roles = [
    { vaiTro: 'QTHT', tenVaiTro: 'Quản trị hệ thống' },
    { vaiTro: 'CHU', tenVaiTro: 'Chủ sở hữu' },
    { vaiTro: 'QUAN_LY', tenVaiTro: 'Quản lý toà nhà' },
    { vaiTro: 'THO', tenVaiTro: 'Thợ sửa chữa (máy chủ)' },
    { vaiTro: 'NGUOI_THUE', tenVaiTro: 'Người thuê' },
  ]
  let nextAccountId = 6

  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url
    const method = init?.method ?? 'GET'

    if (url === '/api/health') {
      return new Response(JSON.stringify({ status: 'UP', database: 'UP' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (url === '/api/auth/login') {
      return new Response(
        JSON.stringify({
          token: 'header.payload.signature',
          thoiHanGiay: 1800,
          nguoiDung,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    if (url === '/api/nguoi-dung/vai-tro') {
      return new Response(JSON.stringify(roles), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (url === '/api/nguoi-dung' && method === 'GET') {
      return new Response(JSON.stringify(accounts), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (url === '/api/toa-nha') {
      return new Response(JSON.stringify(buildings), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (url === '/api/nguoi-dung' && method === 'POST') {
      const payload = JSON.parse(String(init?.body)) as Omit<ThongTinQuanLyNguoiDung, 'id' | 'tenVaiTro' | 'trangThai' | 'tenTrangThai'>
      const created: ThongTinQuanLyNguoiDung = {
        ...payload,
        id: nextAccountId++,
        tenVaiTro: 'Thợ sửa chữa',
        trangThai: 'HOAT_DONG',
        tenTrangThai: 'Hoạt động',
      }
      accounts.push(created)
      return new Response(JSON.stringify(created), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const accountIdMatch = url.match(/^\/api\/nguoi-dung\/(\d+)(?:\/khoa)?$/)
    if (accountIdMatch && method === 'PUT') {
      const accountId = Number(accountIdMatch[1])
      const current = accounts.find((account) => account.id === accountId)
      if (!current) throw new Error(`Unknown account: ${accountId}`)
      const payload = JSON.parse(String(init?.body)) as Omit<ThongTinQuanLyNguoiDung, 'id' | 'tenVaiTro' | 'trangThai' | 'tenTrangThai'>
      const updated = {
        ...current,
        ...payload,
        id: accountId,
        tenVaiTro: payload.vaiTro === 'THO' ? 'Thợ sửa chữa' : current?.tenVaiTro ?? 'Quản trị hệ thống',
        trangThai: current?.trangThai ?? 'HOAT_DONG',
      }
      const accountIndex = accounts.findIndex((account) => account.id === accountId)
      accounts[accountIndex] = updated
      return new Response(JSON.stringify(updated), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (accountIdMatch && method === 'POST') {
      const accountId = Number(accountIdMatch[1])
      const accountIndex = accounts.findIndex((account) => account.id === accountId)
      if (accountIndex < 0) throw new Error(`Unknown account: ${accountId}`)
      const locked = { ...accounts[accountIndex], trangThai: 'BI_KHOA', tenTrangThai: 'Bị khoá' }
      accounts[accountIndex] = locked
      return new Response(JSON.stringify(locked), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    throw new Error(`Unexpected fetch: ${url}`)
  })
}

function readMenuLabels(container: HTMLDivElement) {
  return [...container.querySelectorAll('nav a')].map((link) => link.textContent?.trim() ?? '')
}
