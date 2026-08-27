import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ApiError,
  capNhatNguoiDungQuanLy,
  fetchCurrentUser,
  fetchNguoiDungQuanLy,
  fetchHealth,
  fetchToaNha,
  fetchVaiTro,
  khoaNguoiDungQuanLy,
  login,
  taoNguoiDungQuanLy,
  type ThongTinQuanLyNguoiDung,
} from './api'

describe('fetchHealth', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('FR-INF-01 NFR_REL_03 requests the health endpoint through the relative API path', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'UP', database: 'UP' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchHealth()).resolves.toEqual({ status: 'UP', database: 'UP' })
    expect(fetchMock).toHaveBeenCalledWith('/api/health')
  })

  it('FR-AUT-01 posts phone and password to the login endpoint', async () => {
    const runtimePassword = createRuntimePassword()
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          token: 'header.payload.signature',
          thoiHanGiay: 1800,
          nguoiDung: {
            id: 3,
            hoTen: 'Quản lý Toà A',
            soDienThoai: '0900000003',
            vaiTro: 'QUAN_LY',
            tenVaiTro: 'Quản lý toà nhà',
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(login({ soDienThoai: '0900000003', matKhau: runtimePassword })).resolves.toEqual({
      token: 'header.payload.signature',
      thoiHanGiay: 1800,
      nguoiDung: {
        id: 3,
        hoTen: 'Quản lý Toà A',
        soDienThoai: '0900000003',
        vaiTro: 'QUAN_LY',
        tenVaiTro: 'Quản lý toà nhà',
      },
    })
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ soDienThoai: '0900000003', matKhau: runtimePassword }),
    })
  })

  it('FR-AUT-01 requests the current user with the bearer token and surfaces 401 responses', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 3,
            hoTen: 'Quản lý Toà A',
            soDienThoai: '0900000003',
            vaiTro: 'QUAN_LY',
            tenVaiTro: 'Quản lý toà nhà',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ thongBao: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchCurrentUser('header.payload.signature')).resolves.toEqual({
      id: 3,
      hoTen: 'Quản lý Toà A',
      soDienThoai: '0900000003',
      vaiTro: 'QUAN_LY',
      tenVaiTro: 'Quản lý toà nhà',
    })
    await expect(fetchCurrentUser('expired-token')).rejects.toEqual(
      new ApiError(401, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn'),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/auth/me', {
      headers: { Authorization: 'Bearer header.payload.signature' },
    })
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/auth/me', {
      headers: { Authorization: 'Bearer expired-token' },
    })
  })

  it('FR-AUT-06 fetches the account list with the bearer token', async () => {
    const account = accountFixture()
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([account]))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchNguoiDungQuanLy('admin-token')).resolves.toEqual([account])
    expect(fetchMock).toHaveBeenCalledWith('/api/nguoi-dung', {
      headers: { Authorization: 'Bearer admin-token' },
    })
  })

  it('FR-AUT-06 fetches available buildings for account assignment', async () => {
    const buildings = [buildingFixture()]
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(buildings))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchToaNha('admin-token')).resolves.toEqual(buildings)
    expect(fetchMock).toHaveBeenCalledWith('/api/toa-nha', {
      headers: { Authorization: 'Bearer admin-token' },
    })
  })

  it('FR-AUT-06 fetches server-owned role labels for the account form', async () => {
    const roles = [
      { vaiTro: 'THO', tenVaiTro: 'Thợ sửa chữa' },
    ]
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(roles))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchVaiTro('admin-token')).resolves.toEqual(roles)
    expect(fetchMock).toHaveBeenCalledWith('/api/nguoi-dung/vai-tro', {
      headers: { Authorization: 'Bearer admin-token' },
    })
  })

  it('FR-AUT-06 sends account creation data without a password field', async () => {
    const account = accountFixture()
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(account, 201))
    vi.stubGlobal('fetch', fetchMock)
    const payload = {
      hoTen: 'Tài khoản mới',
      soDienThoai: '0901000001',
      vaiTro: 'THO',
      toaNhaIds: [1, 2],
    }

    await expect(taoNguoiDungQuanLy('admin-token', payload)).resolves.toEqual(account)
    expect(fetchMock).toHaveBeenCalledWith('/api/nguoi-dung', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer admin-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  })

  it('FR-AUT-06 updates and locks an account through the management endpoints', async () => {
    const account = accountFixture()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(account))
      .mockResolvedValueOnce(jsonResponse({ ...account, trangThai: 'BI_KHOA', tenTrangThai: 'Bị khoá' }))
    vi.stubGlobal('fetch', fetchMock)
    const payload = {
      hoTen: account.hoTen,
      soDienThoai: account.soDienThoai,
      vaiTro: account.vaiTro,
      toaNhaIds: account.toaNhaIds,
    }

    await expect(capNhatNguoiDungQuanLy('admin-token', account.id, payload)).resolves.toEqual(account)
    await expect(khoaNguoiDungQuanLy('admin-token', account.id)).resolves.toEqual({
      ...account,
      trangThai: 'BI_KHOA',
      tenTrangThai: 'Bị khoá',
    })
    expect(fetchMock).toHaveBeenNthCalledWith(1, `/api/nguoi-dung/${account.id}`, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer admin-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    expect(fetchMock).toHaveBeenNthCalledWith(2, `/api/nguoi-dung/${account.id}/khoa`, {
      method: 'POST',
      headers: { Authorization: 'Bearer admin-token' },
    })
  })
})

function accountFixture(): ThongTinQuanLyNguoiDung {
  return {
    id: 3,
    hoTen: 'Quản lý Toà A',
    soDienThoai: '0900000003',
    vaiTro: 'QUAN_LY',
    tenVaiTro: 'Quản lý toà nhà',
    trangThai: 'HOAT_DONG',
    tenTrangThai: 'Hoạt động',
    toaNhaIds: [1],
  }
}

function buildingFixture() {
  return {
    id: 1,
    maToa: 'A',
    ten: 'Toà A',
    diaChi: 'Địa chỉ Toà A',
    soTang: 5,
    ngayChotSo: 25,
    soNgayHanTt: 7,
    tkNganHang: '123456789',
    nguongThatThoat: '20.00',
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function createRuntimePassword() {
  return `runtime-${Math.random().toString(36).slice(2)}-${Date.now()}`
}
