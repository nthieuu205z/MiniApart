export type HealthStatus = {
  status: string
  database: string
}

export type ThongTinNguoiDung = {
  id: number
  hoTen: string
  soDienThoai: string
  vaiTro: string
  tenVaiTro: string
}

export type DangNhapRequest = {
  soDienThoai: string
  matKhau: string
}

export type DangNhapResponse = {
  token: string
  thoiHanGiay: number
  nguoiDung: ThongTinNguoiDung
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function fetchHealth(): Promise<HealthStatus> {
  const response = await fetch('/api/health')

  if (!response.ok) {
    throw new Error('Không thể kết nối tới máy chủ.')
  }

  return response.json() as Promise<HealthStatus>
}

export async function login(payload: DangNhapRequest): Promise<DangNhapResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Đăng nhập không thành công.')
  }

  return response.json() as Promise<DangNhapResponse>
}

export async function fetchCurrentUser(token: string): Promise<ThongTinNguoiDung> {
  const response = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể tải thông tin người dùng.')
  }

  return response.json() as Promise<ThongTinNguoiDung>
}

async function toApiError(response: Response, fallbackMessage: string) {
  const contentType = response.headers.get('Content-Type') ?? ''
  if (contentType.includes('application/json')) {
    const body = (await response.json()) as { thongBao?: string }
    return new ApiError(response.status, body.thongBao ?? fallbackMessage)
  }

  return new ApiError(response.status, fallbackMessage)
}
