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
const hd = (id: number, trangThai: string, conLai = '0') => ({ hoaDonId: id, kyId: 8, trangThai, conLai })

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
const chinh = () => container.querySelectorAll('.btn-primary').length

describe('ChuKyThang', () => {
  beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.appendChild(container) })
  afterEach(async () => { await act(async () => root?.unmount()); container.remove(); vi.unstubAllGlobals(); window.history.replaceState({}, '', '/') })

  it('mở đúng bước theo dữ liệu: đủ công tơ chưa chốt → bước 2', async () => {
    dungMock({ trangThai: 'DANG_MO', thieu: [], hoaDon: [] })
    await mo()
    expect(container.querySelector('[aria-current="step"]')?.textContent).toContain('Chốt kỳ')
    expect(container.querySelector('h1')?.textContent).toBe('Chu kỳ tháng 08/2026')
    expect(chinh()).toBe(1)
  })

  it('b=2 thiếu công tơ: nút chốt bị khoá kèm lý do', async () => {
    dungMock({ trangThai: 'DANG_MO', thieu: [{ id: 5, soPhong: '101', tang: 1 }], hoaDon: [] })
    await mo('?b=2')
    expect(nut('Chốt kỳ 08/2026').getAttribute('aria-disabled')).toBe('true')
    expect(container.textContent).toContain('Còn 1 công tơ chưa ghi')
  })

  it('b=2 đủ công tơ: bấm → hộp xác nhận → POST đúng URL chốt', async () => {
    const goi = dungMock({ trangThai: 'DANG_MO', thieu: [], hoaDon: [] })
    await mo('?b=2')
    await act(async () => { nut('Chốt kỳ 08/2026').click() })
    expect(container.querySelector('[role="dialog"]')?.textContent).toContain('không sửa được nữa')
    await act(async () => { (container.querySelector('[role="dialog"] .btn-primary') as HTMLElement).click() })
    expect(goi).toContainEqual({ url: '/api/toa-nha/1/ky-thanh-toan/8/chot', method: 'POST' })
  })

  it('b=3 chưa có nháp → tạo nháp; có nháp → phát hành (có xác nhận)', async () => {
    let goi = dungMock({ trangThai: 'DA_CHOT', thieu: [], hoaDon: [] })
    await mo('?b=3')
    expect(chinh()).toBe(1)
    await act(async () => { nut('Tạo nháp hoá đơn').click() })
    expect(goi).toContainEqual({ url: '/api/toa-nha/1/ky-thanh-toan/8/hoa-don/tao-hang-loat', method: 'POST' })
    await act(async () => root.unmount())
    goi = dungMock({ trangThai: 'DA_CHOT', thieu: [], hoaDon: [hd(1, 'NHAP'), hd(2, 'NHAP'), hd(3, 'NHAP')] })
    await mo('?b=3')
    await act(async () => { nut('Phát hành 3 hoá đơn').click() })
    await act(async () => { (container.querySelector('[role="dialog"] .btn-primary') as HTMLElement).click() })
    expect(goi).toContainEqual({ url: '/api/toa-nha/1/ky-thanh-toan/8/hoa-don/phat-hanh-hang-loat', method: 'POST' })
  })

  it('b=4 chỉ một nút chính, link tới Thu tiền', async () => {
    dungMock({ trangThai: 'DA_CHOT', thieu: [], hoaDon: [hd(1, 'DA_PHAT_HANH', '500000'), hd(2, 'DA_THANH_TOAN')] })
    await mo('?b=4')
    expect(chinh()).toBe(1)
    expect(container.textContent).toContain('500.000')
  })
})
