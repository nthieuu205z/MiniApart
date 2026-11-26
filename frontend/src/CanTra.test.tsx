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
const ve = async (lichSu: ThongTinHoaDonLichSu[], tra: string | null, mobile = false) => {
  root = createRoot(container)
  await act(async () => root.render(<CanTra mobile={mobile} hoaDon={hoaDon} lichSu={lichSu} tra={tra} />))
}

describe('CanTra (khách thuê)', () => {
  beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.appendChild(container) })
  afterEach(async () => { await act(async () => root?.unmount()); container.remove(); vi.restoreAllMocks() })

  it('tổng = Σ conLai bốn tháng (7.580.000), 4 tháng chưa trả đủ, nút chính đúng nhãn và href', async () => {
    await ve(bonKy, null)
    expect(container.querySelector('[data-can-tra-tong]')?.textContent).toBe('7.580.000 ₫')
    expect(container.textContent).toContain('4 tháng chưa trả đủ. Tháng cũ nhất quá hạn từ 05/07/2026.')
    const chinh = container.querySelector('[data-tra-tat-ca]')!
    expect(chinh.textContent).toBe('Trả 7.580.000 ₫')
    expect(chinh.getAttribute('href')).toBe('/hoa-don-cua-toi?tra=tat-ca')
    expect(container.querySelector('[data-tra-mot-ky]')?.getAttribute('href')).toBe('/hoa-don-cua-toi?tra=1')
    expect(container.querySelector('[data-tra-mot-ky]')?.textContent).toBe('Chỉ trả tháng 7 trước · 1.895.000 ₫')
    expect(container.querySelectorAll('[data-ky-hoa-don]')).toHaveLength(4)
    expect(container.querySelector('[data-ky-hoa-don="9"], [data-ky-hoa-don="21"]')?.getAttribute('href')).toBe('/hoa-don-cua-toi?hoaDonId=21')
  })

  it('máy tính: một h1, hiện cả nợ cũ, một nút chính, không chuỗi IN_HOA_GẠCH_DƯỚI; điện thoại: h1 do thanh trên của khung', async () => {
    await ve(bonKy, null)
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(container.querySelector('.can-tra-rong')).not.toBeNull()
    expect(container.querySelectorAll('[data-ky-hoa-don]')).toHaveLength(4)
    expect(container.querySelectorAll('.btn-primary')).toHaveLength(1)
    expect(container.textContent).not.toMatch(/[A-Z]{2,}(_[A-Z0-9]+)+/)
    await act(async () => root.unmount())
    await ve(bonKy, null, true)
    expect(container.querySelectorAll('h1')).toHaveLength(0)
    expect(container.querySelector('.can-tra-rong')).toBeNull()
  })

  it('không nợ → không có nút Trả', async () => {
    await ve(bonKy.map((h) => ({ ...h, conLai: '0.00', trangThaiThanhToan: 'DA_THANH_TOAN' })), null)
    expect(container.textContent).toContain('Bạn đã trả đủ mọi hoá đơn.')
    expect(container.querySelector('[data-tra-tat-ca]')).toBeNull()
    expect(container.querySelectorAll('.btn-primary')).toHaveLength(0)
    expect(container.querySelector('[data-xem-lich-su]')?.getAttribute('href')).toBe('/lich-su')
  })

  it('trả tất cả: nội dung chuyển khoản là các mã hoá đơn, chép được, không có nút "Tôi đã chuyển khoản" hay số tài khoản giả', async () => {
    const ghi = vi.fn(async () => undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText: ghi } })
    await ve(bonKy, 'tat-ca')
    expect(container.querySelector('[data-so-tien], [data-tra-so-tien]')?.textContent).toBe('7.580.000 ₫')
    expect(container.querySelector('[data-noi-dung-ck]')?.textContent).toBe('DEMO-10 DEMO-9 DEMO-8 DEMO-7')
    expect(container.textContent).toContain('4 tháng, từ 7/2026 đến 10/2026')
    expect(container.textContent).not.toContain('Tôi đã chuyển khoản')
    expect(container.textContent).not.toMatch(/0{9,}/)
    // Người thuê bị 403 ở /ben-a: không QR, không số tài khoản, không dòng "Mã QR chưa có"; có nhãn cần backend + nút Chép, không nút chính.
    expect(container.querySelector('[data-qr-chua-co], [data-so-tai-khoan], img, svg')).toBeNull()
    expect(container.textContent).not.toContain('Mã QR chưa có')
    expect(container.querySelector('.ma-nhanmh')?.textContent).toBe('cần backend')
    expect(container.querySelector('[data-chep-noi-dung]')?.textContent).toBe('Chép')
    expect(container.querySelectorAll('.btn-primary')).toHaveLength(0)
    await act(async () => (container.querySelector('[data-chep-noi-dung]') as HTMLButtonElement).click())
    expect(ghi).toHaveBeenCalledWith('DEMO-10 DEMO-9 DEMO-8 DEMO-7')
    expect(container.querySelector('[data-da-chep]')?.textContent).toContain('Đã chép')
  })

  it('trả một kỳ: số tiền và nội dung chỉ của kỳ đó', async () => {
    await ve(bonKy, '31')
    expect(container.textContent).toContain('Tháng 10/2026')
    expect(container.querySelector('[data-noi-dung-ck]')?.textContent).toBe('DEMO-10')
    expect(container.textContent).not.toMatch(/\b[Kk]ỳ\b/)
  })
})
