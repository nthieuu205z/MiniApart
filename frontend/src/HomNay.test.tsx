// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ThongTinToaNha } from './api'
import HomNay, { sapHet } from './HomNay'
import { ToaDangChonProvider } from './toaDangChon'

declare global { var IS_REACT_ACT_ENVIRONMENT: boolean | undefined }

const toa = (id: number, ten: string) => ({ id, ten, maToa: `T${id}`, diaChi: '', soTang: 4, ngayChotSo: 25, soNgayHanTt: 5, maNganHang: '' }) as unknown as ThongTinToaNha
const TOA = [toa(3, 'An Nhiên Residence'), toa(5, 'Mộc Lan Home')]
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const no = (hoaDonId: number, nguoiThueId: number, hoTen: string, soPhong: string, toaNhaId: number, conLai: number, soNgayQuaHan = 40) => ({
  hoaDonId, maHoaDon: `HD-${hoaDonId}`, kyId: 1, hopDongId: hoaDonId, toaNhaId, tenToaNha: toaNhaId === 3 ? 'An Nhiên Residence' : 'Mộc Lan Home', soPhong,
  nguoiThueId, hoTenNguoiThue: hoTen, ngayPhatHanh: '2026-10-01', hanThanhToan: '2026-10-05', tongTien: String(conLai), daThu: '0.00', conLai: String(conLai), soNgayQuaHan,
})
const CONG_NO = [
  no(1, 11, 'Trần Nhỏ', '101', 3, 1_000_000), no(2, 12, 'Lê Lớn', '201', 3, 3_000_000), no(3, 12, 'Lê Lớn', '201', 3, 2_000_000), no(4, 13, 'Phạm Vừa', '102', 5, 4_000_000),
]
const hd = (id: number, soPhong: string, ngayKetThuc: string, trangThai = 'HIEU_LUC') => ({
  id, phongId: id, soPhong, nguoiThueId: id, hoTenNguoiThue: `Khách ${id}`, ngayBatDau: '2026-01-01', ngayKetThuc, giaThue: '3200000.00', tienCoc: '0', soNgayBaoTruoc: 30, trangThai, tenTrangThai: trangThai,
  sapHetHan: false, soNgayConLai: 0, dichVuApDung: [], quyetToan: null,
})
// Hôm nay cố định 22/11/2026: mốc 30 ngày = 22/12/2026.
const HOP_DONG = [hd(1, '301', '2026-12-22'), hd(2, '302', '2026-12-23'), hd(3, '303', '2026-12-02'), hd(4, '304', '2026-11-21'), hd(5, '401', '2027-05-20', 'CHO_KY'), hd(6, '305', '2026-12-10', 'DA_THANH_LY')]
const SU_CO = [{ id: 9, maYeuCau: 'SC-9', toaNha: 'An Nhiên Residence', soPhong: '403', hangMuc: 'Điều hòa', moTa: 'Làm lạnh chậm', mucDo: 'KHAN_CAP', tenMucDo: 'Khẩn cấp', trangThai: 'MOI_TIEP_NHAN', tenTrangThai: 'Mới tiếp nhận', taoLuc: '2026-11-20T10:00:00Z' }]
const DASH = {
  toaNhaId: null, tenToaNha: '', thoiDiemCapNhat: '2026-11-22T17:37:00+07:00',
  kpi: { doanhThuPhatHanh: 1000, thucThu: 500, congNoHienTai: 0, soHoaDonQuaHan: 0, tyLeLapDay: 75, tongSoPhong: 8, soPhongDangThue: 6, soPhongTrong: 1, soPhongDangSua: 1, chiPhiBaoTri: 0, soSuCoDangMo: 1 },
}
const PHONG = [{ id: 1, toaNhaId: 3, soPhong: '401', tang: 4, trangThai: 'TRONG' }, { id: 2, toaNhaId: 3, soPhong: '403', tang: 4, trangThai: 'DANG_SUA' }, { id: 3, toaNhaId: 3, soPhong: '101', tang: 1, trangThai: 'DANG_THUE' }]

type Duong = Record<string, unknown>
function dungMang(ghiDe: Duong = {}) {
  const goi: string[] = []
  const bang: Duong = {
    '/api/dashboard/chu': DASH, '/api/bao-cao/cong-no': { toaNhaId: null, tinhLuc: '', congNo: CONG_NO }, '/api/yeu-cau-sua-chua': SU_CO,
    '/api/hop-dong': HOP_DONG, '/api/toa-nha/3/phong': PHONG, '/api/toa-nha/5/phong': [], '/api/lich-hen': [], ...ghiDe,
  }
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    goi.push(url)
    const duong = url.split('?')[0]
    // hợp đồng chỉ có ở toà 3 để số liệu không nhân đôi
    const dl = duong === '/api/hop-dong' && url.includes('toaNhaId=5') ? [] : bang[duong]
    if (dl === undefined) return json({}, 404)
    return dl instanceof Response ? dl.clone() : json(dl)
  }))
  return goi
}

let container: HTMLDivElement
let root: Root
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-22T10:00:00+07:00'))
  localStorage.clear()
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.useRealTimers(); vi.unstubAllGlobals() })

async function ve(vaiTro: 'CHU' | 'QUAN_LY', ds = TOA) {
  const trang = { token: 't', vaiTro, mobile: false, thamSo: {}, dieuHuong: () => undefined }
  await act(async () => root.render(<ToaDangChonProvider token="t" vaiTro={vaiTro} search="" taiToa={async () => ds}><HomNay {...trang} /></ToaDangChonProvider>))
}
const khoi = (id: string) => container.querySelector<HTMLElement>(`section[aria-labelledby="${id}"]`)!

describe('Hôm nay · Chủ', () => {
  it('nợ quá hạn gộp theo người, xếp theo số nợ giảm dần, tổng ở meta, link tới hồ sơ người thuê', async () => {
    dungMang()
    await ve('CHU')
    await vi.waitFor(() => expect(khoi('hn-no').querySelectorAll('a.irow')).toHaveLength(3))
    const hang = [...khoi('hn-no').querySelectorAll('a.irow')]
    expect(hang.map((h) => h.querySelector('.t')?.textContent)).toEqual(['Lê Lớn', 'Phạm Vừa', 'Trần Nhỏ'])
    expect(hang.map((h) => h.getAttribute('href'))).toEqual(['/nguoi-thue/12', '/nguoi-thue/13', '/nguoi-thue/11'])
    expect(hang[0].querySelector('.money')?.textContent).toBe('5.000.000 ₫')
    expect(hang[0].textContent).toContain('2 kỳ chưa trả đủ')
    expect(khoi('hn-no').querySelector('.meta')?.textContent).toBe('3 người · 10.000.000 ₫')
    expect(khoi('hn-no').textContent).toContain('Mở Thu tiền')
    expect(container.querySelector('.strip')?.textContent).toContain('10.000.000 ₫')
    expect(container.querySelectorAll('.btn-primary')).toHaveLength(0)
  })

  it('hợp đồng sắp hết hạn: chỉ đang hiệu lực và kết thúc trong 0–30 ngày; chờ ký đếm riêng', async () => {
    expect(sapHet(HOP_DONG as never, '2026-11-22').map((h) => h.soPhong)).toEqual(['303', '301']) // 21/11 đã qua, 23/12 là 31 ngày, thanh lý bị loại
    dungMang()
    await ve('CHU')
    await vi.waitFor(() => expect(khoi('hn-hd').querySelectorAll('a.irow').length).toBeGreaterThan(0))
    const hang = [...khoi('hn-hd').querySelectorAll('a.irow')]
    expect(hang.map((h) => h.getAttribute('href'))).toEqual(['/hop-dong/3', '/hop-dong/1', '/hop-dong'])
    expect(hang[0].textContent).toContain('Còn 10 ngày')
    expect(hang[1].textContent).toContain('Còn 30 ngày')
    expect(khoi('hn-hd').querySelector('.meta')?.textContent).toBe('2 sắp hết hạn · 1 chờ ký')
  })

  it('một API lỗi chỉ làm khối đó báo lỗi (có Thử lại); các khối khác vẫn hiện', async () => {
    const goi = dungMang({ '/api/yeu-cau-sua-chua': json({ message: 'hỏng' }, 500) })
    await ve('CHU')
    await vi.waitFor(() => expect(khoi('hn-sc').textContent).toContain('Không tải được sự cố cần quyết'))
    expect(khoi('hn-sc').textContent).toContain('Dữ liệu chưa bị thay đổi.')
    expect(khoi('hn-sc').textContent).toContain('Thử lại')
    expect(khoi('hn-no').querySelectorAll('a.irow')).toHaveLength(3)
    expect(khoi('hn-hd').querySelectorAll('a.irow').length).toBeGreaterThan(0)
    // Thử lại gọi lại đúng nguồn đó
    const truoc = goi.filter((u) => u.startsWith('/api/yeu-cau-sua-chua')).length
    await act(async () => { [...khoi('hn-sc').querySelectorAll('button')].find((b) => b.textContent === 'Thử lại')!.click() })
    expect(goi.filter((u) => u.startsWith('/api/yeu-cau-sua-chua')).length).toBe(truoc + 1)
  })

  it('không ai nợ → dòng "Không ai nợ quá hạn"; phòng trống / đang sửa trỏ về hồ sơ toà', async () => {
    dungMang({ '/api/bao-cao/cong-no': { toaNhaId: null, tinhLuc: '', congNo: [] } })
    await ve('CHU')
    await vi.waitFor(() => expect(khoi('hn-no').textContent).toContain('Không ai nợ quá hạn'))
    await vi.waitFor(() => expect(khoi('hn-ph').querySelector('a.irow')?.getAttribute('href')).toBe('/toa-nha/3'))
    expect(khoi('hn-ph').textContent).toContain('Trống: 401 · Đang sửa: 403')
  })
})
