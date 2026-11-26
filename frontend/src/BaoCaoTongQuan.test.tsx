// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BaoCaoTongQuan from './BaoCaoTongQuan'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

const jsonResponse = (body: unknown): Response => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
const KPI = { doanhThuPhatHanh: '0.00', daThu: '0.00', congNo: '0.00', tyLeLapDay: '50.00', tongSoPhong: 2, soPhongDangThue: 1, soPhongTrong: 1, soSuCoDangMo: 0 }
const tongQuan = (tu: string, den: string, over: object = {}) => ({
  toaNhaId: null, tenToaNha: 'Tất cả toà', tuNgay: tu, denNgay: den, tinhLuc: '2040-08-15T10:00+07:00', coDuLieuTaiChinh: true, kpi: KPI, theoThang: [], ...over,
})
const hd = (id: number, toa: number, ngay: string, tong: number, daThu: number, over: object = {}) => ({
  hoaDonId: id, kyId: 1, maHoaDon: `HD-${id}`, soPhong: `10${id % 5}`, nguoiThue: `Người ${id}`, ngayPhatHanh: ngay, hanThanhToan: ngay, trangThai: daThu >= tong ? 'DA_THANH_TOAN' : 'DA_PHAT_HANH',
  tongTien: `${tong}.00`, daThu: `${daThu}.00`, conLai: `${tong - daThu}.00`, toaNhaId: toa, ...over,
})
const phong = (toa: number, n: number, thue: number) => Array.from({ length: n }, (_, i) => ({ id: toa * 100 + i, toaNhaId: toa, soPhong: `${i}`, trangThai: i < thue ? 'DANG_THUE' : 'TRONG' }))

type Mo = { toa?: object[]; hoaDon?: Record<number, object[]>; sua?: Record<number, object[]>; tq?: (url: string) => object }
function moFetch(m: Mo = {}) {
  const toa = m.toa ?? [{ id: 1, ten: 'Toà A' }, { id: 2, ten: 'Toà B' }]
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url === '/api/toa-nha') return jsonResponse(toa)
    if (url.startsWith('/api/bao-cao/tong-quan?')) {
      const q = new URL(url, 'http://x').searchParams
      return jsonResponse(m.tq ? m.tq(url) : tongQuan(q.get('tuNgay')!, q.get('denNgay')!))
    }
    let k = /^\/api\/hoa-don\?toaNhaId=(\d+)/.exec(url)
    if (k) return jsonResponse(m.hoaDon?.[Number(k[1])] ?? [])
    k = /^\/api\/toa-nha\/(\d+)\/phong/.exec(url)
    if (k) return jsonResponse(phong(Number(k[1]), 12, 9))
    k = /^\/api\/yeu-cau-sua-chua\?toaNhaId=(\d+)/.exec(url)
    if (k) return jsonResponse(m.sua?.[Number(k[1])] ?? [])
    throw new Error(`Unexpected fetch: ${url}`)
  })
}

describe('BaoCaoTongQuan (một trang, chỉ đọc)', () => {
  let root: Root | null = null
  let container: HTMLDivElement | null = null
  const hienRa = async (mobile = false) => {
    await act(async () => {
      root = createRoot(container!)
      root.render(<BaoCaoTongQuan token="report-token" mobile={mobile} />)
    })
  }
  const so = (nhan: string) => Array.from(container!.querySelectorAll('.ma-oso')).find((o) => o.querySelector('.ma-oso-nhan')?.textContent === nhan)!

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    window.history.replaceState({}, '', '/bao-cao?tuNgay=2040-07-01&denNgay=2040-08-31')
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(async () => {
    if (root) {
      await act(async () => root?.unmount())
      root = null
    }
    container?.remove()
    container = null
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('Đã gửi = Đã thu + Còn nợ, cộng từ hoá đơn dù sổ giao dịch báo 0; không có nút chính', async () => {
    const assertar = vi.spyOn(console, 'assert').mockImplementation(() => undefined)
    // tong-quan cố ý báo daThu = 0: màn không được dùng số đó.
    const fetchMock = moFetch({
      hoaDon: { 1: [hd(1, 1, '2040-07-25', 3790000, 1895000), hd(2, 1, '2040-08-25', 4219000, 4219000)], 2: [hd(3, 2, '2040-08-25', 1000000, 0), hd(4, 2, '2040-08-26', 500000, 500000, { trangThai: 'NHAP' })] },
      sua: { 1: [{ id: 1, trangThai: 'DA_DONG', chiPhi: '250000', toaNha: 'Toà A', taoLuc: '2040-08-02T01:00:00Z' }] },
    })
    vi.stubGlobal('fetch', fetchMock)
    await hienRa()
    await vi.waitFor(() => expect(container!.querySelectorAll('.ma-oso')).toHaveLength(4))

    const num = (t: string) => Number(t.replace(/[^\d]/g, ''))
    const daThu = num(so('Đã thu').querySelector('.ma-oso-so')!.textContent!)
    const conNo = num(so('Còn nợ').querySelector('.ma-oso-so')!.textContent!)
    const daGui = num(so('Đã thu').querySelector('.ma-oso-phu')!.textContent!.split('của')[1])
    expect([daThu, conNo, daGui]).toEqual([6114000, 2895000, 9009000]) // NHAP bị loại
    expect(daGui).toBe(daThu + conNo)
    expect(so('Đã thu').querySelector('.ma-oso-phu')?.textContent).toContain('68% của 9.009.000 ₫ đã gửi hoá đơn')
    expect(so('Phòng đang thuê').textContent).toContain('1/2 phòng') // từ tong-quan (trạng thái hiện tại)
    expect(so('Chi sửa chữa').textContent).toContain('250.000')
    expect(so('Chi sửa chữa').textContent).toContain('1 việc đã xong')
    expect(container!.querySelector('.btn-primary')).toBeNull()
    expect(container!.querySelectorAll('h1')).toHaveLength(1)
    expect(container!.querySelector('h1')?.textContent).toBe('Báo cáo')
    expect(container!.querySelector('.ma-dautrang-phu')?.textContent).toBe('Tất cả toà · từ tháng 7 đến hết 31/08/2040 · tính trên hoá đơn đã gửi')
    expect(assertar.mock.calls.filter((c) => !c[0])).toEqual([])
    expect(fetchMock).toHaveBeenCalledWith('/api/bao-cao/tong-quan?tuNgay=2040-07-01&denNgay=2040-08-31', expect.objectContaining({ headers: { Authorization: 'Bearer report-token' } }))
  })

  it('theo tháng, nợ theo tuổi quá hạn, theo toà có hàng Cộng và liên kết; Toà hiện thấp thì giải thích', async () => {
    vi.spyOn(console, 'assert').mockImplementation(() => undefined)
    const hom = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
    const t = Number(hom.slice(0, 4)) * 12 + Number(hom.slice(5, 7)) - 1
    const thang = (lui: number) => { const v = t - lui; return `${Math.floor(v / 12)}-${String((v % 12) + 1).padStart(2, '0')}` }
    window.history.replaceState({}, '', `/bao-cao?tuNgay=${thang(2)}-01&denNgay=${hom}`)
    const cu = (id: number, toa: number, m: string) => hd(id, toa, `${m}-02`, 1000000, 400000, { hanThanhToan: '2020-01-05' }) // quá hạn trên 30 ngày
    vi.stubGlobal('fetch', moFetch({
      hoaDon: { 1: [cu(1, 1, thang(2)), cu(2, 1, thang(2)), cu(3, 1, thang(1)), cu(4, 1, thang(1)), hd(5, 1, `${thang(0)}-02`, 1000000, 1000000)], 2: [cu(6, 2, thang(2)), cu(7, 2, thang(1))] },
    }))
    await hienRa()
    await vi.waitFor(() => expect(container!.querySelectorAll('[data-report-chart-month]')).toHaveLength(3))

    expect(container!.textContent).toContain('chưa gửi (mới có 1 hoá đơn)')
    const kv = Array.from(container!.querySelectorAll('.bc-kv > div')).map((r) => r.textContent)
    expect(kv).toEqual(['Chưa đến hạn0 ₫', 'Quá hạn 1–7 ngày0 ₫', 'Quá hạn 8–30 ngày0 ₫', 'Quá hạn trên 30 ngày3.600.000 ₫'])
    expect(container!.textContent).toContain('6 hoá đơn của 6 người.')
    expect(container!.querySelector('a[href="/thu-tien"]')?.textContent).toBe('Mở danh sách nợ')
    expect(so('Còn nợ').querySelector('.ma-oso-phu')?.textContent).toBe('đều quá hạn trên 30 ngày')
    const dong = Array.from(container!.querySelectorAll('[data-report-toa]'))
    expect(dong.map((r) => r.querySelector('a')?.getAttribute('href'))).toEqual(['/toa-nha/1', '/toa-nha/2'])
    expect(container!.querySelector('tfoot.ma-tong, tfoot .ma-tong')?.textContent).toContain('Cộng')
    expect(container!.textContent).toContain('18/24') // 9/12 mỗi toà
  })

  it('tháng hiện tại không thấp thì không có câu giải thích', async () => {
    vi.spyOn(console, 'assert').mockImplementation(() => undefined)
    vi.stubGlobal('fetch', moFetch({ hoaDon: { 1: [hd(1, 1, '2040-07-02', 1000000, 0), hd(2, 1, '2040-08-02', 1000000, 0)] } }))
    await hienRa()
    await vi.waitFor(() => expect(container!.querySelectorAll('[data-report-chart-month]')).toHaveLength(2))
    expect(container!.textContent).not.toContain('chưa gửi (mới có')
  })

  it('chip khoảng thời gian đổi tuNgay và gọi lại báo cáo; mặc định là 5 tháng', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2040-08-15T18:00:00.000Z'))
    window.history.replaceState({}, '', '/bao-cao')
    const fetchMock = moFetch()
    vi.stubGlobal('fetch', fetchMock)
    await hienRa()
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/bao-cao/tong-quan?tuNgay=2040-04-01&denNgay=2040-08-16', expect.anything()))
    const chip = (ten: string) => Array.from(container!.querySelectorAll<HTMLButtonElement>('button.chip')).find((b) => b.textContent === ten)!
    await vi.waitFor(() => expect(chip('5 tháng').getAttribute('aria-pressed')).toBe('true'))
    await act(async () => chip('Tháng này').click())
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/bao-cao/tong-quan?tuNgay=2040-08-01&denNgay=2040-08-16', expect.anything()))
    await act(async () => chip('Cả năm').click())
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/bao-cao/tong-quan?tuNgay=2040-01-01&denNgay=2040-08-16', expect.anything()))
  })

  it('FR-RPT-02 reloads filters when browser history emits popstate', async () => {
    const fetchMock = moFetch()
    vi.stubGlobal('fetch', fetchMock)
    window.history.replaceState({}, '', '/bao-cao?toaNhaId=2&tuNgay=2040-08-01&denNgay=2040-08-31')
    await hienRa()
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/bao-cao/tong-quan?tuNgay=2040-08-01&denNgay=2040-08-31&toaNhaId=2', expect.anything()))

    window.history.pushState({}, '', '/bao-cao?toaNhaId=1&tuNgay=2040-09-01&denNgay=2040-09-30')
    window.dispatchEvent(new PopStateEvent('popstate'))

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/bao-cao/tong-quan?tuNgay=2040-09-01&denNgay=2040-09-30&toaNhaId=1', expect.anything()))
  })

  it('FR-RPT-01 distinguishes loading and API error states', async () => {
    let rejectReport: ((reason: Error) => void) | null = null
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') return Promise.resolve(jsonResponse([]))
      return new Promise<Response>((_resolve, reject) => { rejectReport = reject })
    })
    vi.stubGlobal('fetch', fetchMock)

    await hienRa()
    expect(container!.textContent).toContain('Đang tải báo cáo tổng quan…')

    await act(async () => rejectReport?.(new Error('mất kết nối')))
    await vi.waitFor(() => expect(container!.querySelector('[role="alert"]')).not.toBeNull())
    expect(container!.textContent).toContain('Không thể tải báo cáo tổng quan.')
  })

  it('lỗi tải hoá đơn: báo ngay trong khối kèm "Tải lại", không dựng số giả', async () => {
    const co = moFetch()
    let hong = true
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => (String(input).startsWith('/api/hoa-don') && hong ? new Response('{}', { status: 500, headers: { 'Content-Type': 'application/json' } }) : co(input))))
    await hienRa()
    await vi.waitFor(() => expect(container!.textContent).toContain('Không tải được hoá đơn để tính tiền.'))
    expect(container!.querySelector('.ma-oso')).toBeNull()
    hong = false
    await act(async () => Array.from(container!.querySelectorAll('button')).find((b) => b.textContent === 'Tải lại')!.click())
    await vi.waitFor(() => expect(container!.querySelectorAll('.ma-oso')).toHaveLength(4))
  })

  it('FR-RPT-01 giữ trạng thái rỗng khi chưa gửi hoá đơn nào trong khoảng ngày', async () => {
    vi.stubGlobal('fetch', moFetch())
    await hienRa(true)
    await vi.waitFor(() => expect(container!.querySelector('[data-report-empty]')).not.toBeNull())
    expect(container!.querySelector('[data-layout-variant="mobile"]')).not.toBeNull()
    expect(container!.textContent).toContain('Chưa có dữ liệu tài chính trong khoảng ngày đã chọn.')
  })

  it('NFR-USA-03 24 tháng: một ảnh chụp tong-quan, không gọi lặp, đủ 24 cột tháng', async () => {
    vi.spyOn(console, 'assert').mockImplementation(() => undefined)
    window.history.replaceState({}, '', '/bao-cao?tuNgay=2039-01-01&denNgay=2040-12-31')
    const hoaDon = Array.from({ length: 24 }, (_, i) => hd(i + 1, 1, `${i < 12 ? 2039 : 2040}-${String((i % 12) + 1).padStart(2, '0')}-10`, 1000000, 500000))
    const fetchMock = moFetch({ hoaDon: { 1: hoaDon } })
    vi.stubGlobal('fetch', fetchMock)
    const t0 = performance.now()
    await hienRa()
    await vi.waitFor(() => expect(container!.querySelectorAll('[data-report-chart-month]')).toHaveLength(24))
    expect(fetchMock.mock.calls.filter(([u]) => String(u).startsWith('/api/bao-cao/tong-quan')).length).toBe(1)
    expect(performance.now() - t0).toBeLessThan(3000)
  })
})
