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
  const tab = (nhan: string) => [...container.querySelectorAll('[role="tab"]')].find((b) => b.textContent?.startsWith(nhan)) as HTMLButtonElement | undefined
  const hang = () => [...container.querySelectorAll('[data-contract-row]')].map((e) => e.getAttribute('data-contract-row'))

  it('mở sẵn Cần xử lý, tab kèm số đếm, chỉ gọi hợp đồng (toà do khung chọn)', async () => {
    await mount()
    expect(tab('Cần xử lý')?.getAttribute('aria-selected')).toBe('true')
    expect(tab('Cần xử lý')?.textContent).toBe('Cần xử lý2')
    expect(tab('Đang hiệu lực')?.textContent).toBe('Đang hiệu lực3')
    expect(tab('Đã thanh lý')?.textContent).toBe('Đã thanh lý1')
    expect(container.querySelector('.ma-dautrang-phu')?.textContent).toContain('3 đang hiệu lực')
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(['/api/hop-dong?toaNhaId=1'])
  })

  it('xếp theo số ngày còn lại tăng dần: sắp hết hạn (10 ngày) trước chờ ký (100 ngày)', async () => {
    await mount()
    expect(hang()).toEqual(['3', '4'])
    expect(container.querySelector('[data-contract-row="3"]')?.textContent).toContain('Hết hạn sau 10 ngày')
    expect(container.querySelector('[data-contract-row="4"]')?.textContent).toContain('Chờ ký')
  })

  it('bấm tab đổi nhóm và ghi ?loc= lên URL; ?loc= mở đúng tab', async () => {
    await mount()
    await act(async () => { tab('Đang hiệu lực')!.click() })
    expect(hang()).toEqual(['3', '1', '2'])
    expect(window.location.search).toContain('loc=hieu-luc')
    await act(async () => root.unmount())
    root = createRoot(container)
    await mount('/hop-dong?toaNhaId=1&loc=da-thanh-ly')
    expect(hang()).toEqual(['5'])
  })

  it('?sapHetHan=true mở Cần xử lý, chỉ còn hàng sắp hết hạn và hiện chữ lọc', async () => {
    await mount('/hop-dong?toaNhaId=1&sapHetHan=true&loc=hieu-luc')
    expect(tab('Cần xử lý')?.getAttribute('aria-selected')).toBe('true')
    expect(hang()).toEqual(['3'])
    expect(container.textContent).toContain('Đang lọc hợp đồng sắp hết hạn')
    expect(container.querySelector('tr [class~="btn"]')?.textContent).toContain('Gia hạn')
  })

  it('?hopDongId= vẫn hiện link mở đúng hồ sơ', async () => {
    await mount('/hop-dong?toaNhaId=1&hopDongId=4')
    expect(container.querySelector('a[href="/hop-dong/4"]:not(.td-main):not(.btn)')?.textContent).toContain('#4')
  })

  it('tìm "ngo" ra đúng một hàng trong tab đang mở', async () => {
    await mount()
    const o = container.querySelector('input[type="search"]') as HTMLInputElement
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(o, 'ngo')
      o.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(hang()).toEqual(['3'])
  })

  it('nút theo dòng dẫn tới /hop-dong/{id} (Gia hạn / Ghi nhận đã ký); Tạo hợp đồng là nút chính duy nhất', async () => {
    await mount()
    expect(container.querySelector('[data-contract-row="3"] a.td-main')?.getAttribute('href')).toBe('/hop-dong/3')
    expect(container.querySelector('[data-contract-row="3"] a.btn')?.textContent).toContain('Gia hạn')
    expect(container.querySelector('[data-contract-row="4"] a.btn')?.textContent).toContain('Ghi nhận đã ký')
    expect(container.querySelector('[data-contract-row="4"] a.btn')?.getAttribute('href')).toBe('/hop-dong/4')
    expect(container.querySelector('a.btn-primary')?.getAttribute('href')).toBe('/hop-dong/moi')
    expect(container.querySelectorAll('.btn-primary')).toHaveLength(1)
    expect(container.querySelector('form, [data-testid="contract-dossier-panel"]')).toBeNull()
  })

  it('chọn một hàng hiện thanh "Đã chọn 1 hợp đồng" với In PDF', async () => {
    await mount()
    const o = container.querySelector('input[aria-label="Chọn phòng 303"]') as HTMLInputElement
    await act(async () => { o.click() })
    const bar = container.querySelector('.bulkbar')
    expect(bar?.textContent).toContain('Đã chọn 1 hợp đồng')
    expect(bar?.textContent).toContain('In PDF')
  })
})
