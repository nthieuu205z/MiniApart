// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HopDongQuanLy from './HopDongQuanLy'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

const hd = (id: number, soPhong: string, ten: string, trangThai: string, tenTrangThai: string, sapHetHan = false) => ({
  id, phongId: id, soPhong, nguoiThueId: id, hoTenNguoiThue: ten,
  ngayBatDau: '2026-01-01', ngayKetThuc: '2027-01-01', giaThue: '3000000.00', tienCoc: '6000000.00',
  soNgayBaoTruoc: 30, trangThai, tenTrangThai, sapHetHan, soNgayConLai: sapHetHan ? 10 : 100, dichVuApDung: [], quyetToan: null,
})
const DU_LIEU = [
  hd(1, '101', 'Trần Quang Huy', 'HIEU_LUC', 'Hiệu lực'),
  hd(2, '102', 'Lê Thu Trang', 'HIEU_LUC', 'Hiệu lực'),
  hd(3, '303', 'Ngô Hải Nam', 'HIEU_LUC', 'Hiệu lực', true),
  hd(4, '401', 'Dương Thảo Nguyên', 'CHO_KY', 'Chờ ký'),
  hd(5, '402', 'Đinh Nhật Quang', 'DA_THANH_LY', 'Đã thanh lý'),
]

describe('HopDongQuanLy bảng hợp đồng', () => {
  let container: HTMLDivElement
  let root: Root
  const fetchMock = vi.fn()

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    fetchMock.mockImplementation((url: string) => {
      const body = url.startsWith('/api/toa-nha') ? [{ id: 1, ten: 'An Nhiên', diaChi: 'x' }] : url.startsWith('/api/hop-dong') ? DU_LIEU : []
      return Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    })
    vi.stubGlobal('fetch', fetchMock)
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  async function mount(url = '/hop-dong?toaNhaId=1') {
    window.history.replaceState({}, '', url)
    await act(async () => { root.render(<HopDongQuanLy token="t" />) })
    await vi.waitFor(() => expect(container.querySelector('[data-contract-row]')).not.toBeNull())
  }
  const chip = (nhan: string) => [...container.querySelectorAll('button.chip')].find((b) => b.textContent?.startsWith(nhan)) as HTMLButtonElement | undefined
  const hang = () => [...container.querySelectorAll('[data-contract-row]')].map((e) => e.getAttribute('data-contract-row'))

  it('chip hiện đúng số theo trạng thái và chỉ gọi hợp đồng + toà nhà', async () => {
    await mount()
    expect(chip('Hiệu lực')?.textContent).toBe('Hiệu lực3')
    expect(chip('Sắp hết hạn')?.textContent).toBe('Sắp hết hạn1')
    expect(chip('Chờ ký')?.textContent).toBe('Chờ ký1')
    expect(chip('Đã thanh lý')?.textContent).toBe('Đã thanh lý1')
    expect(chip('Đã cọc')).toBeUndefined()
    expect(container.querySelector('.sub')?.textContent).toContain('3 đang hiệu lực')
    expect(fetchMock.mock.calls.map((c) => c[0]).sort()).toEqual(['/api/hop-dong?toaNhaId=1', '/api/toa-nha'])
  })

  it('?sapHetHan=true chỉ còn hàng sắp hết hạn và hiện chữ lọc', async () => {
    await mount('/hop-dong?toaNhaId=1&sapHetHan=true')
    expect(hang()).toEqual(['3'])
    expect(container.textContent).toContain('Đang lọc hợp đồng sắp hết hạn')
    expect(container.querySelector('tr [class~="btn"]')?.textContent).toBe('Gia hạn')
  })

  it('tìm "dinh" ra đúng một hàng và chip đếm theo kết quả tìm', async () => {
    await mount()
    const o = container.querySelector('input[type="search"]') as HTMLInputElement
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(o, 'dinh')
      o.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(hang()).toEqual(['5'])
    expect(chip('Hiệu lực')?.textContent).toBe('Hiệu lực0')
    expect(chip('Đã thanh lý')?.textContent).toBe('Đã thanh lý1')
  })

  it('chọn một hàng hiện thanh "Đã chọn 1 hợp đồng" với In PDF', async () => {
    await mount()
    const o = container.querySelector('input[aria-label="Chọn phòng 101"]') as HTMLInputElement
    await act(async () => { o.click() })
    const bar = container.querySelector('.bulkbar')
    expect(bar?.textContent).toContain('Đã chọn 1 hợp đồng')
    expect(bar?.textContent).toContain('In PDF')
  })
})
