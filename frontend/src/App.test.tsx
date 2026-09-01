// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App, { layDinhDanhHoaDonTuUrl } from './App'
import { clearStoredToken } from './authSession'
import type { ThongTinNguoiDung, ThongTinPhong, ThongTinQuanLyNguoiDung, ThongTinToaNha } from './api'

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

  it('FR-AUT-04 shows the manager shell with grouped navigation and top-bar context', async () => {
    const quanLyToaNha = MENU_BY_ROLE[2]
    mountedApp = await mountAppAndLogin(quanLyToaNha.nguoiDung)

    await vi.waitFor(() => {
      expect(mountedApp!.container.textContent).toContain('Hàng ngày')
      expect(mountedApp!.container.textContent).toContain('Tiền')
      expect(mountedApp!.container.textContent).toContain('Toà nhà')
      expect(mountedApp!.container.textContent).toContain('Thông báo')
    })

    expect(mountedApp.container.textContent).toContain('Quản lý toà nhà')
    expect(mountedApp.container.textContent).toContain('Kỳ')
  })

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

  it('FR-BLD-01 lets the owner create and edit a building while showing the February closing-day rule', async () => {
    const chuSoHuu = MENU_BY_ROLE[1]
    const fetchMock = buildFetchMock(chuSoHuu.nguoiDung)
    vi.stubGlobal('fetch', fetchMock)
    mountedApp = await mountAppAndLogin(chuSoHuu.nguoiDung, '/toa-nha', fetchMock)

    await vi.waitFor(() => {
      expect(mountedApp!.container.querySelector('[data-testid="building-catalog"]')).not.toBeNull()
      expect(mountedApp!.container.textContent).toContain('Toà A')
    })

    expect(mountedApp.container.textContent).toContain('tháng hai')

    await act(async () => {
      findButton(mountedApp!.container, 'Khai báo toà mới').click()
    })

    const createForm = await vi.waitFor(() => {
      const form = mountedApp!.container.querySelector('[data-testid="building-form"]')
      expect(form).not.toBeNull()
      return form as HTMLFormElement
    })

    await act(async () => {
      setInputValue(createForm.querySelector('input[name="maToa"]') as HTMLInputElement, 'TN-C')
      setInputValue(createForm.querySelector('input[name="ten"]') as HTMLInputElement, 'Toà C')
      setTextAreaValue(createForm.querySelector('textarea[name="diaChi"]') as HTMLTextAreaElement, 'Địa chỉ mới')
      setInputValue(createForm.querySelector('input[name="soTang"]') as HTMLInputElement, '3')
      setInputValue(createForm.querySelector('input[name="ngayChotSo"]') as HTMLInputElement, '28')
      setInputValue(createForm.querySelector('input[name="soNgayHanTt"]') as HTMLInputElement, '5')
      setInputValue(createForm.querySelector('input[name="tkNganHang"]') as HTMLInputElement, '0123456789')
      setInputValue(createForm.querySelector('input[name="nguongThatThoat"]') as HTMLInputElement, '12.35')
    })

    const mandatoryPhotoPolicy = createForm.querySelector('input[name="batBuocAnhCongTo"]') as HTMLInputElement
    expect(mandatoryPhotoPolicy.checked).toBe(false)

    await act(async () => {
      createForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/toa-nha', expect.objectContaining({ method: 'POST' }))
      expect(mountedApp!.container.textContent).toContain('Toà C')
    })

    const createCall = fetchMock.mock.calls.find(([input, init]) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url
      return url === '/api/toa-nha' && init?.method === 'POST'
    })
    expect(JSON.parse(String(createCall?.[1]?.body))).toEqual({
      maToa: 'TN-C',
      ten: 'Toà C',
      diaChi: 'Địa chỉ mới',
      soTang: 3,
      ngayChotSo: 28,
      soNgayHanTt: 5,
      tkNganHang: '0123456789',
      nguongThatThoat: '12.35',
      batBuocAnhCongTo: false,
    })

    await act(async () => {
      findButton(mountedApp!.container, 'Sửa Toà C').click()
    })

    const editForm = await vi.waitFor(() => {
      const form = mountedApp!.container.querySelector('[data-testid="building-form"]')
      expect(form).not.toBeNull()
      return form as HTMLFormElement
    })

    await act(async () => {
      setInputValue(editForm.querySelector('input[name="ten"]') as HTMLInputElement, 'Toà C đã sửa')
      editForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    await vi.waitFor(() => {
      expect(mountedApp!.container.textContent).toContain('Toà C đã sửa')
      expect(mountedApp!.container.textContent).toContain('12.35')
    })
  })

  it('FR-BLD-02 lets the manager filter rooms by floor, create a room without client status, preview a batch, and confirm it later', async () => {
    const quanLy = MENU_BY_ROLE[2]
    const fetchMock = buildFetchMock(quanLy.nguoiDung)
    vi.stubGlobal('fetch', fetchMock)
    mountedApp = await mountAppAndLogin(quanLy.nguoiDung, '/phong', fetchMock)

    await vi.waitFor(() => {
      expect(mountedApp!.container.querySelector('[data-testid="room-catalog"]')).not.toBeNull()
      expect(mountedApp!.container.textContent).toContain('201')
      expect(mountedApp!.container.textContent).toContain('101')
    })

    const roomForm = mountedApp.container.querySelector('[data-testid="room-form"]')
    expect(roomForm).not.toBeNull()
    expect(roomForm?.textContent).not.toContain('Trạng thái')

    await act(async () => {
      setSelectValue(mountedApp!.container.querySelector('select[name="tangLoc"]') as HTMLSelectElement, '3')
    })

    await vi.waitFor(() => {
      expect(mountedApp!.container.textContent).toContain('301')
      expect(mountedApp!.container.textContent).not.toContain('201')
      expect(mountedApp!.container.textContent).not.toContain('101')
    })

    await act(async () => {
      setInputValue(roomForm!.querySelector('input[name="soPhong"]') as HTMLInputElement, '305')
      setInputValue(roomForm!.querySelector('input[name="tang"]') as HTMLInputElement, '3')
      setInputValue(roomForm!.querySelector('input[name="dienTich"]') as HTMLInputElement, '22.50')
      setInputValue(roomForm!.querySelector('input[name="sucChua"]') as HTMLInputElement, '4')
      setInputValue(roomForm!.querySelector('input[name="giaThueMacDinh"]') as HTMLInputElement, '3500000.00')
      setInputValue(roomForm!.querySelector('input[name="loaiPhong"]') as HTMLInputElement, 'Studio')
      roomForm!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/toa-nha/1/phong', expect.objectContaining({ method: 'POST' }))
      expect(mountedApp!.container.textContent).toContain('305')
    })
    expect(mountedApp.container.textContent).not.toContain('Chi tiết phòng 305')

    const createCall = fetchMock.mock.calls.find(([input, init]) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url
      return url === '/api/toa-nha/1/phong' && init?.method === 'POST'
    })
    expect(JSON.parse(String(createCall?.[1]?.body))).toEqual({
      soPhong: '305',
      tang: 3,
      dienTich: '22.50',
      sucChua: 4,
      giaThueMacDinh: '3500000.00',
      loaiPhong: 'Studio',
    })

    await act(async () => {
      setSelectValue(mountedApp!.container.querySelector('select[name="tangLoc"]') as HTMLSelectElement, '')
      findButton(mountedApp!.container, 'Xem trước dãy phòng').click()
    })

    const previewForm = await vi.waitFor(() => {
      const form = mountedApp!.container.querySelector('[data-testid="room-batch-form"]')
      expect(form).not.toBeNull()
      return form as HTMLFormElement
    })

    await act(async () => {
      setInputValue(previewForm.querySelector('input[name="soBatDau"]') as HTMLInputElement, '201')
      setInputValue(previewForm.querySelector('input[name="soKetThuc"]') as HTMLInputElement, '203')
      setInputValue(previewForm.querySelector('input[name="tang"]') as HTMLInputElement, '2')
      setInputValue(previewForm.querySelector('input[name="dienTich"]') as HTMLInputElement, '20.00')
      setInputValue(previewForm.querySelector('input[name="sucChua"]') as HTMLInputElement, '3')
      setInputValue(previewForm.querySelector('input[name="giaThueMacDinh"]') as HTMLInputElement, '3200000.00')
      setInputValue(previewForm.querySelector('input[name="loaiPhong"]') as HTMLInputElement, 'Studio')
      previewForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/toa-nha/1/phong/hang-loat/xem-truoc', expect.objectContaining({ method: 'POST' }))
      expect(mountedApp!.container.textContent).toContain('201, 202, 203')
    })
    expect(mountedApp.container.textContent).not.toContain('Đã tạo dãy phòng')

    await act(async () => {
      findButton(mountedApp!.container, 'Xác nhận tạo dãy phòng').click()
    })

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/toa-nha/1/phong/hang-loat', expect.objectContaining({ method: 'POST' }))
      expect(mountedApp!.container.textContent).toContain('Đã tạo dãy phòng 201 - 203.')
      expect(mountedApp!.container.textContent).toContain('203')
    })
    expect(mountedApp.container.textContent).not.toContain('Chi tiết phòng 201')
  })

  it('FR-BLD-02 confirms the exact batch payload that was previewed even after the form changes', async () => {
    const quanLy = MENU_BY_ROLE[2]
    const fetchMock = buildFetchMock(quanLy.nguoiDung)
    vi.stubGlobal('fetch', fetchMock)
    mountedApp = await mountAppAndLogin(quanLy.nguoiDung, '/phong', fetchMock)

    await vi.waitFor(() => {
      expect(mountedApp!.container.querySelector('[data-testid="room-catalog"]')).not.toBeNull()
    })

    await act(async () => {
      findButton(mountedApp!.container, 'Xem trước dãy phòng').click()
    })

    const previewForm = await vi.waitFor(() => {
      const form = mountedApp!.container.querySelector('[data-testid="room-batch-form"]')
      expect(form).not.toBeNull()
      return form as HTMLFormElement
    })

    const previewPayload = {
      soBatDau: '401',
      soKetThuc: '403',
      tang: 4,
      dienTich: '21.50',
      sucChua: 4,
      giaThueMacDinh: '4500000.00',
      loaiPhong: 'Penthouse',
    }

    await act(async () => {
      setInputValue(previewForm.querySelector('input[name="soBatDau"]') as HTMLInputElement, previewPayload.soBatDau)
      setInputValue(previewForm.querySelector('input[name="soKetThuc"]') as HTMLInputElement, previewPayload.soKetThuc)
      setInputValue(previewForm.querySelector('input[name="tang"]') as HTMLInputElement, String(previewPayload.tang))
      setInputValue(previewForm.querySelector('input[name="dienTich"]') as HTMLInputElement, previewPayload.dienTich)
      setInputValue(previewForm.querySelector('input[name="sucChua"]') as HTMLInputElement, String(previewPayload.sucChua))
      setInputValue(previewForm.querySelector('input[name="giaThueMacDinh"]') as HTMLInputElement, previewPayload.giaThueMacDinh)
      setInputValue(previewForm.querySelector('input[name="loaiPhong"]') as HTMLInputElement, previewPayload.loaiPhong)
      previewForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    await vi.waitFor(() => {
      expect(mountedApp!.container.textContent).toContain('401, 402, 403')
    })

    await act(async () => {
      setInputValue(previewForm.querySelector('input[name="soBatDau"]') as HTMLInputElement, '501')
      setInputValue(previewForm.querySelector('input[name="soKetThuc"]') as HTMLInputElement, '502')
      setInputValue(previewForm.querySelector('input[name="tang"]') as HTMLInputElement, '5')
      setInputValue(previewForm.querySelector('input[name="dienTich"]') as HTMLInputElement, '99.99')
      setInputValue(previewForm.querySelector('input[name="sucChua"]') as HTMLInputElement, '9')
      setInputValue(previewForm.querySelector('input[name="giaThueMacDinh"]') as HTMLInputElement, '9999999.99')
      setInputValue(previewForm.querySelector('input[name="loaiPhong"]') as HTMLInputElement, 'Loft')
      findButton(mountedApp!.container, 'Xác nhận tạo dãy phòng').click()
    })

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/toa-nha/1/phong/hang-loat', expect.objectContaining({ method: 'POST' }))
    })

    const confirmCall = fetchMock.mock.calls.find(([input, init]) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url
      return url === '/api/toa-nha/1/phong/hang-loat' && init?.method === 'POST'
    })
    expect(JSON.parse(String(confirmCall?.[1]?.body))).toEqual(previewPayload)
  })

  it('FR-BLD-02 does not append a newly created room outside the active floor filter', async () => {
    const quanLy = MENU_BY_ROLE[2]
    const fetchMock = buildFetchMock(quanLy.nguoiDung)
    vi.stubGlobal('fetch', fetchMock)
    mountedApp = await mountAppAndLogin(quanLy.nguoiDung, '/phong', fetchMock)

    await vi.waitFor(() => {
      expect(mountedApp!.container.querySelector('[data-testid="room-catalog"]')).not.toBeNull()
    })

    await act(async () => {
      setSelectValue(mountedApp!.container.querySelector('select[name="tangLoc"]') as HTMLSelectElement, '3')
    })

    await vi.waitFor(() => {
      expect(mountedApp!.container.textContent).toContain('301')
      expect(mountedApp!.container.textContent).not.toContain('201')
    })

    const roomForm = mountedApp!.container.querySelector('[data-testid="room-form"]') as HTMLFormElement
    await act(async () => {
      setInputValue(roomForm.querySelector('input[name="soPhong"]') as HTMLInputElement, '205')
      setInputValue(roomForm.querySelector('input[name="tang"]') as HTMLInputElement, '2')
      setInputValue(roomForm.querySelector('input[name="dienTich"]') as HTMLInputElement, '20.00')
      setInputValue(roomForm.querySelector('input[name="sucChua"]') as HTMLInputElement, '3')
      setInputValue(roomForm.querySelector('input[name="giaThueMacDinh"]') as HTMLInputElement, '3200000.00')
      setInputValue(roomForm.querySelector('input[name="loaiPhong"]') as HTMLInputElement, 'Studio')
      roomForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/toa-nha/1/phong', expect.objectContaining({ method: 'POST' }))
    })
    expect(mountedApp!.container.querySelector('.room-management .building-list')?.textContent).not.toContain('205')
  })

  it('FR-BLD-03 groups rooms by floor, shows compact status totals, and opens room detail from existing room data', async () => {
    const quanLy = MENU_BY_ROLE[2]
    const fetchMock = buildFetchMock(quanLy.nguoiDung, {
      roomsByBuilding: new Map<number, ThongTinPhong[]>([
        [1, buildFloorMapRooms(1)],
        [2, []],
      ]),
    })
    vi.stubGlobal('fetch', fetchMock)
    mountedApp = await mountAppAndLogin(quanLy.nguoiDung, '/phong', fetchMock)

    const floorMap = await vi.waitFor(() => {
      const element = mountedApp!.container.querySelector('[data-testid="room-floor-map"]')
      expect(element).not.toBeNull()
      return element as HTMLElement
    })

    const floorSections = [...floorMap.querySelectorAll('[data-testid="room-floor-section"]')]
    expect(floorSections).toHaveLength(4)
    expect(floorSections.map((section) => section.querySelector('h4')?.textContent?.trim())).toEqual([
      'Tầng 4',
      'Tầng 3',
      'Tầng 2',
      'Tầng 1',
    ])

    const firstFloorRooms = [...floorSections[0].querySelectorAll('[data-testid="room-tile"]')].map(
      (tile) => tile.querySelector('.room-tile__number')?.textContent?.trim(),
    )
    expect(firstFloorRooms).toEqual(['401', '402', '403', '404', '405'])

    const compactGrid = floorMap.querySelector('[data-testid="room-floor-grid"]')
    expect(compactGrid?.getAttribute('data-compact-layout')).toBe('true')
    expect(floorMap.querySelectorAll('[data-testid="room-tile"]')).toHaveLength(20)
    expect(mountedApp.container.textContent).toContain('20 phòng')

    const summaryCards = [...mountedApp.container.querySelectorAll('.room-status-chip')].map((card) => card.textContent?.replace(/\s+/g, ''))
    expect(summaryCards).toEqual(['Trống5', 'Đangthuê7', 'Đangsửa4'])

    const roomDetailBeforeClick = mountedApp.container.querySelector('[data-testid="room-detail"]')
    expect(roomDetailBeforeClick?.textContent).toContain('Chọn một ô phòng trong sơ đồ để xem chi tiết hiện tại của phòng đó.')
    expect(roomDetailBeforeClick?.textContent).not.toContain('Chi tiết phòng 403')
    expect(roomDetailBeforeClick?.textContent).not.toContain('Lịch sử công tơ')

    const tile403 = [...mountedApp.container.querySelectorAll('[data-testid="room-tile"]')].find(
      (tile) => tile.querySelector('.room-tile__number')?.textContent?.trim() === '403',
    )
    expect(tile403).not.toBeUndefined()
    expect(tile403?.textContent).toContain('Đã đặt cọc')
    expect(tile403?.className).toContain('room-tile--da_coc')

    const tile204 = [...mountedApp.container.querySelectorAll('[data-testid="room-tile"]')].find(
      (tile) => tile.querySelector('.room-tile__number')?.textContent?.trim() === '204',
    )
    expect(tile204).not.toBeUndefined()
    expect(tile204?.textContent).toContain('Ngừng')
    expect(tile204?.className).toContain('room-tile--ngung')

    await act(async () => {
      ;(tile403 as HTMLButtonElement).click()
    })

    const roomDetail = await vi.waitFor(() => {
      const detail = mountedApp!.container.querySelector('[data-testid="room-detail"]')
      expect(detail).not.toBeNull()
      expect(detail?.textContent).toContain('403')
      return detail as HTMLElement
    })

    expect(roomDetail.textContent).toContain('Đã đặt cọc')
    expect(roomDetail.textContent).toContain('Gác xép')
    expect(roomDetail.textContent).toContain('31.50')
    expect(roomDetail.textContent).toContain('5100000.00')
    expect(roomDetail.textContent).toContain('Chi tiết lấy trực tiếp từ danh sách phòng hiện có.')
    expect(roomDetail.textContent).not.toContain('Lịch sử công tơ')
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
    await act(async () => {
      window.history.replaceState({}, '', path)
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
  }

  return { container, root }
}

function setInputValue(input: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  valueSetter?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

function setTextAreaValue(textarea: HTMLTextAreaElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
  valueSetter?.call(textarea, value)
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
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

function buildFetchMock(
  nguoiDung: ThongTinNguoiDung,
  options?: {
    roomsByBuilding?: Map<number, ThongTinPhong[]>
    invoiceResponse?: Record<string, unknown>
  },
) {
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
      batBuocAnhCongTo: false,
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
      batBuocAnhCongTo: false,
    },
  ]
  const roles = [
    { vaiTro: 'QTHT', tenVaiTro: 'Quản trị hệ thống' },
    { vaiTro: 'CHU', tenVaiTro: 'Chủ sở hữu' },
    { vaiTro: 'QUAN_LY', tenVaiTro: 'Quản lý toà nhà' },
    { vaiTro: 'THO', tenVaiTro: 'Thợ sửa chữa (máy chủ)' },
    { vaiTro: 'NGUOI_THUE', tenVaiTro: 'Người thuê' },
  ]
  const roomsByBuilding = options?.roomsByBuilding ?? new Map<number, ThongTinPhong[]>([
    [1, [
      {
        id: 11,
        toaNhaId: 1,
        soPhong: '101',
        tang: 1,
        dienTich: '18.00',
        sucChua: 2,
        giaThueMacDinh: '2800000.00',
        loaiPhong: 'Studio',
        trangThai: 'TRONG',
        tenTrangThai: 'Trống',
      },
      {
        id: 12,
        toaNhaId: 1,
        soPhong: '201',
        tang: 2,
        dienTich: '20.00',
        sucChua: 3,
        giaThueMacDinh: '3200000.00',
        loaiPhong: 'Studio',
        trangThai: 'TRONG',
        tenTrangThai: 'Trống',
      },
      {
        id: 13,
        toaNhaId: 1,
        soPhong: '301',
        tang: 3,
        dienTich: '24.00',
        sucChua: 4,
        giaThueMacDinh: '3900000.00',
        loaiPhong: 'Gác xép',
        trangThai: 'DANG_THUE',
        tenTrangThai: 'Đang thuê',
      },
    ]],
    [2, []],
  ])
  let nextAccountId = 6
  let nextBuildingId = 3
  let nextRoomId = 20

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
      if (method === 'POST') {
        const payload = JSON.parse(String(init?.body)) as Omit<ThongTinToaNha, 'id'>
        const created: ThongTinToaNha = { ...payload, id: nextBuildingId++ }
        buildings.push(created)
        return new Response(JSON.stringify(created), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify(buildings), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const buildingIdMatch = url.match(/^\/api\/toa-nha\/(\d+)$/)
    if (buildingIdMatch && method === 'PUT') {
      const buildingId = Number(buildingIdMatch[1])
      const current = buildings.find((building) => building.id === buildingId)
      if (!current) throw new Error(`Unknown building: ${buildingId}`)
      const payload = JSON.parse(String(init?.body)) as Omit<ThongTinToaNha, 'id'>
      const updated = { ...current, ...payload, id: buildingId }
      const buildingIndex = buildings.findIndex((building) => building.id === buildingId)
      buildings[buildingIndex] = updated
      return new Response(JSON.stringify(updated), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const roomListMatch = url.match(/^\/api\/toa-nha\/(\d+)\/phong(?:\?tang=(\d+))?$/)
    if (roomListMatch && method === 'GET') {
      const buildingId = Number(roomListMatch[1])
      const tang = roomListMatch[2] ? Number(roomListMatch[2]) : null
      const rooms = roomsByBuilding.get(buildingId) ?? []
      const filtered = tang === null ? rooms : rooms.filter((room) => room.tang === tang)
      return new Response(JSON.stringify(filtered), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const roomCreateMatch = url.match(/^\/api\/toa-nha\/(\d+)\/phong$/)
    if (roomCreateMatch && method === 'POST') {
      const buildingId = Number(roomCreateMatch[1])
      const payload = JSON.parse(String(init?.body)) as Omit<ThongTinPhong, 'id' | 'toaNhaId' | 'trangThai' | 'tenTrangThai'>
      const created: ThongTinPhong = {
        ...payload,
        id: nextRoomId++,
        toaNhaId: buildingId,
        trangThai: 'TRONG',
        tenTrangThai: 'Trống',
      }
      const rooms = roomsByBuilding.get(buildingId) ?? []
      roomsByBuilding.set(buildingId, [...rooms, created])
      return new Response(JSON.stringify(created), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const roomPreviewMatch = url.match(/^\/api\/toa-nha\/(\d+)\/phong\/hang-loat\/xem-truoc$/)
    if (roomPreviewMatch && method === 'POST') {
      const buildingId = Number(roomPreviewMatch[1])
      const payload = JSON.parse(String(init?.body)) as {
        soBatDau: string
        soKetThuc: string
        tang: number
        dienTich: string
        sucChua: number
        giaThueMacDinh: string
        loaiPhong: string
      }
      const preview = buildPreviewRooms(buildingId, payload)
      return new Response(JSON.stringify({ phong: preview }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const roomBatchMatch = url.match(/^\/api\/toa-nha\/(\d+)\/phong\/hang-loat$/)
    if (roomBatchMatch && method === 'POST') {
      const buildingId = Number(roomBatchMatch[1])
      const payload = JSON.parse(String(init?.body)) as {
        soBatDau: string
        soKetThuc: string
        tang: number
        dienTich: string
        sucChua: number
        giaThueMacDinh: string
        loaiPhong: string
      }
      const preview = buildPreviewRooms(buildingId, payload).map((room) => ({
        ...room,
        id: nextRoomId++,
      }))
      const rooms = roomsByBuilding.get(buildingId) ?? []
      roomsByBuilding.set(buildingId, [...rooms, ...preview])
      return new Response(JSON.stringify({ phong: preview }), {
        status: 201,
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

    if (url === '/api/toa-nha/1/ky-thanh-toan/8/hoa-don/10' && method === 'GET' && options?.invoiceResponse) {
      return new Response(JSON.stringify(options.invoiceResponse), {
        status: 200,
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

function buildFloorMapRooms(buildingId: number): ThongTinPhong[] {
  return [
    createRoom(buildingId, 101, 1, 'TRONG', 'Trống', '18.00', 2, '2800000.00', 'Studio'),
    createRoom(buildingId, 102, 1, 'TRONG', 'Trống', '18.50', 2, '2850000.00', 'Studio'),
    createRoom(buildingId, 103, 1, 'DANG_THUE', 'Đang thuê', '19.00', 2, '3000000.00', 'Studio'),
    createRoom(buildingId, 104, 1, 'DANG_THUE', 'Đang thuê', '19.50', 3, '3100000.00', 'Studio'),
    createRoom(buildingId, 105, 1, 'DANG_SUA', 'Đang sửa', '20.00', 3, '3150000.00', 'Studio'),
    createRoom(buildingId, 201, 2, 'TRONG', 'Trống', '21.00', 3, '3200000.00', 'Studio'),
    createRoom(buildingId, 202, 2, 'DA_COC', 'Đã đặt cọc', '21.50', 3, '3300000.00', 'Studio'),
    createRoom(buildingId, 203, 2, 'DANG_THUE', 'Đang thuê', '22.00', 3, '3400000.00', 'Studio'),
    createRoom(buildingId, 204, 2, 'NGUNG', 'Ngừng', '22.50', 3, '3450000.00', 'Studio'),
    createRoom(buildingId, 205, 2, 'DANG_SUA', 'Đang sửa', '23.00', 4, '3500000.00', 'Studio'),
    createRoom(buildingId, 301, 3, 'TRONG', 'Trống', '24.00', 4, '3900000.00', 'Gác xép'),
    createRoom(buildingId, 302, 3, 'DANG_THUE', 'Đang thuê', '24.50', 4, '4000000.00', 'Gác xép'),
    createRoom(buildingId, 303, 3, 'DANG_THUE', 'Đang thuê', '25.00', 4, '4100000.00', 'Gác xép'),
    createRoom(buildingId, 304, 3, 'DA_COC', 'Đã đặt cọc', '25.50', 4, '4200000.00', 'Gác xép'),
    createRoom(buildingId, 305, 3, 'DANG_SUA', 'Đang sửa', '26.00', 4, '4300000.00', 'Gác xép'),
    createRoom(buildingId, 401, 4, 'TRONG', 'Trống', '30.00', 5, '4800000.00', 'Duplex'),
    createRoom(buildingId, 402, 4, 'DANG_THUE', 'Đang thuê', '31.00', 5, '5000000.00', 'Duplex'),
    createRoom(buildingId, 403, 4, 'DA_COC', 'Đã đặt cọc', '31.50', 5, '5100000.00', 'Gác xép'),
    createRoom(buildingId, 404, 4, 'DANG_THUE', 'Đang thuê', '32.00', 5, '5200000.00', 'Duplex'),
    createRoom(buildingId, 405, 4, 'DANG_SUA', 'Đang sửa', '32.50', 5, '5300000.00', 'Duplex'),
  ]
}

function createRoom(
  buildingId: number,
  roomNumber: number,
  floor: number,
  trangThai: ThongTinPhong['trangThai'],
  tenTrangThai: string,
  dienTich: string,
  sucChua: number,
  giaThueMacDinh: string,
  loaiPhong: string,
): ThongTinPhong {
  return {
    id: roomNumber,
    toaNhaId: buildingId,
    soPhong: String(roomNumber),
    tang: floor,
    dienTich,
    sucChua,
    giaThueMacDinh,
    loaiPhong,
    trangThai,
    tenTrangThai,
  }
}

function buildPreviewRooms(
  buildingId: number,
  payload: {
    soBatDau: string
    soKetThuc: string
    tang: number
    dienTich: string
    sucChua: number
    giaThueMacDinh: string
    loaiPhong: string
  },
): ThongTinPhong[] {
  const start = Number(payload.soBatDau)
  const end = Number(payload.soKetThuc)
  const width = Math.max(payload.soBatDau.length, payload.soKetThuc.length)
  const rooms: ThongTinPhong[] = []

  for (let roomNumber = start; roomNumber <= end; roomNumber += 1) {
    rooms.push({
      id: 0,
      toaNhaId: buildingId,
      soPhong: String(roomNumber).padStart(width, '0'),
      tang: payload.tang,
      dienTich: payload.dienTich,
      sucChua: payload.sucChua,
      giaThueMacDinh: payload.giaThueMacDinh,
      loaiPhong: payload.loaiPhong,
      trangThai: 'TRONG',
      tenTrangThai: 'Trống',
    })
  }

  return rooms
}

function readMenuLabels(container: HTMLDivElement) {
  return [...container.querySelectorAll('nav a')].map((link) => link.textContent?.trim() ?? '')
}

describe('invoice navigation', () => {
  let mountedApp: MountedApp | null = null

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    clearStoredToken()
    window.history.replaceState({}, '', '/')
    document.body.innerHTML = ''
  })

  afterEach(async () => {
    if (mountedApp) {
      await act(async () => mountedApp?.root.unmount())
      mountedApp = null
    }
    clearStoredToken()
    vi.restoreAllMocks()
  })

  it('FR-INV-02 opens the identified invoice from the tenant query route', async () => {
    const nguoiThue = MENU_BY_ROLE[4].nguoiDung
    const fetchMock = buildFetchMock(nguoiThue, {
      invoiceResponse: {
        hoaDonId: 10,
        maHoaDon: 'TN-A-101-202608',
        kyId: 8,
        hopDongId: 11,
        soPhong: '101',
        nguoiThue: 'Người thuê 101',
        ngayPhatHanh: '2026-08-31',
        hanThanhToan: '2026-09-07',
        trangThai: 'DA_PHAT_HANH',
        tongTien: '3889500.00',
        daThu: '0.00',
        conLai: '3889500.00',
        cacDong: [],
      },
    })

    mountedApp = await mountAppAndLogin(nguoiThue, '/hoa-don-cua-toi?toaNhaId=1&kyId=8&hoaDonId=10', fetchMock)

    await vi.waitFor(() => {
      expect(mountedApp!.container.querySelector('[data-testid="invoice-detail"]')).not.toBeNull()
      expect(mountedApp!.container.textContent).toContain('TN-A-101-202608')
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/toa-nha/1/ky-thanh-toan/8/hoa-don/10',
      expect.objectContaining({ headers: { Authorization: 'Bearer header.payload.signature' } }),
    )
  })

  it('FR-INV-02 reads all invoice identifiers from the detail query link', () => {
    expect(layDinhDanhHoaDonTuUrl('https://miniapart.test/hoa-don?toaNhaId=1&kyId=8&hoaDonId=10')).toEqual({
      toaNhaId: 1,
      kyId: 8,
      hoaDonId: 10,
    })
  })

  it('FR-INV-02 ignores an incomplete invoice query instead of opening an ambiguous invoice', () => {
    expect(layDinhDanhHoaDonTuUrl('https://miniapart.test/hoa-don?toaNhaId=1&kyId=8')).toEqual({})
  })
})
