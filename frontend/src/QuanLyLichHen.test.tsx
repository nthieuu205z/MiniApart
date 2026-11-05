// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import QuanLyLichHen from './QuanLyLichHen'
import type { LichHenXemPhong, ThongTinToaNha } from './api'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

const MOCK_LICH_HEN: LichHenXemPhong[] = [
  {
    id: 12,
    hoTen: 'Trần Minh Quang',
    soDienThoai: '0987654321',
    email: 'quangtm@gmail.com',
    phongId: 101,
    soPhong: 'P.101',
    toaNhaId: 1,
    tenToaNha: 'Toà A - Ngõ Hoà Bình',
    thoiGianHen: '2026-11-06T14:30:00',
    ghiChu: 'Khách muốn xem trước 15h',
    trangThai: 'CHO_XAC_NHAN',
    taoLuc: '2026-11-04T10:00:00',
  },
]

const MOCK_TOA_NHA: ThongTinToaNha[] = [
  {
    id: 1,
    maToa: 'TOA_A',
    ten: 'Toà A - Ngõ Hoà Bình',
    diaChi: 'Số 10, Ngõ Hoà Bình',
    soTang: 5,
    ngayChotSo: 28,
    soNgayHanTt: 5,
    maNganHang: 'VCB',
    tkNganHang: '0011002233',
    nguongThatThoat: '0.05',
    batBuocAnhCongTo: true,
  },
]

describe('QuanLyLichHen', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)

    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/api/lich-hen') && init?.method === 'PATCH') {
        return Promise.resolve(new Response(JSON.stringify({ thanhCong: true }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      }
      if (url.includes('/api/lich-hen')) {
        return Promise.resolve(new Response(JSON.stringify(MOCK_LICH_HEN), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      }
      if (url.includes('/api/toa-nha')) {
        return Promise.resolve(new Response(JSON.stringify(MOCK_TOA_NHA), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`))
    }))
  })

  afterEach(async () => {
    await act(async () => {
      root.unmount()
    })
    container.remove()
    vi.restoreAllMocks()
  })

  it('renders appointments with prospective tenant info', async () => {
    await act(async () => {
      root.render(<QuanLyLichHen token="test-token" />)
    })

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Trần Minh Quang')
      expect(container.textContent).toContain('0987654321')
      expect(container.textContent).toContain('Phòng P.101')
      expect(container.textContent).toContain('CHỜ XÁC NHẬN')
    })
  })

  it('allows manager to confirm an appointment', async () => {
    await act(async () => {
      root.render(<QuanLyLichHen token="test-token" />)
    })

    const btnXacNhan = await vi.waitFor(() => {
      const btns = Array.from(container.querySelectorAll('button'))
      const match = btns.find((b) => b.textContent?.includes('Đã gọi xác nhận'))
      expect(match).toBeDefined()
      return match!
    })

    await act(async () => {
      btnXacNhan.click()
    })

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Đã cập nhật trạng thái')
    })
  })
})

