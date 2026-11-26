// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TaoHopDong, { tinhNgayKetThuc } from './TaoHopDong'
import { ToaDangChonProvider } from './toaDangChon'

declare global { var IS_REACT_ACT_ENVIRONMENT: boolean | undefined }

const TOA = { id: 3, maToa: 'T3', ten: 'An Nhiên Residence', diaChi: 'x', soTang: 2, ngayChotSo: 28, soNgayHanTt: 7, maNganHang: '', tkNganHang: '', nguongThatThoat: '1', batBuocAnhCongTo: false }
const phong = (id: number, soPhong: string, gia: string) => ({ id, toaNhaId: 3, soPhong, tang: 4, dienTich: '20', sucChua: 2, giaThueMacDinh: gia, loaiPhong: 'x', trangThai: 'TRONG', tenTrangThai: 'Trống' })
const PHONG = [phong(401, '401', '3600000'), phong(402, '402', '4000000')]
const NGUOI = [{ id: 7, hoTen: 'Lê Thu Trang', soDienThoai: '0900000007', soGiayTo: '012345678901' }, { id: 8, hoTen: 'Chưa Giấy Tờ', soDienThoai: '0900000008' }]
const DICH_VU = [
  { id: 1, toaNhaId: 3, ten: 'Điện', cachTinh: 'x', cheDoGia: 'x', donVi: 'kWh', laDien: true, dangSuDung: true },
  { id: 2, toaNhaId: 3, ten: 'Nước', cachTinh: 'x', cheDoGia: 'x', donVi: 'm3', laDien: false, dangSuDung: true },
]
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } })

describe('TaoHopDong một trang', () => {
  let container: HTMLDivElement
  let root: Root
  let fetchMock: ReturnType<typeof vi.fn>
  const dieuHuong = vi.fn()

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    localStorage.clear()
    dieuHuong.mockClear()
    fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'POST') return json({ id: 99 })
      if (url === '/api/toa-nha') return json([TOA])
      if (url === '/api/toa-nha/3/phong') return json([...PHONG, { ...phong(403, '403', '1'), trangThai: 'DANG_THUE' }])
      if (url === '/api/nguoi-thue') return json(NGUOI)
      if (url === '/api/toa-nha/3/dich-vu') return json(DICH_VU)
      return json([])
    })
    vi.stubGlobal('fetch', fetchMock)
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.unstubAllGlobals() })

  async function mount(url: string, mobile = false) {
    window.history.replaceState({}, '', url)
    await act(async () => {
      root.render(
        <ToaDangChonProvider token="t" vaiTro="CHU" search={window.location.search}>
          <TaoHopDong token="t" vaiTro="CHU" mobile={mobile} thamSo={{}} dieuHuong={dieuHuong} />
        </ToaDangChonProvider>,
      )
    })
    await vi.waitFor(() => expect(container.querySelector('form')).not.toBeNull())
  }
  const chinh = () => container.querySelectorAll('.btn-primary')
  const nut = (nhan: string) => [...container.querySelectorAll('button')].find((b) => b.textContent === nhan) as HTMLButtonElement
  const go = async (el: Element, v: string) => {
    const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype
    await act(async () => { Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, v); el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true })) })
  }
  const nhap = (nhan: string) => [...container.querySelectorAll('label.field')].find((l) => l.querySelector('.label')?.textContent?.startsWith(nhan))!.querySelector('input, select')!
  const thieu = () => [...container.querySelectorAll('.hd-thieu li')].map((l) => l.textContent)
  const post = () => fetchMock.mock.calls.find((c) => c[1]?.method === 'POST')

  it('thiếu điều kiện: nút chính bị chặn, lý do và cột "Còn thiếu" liệt kê đúng, bấm không gửi gì', async () => {
    await mount('/hop-dong/moi?toaNhaId=3')
    expect(container.querySelector('h1')?.textContent).toBe('Tạo hợp đồng')
    expect(chinh()).toHaveLength(1)
    expect(chinh()[0].getAttribute('aria-disabled')).toBe('true')
    expect(container.querySelector('.ma-dautrang-act')?.textContent).toContain('Huỷ')
    expect(thieu()).toEqual(['Chưa chọn phòng', 'Chưa chọn người thuê', 'Chưa nhập giá thuê', 'Chưa nhập tiền cọc', 'Chưa có số CCCD'])
    expect(container.textContent).toContain('Còn thiếu: chưa chọn phòng, chưa chọn người thuê, chưa nhập giá thuê, chưa nhập tiền cọc, chưa có số cccd.')
    await act(async () => { chinh()[0].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })) })
    expect(post()).toBeUndefined()
  })

  it('chỉ liệt kê phòng trống; chọn phòng điền giá niêm yết và cọc 2 tháng; Tổng thu khi ký = cọc + tháng đầu', async () => {
    await mount('/hop-dong/moi?toaNhaId=3')
    const opts = [...(nhap('Phòng') as HTMLSelectElement).options].map((o) => o.textContent)
    expect(opts).toEqual(['Chọn phòng', '401 · 20 m² · 3.600.000 ₫/tháng', '402 · 20 m² · 4.000.000 ₫/tháng'])
    expect(container.textContent).toContain('Chỉ hiện 2 phòng đang trống.')
    await go(nhap('Phòng'), '401')
    expect((nhap('Giá thuê mỗi tháng') as HTMLInputElement).value).toBe('3600000')
    expect((nhap('Tiền cọc') as HTMLInputElement).value).toBe('7200000')
    expect(container.querySelector('[data-tong-thu]')?.textContent).toBe('10.800.000 ₫')
    await go(nhap('Tiền cọc'), '5000000')
    expect(container.querySelector('[data-tong-thu]')?.textContent).toBe('8.600.000 ₫')
    await go(nhap('Giá thuê mỗi tháng'), '4000000') // đã sửa cọc tay thì cọc không nhảy theo giá
    expect((nhap('Tiền cọc') as HTMLInputElement).value).toBe('5000000')
  })

  it('ngày kết thúc tự tính từ ngày bắt đầu và thời hạn', async () => {
    expect(tinhNgayKetThuc('2026-12-01', 12)).toBe('2027-11-30')
    expect(tinhNgayKetThuc('2026-12-01', 6)).toBe('2027-05-31')
    expect(tinhNgayKetThuc('2026-08-31', 6)).toBe('2027-02-27') // 31 → cuối tháng ngắn
    await mount('/hop-dong/moi?toaNhaId=3')
    await go(nhap('Ngày bắt đầu'), '2026-12-01')
    expect((nhap('Ngày kết thúc') as HTMLInputElement).value).toBe('2027-11-30')
    expect((nhap('Ngày kết thúc') as HTMLInputElement).disabled).toBe(true)
    await go(nhap('Thuê bao lâu'), '24')
    expect((nhap('Ngày kết thúc') as HTMLInputElement).value).toBe('2028-11-30')
  })

  it('đủ điều kiện: nút chính mở, POST đúng URL + payload như form cũ, xong mở hồ sơ hợp đồng', async () => {
    await mount('/hop-dong/moi?toaNhaId=3')
    await go(nhap('Phòng'), '401')
    await go(nhap('Người thuê'), 'Lê Thu Trang · 0900000007')
    expect((nhap('Số CCCD') as HTMLInputElement).value).toBe('012345678901')
    await go(nhap('Ngày bắt đầu'), '2026-12-01')
    await go(nhap('Giá thuê mỗi tháng'), '3600000')
    await go(container.querySelector('input[aria-label="Giá riêng của Nước"]')!, '25000')
    expect(thieu()).toEqual(['Phòng, thời hạn, giá, dịch vụ đã đủ'])
    expect(chinh()[0].getAttribute('aria-disabled')).toBeNull()
    await act(async () => { chinh()[0].click() })
    await vi.waitFor(() => expect(dieuHuong).toHaveBeenLastCalledWith('/hop-dong/99'))
    expect(post()![0]).toBe('/api/hop-dong')
    expect(JSON.parse(post()![1].body)).toEqual({
      phongId: 401, nguoiThueId: 7, ngayBatDau: '2026-12-01', ngayKetThuc: '2027-11-30', giaThue: '3600000', tienCoc: '7200000', soNgayBaoTruoc: 30,
      dichVuApDung: [{ dichVuId: 1, donGiaApDung: null }, { dichVuId: 2, donGiaApDung: '25000' }],
    })
  })

  it('người thuê chưa có giấy tờ: phải gõ CCCD 12 số mới đủ; số người ở vượt sức chứa bị báo', async () => {
    await mount('/hop-dong/moi?phongId=401&toaNhaId=3')
    await go(nhap('Người thuê'), '0900000008')
    expect(thieu()).toContain('Chưa có số CCCD')
    await go(nhap('Số CCCD'), '012345678901')
    expect(thieu()).toEqual(['Phòng, thời hạn, giá, dịch vụ đã đủ'])
    await go(nhap('Số người ở'), '3')
    expect(thieu()).toEqual(['Số người ở chưa đúng'])
    expect(container.textContent).toContain('Phòng này ở tối đa 2 người.')
  })

  it('?phongId= điền sẵn phòng', async () => {
    await mount('/hop-dong/moi?phongId=402&toaNhaId=3')
    expect((nhap('Phòng') as HTMLSelectElement).value).toBe('402')
    expect((nhap('Giá thuê mỗi tháng') as HTMLInputElement).value).toBe('4000000')
  })

  it('< 768: nút chính nằm trong chân dính, vẫn đúng 1 nút chính, "Thu khi ký" đứng trước chân', async () => {
    await mount('/hop-dong/moi?toaNhaId=3', true)
    expect(chinh()).toHaveLength(1)
    expect(chinh()[0].closest('.ma-chandinh')).not.toBeNull()
    expect(container.querySelector('.ma-dautrang-act')).toBeNull()
    const phai = container.querySelector('.hd-moi-phai')!
    expect(phai.children[0].textContent).toContain('Thu khi ký')
    expect(phai.lastElementChild?.className).toBe('ma-chandinh')
  })

  it('Huỷ khi đã nhập hỏi xác nhận, đồng ý thì về /hop-dong', async () => {
    await mount('/hop-dong/moi?phongId=401&toaNhaId=3')
    const hoi = vi.spyOn(window, 'confirm').mockReturnValue(false)
    await act(async () => { nut('Huỷ').click() })
    expect(hoi).toHaveBeenCalled()
    expect(dieuHuong).not.toHaveBeenCalled()
    hoi.mockReturnValue(true)
    await act(async () => { nut('Huỷ').click() })
    expect(dieuHuong).toHaveBeenCalledWith('/hop-dong')
  })
})
