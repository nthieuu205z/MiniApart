// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThoCongViec, buocViecTho } from './ThoCongViec'
import { Tieu } from './CanTra'

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

const loaiBo = (u: RequestInfo | URL) => (typeof u === 'string' ? u : u instanceof URL ? u.pathname : u.url)

describe('ThoCongViec Component', () => {
  let container: HTMLDivElement
  let root: Root
  const goi: Array<{ url: string; method: string; body?: string }> = []

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    goi.length = 0
  })

  afterEach(async () => {
    await act(async () => root?.unmount())
    container.remove()
    vi.restoreAllMocks()
  })

  async function hienThi(ds: unknown[], url = '/viec-cua-toi', { mobile = true, detail = mockDetail, loiBaoXong = false }: { mobile?: boolean; detail?: object; loiBaoXong?: boolean } = {}) {
    window.history.replaceState({}, '', url)
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const u = loaiBo(input)
      goi.push({ url: u, method: init?.method ?? 'GET', body: init?.body as string | undefined })
      if (u === '/api/tho/cong-viec/101/bao-xong') return loiBaoXong ? new Response(JSON.stringify({ message: 'Máy chủ từ chối' }), { status: 400 }) : new Response(null, { status: 204 })
      if (u === '/api/tho/cong-viec/101/bao-gia') return new Response(JSON.stringify({ id: 77 }), { status: 200 })
      if (u === '/api/tho/cong-viec/101/bao-gia/77/gui-duyet') return new Response(JSON.stringify({ id: 77 }), { status: 200 })
      if (u === '/api/tho/cong-viec/101') return new Response(JSON.stringify(detail), { status: 200 })
      if (u.startsWith('/api/tho/cong-viec')) return new Response(JSON.stringify(ds), { status: 200 })
      if (u.includes('/api/auth/me') || u.includes('/me')) return new Response(JSON.stringify({ hoTen: 'Lê Quốc Huy' }), { status: 200 })
      throw new Error(`Unexpected ${u}`)
    }))
    root = createRoot(container)
    await act(async () => {
      root.render(<ThoCongViec token="worker-token" mobile={mobile} />)
    })
  }

  async function nhap(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    await act(async () => {
      Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, value)
      el.dispatchEvent(new Event('input', { bubbles: true }))
    })
  }

  const nutChinh = () => container.querySelectorAll<HTMLElement>('.btn-primary')
  const nutTheoNhan = (nhan: string) => Array.from(container.querySelectorAll<HTMLElement>('button')).find((b) => b.textContent?.includes(nhan))

  it('máy tính: khối Làm trước có hạng mục, toà, phòng; chỉ một h1 và hai tab', async () => {
    await hienThi(mockJobList, '/viec-cua-toi', { mobile: false })
    await vi.waitFor(() => expect(container.textContent).toContain('Vòi lavabo rò rỉ nước · phòng 201'))
    expect(container.textContent).toContain('Làm trước')
    expect(container.textContent).toContain('Tòa Central, tầng 2')
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(container.querySelector('table')).toBeNull()
    expect(Array.from(container.querySelectorAll('nav[aria-label="Lọc việc"] a')).map((a) => a.textContent)).toEqual(['Đang làm 1', 'Đã xong 1'])
  })

  it('hiện trạng thái rỗng khi không có việc nào', async () => {
    await hienThi([])
    await vi.waitFor(() => expect(container.textContent).toContain('Chưa có việc nào được giao'))
    expect(container.textContent).toContain('Khi quản lý giao việc, bạn sẽ nhận thông báo.')
    expect(nutChinh()).toHaveLength(0)
  })

  it('mỗi trạng thái có ≤ 1 .btn-primary với nhãn đúng', async () => {
    const dong = (trangThaiHieuLuc: string, extra: object = {}) => [{ ...mockJobList[0], trangThai: trangThaiHieuLuc, trangThaiHieuLuc, giaTriBaoGia: undefined, trangThaiBaoGia: undefined, ...extra }]
    const ca: Array<[unknown[], string[]]> = [
      [dong('DA_PHAN_CONG'), ['Bắt đầu khảo sát']],
      [dong('DANG_XU_LY'), ['Gửi báo giá']],
      [dong('DANG_XU_LY', { trangThaiBaoGia: 'DA_DUYET' }), ['Báo đã sửa xong']],
      [dong('CHO_XAC_NHAN'), []],
    ]
    for (const [ds, nhan] of ca) {
      await hienThi(ds)
      await vi.waitFor(() => expect(container.textContent).toContain('Làm trước'))
      expect(Array.from(nutChinh()).map((n) => n.textContent)).toEqual(nhan)
      expect(container.querySelector('a[href="tel:0987654321"]')).not.toBeNull()
      await act(async () => root.unmount())
    }
  })

  it('Việc khác liệt kê phần còn lại, tab Đã xong liệt kê việc đã xong', async () => {
    await hienThi([...mockJobList, { ...mockJobList[0], id: 103, hangMuc: 'Khoá cửa', soPhong: 'P.103', mucDo: 'THUONG' }])
    await vi.waitFor(() => expect(container.textContent).toContain('Việc khác (1 việc)'))
    expect(container.querySelector('[data-testid="worker-task-row-103"]')?.textContent).toContain('Tòa Central · đang làm')
    await act(async () => { (container.querySelectorAll('.seg-links a')[1] as HTMLAnchorElement).click() })
    expect(container.querySelector('[data-testid="worker-task-row-102"]')).not.toBeNull()
    expect(nutChinh()).toHaveLength(0)
  })

  it('buocViecTho: 5 ca trạng thái → bước', () => {
    const b = (trangThaiHieuLuc: string, trangThaiBaoGia?: string) => buocViecTho({ trangThaiHieuLuc, trangThaiBaoGia } as never)
    expect(b('DA_PHAN_CONG')).toEqual({ so: 1, nhan: 'Bước 1/4 · Khảo sát' })
    expect(b('DANG_XU_LY')).toEqual({ so: 2, nhan: 'Bước 2/4 · Báo giá' })
    expect(b('DANG_XU_LY', 'CHO_DUYET').so).toBe(2)
    expect(b('DANG_XU_LY', 'DA_DUYET')).toEqual({ so: 3, nhan: 'Bước 3/4 · Sửa' })
    expect(b('CHO_XAC_NHAN')).toEqual({ so: 4, nhan: 'Bước 4/4 · Nhận tiền' })
  })

  it('chi tiết (?yeuCauId): liên hệ, Đã làm gì, ẩn nút ảnh và nút trả việc, một nút chính', async () => {
    await hienThi(mockJobList, '/viec-cua-toi?yeuCauId=101')
    await vi.waitFor(() => expect(container.textContent).toContain('Quản lý Trần Hoàng'))
    expect(container.textContent).toContain('SC-20261101-001')
    expect(container.textContent).toContain('Đã làm gì')
    expect(container.textContent).toContain('0987 654 321')
    expect(container.textContent).not.toContain('Chụp ảnh hiện trạng')
    expect(container.textContent).not.toContain('Tôi không nhận được việc này')
    expect(Array.from(nutChinh()).map((n) => n.textContent)).toEqual(['Báo đã sửa xong'])
  })

  it('báo đã sửa xong: bắt buộc nhập Đã làm gì rồi gọi /bao-xong với ketQuaSuaChua', async () => {
    await hienThi(mockJobList, '/viec-cua-toi?yeuCauId=101')
    await vi.waitFor(() => expect(nutTheoNhan('Báo đã sửa xong')).toBeDefined())
    await act(async () => { nutTheoNhan('Báo đã sửa xong')?.click() })
    const gui = nutTheoNhan('Gửi báo xong')!
    expect(gui.getAttribute('aria-disabled')).toBe('true')
    await act(async () => { gui.click() })
    expect(goi.some((c) => c.url.endsWith('/bao-xong'))).toBe(false)
    await nhap(container.querySelector('textarea[placeholder^="Ví dụ: thay công tắc"]')!, 'Thay công tắc, đã thử điện')
    expect(nutTheoNhan('Gửi báo xong')?.getAttribute('aria-disabled')).toBeNull()
    await act(async () => { nutTheoNhan('Gửi báo xong')?.click() })
    await vi.waitFor(() => expect(container.textContent).toContain('Đã báo xong. Chờ quản lý nghiệm thu.'))
    const c = goi.find((x) => x.url === '/api/tho/cong-viec/101/bao-xong')!
    expect(c.method).toBe('POST')
    expect(JSON.parse(c.body!)).toEqual({ ketQuaSuaChua: 'Thay công tắc, đã thử điện' })
  })

  it('báo xong lỗi: báo trong khối và giữ chữ đã nhập', async () => {
    await hienThi(mockJobList, '/viec-cua-toi?yeuCauId=101', { loiBaoXong: true })
    await vi.waitFor(() => expect(nutTheoNhan('Báo đã sửa xong')).toBeDefined())
    await act(async () => { nutTheoNhan('Báo đã sửa xong')?.click() })
    await nhap(container.querySelector('textarea[placeholder^="Ví dụ: thay công tắc"]')!, 'Đã thay gioăng')
    await act(async () => { nutTheoNhan('Gửi báo xong')?.click() })
    await vi.waitFor(() => expect(container.querySelector('[role="alert"]')?.textContent).toContain('Máy chủ từ chối'))
    expect((container.querySelector('textarea[placeholder^="Ví dụ: thay công tắc"]') as HTMLTextAreaElement).value).toBe('Đã thay gioăng')
  })

  it('báo giá: không có dòng hợp lệ thì nút gửi aria-disabled; gửi thì gọi bao-gia rồi gui-duyet', async () => {
    await hienThi(mockJobList, '/viec-cua-toi?yeuCauId=101&baoGia=1')
    await vi.waitFor(() => expect(container.textContent).toContain('Dòng 1: vật tư hoặc công'))
    const gui = () => container.querySelector<HTMLElement>('.btn-primary')!
    expect(gui().getAttribute('aria-disabled')).toBe('true')
    expect(container.textContent).toContain('Thêm ít nhất một dòng có đơn giá.')
    const o = container.querySelectorAll<HTMLInputElement>('input')
    await nhap(o[0], 'Bóng LED âm trần 9W')
    await nhap(o[1], '2')
    await nhap(o[2], '0')
    expect(gui().getAttribute('aria-disabled')).toBe('true')
    await nhap(o[2], '85000')
    expect(gui().getAttribute('aria-disabled')).toBeNull()
    expect(gui().textContent).toBe('Gửi báo giá 170.000 ₫')
    await act(async () => { gui().click() })
    await vi.waitFor(() => expect(goi.some((c) => c.url.endsWith('/gui-duyet'))).toBe(true))
    const ghi = goi.filter((c) => c.method === 'POST').map((c) => c.url)
    expect(ghi).toEqual(['/api/tho/cong-viec/101/bao-gia', '/api/tho/cong-viec/101/bao-gia/77/gui-duyet'])
  })

  it('Tieu vẫn import được từ CanTra', () => {
    expect(typeof Tieu).toBe('function')
  })
})
