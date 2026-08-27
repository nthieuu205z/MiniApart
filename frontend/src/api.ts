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

export type ThongTinQuanLyNguoiDung = {
  id: number
  hoTen: string
  soDienThoai: string
  vaiTro: string
  tenVaiTro: string
  trangThai: string
  tenTrangThai: string
  toaNhaIds: number[]
}

export type ThongTinToaNha = {
  id: number
  maToa: string
  ten: string
  diaChi: string
  soTang: number
  ngayChotSo: number
  soNgayHanTt: number
  tkNganHang: string
  nguongThatThoat: string
}

export type YeuCauToaNha = {
  maToa: string
  ten: string
  diaChi: string
  soTang: number
  ngayChotSo: number
  soNgayHanTt: number
  tkNganHang: string
  nguongThatThoat: string
}

export type ThongTinVaiTro = {
  vaiTro: string
  tenVaiTro: string
}

export type YeuCauQuanLyNguoiDung = {
  hoTen: string
  soDienThoai: string
  vaiTro: string
  toaNhaIds: number[]
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

export async function fetchNguoiDungQuanLy(token: string): Promise<ThongTinQuanLyNguoiDung[]> {
  const response = await fetch('/api/nguoi-dung', {
    headers: authorizationHeaders(token),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể tải danh sách tài khoản.')
  }

  return response.json() as Promise<ThongTinQuanLyNguoiDung[]>
}

export async function fetchToaNha(token: string): Promise<ThongTinToaNha[]> {
  const response = await fetch('/api/toa-nha', {
    headers: authorizationHeaders(token),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể tải danh sách toà nhà.')
  }

  return response.json() as Promise<ThongTinToaNha[]>
}

export async function taoToaNha(token: string, payload: YeuCauToaNha): Promise<ThongTinToaNha> {
  const response = await fetch('/api/toa-nha', {
    method: 'POST',
    headers: jsonAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể tạo toà nhà.')
  }

  return response.json() as Promise<ThongTinToaNha>
}

export async function capNhatToaNha(
  token: string,
  id: number,
  payload: YeuCauToaNha,
): Promise<ThongTinToaNha> {
  const response = await fetch(`/api/toa-nha/${id}`, {
    method: 'PUT',
    headers: jsonAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể cập nhật toà nhà.')
  }

  return response.json() as Promise<ThongTinToaNha>
}

export async function fetchVaiTro(token: string): Promise<ThongTinVaiTro[]> {
  const response = await fetch('/api/nguoi-dung/vai-tro', {
    headers: authorizationHeaders(token),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể tải danh sách vai trò.')
  }

  return response.json() as Promise<ThongTinVaiTro[]>
}

export async function taoNguoiDungQuanLy(
  token: string,
  payload: YeuCauQuanLyNguoiDung,
): Promise<ThongTinQuanLyNguoiDung> {
  const response = await fetch('/api/nguoi-dung', {
    method: 'POST',
    headers: jsonAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể tạo tài khoản.')
  }

  return response.json() as Promise<ThongTinQuanLyNguoiDung>
}

export async function capNhatNguoiDungQuanLy(
  token: string,
  id: number,
  payload: YeuCauQuanLyNguoiDung,
): Promise<ThongTinQuanLyNguoiDung> {
  const response = await fetch(`/api/nguoi-dung/${id}`, {
    method: 'PUT',
    headers: jsonAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể cập nhật tài khoản.')
  }

  return response.json() as Promise<ThongTinQuanLyNguoiDung>
}

export async function khoaNguoiDungQuanLy(token: string, id: number): Promise<ThongTinQuanLyNguoiDung> {
  const response = await fetch(`/api/nguoi-dung/${id}/khoa`, {
    method: 'POST',
    headers: authorizationHeaders(token),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể khoá tài khoản.')
  }

  return response.json() as Promise<ThongTinQuanLyNguoiDung>
}

function authorizationHeaders(token: string) {
  return { Authorization: `Bearer ${token}` }
}

function jsonAuthorizationHeaders(token: string) {
  return {
    ...authorizationHeaders(token),
    'Content-Type': 'application/json',
  }
}

async function toApiError(response: Response, fallbackMessage: string) {
  const contentType = response.headers.get('Content-Type') ?? ''
  if (contentType.includes('application/json')) {
    const body = (await response.json()) as { thongBao?: string }
    return new ApiError(response.status, body.thongBao ?? fallbackMessage)
  }

  return new ApiError(response.status, fallbackMessage)
}
