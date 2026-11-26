// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TrangSuCo from './TrangSuCo'
import { buocHienTai, dieuHuongMacDinh } from './SuCoQuanLy'

const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } })
const nay = new Date().toISOString()
const yc = (id: number, over: object) => ({ id, maYeuCau: `SC-${id}`, phongId: 11, toaNha: 'Toà A', soPhong: '101', tang: 1, hangMuc: `Hạng mục ${id}`, moTa: 'Mô tả', mucDo: 'THUONG', tenMucDo: 'Thường', trangThai: 'MOI_TIEP_NHAN', tenTrangThai: 'Mới', nguoiTiepNhanId: null, tiepNhanLuc: null, nguoiXuLyId: null, phanCongLuc: null, choXacNhanLuc: null, lyDoHuy: null, soDienThoaiLienHe: '0999100004', anh: [], chiPhi: null, benChiuChiPhi: null, taoLuc: `2026-11-0${id}T01:00:00Z`, ...over })
const bgChoDuyet = [{ id: 7, maBaoGia: 'BG-7', phienBan: 1, trangThai: 'CHO_DUYET', tongTien: 450000, moTa: '', dongBaoGia: [
  { thuTu: 1, tenHangMuc: 'Bóng LED âm trần 9W', soLuong: 2, donVi: 'cái', donGia: 85000, thanhTien: 170000 },
  { thuTu: 2, tenHangMuc: 'Công thay', soLuong: 1, donVi: 'lần', donGia: 280000, thanhTien: 280000 }] }]
let DATA: object[]
let BAO_GIA: Record<number, object[]>
let container: HTMLDivElement
let root: Root
let calls: Array<[string, RequestInit | undefined]>
const dieuHuong = vi.fn(dieuHuongMacDinh)

// 1 mới báo · 2 đã nhận · 3 đã giao · 4 chờ nghiệm thu · 5 xong tháng này · 6 mới báo khẩn · 7 đang sửa · 8 đã giao + báo giá chờ duyệt · 9 xong năm ngoái
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  window.history.replaceState({}, '', '/su-co')
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
  calls = []; BAO_GIA = { 8: bgChoDuyet }; dieuHuong.mockClear()
  DATA = [
    yc(1, { hangMuc: 'Đèn hành lang' }),
    yc(2, { trangThai: 'DA_TIEP_NHAN' }),
    yc(3, { trangThai: 'DA_PHAN_CONG', nguoiXuLyId: 4 }),
    yc(4, { trangThai: 'CHO_XAC_NHAN', nguoiXuLyId: 4 }),
    yc(5, { trangThai: 'DA_DONG', chiPhi: '250000', taoLuc: nay, choXacNhanLuc: nay }),
    yc(6, { mucDo: 'KHAN_CAP', tenMucDo: 'Khẩn cấp', hangMuc: 'Rò điện' }),
    yc(7, { trangThai: 'DANG_XU_LY', nguoiXuLyId: 4 }),
    yc(8, { trangThai: 'DA_PHAN_CONG', nguoiXuLyId: 4 }),
    yc(9, { trangThai: 'DA_DONG', taoLuc: '2025-01-01T01:00:00Z', choXacNhanLuc: '2025-01-02T01:00:00Z' }),
  ]
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    calls.push([url, init])
    if (init?.method === 'POST' || init?.method === 'PUT') return new Response(null, { status: 204 })
    if (url === '/api/toa-nha') return json([{ id: 1, ten: 'Toà A' }])
    if (url === '/api/toa-nha/1/phong') return json([{ id: 11, soPhong: '101' }])
    if (url.startsWith('/api/yeu-cau-sua-chua/tho')) return json([{ id: 4, hoTen: 'Thợ Huy', soDienThoai: '0999000031' }])
    if (url.startsWith('/api/yeu-cau-sua-chua?')) return json(DATA)
    const bg = url.match(/^\/api\/yeu-cau-sua-chua\/(\d+)\/bao-gia$/)
    if (bg) return json(BAO_GIA[Number(bg[1])] ?? [])
    const m = url.match(/^\/api\/yeu-cau-sua-chua\/(\d+)$/)
    if (m) return json(DATA.find((r) => (r as { id: number }).id === Number(m[1])))
    if (url.includes('/thanh-toan-tho')) return json([])
    throw new Error(`Unexpected request ${url}`)
  }))
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

const render = async (vaiTro: 'QUAN_LY' | 'CHU' = 'QUAN_LY') => { await act(async () => root.render(<TrangSuCo token="m" vaiTro={vaiTro} mobile={false} thamSo={{}} dieuHuong={dieuHuong} />)); await vi.waitFor(() => expect(container.querySelector('.sc-ds, .sc-ct')).not.toBeNull()) }
const hang = () => Array.from(container.querySelectorAll<HTMLAnchorElement>('a.irow'))
const nhom = (k: string) => Array.from(container.querySelectorAll<HTMLElement>(`[data-nhom="${k}"] a.irow`)).map((a) => Number(a.dataset.repairRow))
const nut = (nhan: string) => Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes(nhan))
const chip = (nhan: string) => Array.from(container.querySelectorAll<HTMLAnchorElement>('a.chip')).find((c) => c.textContent?.startsWith(nhan))!
const mo = async (id: number) => { window.history.replaceState({}, '', `/su-co?id=${id}`); await render(); await vi.waitFor(() => expect(container.querySelector('.sc-ct h2')?.textContent).toContain('phòng 101')) }
const buocNay = () => container.querySelector('.ma-buoc li[aria-current="step"]')?.textContent
const chonThoMoi = async () => {
  await vi.waitFor(() => expect(container.querySelector('.sc-ct select option[value="4"]')).not.toBeNull())
  const sel = container.querySelector<HTMLSelectElement>('.sc-ct select')!
  await act(async () => { Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!.call(sel, '4'); sel.dispatchEvent(new Event('change', { bubbles: true })) })
}

describe('TrangSuCo (3 nhóm + chi tiết 8 bước)', () => {
  it('chia 3 nhóm đúng trạng thái; khẩn lên đầu; báo giá chờ duyệt vào Cần quyết', async () => {
    await render()
    expect(nhom('can')).toEqual([6, 8, 2, 1]) // khẩn trước, rồi mới nhất; 8 vì có báo giá chờ duyệt
    expect(nhom('dang')).toEqual([7, 4, 3])
    expect(nhom('xong')).toEqual([5]) // 9 đóng từ năm ngoái: không thuộc "tháng này"
    expect(container.querySelector('.ma-dautrang-phu')?.textContent).toBe('Toà A · 4 việc cần quyết · 3 thợ đang làm')
    expect(hang().find((a) => a.dataset.repairRow === '8')?.textContent).toContain('báo giá 450.000 ₫ chờ duyệt')
    expect(hang().find((a) => a.dataset.repairRow === '8')?.textContent).toContain('Chờ duyệt')
    expect(hang().find((a) => a.dataset.repairRow === '6')?.textContent).toContain('Khẩn')
    expect(hang().find((a) => a.dataset.repairRow === '2')?.textContent).toContain('phòng 101')
    expect(hang().find((a) => a.dataset.repairRow === '2')?.textContent).toContain('đã nhận, chưa giao thợ')
  })

  it('?loc= cũ vẫn chạy: mo = Cần quyết + Thợ đang làm, xong = Đã xong, can/dang từng nhóm', async () => {
    window.history.replaceState({}, '', '/su-co?loc=mo'); await render()
    expect([nhom('can').length, nhom('dang').length, nhom('xong').length]).toEqual([4, 3, 0])
    expect(chip('Đang mở').getAttribute('aria-pressed')).toBe('true')
    await act(async () => chip('Đã xong').click())
    expect(window.location.search).toBe('?loc=xong')
    expect(hang().map((a) => a.dataset.repairRow)).toEqual(['5'])
    await act(async () => root.unmount()); root = createRoot(container)
    window.history.replaceState({}, '', '/su-co?loc=can'); await render()
    expect([nhom('can').length, nhom('dang').length]).toEqual([4, 0])
  })

  it('tìm không dấu; bấm một hàng đổi query và đánh dấu hàng chọn', async () => {
    await render()
    const o = container.querySelector<HTMLInputElement>('input[type=search]')!
    await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(o, 'ro dien'); o.dispatchEvent(new Event('input', { bubbles: true })) })
    expect(hang().map((a) => a.dataset.repairRow)).toEqual(['6'])
    await act(async () => hang()[0].click())
    expect(window.location.search).toBe('?id=6')
    expect(hang().filter((a) => a.getAttribute('aria-current') === 'true')).toHaveLength(1)
  })

  // MOI → 1, DA_TIEP_NHAN → 2, DA_PHAN_CONG → 3, DANG_XU_LY → 6, CHO_XAC_NHAN → 7, DA_DONG → 8, có báo giá chờ → 5
  it.each([[1, 'Báo hỏng'], [2, 'Tiếp nhận'], [3, 'Giao thợ'], [7, 'Sửa'], [4, 'Nghiệm thu'], [5, 'Trả tiền thợ'], [8, 'Duyệt']])('sự cố %i → bước hiện tại "%s", đủ 8 bước', async (id, ten) => {
    await mo(id)
    expect(container.querySelectorAll('.ma-buoc li')).toHaveLength(8)
    expect(buocNay()).toContain(ten)
    expect(container.querySelector('.ma-buoc')?.getAttribute('aria-label')).toBe('Tiến độ')
  })

  // Mỗi trạng thái đúng ≤ 1 nút chính, đúng nhãn.
  it.each<[number, string | null]>([[1, 'Giao thợ'], [2, 'Giao thợ'], [3, null], [7, null], [4, 'Nghiệm thu'], [5, null], [8, 'Duyệt 450.000 ₫']])('sự cố %i → nút chính %s', async (id, nhan) => {
    await mo(id)
    const chinh = Array.from(container.querySelectorAll('.sc-ct .btn-primary')).map((b) => b.textContent)
    expect(chinh).toEqual(nhan ? [nhan] : [])
  })

  it('có báo giá chờ duyệt: bảng báo giá + tổng; "Từ chối…" không phải nút chính', async () => {
    await mo(8)
    expect(container.querySelector('.sc-ct h3')?.textContent).toContain('Báo giá của thợ')
    expect(Array.from(container.querySelectorAll('.sc-ct th')).map((t) => t.textContent)).toEqual(['Hạng mục', 'SL', 'Đơn giá', 'Thành tiền'])
    expect(container.querySelector('.sc-ct tfoot')?.textContent).toContain('Tổng báo giá')
    expect(container.querySelector('.sc-ct tfoot')?.textContent).toContain('450.000 ₫')
    expect(nut('Từ chối…')!.className).not.toContain('btn-primary')
    expect(nut('Từ chối…')!.className).toContain('btn-danger')
    expect(container.querySelector('.sc-ct')?.textContent).toContain('450.000 ₫ (chờ duyệt)')
  })

  it('Duyệt gọi API duyệt của báo giá; Từ chối… bắt buộc lý do rồi gọi tu-choi', async () => {
    await mo(8)
    await act(async () => nut('Duyệt 450.000 ₫')!.click())
    expect(calls.some(([u, i]) => u === '/api/yeu-cau-sua-chua/8/bao-gia/7/duyet' && i?.method === 'POST')).toBe(true)
    await act(async () => nut('Từ chối…')!.click())
    const o = container.querySelector<HTMLInputElement>('.sc-ct form input')!
    expect(o.required).toBe(true)
    await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(o, 'Giá vật tư cao'); o.dispatchEvent(new Event('input', { bubbles: true })) })
    await act(async () => o.closest('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    const post = calls.find(([u, i]) => u === '/api/yeu-cau-sua-chua/8/bao-gia/7/tu-choi' && i?.method === 'POST')
    expect(JSON.parse(String(post![1]!.body))).toEqual({ lyDoTuChoi: 'Giá vật tư cao' })
  })

  it('Giao thợ bị chặn tới khi chọn thợ; mới báo thì tiếp nhận rồi mới phân công', async () => {
    await mo(1)
    expect(container.textContent).toContain('Thợ nhận tin ngay trên điện thoại.')
    expect(nut('Giao thợ')!.getAttribute('aria-disabled')).toBe('true')
    await chonThoMoi()
    await act(async () => nut('Giao thợ')!.click())
    const duong = calls.filter(([, i]) => i?.method === 'POST').map(([u]) => u)
    expect(duong).toEqual(['/api/yeu-cau-sua-chua/1/tiep-nhan', '/api/yeu-cau-sua-chua/1/phan-cong'])
    expect(JSON.parse(String(calls.find(([u]) => u.endsWith('/phan-cong'))![1]!.body))).toEqual({ thoId: 4 })
  })

  it('đã nhận → Giao thợ chỉ gọi phan-cong', async () => {
    await mo(2)
    await chonThoMoi()
    await act(async () => nut('Giao thợ')!.click())
    expect(calls.filter(([, i]) => i?.method === 'POST').map(([u]) => u)).toEqual(['/api/yeu-cau-sua-chua/2/phan-cong'])
  })

  it('chờ nghiệm thu → Nghiệm thu gọi xac-nhan-dong', async () => {
    await mo(4)
    await act(async () => nut('Nghiệm thu')!.click())
    expect(calls.some(([u, i]) => u === '/api/yeu-cau-sua-chua/4/xac-nhan-dong' && i?.method === 'POST')).toBe(true)
  })

  it('huỷ cần lý do (ô bắt buộc) rồi gọi huy kèm lyDo', async () => {
    await mo(1)
    await act(async () => nut('Huỷ yêu cầu')!.click())
    const o = Array.from(container.querySelectorAll('.sc-ct form')).find((f) => f.textContent?.includes('Lý do huỷ'))!.querySelector('input')!
    expect(o.required).toBe(true)
    await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(o, 'Trùng yêu cầu'); o.dispatchEvent(new Event('input', { bubbles: true })) })
    await act(async () => o.closest('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    const post = calls.find(([u, i]) => u === '/api/yeu-cau-sua-chua/1/huy' && i?.method === 'POST')
    expect(JSON.parse(String(post![1]!.body))).toEqual({ lyDo: 'Trùng yêu cầu' })
  })

  it('đã xong → chỉ đọc: có lịch sử, không chân nút', async () => {
    await mo(5)
    expect(container.querySelector('.sc-ct .ma-chandinh')).toBeNull()
    expect(container.textContent).toContain('Lịch sử')
  })

  it('?yeuCauId= cũ vẫn mở đúng sự cố', async () => {
    window.history.replaceState({}, '', '/su-co?yeuCauId=5')
    await render()
    expect(container.querySelector('.sc-ct h2')?.textContent).toBe('Hạng mục 5 · phòng 101')
    expect(container.querySelector('.sc-ct')?.textContent).toContain('SC-5')
  })

  it('Quản lý có "Ghi sự cố mới", Chủ không có; ?baoMoi=1&phongId= mở form với phòng đó', async () => {
    await render('CHU')
    expect(nut('Ghi sự cố mới')).toBeUndefined()
    await act(async () => root.unmount()); root = createRoot(container)
    window.history.replaceState({}, '', '/su-co?baoMoi=1&phongId=11')
    await render('QUAN_LY')
    expect(nut('Ghi sự cố mới')).toBeDefined()
    await vi.waitFor(() => expect(container.querySelector<HTMLSelectElement>('.sc-ct select[required]')?.value).toBe('11'))
    expect(container.querySelector('.sc-ct h2')?.textContent).toBe('Ghi sự cố mới')
  })

  it('< 768: có ?id= chỉ hiện chi tiết kèm "← Tất cả sự cố"; không có thì chỉ hiện danh sách', async () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: true, media: q, addEventListener: () => undefined, removeEventListener: () => undefined }))
    await render()
    expect(container.querySelector('.sc-ct')).toBeNull()
    expect(hang().length).toBeGreaterThan(0)
    await act(async () => root.unmount()); root = createRoot(container)
    await mo(3)
    expect(hang()).toHaveLength(0)
    const lui = container.querySelector<HTMLAnchorElement>('a.sc-lui')!
    expect(lui.textContent).toBe('← Tất cả sự cố')
    await act(async () => lui.click())
    expect(window.location.search).toBe('')
  })
})

describe('buocHienTai', () => {
  const r = (trangThai: string) => yc(1, { trangThai }) as never
  it('ánh xạ trạng thái sang bước trong 8 bước; báo giá chờ duyệt = bước 5', () => {
    expect(['MOI_TIEP_NHAN', 'DA_TIEP_NHAN', 'DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_XAC_NHAN', 'DA_DONG', 'DA_HUY'].map((t) => buocHienTai(r(t)))).toEqual([1, 2, 3, 6, 7, 8, 0])
    expect(buocHienTai(r('DA_PHAN_CONG'), true)).toBe(5)
  })
})
