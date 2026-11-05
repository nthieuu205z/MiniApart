// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import FinancePaymentPanel from './FinancePaymentPanel'
import ExcelExportButton from './ExcelExportButton'
import InvoiceActions from './InvoiceActions'
import type { ThongTinHoaDonChiTiet } from './api'

let container: HTMLDivElement
let root: Root
beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container) })
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
const response = (value: unknown, status = 200) => new Response(value === undefined ? undefined : JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } })
const ledger = { hoaDonId: 10, hopDongId: 11, toaNhaId: 1, kyId: 8, giaoDich: [{ id: 41, maBienLai: 'BL-41', soTien: '200000.00', loai: 'THANH_TOAN', hinhThuc: 'TIEN_MAT', ngayThu: '2026-11-04', lyDo: null, dieuChinhChoId: null }] }
const payment = { thanhToanId: 42, hoaDonId: 10, maBienLai: 'BL-42', soTien: '100000.25', hinhThuc: 'TIEN_MAT', loai: 'THANH_TOAN', ngayThu: '2026-11-04', tongTien: '500000.00', daThu: '300000.25', conLai: '199999.75', soTienThanhSoDu: '0.00', trangThai: 'DA_THU_MOT_PHAN' }
function setText(selector: string, value: string) {
  const element = container.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement
  const prototype = element.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(element, value)
  element.dispatchEvent(new Event('input', { bubbles: true }))
}

it('FR-INV-11 preserves exact decimal payment input and reloads the ledger after collecting', async () => {
  const fetchMock = vi.fn(async (url: string, options?: RequestInit) => url.endsWith('/thanh-toan') && options?.method === 'POST' ? response(payment) : response(ledger))
  vi.stubGlobal('fetch', fetchMock)
  await act(async () => root.render(<FinancePaymentPanel token="token" hoaDonId={10} conLai="300000.00" trangThai="DA_PHAT_HANH" />))
  await act(async () => setText('[aria-label="Số tiền thu"]', '100000.25'))
  await act(async () => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
  const submission = fetchMock.mock.calls.find(([, options]) => options?.method === 'POST')
  expect(submission?.[0]).toBe('/api/toa-nha/1/ky-thanh-toan/8/hoa-don/10/thanh-toan')
  expect(JSON.parse(String(submission?.[1]?.body))).toMatchObject({ soTien: '100000.25', xacNhanThuThem: false })
  expect(container.textContent).toContain('Đã ghi BL-42')
  expect(container.textContent).toContain('199.999,75')
})

it('FR-INV-14 counter entry requires a reason and keeps the original ledger entry', async () => {
  const fetchMock = vi.fn(async (url: string) => url.endsWith('/doi-ung') ? response({ ...payment, loai: 'DOI_UNG' }) : response(ledger))
  vi.stubGlobal('fetch', fetchMock)
  await act(async () => root.render(<FinancePaymentPanel token="token" hoaDonId={10} trangThai="DA_PHAT_HANH" />))
  await act(async () => Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Lập đối ứng')!.click())
  await act(async () => { setText('[aria-label="Số tiền đối ứng"]', '50000.50'); setText('[aria-label="Lý do đối ứng"]', 'Ghi nhầm số tiền') })
  await act(async () => container.querySelectorAll('form')[1].dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
  expect(fetchMock).toHaveBeenCalledWith('/api/thanh-toan/41/doi-ung', expect.objectContaining({ method: 'POST', body: JSON.stringify({ soTien: '50000.50', lyDo: 'Ghi nhầm số tiền' }) }))
  expect(container.textContent).toContain('BL-41')
})

it('FR-RPT-04 Excel download retains building, room and date filters', async () => {
  const fetchMock = vi.fn(async () => new Response('xlsx'))
  vi.stubGlobal('fetch', fetchMock)
  Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(() => 'blob:test'), configurable: true })
  Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  await act(async () => root.render(<ExcelExportButton token="token" report="chi-phi-bao-tri" filters={{ toaNhaId: 7, phongId: 101, tuNgay: '2026-10-01', denNgay: '2026-10-31' }} />))
  await act(async () => container.querySelector('button')!.click())
  expect(fetchMock).toHaveBeenCalledWith('/api/bao-cao/chi-phi-bao-tri/xuat-excel?toaNhaId=7&phongId=101&tuNgay=2026-10-01&denNgay=2026-10-31', { headers: { Authorization: 'Bearer token' } })
})

it('FR-INV-06 replacement requires confirmation and calls the atomic replacement action', async () => {
  const fetchMock = vi.fn(async () => response({ hoaDonMoiId: 99 }))
  vi.stubGlobal('fetch', fetchMock)
  const invoice = { hoaDonId: 10, trangThai: 'DA_PHAT_HANH', maHoaDon: 'HD-10' } as ThongTinHoaDonChiTiet
  await act(async () => root.render(<InvoiceActions token="token" scope={{ toaNhaId: 1, kyId: 8, hoaDonId: 10 }} hoaDon={invoice} vaiTro="CHU" onChanged={() => {}} />))
  const replace = () => Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Tạo hoá đơn thay thế')!
  expect(replace().getAttribute('aria-disabled')).toBe('true')
  await act(async () => { setText('[aria-label="Lý do huỷ hoá đơn"]', 'Chỉ số được sửa đúng'); (container.querySelector('input[type="checkbox"]') as HTMLInputElement).click() })
  await act(async () => replace().click())
  expect(fetchMock).toHaveBeenCalledWith('/api/toa-nha/1/ky-thanh-toan/8/hoa-don/10/thay-the', expect.objectContaining({ method: 'POST', body: JSON.stringify({ lyDo: 'Chỉ số được sửa đúng' }) }))
  expect(container.querySelector('a')?.getAttribute('href')).toContain('hoaDonId=99')
})
