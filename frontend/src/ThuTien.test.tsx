// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ThuTien, { taoCsv } from './ThuTien'
import { nhomNo, tuCongNo } from './nhomNoTheoNguoi'

declare global { var IS_REACT_ACT_ENVIRONMENT: boolean | undefined }

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
const khoan = (o: Record<string, unknown>) => ({ kyId: 8, hopDongId: 1, toaNhaId: 3, tenToaNha: 'An Nhiên', ngayPhatHanh: '2026-07-01', hanThanhToan: '2026-07-05', tongTien: '1895000.00', daThu: '0.00', conLai: '1895000.00', soNgayQuaHan: 140, ...o } as Record<string, string | number>)
const huy = (hoaDonId: number, ngay: string, tre: number) => khoan({ hoaDonId, maHoaDon: `HD-${hoaDonId}`, soPhong: '201', nguoiThueId: 11, hoTenNguoiThue: 'Nguyễn Quang Huy', ngayPhatHanh: `${ngay}-01`, hanThanhToan: `${ngay}-05`, soNgayQuaHan: tre })
// Huy: 3 tháng (7, 8, 9/2026) × 1.895.000 = 5.685.000. Anh: 1 hoá đơn trả một phần, còn 2.000.000, trễ 10 ngày. Quang: 1.500.000, trễ 40 ngày.
const CONG_NO = [
  huy(1, '2026-07', 140), huy(2, '2026-08', 109), huy(6, '2026-09', 78),
  khoan({ hoaDonId: 3, maHoaDon: 'HD-3', soPhong: '302', nguoiThueId: 12, hoTenNguoiThue: 'Hoàng Tuấn Anh', tongTien: '3000000.00', daThu: '1000000.00', conLai: '2000000.00', soNgayQuaHan: 10 }),
  khoan({ hoaDonId: 4, maHoaDon: 'HD-4', soPhong: '103', nguoiThueId: 13, hoTenNguoiThue: 'Lê Nhật Quang', tongTien: '1500000.00', conLai: '1500000.00', soNgayQuaHan: 40 }),
  khoan({ hoaDonId: 5, maHoaDon: 'HD-5', soPhong: '104', nguoiThueId: 14, hoTenNguoiThue: 'Đã Trả Hết', conLai: '0.00', daThu: '1895000.00' }),
]
const hoaDonQl = (o: Record<string, unknown>) => ({ hopDongId: 1, nguoiThue: 'Trần Quang Huy', ngayPhatHanh: '2026-09-01', hanThanhToan: '2026-09-07', tongTien: '3000000.00', daThu: '0.00', conLai: '3000000.00', kyId: 8, soPhong: '101', trangThai: 'QUA_HAN', ...o })
// Hôm nay 22/11/2026: tháng này 11/2026, tháng trước 10/2026.
const HOA_DON = [
  hoaDonQl({ hoaDonId: 10, maHoaDon: 'HD-10' }),
  hoaDonQl({ hoaDonId: 12, maHoaDon: 'HD-12', soPhong: '103', nguoiThue: 'Đã trả hết', conLai: '0.00', daThu: '3000000.00', trangThai: 'DA_THANH_TOAN', ngayPhatHanh: '2026-10-01', hanThanhToan: '2026-10-05' }),
  hoaDonQl({ hoaDonId: 13, maHoaDon: 'HD-13', soPhong: '104', nguoiThue: 'Trả một phần', conLai: '1000000.00', daThu: '2000000.00', trangThai: 'DA_THU_MOT_PHAN', ngayPhatHanh: '2026-10-01', hanThanhToan: '2026-10-05' }),
  hoaDonQl({ hoaDonId: 14, maHoaDon: 'HD-14', soPhong: '105', nguoiThue: 'Tháng này', conLai: '500000.00', daThu: '0.00', trangThai: 'DA_PHAT_HANH', ngayPhatHanh: '2026-11-01', hanThanhToan: '2026-11-05' }),
]
const HOP_DONG = [{ id: 5, soPhong: '101', hoTenNguoiThue: 'Trần Quang Huy', nguoiThueId: 21, tenTrangThai: 'Hiệu lực', trangThai: 'HIEU_LUC', phongId: 1, tienCoc: '6000000.00', ngayKetThuc: '2027-01-01' }]
const payment = (id: number, soTien: string) => ({ thanhToanId: 90 + id, hoaDonId: id, maBienLai: `BL-${id}`, soTien, hinhThuc: 'TIEN_MAT', loai: 'THANH_TOAN', ngayThu: '2026-11-22', tongTien: soTien, daThu: soTien, conLai: '0.00', soTienThanhSoDu: '0.00', trangThai: 'DA_THANH_TOAN' })

describe('ThuTien', () => {
  let root: Root
  let container: HTMLDivElement
  const calls: { url: string; method?: string; body?: string }[] = []
  let congNoLoi = false
  let congNo: unknown[] = CONG_NO
  let postLoi: number | null = null // số thứ tự lần POST sẽ lỗi (1-based)
  let coSdt = true

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-22T10:00:00+07:00'))
    window.history.replaceState({}, '', '/thu-tien')
    container = document.createElement('div')
    document.body.appendChild(container)
    calls.length = 0; congNoLoi = false; congNo = CONG_NO; postLoi = null; coSdt = true
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      calls.push({ url, method: init?.method, body: typeof init?.body === 'string' ? init.body : undefined })
      if (url === '/api/toa-nha') return json([{ id: 3, ten: 'An Nhiên' }])
      if (url === '/api/bao-cao/cong-no') return congNoLoi ? new Response('{}', { status: 500 }) : json({ toaNhaId: null, tinhLuc: '2026-11-22T00:00:00', congNo })
      if (url === '/api/hoa-don?toaNhaId=3&trangThai=') return json(HOA_DON)
      if (url === '/api/hop-dong?toaNhaId=3') return json(HOP_DONG)
      if (url === '/api/toa-nha/3/ky-thanh-toan') return json([])
      if (url === '/api/nguoi-thue') return coSdt ? json([{ id: 11, hoTen: 'Nguyễn Quang Huy', soDienThoai: '0999100011' }]) : json({}, 403)
      const ct = /^\/api\/bao-cao\/cong-no\/hoa-don\/(\d+)$/.exec(url)
      if (ct) { const k = CONG_NO.find((x) => x.hoaDonId === Number(ct[1]))!; return json({ hoaDonId: k.hoaDonId, maHoaDon: k.maHoaDon, soPhong: k.soPhong, nguoiThue: k.hoTenNguoiThue, trangThai: 'QUA_HAN', conLai: k.conLai, cacDong: [] }) }
      const sổ = /^\/api\/hoa-don\/(\d+)\/thanh-toan$/.exec(url)
      if (sổ) return json({ hoaDonId: Number(sổ[1]), hopDongId: 1, toaNhaId: 3, kyId: 8, giaoDich: [] })
      const post = /^\/api\/toa-nha\/3\/ky-thanh-toan\/8\/hoa-don\/(\d+)\/thanh-toan$/.exec(url)
      if (post && init?.method === 'POST') {
        const lan = calls.filter((c) => c.method === 'POST').length
        if (postLoi === lan) return json({ message: 'Sổ đang khoá' }, 409)
        return json(payment(Number(post[1]), JSON.parse(String(init.body)).soTien))
      }
      if (url === '/api/hop-dong/5/giao-dich-coc') return json({ hopDongId: 5, tienCocThoaThuan: '6000000.00', tongDaThu: '2000000.00', conLaiChuaThu: '4000000.00', giaoDich: [] })
      throw new Error(`Unexpected fetch: ${url}`)
    }))
  })
  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    document.body.querySelectorAll('.tt-nen, .ma-ngan').forEach((n) => n.remove())
    vi.useRealTimers(); vi.unstubAllGlobals()
  })

  const hang = () => container.querySelectorAll('tbody tr.tt-hang')
  const bam = async (el: Element | null) => { await act(async () => { (el as HTMLElement).click() }) }
  const nutTheoNhan = (nhan: string) => container.querySelector(`[aria-label="${nhan}"]`)
  const chip = (nhan: string) => Array.from(container.querySelectorAll('button.chip')).find((b) => b.textContent?.startsWith(nhan)) ?? null
  const ngan = () => document.querySelector('[role="dialog"]') as HTMLElement | null
  const nhap = async (el: HTMLInputElement, v: string) => { await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })) }) }
  const nutNgan = (nhan: string) => Array.from(ngan()!.querySelectorAll('button')).find((b) => b.textContent === nhan) as HTMLButtonElement
  const post = () => calls.filter((c) => c.method === 'POST')

  async function mount(vaiTro = 'CHU', mobile = false) {
    await act(async () => { root = createRoot(container); root.render(<ThuTien token="t" vaiTro={vaiTro} mobile={mobile} />) })
    await vi.waitFor(() => expect(container.querySelector('.tt-hang, .ma-nguoino, .empty, tbody tr')).not.toBeNull())
  }

  it('Chủ: mỗi người một dòng; hàng tổng cộng trên toàn danh sách; chỉ GET khi mở màn; tiêu đề + 1 nút chính', async () => {
    await mount()
    expect(hang()).toHaveLength(3)
    expect(hang()[0].textContent).toContain('Nguyễn Quang Huy'); expect(hang()[0].textContent).toContain('3 tháng'); expect(hang()[0].textContent).toContain('từ tháng 7/2026')
    const tong = container.querySelector('tfoot')!.textContent!
    expect(tong).toContain('Cộng 3 người'); expect(tong).toContain('5 hoá đơn'); expect(tong).toContain('1.000.000 ₫'); expect(tong).toContain('9.185.000 ₫')
    expect(calls.every((c) => !c.method || c.method === 'GET')).toBe(true)
    expect(chip('Tất cả')!.textContent).toContain('3'); expect(chip('Đã trả một phần')!.textContent).toContain('1'); expect(chip('Trễ trên 30 ngày')!.textContent).toContain('2')
    expect(container.querySelector('h1')!.textContent).toBe('Tiền')
    expect(container.querySelectorAll('.btn-primary')).toHaveLength(1)
    expect(container.querySelector('.btn-primary')!.textContent).toBe('Ghi thu tiền')
    expect(container.querySelector('.ma-dautrang-phu')!.textContent).toContain('còn phải thu 9.185.000 ₫ của 3 người')
  })

  it('chip lọc đổi hàng tổng và ghi vào URL; tổng tính trên cả danh sách đã lọc, không chỉ trang đang xem', async () => {
    congNo = [...CONG_NO, ...Array.from({ length: 11 }, (_, i) => khoan({ hoaDonId: 100 + i, maHoaDon: `HD-${100 + i}`, soPhong: `5${i}`, nguoiThueId: 100 + i, hoTenNguoiThue: `Khách ${i}`, conLai: '100000.00', tongTien: '100000.00', soNgayQuaHan: 5 }))]
    await mount()
    expect(hang()).toHaveLength(10) // trang 1 chỉ 10 dòng
    expect(container.querySelector('tfoot')!.textContent).toContain('Cộng 14 người') // nhưng tổng là của cả 14 người
    expect(container.querySelector('tfoot')!.textContent).toContain('10.285.000 ₫')
    await bam(chip('Trễ trên 30 ngày'))
    expect(hang()).toHaveLength(2)
    expect(container.querySelector('tfoot')!.textContent).toContain('7.185.000 ₫')
    expect(chip('Trễ trên 30 ngày')!.getAttribute('aria-pressed')).toBe('true')
    expect(window.location.search).toContain('loc=tre-30')
  })

  it('hàng con mở theo ?xem=: từng tháng, hạn, trễ (đỏ), đã trả, còn; bấm dòng để mở/đóng và ghi vào URL', async () => {
    window.history.replaceState({}, '', '/thu-tien?xem=n:11')
    await mount()
    const con = container.querySelectorAll('tr.tt-con-hang')
    expect(con).toHaveLength(3)
    expect(con[0].textContent).toContain('Tháng 7/2026 · hạn 05/07/2026'); expect(con[0].textContent).toContain('trễ 140 ngày'); expect(con[0].textContent).toContain('1.895.000 ₫')
    expect(con[0].querySelector('.tt-do')).not.toBeNull()
    await bam(hang()[0].querySelector('td:nth-child(2)'))
    expect(container.querySelectorAll('tr.tt-con-hang')).toHaveLength(0)
    expect(window.location.search).not.toContain('xem=')
    await bam(hang()[1].querySelector('td:nth-child(2)'))
    expect(window.location.search).toContain('xem=n%3A12')
    expect(container.querySelectorAll('tr.tt-con-hang')).toHaveLength(1)
  })

  it('ghi thu 2.000.000 cho người nợ 3 tháng: xem trước đúng, gọi recordPayment 2 lần tuần tự tháng cũ trước (1.895.000 rồi 105.000), toast, đóng ngăn, tải lại', async () => {
    await mount()
    await bam(nutTheoNhan('Ghi thu Nguyễn Quang Huy'))
    expect(ngan()).not.toBeNull()
    const o = ngan()!.querySelector('input[inputmode="numeric"]') as HTMLInputElement
    expect(o.value).toBe('5.685.000') // mặc định = tổng còn nợ
    expect(nutNgan('Ghi thu 5.685.000 ₫')).toBeTruthy()
    await nhap(o, '2.000.000')
    expect(ngan()!.textContent).toContain('Tháng 7/2026 — 1.895.000 ₫')
    expect(ngan()!.textContent).toContain('Tháng 8/2026 — 105.000 ₫')
    expect(ngan()!.textContent).not.toContain('Tháng 9/2026 —')
    const truoc = calls.filter((c) => c.url === '/api/bao-cao/cong-no').length
    await bam(nutNgan('Ghi thu 2.000.000 ₫'))
    await vi.waitFor(() => expect(ngan()).toBeNull())
    expect(post().map((c) => c.url)).toEqual(['/api/toa-nha/3/ky-thanh-toan/8/hoa-don/1/thanh-toan', '/api/toa-nha/3/ky-thanh-toan/8/hoa-don/2/thanh-toan'])
    expect(post().map((c) => JSON.parse(c.body!))).toEqual([
      { soTien: '1895000', hinhThuc: 'TIEN_MAT', ngayThu: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), xacNhanThuThem: false },
      { soTien: '105000', hinhThuc: 'TIEN_MAT', ngayThu: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), xacNhanThuThem: false },
    ])
    await vi.waitFor(() => expect(calls.filter((c) => c.url === '/api/bao-cao/cong-no').length).toBe(truoc + 1))
    expect(container.querySelector('[role="status"]')!.textContent).toContain('Đã ghi thu 2.000.000 ₫ của phòng 201')
    expect(container.textContent).not.toContain('Hoàn tác')
  })

  it('lỗi ở lần ghi thứ 2: báo đúng câu, giữ ngăn mở, tải lại sổ, không có lần 3', async () => {
    postLoi = 2
    await mount()
    await bam(nutTheoNhan('Ghi thu Nguyễn Quang Huy'))
    await nhap(ngan()!.querySelector('input[inputmode="numeric"]') as HTMLInputElement, '5.000.000') // 1.895.000 + 1.895.000 + 1.210.000
    const truoc = calls.filter((c) => c.url === '/api/bao-cao/cong-no').length
    await bam(nutNgan('Ghi thu 5.000.000 ₫'))
    await vi.waitFor(() => expect(ngan()!.querySelector('[role="alert"].alert')).not.toBeNull())
    expect(ngan()!.querySelector('[role="alert"].alert')!.textContent).toBe('Đã ghi tháng 7/2026 (1.895.000 ₫). Tháng 8/2026 lỗi: Sổ đang khoá. Đã tải lại số mới.')
    expect(post()).toHaveLength(2)
    await vi.waitFor(() => expect(calls.filter((c) => c.url === '/api/bao-cao/cong-no').length).toBe(truoc + 1))
    expect(ngan()).not.toBeNull()
  })

  it('thu dư hoặc số sai: nút gửi bị chặn (aria-disabled) và hiện câu lỗi dưới ô; không POST', async () => {
    await mount()
    await bam(nutTheoNhan('Ghi thu Nguyễn Quang Huy'))
    const o = ngan()!.querySelector('input[inputmode="numeric"]') as HTMLInputElement
    await nhap(o, '99.000.000')
    expect(ngan()!.querySelector('.error-text')!.textContent).toBe('Lớn hơn số còn nợ (5.685.000 ₫). Thu dư thì ghi vào tháng sau.')
    expect(nutNgan('Ghi thu 99.000.000 ₫').getAttribute('aria-disabled')).toBe('true')
    await bam(nutNgan('Ghi thu 99.000.000 ₫'))
    await nhap(o, 'abc')
    expect(ngan()!.querySelector('.error-text')!.textContent).toBe('Nhập số tiền, ví dụ 1.895.000')
    expect(post()).toHaveLength(0)
  })

  it('Nhắc: có SĐT thì ngăn có link https://zalo.me/…; không có SĐT thì không có link; Gọi chỉ khi có SĐT', async () => {
    await mount()
    await vi.waitFor(() => expect(container.querySelector('a[href="tel:0999100011"]')).not.toBeNull())
    expect(hang()[1].querySelector('a[href^="tel:"]')).toBeNull()
    await bam(nutTheoNhan('Nhắc Nguyễn Quang Huy'))
    expect(ngan()!.querySelector('a[href="https://zalo.me/0999100011"]')).not.toBeNull()
    expect((ngan()!.querySelector('textarea') as HTMLTextAreaElement).value).toContain('còn nợ 5.685.000 ₫')
    expect((ngan()!.querySelector('textarea') as HTMLTextAreaElement).value).toContain('26/11/2026')
    await bam(Array.from(ngan()!.querySelectorAll('button')).find((b) => b.textContent === 'Đóng') ?? null)
    await bam(nutTheoNhan('Nhắc Hoàng Tuấn Anh'))
    expect(ngan()!.querySelector('a[href^="https://zalo.me"]')).toBeNull()
  })

  it('chọn nhiều người → "Nhắc người đã chọn" mở lần lượt từng người; Esc bỏ chọn', async () => {
    await mount()
    expect(container.textContent).toContain('Chọn để nhắc nhiều người')
    expect(Array.from(container.querySelectorAll('button')).some((b) => b.textContent?.startsWith('Nhắc người đã chọn'))).toBe(false)
    await bam(container.querySelector('tbody tr:nth-child(1) input[type="checkbox"]'))
    await bam(container.querySelector('tbody tr:nth-child(2) input[type="checkbox"]'))
    await bam(Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Nhắc người đã chọn (2)') ?? null)
    expect(ngan()!.querySelector('h2')!.textContent).toBe('Nhắc Nguyễn Quang Huy')
    await bam(Array.from(ngan()!.querySelectorAll('button')).find((b) => b.textContent === 'Đóng') ?? null)
    expect(ngan()!.querySelector('h2')!.textContent).toBe('Nhắc Hoàng Tuấn Anh')
    await bam(Array.from(ngan()!.querySelectorAll('button')).find((b) => b.textContent === 'Đóng') ?? null)
    expect(ngan()).toBeNull()
    await act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })) })
    expect(Array.from(container.querySelectorAll('button')).some((b) => b.textContent?.startsWith('Nhắc người đã chọn'))).toBe(false)
  })

  it('nút chính "Ghi thu tiền" mở ngăn với người đầu danh sách và cho đổi người; Esc đóng', async () => {
    await mount()
    await bam(container.querySelector('.btn-primary'))
    expect(ngan()!.textContent).toContain('Nguyễn Quang Huy · phòng 201 · Còn nợ 5.685.000 ₫ (3 tháng)')
    expect(ngan()!.querySelectorAll('select')[0].textContent).toContain('Hoàng Tuấn Anh')
    await act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })) })
    expect(ngan()).toBeNull()
  })

  it('ô tìm không dấu, bỏ lọc khi rỗng do lọc; lỗi tải có "Tải lại"; rỗng có link hoá đơn tháng trước', async () => {
    await mount()
    const o = container.querySelector('input[type="search"]') as HTMLInputElement
    await nhap(o, 'tuan anh')
    expect(hang()).toHaveLength(1)
    expect(window.location.search).toContain('q=tuan+anh')
    await nhap(o, 'khongco')
    expect(container.textContent).toContain('Không có người nào khớp bộ lọc.')
    await bam(Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Bỏ lọc')!)
    expect(hang()).toHaveLength(3)
    await act(async () => root.unmount())
    congNoLoi = true
    root = createRoot(container)
    await act(async () => { root.render(<ThuTien token="t" vaiTro="CHU" />) })
    await vi.waitFor(() => expect(container.textContent).toContain('Dữ liệu chưa bị thay đổi.'))
    congNoLoi = false
    await bam(Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Tải lại')!)
    await vi.waitFor(() => expect(hang()).toHaveLength(3))
    await act(async () => root.unmount())
    congNo = []
    root = createRoot(container)
    await act(async () => { root.render(<ThuTien token="t" vaiTro="CHU" />) })
    await vi.waitFor(() => expect(container.textContent).toContain('Không ai còn nợ.'))
    await bam(Array.from(container.querySelectorAll('a')).find((a) => a.textContent === 'Xem hoá đơn tháng 10')!)
    expect(window.location.search).toContain('tab=hoa-don')
  })

  it('Quản lý: không gọi /api/bao-cao/cong-no, dựng từ /api/hoa-don; tiêu đề "Thu tiền"; nối người thuê theo hợp đồng', async () => {
    await mount('QUAN_LY')
    const urls = calls.map((c) => c.url)
    expect(urls).toContain('/api/hoa-don?toaNhaId=3&trangThai=')
    expect(urls).not.toContain('/api/bao-cao/cong-no')
    expect(container.querySelector('h1')!.textContent).toBe('Thu tiền')
    expect(hang()).toHaveLength(3) // HD-10, HD-13, HD-14 còn nợ (HD-12 đã trả đủ không có trong Còn nợ); mỗi người một dòng
    expect(hang()[0].querySelector('a')?.getAttribute('href')).toBe('/nguoi-thue/21') // 3.000.000 nợ nhiều nhất; nối hợp đồng theo phòng + họ tên
  })

  it('giá trị ?tab= cũ vẫn mở đúng tab; tab mới "hoa-don"; tab có số đếm', async () => {
    window.history.replaceState({}, '', '/thu-tien?tab=da-thu')
    await mount()
    await vi.waitFor(() => expect(container.querySelectorAll('tbody tr')).toHaveLength(1))
    expect(container.querySelector('tbody')!.textContent).toContain('Tháng này')
    expect(container.querySelector('tfoot')!.textContent).toContain('Cộng 1 hoá đơn')
    expect(container.querySelector('[role="tab"][aria-selected="true"]')!.textContent).toContain('Đã thu tháng 11')
    await act(async () => root.unmount())
    window.history.replaceState({}, '', '/thu-tien?tab=hoa-don')
    root = createRoot(container)
    await act(async () => { root.render(<ThuTien token="t" vaiTro="CHU" />) })
    await vi.waitFor(() => expect(container.querySelectorAll('tbody tr')).toHaveLength(2))
    expect(container.querySelector('tbody')!.textContent).toContain('Trả một phần')
    expect(container.querySelector('tbody')!.textContent).toContain('Đã trả đủ')
    expect(container.querySelector('tfoot')!.textContent).toContain('Cộng 2 hoá đơn')
    for (const so of ['6.000.000 ₫', '5.000.000 ₫', '1.000.000 ₫']) expect(container.querySelector('tfoot')!.textContent).toContain(so) // phải trả, đã trả, còn nợ
    await act(async () => root.unmount())
    window.history.replaceState({}, '', '/thu-tien?tab=coc')
    root = createRoot(container)
    await act(async () => { root.render(<ThuTien token="t" vaiTro="CHU" />) })
    await vi.waitFor(() => expect(nutTheoNhan('Thu cọc hợp đồng 5')).not.toBeNull())
    expect(container.querySelector('tbody a[href="/hop-dong/5"]')).not.toBeNull()
    expect(container.querySelector('tfoot')!.textContent).toContain('6.000.000 ₫')
    await bam(nutTheoNhan('Thu cọc hợp đồng 5'))
    await vi.waitFor(() => expect(container.textContent).toContain('Tiền cọc hợp đồng #5'))
    expect(container.textContent).toContain('2.000.000'); expect(container.textContent).toContain('4.000.000')
  })

  it('mở từ nơi khác: ?hoaDonId= mở ngăn một hoá đơn (FinancePaymentPanel); ?nguoiThueId= mở ngăn ghi thu của người đó; đóng thì bỏ tham số', async () => {
    window.history.replaceState({}, '', '/thu-tien?nguoiThueId=12')
    await mount()
    await vi.waitFor(() => expect(ngan()).not.toBeNull())
    expect(ngan()!.textContent).toContain('Hoàng Tuấn Anh · phòng 302')
    await act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })) })
    expect(window.location.search).toBe('')
    await act(async () => root.unmount())
    window.history.replaceState({}, '', '/thu-tien?hoaDonId=3')
    root = createRoot(container)
    await act(async () => { root.render(<ThuTien token="t" vaiTro="CHU" />) })
    await vi.waitFor(() => expect(ngan()?.querySelector('input[aria-label="Số tiền thu"]')).not.toBeNull())
    expect(calls.map((c) => c.url)).toContain('/api/bao-cao/cong-no/hoa-don/3')
    expect((ngan()!.querySelector('input[aria-label="Số tiền thu"]') as HTMLInputElement).value).toBe('2000000.00')
  })

  it('Xuất Excel xuất danh sách đang lọc (CSV có BOM) bằng <a download>', async () => {
    const ds = nhomNo(tuCongNo(CONG_NO as never))
    expect(taoCsv([ds[0]])).toBe('\uFEFF"Họ tên","Toà","Phòng","Số tháng","Trễ lâu nhất (ngày)","Còn nợ"\r\n"Nguyễn Quang Huy","An Nhiên","201","3","140","5685000"')
    const tao = vi.fn(() => 'blob:x'); const thu = vi.fn()
    const goc = { c: URL.createObjectURL, r: URL.revokeObjectURL }
    URL.createObjectURL = tao; URL.revokeObjectURL = thu
    const nhan = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    await mount()
    await bam(Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Xuất Excel')!)
    expect(await ((tao.mock.calls[0] as unknown as [Blob])[0]).text()).toContain('"Lê Nhật Quang","An Nhiên","103","1","40","1500000"')
    expect(nhan).toHaveBeenCalledTimes(1)
    nhan.mockRestore()
    URL.createObjectURL = goc.c; URL.revokeObjectURL = goc.r
  })

  it('< 768: danh sách DongNguoiNo rút thay bảng, dòng "Cộng N người · X ₫", nút chính trong ChanDinh', async () => {
    await mount('CHU', true)
    expect(container.querySelector('table')).toBeNull()
    expect(container.querySelectorAll('.ma-nguoino')).toHaveLength(3)
    expect(container.querySelector('.tt-cong-m')!.textContent).toBe('Cộng 3 người9.185.000 ₫')
    expect(container.querySelector('.ma-chandinh .btn-primary')!.textContent).toBe('Ghi thu tiền')
    expect(container.querySelectorAll('.btn-primary')).toHaveLength(1)
  })
})
