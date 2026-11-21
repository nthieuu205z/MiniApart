// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LichSuHoaDon from './LichSuHoaDon'

const hoaDon = (over: Record<string, unknown>) => ({
  hoaDonId: 1, maHoaDon: 'HD-1', toaNhaId: 3, kyId: 10, hopDongId: 5, nam: 2026, thang: 10,
  ngayBatDau: '2026-09-26', ngayKetThuc: '2026-10-25', soPhong: '101', maToa: 'AN', tenToaNha: 'An Nhiên Residence',
  ngayPhatHanh: '2026-10-01', hanThanhToan: '2026-10-05', trangThai: 'DA_PHAT_HANH', trangThaiThanhToan: 'QUA_HAN',
  hopDongTrangThai: 'HIEU_LUC', tongTien: '3790000', daThu: '1895000', conLai: '1895000', ...over,
})

const DATA = [
  hoaDon({ hoaDonId: 12 }),
  hoaDon({ hoaDonId: 11, kyId: 9, thang: 9, trangThaiThanhToan: 'DA_THANH_TOAN', daThu: '3790000', conLai: '0' }),
  hoaDon({ hoaDonId: 10, kyId: null, nam: null, thang: null, hopDongTrangThai: 'DA_THANH_LY' }),
]

describe('LichSuHoaDon', () => {
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

  async function render(body: unknown, status = 200, mobile = true) {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })))
    root = createRoot(container)
    await act(async () => {
      root.render(<LichSuHoaDon token="tenant-token" mobile={mobile} />)
    })
  }

  it.each([true, false])('liệt kê mọi kỳ với số tiền, trạng thái, nhãn thanh lý (mobile=%s)', async (mobile) => {
    await render(DATA, 200, mobile)
    await vi.waitFor(() => expect(container.querySelectorAll('[data-history-invoice]')).toHaveLength(3))
    const text = container.textContent ?? ''
    expect(text).toContain('Lịch sử hoá đơn')
    expect(text).toContain('Kỳ 10/2026')
    expect(text).toContain('Phòng 101')
    expect(text).toContain('An Nhiên Residence')
    expect(text).toContain('3.790.000')
    expect(text).toContain('Quá hạn')
    expect(text).toContain('Đã thanh toán')
    expect(text).toContain('Quyết toán hợp đồng')
    expect(text).toContain('Đã thanh lý')
  })

  it('bấm một kỳ chuyển sang /hoa-don-cua-toi?hoaDonId=', async () => {
    await render(DATA)
    await vi.waitFor(() => expect(container.querySelectorAll('[data-history-invoice]')).toHaveLength(3))
    const dau = container.querySelector('[data-history-invoice="12"]') as HTMLElement
    const nut = (dau.matches('button') ? dau : dau.querySelector('button')) as HTMLButtonElement
    await act(async () => nut.click())
    expect(window.location.pathname + window.location.search).toBe('/hoa-don-cua-toi?hoaDonId=12')
  })

  it('rỗng: hiện EmptyState, không phải lỗi', async () => {
    await render([])
    await vi.waitFor(() => expect(container.querySelector('[data-history-empty]')).not.toBeNull())
    expect(container.textContent).toContain('Chưa có kỳ hoá đơn nào')
    expect(container.querySelector('[role="alert"]')).toBeNull()
  })

  it('lỗi: hiện thông báo + nút Thử lại', async () => {
    await render({ message: 'Máy chủ bận' }, 500)
    await vi.waitFor(() => expect(container.querySelector('[role="alert"]')).not.toBeNull())
    expect(container.querySelector('[data-retry-invoice-history]')).not.toBeNull()
  })
})
