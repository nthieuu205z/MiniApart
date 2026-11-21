// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ThuTien from './ThuTien'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
const hoaDon = (o: Record<string, unknown>) => ({ hopDongId: 1, nguoiThue: 'Người thuê', hanThanhToan: '2026-09-07', tongTien: '3000000.00', daThu: '0.00', conLai: '3000000.00', kyId: 8, ...o })

describe('ThuTien', () => {
  let root: Root
  let container: HTMLDivElement
  const calls: { url: string; method?: string }[] = []

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    calls.length = 0
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      calls.push({ url, method: init?.method })
      if (url === '/api/toa-nha') return json([{ id: 3, ten: 'An Nhiên' }])
      if (url.startsWith('/api/hoa-don?')) {
        return json([
          hoaDon({ hoaDonId: 10, maHoaDon: 'HD-10', soPhong: '101', nguoiThue: 'Trần Quang Huy', trangThai: 'QUA_HAN' }),
          hoaDon({ hoaDonId: 12, maHoaDon: 'HD-12', soPhong: '103', trangThai: 'DA_THANH_TOAN', conLai: '0.00' }),
        ])
      }
      if (url === '/api/hop-dong?toaNhaId=3') return json([{ id: 5, soPhong: '101', hoTenNguoiThue: 'Trần Quang Huy', tenTrangThai: 'Hiệu lực', trangThai: 'HIEU_LUC', phongId: 1 }])
      if (url === '/api/toa-nha/3/ky-thanh-toan') return json([])
      if (url === '/api/hoa-don/10/thanh-toan') return json({ hoaDonId: 10, hopDongId: 1, toaNhaId: 3, kyId: 8, giaoDich: [{ id: 41, maBienLai: 'BL-41', soTien: '200000.00', loai: 'THANH_TOAN', hinhThuc: 'TIEN_MAT', ngayThu: '2026-11-04', lyDo: null, dieuChinhChoId: null }] })
      if (url === '/api/hop-dong/5/giao-dich-coc') return json({ hopDongId: 5, tienCocThoaThuan: '6000000.00', tongDaThu: '2000000.00', conLaiChuaThu: '4000000.00', giaoDich: [] })
      throw new Error(`Unexpected fetch: ${url}`)
    }))
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
  })

  const bam = async (nhan: string) => { await act(async () => { (container.querySelector(`button[aria-label="${nhan}"]`) as HTMLButtonElement).click() }) }

  async function mount() {
    await act(async () => { root = createRoot(container); root.render(<ThuTien token="t" />) })
    await vi.waitFor(() => expect(container.querySelectorAll('tbody tr').length).toBeGreaterThan(0))
  }

  it('liệt kê hoá đơn của toà đầu tiên và chỉ đọc (không POST) khi mở màn', async () => {
    await mount()
    expect(container.querySelector('[data-testid="collection-screen"]')).not.toBeNull()
    expect(container.querySelector('tbody')?.textContent).toContain('HD-10')
    // chip mặc định "Còn nợ": hoá đơn đã thanh toán (HD-12) chưa hiện
    expect(container.querySelector('tbody')?.textContent).not.toContain('HD-12')
    expect(calls.every((c) => !c.method || c.method === 'GET')).toBe(true)
  })

  it('chọn hoá đơn hiện số còn phải thu, sổ giao dịch và nút ghi nhận thu tiền', async () => {
    await mount()
    await bam('Thu tiền hoá đơn HD-10')
    await vi.waitFor(() => expect(container.textContent).toContain('BL-41'))
    expect(container.textContent).toContain('Còn phải thu')
    expect(container.textContent).toContain('3.000.000')
    expect(Array.from(container.querySelectorAll('button')).some((b) => b.textContent?.includes('Ghi nhận thu tiền'))).toBe(true)
    expect((container.querySelector('input[aria-label="Số tiền thu"]') as HTMLInputElement).value).toBe('3000000.00')
  })

  it('tab Tiền cọc: chọn hợp đồng hiện số cọc đã thu / còn thiếu', async () => {
    await mount()
    await act(async () => { (Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Tiền cọc và trả phòng') as HTMLButtonElement).click() })
    await bam('Thu cọc hợp đồng 5')
    await vi.waitFor(() => expect(container.textContent).toContain('Tiền cọc hợp đồng #5'))
    expect(container.textContent).toContain('2.000.000')
    expect(container.textContent).toContain('4.000.000')
  })
})
