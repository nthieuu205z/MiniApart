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

export type ThongTinKyThanhToan = {
  id: number
  nam: number
  thang: number
  ngayBatDau: string
  ngayKetThuc: string
  trangThai: string
}

export type ThongTinPhongChuaGhiChiSo = {
  id: number
  soPhong: string
  tang: number
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
  batBuocAnhCongTo: boolean
}

export type ThongTinPhong = {
  id: number | null
  toaNhaId: number
  soPhong: string
  tang: number
  dienTich: string
  sucChua: number
  giaThueMacDinh: string
  loaiPhong: string
  trangThai: string
  tenTrangThai: string
}

export type YeuCauPhong = {
  soPhong: string
  tang: number
  dienTich: string
  sucChua: number
  giaThueMacDinh: string
  loaiPhong: string
}

export type YeuCauPhongHangLoat = {
  soBatDau: string
  soKetThuc: string
  tang: number
  dienTich: string
  sucChua: number
  giaThueMacDinh: string
  loaiPhong: string
}

export type KetQuaPhongHangLoat = {
  phong: ThongTinPhong[]
}

export type ThongTinGhiChiSo = {
  tongPhong: number
  daGhi: number
  phong: Array<{
    id: number
    soPhong: string
    tang: number
    dichVu: Array<{
      id: number
      tenDichVu: string
      donVi: string
      chiSoDau: string
      chiSoCuoi?: string | null
      mucTieuThu?: string | null
      coThayCongTo: boolean
      chiSoCuoiCongToCu?: string | null
      chiSoDauCongToMoi?: string | null
      anhCongToId?: number | null
      daXacNhanCanhBao?: boolean
      thongTinCanhBaoTieuThu?: {
        soKyLichSu: number
        trungBinhBaKyTruoc: string
        nguongCanhBao: string
      } | null
    }>
  }>
}

export type YeuCauGhiChiSo = {
  phongId: number
  dichVuId: number
  chiSoCuoi: string
  coThayCongTo: boolean
  chiSoCuoiCongToCu?: string
  chiSoDauCongToMoi?: string
  xacNhanCanhBao?: boolean
  tep?: File
}

export type ThongTinKetQuaGhiChiSo = {
  phongId: number
  dichVuId: number
  chiSoDau: string
  chiSoCuoi: string
  mucTieuThu: string
  coThayCongTo: boolean
  chiSoCuoiCongToCu?: string | null
  chiSoDauCongToMoi?: string | null
  anhCongToId?: number | null
  canhBaoTieuThuBatThuong?: {
    coCanhBao: boolean
    thongBaoCanhBao: string
    mucTieuThuKyNay: string
    trungBinhBaKyTruoc: string
    gapTrungBinh: string
    nguongCanhBao: string
  } | null
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
  batBuocAnhCongTo: boolean
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

export async function fetchPhong(token: string, toaNhaId: number, tang?: number): Promise<ThongTinPhong[]> {
  const query = tang === undefined ? '' : `?tang=${tang}`
  const response = await fetch(`/api/toa-nha/${toaNhaId}/phong${query}`, {
    headers: authorizationHeaders(token),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể tải danh sách phòng.')
  }

  return response.json() as Promise<ThongTinPhong[]>
}

export async function fetchKyThanhToan(token: string, toaNhaId: number): Promise<ThongTinKyThanhToan[]> {
  const response = await fetch(`/api/toa-nha/${toaNhaId}/ky-thanh-toan`, {
    headers: authorizationHeaders(token),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể tải danh sách kỳ thanh toán.')
  }

  return response.json() as Promise<ThongTinKyThanhToan[]>
}

export async function fetchChiSoDichVu(
  token: string,
  toaNhaId: number,
  kyId: number,
): Promise<ThongTinGhiChiSo> {
  const response = await fetch(`/api/toa-nha/${toaNhaId}/ky-thanh-toan/${kyId}/chi-so`, {
    headers: authorizationHeaders(token),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể tải danh sách ghi chỉ số.')
  }

  return response.json() as Promise<ThongTinGhiChiSo>
}

export async function fetchPhongChuaGhiChiSo(
  token: string,
  toaNhaId: number,
  kyId: number,
): Promise<ThongTinPhongChuaGhiChiSo[]> {
  const response = await fetch(`/api/toa-nha/${toaNhaId}/ky-thanh-toan/${kyId}/thieu-chi-so`, {
    headers: authorizationHeaders(token),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể tải danh sách phòng còn thiếu chỉ số.')
  }

  return response.json() as Promise<ThongTinPhongChuaGhiChiSo[]>
}

export async function ghiChiSoDichVu(
  token: string,
  toaNhaId: number,
  kyId: number,
  payload: YeuCauGhiChiSo,
): Promise<ThongTinKetQuaGhiChiSo> {
  const tep = payload.tep
  const response = await fetch(`/api/toa-nha/${toaNhaId}/ky-thanh-toan/${kyId}/chi-so`, {
    method: 'POST',
    headers: tep ? authorizationHeaders(token) : jsonAuthorizationHeaders(token),
    body: tep ? taoFormDataGhiChiSo(payload) : JSON.stringify(payload),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể lưu chỉ số.')
  }

  return response.json() as Promise<ThongTinKetQuaGhiChiSo>
}

export async function chotKyThanhToan(
  token: string,
  toaNhaId: number,
  kyId: number,
): Promise<{ kyThanhToan: ThongTinKyThanhToan } | { phongThieuChiSo: ThongTinPhongChuaGhiChiSo[] }> {
  const response = await fetch(`/api/toa-nha/${toaNhaId}/ky-thanh-toan/${kyId}/chot`, {
    method: 'POST',
    headers: authorizationHeaders(token),
  })

  if (response.ok) {
    return { kyThanhToan: await response.json() as ThongTinKyThanhToan }
  }

  if (response.status === 409) {
    const body = await docJsonNeuCo(response)
    if (laDanhSachPhongChuaGhiChiSo(body)) {
      return { phongThieuChiSo: body }
    }
    throw taoApiErrorTuBody(response.status, body, 'Không thể chốt kỳ thanh toán.')
  }

  throw await toApiError(response, 'Không thể chốt kỳ thanh toán.')
}

function taoFormDataGhiChiSo(payload: YeuCauGhiChiSo): FormData {
  const formData = new FormData()
  formData.set('phongId', String(payload.phongId))
  formData.set('dichVuId', String(payload.dichVuId))
  formData.set('chiSoCuoi', payload.chiSoCuoi)
  formData.set('coThayCongTo', String(payload.coThayCongTo))
  if (payload.chiSoCuoiCongToCu !== undefined) formData.set('chiSoCuoiCongToCu', payload.chiSoCuoiCongToCu)
  if (payload.chiSoDauCongToMoi !== undefined) formData.set('chiSoDauCongToMoi', payload.chiSoDauCongToMoi)
  if (payload.xacNhanCanhBao) {
    formData.set('xacNhanCanhBao', 'true')
  }
  if (payload.tep) {
    formData.set('tep', payload.tep)
  }
  return formData
}

export async function taoPhong(token: string, toaNhaId: number, payload: YeuCauPhong): Promise<ThongTinPhong> {
  const response = await fetch(`/api/toa-nha/${toaNhaId}/phong`, {
    method: 'POST',
    headers: jsonAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể tạo phòng.')
  }

  return response.json() as Promise<ThongTinPhong>
}

export async function xemTruocPhongHangLoat(
  token: string,
  toaNhaId: number,
  payload: YeuCauPhongHangLoat,
): Promise<KetQuaPhongHangLoat> {
  const response = await fetch(`/api/toa-nha/${toaNhaId}/phong/hang-loat/xem-truoc`, {
    method: 'POST',
    headers: jsonAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể xem trước dãy phòng.')
  }

  return response.json() as Promise<KetQuaPhongHangLoat>
}

export async function taoPhongHangLoat(
  token: string,
  toaNhaId: number,
  payload: YeuCauPhongHangLoat,
): Promise<KetQuaPhongHangLoat> {
  const response = await fetch(`/api/toa-nha/${toaNhaId}/phong/hang-loat`, {
    method: 'POST',
    headers: jsonAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể tạo dãy phòng.')
  }

  return response.json() as Promise<KetQuaPhongHangLoat>
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
  return taoApiErrorTuBody(response.status, await docJsonNeuCo(response), fallbackMessage)
}

async function docJsonNeuCo(response: Response): Promise<unknown> {
  const contentType = response.headers.get('Content-Type') ?? ''
  if (!contentType.includes('application/json')) return null
  return response.json()
}

function taoApiErrorTuBody(status: number, body: unknown, fallbackMessage: string) {
  const message = typeof body === 'object' && body !== null && 'thongBao' in body && typeof body.thongBao === 'string'
    ? body.thongBao
    : fallbackMessage
  return new ApiError(status, message)
}

function laDanhSachPhongChuaGhiChiSo(body: unknown): body is ThongTinPhongChuaGhiChiSo[] {
  return Array.isArray(body) && body.every((item) => (
    typeof item === 'object'
    && item !== null
    && 'id' in item
    && 'soPhong' in item
    && 'tang' in item
  ))
}
