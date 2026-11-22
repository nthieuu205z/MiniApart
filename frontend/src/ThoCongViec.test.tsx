// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThoCongViec, buocViecTho } from './ThoCongViec'

const mockJobList = [
  {
    id: 101,
    maYeuCau: 'SC-20261101-001',
    hangMuc: 'Vòi lavabo rò rỉ nước',
    moTa: 'Khớp nối vòi bồn rửa mặt bị rò nước nhỏ giọt xuống sàn',
    toaNhaId: 1,
    toaNha: 'Tòa Central',
    diaChiToaNha: '123 Cầu Giấy, Hà Nội',
    soPhong: 'P.201',
    tang: 2,
    nguoiLienHeHoTen: 'Nguyễn Văn An',
    soDienThoaiLienHe: '0987654321',
    mucDo: 'GAP' as const,
    tenMucDo: 'Gấp',
    trangThai: 'DANG_XU_LY',
    tenTrangThai: 'Đang xử lý',
    trangThaiHieuLuc: 'DANG_XU_LY',
    tenTrangThaiHieuLuc: 'Đang xử lý',
    phanCongLuc: '2026-11-01T08:00:00Z',
    taoLuc: '2026-11-01T07:30:00Z',
    giaTriBaoGia: 450000,
    trangThaiBaoGia: 'DA_DUYET' as const,
    tenTrangThaiBaoGia: 'Đã duyệt',
    daThanhToan: 0,
    conPhaiTra: 450000,
  },
  {
    id: 102,
    maYeuCau: 'SC-20261102-002',
    hangMuc: 'Bình nóng lạnh không vào điện',
    moTa: 'Bật cầu dao không sáng đèn báo nguồn',
    toaNhaId: 1,
    toaNha: 'Tòa Central',
    diaChiToaNha: '123 Cầu Giấy, Hà Nội',
    soPhong: 'P.305',
    tang: 3,
    nguoiLienHeHoTen: 'Trần Thị B',
    soDienThoaiLienHe: '0912000002',
    mucDo: 'KHAN_CAP' as const,
    tenMucDo: 'Khẩn cấp',
    trangThai: 'DA_DONG',
    tenTrangThai: 'Đã đóng',
    trangThaiHieuLuc: 'DA_DONG',
    tenTrangThaiHieuLuc: 'Đã hoàn thành',
    phanCongLuc: '2026-11-02T09:00:00Z',
    taoLuc: '2026-11-02T08:30:00Z',
    giaTriBaoGia: 0,
    trangThaiBaoGia: 'DA_DUYET' as const,
    tenTrangThaiBaoGia: 'Đã duyệt',
    daThanhToan: 0,
    conPhaiTra: 0,
  },
]

const mockDetail = {
  id: 101,
  maYeuCau: 'SC-20261101-001',
  hangMuc: 'Vòi lavabo rò rỉ nước',
  moTa: 'Khớp nối vòi bồn rửa mặt bị rò nước nhỏ giọt xuống sàn',
  mucDo: 'GAP' as const,
  tenMucDo: 'Gấp',
  trangThai: 'DANG_XU_LY',
  tenTrangThai: 'Đang xử lý',
  trangThaiHieuLuc: 'DANG_XU_LY',
  tenTrangThaiHieuLuc: 'Đang xử lý',
  toaNhaId: 1,
  toaNha: 'Tòa Central',
  diaChiToaNha: '123 Cầu Giấy, Hà Nội',
  soPhong: 'P.201',
  tang: 2,
  nguoiBaoHoTen: 'Nguyễn Văn An',
  nguoiBaoSoDienThoai: '0987654321',
  nguoiLienHeHoTen: 'Nguyễn Văn An',
  soDienThoaiLienHe: '0987654321',
  laNguoiDungTenHopDong: true,
  quanLyPhuTrachHoTen: 'Quản lý Trần Hoàng',
  quanLyPhuTrachSoDienThoai: '0900000001',
  taoLuc: '2026-11-01T07:30:00Z',
  phanCongLuc: '2026-11-01T08:00:00Z',
  ghiChuKhaoSat: 'Đã kiểm tra hỏng gioăng cao su',
  anhTruocIds: [],
  anhSauIds: [],
  lichSuTrangThai: [
    {
      thoiDiem: '2026-11-01T08:00:00Z',
      hanhDong: 'PHAN_CONG',
      tenHanhDong: 'Phân công',
      nguoiThucHien: 'Quản lý Trần Hoàng',
      laTuDong: false,
    },
  ],
  danhSachBaoGia: [
    {
      id: 50,
      maBaoGia: 'BG-101-01',
      yeuCauId: 101,
      phienBan: 1,
      trangThai: 'DA_DUYET' as const,
      tongTien: 450000,
      nguoiTaoId: 4,
      taoLuc: '2026-11-01T09:00:00Z',
      dongBaoGia: [
        {
          id: 1,
          thuTu: 1,
          tenHangMuc: 'Thay dây cấp + gioăng cao su',
          soLuong: 1,
          donVi: 'bộ',
          donGia: 300000,
          thanhTien: 300000,
        },
        {
          id: 2,
          thuTu: 2,
          tenHangMuc: 'Công thợ thay thế',
          soLuong: 1,
          donVi: 'công',
          donGia: 150000,
          thanhTien: 150000,
        },
      ],
    },
  ],
  danhSachThanhToan: [],
  tongTienBaoGia: 450000,
  tongDaNhan: 0,
  tongConLai: 450000,
  trangThaiThanhToan: 'CHUA_THANH_TOAN' as const,
}

describe('ThoCongViec Component', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    window.history.replaceState({}, '', '/viec-cua-toi')
  })

  afterEach(async () => {
    await act(async () => root?.unmount())
    container.remove()
    vi.restoreAllMocks()
  })

  it('renders wide desktop rows with ticket code, building, room, and status tag', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url
      if (url.startsWith('/api/tho/cong-viec')) return new Response(JSON.stringify(mockJobList), { status: 200 })
      throw new Error(`Unexpected ${url}`)
    }))

    root = createRoot(container)
    await act(async () => {
      root.render(<ThoCongViec token="worker-token" />)
    })

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Danh sách công việc')
      expect(container.textContent).toContain('SC-20261101-001')
      expect(container.textContent).toContain('Vòi lavabo rò rỉ nước')
      expect(container.textContent).toContain('P.201')
      expect(container.textContent).toContain('Tòa Central')
      expect(container.textContent).toContain('Nguyễn Văn An')
      expect(container.textContent).toContain('Gấp')
    })
  })

  it('opens detail drawer with deep link when clicking Xem chi tiết', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url
      if (url === '/api/tho/cong-viec/101') return new Response(JSON.stringify(mockDetail), { status: 200 })
      if (url.startsWith('/api/tho/cong-viec')) return new Response(JSON.stringify(mockJobList), { status: 200 })
      throw new Error(`Unexpected ${url}`)
    }))

    root = createRoot(container)
    await act(async () => {
      root.render(<ThoCongViec token="worker-token" />)
    })

    await vi.waitFor(() => {
      expect(container.textContent).toContain('SC-20261101-001')
    })

    // Click Xem chi tiết button
    const viewBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Xem chi tiết'))
    expect(viewBtn).toBeDefined()
    await act(async () => {
      viewBtn?.click()
    })

    await vi.waitFor(() => {
      expect(window.location.search).toContain('yeuCauId=101')
      expect(container.textContent).toContain('Chi tiết sự cố: SC-20261101-001')
      expect(container.textContent).toContain('123 Cầu Giấy, Hà Nội')
      expect(container.textContent).toContain('Quản lý Trần Hoàng')
      expect(container.textContent).toContain('Đã kiểm tra hỏng gioăng cao su')
      expect(container.textContent).toContain('Thay dây cấp + gioăng cao su')
    })
  })

  it('filters by status group tabs and shows empty state when no matching tasks', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      return new Response(JSON.stringify([]), { status: 200 })
    }))

    root = createRoot(container)
    await act(async () => {
      root.render(<ThoCongViec token="worker-token" />)
    })

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Không tìm thấy công việc nào')
    })
  })

  it('mobile: mỗi thẻ có đúng 1 nút chính theo trạng thái và số điện thoại bấm được', async () => {
    const dong = (id: number, trangThaiHieuLuc: string, extra: object) => ({
      ...mockJobList[0],
      id,
      maYeuCau: `SC-${id}`,
      trangThai: trangThaiHieuLuc,
      trangThaiHieuLuc,
      tenTrangThaiHieuLuc: trangThaiHieuLuc,
      ...extra,
    })
    const ds = [
      dong(1, 'DA_PHAN_CONG', { giaTriBaoGia: undefined, trangThaiBaoGia: undefined }),
      dong(2, 'DANG_XU_LY', { giaTriBaoGia: undefined, trangThaiBaoGia: undefined }),
      dong(3, 'DANG_XU_LY', { trangThaiBaoGia: 'DA_DUYET' }),
    ]
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url
      if (url.startsWith('/api/tho/cong-viec')) return new Response(JSON.stringify(ds), { status: 200 })
      throw new Error(`Unexpected ${url}`)
    }))

    root = createRoot(container)
    await act(async () => {
      root.render(<ThoCongViec token="worker-token" mobile />)
    })

    await vi.waitFor(() => expect(container.querySelectorAll('article').length).toBe(3))
    const nhanNut = ds.map((d) => {
      const nut = container.querySelectorAll(`[data-testid="worker-task-row-${d.id}"] .btn`)
      expect(nut.length).toBe(1)
      return nut[0].textContent
    })
    expect(nhanNut).toEqual(['Bắt đầu khảo sát', 'Gửi báo giá', 'Báo đã sửa xong'])
    const tel = container.querySelector('a[href^="tel:"]')
    expect(tel?.getAttribute('href')).toBe('tel:0987654321')
  })

  it('buocViecTho: 5 ca trạng thái → bước', () => {
    const b = (trangThaiHieuLuc: string, trangThaiBaoGia?: string) => buocViecTho({ trangThaiHieuLuc, trangThaiBaoGia } as never)
    expect(b('DA_PHAN_CONG')).toEqual({ so: 1, nhan: 'Bước 1/4 · Khảo sát' })
    expect(b('DANG_XU_LY')).toEqual({ so: 2, nhan: 'Bước 2/4 · Báo giá' })
    expect(b('DANG_XU_LY', 'CHO_DUYET').so).toBe(2)
    expect(b('DANG_XU_LY', 'DA_DUYET')).toEqual({ so: 3, nhan: 'Bước 3/4 · Sửa' })
    expect(b('CHO_XAC_NHAN')).toEqual({ so: 4, nhan: 'Bước 4/4 · Nhận tiền' })
  })

  async function renderMobile(ds: unknown[], url = '/viec-cua-toi') {
    window.history.replaceState({}, '', url)
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const u = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url
      if (u === '/api/tho/cong-viec/101') return new Response(JSON.stringify(mockDetail), { status: 200 })
      if (u.startsWith('/api/tho/cong-viec')) return new Response(JSON.stringify(ds), { status: 200 })
      throw new Error(`Unexpected ${u}`)
    }))
    root = createRoot(container)
    await act(async () => {
      root.render(<ThoCongViec token="worker-token" mobile />)
    })
  }

  it('mobile: lọc ?loc=xong, mặc định Gấp, đếm trên seg, chỉ 1 btn-primary, chấm bước', async () => {
    await renderMobile(mockJobList, '/viec-cua-toi?loc=xong')
    await vi.waitFor(() => expect(container.querySelectorAll('article').length).toBe(1))
    expect(Array.from(container.querySelectorAll('.seg-links a')).map((t) => t.textContent)).toEqual(['Gấp (1)', 'Đang làm (1)', 'Xong (1)'])
    expect(container.querySelector('[data-testid="worker-task-row-102"]')).not.toBeNull()
    expect(container.querySelector('.btn-primary')).toBeNull()
    expect(container.querySelector('[data-testid="worker-task-row-102"]')?.textContent).toContain('Chờ quản lý thanh toán')
    await act(async () => {
      ;(container.querySelectorAll('.seg-links a')[0] as HTMLAnchorElement).click()
    })
    expect(window.location.search).toBe('?loc=gap')
    expect(container.querySelectorAll('.btn-primary').length).toBe(1)
    expect(container.querySelector('.dots')?.getAttribute('aria-label')).toBe('Bước 3/4 · Sửa')
  })

  it('mobile: yeuCauId trên URL mở drawer chi tiết như cũ', async () => {
    await renderMobile(mockJobList, '/viec-cua-toi?yeuCauId=101')
    await vi.waitFor(() => expect(container.textContent).toContain('Chi tiết sự cố: SC-20261101-001'))
  })
})
