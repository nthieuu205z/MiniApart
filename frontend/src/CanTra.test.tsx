// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CanTra from './CanTra'
import type { ThongTinHoaDonChiTiet, ThongTinHoaDonLichSu } from './api'

declare global { var IS_REACT_ACT_ENVIRONMENT: boolean | undefined }

const kyLs = (id: number, thang: number, conLai: string): ThongTinHoaDonLichSu => ({
  hoaDonId: id, maHoaDon: `DEMO-${thang}`, toaNhaId: 3, kyId: id, hopDongId: 1, nam: 2026, thang, ngayBatDau: null, ngayKetThuc: null,
  soPhong: '101', maToa: 'AN', tenToaNha: 'An Nhiên Residence', ngayPhatHanh: `2026-${thang}-25`, hanThanhToan: `2026-${String(thang).padStart(2, '0')}-05`,
  trangThai: 'QUA_HAN', trangThaiThanhToan: Number(conLai) > 0 ? 'QUA_HAN' : 'DA_THANH_TOAN', hopDongTrangThai: 'HIEU_LUC', tongTien: '3790000.00', daThu: '1895000.00', conLai,
})
const hoaDon = { hoaDonId: 10, maHoaDon: 'DEMO-10', soPhong: '101', nguoiThue: 'Huy', ngayPhatHanh: '2026-10-25', hanThanhToan: '2026-10-05', tongTien: '3790000.00', daThu: '1895000.00', conLai: '1895000.00', cacDong: [{ tenKhoan: 'Tiền phòng', soLuong: '29.00', donGia: '3200000.00', thanhTien: '3200000.00', loaiKhoan: 'DICH_VU', dienGiai: '', cacBac: [] }] } as unknown as ThongTinHoaDonChiTiet
const bonKy = [kyLs(31, 10, '1895000.00'), kyLs(21, 9, '1895000.00'), kyLs(11, 8, '1895000.00'), kyLs(1, 7, '1895000.00')]

let container: HTMLDivElement
let root: Root
const ve = async (lichSu: ThongTinHoaDonLichSu[], tra: string | null) => {
  root = createRoot(container)
  await act(async () => root.render(<CanTra hoaDon={hoaDon} lichSu={lichSu} tra={tra} />))
}

describe('CanTra (khách thuê)', () => {
  beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.appendChild(container) })
  afterEach(async () => { await act(async () => root?.unmount()); container.remove(); vi.restoreAllMocks() })

  it('tổng = Σ conLai bốn kỳ (7.580.000), 4 kỳ quá hạn, nút chính đúng nhãn và href', async () => {
    await ve(bonKy, null)
    expect(container.querySelector('[data-can-tra-tong]')?.textContent).toBe('7.580.000 ₫')
    expect(container.textContent).toContain('4 kỳ quá hạn')
    const chinh = container.querySelector('[data-tra-tat-ca]')!
    expect(chinh.textContent).toBe('Trả 7.580.000 ₫')
    expect(chinh.getAttribute('href')).toBe('/hoa-don-cua-toi?tra=tat-ca')
    expect(container.querySelector('[data-tra-mot-ky]')?.getAttribute('href')).toBe('/hoa-don-cua-toi?tra=31')
    expect(container.querySelectorAll('[data-ky-hoa-don]')).toHaveLength(4)
    expect(container.querySelector('[data-ky-hoa-don="9"], [data-ky-hoa-don="21"]')?.getAttribute('href')).toBe('/hoa-don-cua-toi?hoaDonId=21')
  })

  it('không nợ → không có nút Trả', async () => {
    await ve(bonKy.map((h) => ({ ...h, conLai: '0.00', trangThaiThanhToan: 'DA_THANH_TOAN' })), null)
    expect(container.textContent).toContain('Không còn khoản nào cần trả')
    expect(container.querySelector('[data-tra-tat-ca]')).toBeNull()
  })

  it('trả tất cả: nội dung chuyển khoản là các mã hoá đơn, chép được, không có nút "Tôi đã chuyển khoản" hay số tài khoản giả', async () => {
    const ghi = vi.fn(async () => undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText: ghi } })
    await ve(bonKy, 'tat-ca')
    expect(container.querySelector('[data-so-tien], [data-tra-so-tien]')?.textContent).toBe('7.580.000 ₫')
    expect(container.querySelector('[data-noi-dung-ck]')?.textContent).toBe('DEMO-10 DEMO-9 DEMO-8 DEMO-7')
    expect(container.textContent).toContain('4 kỳ 07–10/2026')
    expect(container.textContent).not.toContain('Tôi đã chuyển khoản')
    expect(container.textContent).not.toMatch(/0{9,}/)
    expect(container.textContent).toContain('Mã QR chưa có')
    await act(async () => (container.querySelector('[data-chep-noi-dung]') as HTMLButtonElement).click())
    expect(ghi).toHaveBeenCalledWith('DEMO-10 DEMO-9 DEMO-8 DEMO-7')
    expect(container.querySelector('[data-da-chep]')?.textContent).toContain('Đã chép')
  })

  it('trả một kỳ: số tiền và nội dung chỉ của kỳ đó', async () => {
    await ve(bonKy, '31')
    expect(container.textContent).toContain('Kỳ 10/2026')
    expect(container.querySelector('[data-noi-dung-ck]')?.textContent).toBe('DEMO-10')
  })
})
