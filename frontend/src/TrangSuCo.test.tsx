// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TrangSuCo from './TrangSuCo'
import { buocHienTai, dieuHuongMacDinh } from './SuCoQuanLy'

const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } })
const yc = (id: number, over: object) => ({ id, maYeuCau: `SC-${id}`, phongId: 11, toaNha: 'Toà A', soPhong: '101', tang: 1, hangMuc: `Hạng mục ${id}`, moTa: 'Mô tả', mucDo: 'THUONG', tenMucDo: 'Thường', trangThai: 'MOI_TIEP_NHAN', tenTrangThai: 'Mới', nguoiTiepNhanId: null, tiepNhanLuc: null, nguoiXuLyId: null, phanCongLuc: null, choXacNhanLuc: null, lyDoHuy: null, soDienThoaiLienHe: null, anh: [], chiPhi: null, benChiuChiPhi: null, taoLuc: '2026-11-01T01:00:00Z', ...over })
const bgChoDuyet = [{ id: 7, maBaoGia: 'BG-7', phienBan: 1, trangThai: 'CHO_DUYET', tongTien: 500000, moTa: '', dongBaoGia: [] }]
let DATA: object[]
let BAO_GIA: object[]
let container: HTMLDivElement
let root: Root
let calls: Array<[string, RequestInit | undefined]>
const dieuHuong = vi.fn(dieuHuongMacDinh)

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  window.history.replaceState({}, '', '/su-co')
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
  calls = []; BAO_GIA = []; dieuHuong.mockClear()
  DATA = [
    yc(1, { hangMuc: 'Đèn hành lang' }),
    yc(2, { trangThai: 'DA_TIEP_NHAN', tenTrangThai: 'Đã tiếp nhận' }),
    yc(3, { trangThai: 'DA_PHAN_CONG', tenTrangThai: 'Đã phân công', taoLuc: '2026-11-10T01:00:00Z' }),
    yc(4, { trangThai: 'CHO_XAC_NHAN', tenTrangThai: 'Chờ xác nhận' }),
    yc(5, { trangThai: 'DA_DONG', tenTrangThai: 'Đã đóng', chiPhi: '250000' }),
    yc(6, { mucDo: 'KHAN_CAP', tenMucDo: 'Khẩn cấp', hangMuc: 'Rò điện', taoLuc: '2026-10-01T01:00:00Z' }),
  ]
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    calls.push([url, init])
    if (init?.method === 'POST' || init?.method === 'PUT') return new Response(null, { status: 204 })
    if (url === '/api/toa-nha') return json([{ id: 1, ten: 'Toà A' }])
    if (url === '/api/toa-nha/1/phong') return json([{ id: 11, soPhong: '101' }])
    if (url.startsWith('/api/yeu-cau-sua-chua/tho')) return json([{ id: 4, hoTen: 'Thợ Huy', soDienThoai: '0999000031' }])
    if (url.startsWith('/api/yeu-cau-sua-chua?')) return json(DATA)
    const m = url.match(/^\/api\/yeu-cau-sua-chua\/(\d+)$/)
    if (m) return json(DATA.find((r) => (r as { id: number }).id === Number(m[1])))
    if (url.includes('/bao-gia')) return json(BAO_GIA)
    if (url.includes('/thanh-toan-tho')) return json([])
    throw new Error(`Unexpected request ${url}`)
  }))
})
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

const render = async () => { await act(async () => root.render(<TrangSuCo token="m" vaiTro="QUAN_LY" mobile={false} thamSo={{}} dieuHuong={dieuHuong} />)); await vi.waitFor(() => expect(container.querySelector('a.irow')).not.toBeNull()) }
const hang = () => Array.from(container.querySelectorAll<HTMLAnchorElement>('a.irow'))
const nut = (nhan: string) => Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes(nhan))
const chip = (nhan: string) => Array.from(container.querySelectorAll<HTMLAnchorElement>('a.chip')).find((c) => c.textContent?.startsWith(nhan))!
const mo = async (id: number) => { window.history.replaceState({}, '', `/su-co?id=${id}`); await render(); await vi.waitFor(() => expect(container.querySelector('.drawer h2')?.textContent).toBe(`Hạng mục ${id}`.replace('Hạng mục 1', 'Đèn hành lang').replace('Hạng mục 6', 'Rò điện'))) }

describe('TrangSuCo (một danh sách + ngăn chi tiết)', () => {
  it('chip có số đếm theo nhóm; chip Đã đóng lọc đúng', async () => {
    await render()
    expect(['Đang mở', 'Cần phân công', 'Đang sửa', 'Đã đóng'].map((t) => chip(t).textContent?.replace(/\s+/g, ' '))).toEqual(['Đang mở 5', 'Cần phân công 3', 'Đang sửa 2', 'Đã đóng 1'])
    expect(chip('Đang mở').getAttribute('aria-pressed')).toBe('true')
    await act(async () => chip('Đã đóng').click())
    expect(window.location.search).toBe('?loc=xong')
    expect(hang().map((a) => a.querySelector('.s')?.textContent)).toEqual(['Toà A · Phòng 101 · SC-5'])
  })

  it('khẩn cấp lên đầu, rồi mới nhất; tìm không dấu', async () => {
    await render()
    expect(hang().map((a) => a.querySelector('.t')?.textContent)).toEqual(['Rò điện', 'Hạng mục 3', 'Đèn hành lang', 'Hạng mục 2', 'Hạng mục 4'])
    const o = container.querySelector<HTMLInputElement>('input[type=search]')!
    await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(o, 'ro dien'); o.dispatchEvent(new Event('input', { bubbles: true })) })
    expect(hang().map((a) => a.querySelector('.t')?.textContent)).toEqual(['Rò điện'])
  })

  it('bấm một hàng đổi query + ngăn, hàng chọn có aria-current', async () => {
    await render()
    await act(async () => hang().find((a) => a.textContent?.includes('SC-3'))!.click())
    expect(window.location.search).toBe('?id=3&loc=mo')
    expect(container.querySelector('.drawer h2')?.textContent).toBe('Hạng mục 3')
    expect(hang().filter((a) => a.getAttribute('aria-current') === 'true').map((a) => a.textContent)).toHaveLength(1)
    expect(container.querySelectorAll('.vstep')).toHaveLength(6)
  })

  const CA: Array<[number, string, string]> = [
    [1, 'Tiếp nhận yêu cầu', '/api/yeu-cau-sua-chua/1/tiep-nhan'],
    [4, 'Nghiệm thu', '/api/yeu-cau-sua-chua/4/xac-nhan-dong'],
  ]
  it.each(CA)('yêu cầu %i → nút chính "%s" gọi %s', async (id, nhan, url) => {
    await mo(id)
    expect(container.querySelectorAll('.drawer .btn-primary')).toHaveLength(1)
    await act(async () => nut(nhan)!.click())
    expect(calls.some(([u, i]) => u === url && i?.method === 'POST')).toBe(true)
  })

  it('đã tiếp nhận → "Phân công thợ" bị chặn tới khi chọn thợ, rồi gọi phan-cong', async () => {
    await mo(2)
    await vi.waitFor(() => expect(container.querySelector('.drawer select option[value="4"]')).not.toBeNull())
    expect(nut('Phân công thợ')!.getAttribute('aria-disabled')).toBe('true')
    const sel = container.querySelector<HTMLSelectElement>('.drawer select')!
    await act(async () => { Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!.call(sel, '4'); sel.dispatchEvent(new Event('change', { bubbles: true })) })
    await act(async () => nut('Phân công thợ')!.click())
    const post = calls.find(([u, i]) => u === '/api/yeu-cau-sua-chua/2/phan-cong' && i?.method === 'POST')
    expect(JSON.parse(String(post![1]!.body))).toEqual({ thoId: 4 })
  })

  it('đã phân công chưa có báo giá → không nút chính, ghi "Đang chờ thợ gửi báo giá"; có báo giá chờ duyệt → "Duyệt báo giá"', async () => {
    await mo(3)
    await vi.waitFor(() => expect(container.textContent).toContain('Đang chờ thợ gửi báo giá'))
    expect(container.querySelector('.drawer .btn-primary')).toBeNull()
    await act(async () => root.unmount()); root = createRoot(container)
    BAO_GIA = bgChoDuyet
    await mo(3)
    await vi.waitFor(() => expect(nut('Duyệt báo giá')).toBeDefined())
    expect(container.querySelectorAll('.drawer .vstep.cur .tt')[0].textContent).toBe('Duyệt báo giá')
  })

  it('huỷ cần lý do (ô bắt buộc) rồi gọi huy kèm lyDo', async () => {
    await mo(1)
    await act(async () => nut('Huỷ yêu cầu')!.click())
    const o = Array.from(container.querySelectorAll('.drawer form')).find((f) => f.textContent?.includes('Lý do huỷ'))!.querySelector('input')!
    expect(o.required).toBe(true)
    await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(o, 'Trùng yêu cầu'); o.dispatchEvent(new Event('input', { bubbles: true })) })
    await act(async () => o.closest('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    const post = calls.find(([u, i]) => u === '/api/yeu-cau-sua-chua/1/huy' && i?.method === 'POST')
    expect(JSON.parse(String(post![1]!.body))).toEqual({ lyDo: 'Trùng yêu cầu' })
  })

  it('đã đóng và đã thanh toán đủ → ngăn chỉ đọc, không nút', async () => {
    await mo(5)
    expect(container.querySelector('.drawer .drawer-f')).toBeNull()
    expect(container.textContent).toContain('Lịch sử')
  })

  it('?yeuCauId= mở ngăn của yêu cầu đó (và chuyển sang chip Đã đóng nếu đã đóng)', async () => {
    window.history.replaceState({}, '', '/su-co?yeuCauId=5')
    await render()
    expect(chip('Đã đóng').getAttribute('aria-pressed')).toBe('true')
    expect(container.querySelector('.drawer h2')?.textContent).toBe('Hạng mục 5')
  })

  it('?baoMoi=1&phongId= mở form báo sự cố với phòng đó', async () => {
    window.history.replaceState({}, '', '/su-co?baoMoi=1&phongId=11')
    await render()
    await vi.waitFor(() => expect(container.querySelector<HTMLSelectElement>('.drawer select[required]')?.value).toBe('11'))
    expect(container.querySelector('.drawer h2')?.textContent).toBe('Báo sự cố mới')
  })

  it('≤ 1180px: ngăn là dialog, Esc đóng và bỏ id khỏi URL', async () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: true, media: q, addEventListener: () => undefined, removeEventListener: () => undefined }))
    window.history.replaceState({}, '', '/su-co?id=3&loc=mo')
    await render()
    expect(container.querySelector('.drawer')?.getAttribute('role')).toBe('dialog')
    await act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })) })
    expect(window.location.search).toBe('?loc=mo')
    expect(container.querySelector('.drawer')).toBeNull()
  })
})

describe('buocHienTai', () => {
  const r = (trangThai: string) => yc(1, { trangThai }) as never
  it('ánh xạ trạng thái + báo giá + thanh toán sang bước', () => {
    const duyet = [{ trangThai: 'DA_DUYET', tongTien: 100 }] as never
    expect([buocHienTai(r('MOI_TIEP_NHAN'), [], []), buocHienTai(r('DA_TIEP_NHAN'), [], []), buocHienTai(r('DANG_XU_LY'), [], []),
      buocHienTai(r('DANG_XU_LY'), [{ trangThai: 'CHO_DUYET' }] as never, []), buocHienTai(r('DANG_XU_LY'), duyet, []),
      buocHienTai(r('CHO_XAC_NHAN'), duyet, []), buocHienTai(r('DA_DONG'), duyet, []), buocHienTai(r('DA_DONG'), duyet, [{ soTien: 100 }] as never), buocHienTai(r('DA_HUY'), [], [])]).toEqual([0, 1, 2, 3, 4, 4, 5, 6, 6])
  })
})
