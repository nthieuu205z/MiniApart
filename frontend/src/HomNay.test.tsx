// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ThongTinToaNha } from './api'
import HomNay, { sapHet } from './HomNay'
import { ToaDangChonProvider } from './toaDangChon'

declare global { var IS_REACT_ACT_ENVIRONMENT: boolean | undefined }

const toa = (id: number, ten: string) => ({ id, ten, maToa: `T${id}`, diaChi: 'phố Duy Tân', soTang: 4, ngayChotSo: 25, soNgayHanTt: 5, maNganHang: '' }) as unknown as ThongTinToaNha
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
// thucThu cố tình 0: màn không được dùng nó cho "đã thu".
const DASH = {
  toaNhaId: null, tenToaNha: '', thoiDiemCapNhat: '2026-11-22T17:37:00+07:00',
  kpi: { doanhThuPhatHanh: 1000, thucThu: 0, daThuHopDong: 0, congNoHienTai: 0, soHoaDonQuaHan: 0, tyLeLapDay: 75, tongSoPhong: 8, soPhongDangThue: 6, soPhongTrong: 1, soPhongDangSua: 1, chiPhiBaoTri: 0, soSuCoDangMo: 1 },
}
const PHONG = [{ id: 1, toaNhaId: 3, soPhong: '401', tang: 4, trangThai: 'TRONG' }, { id: 2, toaNhaId: 3, soPhong: '403', tang: 4, trangThai: 'DANG_SUA' }, { id: 3, toaNhaId: 3, soPhong: '101', tang: 1, trangThai: 'DANG_THUE' }]
const hoaDon = (hoaDonId: number, ngayPhatHanh: string, tongTien: number, daThu: number, o: Record<string, unknown> = {}) => ({ hoaDonId, kyId: 7, maHoaDon: `HD-${hoaDonId}`, soPhong: '101', nguoiThue: 'Trần Nhỏ', ngayPhatHanh, hanThanhToan: ngayPhatHanh.replace(/-01$/, '-05'), trangThai: 'DA_PHAT_HANH', tongTien: String(tongTien), daThu: String(daThu), conLai: String(tongTien - daThu), ...o })
// Tháng 10: 400+3000 / 1000+3000 = 85%. Tháng 11: đã thu 500, 1 hoá đơn đã gửi + 1 nháp (không tính).
const HOA_DON = [hoaDon(21, '2026-10-01', 1000, 400), hoaDon(22, '2026-10-01', 3000, 3000), hoaDon(23, '2026-11-01', 2000, 500), hoaDon(24, '2026-11-01', 9000, 0, { trangThai: 'NHAP' })]
const KY = [{ id: 7, nam: 2026, thang: 11, ngayBatDau: '2026-10-26', ngayKetThuc: '2026-11-25', trangThai: 'DANG_MO' }]

type Duong = Record<string, unknown>
function dungMang(ghiDe: Duong = {}) {
  const goi: { url: string; method?: string }[] = []
  const bang: Duong = {
    '/api/dashboard/chu': DASH, '/api/bao-cao/cong-no': { toaNhaId: null, tinhLuc: '', congNo: CONG_NO }, '/api/yeu-cau-sua-chua': SU_CO,
    '/api/hop-dong': HOP_DONG, '/api/toa-nha/3/phong': PHONG, '/api/toa-nha/5/phong': [], '/api/lich-hen': [], '/api/hoa-don': HOA_DON,
    '/api/toa-nha/3/ky-thanh-toan': KY, '/api/toa-nha/5/ky-thanh-toan': [], '/api/toa-nha/3/ky-thanh-toan/7/thieu-chi-so': [{ id: 1, soPhong: '101', tang: 1 }],
    '/api/nguoi-thue': [{ id: 12, hoTen: 'Lê Lớn', soDienThoai: '0999100012' }], ...ghiDe,
  }
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    goi.push({ url, method: init?.method })
    const duong = url.split('?')[0]
    // dữ liệu theo toà chỉ có ở toà 3 để số liệu không nhân đôi
    const dl = (duong === '/api/hop-dong' || duong === '/api/hoa-don') && url.includes('toaNhaId=5') ? [] : bang[duong]
    if (duong === '/api/bao-cao/cong-no' && url.includes('toaNhaId=3') && !(ghiDe[duong] instanceof Response)) return json({ toaNhaId: 3, tinhLuc: '', congNo: (dl as { congNo: { toaNhaId: number }[] }).congNo.filter((c) => c.toaNhaId === 3) })
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

async function ve(vaiTro: 'CHU' | 'QUAN_LY', ds = TOA, search = '') {
  const trang = { token: 't', vaiTro, mobile: false, thamSo: {}, dieuHuong: () => undefined }
  await act(async () => root.render(<ToaDangChonProvider token="t" vaiTro={vaiTro} search={search} taiToa={async () => ds}><HomNay {...trang} /></ToaDangChonProvider>))
}
const khoi = (id: string) => container.querySelector<HTMLElement>(`section[aria-labelledby="${id}"]`)!
const oSo = () => [...container.querySelectorAll('.ma-oso')].map((o) => o.textContent ?? '')
const dongViec = (id: string) => [...khoi(id).querySelectorAll('.ma-dongviec')].map((d) => d.textContent ?? '')

describe('Hôm nay · Chủ', () => {
  it('4 ô số: "Tháng trước đã thu" tính từ hoá đơn (thucThu = 0 vẫn ra 85%), tháng này bỏ hoá đơn nháp; không có nút chính', async () => {
    dungMang()
    await ve('CHU')
    await vi.waitFor(() => expect(oSo()[2]).toContain('85%'))
    const o = oSo()
    expect(o).toHaveLength(4)
    expect(o[0]).toContain('10.000.000 ₫')
    expect(o[0]).toContain('3 người nợ · 4 hoá đơn, đều quá hạn trên 30 ngày')
    expect(o[1]).toContain('Hoá đơn tháng 11 đã thu'); expect(o[1]).toContain('500 ₫'); expect(o[1]).toContain('mới gửi 1 hoá đơn')
    expect(o[2]).toContain('Tháng 10 đã thu'); expect(o[2]).toContain('3.400 / 4.000 ₫')
    expect(o[3]).toContain('6 / 8')
    expect(container.querySelectorAll('.btn-primary')).toHaveLength(0)
    expect(container.querySelector('h1')?.textContent).toBe('Hôm nay')
  })

  it('"Ai đang nợ": người nợ nhiều nhất trước, Gọi chỉ khi có SĐT, chân khối và link Xem cả N người', async () => {
    dungMang()
    await ve('CHU')
    await vi.waitFor(() => expect(khoi('hn-no').querySelectorAll('.ma-nguoino')).toHaveLength(3))
    const hang = [...khoi('hn-no').querySelectorAll('.ma-nguoino')]
    expect(hang.map((h) => h.querySelector('.ma-nguoino-ten a')?.textContent)).toEqual(['Lê Lớn', 'Phạm Vừa', 'Trần Nhỏ'])
    expect(hang[0].querySelector('.ma-nguoino-so')?.textContent).toBe('5.000.000 ₫')
    await vi.waitFor(() => expect(hang[0].querySelector('a[href="tel:0999100012"]')).not.toBeNull())
    expect(hang[1].querySelector('a[href^="tel:"]')).toBeNull()
    expect(khoi('hn-no').querySelector('.meta')?.textContent).toBe('3 người')
    expect(khoi('hn-no').textContent).toContain('Hiện 3 người nợ nhiều nhất trong 3 người')
    expect(khoi('hn-no').querySelector('a[href="/thu-tien"]')?.textContent).toContain('Xem cả 3 người')
  })

  it('"Cần quyết hôm nay" chỉ hiện dòng có dữ liệu, đúng thứ tự', async () => {
    dungMang()
    await ve('CHU')
    await vi.waitFor(() => expect(dongViec('hn-qd').length).toBeGreaterThan(0))
    const d = dongViec('hn-qd')
    expect(d).toHaveLength(4)
    expect(d[0]).toContain('Hoá đơn tháng 11 chưa gửi'); expect(d[0]).toContain('Kỳ đóng ngày 25/11'); expect(d[0]).toContain('An Nhiên Residence còn ở bước ghi chỉ số')
    expect(d[1]).toContain('1 sự cố khẩn chưa giao thợ'); expect(d[1]).toContain('Điều hòa phòng 403')
    expect(d[2]).toContain('2 hợp đồng hết hạn 02/12/2026'); expect(d[2]).toContain('Còn 10 ngày')
    expect(d[3]).toContain('1 hợp đồng chờ ký')
    expect(khoi('hn-qd').querySelector('.meta')?.textContent).toBe('4 việc')
    expect([...khoi('hn-qd').querySelectorAll('a.btn')].map((a) => a.getAttribute('href'))).toEqual(['/chu-ky?toaNhaId=3', '/su-co?id=9', '/hop-dong/3', '/hop-dong'])
    expect(sapHet(HOP_DONG as never, '2026-11-22').map((h) => h.soPhong)).toEqual(['303', '301']) // 21/11 đã qua, 23/12 là 31 ngày, thanh lý bị loại
  })

  it('không có gì cần quyết → một câu; không ai nợ → "Không ai còn nợ." + link hoá đơn tháng trước', async () => {
    dungMang({ '/api/bao-cao/cong-no': { toaNhaId: null, tinhLuc: '', congNo: [] }, '/api/yeu-cau-sua-chua': [], '/api/hop-dong': [], '/api/toa-nha/3/ky-thanh-toan': [] })
    await ve('CHU')
    await vi.waitFor(() => expect(khoi('hn-qd').textContent).toContain('Không có việc cần quyết hôm nay.'))
    expect(khoi('hn-qd').querySelectorAll('.ma-dongviec')).toHaveLength(0)
    await vi.waitFor(() => expect(khoi('hn-no').textContent).toContain('Không ai còn nợ.'))
    expect(khoi('hn-no').querySelector('a')?.getAttribute('href')).toBe('/thu-tien?tab=hoa-don')
  })

  it('Tất cả toà có khối "Theo toà" (bấm tên → /toa-nha/:id); chọn một toà thì bỏ khối và lọc số liệu', async () => {
    dungMang()
    await ve('CHU')
    await vi.waitFor(() => expect(khoi('hn-tt').querySelectorAll('tbody tr')).toHaveLength(2))
    const hang = [...khoi('hn-tt').querySelectorAll('tbody tr')]
    expect(hang[0].querySelector('a')?.getAttribute('href')).toBe('/toa-nha/3')
    expect(hang[0].textContent).toContain('6.000.000 ₫'); expect(hang[0].textContent).toContain('2 người')
    expect(hang[1].textContent).toContain('4.000.000 ₫')
    await act(async () => root.unmount())
    root = createRoot(container)
    await ve('CHU', TOA, '?toaNhaId=3')
    await vi.waitFor(() => expect(oSo()[0]).toContain('6.000.000 ₫'))
    expect(container.querySelector('section[aria-labelledby="hn-tt"]')).toBeNull()
  })

  it('một API lỗi: khối vẫn hiện phần còn lại, báo lỗi trong khối kèm "Tải lại" gọi lại đúng nguồn', async () => {
    const goi = dungMang({ '/api/yeu-cau-sua-chua': json({ message: 'hỏng' }, 500) })
    await ve('CHU')
    await vi.waitFor(() => expect(khoi('hn-qd').querySelector('[role="alert"]')).not.toBeNull())
    expect(khoi('hn-qd').querySelector('[role="alert"]')?.textContent).toContain('Tải lại')
    expect(khoi('hn-no').querySelectorAll('.ma-nguoino')).toHaveLength(3)
    const truoc = goi.filter((g) => g.url.startsWith('/api/yeu-cau-sua-chua')).length
    await act(async () => { [...khoi('hn-qd').querySelectorAll('button')].find((b) => b.textContent === 'Tải lại')!.click() })
    expect(goi.filter((g) => g.url.startsWith('/api/yeu-cau-sua-chua')).length).toBe(truoc + 1)
  })
})

describe('Hôm nay · Quản lý', () => {
  const DASH_QL = {
    toaNhaId: 3, tenToaNha: 'An Nhiên Residence', thoiDiemCapNhat: '2026-11-22T17:37:00+07:00',
    kpi: { khoanConPhaiThu: 50398000, soHoaDonQuaHan: 20, tienQuaHan: 50398000, soPhongDangThue: 9, soPhongTrong: 2, soPhongDangSua: 1, tongSoPhong: 12, tyLeLapDay: 75, soCongToChuaGhi: 9, soSuCoCanXuLy: 14, soCanhBaoDienNuocDangMo: 0 },
    canhBaoDienNuoc: [],
    congToChuaGhi: { kyHienTaiId: 5, tenKyHienTai: 'Kỳ 11/2026', tongSoCongTo: 24, soCongToDaGhi: 20, soCongToChuaGhi: 9, danhSachChuaGhi: [] },
    lichHenSapToi: [
      { id: 2, hoTen: 'Bùi Thảo Nguyên', soDienThoai: '0999100151', soPhong: '402 (An Nhiên Residence)', thoiGian: '2026-11-23T10:00:00Z', loai: 'XEM_PHONG', trangThai: 'DA_XAC_NHAN' },
      { id: 3, hoTen: 'Đỗ Nhật Quang', soDienThoai: '0999100152', soPhong: '402 (An Nhiên Residence)', thoiGian: '2026-11-24T11:00:00Z', loai: 'XEM_PHONG', trangThai: 'CHO_XAC_NHAN' },
      { id: 4, hoTen: 'Đã Huỷ', soDienThoai: '0999100153', soPhong: '402 (An Nhiên Residence)', thoiGian: '2026-11-25T11:00:00Z', loai: 'XEM_PHONG', trangThai: 'HUY' },
    ],
  }
  const HD_QL = [{ ...hoaDon(31, '2026-10-01', 4000000, 0, { nguoiThue: 'Khách 303', soPhong: '303', trangThai: 'QUA_HAN' }) }]
  const SU_CO_QL = [...SU_CO, { ...SU_CO[0], id: 10, hangMuc: 'Cấp thoát nước', soPhong: '102', mucDo: 'BINH_THUONG', trangThai: 'DA_TIEP_NHAN', tenTrangThai: 'Đã tiếp nhận' }]
  const duongQl = { '/api/dashboard/quan-ly': DASH_QL, '/api/hoa-don': HD_QL, '/api/yeu-cau-sua-chua': SU_CO_QL, '/api/toa-nha/3/bang-viec': { toaNhaId: 3, tenToaNha: 'An Nhiên Residence', nhomViec: [{ ma: 'PCCC', tieuDe: 'PCCC', soLuong: null, trangThai: 'CAN_XU_LY', tenTrangThai: 'Cần xử lý', khanCap: false, lienKet: null }] } }

  it('không gọi API của Chủ (403); nút chính "Ghi K công tơ còn thiếu" lấy K từ thieu-chi-so (không phải congToChuaGhi = 9)', async () => {
    const goi = dungMang(duongQl)
    await ve('QUAN_LY', [TOA[0]])
    await vi.waitFor(() => expect(container.querySelector('.btn-primary')?.textContent).toBe('Ghi 1 công tơ còn thiếu'))
    expect(goi.some((g) => g.url.startsWith('/api/dashboard/chu') || g.url.startsWith('/api/bao-cao/cong-no'))).toBe(false)
    expect(container.querySelectorAll('.btn-primary')).toHaveLength(1)
    expect(container.querySelector('.btn-primary')?.getAttribute('href')).toBe('/chu-ky')
    expect(container.textContent).toContain('theo bảng chỉ số')
    expect(container.querySelector('[role="alert"].hn-bang')).toBeNull() // 22/11 chưa tới ngày đóng kỳ 25/11
  })

  it('sau ngày đóng kỳ mà còn công tơ thiếu → băng "Tháng 11 đang trễ"', async () => {
    vi.setSystemTime(new Date('2026-11-27T10:00:00+07:00'))
    dungMang(duongQl)
    await ve('QUAN_LY', [TOA[0]])
    await vi.waitFor(() => expect(container.querySelector('.hn-bang')).not.toBeNull())
    expect(container.querySelector('.hn-bang')?.textContent).toBe('Tháng 11 đang trễ: kỳ đóng ngày 25/11/2026 nhưng còn 1 công tơ chưa ghi (phòng 101), nên chưa gửi được hoá đơn.')
  })

  it('thanh 4 bước có link /chu-ky?b=; việc cần làm theo thứ tự (nợ, sự cố khẩn/thường, hợp đồng, chờ ký, PCCC)', async () => {
    dungMang(duongQl)
    await ve('QUAN_LY', [TOA[0]])
    await vi.waitFor(() => expect(dongViec('hn-vc').length).toBeGreaterThan(4))
    expect([...container.querySelectorAll('ol.ma-buoc a')].map((a) => a.getAttribute('href'))).toEqual(['/chu-ky?b=1', '/chu-ky?b=2', '/chu-ky?b=3', '/chu-ky?b=4'])
    const d = dongViec('hn-vc')
    expect(d[0]).toContain('1 người nợ quá hạn, 4.000.000 ₫'); expect(d[0]).toContain('Nhiều nhất: Khách 303, phòng 303, 4.000.000 ₫')
    expect(d[1]).toContain('Điều hòa phòng 403 (khẩn)'); expect(d[2]).toContain('Cấp thoát nước phòng 102')
    expect(d.some((x) => x.includes('Hợp đồng phòng 303 hết hạn 02/12/2026'))).toBe(true)
    expect(d.some((x) => x.includes('1 hợp đồng chờ ký'))).toBe(true)
    expect(d[d.length - 1]).toContain('Bình chữa cháy quá hạn kiểm định')
  })

  it('lịch xem phòng: chờ xác nhận có nút "Xác nhận" (PATCH sẵn có), đã hẹn có nhãn, đã huỷ bị ẩn', async () => {
    const goi = dungMang({ ...duongQl, '/api/lich-hen/3/trang-thai': new Response(null, { status: 204 }) })
    await ve('QUAN_LY', [TOA[0]])
    await vi.waitFor(() => expect(khoi('hn-lq').textContent).toContain('Đỗ Nhật Quang'))
    expect(khoi('hn-lq').textContent).toContain('0999 100 152')
    expect(khoi('hn-lq').textContent).toContain('23/11 · 10:00 · phòng 402')
    expect(khoi('hn-lq').textContent).toContain('Đã hẹn')
    expect(khoi('hn-lq').textContent).not.toContain('Đã Huỷ')
    await act(async () => { [...khoi('hn-lq').querySelectorAll('button')].find((b) => b.textContent === 'Xác nhận')!.click() })
    expect(goi.find((g) => g.method === 'PATCH')?.url).toBe('/api/lich-hen/3/trang-thai')
  })
})
