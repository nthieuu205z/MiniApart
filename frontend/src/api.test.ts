import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, fetchCurrentUser, fetchHealth, login } from './api'

describe('fetchHealth', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('requests the health endpoint through the relative API path', async () => {
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
})

function createRuntimePassword() {
  return `runtime-${Math.random().toString(36).slice(2)}-${Date.now()}`
}
