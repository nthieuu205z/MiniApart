// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThoTongQuan } from './ThoTongQuan'

const mockData = {
  kpi: {
    dangXuLy: 5,
    choXacNhan: 3,
    tyLeHoanThanh: {
      tyLe: 75.0,
      daHoanThanh: 9,
      tongDuocGiao: 12,
      moTa: '9/12 đơn hoàn thành',
      coDuLieu: true,
    },
    giaTriDaChot: 15000000,
    daNhan: 11000000,
    conPhaiTra: 4000000,
  },
  bieuDoTrangThai: [
    { trangThai: 'DANG_XU_LY', tenTrangThai: 'Đang xử lý', soLuong: 5, mauSac: '#2563EB' },
    { trangThai: 'CHO_XAC_NHAN', tenTrangThai: 'Chờ xác nhận', soLuong: 3, mauSac: '#F59E0B' },
    { trangThai: 'DA_DONG', tenTrangThai: 'Đã hoàn thành', soLuong: 9, mauSac: '#10B981' },
  ],
  bieuDoXuHuong: [
    { nhan: 'T09', giaTriDaChot: 4000000, daNhan: 3000000, soViecXong: 3 },
    { nhan: 'T10', giaTriDaChot: 5000000, daNhan: 4000000, soViecXong: 3 },
    { nhan: 'T11', giaTriDaChot: 6000000, daNhan: 4000000, soViecXong: 3 },
  ],
  viecCanXuLy: [
    {
      id: 1,
      maYeuCau: 'SC-20261101-001',
      hangMuc: 'Vòi lavabo rò nước',
      moTa: 'Rò rỉ nước ở chân vòi',
      toaNhaId: 10,
      toaNha: 'Tòa Sky',
      diaChiToaNha: '123 Cầu Giấy',
      soPhong: 'P.302',
      tang: 3,
      nguoiLienHeHoTen: 'Nguyễn Văn A',
      soDienThoaiLienHe: '0912345678',
      mucDo: 'KHAN_CAP' as const,
      tenMucDo: 'Khẩn cấp',
      trangThai: 'DANG_XU_LY',
      tenTrangThai: 'Đang xử lý',
      trangThaiHieuLuc: 'DANG_XU_LY',
      tenTrangThaiHieuLuc: 'Đang xử lý',
      taoLuc: '2026-11-01T08:00:00Z',
      daThanhToan: 0,
      conPhaiTra: 350000,
    },
  ],
  baoGiaCanBoSung: [
    {
      baoGiaId: 20,
      yeuCauId: 2,
      maYeuCau: 'SC-20261102-002',
      hangMuc: 'Sửa ổ cắm điện',
      soPhong: '401',
      toaNha: 'Tòa Sky',
      phienBan: 1,
      trangThai: 'TU_CHOI' as const,
      tenTrangThai: 'Bị từ chối',
      tongTien: 600000,
      lyDoTuChoi: 'Chi phí linh kiện chưa hợp lý',
      taoLuc: '2026-11-02T10:00:00Z',
    },
  ],
  danhSachToa: [{ id: 10, ten: 'Tòa Sky' }],
}

describe('ThoTongQuan Component', () => {
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

  it('renders all 6 KPIs, quick action lists, charts and building filters', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      return new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }))

    const navigateMock = vi.fn()
    root = createRoot(container)
    await act(async () => {
      root.render(<ThoTongQuan token="worker-token" onNavigate={navigateMock} />)
    })

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Tổng quan công việc của thợ')
      expect(container.textContent).toContain('15.000.000 đ') // Giá trị đã chốt
      expect(container.textContent).toContain('11.000.000 đ') // Tiền thực nhận
      expect(container.textContent).toContain('4.000.000 đ')  // Còn phải trả
      expect(container.textContent).toContain('75%')          // Tỷ lệ hoàn thành
      expect(container.textContent).toContain('5')           // Đang xử lý
      expect(container.textContent).toContain('3')           // Chờ xác nhận
    })

    // Quick action lists
    expect(container.textContent).toContain('Vòi lavabo rò nước')
    expect(container.textContent).toContain('Sửa ổ cắm điện')
    expect(container.textContent).toContain('Chi phí linh kiện chưa hợp lý')

    // Building dropdown
    expect(container.querySelector('select')).not.toBeNull()
    expect(container.textContent).toContain('Tòa Sky')

    // Date range pills
    expect(container.textContent).toContain('30 ngày')
    expect(container.textContent).toContain('60 ngày')
    expect(container.textContent).toContain('90 ngày')
    expect(container.textContent).toContain('Tất cả')
  })

  it('handles completion rate with zero denominator without crashing', async () => {
    const zeroKpiData = {
      ...mockData,
      kpi: {
        dangXuLy: 0,
        choXacNhan: 0,
        tyLeHoanThanh: {
          tyLe: null,
          daHoanThanh: 0,
          tongDuocGiao: 0,
          moTa: 'Chưa có việc phân công trong kỳ',
          coDuLieu: false,
        },
        giaTriDaChot: 0,
        daNhan: 0,
        conPhaiTra: 0,
      },
      viecCanXuLy: [],
      baoGiaCanBoSung: [],
    }

    vi.stubGlobal('fetch', vi.fn(async () => {
      return new Response(JSON.stringify(zeroKpiData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }))

    root = createRoot(container)
    await act(async () => {
      root.render(<ThoTongQuan token="worker-token" />)
    })

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Chưa có')
      expect(container.textContent).toContain('Chưa có việc phân công trong kỳ')
      expect(container.textContent).toContain('0 đ')
    })
  })

  it('shows error state when API request fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      return new Response(JSON.stringify({ message: 'Lỗi máy chủ nội bộ' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }))

    root = createRoot(container)
    await act(async () => {
      root.render(<ThoTongQuan token="worker-token" />)
    })

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Không thể tải bảng tổng quan')
    })
  })
})
