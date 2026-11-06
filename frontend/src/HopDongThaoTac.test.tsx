// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HopDongThaoTac from './HopDongThaoTac'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

const mockBuildings = [{ id: 1, ten: 'Toà Nhà A', diaChi: '123 Cầu Giấy' }]
const mockRooms = [{ id: 101, toaNhaId: 1, soPhong: '101', giaThue: '3500000.00', dienTich: 25, tang: 1, trangThai: 'TRONG' }]
const mockTenants = [{ id: 10, hoTen: 'Nguyễn Văn Thuê', soDienThoai: '0987654321', soGiayTo: '001200' }]
const mockServices = [{ id: 7, toaNhaId: 1, ten: 'Điện', donGia: '3500.00' }]

const mockContracts = [
  {
    id: 1,
    phongId: 101,
    soPhong: '101',
    nguoiThueId: 10,
    hoTenNguoiThue: 'Người thuê 1',
    ngayBatDau: '2026-01-01',
    ngayKetThuc: '2026-12-31',
    giaThue: '3500000.00',
    tienCoc: '3500000.00',
    soNgayBaoTruoc: 30,
    trangThai: 'CHO_KY',
    tenTrangThai: 'Chờ ký',
    sapHetHan: false,
    soNgayConLai: 100,
    dichVuApDung: [],
    quyetToan: null,
  },
  {
    id: 2,
    phongId: 102,
    soPhong: '102',
    nguoiThueId: 10,
    hoTenNguoiThue: 'Người thuê 2',
    ngayBatDau: '2026-02-01',
    ngayKetThuc: '2027-02-01',
    giaThue: '4000000.00',
    tienCoc: '4000000.00',
    soNgayBaoTruoc: 30,
    trangThai: 'CHO_KY',
    tenTrangThai: 'Chờ ký',
    sapHetHan: false,
    soNgayConLai: 120,
    dichVuApDung: [],
    quyetToan: null,
  },
]

describe('HopDongThaoTac Scope & Stale Response Guard', () => {
  let container: HTMLDivElement | null = null
  let root: Root | null = null

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    if (root && container) {
      act(() => {
        root?.unmount()
      })
      container.remove()
    }
    vi.restoreAllMocks()
  })

  it('drops stale dossier response when switching contract A -> B -> A out of order', async () => {
    type Resolver = (res: Response) => void
    let resolveDossier1First: Resolver | null = null

    const mockDossier1First = {
      id: 11,
      hopDongId: 1,
      revision: 1,
      trangThaiTaiLieu: 'DRAFT' as const,
      tieuDe: 'HỢP ĐỒNG PHÒNG 101 - PHIÊN BẢN CŨ',
      ngayLap: '2026-01-01',
      diaDiemLap: 'Hà Nội',
      mucDichThue: 'Để ở',
      phamViSuDung: 'Sử dụng riêng',
      phuongThucThanhToan: 'CHUYEN_KHOAN',
      kyThanhToanThang: 1,
      hanThanhToanNgay: 5,
    }

    const mockDossier2 = {
      id: 22,
      hopDongId: 2,
      revision: 1,
      trangThaiTaiLieu: 'DRAFT' as const,
      tieuDe: 'HỢP ĐỒNG PHÒNG 102 - CHUẨN',
      ngayLap: '2026-02-01',
      diaDiemLap: 'Hà Nội',
      mucDichThue: 'Để ở',
      phamViSuDung: 'Sử dụng riêng',
      phuongThucThanhToan: 'CHUYEN_KHOAN',
      kyThanhToanThang: 1,
      hanThanhToanNgay: 5,
    }

    const mockDossier1Latest = {
      id: 11,
      hopDongId: 1,
      revision: 2,
      trangThaiTaiLieu: 'DRAFT' as const,
      tieuDe: 'HỢP ĐỒNG PHÒNG 101 - PHIÊN BẢN MỚI NHẤT',
      ngayLap: '2026-01-05',
      diaDiemLap: 'Hà Nội',
      mucDichThue: 'Để ở',
      phamViSuDung: 'Sử dụng riêng',
      phuongThucThanhToan: 'CHUYEN_KHOAN',
      kyThanhToanThang: 1,
      hanThanhToanNgay: 5,
    }

    let dossier1CallCount = 0

    vi.spyOn(globalThis, 'fetch').mockImplementation((input: any) => {
      const url = typeof input === 'string' ? input : input.url

      if (url.includes('/api/toa-nha') && !url.includes('/dich-vu') && !url.includes('/ben-a') && !url.includes('/mau-hop-dong')) {
        return Promise.resolve(new Response(JSON.stringify(mockBuildings), { status: 200 }))
      }
      if (url.includes('/api/phong')) {
        return Promise.resolve(new Response(JSON.stringify(mockRooms), { status: 200 }))
      }
      if (url.includes('/api/nguoi-thue')) {
        return Promise.resolve(new Response(JSON.stringify(mockTenants), { status: 200 }))
      }
      if (url.includes('/dich-vu')) {
        return Promise.resolve(new Response(JSON.stringify(mockServices), { status: 200 }))
      }
      if (url.includes('/api/hop-dong?toaNhaId=') || url.endsWith('/api/hop-dong')) {
        return Promise.resolve(new Response(JSON.stringify(mockContracts), { status: 200 }))
      }
      if (url.includes('/nguoi-o-cung') || url.includes('/phu-luc') || url.includes('/tai-san') || url.includes('/bien-ban')) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
      }
      if (url.includes('/ben-a')) {
        return Promise.resolve(new Response(JSON.stringify(null), { status: 404 }))
      }
      if (url.includes('/mau-hop-dong')) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
      }

      // Dossier endpoints
      if (url.includes('/api/hop-dong/1/ho-so')) {
        dossier1CallCount++
        if (dossier1CallCount === 1) {
          // Slow deferred request
          return new Promise<Response>((resolve) => {
            resolveDossier1First = resolve
          })
        }
        return Promise.resolve(new Response(JSON.stringify(mockDossier1Latest), { status: 200 }))
      }
      if (url.includes('/api/hop-dong/2/ho-so')) {
        return Promise.resolve(new Response(JSON.stringify(mockDossier2), { status: 200 }))
      }

      return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }))
    })

    await act(async () => {
      root?.render(<HopDongThaoTac token="test-token" />)
    })

    // Wait for initial load
    await act(async () => {
      await Promise.resolve()
    })

    // Find the contract select element (the second select, as the first is BuildingSelect)
    const selects = container?.querySelectorAll('select') || []
    const contractSelect = Array.from(selects).find((s) => s.textContent?.includes('#1 · Phòng 101'))

    expect(contractSelect).toBeDefined()

    // 1. Select Contract 1 (starts deferred request)
    await act(async () => {
      contractSelect!.value = '1'
      contractSelect!.dispatchEvent(new Event('change', { bubbles: true }))
    })

    // 2. Quickly select Contract 2
    await act(async () => {
      contractSelect!.value = '2'
      contractSelect!.dispatchEvent(new Event('change', { bubbles: true }))
    })

    // Contract 2 resolves immediately
    await act(async () => {
      await Promise.resolve()
    })

    // Verify Contract 2 is displayed and its dossier title is loaded into input
    const inputs = container?.querySelectorAll('input') || []
    const titleInput = Array.from(inputs).find((i) => i.value?.includes('HỢP ĐỒNG PHÒNG 102')) as HTMLInputElement | undefined

    expect(titleInput).toBeDefined()
    expect(titleInput?.value).toBe('HỢP ĐỒNG PHÒNG 102 - CHUẨN')

    // 3. Now slow request for Contract 1 finishes!
    if (resolveDossier1First) {
      await act(async () => {
        resolveDossier1First!(new Response(JSON.stringify(mockDossier1First), { status: 200 }))
        await Promise.resolve()
      })
    }

    // The stale response for Contract 1 must be dropped: Contract 2 title remains!
    expect(titleInput?.value).toBe('HỢP ĐỒNG PHÒNG 102 - CHUẨN')
    expect(container?.textContent).not.toContain('HỢP ĐỒNG PHÒNG 101 - PHIÊN BẢN CŨ')
  })

  it('Lưu A -> đổi sang B -> A thành công: B không nhận dữ liệu hoặc thông báo thành công của A', async () => {
    let resolveSave1: ((res: Response) => void) | null = null

    const mockDossier1 = {
      id: 11,
      hopDongId: 1,
      revision: 1,
      trangThaiTaiLieu: 'DRAFT' as const,
      tieuDe: 'HỢP ĐỒNG PHÒNG 101',
      ngayLap: '2026-01-01',
      diaDiemLap: 'Hà Nội',
      mucDichThue: 'Để ở',
      phamViSuDung: 'Sử dụng riêng',
      phuongThucThanhToan: 'CHUYEN_KHOAN',
      kyThanhToanThang: 1,
      hanThanhToanNgay: 5,
    }

    const mockDossier2 = {
      id: 22,
      hopDongId: 2,
      revision: 1,
      trangThaiTaiLieu: 'DRAFT' as const,
      tieuDe: 'HỢP ĐỒNG PHÒNG 102',
      ngayLap: '2026-02-01',
      diaDiemLap: 'Hà Nội',
      mucDichThue: 'Để ở',
      phamViSuDung: 'Sử dụng riêng',
      phuongThucThanhToan: 'CHUYEN_KHOAN',
      kyThanhToanThang: 1,
      hanThanhToanNgay: 5,
    }

    vi.spyOn(globalThis, 'fetch').mockImplementation((input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input.url
      const method = init?.method || 'GET'

      if (url.includes('/api/toa-nha') && !url.includes('/dich-vu') && !url.includes('/ben-a') && !url.includes('/mau-hop-dong')) {
        return Promise.resolve(new Response(JSON.stringify(mockBuildings), { status: 200 }))
      }
      if (url.includes('/api/phong')) {
        return Promise.resolve(new Response(JSON.stringify(mockRooms), { status: 200 }))
      }
      if (url.includes('/api/nguoi-thue')) {
        return Promise.resolve(new Response(JSON.stringify(mockTenants), { status: 200 }))
      }
      if (url.includes('/dich-vu')) {
        return Promise.resolve(new Response(JSON.stringify(mockServices), { status: 200 }))
      }
      if (url.includes('/api/hop-dong?toaNhaId=') || url.endsWith('/api/hop-dong')) {
        return Promise.resolve(new Response(JSON.stringify(mockContracts), { status: 200 }))
      }
      if (url.includes('/nguoi-o-cung') || url.includes('/phu-luc') || url.includes('/tai-san') || url.includes('/bien-ban')) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
      }
      if (url.includes('/ben-a')) {
        return Promise.resolve(new Response(JSON.stringify(null), { status: 404 }))
      }
      if (url.includes('/mau-hop-dong')) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
      }

      // Save draft Contract 1 (deferred)
      if (url.includes('/api/hop-dong/1/ho-so/draft') && method === 'PUT') {
        return new Promise<Response>((resolve) => {
          resolveSave1 = resolve
        })
      }

      if (url.includes('/api/hop-dong/1/ho-so')) {
        return Promise.resolve(new Response(JSON.stringify(mockDossier1), { status: 200 }))
      }
      if (url.includes('/api/hop-dong/2/ho-so')) {
        return Promise.resolve(new Response(JSON.stringify(mockDossier2), { status: 200 }))
      }

      return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }))
    })

    await act(async () => {
      root?.render(<HopDongThaoTac token="test-token" />)
    })
    await act(async () => {
      await Promise.resolve()
    })

    const selects = container?.querySelectorAll('select') || []
    const contractSelect = Array.from(selects).find((s) => s.textContent?.includes('#1 · Phòng 101'))!

    // 1. Select Contract 1
    await act(async () => {
      contractSelect.value = '1'
      contractSelect.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await act(async () => {
      await Promise.resolve()
    })

    // 2. Click "💾 Lưu bản nháp" on Contract 1
    const buttons = Array.from(container?.querySelectorAll('button') || [])
    const saveButton = buttons.find((b) => b.textContent?.includes('Lưu bản nháp'))!
    expect(saveButton).toBeDefined()

    await act(async () => {
      saveButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    // 3. User switches to Contract 2 while save 1 is in-flight
    await act(async () => {
      contractSelect.value = '2'
      contractSelect.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await act(async () => {
      await Promise.resolve()
    })

    // Verify Contract 2 is displayed
    const inputs2 = Array.from(container?.querySelectorAll('input') || [])
    const titleInput2 = inputs2.find((i) => i.value?.includes('HỢP ĐỒNG PHÒNG 102')) as HTMLInputElement | undefined
    expect(titleInput2).toBeDefined()

    // 4. Now save 1 resolves successfully
    if (resolveSave1) {
      await act(async () => {
        resolveSave1!(new Response(JSON.stringify({ ...mockDossier1, revision: 2 }), { status: 200 }))
        await Promise.resolve()
      })
    }

    // Verify Contract 2 does NOT receive success message of Contract 1
    const statusMsg = container?.querySelector('[role="status"]')
    expect(statusMsg).toBeNull()

    // Title input remains Contract 2
    expect(titleInput2?.value).toBe('HỢP ĐỒNG PHÒNG 102')
  })

  it('Lưu A -> đổi sang B -> A thất bại: B không nhận thông báo lỗi của A', async () => {
    let rejectSave1: ((err: any) => void) | null = null

    const mockDossier1 = {
      id: 11,
      hopDongId: 1,
      revision: 1,
      trangThaiTaiLieu: 'DRAFT' as const,
      tieuDe: 'HỢP ĐỒNG PHÒNG 101',
      ngayLap: '2026-01-01',
      diaDiemLap: 'Hà Nội',
      mucDichThue: 'Để ở',
      phamViSuDung: 'Sử dụng riêng',
      phuongThucThanhToan: 'CHUYEN_KHOAN',
      kyThanhToanThang: 1,
      hanThanhToanNgay: 5,
    }

    const mockDossier2 = {
      id: 22,
      hopDongId: 2,
      revision: 1,
      trangThaiTaiLieu: 'DRAFT' as const,
      tieuDe: 'HỢP ĐỒNG PHÒNG 102',
      ngayLap: '2026-02-01',
      diaDiemLap: 'Hà Nội',
      mucDichThue: 'Để ở',
      phamViSuDung: 'Sử dụng riêng',
      phuongThucThanhToan: 'CHUYEN_KHOAN',
      kyThanhToanThang: 1,
      hanThanhToanNgay: 5,
    }

    vi.spyOn(globalThis, 'fetch').mockImplementation((input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input.url
      const method = init?.method || 'GET'

      if (url.includes('/api/toa-nha') && !url.includes('/dich-vu') && !url.includes('/ben-a') && !url.includes('/mau-hop-dong')) {
        return Promise.resolve(new Response(JSON.stringify(mockBuildings), { status: 200 }))
      }
      if (url.includes('/api/phong')) {
        return Promise.resolve(new Response(JSON.stringify(mockRooms), { status: 200 }))
      }
      if (url.includes('/api/nguoi-thue')) {
        return Promise.resolve(new Response(JSON.stringify(mockTenants), { status: 200 }))
      }
      if (url.includes('/dich-vu')) {
        return Promise.resolve(new Response(JSON.stringify(mockServices), { status: 200 }))
      }
      if (url.includes('/api/hop-dong?toaNhaId=') || url.endsWith('/api/hop-dong')) {
        return Promise.resolve(new Response(JSON.stringify(mockContracts), { status: 200 }))
      }
      if (url.includes('/nguoi-o-cung') || url.includes('/phu-luc') || url.includes('/tai-san') || url.includes('/bien-ban')) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
      }
      if (url.includes('/ben-a')) {
        return Promise.resolve(new Response(JSON.stringify(null), { status: 404 }))
      }
      if (url.includes('/mau-hop-dong')) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
      }

      // Save draft Contract 1 (deferred rejection)
      if (url.includes('/api/hop-dong/1/ho-so/draft') && method === 'PUT') {
        return new Promise<Response>((_, reject) => {
          rejectSave1 = reject
        })
      }

      if (url.includes('/api/hop-dong/1/ho-so')) {
        return Promise.resolve(new Response(JSON.stringify(mockDossier1), { status: 200 }))
      }
      if (url.includes('/api/hop-dong/2/ho-so')) {
        return Promise.resolve(new Response(JSON.stringify(mockDossier2), { status: 200 }))
      }

      return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }))
    })

    await act(async () => {
      root?.render(<HopDongThaoTac token="test-token" />)
    })
    await act(async () => {
      await Promise.resolve()
    })

    const selects = container?.querySelectorAll('select') || []
    const contractSelect = Array.from(selects).find((s) => s.textContent?.includes('#1 · Phòng 101'))!

    // 1. Select Contract 1
    await act(async () => {
      contractSelect.value = '1'
      contractSelect.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await act(async () => {
      await Promise.resolve()
    })

    // 2. Click "💾 Lưu bản nháp" on Contract 1
    const buttons = Array.from(container?.querySelectorAll('button') || [])
    const saveButton = buttons.find((b) => b.textContent?.includes('Lưu bản nháp'))!
    await act(async () => {
      saveButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    // 3. User switches to Contract 2
    await act(async () => {
      contractSelect.value = '2'
      contractSelect.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await act(async () => {
      await Promise.resolve()
    })

    // 4. Save 1 fails
    if (rejectSave1) {
      await act(async () => {
        rejectSave1!(new Error('Lỗi xung đột phiên bản trên Contract 1'))
        await Promise.resolve()
      })
    }

    // Verify Contract 2 does NOT display the error alert
    const alertMsg = container?.querySelector('[role="alert"]')
    expect(alertMsg).toBeNull()
  })

  it('Chốt/Ký/Phụ lục A chậm -> chọn B: B độc lập tuyệt đối về form, revision và notification', async () => {
    let resolveChot1: ((res: Response) => void) | null = null

    const mockDossier1 = {
      id: 11,
      hopDongId: 1,
      revision: 1,
      trangThaiTaiLieu: 'DRAFT' as const,
      tieuDe: 'HỢP ĐỒNG PHÒNG 101',
      ngayLap: '2026-01-01',
      diaDiemLap: 'Hà Nội',
      mucDichThue: 'Để ở',
      phamViSuDung: 'Sử dụng riêng',
      phuongThucThanhToan: 'CHUYEN_KHOAN',
      kyThanhToanThang: 1,
      hanThanhToanNgay: 5,
    }

    const mockDossier2 = {
      id: 22,
      hopDongId: 2,
      revision: 1,
      trangThaiTaiLieu: 'DRAFT' as const,
      tieuDe: 'HỢP ĐỒNG PHÒNG 102',
      ngayLap: '2026-02-01',
      diaDiemLap: 'Hà Nội',
      mucDichThue: 'Để ở',
      phamViSuDung: 'Sử dụng riêng',
      phuongThucThanhToan: 'CHUYEN_KHOAN',
      kyThanhToanThang: 1,
      hanThanhToanNgay: 5,
    }

    vi.spyOn(globalThis, 'fetch').mockImplementation((input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input.url
      const method = init?.method || 'GET'

      if (url.includes('/api/toa-nha') && !url.includes('/dich-vu') && !url.includes('/ben-a') && !url.includes('/mau-hop-dong')) {
        return Promise.resolve(new Response(JSON.stringify(mockBuildings), { status: 200 }))
      }
      if (url.includes('/api/phong')) {
        return Promise.resolve(new Response(JSON.stringify(mockRooms), { status: 200 }))
      }
      if (url.includes('/api/nguoi-thue')) {
        return Promise.resolve(new Response(JSON.stringify(mockTenants), { status: 200 }))
      }
      if (url.includes('/dich-vu')) {
        return Promise.resolve(new Response(JSON.stringify(mockServices), { status: 200 }))
      }
      if (url.includes('/api/hop-dong?toaNhaId=') || url.endsWith('/api/hop-dong')) {
        return Promise.resolve(new Response(JSON.stringify(mockContracts), { status: 200 }))
      }
      if (url.includes('/nguoi-o-cung') || url.includes('/phu-luc') || url.includes('/tai-san') || url.includes('/bien-ban')) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
      }
      if (url.includes('/ben-a')) {
        return Promise.resolve(new Response(JSON.stringify(null), { status: 404 }))
      }
      if (url.includes('/mau-hop-dong')) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
      }

      // Chot dossier Contract 1 (deferred)
      if (url.includes('/api/hop-dong/1/ho-so/chot') && method === 'POST') {
        return new Promise<Response>((resolve) => {
          resolveChot1 = resolve
        })
      }

      if (url.includes('/api/hop-dong/1/ho-so')) {
        return Promise.resolve(new Response(JSON.stringify(mockDossier1), { status: 200 }))
      }
      if (url.includes('/api/hop-dong/2/ho-so')) {
        return Promise.resolve(new Response(JSON.stringify(mockDossier2), { status: 200 }))
      }

      return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }))
    })

    await act(async () => {
      root?.render(<HopDongThaoTac token="test-token" />)
    })
    await act(async () => {
      await Promise.resolve()
    })

    const selects = container?.querySelectorAll('select') || []
    const contractSelect = Array.from(selects).find((s) => s.textContent?.includes('#1 · Phòng 101'))!

    // 1. Select Contract 1
    await act(async () => {
      contractSelect.value = '1'
      contractSelect.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await act(async () => {
      await Promise.resolve()
    })

    // 2. Navigate to step 5 (Chốt & Ký giấy)
    const stepButtons = Array.from(container?.querySelectorAll('button') || [])
    const step5Btn = stepButtons.find((b) => b.textContent?.includes('5. Chốt & Ký giấy'))!
    await act(async () => {
      step5Btn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    // Check confirmation checkbox
    const checkbox = container?.querySelector('input[type="checkbox"]') as HTMLInputElement
    await act(async () => {
      checkbox.checked = true
      checkbox.dispatchEvent(new Event('change', { bubbles: true }))
    })

    // Click "🔒 Chốt hồ sơ hợp đồng ngay"
    const chotBtn = Array.from(container?.querySelectorAll('button') || []).find((b) => b.textContent?.includes('Chốt hồ sơ hợp đồng ngay'))!
    await act(async () => {
      chotBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    // 3. Switch to Contract 2 while Chốt 1 is in-flight
    await act(async () => {
      contractSelect.value = '2'
      contractSelect.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await act(async () => {
      await Promise.resolve()
    })

    // 4. Chốt 1 resolves
    if (resolveChot1) {
      await act(async () => {
        resolveChot1!(new Response(JSON.stringify({ ...mockDossier1, trangThaiTaiLieu: 'DA_CHOT' }), { status: 200 }))
        await Promise.resolve()
      })
    }

    // Verify Contract 2 does NOT get sealed or marked with success notification
    const statusMsg = container?.querySelector('[role="status"]')
    expect(statusMsg).toBeNull()

    // Contract 2 still has DRAFT status tag
    expect(container?.textContent).toContain('Bản dự thảo (DRAFT)')
    expect(container?.textContent).not.toContain('Đã chốt (Rev 1)')
  })
})

describe('HopDongThaoTac Selection & Embedded Mode P1', () => {
  let container: HTMLDivElement | null = null
  let root: Root | null = null

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    if (root && container) {
      act(() => {
        root?.unmount()
      })
      container.remove()
    }
    vi.restoreAllMocks()
  })

  const setupFetchMock = (customOverrides?: (url: string, opts?: any) => Promise<Response> | undefined) => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input.url
      if (customOverrides) {
        const custom = customOverrides(url, init)
        if (custom) return custom
      }
      if (url.includes('/api/toa-nha') && !url.includes('/dich-vu') && !url.includes('/ben-a') && !url.includes('/mau-hop-dong')) {
        return Promise.resolve(new Response(JSON.stringify([
          { id: 1, ten: 'Toà Nhà A', diaChi: '123 Cầu Giấy' },
          { id: 2, ten: 'Toà Nhà B', diaChi: '456 Đống Đa' },
        ]), { status: 200 }))
      }
      if (url.includes('/api/phong?toaNhaId=2') || url.includes('/api/phong/2')) {
        return Promise.resolve(new Response(JSON.stringify([
          { id: 201, toaNhaId: 2, soPhong: '201', giaThue: '4500000.00', dienTich: 30, tang: 2, trangThai: 'TRONG' },
        ]), { status: 200 }))
      }
      if (url.includes('/api/phong')) {
        return Promise.resolve(new Response(JSON.stringify(mockRooms), { status: 200 }))
      }
      if (url.includes('/api/nguoi-thue')) {
        return Promise.resolve(new Response(JSON.stringify(mockTenants), { status: 200 }))
      }
      if (url.includes('/dich-vu')) {
        return Promise.resolve(new Response(JSON.stringify(mockServices), { status: 200 }))
      }
      if (url.includes('/api/hop-dong?toaNhaId=2')) {
        return Promise.resolve(new Response(JSON.stringify([
          {
            id: 201,
            phongId: 201,
            soPhong: '201',
            nguoiThueId: 10,
            hoTenNguoiThue: 'Khách Tòa B',
            ngayBatDau: '2026-03-01',
            ngayKetThuc: '2027-03-01',
            giaThue: '4500000.00',
            tienCoc: '4500000.00',
            soNgayBaoTruoc: 30,
            trangThai: 'CHO_KY',
            tenTrangThai: 'Chờ ký',
            sapHetHan: false,
            soNgayConLai: 200,
            dichVuApDung: [],
            quyetToan: null,
          },
        ]), { status: 200 }))
      }
      if (url.includes('/api/hop-dong?toaNhaId=1') || url.endsWith('/api/hop-dong')) {
        return Promise.resolve(new Response(JSON.stringify(mockContracts), { status: 200 }))
      }
      if (url.includes('/nguoi-o-cung') || url.includes('/phu-luc') || url.includes('/tai-san') || url.includes('/bien-ban')) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
      }
      if (url.includes('/ben-a')) {
        return Promise.resolve(new Response(JSON.stringify(null), { status: 404 }))
      }
      if (url.includes('/mau-hop-dong')) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
      }
      if (url.includes('/ho-so')) {
        return Promise.resolve(new Response(JSON.stringify({
          id: 11,
          hopDongId: 1,
          revision: 1,
          trangThaiTaiLieu: 'DRAFT',
          tieuDe: 'HỢP ĐỒNG PHÒNG 101',
          ngayLap: '2026-01-01',
          diaDiemLap: 'Hà Nội',
          mucDichThue: 'Để ở',
          phamViSuDung: 'Sử dụng riêng',
          phuongThucThanhToan: 'CHUYEN_KHOAN',
          kyThanhToanThang: 1,
          hanThanhToanNgay: 5,
        }), { status: 200 }))
      }
      return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }))
    })
  }

  it('Bấm mở chi tiết lần đầu: giữ đúng ID khi mount và khi dữ liệu tòa nhà tải xong', async () => {
    setupFetchMock()

    await act(async () => {
      root?.render(
        <HopDongThaoTac
          token="test-token"
          embedded={true}
          buildingId={1}
          selectedHopDongId={1}
        />,
      )
    })

    await vi.waitFor(() => {
      expect(container?.textContent).toContain('HỢP ĐỒNG #1')
      expect(container?.textContent).toContain('Phòng 101 · Khách thuê: Người thuê 1')
    })
  })

  it('Mở hợp đồng ở tòa nhà khác tòa đầu tiên: giữ đúng tòa và hợp đồng đã chọn', async () => {
    setupFetchMock()

    await act(async () => {
      root?.render(
        <HopDongThaoTac
          token="test-token"
          embedded={true}
          buildingId={2}
          selectedHopDongId={201}
        />,
      )
    })

    await vi.waitFor(() => {
      expect(container?.textContent).toContain('HỢP ĐỒNG #201')
      expect(container?.textContent).toContain('Phòng 201 · Khách thuê: Khách Tòa B')
    })
  })

  it('Đổi A→B và A→B→A với phản hồi muộn: không nhận phản hồi cũ của A', async () => {
    type Resolver = (res: Response) => void
    let resolveBuilding1First: Resolver | null = null
    let building1CallCount = 0

    setupFetchMock((url) => {
      if (url.includes('/api/hop-dong?toaNhaId=1')) {
        building1CallCount++
        if (building1CallCount === 1) {
          return new Promise<Response>((resolve) => {
            resolveBuilding1First = resolve
          })
        }
        return Promise.resolve(new Response(JSON.stringify(mockContracts), { status: 200 }))
      }
      return undefined
    })

    // Mount initially with buildingId=1
    await act(async () => {
      root?.render(
        <HopDongThaoTac
          token="test-token"
          embedded={true}
          buildingId={1}
          selectedHopDongId={null}
        />,
      )
    })

    // Switch to building 2 (resolves fast)
    await act(async () => {
      root?.render(
        <HopDongThaoTac
          token="test-token"
          embedded={true}
          buildingId={2}
          selectedHopDongId={201}
        />,
      )
    })

    await vi.waitFor(() => {
      expect(container?.textContent).toContain('HỢP ĐỒNG #201')
    })

    // Now switch back to building 1
    await act(async () => {
      root?.render(
        <HopDongThaoTac
          token="test-token"
          embedded={true}
          buildingId={1}
          selectedHopDongId={1}
        />,
      )
    })

    // Delayed response 1 arrives now
    if (resolveBuilding1First) {
      await act(async () => {
        resolveBuilding1First!(new Response(JSON.stringify(mockContracts), { status: 200 }))
      })
    }

    await vi.waitFor(() => {
      expect(container?.textContent).toContain('HỢP ĐỒNG #1')
    })
  })

  it('Tạo mới thành công rồi mở đúng hợp đồng vừa tạo', async () => {
    const onSelectHopDong = vi.fn()
    const onToggleFormTao = vi.fn()

    setupFetchMock((url, init) => {
      if (url.endsWith('/api/hop-dong') && init?.method === 'POST') {
        const newContract = {
          id: 99,
          phongId: 101,
          soPhong: '101',
          nguoiThueId: 10,
          hoTenNguoiThue: 'Khách Vừa Tạo',
          ngayBatDau: '2026-06-01',
          ngayKetThuc: '2027-06-01',
          giaThue: '3500000.00',
          tienCoc: '3500000.00',
          soNgayBaoTruoc: 30,
          trangThai: 'CHO_KY',
          tenTrangThai: 'Chờ ký',
          sapHetHan: false,
          soNgayConLai: 365,
          dichVuApDung: [],
          quyetToan: null,
        }
        return Promise.resolve(new Response(JSON.stringify(newContract), { status: 200 }))
      }
      return undefined
    })

    await act(async () => {
      root?.render(
        <HopDongThaoTac
          token="test-token"
          embedded={true}
          buildingId={1}
          hienThiFormTao={true}
          onSelectHopDong={onSelectHopDong}
          onToggleFormTao={onToggleFormTao}
        />,
      )
    })

    await vi.waitFor(() => {
      expect(container?.querySelector('form')).not.toBeNull()
    })

    // Fill form
    const selects = container?.querySelectorAll('form select') || []
    const phongSelect = selects[0] as HTMLSelectElement
    if (phongSelect) {
      await act(async () => {
        phongSelect.value = '101'
        phongSelect.dispatchEvent(new Event('change', { bubbles: true }))
      })
    }

    const tenantSelect = selects[1] as HTMLSelectElement
    if (tenantSelect) {
      await act(async () => {
        tenantSelect.value = '10'
        tenantSelect.dispatchEvent(new Event('change', { bubbles: true }))
      })
    }

    const formEl = container?.querySelector('form')!
    await act(async () => {
      formEl.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    await vi.waitFor(() => {
      expect(onSelectHopDong).toHaveBeenCalledWith(99)
      expect(onToggleFormTao).toHaveBeenCalledWith(false)
    })
  })
})
