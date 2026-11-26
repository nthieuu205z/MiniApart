// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HoSoToa360 from './HoSoToa360'

declare global { var IS_REACT_ACT_ENVIRONMENT: boolean | undefined }

const TOA = { id: 3, maToa: 'T3', ten: 'An Nhiên Residence', diaChi: '12 Lê Lợi', soTang: 2, ngayChotSo: 28, soNgayHanTt: 7, maNganHang: '970405', tkNganHang: '0123456789', nguongThatThoat: '1.25', batBuocAnhCongTo: false }
const phong = (id: number, soPhong: string, tang: number, trangThai: string, tenTrangThai: string) => ({ id, toaNhaId: 3, soPhong, tang, dienTich: '20', sucChua: 2, giaThueMacDinh: '3000000', loaiPhong: 'x', trangThai, tenTrangThai })
const PHONG = [
  phong(1, '101', 1, 'DANG_THUE', 'Đang thuê'), phong(2, '102', 1, 'TRONG', 'Trống'), phong(3, '201', 2, 'DANG_SUA', 'Đang sửa'),
  phong(4, '202', 2, 'DANG_THUE', 'Đang thuê'), phong(5, '203', 2, 'DANG_THUE', 'Đang thuê'),
]
const hd = (id: number, phongId: number, nguoi: number, ten: string, trangThai: string, sapHetHan = false) => ({
  id, phongId, soPhong: `P${phongId}`, nguoiThueId: nguoi, hoTenNguoiThue: ten, ngayBatDau: '2026-01-01', ngayKetThuc: '2027-01-01',
  giaThue: '1', tienCoc: '1', soNgayBaoTruoc: 30, trangThai, tenTrangThai: trangThai, sapHetHan, soNgayConLai: 10, dichVuApDung: [], quyetToan: null,
})
const HOP_DONG = [hd(1, 1, 11, 'Ngô Hải Nam', 'HIEU_LUC'), hd(2, 4, 12, 'Lê Thu Trang', 'HIEU_LUC', true), hd(3, 5, 13, 'Dương Thảo Nguyên', 'CHO_KY')]
const khoan = (hopDongId: number, conLai: string) => ({ hoaDonId: hopDongId * 10, maHoaDon: `H${hopDongId}`, hopDongId, conLai, hanThanhToan: '2026-01-05' })
// Cố ý thứ tự không theo nợ: màn phải tự xếp giảm dần.
const CONG_NO = { toaNhaId: 3, tinhLuc: 'x', congNo: [khoan(1, '100000.00'), khoan(2, '900000.00'), khoan(3, '500000.00')] }
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } })

describe('HoSoToa360', () => {
  let container: HTMLDivElement
  let root: Root
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'PUT') return json({ ...TOA, maNganHang: '970436' })
      if (url === '/api/toa-nha') return json([TOA])
      if (url === '/api/toa-nha/3/phong') return json(PHONG)
      if (url.startsWith('/api/hop-dong')) return json(HOP_DONG)
      if (url.startsWith('/api/bao-cao/cong-no')) return json(CONG_NO)
      return json([])
    })
    vi.stubGlobal('fetch', fetchMock)
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.unstubAllGlobals() })

  async function mount(vaiTro: string, id = '3') {
    await act(async () => { root.render(<HoSoToa360 token="t" vaiTro={vaiTro as 'CHU'} mobile={false} thamSo={{ id }} dieuHuong={vi.fn()} />) })
    await vi.waitFor(() => expect(container.querySelector('[aria-busy="true"]')).toBeNull())
  }

  it('sơ đồ đủ số phòng; ô là liên kết có aria-label số phòng + trạng thái', async () => {
    await mount('CHU')
    const o = [...container.querySelectorAll('.rooms a.room')]
    expect(o).toHaveLength(PHONG.length)
    // V3: tầng cao ở trên; ô nợ ghi "nợ …" trong aria-label (đổi vì sơ đồ giờ hiện nợ theo phòng)
    expect(o.map((a) => a.getAttribute('aria-label'))).toEqual(['Phòng 201, Đang sửa', 'Phòng 202, Đang thuê, nợ 900.000 ₫', 'Phòng 203, Đang thuê, nợ 500.000 ₫', 'Phòng 101, Đang thuê, nợ 100.000 ₫', 'Phòng 102, Trống'])
    expect(o[3].getAttribute('href')).toBe('/phong/1?toaNhaId=3')
    expect(o[4].textContent).toContain('Trống')
    expect(o[3].className).toContain('no')
    expect(o[3].textContent).toContain('nợ 0,1 triệu')
    expect(container.textContent).toContain('Tầng 2')
  })

  it('"Cần chú ý" xếp người nợ giảm dần, tối đa 3, kèm hợp đồng chờ ký/sắp hết; một nút chính (Thu nợ)', async () => {
    await mount('CHU')
    const hang = [...container.querySelectorAll('a.irow')].map((a) => a.getAttribute('href'))
    expect(hang).toEqual(['/nguoi-thue/12', '/nguoi-thue/13', '/nguoi-thue/11', '/hop-dong/3', '/hop-dong/1', '/hop-dong/2']) // chờ ký lên trước; mock đặt mọi hợp đồng còn 10 ngày nên hợp đồng 1 cũng ≤ 30 ngày (brief V3 đổi tiêu chí từ sapHetHan sang ≤ 30 ngày)
    expect(container.querySelector('.ma-khoiso')?.textContent).toContain('1.500.000')
    expect(container.querySelectorAll('.btn-primary')).toHaveLength(1)
    expect(container.querySelector('.btn-primary')?.getAttribute('href')).toBe('/thu-tien?toaNhaId=3')
    await act(async () => root.unmount()); root = createRoot(container)
    await mount('QUAN_LY')
    expect(container.querySelectorAll('.btn-primary')).toHaveLength(1) // Khai báo phòng không còn là nút chính
    expect([...container.querySelectorAll('a.btn-secondary')].find((a) => a.textContent === 'Khai báo phòng')?.getAttribute('href')).toBe('/phong?toaNhaId=3&moi=1')
    expect(container.querySelector('h1')?.textContent).toBe('Phòng')
    expect(container.querySelector('.ma-vet')).toBeNull()
  })

  describe('Việc kế tiếp', () => {
    const KHAN = { id: 9, maYeuCau: 'SC-9', phongId: 1, soPhong: '302', hangMuc: 'Điện', mucDo: 'KHAN_CAP', tenMucDo: 'Khẩn cấp', trangThai: 'MOI_TIEP_NHAN', tenTrangThai: 'Mới', nguoiXuLyId: null, taoLuc: '2026-11-20T10:00:00Z' }
    const dat = (o: { suCo?: unknown[]; congNo?: unknown; hopDong?: unknown[]; ky?: unknown[]; hoaDon?: unknown[] }) => fetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/toa-nha') return json([TOA])
      if (url === '/api/toa-nha/3/phong') return json(PHONG)
      if (url.startsWith('/api/hop-dong')) return json(o.hopDong ?? [])
      if (url.startsWith('/api/bao-cao/cong-no')) return json(o.congNo ?? { toaNhaId: 3, tinhLuc: 'x', congNo: [] })
      if (url.startsWith('/api/yeu-cau-sua-chua')) return json(o.suCo ?? [])
      if (url === '/api/toa-nha/3/ky-thanh-toan') return json(o.ky ?? [])
      if (url.startsWith('/api/hoa-don')) return json(o.hoaDon ?? [])
      return json([])
    })
    const chinh = () => container.querySelector('.btn-primary')
    const viec = () => container.querySelector('.hs-viec')!.textContent!

    it('1) sự cố khẩn chưa giao thợ → Giao thợ', async () => {
      dat({ suCo: [KHAN], congNo: CONG_NO, hopDong: HOP_DONG })
      await mount('CHU')
      expect(viec()).toContain('Điện phòng 302 khẩn, chưa giao thợ')
      expect(chinh()?.textContent).toBe('Giao thợ'); expect(chinh()?.getAttribute('href')).toBe('/su-co?id=9')
      expect(container.querySelectorAll('.btn-primary')).toHaveLength(1)
    })
    it('2) nợ quá hạn → Thu nợ', async () => {
      dat({ congNo: CONG_NO, hopDong: HOP_DONG })
      await mount('CHU')
      expect(viec()).toMatch(/3 người nợ 1\.500\.000 ₫, cũ nhất trễ \d+ ngày/)
      expect(chinh()?.textContent).toBe('Thu nợ')
    })
    it('3) hợp đồng ≤ 30 ngày → Gia hạn; chờ ký → Mở hợp đồng', async () => {
      dat({ hopDong: [HOP_DONG[1]] })
      await mount('CHU')
      expect(viec()).toContain('Hợp đồng phòng P4 hết hạn sau 10 ngày')
      expect(chinh()?.textContent).toBe('Gia hạn'); expect(chinh()?.getAttribute('href')).toBe('/hop-dong/2')
      await act(async () => root.unmount()); root = createRoot(container)
      dat({ hopDong: [HOP_DONG[2]] })
      await mount('CHU')
      expect(viec()).toContain('Hợp đồng phòng P5 chờ ký')
      expect(chinh()?.getAttribute('href')).toBe('/hop-dong/3')
    })
    it('4) tháng này chưa gửi hoá đơn → Xem tiến độ; tháng trước đã thu % cộng từ hoá đơn', async () => {
      dat({ ky: [{ id: 5, nam: 2026, thang: 11, trangThai: 'DANG_MO' }, { id: 4, nam: 2026, thang: 10, trangThai: 'DA_CHOT' }], hoaDon: [{ hoaDonId: 1, kyId: 4, trangThai: 'DA_THU', tongTien: '1000', daThu: '690', conLai: '310' }] })
      await mount('CHU')
      expect(viec()).toContain('Tháng 11 chưa gửi hoá đơn')
      expect(chinh()?.textContent).toBe('Xem tiến độ'); expect(chinh()?.getAttribute('href')).toBe('/chu-ky?toaNhaId=3')
      expect(container.querySelector('.ma-khoiso')?.textContent).toContain('Tháng 10 đã thu69%')
    })
    it('không còn việc: hiện câu báo và không có nút chính', async () => {
      dat({})
      await mount('CHU')
      expect(viec()).toContain('Không có việc gấp ở toà này.')
      expect(chinh()).toBeNull()
    })
  })

  it('Sửa thông tin toà mở ngăn, gửi PUT đúng payload', async () => {
    await mount('CHU')
    await act(async () => { [...container.querySelectorAll('button')].find((b) => b.textContent === 'Sửa thông tin toà')!.click() })
    const o = document.querySelector('input[name="maNganHang"]') as HTMLInputElement
    expect(o.value).toBe('970405')
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(o, '970436')
      o.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => { document.querySelector('[data-testid="building-form"]')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })) })
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/toa-nha/3', expect.objectContaining({
      method: 'PUT', body: JSON.stringify({ maToa: 'T3', ten: 'An Nhiên Residence', diaChi: '12 Lê Lợi', soTang: 2, ngayChotSo: 28, soNgayHanTt: 7, maNganHang: '970436', tkNganHang: '0123456789', nguongThatThoat: '1.25', batBuocAnhCongTo: false }),
    })))
    await vi.waitFor(() => expect(container.textContent).toContain('Đã cập nhật thông tin toà nhà.'))
  })

  it('máy chủ từ chối lưu: hiện lỗi trong ngăn, ngăn vẫn mở', async () => {
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => init?.method === 'PUT' ? json({ thongBao: 'Mã toà T3 đã tồn tại.' }, 409) : url === '/api/toa-nha' ? json([TOA]) : url === '/api/toa-nha/3/phong' ? json(PHONG) : json([]))
    await mount('QUAN_LY')
    await act(async () => { [...container.querySelectorAll('button')].find((b) => b.textContent === 'Sửa thông tin toà')!.click() })
    await act(async () => { document.querySelector('[data-testid="building-form"]')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })) })
    await vi.waitFor(() => expect(document.body.textContent).toContain('Mã toà T3 đã tồn tại.'))
    expect(document.querySelector('[role="dialog"]')).not.toBeNull()
  })

  it('QTHT chỉ xem thông tin toà: không nút Sửa/Khai báo phòng, không gọi phòng/hợp đồng/công nợ', async () => {
    await mount('QTHT')
    expect(container.querySelector('h1')?.textContent).toBe('An Nhiên Residence')
    expect(container.querySelector('button, .btn')).toBeNull()
    expect(container.querySelector('.rooms, .strip')).toBeNull()
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(['/api/toa-nha'])
  })

  it('toà không có trong phạm vi → trạng thái không tìm thấy', async () => {
    await mount('CHU', '99')
    expect(container.textContent).toContain('Không tìm thấy toà nhà này')
  })
  it('vừa đăng nhập/đổi vai: ma.toaNhaId lạ không ảnh hưởng, kết quả muộn của vai cũ không ghi đè hồ sơ', async () => {
    localStorage.setItem('ma.toaNhaId', '999')
    let traVaiCu: (r: Response) => void = () => undefined
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url === '/api/toa-nha' && (init?.headers as Record<string, string>)?.Authorization?.endsWith('cu')) return new Promise<Response>((r) => { traVaiCu = r })
      if (url === '/api/toa-nha') return json([TOA])
      if (url === '/api/toa-nha/3/phong') return json(PHONG)
      return json([])
    })
    const ve = (token: string, vaiTro: string) => act(async () => { root.render(<HoSoToa360 token={token} vaiTro={vaiTro as 'CHU'} mobile={false} thamSo={{ id: '3' }} dieuHuong={vi.fn()} />) })
    await ve('cu', 'QUAN_LY')
    await ve('moi', 'CHU')
    await vi.waitFor(() => expect(container.querySelector('h1')?.textContent).toBe('An Nhiên Residence'))
    await act(async () => { traVaiCu(json([])); await new Promise((r) => setTimeout(r, 20)) })
    expect(container.querySelector('h1')?.textContent).toBe('An Nhiên Residence')
    expect(container.textContent).not.toContain('Không tìm thấy toà nhà này')
    localStorage.removeItem('ma.toaNhaId')
  })
})
