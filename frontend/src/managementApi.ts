import { ApiError } from './api'

export async function managementRequest<T>(token: string | null, url: string, method = 'GET', body?: unknown): Promise<T> {
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
  const isForm = body instanceof FormData
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'
  const response = await fetch(url, { method, headers, body: body === undefined ? undefined : isForm ? body : JSON.stringify(body) })
  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { thongBao?: string; detail?: string }
    throw new ApiError(response.status, data.thongBao ?? data.detail ?? 'Không thể hoàn thành thao tác. Vui lòng thử lại.')
  }
  if (response.status === 204 || response.headers.get('Content-Length') === '0') return undefined as T
  return response.json() as Promise<T>
}

export async function downloadManagementFile(token: string, url: string, filename: string) {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) throw new Error('Không thể tải tệp. Kiểm tra quyền truy cập và thử lại.')
  const objectUrl = URL.createObjectURL(await response.blob())
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

export type Tenant = { id: number; hoTen: string; ngaySinh: string; soDienThoai: string; soGiayToChe: string; soGiayTo?: string; queQuan: string; canhBao: string[] }
export type Service = { id: number; toaNhaId: number; ten: string; cachTinh: string; cheDoGia: string; donVi: string; laDien: boolean; dangSuDung: boolean }
export type Occupant = { id: number; nguoiThueId: number; hoTen: string; quanHe: string; tuNgay: string; denNgay: string | null }
export type Worker = { id: number; hoTen: string; soDienThoai: string }
