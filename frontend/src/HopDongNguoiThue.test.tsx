// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HopDongNguoiThue from './HopDongNguoiThue'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

const HOP_DONG = [
  {
    id: 1,
    phongId: 101,
    soPhong: '101',
    nguoiThueId: 10,
    hoTenNguoiThue: 'Người thuê A',
    ngayBatDau: '2026-01-01',
    ngayKetThuc: '2026-12-31',
    giaThue: '3500000.00',
    tienCoc: '3500000.00',
    soNgayBaoTruoc: 30,
    trangThai: 'HIEU_LUC',
    tenTrangThai: 'Hiệu lực',
    sapHetHan: false,
    soNgayConLai: 114,
    dichVuApDung: [{ dichVuId: 7, tenDichVu: 'Điện', donGiaApDung: '3500.00' }],
    quyetToan: null,
  },
  {
    id: 2,
    phongId: 102,
    soPhong: '102',
    nguoiThueId: 10,
    hoTenNguoiThue: 'Người thuê A',
    ngayBatDau: '2026-01-01',
    ngayKetThuc: '2026-09-10',
    giaThue: '3600000.00',
    tienCoc: '3600000.00',
    soNgayBaoTruoc: 30,
    trangThai: 'HIEU_LUC',
    tenTrangThai: 'Hiệu lực',
    sapHetHan: true,
    soNgayConLai: 12,
    dichVuApDung: [{ dichVuId: 8, tenDichVu: 'Nước', donGiaApDung: '18000.00' }],
    quyetToan: null,
  },
  {
    id: 3,
    phongId: 103,
    soPhong: '103',
    nguoiThueId: 10,
    hoTenNguoiThue: 'Người thuê A',
    ngayBatDau: '2025-01-01',
    ngayKetThuc: '2026-09-01',
    giaThue: '3700000.00',
    tienCoc: '3700000.00',
    soNgayBaoTruoc: 30,
    trangThai: 'HIEU_LUC',
    tenTrangThai: 'Hiệu lực',
    sapHetHan: false,
    soNgayConLai: -1,
    dichVuApDung: [],
    quyetToan: null,
  },
  {
    id: 4,
    phongId: 104,
    soPhong: '104',
    nguoiThueId: 10,
    hoTenNguoiThue: 'Người thuê A',
    ngayBatDau: '2024-01-01',
    ngayKetThuc: '2025-12-31',
    giaThue: '3800000.00',
    tienCoc: '3800000.00',
    soNgayBaoTruoc: 30,
    trangThai: 'DA_THANH_LY',
    tenTrangThai: 'Đã thanh lý',
    sapHetHan: false,
    soNgayConLai: -245,
    dichVuApDung: [],
    quyetToan: null,
  },
]

describe('HopDongNguoiThue', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(HOP_DONG), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })))
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.restoreAllMocks()
  })

  it('FR-POR-07 BR-14 renders four distinct contract time cases with concrete dates and days', async () => {
    await act(async () => {
      root.render(<HopDongNguoiThue token="tenant-token" mobile />)
    })

    await vi.waitFor(() => {
      expect(container.querySelector('[data-testid="tenant-contract-screen"]')).not.toBeNull()
    })

    expect(container.querySelector('[data-layout-variant="mobile"]')).not.toBeNull()
    expect(container.querySelector('[data-contract-status="far"]')?.textContent).toContain('Hợp đồng còn hiệu lực')
    expect(container.querySelector('[data-contract-status="warning"]')?.textContent).toContain('Hợp đồng còn 12 ngày (hết hạn 10/09/2026)')
    expect(container.querySelector('[data-contract-status="expired"]')?.textContent).toContain('Hợp đồng đã hết hạn ngày 01/09/2026')
    expect(container.querySelector('[data-contract-status="settled"]')?.textContent).toContain('Đã thanh lý — chỉ xem lại thông tin hợp đồng.')
  })

  it('FR-POR-07 BR-14 shows room, dates, rent, applied services, and deposit as separate contract information', async () => {
    await act(async () => {
      root.render(<HopDongNguoiThue token="tenant-token" />)
    })

    await vi.waitFor(() => expect(container.textContent).toContain('Phòng 101'))

    expect(container.textContent).toContain('01/01/2026')
    expect(container.textContent).toContain('31/12/2026')
    expect(container.textContent).toContain('3.500.000 ₫')
    expect(container.textContent).toContain('Điện')
    expect(container.textContent).toContain('3.500 ₫')
    expect(container.textContent).toContain('Tiền cọc thoả thuận')
    expect(container.textContent).not.toContain('Hoá đơn')
  })
})
