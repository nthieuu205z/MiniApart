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

    expect(container.textContent).toContain('Bàn giao nhận phòng')
    expect(container.textContent).toContain('Bàn giao đầy đủ chìa khoá')
  })

  it('drops stale responses when switching A -> B -> A with deferred promise returning out of order', async () => {
    type Resolver = (res: Response) => void
    let resolveSlowFetchA: Resolver | null = null

    const mockTaiSanAOld: TaiSanPhong[] = [
      {
        id: 101,
        phongId: 101,
        soPhong: 'P.101',
        tenTaiSan: 'Tài sản Cũ A',
        loaiTaiSan: 'ĐIỆN LẠNH',
        soLuong: 1,
        tinhTrang: 'Cũ',
        giaTriUocTinh: '1000000.00',
        ghiChu: '',
        ngayLap: '2026-01-01',
      },
    ]

    const mockTaiSanB: TaiSanPhong[] = [
      {
        id: 202,
        phongId: 202,
        soPhong: 'P.202',
        tenTaiSan: 'Tài sản Phòng B',
        loaiTaiSan: 'ĐIỆN LẠNH',
        soLuong: 1,
        tinhTrang: 'Mới',
        giaTriUocTinh: '2000000.00',
        ghiChu: '',
        ngayLap: '2026-01-01',
      },
    ]

    const mockTaiSanANew: TaiSanPhong[] = [
      {
        id: 101,
        phongId: 101,
        soPhong: 'P.101',
        tenTaiSan: 'Tài sản Mới Nhất A',
        loaiTaiSan: 'ĐIỆN LẠNH',
        soLuong: 1,
        tinhTrang: 'Mới 100%',
        giaTriUocTinh: '5000000.00',
        ghiChu: '',
        ngayLap: '2026-11-05',
      },
    ]

    let fetchACount = 0
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/phong/101/tai-san')) {
        fetchACount++
        if (fetchACount === 1) {
          // Slow fetch for A
          return new Promise<Response>((resolve) => {
            resolveSlowFetchA = resolve
          })
        }
        // Fast second fetch for A
        return Promise.resolve(new Response(JSON.stringify(mockTaiSanANew), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }))
      }
      if (url.includes('/api/phong/202/tai-san')) {
        return Promise.resolve(new Response(JSON.stringify(mockTaiSanB), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }))
      }
      return Promise.resolve(new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } }))
    }))

    // 1. Initial render Room A -> triggers slow fetch
    await act(async () => {
      root.render(<QuanLyTaiSanPhong token="mock-token" phongId={101} soPhong="P.101" />)
    })

    // 2. Switch to Room B
    await act(async () => {
      root.render(<QuanLyTaiSanPhong token="mock-token" phongId={202} soPhong="P.202" />)
    })
    expect(container.textContent).toContain('Tài sản Phòng B')

    // 3. Switch back to Room A -> triggers second fetch for A which resolves immediately
    await act(async () => {
      root.render(<QuanLyTaiSanPhong token="mock-token" phongId={101} soPhong="P.101" />)
    })
    expect(container.textContent).toContain('Tài sản Mới Nhất A')

    // 4. Now resolve the slow first fetch for A
    await act(async () => {
      if (resolveSlowFetchA) {
        resolveSlowFetchA(new Response(JSON.stringify(mockTaiSanAOld), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }))
      }
    })

    // 5. Verification: The component must STILL display "Tài sản Mới Nhất A", NOT "Tài sản Cũ A"
    expect(container.textContent).toContain('Tài sản Mới Nhất A')
    expect(container.textContent).not.toContain('Tài sản Cũ A')
  })

  it('handles deferred add-asset in Room A, switches to Room B: Room B does not inherit loading and remains operable when A finishes', async () => {
    type Resolver = (res: Response) => void
    let resolveAddA: Resolver | null = null

    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method ?? 'GET'
      if (url.includes('/api/phong/101/tai-san') && method === 'POST') {
        return new Promise<Response>((resolve) => {
          resolveAddA = resolve
        })
      }
      return Promise.resolve(new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } }))
    }))

    // 1. Render Room A
    await act(async () => {
      root.render(<QuanLyTaiSanPhong token="mock-token" phongId={101} soPhong="P.101" />)
    })

    // Fill form and submit in Room A
    const inputTen = container.querySelector('form input') as HTMLInputElement
    expect(inputTen).toBeDefined()
    await act(async () => {
      inputTen.value = 'Tủ lạnh mới'
      inputTen.dispatchEvent(new Event('input', { bubbles: true }))
    })

    const form = container.querySelector('form') as HTMLFormElement
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    // Button should show loading in Room A
    const submitBtnA = container.querySelector('button[type="submit"]') as HTMLButtonElement
    expect(submitBtnA.textContent).toContain('Đang lưu')

    // 2. Switch to Room B while Room A mutation is in-flight
    await act(async () => {
      root.render(<QuanLyTaiSanPhong token="mock-token" phongId={202} soPhong="P.202" />)
    })

    // Room B MUST NOT inherit loading state
    const submitBtnB = container.querySelector('button[type="submit"]') as HTMLButtonElement
    expect(submitBtnB.textContent).toContain('Lưu tài sản')
    expect(submitBtnB.disabled).toBe(false)

    // 3. Resolve Room A's in-flight request
    await act(async () => {
      if (resolveAddA) {
        resolveAddA(new Response(JSON.stringify({ id: 999, tenTaiSan: 'Tủ lạnh mới' }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }))
      }
    })

    // Room B remains clean, not showing success notification for Room A
    expect(container.textContent).not.toContain('Đã thêm thiết bị "Tủ lạnh mới"')
    expect(submitBtnB.textContent).toContain('Lưu tài sản')
    expect(submitBtnB.disabled).toBe(false)
  })

  it('handles deferred mutation error: error in Room A is dropped after switching to Room B and does not leak or freeze Room B', async () => {
    type Rejecter = (reason?: any) => void
    let rejectDeleteA: Rejecter | null = null

    const mockTaiSanA: TaiSanPhong[] = [
      {
        id: 111,
        phongId: 101,
        soPhong: 'P.101',
        tenTaiSan: 'Tài sản sắp xoá',
        loaiTaiSan: 'ĐIỆN LẠNH',
        soLuong: 1,
        tinhTrang: 'Cũ',
        giaTriUocTinh: '1000000.00',
        ghiChu: '',
        ngayLap: '2026-01-01',
      },
    ]

    vi.stubGlobal('confirm', () => true)
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method ?? 'GET'
      if (url.includes('/api/tai-san/111') && method === 'DELETE') {
        return new Promise<Response>((_, reject) => {
          rejectDeleteA = reject
        })
      }
      if (url.includes('/api/phong/101/tai-san')) {
        return Promise.resolve(new Response(JSON.stringify(mockTaiSanA), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }))
      }
      return Promise.resolve(new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } }))
    }))

    // 1. Render Room A with asset
    await act(async () => {
      root.render(<QuanLyTaiSanPhong token="mock-token" phongId={101} soPhong="P.101" />)
    })
    expect(container.textContent).toContain('Tài sản sắp xoá')

    // Click delete button
    const deleteBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Xoá'))
    expect(deleteBtn).toBeDefined()
    await act(async () => {
      deleteBtn!.click()
    })

    // 2. Switch to Room B while delete in A is in-flight
    await act(async () => {
      root.render(<QuanLyTaiSanPhong token="mock-token" phongId={202} soPhong="P.202" />)
    })

    // 3. Reject Room A request with network error
    await act(async () => {
      if (rejectDeleteA) {
        rejectDeleteA(new Error('Lỗi máy chủ khi xoá'))
      }
    })

    // Room B must NOT display Room A's error and must not be frozen in loading
    expect(container.textContent).not.toContain('Lỗi máy chủ khi xoá')
    const addBtnB = container.querySelector('button[type="submit"]') as HTMLButtonElement
    expect(addBtnB.disabled).toBe(false)
  })

  it('preserves loading of new mutation in Room B when old mutation in Room A resolves out-of-order', async () => {
    type Resolver = (res: Response) => void
    let resolveAddA: Resolver | null = null
    let resolveAddB: Resolver | null = null

    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method ?? 'GET'
      if (url.includes('/api/phong/101/tai-san') && method === 'POST') {
        return new Promise<Response>((resolve) => {
          resolveAddA = resolve
        })
      }
      if (url.includes('/api/phong/202/tai-san') && method === 'POST') {
        return new Promise<Response>((resolve) => {
          resolveAddB = resolve
        })
      }
      return Promise.resolve(new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } }))
    }))

    // 1. Render Room A and trigger mutation A
    await act(async () => {
      root.render(<QuanLyTaiSanPhong token="mock-token" phongId={101} soPhong="P.101" />)
    })
    const inputTenA = container.querySelector('form input') as HTMLInputElement
    expect(inputTenA).toBeDefined()
    await act(async () => {
      inputTenA.value = 'Món A'
      inputTenA.dispatchEvent(new Event('input', { bubbles: true }))
    })
    const formA = container.querySelector('form') as HTMLFormElement
    await act(async () => {
      formA.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    // 2. Switch to Room B
    await act(async () => {
      root.render(<QuanLyTaiSanPhong token="mock-token" phongId={202} soPhong="P.202" />)
    })

    // 3. Trigger mutation B in Room B
    const inputTenB = container.querySelector('form input') as HTMLInputElement
    expect(inputTenB).toBeDefined()
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
      setter?.call(inputTenB, 'Món B')
      inputTenB.dispatchEvent(new Event('input', { bubbles: true }))
      inputTenB.dispatchEvent(new Event('change', { bubbles: true }))
    })
    const formB = container.querySelector('form') as HTMLFormElement
    await act(async () => {
      formB.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
    const submitBtnB = container.querySelector('button[type="submit"]') as HTMLButtonElement
    expect(submitBtnB.textContent).toContain('Đang lưu')

    // 4. Resolve mutation A (from Room A)
    await act(async () => {
      if (resolveAddA) {
        resolveAddA(new Response(JSON.stringify({ id: 1, tenTaiSan: 'Món A' }), { status: 201, headers: { 'Content-Type': 'application/json' } }))
      }
    })

    // Verification: Mutation B MUST STILL BE LOADING (Room A finally block did NOT clear Room B's loading!)
    expect(submitBtnB.textContent).toContain('Đang lưu')

    // 5. Now resolve mutation B
    await act(async () => {
      if (resolveAddB) {
        resolveAddB(new Response(JSON.stringify({ id: 2, tenTaiSan: 'Món B' }), { status: 201, headers: { 'Content-Type': 'application/json' } }))
      }
    })

    // Now Room B finishes loading cleanly
    expect(submitBtnB.textContent).toContain('Lưu tài sản')
    expect(container.textContent).toContain('Đã thêm thiết bị "Món B"')
  })
})

