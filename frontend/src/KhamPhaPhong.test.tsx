// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import KhamPhaPhong from './KhamPhaPhong'
import type { PublicPhong, PublicToaNha } from './api'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

const MOCK_TOA_NHA: PublicToaNha[] = [
  {
    id: 1,
    maToa: 'TOA_A',
    ten: 'Toà A - Ngõ Hoà Bình',
    diaChi: 'Số 10, Ngõ Hoà Bình, Khâm Thiên, Đống Đa, Hà Nội',
    soTang: 5,
    soPhongTrong: 3,
    soPhongDangThue: 2,
  },
]

const MOCK_PHONG: PublicPhong[] = [
  {
    id: 101,
    soPhong: 'P.101',
    toaNhaId: 1,
    tenToaNha: 'Toà A - Ngõ Hoà Bình',
    diaChiToaNha: 'Số 10, Ngõ Hoà Bình, Khâm Thiên, Đống Đa, Hà Nội',
    tang: 1,
    dienTich: 22.5,
    sucChua: 2,
    giaThueMacDinh: 3500000,
    loaiPhong: 'Studio ban công',
    trangThai: 'TRONG',
    tienIch: ['Điều hoà', 'Tủ lạnh', 'Bình nóng lạnh'],
    moTa: 'Phòng tầng 1 có ban công riêng thoáng mát.',
    anhDaiDien: '',
    danhSachDichVu: [
      {
        id: 1,
        maDichVu: 'DIEN',
        tenDichVu: 'Điện sinh hoạt',
        loaiThu: 'DONG_HO',
        donGia: 3500,
        donViTinh: 'kWh',
        ghiChu: 'Theo chỉ số công tơ riêng',
      },
    ],
  },
]

describe('KhamPhaPhong (Public Visitor Portal)', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)

    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/public/toa-nha')) {
        return Promise.resolve(new Response(JSON.stringify(MOCK_TOA_NHA), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      }
      if (url.includes('/api/public/phong')) {
        return Promise.resolve(new Response(JSON.stringify(MOCK_PHONG), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      }
      if (url.includes('/api/public/dat-lich-hen')) {
        return Promise.resolve(new Response(JSON.stringify({ thanhCong: true, lichHenId: 99, thongBao: 'Đặt lịch thành công!' }), { status: 201, headers: { 'Content-Type': 'application/json' } }))
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`))
    }))
  })

  afterEach(async () => {
    await act(async () => {
      root.unmount()
    })
    container.remove()
    vi.restoreAllMocks()
  })

  it('renders public room catalog with transparent tariffs and amenities', async () => {
    const onChuyenDangNhap = vi.fn()

    await act(async () => {
      root.render(<KhamPhaPhong onChuyenDangNhap={onChuyenDangNhap} />)
    })

    await vi.waitFor(() => {
      expect(container.textContent).toContain('P.101')
      expect(container.textContent).toContain('Toà A - Ngõ Hoà Bình')
      expect(container.textContent).toContain('3.500.000 đ')
      expect(container.textContent).toContain('Điều hoà')
    })
  })

  it('navigates to login when clicking switch button', async () => {
    const onChuyenDangNhap = vi.fn()

    await act(async () => {
      root.render(<KhamPhaPhong onChuyenDangNhap={onChuyenDangNhap} />)
    })

    const btn = await vi.waitFor(() => {
      const el = container.querySelector('[data-testid="btn-chuyen-dang-nhap"]') as HTMLButtonElement | null
      expect(el).not.toBeNull()
      return el!
    })

    act(() => {
      btn.click()
    })

    expect(onChuyenDangNhap).toHaveBeenCalledTimes(1)
  })

  it('opens transparent tariff breakdown modal', async () => {
    await act(async () => {
      root.render(<KhamPhaPhong onChuyenDangNhap={vi.fn()} />)
    })

    const btnXem = await vi.waitFor(() => {
      const el = container.querySelector('[data-testid="btn-xem-bieu-phi-P.101"]') as HTMLButtonElement | null
      expect(el).not.toBeNull()
      return el!
    })

    act(() => {
      btnXem.click()
    })

    await vi.waitFor(() => {
      expect(container.textContent).toContain('BẢNG BIỂU PHÍ DỊCH VỤ NIÊM YẾT')
      expect(container.textContent).toContain('Điện sinh hoạt')
      expect(container.textContent).toContain('3.500 đ / kWh')
    })
  })
})

