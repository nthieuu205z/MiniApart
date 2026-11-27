// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HoSoNguoiThue360 from './HoSoNguoiThue360'
import HoSoPhong360 from './HoSoPhong360'
import type { TrangProps } from './dinhTuyen'

declare global { var IS_REACT_ACT_ENVIRONMENT: boolean | undefined }

let container: HTMLDivElement
let root: Root | undefined
beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.append(container) })
afterEach(async () => { await act(async () => root?.unmount()); root = undefined; container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); window.history.replaceState({}, '', '/') })

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
const toa = { id: 3, maToa: 'AN', ten: 'An Nhiên Residence', diaChi: 'Hà Nội', soTang: 4, ngayChotSo: 25, soNgayHanTt: 7, maNganHang: '1', tkNganHang: '1', nguongThatThoat: '1', batBuocAnhCongTo: false }
const huy = { id: 1, hoTen: 'Trần Quang Huy', ngaySinh: '2003-11-10', soDienThoai: '0999100001', soGiayToChe: '*********ON-1', soGiayTo: 'DEMO-PERSON-1', queQuan: 'Nam Định', canhBao: [] as string[], loaiGiayTo: 'CCCD', diaChiThuongTru: 'Thường trú số 1', email: 'cu-dan1@example.invalid' }
const hopDong = (o: object) => ({ id: 1, phongId: 1, soPhong: '101', nguoiThueId: 1, hoTenNguoiThue: 'Trần Quang Huy', ngayBatDau: '2026-05-01', ngayKetThuc: '2027-05-20', giaThue: '3200000.00', tienCoc: '6400000.00', soNgayBaoTruoc: 30, trangThai: 'HIEU_LUC', tenTrangThai: 'Hiệu lực', sapHetHan: false, soNgayConLai: 179, dichVuApDung: [], quyetToan: null, ...o })
const hoaDon = (hoaDonId: number, kyId: number, o: object = {}) => ({ hoaDonId, kyId, maHoaDon: `HD-${hoaDonId}`, soPhong: '101', nguoiThue: 'Trần Quang Huy', ngayPhatHanh: '2026-07-25', hanThanhToan: `2026-0${kyId + 6}-05`, trangThai: 'QUA_HAN', tongTien: '3790000.00', daThu: '1895000.00', conLai: '1895000.00', toaNhaId: 3, ...o })
const ky = [{ id: 2, nam: 2026, thang: 8, ngayBatDau: '2026-07-26', ngayKetThuc: '2026-08-25', trangThai: 'DANG_MO' }, { id: 1, nam: 2026, thang: 7, ngayBatDau: '2026-06-26', ngayKetThuc: '2026-07-25', trangThai: 'DA_CHOT' }]
const suCo = (id: number, phongId: number, trangThai: string) => ({ id, maYeuCau: `SC-${id}`, phongId, toaNha: toa.ten, soPhong: '101', tang: 1, hangMuc: `Hạng mục ${id}`, moTa: '', mucDo: 'THUONG', tenMucDo: 'Thường', trangThai, tenTrangThai: trangThai === 'DA_DONG' ? 'Đã đóng' : 'Đã phân công', taoLuc: '2026-11-15T10:00:00Z' })
const phong101 = { id: 1, toaNhaId: 3, soPhong: '101', tang: 1, dienTich: '25.00', sucChua: 3, giaThueMacDinh: '3200000.00', loaiPhong: 'Phòng có gác', trangThai: 'DANG_THUE', tenTrangThai: 'Đang thuê' }
const phong401 = { ...phong101, id: 10, soPhong: '401', tang: 4, trangThai: 'TRONG', tenTrangThai: 'Trống' }
const chiSo = { tongPhong: 1, daGhi: 1, phong: [{ id: 1, soPhong: '101', tang: 1, dichVu: [{ id: 1, tenDichVu: 'Điện sinh hoạt', donVi: 'kWh', chiSoDau: '288.00', chiSoCuoi: '384.00', mucTieuThu: '96.00', coThayCongTo: false }] }] }

type Goi = [string, RequestInit | undefined]
const goi: Goi[] = []
function mayChu(extra: (url: string, init?: RequestInit) => Response | undefined = () => undefined) {
  goi.length = 0
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    goi.push([url, init])
    const e = extra(url, init)
    if (e) return e
    if (url === '/api/toa-nha') return json([toa])
    if (url === '/api/nguoi-thue/1') return json(huy)
    if (url === '/api/nguoi-thue/1/ghi-chu') return init?.method === 'POST' ? json({ id: 9, kenh: 'ZALO', noiDung: JSON.parse(String(init.body)).noiDung, nguoiTao: 'Quản lý', taoLuc: '2026-10-26T01:00:00Z' }) : json([{ id: 5, kenh: 'GOI', noiDung: 'Hẹn trả thứ Sáu', nguoiTao: 'Chủ', taoLuc: '2026-10-25T01:00:00Z' }])
    if (url.startsWith('/api/hop-dong?')) return json([hopDong({}), hopDong({ id: 9, phongId: 10, soPhong: '401', nguoiThueId: 15, hoTenNguoiThue: 'Người khác' })])
    if (url.startsWith('/api/hoa-don?')) return json([hoaDon(1, 1), hoaDon(2, 2), hoaDon(3, 1, { soPhong: '102', nguoiThue: 'Người khác' })])
    if (url === '/api/toa-nha/3/ky-thanh-toan') return json(ky)
    if (url.startsWith('/api/yeu-cau-sua-chua')) return json([suCo(1, 1, 'DA_PHAN_CONG'), suCo(2, 1, 'DA_DONG'), suCo(3, 5, 'DA_PHAN_CONG')])
    if (url.endsWith('/chi-so')) return json(chiSo)
    if (url.startsWith('/api/hoa-don/') && url.endsWith('/thanh-toan')) return json({ hoaDonId: 1, hopDongId: 1, kyId: 1, toaNhaId: 3, giaoDich: [{ id: 1, maBienLai: 'TT-1', soTien: '1895000.00', hinhThuc: 'CHUYEN_KHOAN', loai: 'THU', ngayThu: '2026-07-27', lyDo: null, dieuChinhChoId: null }] })
    if (url === '/api/toa-nha/3/phong') return json([phong101, phong401])
    if (url.startsWith('/api/phong/') || url.includes('/tai-san')) return json([])
    return json({ thongBao: `chưa giả lập ${url}` }, 404)
  })
}
async function render(node: React.ReactElement, fetchMock: ReturnType<typeof mayChu>) {
  vi.stubGlobal('fetch', fetchMock)
  root = createRoot(container)
  await act(async () => root!.render(node))
}
const props = (o: Partial<TrangProps>): TrangProps => ({ token: 't', vaiTro: 'CHU', mobile: false, thamSo: { id: '1' }, dieuHuong: vi.fn(), ...o })
const hoSoNguoi = (o: Partial<TrangProps> = {}) => <HoSoNguoiThue360 {...props(o)} />
const chuaGoiCongNo = () => expect(goi.some(([u]) => u.includes('/api/bao-cao/cong-no'))).toBe(false)

describe('Hồ sơ người thuê 360°', () => {
  it('tiêu đề, thẻ nợ đúng tổng, đếm hoá đơn/hợp đồng/sự cố và chỉ lấy dữ liệu của chính người đó', async () => {
    await render(hoSoNguoi(), mayChu())
    await vi.waitFor(() => expect(container.querySelector('h1')?.textContent).toBe('Trần Quang Huy'))
    const so = container.querySelector('.ma-khoiso')!.textContent!
    expect(so).toContain('3.790.000 ₫') // hai tháng, mỗi tháng còn 1.895.000; hoá đơn của người khác không tính
    expect(so).toContain('2 tháng chưa trả đủ, cũ nhất hạn 05/07/2026')
    expect(container.querySelector('.ma-dautrang-phu')?.textContent).toBe('Phòng 101 · An Nhiên Residence · thuê từ 01/05/2026')
    expect(container.querySelector('.ma-oso.no')).not.toBeNull()
    const tab = (t: string) => [...container.querySelectorAll('nav.tabs a')].find((a) => a.textContent!.startsWith(t))!
    expect(tab('Hoá đơn').textContent).toContain('2')
    expect(tab('Hợp đồng').textContent).toContain('1')
    expect(tab('Sự cố').textContent).toContain('2')
    // bảng nợ có hàng Cộng; khối Điện nước ẩn (không có API điện nước theo phòng cho Chủ/QL)
    expect(container.querySelector('tfoot.ma-tong, tfoot .ma-tong')?.textContent).toContain('3.790.000 ₫')
    expect(container.textContent).not.toContain('Điện nước')
    expect(container.textContent).toContain('Ghi chú liên hệ')
    await vi.waitFor(() => expect(container.querySelector('[data-ghi-chu-dong]')?.textContent).toContain('Hẹn trả thứ Sáu'))
    expect(container.querySelector('.ma-nhanmh')).toBeNull()
    chuaGoiCongNo()
  })

  it('ghi chú liên hệ: lưu POST đúng nội dung + kênh, dòng mới lên đầu', async () => {
    await render(hoSoNguoi(), mayChu())
    await vi.waitFor(() => expect(container.querySelector('[data-ghi-chu-dong]')).not.toBeNull())
    const o = container.querySelector('[data-ghi-chu] textarea') as HTMLTextAreaElement
    const chon = container.querySelector('[data-ghi-chu] select') as HTMLSelectElement
    const dat = (el: HTMLElement, proto: object, v: string, ev: string) => { Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, v); el.dispatchEvent(new Event(ev, { bubbles: true })) }
    await act(async () => { dat(o, HTMLTextAreaElement.prototype, 'Đã nhắc Zalo', 'input'); dat(chon, HTMLSelectElement.prototype, 'ZALO', 'change') })
    await act(async () => (container.querySelector('[data-ghi-chu] form button') as HTMLButtonElement).click())
    await vi.waitFor(() => expect(container.querySelectorAll('[data-ghi-chu-dong]')).toHaveLength(2))
    expect(container.querySelector('[data-ghi-chu-dong]')?.textContent).toContain('Đã nhắc Zalo')
    const post = goi.find(([u, i]) => u === '/api/nguoi-thue/1/ghi-chu' && i?.method === 'POST')!
    expect(JSON.parse(String(post[1]!.body))).toEqual({ noiDung: 'Đã nhắc Zalo', kenh: 'ZALO' })
  })

  it('tab là liên kết đổi query ?tab=, tab đang chọn có aria-current', async () => {
    window.history.replaceState({}, '', '/nguoi-thue/1?tab=hop-dong')
    await render(hoSoNguoi(), mayChu())
    await vi.waitFor(() => expect(container.querySelector('nav.tabs')).not.toBeNull())
    const links = [...container.querySelectorAll<HTMLAnchorElement>('nav.tabs a')]
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/nguoi-thue/1', '/nguoi-thue/1?tab=hoa-don', '/nguoi-thue/1?tab=hop-dong', '/nguoi-thue/1?tab=su-co', '/nguoi-thue/1?tab=giay-to'])
    expect(links.filter((a) => a.getAttribute('aria-current') === 'page').map((a) => a.textContent)).toEqual(['Hợp đồng1'])
    expect(container.querySelector('[role="tab"]')).toBeNull()
    expect(container.textContent).toContain('Hợp đồng #1 · Phòng 101')
  })

  it('đúng một nút chính, trỏ tới Thu tiền của người này; Gọi là liên kết tel:', async () => {
    await render(hoSoNguoi(), mayChu())
    await vi.waitFor(() => expect(container.querySelector('.ma-dautrang')).not.toBeNull())
    const chinh = container.querySelectorAll('.btn-primary')
    expect(chinh).toHaveLength(1)
    expect(chinh[0].getAttribute('href')).toBe('/thu-tien?nguoiThueId=1')
    expect(chinh[0].textContent).toBe('Ghi thu 3.790.000 ₫')
    expect(container.querySelector('a[href="tel:0999100001"]')?.textContent).toBe('0999 100 001')
  })

  it('không nợ: không có nút chính, không có Nhắc qua Zalo, số nợ không đỏ', async () => {
    await render(hoSoNguoi(), mayChu((url) => (url.startsWith('/api/hoa-don?') ? json([]) : undefined)))
    await vi.waitFor(() => expect(container.querySelector('.ma-khoiso')).not.toBeNull())
    expect(container.querySelectorAll('.btn-primary')).toHaveLength(0)
    expect([...container.querySelectorAll('button')].some((b) => b.textContent === 'Nhắc qua Zalo')).toBe(false)
    expect(container.querySelector('.ma-oso.no')).toBeNull()
    expect(container.textContent).toContain('Đã trả đủ mọi hoá đơn')
    expect(container.textContent).toContain('Không còn hoá đơn nào chưa trả đủ.')
  })

  it('còn nợ: Nhắc qua Zalo mở ngăn nhắc, ẩn trên điện thoại', async () => {
    await render(hoSoNguoi(), mayChu())
    const nut = await vi.waitFor(() => [...container.querySelectorAll('button')].find((b) => b.textContent === 'Nhắc qua Zalo')!)
    await act(async () => nut.click())
    expect(container.querySelector('[role="dialog"] a[href="https://zalo.me/0999100001"]')).not.toBeNull()
    await act(async () => root!.unmount())
    root = createRoot(container)
    vi.stubGlobal('fetch', mayChu())
    await act(async () => root!.render(hoSoNguoi({ mobile: true })))
    await vi.waitFor(() => expect(container.querySelector('.ma-khoiso')).not.toBeNull())
    expect([...container.querySelectorAll('button')].some((b) => b.textContent === 'Nhắc qua Zalo')).toBe(false)
  })

  it('điện thoại: nút chính chuyển xuống thanh dính đáy, vẫn chỉ một nút chính', async () => {
    await render(hoSoNguoi({ mobile: true }), mayChu())
    await vi.waitFor(() => expect(container.querySelector('.ma-dautrang')).not.toBeNull())
    expect(container.querySelectorAll('.btn-primary')).toHaveLength(1)
    expect(container.querySelector('.ma-chandinh .btn-primary')).not.toBeNull()
  })

  it('menu "…" mở bằng bàn phím, mũi tên đổi mục, Esc đóng và trả focus', async () => {
    await render(hoSoNguoi(), mayChu())
    const nut = await vi.waitFor(() => container.querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]')!)
    expect(nut.getAttribute('aria-expanded')).toBe('false')
    await act(async () => nut.click())
    expect(nut.getAttribute('aria-expanded')).toBe('true')
    const muc = [...container.querySelectorAll<HTMLElement>('[role="menuitem"]')]
    expect(muc.map((m) => m.textContent)).toEqual(['Sửa hồ sơ', 'Khai báo cư trú', 'Ảnh giấy tờ'])
    expect(muc[1].getAttribute('href')).toBe('/cu-tru')
    expect(document.activeElement).toBe(muc[0])
    await act(async () => muc[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })))
    expect(document.activeElement).toBe(muc[1])
    await act(async () => muc[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })))
    expect(document.activeElement).toBe(muc[0])
    await act(async () => muc[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
    expect(container.querySelector('[role="menu"]')).toBeNull()
    expect(document.activeElement).toBe(nut)
  })

  it('Sửa hồ sơ mở ngăn có form cũ; lưu gửi PUT đúng payload rồi tải lại hồ sơ', async () => {
    const m = mayChu((url, init) => (url === '/api/nguoi-thue/1' && init?.method === 'PUT' ? json(huy) : undefined))
    await render(hoSoNguoi(), m)
    const nut = await vi.waitFor(() => container.querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]')!)
    await act(async () => nut.click())
    await act(async () => [...container.querySelectorAll<HTMLElement>('[role="menuitem"]')][0].click())
    await vi.waitFor(() => expect(container.querySelector('[role="dialog"] form')).not.toBeNull())
    expect(container.querySelector('[role="dialog"]')!.textContent).toContain('Chỉnh sửa hồ sơ: Trần Quang Huy')
    const queQuan = await vi.waitFor(() => [...container.querySelectorAll<HTMLInputElement>('[role="dialog"] form input')].find((i) => i.value === 'Nam Định')!)
    await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(queQuan, 'Hà Nội'); queQuan.dispatchEvent(new Event('input', { bubbles: true })) })
    const truoc = goi.filter(([u]) => u === '/api/nguoi-thue/1').length
    await act(async () => container.querySelector('[role="dialog"] form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    const put = goi.find(([, i]) => i?.method === 'PUT')!
    expect(put[0]).toBe('/api/nguoi-thue/1')
    expect(JSON.parse(String(put[1]!.body))).toEqual({ hoTen: 'Trần Quang Huy', ngaySinh: '2003-11-10', soDienThoai: '0999100001', soGiayTo: 'DEMO-PERSON-1', queQuan: 'Hà Nội' })
    await vi.waitFor(() => expect(goi.filter(([u, i]) => u === '/api/nguoi-thue/1' && i?.method === 'GET').length).toBeGreaterThan(truoc))
  })

  it('quản lý cũng đọc được hồ sơ mà không gọi báo cáo công nợ (chỉ dành cho Chủ)', async () => {
    await render(hoSoNguoi({ vaiTro: 'QUAN_LY' }), mayChu())
    await vi.waitFor(() => expect(container.querySelector('h1')?.textContent).toBe('Trần Quang Huy'))
    chuaGoiCongNo()
  })

  it('lỗi tải: báo lỗi kèm "Dữ liệu chưa bị thay đổi." và Thử lại gọi lại API', async () => {
    let hong = true
    const m = mayChu((url) => (hong && url === '/api/nguoi-thue/1' ? json({ thongBao: 'Máy chủ bận.' }, 500) : undefined))
    await render(hoSoNguoi(), m)
    await vi.waitFor(() => expect(container.textContent).toContain('Dữ liệu chưa bị thay đổi.'))
    hong = false
    await act(async () => [...container.querySelectorAll('button')].find((b) => b.textContent === 'Thử lại')!.click())
    await vi.waitFor(() => expect(container.querySelector('h1')?.textContent).toBe('Trần Quang Huy'))
  })

  it('sự cố tải lỗi: vẫn hiện hồ sơ, kèm dòng báo phần chưa tải được', async () => {
    await render(hoSoNguoi(), mayChu((url) => (url.startsWith('/api/yeu-cau-sua-chua') ? json({ thongBao: 'x' }, 500) : undefined)))
    await vi.waitFor(() => expect(container.textContent).toContain('Chưa tải được: sự cố.'))
    expect(container.querySelector('h1')?.textContent).toBe('Trần Quang Huy')
  })
})

describe('Hồ sơ phòng 360°', () => {
  const hoSoPhong = (id: string, o: Partial<TrangProps> = {}) => <HoSoPhong360 {...props({ vaiTro: 'QUAN_LY', thamSo: { id }, ...o })} />

  it('phòng đang thuê, có nợ: vết về toà, nút chính duy nhất là Ghi thu, có Mở hợp đồng + Báo sự cố', async () => {
    window.history.replaceState({}, '', '/phong/1?toaNhaId=3')
    await render(hoSoPhong('1'), mayChu())
    await vi.waitFor(() => expect(container.querySelector('h1')?.textContent).toBe('Phòng 101'))
    expect(container.querySelector('.ma-vet a')?.getAttribute('href')).toBe('/toa-nha/3')
    expect(container.querySelectorAll('.btn-primary')).toHaveLength(1)
    expect(container.querySelector('.btn-primary')?.textContent).toBe('Ghi thu 3.790.000 ₫')
    expect(container.querySelector('.btn-primary')?.getAttribute('href')).toBe('/thu-tien?nguoiThueId=1')
    expect(container.textContent).toContain('Công tơ tháng 8')
    expect(container.querySelector('a[href="/hop-dong/1"]')?.textContent).toContain('Mở hợp đồng')
    expect(container.querySelector('a[href="/su-co?baoMoi=1&phongId=1&toaNhaId=3"]')).not.toBeNull()
    expect(container.querySelector('a[href="/nguoi-thue/1"]')?.textContent).toContain('Trần Quang Huy')
    expect(container.textContent).toContain('288 → 384 kWh · dùng 96')
    chuaGoiCongNo()
  })

  it('phòng đang thuê, không nợ: không có nút chính', async () => {
    window.history.replaceState({}, '', '/phong/1?toaNhaId=3')
    await render(hoSoPhong('1'), mayChu((url) => (url.startsWith('/api/hoa-don?') ? json([]) : undefined)))
    await vi.waitFor(() => expect(container.querySelector('h1')?.textContent).toBe('Phòng 101'))
    expect(container.querySelectorAll('.btn-primary')).toHaveLength(0)
    expect(container.textContent).toContain('Phòng chưa có hoá đơn nào.')
  })

  it('phòng trống: nút chính duy nhất là "Tạo hợp đồng" trỏ /hop-dong/moi?phongId=', async () => {
    window.history.replaceState({}, '', '/phong/10?toaNhaId=3')
    await render(hoSoPhong('10'), mayChu())
    await vi.waitFor(() => expect(container.querySelector('h1')?.textContent).toBe('Phòng 401'))
    const chinh = container.querySelectorAll('.btn-primary')
    expect(chinh).toHaveLength(1)
    expect(chinh[0].textContent).toContain('Tạo hợp đồng')
    expect(chinh[0].getAttribute('href')).toBe('/hop-dong/moi?phongId=10&toaNhaId=3')
  })

  it('Chủ không có ?toaNhaId: quét các toà để tìm phòng; phòng không tồn tại → báo lỗi có Thử lại', async () => {
    await render(hoSoPhong('1', { vaiTro: 'CHU' }), mayChu())
    await vi.waitFor(() => expect(container.querySelector('h1')?.textContent).toBe('Phòng 101'))
    await act(async () => root!.unmount())
    root = createRoot(container)
    vi.stubGlobal('fetch', mayChu())
    await act(async () => root!.render(hoSoPhong('999', { vaiTro: 'CHU' })))
    await vi.waitFor(() => expect(container.textContent).toContain('Không thấy phòng này'))
    expect(container.textContent).toContain('Dữ liệu chưa bị thay đổi.')
  })
})
