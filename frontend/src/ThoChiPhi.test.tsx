// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThoChiPhi } from './ThoChiPhi'

const mockVoucher = {
  maChungTu: 'CT-SC-101',
  ngayLap: '01/11/2026',
  yeuCauId: 101,
  maYeuCau: 'SC-20261101-001',
  hangMuc: 'Vòi lavabo rò rỉ nước',
  toaNha: 'Tòa Central',
  diaChiToaNha: '123 Cầu Giấy, Hà Nội',
  soPhong: 'P.201',
  tang: 2,
  tenTho: 'Lê Quốc Huy',
  sdtTho: '0999000031',
  tenQuanLy: 'Quản lý Trần Hoàng',
  sdtQuanLy: '0900000001',
  tenNguoiBao: 'Nguyễn Văn An',
  sdtNguoiBao: '0987654321',
  trangThaiYeuCau: 'Đã hoàn thành',
  baoGiaPhienBan: 1,
  dongBaoGia: [
    {
      id: 1,
      thuTu: 1,
      tenHangMuc: 'Thay dây cấp + gioăng',
      soLuong: 1,
      donVi: 'bộ',
      donGia: 300000,
      thanhTien: 300000,
    },
    {
      id: 2,
      thuTu: 2,
      tenHangMuc: 'Công thợ sửa chữa',
      soLuong: 1,
      donVi: 'công',
      donGia: 150000,
      thanhTien: 150000,
    },
  ],
  tongTienBaoGia: 450000,
  lichSuThanhToan: [
    {
      id: 1,
      maThanhToan: 'TT-101-01',
      yeuCauId: 101,
      baoGiaId: 50,
      soTien: 450000,
      phuongThuc: 'CHUYEN_KHOAN' as const,
      maThamChieu: 'MB-REF-99881',
      nguoiXacNhanId: 2,
      xacNhanLuc: '2026-11-01T15:30:00Z',
    },
  ],
  tongDaTra: 450000,
  conLai: 0,
}

const mockJobList = [
  {
    id: 101,
    maYeuCau: 'SC-20261101-001',
    hangMuc: 'Vòi lavabo rò rỉ nước',
    moTa: 'Khớp nối vòi rò nước',
    toaNhaId: 1,
    toaNha: 'Tòa Central',
    diaChiToaNha: '123 Cầu Giấy, Hà Nội',
    soPhong: 'P.201',
    tang: 2,
    nguoiLienHeHoTen: 'Nguyễn Văn An',
    soDienThoaiLienHe: '0987654321',
    mucDo: 'GAP' as const,
    tenMucDo: 'Gấp',
    trangThai: 'DA_DONG',
    tenTrangThai: 'Đã đóng',
    trangThaiHieuLuc: 'DA_DONG',
    tenTrangThaiHieuLuc: 'Đã hoàn thành',
    giaTriBaoGia: 450000,
    trangThaiBaoGia: 'DA_DUYET' as const,
    tenTrangThaiBaoGia: 'Đã duyệt',
    daThanhToan: 450000,
    conPhaiTra: 0,
  },
  {
    id: 102,
    maYeuCau: 'SC-20261102-002',
    hangMuc: 'Bảo hành chấn lưu đèn',
    moTa: 'Đèn chớp tắt sau sửa',
    toaNhaId: 1,
    toaNha: 'Tòa Central',
    diaChiToaNha: '123 Cầu Giấy, Hà Nội',
    soPhong: 'P.302',
    tang: 3,
    nguoiLienHeHoTen: 'Lê Thu Trang',
    soDienThoaiLienHe: '0912345678',
    mucDo: 'THUONG' as const,
    tenMucDo: 'Bình thường',
    trangThai: 'DA_DONG',
    tenTrangThai: 'Đã đóng',
    trangThaiHieuLuc: 'DA_DONG',
    tenTrangThaiHieuLuc: 'Đã hoàn thành',
    giaTriBaoGia: 0,
    trangThaiBaoGia: 'DA_DUYET' as const,
    tenTrangThaiBaoGia: 'Đã duyệt',
    daThanhToan: 0,
    conPhaiTra: 0,
  },
]

describe('ThoChiPhi Component', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(async () => {
    await act(async () => root?.unmount())
    container.remove()
    vi.restoreAllMocks()
  })

  it('renders quotes and payment overview table with metrics and filter pills', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url
      if (url.startsWith('/api/tho/tong-quan')) {
        return new Response(JSON.stringify({ danhSachToa: [{ id: 1, ten: 'Tòa Central' }] }), { status: 200 })
      }
      if (url.startsWith('/api/tho/cong-viec')) {
        return new Response(JSON.stringify(mockJobList), { status: 200 })
      }
      throw new Error(`Unexpected ${url}`)
    }))

    root = createRoot(container)
    await act(async () => {
      root.render(<ThoChiPhi token="worker-token" />)
    })

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Báo giá & thanh toán')
      expect(container.textContent).toContain('450.000') // Tổng giá trị đã chốt
      expect(container.textContent).toContain('1 đơn 0đ (bảo hành)')
      expect(container.textContent).toContain('SC-20261101-001')
      expect(container.textContent).toContain('Đã hết nợ')
      expect(container.textContent).toContain('0 đ (Bảo hành)')
    })

    // Filter pills exist
    expect(container.textContent).toContain('Tất cả')
    expect(container.textContent).toContain('Đã nhận đủ')
    expect(container.textContent).toContain('Trả một phần')
    expect(container.textContent).toContain('Chưa thanh toán')
    expect(container.textContent).toContain('Bảo hành (0đ)')
  })

  it('opens printable voucher dialog with full cost items, payment history, and signatures', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url
      if (url.startsWith('/api/tho/tong-quan')) {
        return new Response(JSON.stringify({ danhSachToa: [] }), { status: 200 })
      }
      if (url.startsWith('/api/tho/cong-viec')) {
        return new Response(JSON.stringify(mockJobList), { status: 200 })
      }
      if (url === '/api/tho/chung-tu/101') {
        return new Response(JSON.stringify(mockVoucher), { status: 200 })
      }
      throw new Error(`Unexpected ${url}`)
    }))

    root = createRoot(container)
    await act(async () => {
      root.render(<ThoChiPhi token="worker-token" />)
    })

    await vi.waitFor(() => {
      expect(container.textContent).toContain('SC-20261101-001')
    })

    // Click Xem phiếu button
    const viewVoucherBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Xem phiếu'))
    expect(viewVoucherBtn).toBeDefined()
    await act(async () => {
      viewVoucherBtn?.click()
    })

    await vi.waitFor(() => {
      expect(container.textContent).toContain('PHIẾU XÁC NHẬN CHI PHÍ & THANH TOÁN SỬA CHỮA')
      expect(container.textContent).toContain('CT-SC-101')
      expect(container.textContent).toContain('Lê Quốc Huy')
      expect(container.textContent).toContain('Quản lý Trần Hoàng')
      expect(container.textContent).toContain('Nguyễn Văn An')
      expect(container.textContent).toContain('Thay dây cấp + gioăng')
      expect(container.textContent).toContain('MB-REF-99881')
      expect(container.textContent).toContain('THỢ THI CÔNG')
      expect(container.textContent).toContain('CƯ DÂN NGHIỆM THU')
      expect(container.textContent).toContain('QUẢN LÝ PHÊ DUYỆT')
    })
  })
  it('mobile: thẻ việc có 3 ô tiền, nút Xem phiếu; chip lọc đếm đúng', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url
      if (url.startsWith('/api/tho/tong-quan')) return new Response(JSON.stringify({ danhSachToa: [] }), { status: 200 })
      if (url.startsWith('/api/tho/cong-viec')) return new Response(JSON.stringify(mockJobList), { status: 200 })
      throw new Error(`Unexpected ${url}`)
    }))
    root = createRoot(container)
    await act(async () => {
      root.render(<ThoChiPhi token="worker-token" mobile />)
    })
    await vi.waitFor(() => expect(container.querySelectorAll('article.m-card').length).toBe(mockJobList.length))
    const the = container.querySelector('article[aria-label="SC-20261101-001"]')
    expect(the?.querySelectorAll('.fact').length).toBe(3)
    expect(the?.textContent).toContain('Đã hết nợ')
    expect(Array.from(the?.querySelectorAll('button') ?? []).some((b) => b.textContent?.includes('Xem phiếu'))).toBe(true)
    const chipBaoHanh = Array.from(container.querySelectorAll('button.chip')).find((b) => b.textContent?.startsWith('Bảo hành'))
    expect(chipBaoHanh?.querySelector('.n')?.textContent).toBe(String(mockJobList.filter((r) => r.trangThaiBaoGia === 'DA_DUYET' && Number(r.giaTriBaoGia || 0) === 0).length))
  })
})
