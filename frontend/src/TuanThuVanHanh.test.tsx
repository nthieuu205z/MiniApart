// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AnToanVanHanh, CuTruVanHanh, NhatKyVanHanh } from './TuanThuVanHanh'

declare global { var IS_REACT_ACT_ENVIRONMENT: boolean | undefined }

let container: HTMLDivElement
let root: Root | undefined
beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.append(container) })
afterEach(async () => { await act(async () => root?.unmount()); root = undefined; container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } })

const cuTru = [
  { nguoiThueId: 1, phongId: 1, soPhong: '101', hoTen: 'Trần Quang Huy', ngaySinh: '2003-11-10', soDienThoai: '0999100001', soGiayToChe: '*********ON-1', trangThaiLuuTru: 'CHUA_KHAI_BAO', ngayKhaiBao: null, ngayVaoO: '2026-05-01', canhBaoQuaHan: true },
  { nguoiThueId: 3, phongId: 2, soPhong: '102', hoTen: 'Lê Thu Trang', ngaySinh: '2002-11-10', soDienThoai: '0999100002', soGiayToChe: '*********ON-2', trangThaiLuuTru: 'DA_DANG_KY_TAM_TRU', ngayKhaiBao: '2026-05-02', ngayVaoO: '2026-05-01', canhBaoQuaHan: false },
]
const nhatKy = {
  items: [
    { id: 442, nguoiDungId: 51, hoTen: 'Bùi Tuấn Kiệt', hanhDong: 'THANH_LY_HOP_DONG', doiTuong: 'HOP_DONG:55', giaTriTruoc: 'HIEU_LUC', giaTriSau: 'DA_THANH_LY;bienBanId=40', lyDo: 'Hai bên xác nhận chi phí', thoiDiem: '2026-11-21T00:56:38.498328' },
    { id: 256, nguoiDungId: 31, hoTen: '', hanhDong: 'DOI_GIA', doiTuong: 'PHONG:3', giaTriTruoc: null, giaTriSau: null, lyDo: null, thoiDiem: '2026-11-20T10:00:00' },
  ],
  total: 120, page: 0, size: 50,
}
const pccc = {
  chuKyThang: 6, ngayKiemTraTiep: '2026-11-18', soViecDenHan: 2,
  hoSo: [{ id: 5, phanLoai: 'BIEN_BAN_KIEM_TRA', ten: 'Biên bản 2026', tenTep: 'bb.pdf', taoLuc: '2026-01-01T00:00:00' }],
  thietBi: [{ id: 1, ten: 'Bình chữa cháy bột 4 kg', viTri: 'Chiếu nghỉ tầng 1', hanKiemDinh: '2026-11-15' }, { id: 2, ten: 'Đèn chỉ dẫn thoát hiểm', viTri: 'Chiếu nghỉ tầng 2', hanKiemDinh: '2027-02-18' }],
  kiemTra: [{ id: 1, ngayKiemTra: '2026-11-06', dat: false, hangMuc: [{ ten: 'Lối thoát hiểm thông thoáng', dat: true, ghiChu: 'Không để xe' }, { ten: 'Bình chữa cháy còn hạn', dat: false, ghiChu: 'Cần kiểm định lại' }] }],
}

describe('Cư trú', () => {
  it('liệt kê từng người cư trú với phòng, giấy tờ, ngày vào ở và cảnh báo quá hạn', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => String(input) === '/api/toa-nha' ? json([{ id: 3, ten: 'Toà C' }]) : json(cuTru)))
    root = createRoot(container)
    await act(async () => root!.render(<CuTruVanHanh token="t" />))
    await vi.waitFor(() => expect(container.textContent).toContain('Trần Quang Huy'))
    expect(container.textContent).toContain('Lê Thu Trang')
    expect(container.textContent).toContain('101')
    expect(container.textContent).toContain('*********ON-1')
    expect(container.textContent).toContain('2026-05-01')
    expect(container.textContent).toContain('Đã quá hạn khai báo lưu trú')
    expect(container.textContent?.match(/Đã quá hạn khai báo lưu trú/g)).toHaveLength(1)
    expect(container.textContent).toContain('Xuất danh sách cư trú')
  })

  it('cập nhật lưu trú gửi PUT đúng người, khai báo có ngày', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input) === '/api/toa-nha') return json([{ id: 3, ten: 'Toà C' }])
      if (init?.method === 'PUT') return new Response(null, { status: 204 })
      return json(cuTru)
    })
    vi.stubGlobal('fetch', fetchMock)
    root = createRoot(container)
    await act(async () => root!.render(<CuTruVanHanh token="t" />))
    await vi.waitFor(() => expect(container.textContent).toContain('Lê Thu Trang'))
    const nut = [...container.querySelectorAll<HTMLButtonElement>('button')].filter((b) => b.textContent?.startsWith('Cập nhật lưu trú'))
    expect(nut).toHaveLength(2)
    await act(async () => nut[1].click())
    const call = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT')
    expect(call?.[0]).toBe('/api/toa-nha/3/cu-tru/3')
    expect(JSON.parse(String(call?.[1]?.body))).toEqual({ trangThaiLuuTru: 'DA_DANG_KY_TAM_TRU', ngayKhaiBao: '2026-05-02' })
  })
})

describe('Nhật ký thao tác', () => {
  it('hiện từng thao tác với người làm, đối tượng, giá trị trước/sau, lý do và tổng số', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(nhatKy)))
    root = createRoot(container)
    await act(async () => root!.render(<NhatKyVanHanh token="t" />))
    await vi.waitFor(() => expect(container.textContent).toContain('Bùi Tuấn Kiệt'))
    expect(container.textContent).toContain('120 thao tác phù hợp')
    expect(container.textContent).toContain('THANH_LY_HOP_DONG')
    expect(container.textContent).toContain('HOP_DONG:55')
    expect(container.textContent).toContain('HIEU_LUC')
    expect(container.textContent).toContain('DA_THANH_LY;bienBanId=40')
    expect(container.textContent).toContain('Hai bên xác nhận chi phí')
    expect(container.textContent).toContain('Người dùng #31')
    expect(container.textContent).toContain('—')
  })

  it('lọc gửi đúng tham số và phân trang theo máy chủ', async () => {
    const fetchMock = vi.fn(async () => json(nhatKy))
    vi.stubGlobal('fetch', fetchMock)
    root = createRoot(container)
    await act(async () => root!.render(<NhatKyVanHanh token="t" />))
    await vi.waitFor(() => expect(container.textContent).toContain('Bùi Tuấn Kiệt'))
    const loai = [...container.querySelectorAll<HTMLInputElement>('input')].find((i) => i.closest('label')?.textContent?.includes('Loại thao tác'))!
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(loai, 'DOI_GIA')
      loai.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    await vi.waitFor(() => expect(String((fetchMock.mock.calls.at(-1) as unknown[])[0])).toContain('hanhDong=DOI_GIA'))
    const sau = [...container.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === 'Trang sau')!
    await act(async () => sau.click())
    await vi.waitFor(() => expect(String((fetchMock.mock.calls.at(-1) as unknown[])[0])).toContain('page=1'))
  })
})

describe('An toàn', () => {
  it('chủ toà thấy hồ sơ, thiết bị với hạn kiểm định, kết quả kiểm tra và các form chỉnh sửa', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => String(input) === '/api/toa-nha' ? json([{ id: 3, ten: 'Toà C' }]) : json(pccc)))
    root = createRoot(container)
    await act(async () => root!.render(<AnToanVanHanh token="t" vaiTro="CHU" />))
    await vi.waitFor(() => expect(container.textContent).toContain('2 việc đến hạn'))
    expect(container.textContent).toContain('2026-11-18')
    expect(container.textContent).toContain('Biên bản 2026')
    expect(container.textContent).toContain('Tải bb.pdf')
    expect(container.textContent).toContain('Bình chữa cháy bột 4 kg')
    expect(container.textContent).toContain('Chiếu nghỉ tầng 2')
    expect(container.textContent).toContain('2027-02-18')
    expect(container.textContent).toContain('Sửa thiết bị')
    expect(container.textContent).toContain('Có hạng mục chưa đạt')
    expect(container.textContent).toContain('Cần kiểm định lại')
    expect(container.textContent).toContain('Lưu hồ sơ PCCC')
    expect(container.textContent).toContain('Thêm thiết bị')
    expect(container.textContent).toContain('Lưu lịch kiểm tra')
    expect(container.textContent).toContain('Ghi kết quả kiểm tra')
  })
})
