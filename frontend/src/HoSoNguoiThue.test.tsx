// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HoSoNguoiThue, { NganFormNguoiThue } from './HoSoNguoiThue'

declare global { var IS_REACT_ACT_ENVIRONMENT: boolean | undefined }

let container: HTMLDivElement
let root: Root | undefined
beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.append(container) })
afterEach(async () => { await act(async () => root?.unmount()); root = undefined; container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const huy = { id: 1, hoTen: 'Trần Quang Huy', ngaySinh: '2003-11-10', soDienThoai: '0999100001', soGiayToChe: '*********ON-1', queQuan: 'Nam Định', canhBao: [] as string[] }
const ha = { id: 2, hoTen: 'Bùi Ngọc Hà', ngaySinh: '1991-11-10', soDienThoai: '0999100067', soGiayToChe: '', queQuan: '', canhBao: ['Thiếu ảnh giấy tờ'] }

async function render(fetchMock: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>, dieuHuong?: (href: string) => void, vaiTro = 'CHU') {
  vi.stubGlobal('fetch', fetchMock)
  root = createRoot(container)
  await act(async () => root!.render(<HoSoNguoiThue token="t" vaiTro={vaiTro} dieuHuong={dieuHuong} />))
}
const lan = { id: 3, hoTen: 'Lê Văn Lan', ngaySinh: '1990-01-01', soDienThoai: '0999100003', soGiayToChe: '', queQuan: '', canhBao: [] as string[] }
const toa = { id: 7, maToa: 'T7', ten: 'An Nhiên', diaChi: 'x', soTang: 4, ngayChotSo: 25, soNgayHanTt: 5, maNganHang: '', tkNganHang: '', nguongThatThoat: '0', batBuocAnhCongTo: false }
const hd = (id: number, nguoiThueId: number, soPhong: string, ten: string, soNgayConLai: number) => ({ id, phongId: id, soPhong, nguoiThueId, hoTenNguoiThue: ten, ngayBatDau: '2026-01-01', ngayKetThuc: '2027-01-01', giaThue: '1', tienCoc: '1', soNgayBaoTruoc: 30, trangThai: 'HIEU_LUC', tenTrangThai: 'Đang hiệu lực', sapHetHan: soNgayConLai <= 30, soNgayConLai, dichVuApDung: [], quyetToan: null })
const noHuy = { hoaDonId: 11, maHoaDon: 'HD11', kyId: 1, hopDongId: 101, toaNhaId: 7, tenToaNha: 'An Nhiên', soPhong: '101', nguoiThueId: 1, hoTenNguoiThue: 'Trần Quang Huy', ngayPhatHanh: '2026-07-01', hanThanhToan: '2026-07-10', tongTien: '7580000', daThu: '0', conLai: '7580000', soNgayQuaHan: 100 }
/** Máy chủ giả: người thuê theo thứ tự `ds`; Huy (101) nợ 7.580.000, Hà (202) hết hạn sau 12 ngày, Lan không việc gì. */
const mayChu = (ds: unknown[] = [lan, ha, huy]) => vi.fn(async (input: RequestInfo | URL, _n?: RequestInit): Promise<Response> => {
  const u = String(input)
  if (u.startsWith('/api/nguoi-thue?')) return json(ds)
  if (u === '/api/toa-nha') return json([toa])
  if (u.startsWith('/api/hop-dong?')) return json([hd(101, 1, '101', 'Trần Quang Huy', 200), hd(202, 2, '202', 'Bùi Ngọc Hà', 12), hd(303, 3, '303', 'Lê Văn Lan', 200)])
  if (u.startsWith('/api/bao-cao/cong-no')) return json({ toaNhaId: null, tinhLuc: '', congNo: [noHuy] })
  if (u.startsWith('/api/hoa-don')) return json([{ hoaDonId: 11, maHoaDon: 'HD11', kyId: 1, soPhong: '101', nguoiThue: 'Trần Quang Huy', hanThanhToan: '2026-07-10', trangThai: 'QUA_HAN', tongTien: '7580000', daThu: '0', conLai: '7580000' }])
  return json({}, 404)
})
const hang = (id: number) => container.querySelector(`tr[data-tenant-row="${id}"]`)!
async function renderNgan(fetchMock: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>, id: number | null, onSaved = vi.fn()) {
  vi.stubGlobal('fetch', fetchMock)
  root = createRoot(container)
  await act(async () => root!.render(<NganFormNguoiThue token="t" id={id} onSaved={onSaved} onClose={vi.fn()} />))
  return onSaved
}
function button(prefix: string) {
  const found = [...container.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim().startsWith(prefix))
  expect(found, prefix).toBeDefined()
  return found!
}
async function setValue(input: HTMLInputElement, value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

describe('Hồ sơ người thuê', () => {
  it('dòng đầu trang nói đúng việc kế tiếp từ dữ liệu; không có nút chính', async () => {
    await render(mayChu())
    await vi.waitFor(() => expect(container.querySelector('.ma-dautrang-phu')?.textContent).toContain('1 người còn nợ 7.580.000 ₫'))
    const phu = container.querySelector('.ma-dautrang-phu')!.textContent!
    expect(phu).toContain('An Nhiên · 3 người đang thuê')
    expect(phu).toContain('1 hợp đồng hết hạn trong 30 ngày')
    expect(container.querySelector('.btn-primary')).toBeNull()
    expect(container.querySelector('.ma-dautrang-act a')?.getAttribute('href')).toBe('/hop-dong/moi')
    // bấm cụm "còn nợ" đặt chip lọc
    await act(async () => [...container.querySelectorAll<HTMLButtonElement>('.nt-phu-nut')].find((b) => b.textContent?.includes('còn nợ'))!.click())
    expect(container.querySelector('.chip[aria-pressed="true"]')?.textContent).toContain('Còn nợ')
    expect(container.querySelectorAll('tbody tr')).toHaveLength(1)
  })

  it('thứ tự: còn nợ → sắp hết hạn → còn lại; nút theo trạng thái (Ghi thu / Gia hạn / không nút)', async () => {
    await render(mayChu())
    await vi.waitFor(() => expect(container.textContent).toContain('7.580.000 ₫'))
    expect([...container.querySelectorAll('tbody tr')].map((r) => r.getAttribute('data-tenant-row'))).toEqual(['1', '2', '3'])
    expect(hang(1).querySelector('td[data-the="hanh-dong"] a')?.getAttribute('href')).toBe('/thu-tien?nguoiThueId=1')
    expect(hang(1).textContent).toContain('0999 100 001')
    expect(hang(2).querySelector('td[data-the="hanh-dong"] a')?.getAttribute('href')).toBe('/hop-dong/202')
    expect(hang(2).textContent).toContain('còn 12 ngày')
    expect(hang(3).querySelector('td[data-the="hanh-dong"] a, td[data-the="hanh-dong"] button')).toBeNull()
    expect(hang(3).textContent).toContain('Không nợ')
    expect(container.querySelector('.btn-primary')).toBeNull()
  })

  it('Quản lý không gọi /api/bao-cao/cong-no: nợ dựng từ hoá đơn của toà', async () => {
    const m = mayChu()
    await render(m, undefined, 'QUAN_LY')
    await vi.waitFor(() => expect(container.querySelector('.ma-dautrang-phu')?.textContent).toContain('1 người còn nợ 7.580.000 ₫'))
    expect(m.mock.calls.some(([u]) => String(u).startsWith('/api/bao-cao/cong-no'))).toBe(false)
  })

  it('nguồn nợ lỗi: cột Còn nợ hiện — kèm dòng báo, danh sách vẫn hiện', async () => {
    const m = vi.fn(async (input: RequestInfo | URL, n?: RequestInit) => (String(input).startsWith('/api/bao-cao/cong-no') ? json({ message: 'x' }, 500) : mayChu()(input, n)))
    await render(m)
    await vi.waitFor(() => expect(container.querySelector('[role="status"]')?.textContent).toContain('Chưa tải được công nợ'))
    expect(hang(1).querySelector('td[data-label="Còn nợ"]')?.textContent).toBe('—')
    expect(hang(1).textContent).toContain('Trần Quang Huy')
    expect(hang(1).textContent).toContain('101')
  })

  it('bấm một hàng mở hồ sơ đúng người (một lần); bấm tên là liên kết thật, không gọi điều hướng thêm', async () => {
    const dieuHuong = vi.fn()
    await render(mayChu([huy, ha]), dieuHuong)
    await vi.waitFor(() => expect(container.textContent).toContain('Trần Quang Huy'))
    await act(async () => (container.querySelector('tr[data-tenant-row="1"] td:nth-child(3)') as HTMLElement).click())
    expect(dieuHuong).toHaveBeenCalledExactlyOnceWith('/nguoi-thue/1')
    dieuHuong.mockClear()
    await act(async () => (container.querySelector('tr[data-tenant-row="2"] a') as HTMLElement).click())
    expect(dieuHuong).not.toHaveBeenCalled()
  })

  it('hiện trạng thái rỗng khi chưa có hồ sơ và khi tìm không ra', async () => {
    const fetchMock = vi.fn(async (_i: RequestInfo | URL, _n?: RequestInit) => json([]))
    await render(fetchMock)
    await vi.waitFor(() => expect(container.textContent).toContain('Chưa có hồ sơ người thuê nào trong hệ thống.'))
    await setValue(container.querySelector('input[type="search"]')!, 'zzz')
    await vi.waitFor(() => expect(container.textContent).toContain('Không tìm thấy hồ sơ người thuê nào phù hợp từ khoá.'))
  })

  it('tìm kiếm gửi từ khoá lên máy chủ', async () => {
    const fetchMock = vi.fn(async (_i: RequestInfo | URL, _n?: RequestInit) => json([huy]))
    await render(fetchMock)
    await vi.waitFor(() => expect(container.textContent).toContain('Trần Quang Huy'))
    await setValue(container.querySelector('input[type="search"]')!, 'Huy')
    await vi.waitFor(() => expect(fetchMock.mock.calls.some(([u]) => String(u) === '/api/nguoi-thue?q=Huy')).toBe(true))
  })

  it('ngăn sửa hồ sơ nạp đúng dữ liệu rồi lưu bằng PUT, báo cho nơi gọi tải lại', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = String(input)
      if (url === '/api/nguoi-thue/1' && (init?.method ?? 'GET') === 'GET') return json({ ...huy, soGiayTo: '012345678901' })
      if (url === '/api/nguoi-thue/1' && init?.method === 'PUT') return json(huy)
      return json([huy])
    })
    const onSaved = await renderNgan(fetchMock, 1)
    await vi.waitFor(() => expect(container.textContent).toContain('Chỉnh sửa hồ sơ: Trần Quang Huy'))
    const cccd = [...container.querySelectorAll<HTMLInputElement>('form input')].find((i) => i.value === '012345678901')
    expect(cccd).toBeDefined()
    await setValue([...container.querySelectorAll<HTMLInputElement>('form input')].find((i) => i.value === 'Nam Định')!, 'Hà Nội')
    await act(async () => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    const put = fetchMock.mock.calls.find(([, init]) => (init as RequestInit | undefined)?.method === 'PUT')!
    expect(put[0]).toBe('/api/nguoi-thue/1')
    expect(JSON.parse(String((put[1] as RequestInit).body))).toMatchObject({ hoTen: 'Trần Quang Huy', soGiayTo: '012345678901', queQuan: 'Hà Nội' })
    await vi.waitFor(() => expect(container.textContent).toContain('Đã cập nhật thông tin hồ sơ người thuê.'))
    expect(onSaved).toHaveBeenCalledTimes(1)
    expect(container.textContent).toContain('Ảnh giấy tờ của hồ sơ #1')
  })

  it('Thêm người thuê ở trạng thái rỗng mở ngăn form trống và gửi POST', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => init?.method === 'POST' ? json({ ...huy, id: 9 }, 201) : json([]))
    await render(fetchMock)
    await vi.waitFor(() => expect(container.textContent).toContain('Chưa có hồ sơ người thuê nào'))
    await act(async () => button('Thêm người thuê').click())
    await vi.waitFor(() => expect(container.querySelector('[role="dialog"]')?.textContent).toContain('Thêm hồ sơ người thuê mới'))
    const inputs = [...container.querySelectorAll<HTMLInputElement>('[role="dialog"] form input')]
    expect(inputs).toHaveLength(5)
    const values = ['Nguyễn Văn A', '2000-01-02', '0900000009', '079200000009', 'Hà Nam']
    for (let i = 0; i < 5; i++) await setValue(inputs[i], values[i])
    await act(async () => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    const post = fetchMock.mock.calls.find(([, init]) => (init as RequestInit | undefined)?.method === 'POST')!
    expect(post[0]).toBe('/api/nguoi-thue')
    expect(JSON.parse(String((post[1] as RequestInit).body))).toEqual({ hoTen: 'Nguyễn Văn A', ngaySinh: '2000-01-02', soDienThoai: '0900000009', soGiayTo: '079200000009', queQuan: 'Hà Nam' })
    await vi.waitFor(() => expect(container.textContent).toContain('Đã tạo hồ sơ người thuê mới thành công.'))
    // danh sách tải lại sau khi tạo
    await vi.waitFor(() => expect(fetchMock.mock.calls.filter(([u, i]) => String(u).startsWith('/api/nguoi-thue?') && (i as RequestInit | undefined)?.method === 'GET').length).toBeGreaterThan(1))
  })
})
