// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import KhamPhaPhong, { anhXaTrangThaiPhong, layHinhAnhPhong } from './KhamPhaPhong'
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
      expect(container.textContent).toContain('Bảng biểu phí dịch vụ niêm yết')
      expect(container.textContent).toContain('Điện sinh hoạt')
      expect(container.textContent).toContain('3.500 đ / kWh')
    })
  })

  it('filters actual seed amenity spellings and combines selected amenities in the same room', async () => {
    const rooms = [
      { ...MOCK_PHONG[0], tienIch: ['Điều hòa', 'nóng lạnh', 'tủ quần áo', 'chỗ để xe'] },
      { ...MOCK_PHONG[0], id: 102, soPhong: 'P.102', tienIch: ['tủ quần áo', 'ban công'] },
    ]
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => new Response(
      JSON.stringify(String(input).includes('/toa-nha') ? MOCK_TOA_NHA : rooms),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )))
    await act(async () => root.render(<KhamPhaPhong onChuyenDangNhap={vi.fn()} />))
    const chip = (label: string) => container.querySelector(`button[aria-label^="${label} ("]`) as HTMLButtonElement
    expect(chip('Điều hoà').disabled).toBe(false)
    expect(chip('Bình nóng lạnh').disabled).toBe(false)
    expect(chip('Tủ lạnh').disabled).toBe(true)
    expect(chip('Tủ lạnh').getAttribute('aria-label')).toBe('Tủ lạnh (0 phòng)')

    await act(async () => chip('Điều hoà').click())
    await act(async () => chip('Bình nóng lạnh').click())
    expect(container.querySelector('[data-testid="card-phong-P.101"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="card-phong-P.102"]')).toBeNull()
    expect(chip('Ban công').disabled).toBe(true)
    expect(chip('Điều hoà').getAttribute('aria-pressed')).toBe('true')

    await act(async () => Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.startsWith('Xoá bộ lọc tiện ích'))!.click())
    await act(async () => chip('Tủ quần áo').click())
    await act(async () => chip('Ban công').click())
    expect(container.querySelector('[data-testid="card-phong-P.101"]')).toBeNull()
    expect(container.querySelector('[data-testid="card-phong-P.102"]')).not.toBeNull()
  })

  it('updates amenity availability with price filters and lets selected zero-result filters be removed', async () => {
    await act(async () => root.render(<KhamPhaPhong onChuyenDangNhap={vi.fn()} />))
    const chip = () => container.querySelector('button[aria-label^="Điều hoà ("]') as HTMLButtonElement
    await act(async () => chip().click())
    const selects = container.querySelectorAll('select')
    await act(async () => {
      const price = selects[1] as HTMLSelectElement
      price.value = 'TREN_5'
      price.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(container.querySelector('[data-testid="card-phong-P.101"]')).toBeNull()
    expect(chip().getAttribute('aria-label')).toBe('Điều hoà (0 phòng)')
    expect(chip().disabled).toBe(false)
    await act(async () => chip().click())
    expect(chip().getAttribute('aria-pressed')).toBe('false')
  })

  it('correctly maps room statuses using shared anhXaTrangThaiPhong without inferring Sap trong', () => {
    expect(anhXaTrangThaiPhong('TRONG')).toEqual({ label: 'Còn trống', tone: 'done' })
    expect(anhXaTrangThaiPhong('DANG_THUE')).toEqual({ label: 'Đang thuê', tone: 'neutral' })
    expect(anhXaTrangThaiPhong('DA_COC')).toEqual({ label: 'Đã đặt cọc', tone: 'waiting' })
    expect(anhXaTrangThaiPhong('DANG_SUA')).toEqual({ label: 'Đang sửa chữa', tone: 'urgent' })
    expect(anhXaTrangThaiPhong('DANG_SUA_CHUA')).toEqual({ label: 'Đang sửa chữa', tone: 'urgent' })
    expect(anhXaTrangThaiPhong('UNKNOWN')).toEqual({ label: 'UNKNOWN', tone: 'neutral' })
  })

  it('maps buildings and room types to distinct curated image assets', () => {
    expect(layHinhAnhPhong('An Nhiên Residence', 'Studio ban công')).toBe('/rooms/annhien_studio_ban_cong.webp')
    expect(layHinhAnhPhong('An Nhiên Residence', 'Phòng có gác')).toBe('/rooms/annhien_gac_xep.webp')
    expect(layHinhAnhPhong('Nhà Xanh Cầu Giấy', 'Phòng có gác')).toBe('/rooms/nhaxanh_phong_gac.webp')
    expect(layHinhAnhPhong('Mộc Lan Home', 'Studio nội thất')).toBe('/rooms/moclan_studio_go.webp')
    expect(layHinhAnhPhong('Bình Minh Riverside', 'Studio thoáng')).toBe('/rooms/binhminh_cua_so_lon.webp')
    expect(layHinhAnhPhong('Vườn Nắng Apartment', 'Căn hộ cây xanh')).toBe('/rooms/vuonnang_cay_xanh.webp')
  })

  it('renders room card with image, correct status tag for DANG_THUE and DANG_SUA, and substantiated hero metrics', async () => {
    const occupiedRoom = {
      ...MOCK_PHONG[0],
      id: 202,
      soPhong: 'P.202',
      trangThai: 'DANG_THUE',
      loaiPhong: 'Studio ban công',
    }
    const repairingRoom = {
      ...MOCK_PHONG[0],
      id: 303,
      soPhong: 'P.303',
      trangThai: 'DANG_SUA',
      loaiPhong: 'Phòng cơ bản',
    }
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => new Response(
      JSON.stringify(String(input).includes('/toa-nha') ? MOCK_TOA_NHA : [MOCK_PHONG[0], occupiedRoom, repairingRoom]),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )))

    await act(async () => root.render(<KhamPhaPhong onChuyenDangNhap={vi.fn()} />))

    await vi.waitFor(() => {
      const card202 = container.querySelector('[data-testid="card-phong-P.202"]')
      expect(card202).not.toBeNull()
      // Verifies shared status mapping in card: must be 'Đang thuê', NEVER 'Sắp trống'
      expect(card202?.textContent).toContain('Đang thuê')
      expect(card202?.textContent).not.toContain('Sắp trống')
      expect(card202?.textContent).not.toContain('SẮP TRỐNG')

      // Verifies DANG_SUA backend code is mapped to 'Đang sửa chữa'
      const card303 = container.querySelector('[data-testid="card-phong-P.303"]')
      expect(card303).not.toBeNull()
      expect(card303?.textContent).toContain('Đang sửa chữa')

      // Verifies room thumbnail image is rendered
      const img = card202?.querySelector('img')
      expect(img).not.toBeNull()
      expect(img?.getAttribute('src')).toBeTruthy()

      // Verifies substantiated hero metrics (no hardcoded 100% and removed ungrounded claim)
      expect(container.textContent).toContain('Phòng đang quản lý')
      expect(container.textContent).not.toContain('100%')
      expect(container.textContent).not.toContain('Căn hộ mẫu thực tế · Sẵn sàng bàn giao')
      expect(container.textContent).toContain('Ảnh minh hoạ không gian căn hộ')
    })

    // Open detail modal for occupied room
    const btnXem = container.querySelector('[data-testid="btn-xem-bieu-phi-P.202"]') as HTMLButtonElement
    expect(btnXem).not.toBeNull()
    act(() => {
      btnXem.click()
    })

    await vi.waitFor(() => {
      const modal = container.querySelector('[role="dialog"]')
      expect(modal).not.toBeNull()
      // Verifies shared status mapping in modal: must be 'Đang thuê', NEVER 'Sắp trống'
      expect(modal?.textContent).toContain('Đang thuê')
      expect(modal?.textContent).not.toContain('Sắp trống')
      expect(modal?.textContent).not.toContain('SẮP TRỐNG')

      // Verifies room image inside modal
      const modalImg = modal?.querySelector('img')
      expect(modalImg).not.toBeNull()
      expect(modalImg?.getAttribute('src')).toBeTruthy()
    })
  })

  it('prioritizes API anhDaiDien, falls back to illustration on missing or error, and renders 401 Binh Minh Riverside correctly', async () => {
    const phong401BinhMinh: PublicPhong = {
      ...MOCK_PHONG[0],
      id: 58,
      soPhong: '401',
      tenToaNha: 'Bình Minh Riverside',
      loaiPhong: 'Studio nội thất',
      trangThai: 'TRONG',
      anhDaiDien: '/rooms/binhminh_cua_so_lon.webp',
    }
    const phongCustomApi: PublicPhong = {
      ...MOCK_PHONG[0],
      id: 59,
      soPhong: 'P.501',
      tenToaNha: 'An Nhiên Residence',
      loaiPhong: 'Studio ban công',
      trangThai: 'TRONG',
      anhDaiDien: 'https://cdn.example/custom-room-501.webp',
    }
    const phongLoiAnh: PublicPhong = {
      ...MOCK_PHONG[0],
      id: 60,
      soPhong: 'P.601',
      tenToaNha: 'Mộc Lan Home',
      loaiPhong: 'Studio nội thất',
      trangThai: 'TRONG',
      anhDaiDien: 'https://broken-url.invalid/not-found.jpg',
    }
    const phongKhongCoAnh: PublicPhong = {
      ...MOCK_PHONG[0],
      id: 61,
      soPhong: 'P.701',
      tenToaNha: 'Nhà Xanh Cầu Giấy',
      loaiPhong: 'Phòng có gác',
      trangThai: 'TRONG',
      anhDaiDien: '',
    }

    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => new Response(
      JSON.stringify(String(input).includes('/toa-nha') ? MOCK_TOA_NHA : [phong401BinhMinh, phongCustomApi, phongLoiAnh, phongKhongCoAnh]),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )))

    await act(async () => root.render(<KhamPhaPhong onChuyenDangNhap={vi.fn()} />))

    // 1. Kiểm tra phòng 401 Bình Minh Riverside hiển thị đúng ảnh API
    await vi.waitFor(() => {
      const card401 = container.querySelector('[data-testid="card-phong-401"]')
      expect(card401).not.toBeNull()
      const img401 = card401?.querySelector('img')
      expect(img401?.getAttribute('src')).toBe('/rooms/binhminh_cua_so_lon.webp')
      const badge401 = card401?.querySelector('[data-testid="badge-nguon-anh"]')
      expect(badge401?.textContent).toBe('Studio nội thất')
    })

    // 2. Kiểm tra ưu tiên anhDaiDien từ API
    const card501 = container.querySelector('[data-testid="card-phong-P.501"]')
    expect(card501).not.toBeNull()
    const img501 = card501?.querySelector('img')
    expect(img501?.getAttribute('src')).toBe('https://cdn.example/custom-room-501.webp')
    const badge501 = card501?.querySelector('[data-testid="badge-nguon-anh"]')
    expect(badge501?.textContent).toBe('Studio ban công')

    // 3. Kiểm tra phòng không có ảnh -> fallback ảnh minh hoạ và ghi rõ "Ảnh minh hoạ"
    const card701 = container.querySelector('[data-testid="card-phong-P.701"]')
    expect(card701).not.toBeNull()
    const img701 = card701?.querySelector('img')
    expect(img701?.getAttribute('src')).toBe('/rooms/nhaxanh_phong_gac.webp')
    const badge701 = card701?.querySelector('[data-testid="badge-nguon-anh"]')
    expect(badge701?.textContent).toBe('Ảnh minh hoạ')

    // 4. Kiểm tra tải ảnh lỗi -> kích hoạt onError và fallback sang ảnh minh hoạ
    const card601 = container.querySelector('[data-testid="card-phong-P.601"]')
    expect(card601).not.toBeNull()
    const img601 = card601?.querySelector('img') as HTMLImageElement
    expect(img601.getAttribute('src')).toBe('https://broken-url.invalid/not-found.jpg')

    // Kích hoạt lỗi tải ảnh
    act(() => {
      img601.dispatchEvent(new Event('error'))
    })

    await vi.waitFor(() => {
      expect(img601.getAttribute('src')).toBe('/rooms/moclan_studio_go.webp')
      const badge601 = card601?.querySelector('[data-testid="badge-nguon-anh"]')
      expect(badge601?.textContent).toBe('Ảnh minh hoạ')
    })

    // 5. Mở dialog phòng 401 Bình Minh Riverside -> dialog cũng ưu tiên đúng ảnh API
    const btnXem401 = container.querySelector('[data-testid="btn-xem-bieu-phi-401"]') as HTMLButtonElement
    expect(btnXem401).not.toBeNull()
    act(() => {
      btnXem401.click()
    })

    await vi.waitFor(() => {
      const modal = container.querySelector('[role="dialog"]')
      expect(modal).not.toBeNull()
      const modalImg = modal?.querySelector('img')
      expect(modalImg?.getAttribute('src')).toBe('/rooms/binhminh_cua_so_lon.webp')
      const modalBadge = modal?.querySelector('[data-testid="badge-nguon-anh"]')
      expect(modalBadge?.textContent).toBe('Studio nội thất')
    })
  })
})

