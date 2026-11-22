// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ThuTien from './ThuTien'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
const khoan = (o: Record<string, unknown>) => ({ kyId: 8, hopDongId: 1, toaNhaId: 3, tenToaNha: 'An Nhiên', ngayPhatHanh: '2026-07-01', hanThanhToan: '2026-07-05', tongTien: '4000000.00', daThu: '0.00', conLai: '4000000.00', soNgayQuaHan: 140, ...o } as Record<string, string | number>)
// 3 người: Huy (2 kỳ, 8.000.000, trễ 140 ngày), Anh (1 kỳ, đã trả một phần, còn 2.000.000, trễ 10), Quang (1 kỳ 1.500.000, trễ 40).
const CONG_NO = [
  khoan({ hoaDonId: 1, maHoaDon: 'HD-1', soPhong: '201', nguoiThueId: 11, hoTenNguoiThue: 'Nguyễn Quang Huy' }),
  khoan({ hoaDonId: 2, maHoaDon: 'HD-2', soPhong: '201', nguoiThueId: 11, hoTenNguoiThue: 'Nguyễn Quang Huy', hanThanhToan: '2026-08-05', ngayPhatHanh: '2026-08-01' }),
  khoan({ hoaDonId: 3, maHoaDon: 'HD-3', soPhong: '302', nguoiThueId: 12, hoTenNguoiThue: 'Hoàng Tuấn Anh', tongTien: '3000000.00', daThu: '1000000.00', conLai: '2000000.00', soNgayQuaHan: 10 }),
  khoan({ hoaDonId: 4, maHoaDon: 'HD-4', soPhong: '103', nguoiThueId: 13, hoTenNguoiThue: 'Lê Nhật Quang', tongTien: '1500000.00', conLai: '1500000.00', soNgayQuaHan: 40 }),
  khoan({ hoaDonId: 5, maHoaDon: 'HD-5', soPhong: '104', nguoiThueId: 14, hoTenNguoiThue: 'Đã Trả Hết', conLai: '0.00', daThu: '4000000.00' }),
]
const hoaDonQl = (o: Record<string, unknown>) => ({ hopDongId: 1, nguoiThue: 'Trần Quang Huy', hanThanhToan: '2026-09-07', tongTien: '3000000.00', daThu: '0.00', conLai: '3000000.00', kyId: 8, soPhong: '101', trangThai: 'QUA_HAN', ...o })

describe('ThuTien — Cần thu', () => {
  let root: Root
  let container: HTMLDivElement
  const calls: { url: string; method?: string }[] = []
  let congNoLoi = false

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    window.history.replaceState({}, '', '/thu-tien')
    container = document.createElement('div')
    document.body.appendChild(container)
    calls.length = 0
    congNoLoi = false
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      calls.push({ url, method: init?.method })
      if (url === '/api/toa-nha') return json([{ id: 3, ten: 'An Nhiên' }])
      if (url === '/api/bao-cao/cong-no') return congNoLoi ? new Response('{}', { status: 500 }) : json({ toaNhaId: null, tinhLuc: '2026-11-22T00:00:00', congNo: CONG_NO })
      if (url === '/api/hoa-don?toaNhaId=3&trangThai=') return json([
        hoaDonQl({ hoaDonId: 10, maHoaDon: 'HD-10' }),
        hoaDonQl({ hoaDonId: 12, maHoaDon: 'HD-12', soPhong: '103', nguoiThue: 'Đã trả hết', conLai: '0.00', daThu: '3000000.00', trangThai: 'DA_THANH_TOAN' }),
      ])
      if (url === '/api/hop-dong?toaNhaId=3') return json([{ id: 5, soPhong: '101', hoTenNguoiThue: 'Trần Quang Huy', nguoiThueId: 21, tenTrangThai: 'Hiệu lực', trangThai: 'HIEU_LUC', phongId: 1, tienCoc: '6000000.00' }])
      if (url === '/api/toa-nha/3/ky-thanh-toan') return json([])
      const ct = /^\/api\/bao-cao\/cong-no\/hoa-don\/(\d+)$/.exec(url)
      if (ct) { const k = CONG_NO.find((x) => x.hoaDonId === Number(ct[1]))!; return json({ hoaDonId: k.hoaDonId, maHoaDon: k.maHoaDon, soPhong: k.soPhong, nguoiThue: k.hoTenNguoiThue, trangThai: 'QUA_HAN', conLai: k.conLai, cacDong: [] }) }
      if (/^\/api\/hoa-don\/\d+\/thanh-toan$/.test(url)) return json({ hoaDonId: Number(url.split('/')[3]), hopDongId: 1, toaNhaId: 3, kyId: 8, giaoDich: [] })
      if (/^\/api\/toa-nha\/3\/ky-thanh-toan\/8\/hoa-don\/\d+\/thanh-toan$/.test(url)) return json({ thanhToanId: 90, hoaDonId: 4, maBienLai: 'BL-90', soTien: '1500000.00', hinhThuc: 'TIEN_MAT', loai: 'THANH_TOAN', ngayThu: '2026-11-22', tongTien: '1500000.00', daThu: '1500000.00', conLai: '0.00', soTienThanhSoDu: '0.00', trangThai: 'DA_THANH_TOAN' })
      if (url === '/api/hop-dong/5/giao-dich-coc') return json({ hopDongId: 5, tienCocThoaThuan: '6000000.00', tongDaThu: '2000000.00', conLaiChuaThu: '4000000.00', giaoDich: [] })
      throw new Error(`Unexpected fetch: ${url}`)
    }))
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
  })

  const nhomHang = () => container.querySelectorAll('tbody tr.grp')
  const bam = async (el: Element | null) => { await act(async () => { (el as HTMLElement).click() }) }
  const nutTheoNhan = (nhan: string) => container.querySelector(`[aria-label="${nhan}"]`)
  const chip = (nhan: string) => Array.from(container.querySelectorAll('button.chip')).find((b) => b.textContent?.startsWith(nhan)) ?? null

  async function mount(vaiTro = 'CHU') {
    await act(async () => { root = createRoot(container); root.render(<ThuTien token="t" vaiTro={vaiTro} />) })
    await vi.waitFor(() => expect(nhomHang().length).toBeGreaterThan(0))
  }

  it('Chủ: 3 nhóm theo người, hàng tổng đúng, chỉ đọc khi mở màn', async () => {
    await mount()
    expect(nhomHang()).toHaveLength(3)
    expect(nhomHang()[0].textContent).toContain('Nguyễn Quang Huy')
    expect(nhomHang()[0].textContent).toContain('2 kỳ')
    const tong = container.querySelector('tr.tot')!.textContent!
    expect(tong).toContain('Tổng 3 người')
    expect(tong).toContain('4 kỳ')
    expect(tong).toContain('1.000.000 ₫') // đã thu
    expect(tong).toContain('11.500.000 ₫') // còn nợ
    expect(calls.map((c) => c.url)).toContain('/api/bao-cao/cong-no')
    expect(calls.every((c) => !c.method || c.method === 'GET')).toBe(true)
    // 3 chip có số đếm; hàng tổng nằm cuối bảng
    expect(chip('Tất cả')!.textContent).toContain('3')
    expect(chip('Trễ trên 30 ngày')!.textContent).toContain('2')
    expect(chip('Đã trả một phần')!.textContent).toContain('1')
  })

  it('chip "Trễ trên 30 ngày" lọc nhóm, đổi hàng tổng và ghi vào URL', async () => {
    await mount()
    await bam(chip('Trễ trên 30 ngày'))
    expect(nhomHang()).toHaveLength(2)
    expect(container.querySelector('tr.tot')!.textContent).toContain('9.500.000 ₫')
    expect(chip('Trễ trên 30 ngày')!.getAttribute('aria-pressed')).toBe('true')
    expect(window.location.search).toContain('loc=tre-30')
  })

  it('nhóm đầu mở sẵn; mở nhóm khác thấy từng kỳ và nợ còn lại', async () => {
    await mount()
    expect(container.querySelectorAll('tr.kid')).toHaveLength(2) // Huy mở sẵn
    const nut = nutTheoNhan('Mở hoá đơn của Hoàng Tuấn Anh')!
    expect(nut.getAttribute('aria-expanded')).toBe('false')
    await bam(nut)
    const kid = Array.from(container.querySelectorAll('tr.kid')).find((r) => r.textContent?.includes('HD-3'))!
    expect(kid.textContent).toContain('Trả một phần')
    expect(kid.textContent).toContain('1.000.000 ₫ / 3.000.000 ₫')
    expect(nutTheoNhan('Thu gọn hoá đơn của Hoàng Tuấn Anh')!.getAttribute('aria-expanded')).toBe('true')
  })

  it('ô tìm không dấu, nhóm theo Phòng và query được giữ', async () => {
    await mount()
    const o = container.querySelector('input[type="search"]') as HTMLInputElement
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(o, 'tuan anh')
      o.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(nhomHang()).toHaveLength(1)
    expect(window.location.search).toContain('q=tuan+anh')
    await bam(Array.from(container.querySelectorAll('.seg button')).find((b) => b.textContent === 'Phòng')!)
    expect(window.location.search).toContain('theo=phong')
    expect(nhomHang()[0].textContent).toContain('Phòng 302')
  })

  it('rỗng do lọc có "Bỏ lọc"; lỗi tải có "Thử lại" và câu dữ liệu chưa đổi', async () => {
    await mount()
    window.history.replaceState({}, '', '/thu-tien?q=khongco')
    await act(async () => { window.dispatchEvent(new PopStateEvent('popstate')) })
    expect(container.textContent).toContain('Không có người nào khớp bộ lọc.')
    await bam(Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Bỏ lọc')!)
    expect(nhomHang()).toHaveLength(3)
    await act(async () => root.unmount())
    congNoLoi = true
    root = createRoot(container)
    await act(async () => { root.render(<ThuTien token="t" vaiTro="CHU" />) })
    await vi.waitFor(() => expect(container.textContent).toContain('Dữ liệu chưa bị thay đổi.'))
    congNoLoi = false
    await bam(Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Thử lại')!)
    await vi.waitFor(() => expect(nhomHang()).toHaveLength(3))
  })

  it('Quản lý: không gọi /api/bao-cao/cong-no, dựng từ /api/hoa-don của toà', async () => {
    await mount('QUAN_LY')
    const urls = calls.map((c) => c.url)
    expect(urls).toContain('/api/hoa-don?toaNhaId=3&trangThai=')
    expect(urls).not.toContain('/api/bao-cao/cong-no')
    expect(nhomHang()).toHaveLength(1) // HD-12 đã thanh toán không có trong Cần thu
    expect(nhomHang()[0].textContent).toContain('Trần Quang Huy')
    expect(nhomHang()[0].querySelector('a')?.getAttribute('href')).toBe('/nguoi-thue/21') // nối hợp đồng theo phòng + họ tên
  })

  const tick = (ten: string) => bam(Array.from(container.querySelectorAll('tr.grp label.check')).find((l) => l.textContent === `Chọn ${ten}`)!.querySelector('input'))
  const nutBulk = (nhan: string) => Array.from(container.querySelectorAll('.bulkbar button')).find((b) => b.textContent === nhan) as HTMLButtonElement

  it('bulkbar: chọn 2 người khoá "Ghi nhận thu", "Gửi nhắc nợ" luôn aria-disabled kèm lý do, Esc bỏ chọn', async () => {
    await mount()
    expect(container.querySelector('.bulkbar')).toBeNull()
    await tick('Nguyễn Quang Huy'); await tick('Hoàng Tuấn Anh')
    expect(container.querySelector('.bulkbar')!.textContent).toContain('Đã chọn 2 người · 10.000.000 ₫')
    expect(nutBulk('Ghi nhận thu').getAttribute('aria-disabled')).toBe('true')
    const nhac = nutBulk('Gửi nhắc nợ')
    expect(nhac.getAttribute('aria-disabled')).toBe('true')
    expect(document.getElementById(nhac.getAttribute('aria-describedby')!)!.textContent).toBe('cần API nhắc nợ')
    await act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })) })
    expect(container.querySelector('.bulkbar')).toBeNull()
    expect(container.querySelectorAll('tr.grp.is-selected')).toHaveLength(0)
  })

  it('bulkbar: chọn hết trên trang bằng ô ở <th>; chọn 1 người thì "Ghi nhận thu" mở khoá', async () => {
    await mount()
    await bam(container.querySelector('thead input[type="checkbox"]'))
    expect(container.querySelector('.bulkbar')!.textContent).toContain('Đã chọn 3 người · 11.500.000 ₫')
    await bam(container.querySelector('thead input[type="checkbox"]'))
    await tick('Lê Nhật Quang')
    expect(nutBulk('Ghi nhận thu').getAttribute('aria-disabled')).toBeNull()
  })

  it('xuất danh sách: CSV có họ tên, toà, phòng, số kỳ, trễ, còn nợ của người đã chọn và tải bằng <a download>', async () => {
    const { taoCsv } = await import('./ThuTien')
    const { nhomNo, tuCongNo } = await import('./nhomNoTheoNguoi')
    const ds = nhomNo(tuCongNo(CONG_NO as never))
    expect(taoCsv([ds[0]])).toBe('\uFEFF"Họ tên","Toà","Phòng","Số kỳ","Trễ lâu nhất (ngày)","Còn nợ"\r\n"Nguyễn Quang Huy","An Nhiên","201","2","140","8000000"')
    const tao = vi.fn(() => 'blob:x'); const thu = vi.fn()
    const goc = { c: URL.createObjectURL, r: URL.revokeObjectURL }
    URL.createObjectURL = tao; URL.revokeObjectURL = thu
    const nhan = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    await mount()
    await tick('Lê Nhật Quang')
    await bam(nutBulk('Xuất danh sách'))
    expect(tao).toHaveBeenCalledTimes(1)
    expect(await ((tao.mock.calls[0] as unknown as [Blob])[0]).text()).toContain('"Lê Nhật Quang","An Nhiên","103","1","40","1500000"')
    expect(nhan).toHaveBeenCalledTimes(1)
    nhan.mockRestore()
    URL.createObjectURL = goc.c; URL.revokeObjectURL = goc.r
  })

  const ngan = () => document.querySelector('[role="dialog"]') as HTMLElement | null
  const nutNgan = (nhan: string) => Array.from(ngan()!.querySelectorAll('button')).find((b) => b.textContent === nhan) as HTMLButtonElement
  const nutDau = () => Array.from(container.querySelectorAll('.ph button')).find((b) => b.textContent === 'Ghi nhận thu tiền') as HTMLButtonElement
  const phim = async (key: string) => { await act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })) }) }

  it('ngăn: nút chính đầu trang mở ngăn chọn hoá đơn → panel đúng props; Esc đóng và trả focus', async () => {
    await mount()
    nutDau().focus()
    await bam(nutDau())
    expect(ngan()!.getAttribute('aria-modal')).toBe('true')
    expect(ngan()!.textContent).toContain('Ghi nhận thu tiền')
    expect(ngan()!.querySelector('input[aria-label="Số tiền thu"]')).toBeNull() // chưa chọn hoá đơn: bảng chọn
    await bam(ngan()!.querySelector('button[aria-label="Thu tiền hoá đơn HD-3"]'))
    await vi.waitFor(() => expect(ngan()!.querySelector('input[aria-label="Số tiền thu"]')).not.toBeNull())
    expect((ngan()!.querySelector('input[aria-label="Số tiền thu"]') as HTMLInputElement).value).toBe('2000000.00') // conLai của hoá đơn
    expect(ngan()!.textContent).toContain('Phòng 302 · Hoàng Tuấn Anh · Còn phải thu 2.000.000 đ')
    expect(calls.map((c) => c.url)).toContain('/api/bao-cao/cong-no/hoa-don/3')
    await phim('Escape')
    expect(ngan()).toBeNull()
    expect(document.activeElement).toBe(nutDau())
  })

  it('ngăn: bulkbar chọn đúng 1 người → mở với hoá đơn cũ nhất; nút Thu ở hàng con mở đúng hoá đơn', async () => {
    await mount()
    await tick('Nguyễn Quang Huy')
    await bam(nutBulk('Ghi nhận thu'))
    await vi.waitFor(() => expect(ngan()!.querySelector('input[aria-label="Số tiền thu"]')).not.toBeNull())
    expect(calls.map((c) => c.url)).toContain('/api/bao-cao/cong-no/hoa-don/1') // HD-1 hạn 05/07 trước HD-2
    expect(ngan()!.querySelector('select')!.textContent).toContain('HD-2') // chuyển được sang kỳ khác của cùng người
    await phim('Escape')
    await bam(container.querySelector('button[aria-label="Thu tiền hoá đơn HD-2"]'))
    await vi.waitFor(() => expect(calls.map((c) => c.url)).toContain('/api/bao-cao/cong-no/hoa-don/2'))
  })

  it('ngăn: ghi nhận thành công → đóng ngăn, tải lại Cần thu, báo toast', async () => {
    await mount()
    await tick('Lê Nhật Quang')
    await bam(nutBulk('Ghi nhận thu'))
    await vi.waitFor(() => expect(ngan()!.querySelector('input[aria-label="Số tiền thu"]')).not.toBeNull())
    const truoc = calls.filter((c) => c.url === '/api/bao-cao/cong-no').length
    await bam(nutNgan('Ghi nhận thu tiền'))
    await vi.waitFor(() => expect(ngan()).toBeNull())
    const post = calls.find((c) => c.method === 'POST')!
    expect(post.url).toBe('/api/toa-nha/3/ky-thanh-toan/8/hoa-don/4/thanh-toan')
    await vi.waitFor(() => expect(calls.filter((c) => c.url === '/api/bao-cao/cong-no').length).toBe(truoc + 1))
    expect(container.querySelector('[role="status"]:not(.bulkbar)')?.textContent ?? container.textContent).toContain('Đã ghi nhận giao dịch thu tiền.')
  })

  it('mở từ nơi khác: ?nguoiThueId= → hoá đơn nợ cũ nhất; ?hoaDonId= → đúng hoá đơn; người không nợ → chế độ chọn; đóng thì bỏ tham số', async () => {
    window.history.replaceState({}, '', '/thu-tien?nguoiThueId=11')
    await mount()
    await vi.waitFor(() => expect(ngan()!.querySelector('input[aria-label="Số tiền thu"]')).not.toBeNull())
    expect(calls.map((c) => c.url)).toContain('/api/bao-cao/cong-no/hoa-don/1')
    await phim('Escape')
    expect(window.location.search).toBe('')
    await act(async () => root.unmount())
    window.history.replaceState({}, '', '/thu-tien?hoaDonId=3')
    root = createRoot(container)
    await act(async () => { root.render(<ThuTien token="t" vaiTro="CHU" />) })
    await vi.waitFor(() => expect(calls.map((c) => c.url)).toContain('/api/bao-cao/cong-no/hoa-don/3'))
    await act(async () => root.unmount())
    window.history.replaceState({}, '', '/thu-tien?nguoiThueId=14')
    root = createRoot(container)
    await act(async () => { root.render(<ThuTien token="t" vaiTro="CHU" />) })
    await vi.waitFor(() => expect(ngan()).not.toBeNull())
    expect(ngan()!.querySelector('button[aria-label="Thu tiền hoá đơn HD-1"]')).not.toBeNull() // không nợ → chọn hoá đơn
    await phim('Escape')
  })

  it('tab Tiền cọc: chọn hợp đồng hiện số cọc đã thu / còn thiếu', async () => {
    window.history.replaceState({}, '', '/thu-tien?tab=coc')
    await act(async () => { root = createRoot(container); root.render(<ThuTien token="t" vaiTro="CHU" />) })
    await vi.waitFor(() => expect(nutTheoNhan('Thu cọc hợp đồng 5')).not.toBeNull())
    await bam(nutTheoNhan('Thu cọc hợp đồng 5'))
    await vi.waitFor(() => expect(container.textContent).toContain('Tiền cọc hợp đồng #5'))
    expect(container.textContent).toContain('2.000.000')
    expect(container.textContent).toContain('4.000.000')
  })
})
