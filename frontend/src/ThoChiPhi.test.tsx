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

  async function hienThi(ds: unknown[], mobile = false) {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url
      if (url === '/api/tho/chung-tu/101') return new Response(JSON.stringify(mockVoucher), { status: 200 })
      if (url.startsWith('/api/tho/cong-viec')) return new Response(JSON.stringify(ds), { status: 200 })
      return new Response(JSON.stringify({ hoTen: 'Lê Quốc Huy' }), { status: 200 })
    }))
    root = createRoot(container)
    await act(async () => {
      root.render(<ThoChiPhi token="worker-token" mobile={mobile} />)
    })
  }

  it('hiện Tiền công, số thật của từng việc đã xong (không số cố định), không nút chính, đúng một h1', async () => {
    await hienThi(mockJobList)
    await vi.waitFor(() => expect(container.textContent).toContain('Bảo hành chấn lưu đèn · phòng 302'))
    expect(container.textContent).toContain('Còn được nhận')
    expect(container.textContent).toContain('Chưa có việc nào nghiệm thu xong mà chưa trả tiền.')
    expect(container.querySelector('[data-testid="tien-cong-101"]')?.textContent).toContain('450.000')
    expect(container.querySelector('[data-testid="tien-cong-102"]')?.textContent).toContain('0 ₫')
    expect(container.textContent).not.toContain('250.000')
    expect(container.querySelector('.btn-primary')).toBeNull()
    expect(container.querySelectorAll('h1')).toHaveLength(1)
  })

  it('việc không có báo giá duyệt thì ghi —; Còn được nhận cộng phần chưa trả', async () => {
    await hienThi([{ ...mockJobList[0], giaTriBaoGia: undefined, trangThaiBaoGia: undefined, conPhaiTra: 0 }, { ...mockJobList[1], id: 103, giaTriBaoGia: 300000, daThanhToan: 100000, conPhaiTra: 200000 }])
    await vi.waitFor(() => expect(container.querySelector('[data-testid="tien-cong-103"]')).not.toBeNull())
    expect(container.querySelector('[data-testid="tien-cong-101"]')?.textContent).toContain('—')
    expect(container.querySelector('[data-con-nhan]')?.textContent).toBe('200.000 ₫')
  })

  it('mở phiếu chứng từ có hạng mục, lịch sử thanh toán và chữ ký', async () => {
    await hienThi(mockJobList, true)
    await vi.waitFor(() => expect(container.textContent).toContain('Vòi lavabo rò rỉ nước · phòng 201'))
    const nut = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Xem phiếu'))
    expect(nut).toBeDefined()
    await act(async () => { nut?.click() })
    await vi.waitFor(() => {
      expect(container.textContent).toContain('CT-SC-101')
      expect(container.textContent).toContain('Lê Quốc Huy')
      expect(container.textContent).toContain('Thay dây cấp + gioăng')
      expect(container.textContent).toContain('MB-REF-99881')
      expect(container.textContent).toContain('Thợ thi công')
      expect(container.textContent).toContain('Quản lý phê duyệt')
    })
  })
})
