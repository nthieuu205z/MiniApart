// @vitest-environment jsdom

import { act, type ComponentType } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GiaHanHopDong, KyHopDong, NguoiOCungHopDong, PhuLucHopDong, ThanhLyHopDong, type ThaoTacConProps } from './HopDongThaoTac'

declare global { var IS_REACT_ACT_ENVIRONMENT: boolean | undefined }

const hd = (trangThai: string, sapHetHan = false) => ({
  id: 1, phongId: 101, soPhong: '101', nguoiThueId: 10, hoTenNguoiThue: 'Người thuê 1', ngayBatDau: '2026-01-01', ngayKetThuc: '2026-12-31',
  giaThue: '3500000.00', tienCoc: '3500000.00', soNgayBaoTruoc: 30, trangThai, tenTrangThai: trangThai, sapHetHan, soNgayConLai: 10, dichVuApDung: [], quyetToan: null,
})
const hoSo = { id: 11, hopDongId: 1, revision: 1, trangThaiTaiLieu: 'DA_CHOT', tieuDe: 'HĐ', ngayLap: '2026-01-01', diaDiemLap: 'Hà Nội', mucDichThue: 'Để ở', phamViSuDung: 'x', phuongThucThanhToan: 'CHUYEN_KHOAN', kyThanhToanThang: 1, hanThanhToanNgay: 5 }
const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200, headers: { 'Content-Type': 'application/json' } })

describe('thao tác con của hợp đồng (ngăn hồ sơ 360)', () => {
  let container: HTMLDivElement
  let root: Root
  let goi: Array<{ url: string; method: string; body: unknown }>

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    goi = []
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      goi.push({ url, method: init?.method ?? 'GET', body: init?.body ? JSON.parse(String(init.body)) : undefined })
      if (url.startsWith('/api/hop-dong?')) return json([hd('HIEU_LUC', true)])
      if (/\/api\/hop-dong\/1\/ho-so/.test(url)) return json(hoSo)
      if (url.endsWith('/thanh-ly')) return json({ ...hd('DA_THANH_LY'), quyetToan: { tongHoaDonCuoi: '0', daThuCoc: '0', congNo: '0', khauTru: '0', hoanCoc: '0', hoaDonQuyetToanId: null } })
      return json([])
    }))
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.unstubAllGlobals() })

  async function mount(Con: ComponentType<ThaoTacConProps>) {
    await act(async () => { root.render(<Con token="t" buildingId={3} hopDong={{ id: 1 }} onXong={() => undefined} />) })
    await vi.waitFor(() => expect(container.querySelector('section')).not.toBeNull())
    await act(async () => { await new Promise((r) => setTimeout(r, 30)) })
  }
  const formThanhLy = () => [...container.querySelectorAll('form')].find((f) => f.textContent?.includes('Thanh lý hợp đồng & Quyết toán cọc'))!
  const co = (s: string) => container.textContent?.includes(s) ?? false
  const nhapGiaTri = (el: HTMLInputElement, v: string) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })) }

  it('Gia hạn: chỉ có form gia hạn, gửi POST gia-han đúng body', async () => {
    await mount(GiaHanHopDong)
    expect(co('Gia hạn hợp đồng sắp hết hạn')).toBe(true)
    expect(co('Thanh lý hợp đồng & Quyết toán cọc') || co('Người ở cùng phòng') || co('Hồ sơ hợp đồng thuê')).toBe(false)
    await act(async () => { nhapGiaTri(container.querySelector('input[type="date"]') as HTMLInputElement, '2027-12-31') })
    await act(async () => { (container.querySelector('form button[type="submit"]') as HTMLButtonElement).click() })
    await vi.waitFor(() => expect(goi.find((g) => g.method === 'POST')).toBeTruthy())
    expect(goi.find((g) => g.method === 'POST')).toMatchObject({ url: '/api/hop-dong/1/gia-han', body: { ngayKetThuc: '2027-12-31', giaThue: null } })
  })

  it('Thanh lý: chỉ có form thanh lý, nút khoá tới khi tích xác nhận, gửi POST thanh-ly', async () => {
    await mount(ThanhLyHopDong)
    expect(co('Thanh lý hợp đồng & Quyết toán cọc')).toBe(true)
    expect(co('Gia hạn hợp đồng sắp hết hạn') || co('Người ở cùng phòng') || co('Hồ sơ hợp đồng thuê')).toBe(false)
    const gui = formThanhLy().querySelector('button[type="submit"]') as HTMLButtonElement
    expect(gui.disabled || gui.getAttribute('aria-disabled') === 'true').toBe(true)
    expect(gui.classList.contains('btn-primary')).toBe(false) // việc phá huỷ là nút danger, không phải nút chính
    expect(gui.classList.contains('btn-danger')).toBe(true)
    await act(async () => { (formThanhLy().querySelector('input[type="checkbox"]') as HTMLInputElement).click() })
    await act(async () => { (formThanhLy().querySelector('button[type="submit"]') as HTMLButtonElement).click() })
    await vi.waitFor(() => expect(goi.find((g) => g.method === 'POST')).toBeTruthy())
    expect(goi.find((g) => g.method === 'POST')).toMatchObject({ url: '/api/hop-dong/1/thanh-ly', body: { khauTruHuHong: '0', xacNhanChenhLech: false, chiSoCuoi: [] } })
  })

  it('giữ nguyên 5 export mà hồ sơ 360 (y2) dùng', () => {
    for (const C of [GiaHanHopDong, KyHopDong, ThanhLyHopDong, PhuLucHopDong, NguoiOCungHopDong]) expect(typeof C).toBe('function')
  })

  it('Ký: chỉ có khối ghi nhận ký, không có phụ lục / thanh lý / người ở cùng', async () => {
    await mount(KyHopDong)
    expect(co('Ghi nhận ký kết hợp đồng giấy')).toBe(true)
    expect(co('Phụ lục hợp đồng đã lập') || co('Thanh lý hợp đồng & Quyết toán cọc') || co('Người ở cùng phòng')).toBe(false)
  })

  it('Phụ lục: chỉ có khối phụ lục, không có khối ký', async () => {
    await mount(PhuLucHopDong)
    expect(co('Phụ lục hợp đồng đã lập')).toBe(true)
    expect(co('Ghi nhận ký kết hợp đồng giấy') || co('Thanh lý hợp đồng & Quyết toán cọc') || co('Người ở cùng phòng')).toBe(false)
  })

  it('Người ở cùng: chỉ có danh sách người ở cùng', async () => {
    await mount(NguoiOCungHopDong)
    expect(co('Người ở cùng phòng')).toBe(true)
    expect(co('Gia hạn hợp đồng sắp hết hạn') || co('Thanh lý hợp đồng & Quyết toán cọc') || co('Hồ sơ hợp đồng thuê')).toBe(false)
  })
})
