import { ApiError } from './api'

export type InvoiceScope = { toaNhaId: number; kyId: number; hoaDonId: number }
export type BulkResult = { soHoaDonTaoMoi?: number; soHoaDonDaTonTai?: number; soPhongBoQua?: number; soHoaDonDaPhatHanh?: number; soHoaDonDaOTrangThaiKhac?: number; soHoaDonBoQua?: number; lyDoBoQua: { phongId: number; ma: string; moTa: string }[] }
export type Payment = { thanhToanId: number; hoaDonId: number; maBienLai: string; soTien: string; hinhThuc: string; loai: string; ngayThu: string; tongTien: string; daThu: string; conLai: string; soTienThanhSoDu: string; trangThai: string }
export type LedgerEntry = { id: number; maBienLai: string; soTien: string; hinhThuc: string | null; loai: string; ngayThu: string | null; lyDo: string | null; dieuChinhChoId: number | null }
export type Ledger = { hoaDonId: number; hopDongId: number; kyId: number | null; toaNhaId: number; giaoDich: LedgerEntry[] }
export type Deposit = { hopDongId: number; tienCocThoaThuan: string; tongDaThu: string; conLaiChuaThu: string; giaoDich: { id: number; loai: string; soTien: string; ngay: string; maBienLai: string; lyDo: string | null }[] }
export type Settlement = { hoaDonCuoiId: number; tongHoaDonCuoi: string; daThuCoc: string; congNo: string; khauTru: string; hoanCoc: string; hoaDonQuyetToanId: number | null }
export type PaymentCommand = { soTien: string; hinhThuc: 'TIEN_MAT' | 'CHUYEN_KHOAN'; ngayThu: string; xacNhanThuThem: boolean }

/** FR-INV keeps submitted monetary values as decimal strings. */
export async function financeRequest<T>(token: string, url: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  if (!response.ok) throw await financeError(response)
  if (response.status === 204) return undefined as T
  const text = await response.text()
  return text ? JSON.parse(text) as T : undefined as T
}

export const invoiceUrl = ({ toaNhaId, kyId, hoaDonId }: InvoiceScope) => `/api/toa-nha/${toaNhaId}/ky-thanh-toan/${kyId}/hoa-don/${hoaDonId}`
export const bulkInvoice = (token: string, building: number, period: number, action: 'tao-hang-loat' | 'phat-hanh-hang-loat') => financeRequest<BulkResult>(token, `/api/toa-nha/${building}/ky-thanh-toan/${period}/hoa-don/${action}`, 'POST')
export const invoiceAction = (token: string, scope: InvoiceScope, action: string, body?: unknown) => financeRequest<void>(token, `${invoiceUrl(scope)}/${action}`, 'POST', body)
export const getLedger = (token: string, invoice: number) => financeRequest<Ledger>(token, `/api/hoa-don/${invoice}/thanh-toan`)
export const recordPayment = (token: string, ledger: Ledger, command: PaymentCommand) => financeRequest<Payment>(token,
  ledger.kyId === null ? `/api/hop-dong/${ledger.hopDongId}/hoa-don-quyet-toan/${ledger.hoaDonId}/thanh-toan`
    : `${invoiceUrl({ toaNhaId: ledger.toaNhaId, kyId: ledger.kyId, hoaDonId: ledger.hoaDonId })}/thanh-toan`, 'POST', command)
export const counterPayment = (token: string, id: number, soTien: string, lyDo: string) => financeRequest<Payment>(token, `/api/thanh-toan/${id}/doi-ung`, 'POST', { soTien, lyDo })
export const getDeposit = (token: string, contract: number) => financeRequest<Deposit>(token, `/api/hop-dong/${contract}/giao-dich-coc`)
export const collectDeposit = (token: string, contract: number, soTien: string, ngay: string, lyDo: string) => financeRequest(token, `/api/hop-dong/${contract}/giao-dich-coc`, 'POST', { soTien, ngay, lyDo })

/** FR-RPT-04 and PDF downloads send the existing authorization token before creating a local download. */
export async function downloadFinanceFile(token: string, url: string, filename: string): Promise<void> {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) throw await financeError(response)
  const link = document.createElement('a')
  const objectUrl = URL.createObjectURL(await response.blob())
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

async function financeError(response: Response): Promise<ApiError> {
  const body = await response.json().catch(() => ({})) as { message?: string; thongBao?: string; detail?: string }
  return new ApiError(response.status, body.message || body.thongBao || body.detail || `Yêu cầu không thực hiện được (${response.status}).`)
}

export function localDate(): string {
  const value = new Date()
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

export function validMoney(value: string): boolean { return /^\d{1,13}(\.\d{1,2})?$/.test(value) && !/^0+(\.0+)?$/.test(value) }
