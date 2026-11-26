// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ChuKyThang from './ChuKyThang'
import { ToaDangChonProvider } from './toaDangChon'

declare global { var IS_REACT_ACT_ENVIRONMENT: boolean | undefined }

let container: HTMLDivElement
let root: Root
const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
const KY = { id: 8, nam: 2026, thang: 8, ngayBatDau: '2026-07-26', ngayKetThuc: '2026-08-25' }
const hd = (id: number, trangThai: string, conLai = '0') => ({ hoaDonId: id, kyId: 8, trangThai, conLai, tongTien: '1000000', daThu: '0', soPhong: String(100 + id), nguoiThue: `Người ${id}`, hanThanhToan: '2030-01-01' })

type Du = { trangThai: string; thieu: unknown[]; hoaDon: unknown[] }
function dungMock(du: Du) {
  const goi: { url: string; method: string }[] = []
  const mock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input); const method = init?.method ?? 'GET'
    goi.push({ url, method })
    if (url === '/api/toa-nha') return json([{ id: 1, ten: 'Toà A' }])
    if (url === '/api/toa-nha/1/ky-thanh-toan') return json([{ ...KY, trangThai: du.trangThai }])
    if (url.endsWith('/thieu-chi-so')) return json(du.thieu)
    if (url.endsWith('/chi-so')) return json({ tongPhong: 9, daGhi: 9 - du.thieu.length, phong: [] })
    if (url.startsWith('/api/hop-dong?')) return json([{ id: 1, soPhong: '101', nguoiThueId: 77, hoTenNguoiThue: 'Người 1', sapHetHan: false }])
    if (url.startsWith('/api/hoa-don?')) return json(du.hoaDon)
    if (method === 'POST') return json(url.endsWith('/chot') ? { kyThanhToan: KY } : { soHoaDonTaoMoi: 3, soHoaDonDaPhatHanh: 3, lyDoBoQua: [] })
    return json([])
  })
  vi.stubGlobal('fetch', mock)
  return goi
}
async function mo(search = '') {
  window.history.replaceState({}, '', `/chu-ky${search}`)
  await act(async () => {
    root = createRoot(container)
    root.render(<ToaDangChonProvider token="t" vaiTro="QUAN_LY" search="">
      <ChuKyThang token="t" vaiTro="QUAN_LY" mobile={false} thamSo={{}} dieuHuong={() => undefined} />
    </ToaDangChonProvider>)
  })
  await act(async () => { await new Promise((r) => setTimeout(r, 20)) })
}
const nut = (nhan: string) => [...container.querySelectorAll('button')].find((b) => b.textContent?.includes(nhan))!
const chinh = () => [...container.querySelectorAll('.btn-primary')]

describe('ChuKyThang', () => {
  beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.appendChild(container) })
  afterEach(async () => { await act(async () => root?.unmount()); container.remove(); vi.unstubAllGlobals(); window.history.replaceState({}, '', '/') })

  it('h1 là "Tháng 8/2026" và mở đúng bước theo dữ liệu: đủ công tơ chưa khoá → bước 2', async () => {
    dungMock({ trangThai: 'DANG_MO', thieu: [], hoaDon: [] })
    await mo()
    expect(container.querySelector('h1')?.textContent).toBe('Tháng 8/2026')
    expect(container.querySelector('li[aria-current="step"]')?.textContent).toContain('Khoá chỉ số')
    expect(chinh().map((b) => b.textContent)).toEqual(['Khoá chỉ số tháng 8'])
  })

  it('mỗi bước có đúng một nút chính với nhãn việc', async () => {
    const nhan = async (du: Du, search: string) => { dungMock(du); await mo(search); const r = chinh().map((b) => b.textContent?.trim()); await act(async () => root.unmount()); return r }
    expect(await nhan({ trangThai: 'DANG_MO', thieu: [{ id: 5, soPhong: '101', tang: 1 }], hoaDon: [] }, '?b=2')).toEqual(['Khoá chỉ số tháng 8'])
    expect(await nhan({ trangThai: 'DA_CHOT', thieu: [], hoaDon: [] }, '?b=3')).toEqual(['Tạo hoá đơn nháp'])
    expect(await nhan({ trangThai: 'DA_CHOT', thieu: [], hoaDon: [hd(1, 'NHAP'), hd(2, 'NHAP')] }, '?b=3')).toEqual(['Gửi 2 hoá đơn · 2.000.000 ₫'])
    expect(await nhan({ trangThai: 'DA_CHOT', thieu: [], hoaDon: [hd(1, 'DA_PHAT_HANH', '500000')] }, '?b=4')).toEqual(['Ghi thu tiền'])
  })

  it('xem ?b=3 khi dữ liệu đang ở bước 1: có nhãn minh hoạ, nút chính bị chặn, không dựng số giả', async () => {
    dungMock({ trangThai: 'DANG_MO', thieu: [{ id: 5, soPhong: '101', tang: 1 }], hoaDon: [] })
    await mo('?b=3')
    expect(container.querySelector('.ma-nhanmh')?.textContent).toBe('minh hoạ')
    expect(container.textContent).toContain('Dữ liệu thật đang ở bước 1')
    const n = chinh()[0]
    expect(n.getAttribute('aria-disabled')).toBe('true')
    expect(container.textContent).toContain('Chưa có hoá đơn nháp')
  })

  it('b=2 thiếu công tơ: nút khoá bị chặn kèm lý do, danh sách điều kiện báo phòng thiếu', async () => {
    dungMock({ trangThai: 'DANG_MO', thieu: [{ id: 5, soPhong: '101', tang: 1 }], hoaDon: [] })
    await mo('?b=2')
    expect(nut('Khoá chỉ số tháng 8').getAttribute('aria-disabled')).toBe('true')
    expect(container.textContent).toContain('Còn 1 công tơ chưa ghi chỉ số')
    expect(container.textContent).toContain('Còn thiếu phòng 101')
  })

  it('b=2 đủ công tơ: bấm → hộp xác nhận → POST đúng URL chốt', async () => {
    const goi = dungMock({ trangThai: 'DANG_MO', thieu: [], hoaDon: [] })
    await mo('?b=2')
    await act(async () => { nut('Khoá chỉ số tháng 8').click() })
    const hop = container.querySelector('[role="dialog"]')!
    expect(hop.textContent).toContain('Khoá chỉ số tháng 8?')
    expect(hop.textContent).toContain('Sau khi khoá không sửa được chỉ số của 9 phòng.')
    expect(hop.textContent).toContain('Chưa, xem lại')
    await act(async () => { (hop.querySelector('.btn-primary') as HTMLElement).click() })
    expect(goi).toContainEqual({ url: '/api/toa-nha/1/ky-thanh-toan/8/chot', method: 'POST' })
  })

  it('b=3 chưa có nháp → tạo nháp; có nháp → gửi (có xác nhận, đúng kyId)', async () => {
    let goi = dungMock({ trangThai: 'DA_CHOT', thieu: [], hoaDon: [] })
    await mo('?b=3')
    await act(async () => { nut('Tạo hoá đơn nháp').click() })
    expect(goi).toContainEqual({ url: '/api/toa-nha/1/ky-thanh-toan/8/hoa-don/tao-hang-loat', method: 'POST' })
    await act(async () => root.unmount())
    goi = dungMock({ trangThai: 'DA_CHOT', thieu: [], hoaDon: [hd(1, 'NHAP'), hd(2, 'NHAP'), hd(3, 'NHAP')] })
    await mo('?b=3')
    expect(container.textContent).toContain('Sẽ gửi 3 hoá đơn')
    await act(async () => { nut('Gửi 3 hoá đơn').click() })
    expect(container.querySelector('[role="dialog"]')?.textContent).toContain('Gửi 3 hoá đơn tháng 8?')
    await act(async () => { (container.querySelector('[role="dialog"] .btn-primary') as HTMLElement).click() })
    expect(goi).toContainEqual({ url: '/api/toa-nha/1/ky-thanh-toan/8/hoa-don/phat-hanh-hang-loat', method: 'POST' })
  })

  it('b=4: một nút chính, link Ghi thu tới /thu-tien?nguoiThueId=', async () => {
    dungMock({ trangThai: 'DA_CHOT', thieu: [], hoaDon: [hd(1, 'DA_PHAT_HANH', '500000'), hd(2, 'DA_THANH_TOAN')] })
    await mo('?b=4')
    expect(chinh()).toHaveLength(1)
    expect(container.textContent).toContain('500.000')
    expect(container.querySelector('a[href="/thu-tien?nguoiThueId=77"]')?.textContent).toBe('Ghi thu')
    expect(container.textContent).toContain('Nhắc 1 người chưa trả')
  })
})
