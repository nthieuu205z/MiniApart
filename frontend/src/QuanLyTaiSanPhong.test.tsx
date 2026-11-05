// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import QuanLyTaiSanPhong from './QuanLyTaiSanPhong'
import type { TaiSanPhong, BienBanBanGiao } from './api'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

const MOCK_TAI_SAN: TaiSanPhong[] = [
  {
    id: 1,
    phongId: 101,
    soPhong: 'P.101',
    tenTaiSan: 'Điều hoà Panasonic 9000BTU',
    loaiTaiSan: 'ĐIỆN LẠNH',
    soLuong: 1,
    tinhTrang: 'Mới 100%',
    giaTriUocTinh: '7500000.00',
    ghiChu: 'Kèm điều khiển zin',
    ngayLap: '2026-11-04',
  },
  {
    id: 2,
    phongId: 101,
    soPhong: 'P.101',
    tenTaiSan: 'Tủ lạnh Sharp 150L',
    loaiTaiSan: 'ĐIỆN LẠNH',
    soLuong: 1,
    tinhTrang: 'Tốt',
    giaTriUocTinh: '4500000.00',
    ghiChu: 'Hoạt động êm ái',
    ngayLap: '2026-11-04',
  },
]

const MOCK_BIEN_BAN: BienBanBanGiao[] = [
  {
    id: 10,
    hopDongId: 1,
    phongId: 101,
    soPhong: 'P.101',
    loaiBienBan: 'NHAN_PHONG',
    ngayThucHien: '2026-11-01',
    tenNguoiLap: 'Quản lý Toà A',
    ghiChuChung: 'Bàn giao đầy đủ chìa khoá',
    tongTienKhauTru: '0.00',
    chiTiet: [
      {
        id: 101,
        taiSanId: 1,
        tenTaiSan: 'Điều hoà Panasonic 9000BTU',
        soLuong: 1,
        tinhTrangLucGiao: 'Mới 100%',
        tinhTrangLucTra: '',
        tienKhauTru: '0.00',
        lyDoKhauTru: '',
      },
    ],
  },
]

describe('QuanLyTaiSanPhong', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)

    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/api/phong/101/tai-san') && (!init || !init.method || init.method === 'GET')) {
        return Promise.resolve(new Response(JSON.stringify(MOCK_TAI_SAN), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }))
      }
      if (url.includes('/api/phong/101/tai-san') && init?.method === 'POST') {
        return Promise.resolve(new Response(JSON.stringify({ thanhCong: true, taiSanId: 3, thongBao: 'OK' }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }))
      }
      if (url.includes('/api/hop-dong/1/bien-ban-tai-san') && (!init || !init.method || init.method === 'GET')) {
        return Promise.resolve(new Response(JSON.stringify(MOCK_BIEN_BAN), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }))
      }
      if (url.includes('/api/hop-dong/1/bien-ban-tai-san') && init?.method === 'POST') {
        return Promise.resolve(new Response(JSON.stringify({ thanhCong: true, bienBanId: 11, thongBao: 'OK' }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }))
      }
      return Promise.resolve(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }))
    }))
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.restoreAllMocks()
  })

  it('FR-BLD-09 renders list of room assets with conditions and prices', async () => {
    await act(async () => {
      root.render(<QuanLyTaiSanPhong token="mock-token" phongId={101} soPhong="P.101" />)
    })

    expect(container.textContent).toContain('Điều hoà Panasonic 9000BTU')
    expect(container.textContent).toContain('Tủ lạnh Sharp 150L')
    expect(container.textContent).toContain('7.500.000 ₫')
    expect(container.textContent).toContain('Mới 100%')
  })

  it('FR-BLD-09 / US-07 displays handover protocol tab and history when hopDongId is provided', async () => {
    await act(async () => {
      root.render(<QuanLyTaiSanPhong token="mock-token" phongId={101} soPhong="P.101" hopDongId={1} />)
    })

    // Should render the protocol tab
    const bienBanButton = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Biên bản bàn giao')
    )
    expect(bienBanButton).toBeDefined()

    // Switch to protocols tab
    await act(async () => {
      bienBanButton?.click()
    })

    expect(container.textContent).toContain('BÀN GIAO NHẬN PHÒNG')
    expect(container.textContent).toContain('Bàn giao đầy đủ chìa khoá')
  })
})

