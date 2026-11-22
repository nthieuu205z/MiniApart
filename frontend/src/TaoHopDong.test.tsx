// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TaoHopDong from './TaoHopDong'
import { ToaDangChonProvider } from './toaDangChon'

declare global { var IS_REACT_ACT_ENVIRONMENT: boolean | undefined }

const TOA = { id: 3, maToa: 'T3', ten: 'An Nhiên Residence', diaChi: 'x', soTang: 2, ngayChotSo: 28, soNgayHanTt: 7, maNganHang: '', tkNganHang: '', nguongThatThoat: '1', batBuocAnhCongTo: false }
const phong = (id: number, soPhong: string, gia: string) => ({ id, toaNhaId: 3, soPhong, tang: 4, dienTich: '20', sucChua: 2, giaThueMacDinh: gia, loaiPhong: 'x', trangThai: 'TRONG', tenTrangThai: 'Trống' })
const PHONG = [phong(401, '401', '3600000'), phong(402, '402', '4000000')]
const NGUOI = [{ id: 7, hoTen: 'Lê Thu Trang', soDienThoai: '0900000007' }]
const DICH_VU = [
  { id: 1, toaNhaId: 3, ten: 'Điện', cachTinh: 'x', cheDoGia: 'x', donVi: 'kWh', laDien: true, dangSuDung: true },
  { id: 2, toaNhaId: 3, ten: 'Nước', cachTinh: 'x', cheDoGia: 'x', donVi: 'm3', laDien: false, dangSuDung: true },
]
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } })

describe('TaoHopDong 5 bước', () => {
  let container: HTMLDivElement
  let root: Root
  let fetchMock: ReturnType<typeof vi.fn>
  const dieuHuong = vi.fn((href: string) => { window.history.pushState({}, '', href); window.dispatchEvent(new PopStateEvent('popstate')) })

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    localStorage.clear()
    dieuHuong.mockClear()
    fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'POST') return json({ id: 99 })
      if (url === '/api/toa-nha') return json([TOA])
      if (url === '/api/toa-nha/3/phong') return json(PHONG)
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

  async function mount(url: string) {
    window.history.replaceState({}, '', url)
    await act(async () => {
      root.render(
        <ToaDangChonProvider token="t" vaiTro="CHU" search={window.location.search}>
          <TaoHopDong token="t" vaiTro="CHU" mobile={false} thamSo={{}} dieuHuong={dieuHuong} />
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
  const nhap = (nhan: string) => [...container.querySelectorAll('label.field')].find((l) => l.querySelector('.label')?.textContent === nhan)!.querySelector('input, select')!
  const tiep = () => act(async () => { chinh()[0].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })) })

  it('thiếu trường bắt buộc: Tiếp bị chặn, lỗi hiện ở ô; mỗi bước đúng 1 nút chính', async () => {
    await mount('/hop-dong/moi?toaNhaId=3')
    expect(container.querySelector('h1')?.textContent).toBe('Tạo hợp đồng')
    expect(chinh()).toHaveLength(1)
    expect(chinh()[0].textContent).toBe('Tiếp: Thời hạn & giá')
    await tiep()
    expect(container.textContent).toContain('Chọn phòng cần thuê.')
    expect(container.textContent).toContain('Chọn người thuê đứng tên hợp đồng.')
    expect(window.location.search).not.toContain('buoc=2')
  })

  it('đi đủ 5 bước, POST đúng URL + body như form cũ; quay lại giữ dữ liệu; xong mở hồ sơ hợp đồng', async () => {
    await mount('/hop-dong/moi?toaNhaId=3')
    await go(nhap('Phòng cần thuê'), '401')
    await go(nhap('Người thuê đứng tên hợp đồng'), '7')
    await tiep()
    expect(window.location.search).toContain('buoc=2')
    expect(chinh()).toHaveLength(1)
    expect((nhap('Giá thuê mỗi tháng (đồng)') as HTMLInputElement).value).toBe('3600000') // giá mặc định theo phòng
    await go(nhap('Ngày bắt đầu'), '2026-12-01')
    await go(nhap('Ngày kết thúc hợp đồng'), '2027-12-01')
    await tiep()
    expect(chinh()).toHaveLength(1)
    await act(async () => { nut('Chọn tất cả').click() })
    await go(container.querySelector('input[aria-label="Giá riêng của Nước"]')!, '25000')
    await tiep()
    await go(nhap('Tiền cọc cam kết (đồng)'), '7200000')
    await tiep()
    expect(chinh()[0].textContent).toBe('Tạo hợp đồng')
    expect(container.textContent).toContain('Lê Thu Trang')
    // Quay lại bước 1 vẫn giữ dữ liệu
    for (let i = 0; i < 4; i++) await act(async () => { nut('Quay lại').click() })
    expect(container.querySelector('#w-buoc')?.textContent).toBe('Phòng & người thuê')
    expect((nhap('Phòng cần thuê') as HTMLSelectElement).value).toBe('401')
    expect((nhap('Người thuê đứng tên hợp đồng') as HTMLSelectElement).value).toBe('7')
    expect(fetchMock.mock.calls.some((c) => c[1]?.method === 'POST')).toBe(false)
    for (let i = 0; i < 4; i++) await tiep()
    expect(chinh()[0].textContent).toBe('Tạo hợp đồng')
    await tiep()
    await vi.waitFor(() => expect(dieuHuong).toHaveBeenLastCalledWith('/hop-dong/99'))
    const post = fetchMock.mock.calls.find((c) => c[1]?.method === 'POST')!
    expect(post[0]).toBe('/api/hop-dong')
    expect(JSON.parse(post[1].body)).toEqual({
      phongId: 401, nguoiThueId: 7, ngayBatDau: '2026-12-01', ngayKetThuc: '2027-12-01', giaThue: '3600000', tienCoc: '7200000', soNgayBaoTruoc: 30,
      dichVuApDung: [{ dichVuId: 1, donGiaApDung: null }, { dichVuId: 2, donGiaApDung: '25000' }],
    })
  })

  it('?phongId= điền sẵn phòng ở bước 1', async () => {
    await mount('/hop-dong/moi?phongId=402&toaNhaId=3')
    expect((nhap('Phòng cần thuê') as HTMLSelectElement).value).toBe('402')
    expect(container.textContent).toContain('402 · Tầng 4')
  })

  it('?buoc=4 khi bước trước chưa hợp lệ bị kéo về bước đầu thiếu dữ liệu', async () => {
    await mount('/hop-dong/moi?toaNhaId=3&buoc=4')
    expect(container.querySelector('#w-buoc')?.textContent).toBe('Phòng & người thuê')
    expect(container.querySelectorAll('a.vstep')).toHaveLength(0) // bước chưa tới không bấm được
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
