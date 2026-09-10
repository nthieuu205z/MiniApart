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
  maNganHang: string
  tkNganHang: string
  nguongThatThoat: string
  batBuocAnhCongTo: boolean
}

export type ThongTinNhomViecVanHanh = {
  ma: string
  tieuDe: string
  soLuong: number | null
  trangThai: string
  tenTrangThai: string
  khanCap: boolean
  lienKet: string | null
}

export type ThongTinBangViecVanHanh = {
  toaNhaId: number
  tenToaNha: string
  nhomViec: ThongTinNhomViecVanHanh[]
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

export type ThongTinBacHoaDon = {
  bac: number
  tuSoLuong: string
  denSoLuong?: string | null
  dinhMucQuyDoi?: string | null
  soLuong: string
  donGia: string
  thanhTien: string
  dienGiai: string
}

export type ThongTinDongHoaDon = {
  tenKhoan: string
  chiSoDau?: string | null
  chiSoCuoi?: string | null
  soLuong?: string | null
  donGia?: string | null
  thanhTien: string
  loaiKhoan: string
  dichVuId?: number | null
  dienGiai: string
  anhCongToId?: number | null
  anhCongToUrl?: string | null
  cacBac: ThongTinBacHoaDon[]
  lyDo?: string | null
}

export type ThongTinHoaDonChiTiet = {
  hoaDonId: number
  maHoaDon: string
  kyId: number | null
  hopDongId: number
  soPhong: string
  nguoiThue: string
  ngayPhatHanh: string
  hanThanhToan: string
  trangThai: string
  tongTien: string
  daThu: string
  conLai: string
  soNguoiO?: number | null
  soHoQuyDoi?: number | null
  giaiThichSoHo?: string | null
  cacDong: ThongTinDongHoaDon[]
}

export type ThongTinHoaDonQuanLy = {
  hoaDonId: number
  maHoaDon: string
  kyId: number | null
  hopDongId: number
  soPhong: string
  nguoiThue: string
  hanThanhToan: string
  trangThai: string
  tongTien: string
  daThu: string
  conLai: string
}

export type ThongTinHoaDonMoiNhat = {
  coHoaDon: boolean
  thongBao?: string
  hoaDon?: ThongTinHoaDonChiTiet
}

export type ThongTinHoaDonLichSu = {
  hoaDonId: number
  maHoaDon: string
  toaNhaId: number
  kyId: number | null
  hopDongId: number
  nam: number | null
  thang: number | null
  ngayBatDau: string | null
  ngayKetThuc: string | null
  soPhong: string
  maToa: string
  tenToaNha: string
  ngayPhatHanh: string
  hanThanhToan: string
  trangThai: string
  trangThaiThanhToan: string
  hopDongTrangThai: string
  tongTien: string
  daThu: string
  conLai: string
}

export type ThongTinTieuThu = {
  kyId: number
  hoaDonId: number
  nam: number
  thang: number
  hopDongId: number
  soPhong: string
  dichVuId: number
  tenDichVu: string
  donVi: string
  chiSoDau: string | null
  chiSoCuoi: string | null
  mucTieuThu: string | null
}

export type ThongTinBieuDoTieuThu = {
  dien: ThongTinTieuThu[]
  nuoc: ThongTinTieuThu[]
}

export type ThongTinHopDongDichVu = {
  dichVuId: number
  tenDichVu: string
  donGiaApDung: string
}

export type ThongTinHopDong = {
  id: number
  phongId: number
  soPhong: string
  nguoiThueId: number
  hoTenNguoiThue: string
  ngayBatDau: string
  ngayKetThuc: string
  giaThue: string
  tienCoc: string
  soNgayBaoTruoc: number
  trangThai: string
  tenTrangThai: string
  sapHetHan: boolean
  soNgayConLai: number
  dichVuApDung: ThongTinHopDongDichVu[]
  quyetToan: unknown | null
}

export type ThongTinViecCuaToi = {
  id: number
  maYeuCau?: string
  phongId?: number
  soPhong: string
  tang: number
  toaNha: string
  hangMuc?: string
  moTa: string
  mucDo: string
  tenMucDo: string
  trangThai: string
  tenTrangThai?: string
  soDienThoaiLienHe: string | null
  anh: Array<{ id: number }>
}

export type ThongTinLichSuSuaChua = {
  yeuCau: Array<{
    id: number
    toaNhaId: number
    toaNha: string
    phongId: number
    soPhong: string
    hangMuc: string
    moTa: string
    trangThai: string
    tenTrangThai: string
    chiPhi: string | null
    benChiuChiPhi: string | null
    taoLuc: string
  }>
  tongChiPhiChuNha: string
  tongChiPhiNguoiThue: string
}

export type BoLocLichSuSuaChua = {
  toaNhaId?: number
  phongId?: number
  hangMuc?: string
  hienThiDaHuy?: boolean
  boLoc?: 'TON_DONG_QUA_48_GIO'
}

export type ThongTinThongBao = {
  maThamChieu: string
  tieuDe: string
  noiDung: string
  daDoc: boolean
  docLuc: string | null
  taoLuc: string
  hetHanLuc?: string | null
  daLuuTru?: boolean
  anh?: Array<{ id: number }>
}

export type ThongTinHopThongBao = {
  thongBao: ThongTinThongBao[]
  soChuaDoc: number
}

export type LienKetAnhKy = {
  url: string
}

export type YeuCauThongBaoChung = {
  toaNhaId: number
  phamVi: 'TOA_NHA' | 'TANG' | 'PHONG'
  tang?: number
  phongIds?: number[]
  tieuDe: string
  noiDung: string
  hetHanLuc: string
}

export type ThongTinXemTruocThongBaoChung = {
  soNguoiNhan: number
  soPhongNhan: number
  soPhongKhongCoTaiKhoan: number
}

export type ThongTinGuiThongBaoChung = ThongTinXemTruocThongBaoChung & {
  maThamChieu: string
}

export type YeuCauToaNha = {
  maToa: string
  ten: string
  diaChi: string
  soTang: number
  ngayChotSo: number
  soNgayHanTt: number
  maNganHang: string
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

/** FR-NTF-01 reads the server-scoped operational dashboard for one building. */
export async function fetchBangViecVanHanh(token: string, toaNhaId: number): Promise<ThongTinBangViecVanHanh> {
  const response = await fetch(`/api/toa-nha/${toaNhaId}/bang-viec`, {
    headers: authorizationHeaders(token),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể tải bảng việc vận hành.')
  }

  return response.json() as Promise<ThongTinBangViecVanHanh>
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

export async function fetchHoaDonChiTiet(
  token: string,
  toaNhaId: number,
  kyId: number,
  hoaDonId: number,
): Promise<ThongTinHoaDonChiTiet> {
  const response = await fetch(`/api/toa-nha/${toaNhaId}/ky-thanh-toan/${kyId}/hoa-don/${hoaDonId}`, {
    headers: authorizationHeaders(token),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể tải chi tiết hoá đơn.')
  }

  return response.json() as Promise<ThongTinHoaDonChiTiet>
}

export async function fetchHoaDonMoiNhatCuaNguoiThue(token: string): Promise<ThongTinHoaDonMoiNhat> {
  const response = await fetch('/api/cong/hoa-don-moi-nhat', {
    headers: authorizationHeaders(token),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể tải hoá đơn mới nhất.')
  }

  return response.json() as Promise<ThongTinHoaDonMoiNhat>
}

/** FR-POR-03 returns the tenant's own invoice periods in newest-first order. */
export async function fetchLichSuHoaDonCuaNguoiThue(token: string): Promise<ThongTinHoaDonLichSu[]> {
  const response = await fetch('/api/cong/hoa-don', {
    headers: authorizationHeaders(token),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể tải lịch sử hoá đơn.')
  }

  return response.json() as Promise<ThongTinHoaDonLichSu[]>
}

/** FR-POR-05 returns the tenant's own electricity and water consumption for up to twelve periods. */
export async function fetchTieuThuCuaNguoiThue(token: string, soKy = 12): Promise<ThongTinBieuDoTieuThu> {
  const response = await fetch(`/api/cong/tieu-thu?soKy=${soKy}`, {
    headers: authorizationHeaders(token),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể tải dữ liệu tiêu thụ.')
  }

  return response.json() as Promise<ThongTinBieuDoTieuThu>
}

/** FR-POR-07/FR-POR-04 returns the authenticated tenant's current and historical contracts. */
export async function fetchHopDongCuaNguoiThue(token: string): Promise<ThongTinHopDong[]> {
  const response = await fetch('/api/cong/hop-dong', {
    headers: authorizationHeaders(token),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể tải thông tin hợp đồng.')
  }

  return response.json() as Promise<ThongTinHopDong[]>
}

/** FR-BLD-06 returns contracts visible to an owner or manager for one building. */
export async function fetchHopDongQuanLy(token: string, toaNhaId: number): Promise<ThongTinHopDong[]> {
  const response = await fetch(`/api/hop-dong?toaNhaId=${toaNhaId}`, {
    headers: authorizationHeaders(token),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể tải danh sách hợp đồng.')
  }

  return response.json() as Promise<ThongTinHopDong[]>
}

/** FR-POR-03/FR-POR-04 opens one history row through the tenant-scoped endpoint. */
export async function fetchHoaDonCuaNguoiThue(token: string, hoaDonId: number): Promise<ThongTinHoaDonChiTiet> {
  const response = await fetch(`/api/cong/hoa-don/${hoaDonId}`, {
    headers: authorizationHeaders(token),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể tải chi tiết hoá đơn.')
  }

  return response.json() as Promise<ThongTinHoaDonChiTiet>
}

/** FR-INV-02 returns the manager worklist for one building and operational status. */
export async function fetchHoaDonQuanLy(
  token: string,
  toaNhaId: number,
  trangThai = 'NO_QUA_HAN',
): Promise<ThongTinHoaDonQuanLy[]> {
  const query = new URLSearchParams({ toaNhaId: String(toaNhaId), trangThai })
  const response = await fetch(`/api/hoa-don?${query.toString()}`, {
    headers: authorizationHeaders(token),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể tải danh sách hoá đơn.')
  }

  return response.json() as Promise<ThongTinHoaDonQuanLy[]>
}

/** FR-POR-06 asks for a fresh 15-minute signed meter-photo link without reloading the invoice. */
export async function fetchLienKetAnh(token: string, anhId: number): Promise<string> {
  const response = await fetch(`/api/anh/${anhId}/lien-ket`, {
    headers: authorizationHeaders(token),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể lấy lại liên kết ảnh công tơ.')
  }

  const lienKet = await response.json() as LienKetAnhKy
  return lienKet.url
}

/** FR-NTF-02 fetches a private common-notification image with the recipient's authorization. */
export async function fetchAnhThongBao(token: string, anhId: number): Promise<string> {
  const signedUrl = await fetchLienKetAnh(token, anhId)
  const response = await fetch(signedUrl, { headers: authorizationHeaders(token) })
  if (!response.ok) {
    throw await toApiError(response, 'Không thể tải ảnh thông báo.')
  }
  return URL.createObjectURL(await response.blob())
}

/** FR-MNT-04 returns the active repair work assigned to the authenticated worker. */
export async function fetchViecCuaToi(token: string): Promise<ThongTinViecCuaToi[]> {
  const response = await fetch('/api/tho/viec-cua-toi', {
    headers: authorizationHeaders(token),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể tải danh sách việc.')
  }

  return response.json() as Promise<ThongTinViecCuaToi[]>
}

/** FR-MNT-08 reads operational repair history with exact numeric money strings. */
export async function fetchLichSuSuaChua(
  token: string,
  boLoc: BoLocLichSuSuaChua,
): Promise<ThongTinLichSuSuaChua> {
  const query = new URLSearchParams()
  if (boLoc.toaNhaId !== undefined) query.set('toaNhaId', String(boLoc.toaNhaId))
  if (boLoc.phongId !== undefined) query.set('phongId', String(boLoc.phongId))
  if (boLoc.hangMuc?.trim()) query.set('hangMuc', boLoc.hangMuc.trim())
  if (boLoc.hienThiDaHuy) query.set('hienThiDaHuy', 'true')
  if (boLoc.boLoc) query.set('boLoc', boLoc.boLoc)
  const response = await fetch(`/api/yeu-cau-sua-chua/lich-su?${query.toString()}`, {
    headers: authorizationHeaders(token),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể tải lịch sử sửa chữa.')
  }

  return response.json() as Promise<ThongTinLichSuSuaChua>
}

/** FR-MNT-02/FR-MNT-04/FR-INV-08 returns the authenticated user's notification inbox. */
export async function fetchThongBao(token: string): Promise<ThongTinHopThongBao> {
  const response = await fetch('/api/thong-bao', {
    headers: authorizationHeaders(token),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể tải hộp thông báo.')
  }

  return response.json() as Promise<ThongTinHopThongBao>
}

/** FR-NTF-02/FR-NTF-07 reads expired notifications from the immutable archive. */
export async function fetchThongBaoLuuTru(token: string): Promise<ThongTinHopThongBao> {
  const response = await fetch('/api/thong-bao/luu-tru', {
    headers: authorizationHeaders(token),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể tải kho lưu trữ thông báo.')
  }

  return response.json() as Promise<ThongTinHopThongBao>
}

/** FR-NTF-02/FR-NTF-07 previews recipient counts before a manager sends a common notification. */
export async function xemTruocThongBaoChung(
  token: string,
  payload: YeuCauThongBaoChung,
): Promise<ThongTinXemTruocThongBaoChung> {
  const response = await fetch('/api/thong-bao/chung/xem-truoc', {
    method: 'POST',
    headers: jsonAuthorizationHeaders(token),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể xem trước người nhận.')
  }

  return response.json() as Promise<ThongTinXemTruocThongBaoChung>
}

/** FR-NTF-02/FR-NTF-07 sends one idempotent common notification as JSON. */
export async function guiThongBaoChung(
  token: string,
  payload: YeuCauThongBaoChung,
  idempotencyKey: string,
): Promise<ThongTinGuiThongBaoChung> {
  const response = await fetch('/api/thong-bao/chung', {
    method: 'POST',
    headers: {
      ...jsonAuthorizationHeaders(token),
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể gửi thông báo chung.')
  }

  return response.json() as Promise<ThongTinGuiThongBaoChung>
}

/** FR-NTF-02/FR-NTF-07 sends one common notification with a private image attachment. */
export async function guiThongBaoChungCoAnh(
  token: string,
  payload: YeuCauThongBaoChung,
  idempotencyKey: string,
  tep: File,
): Promise<ThongTinGuiThongBaoChung> {
  const formData = new FormData()
  formData.set('toaNhaId', String(payload.toaNhaId))
  formData.set('phamVi', payload.phamVi)
  if (payload.tang !== undefined) formData.set('tang', String(payload.tang))
  if (payload.phongIds?.length) formData.set('phongIds', payload.phongIds.join(','))
  formData.set('tieuDe', payload.tieuDe)
  formData.set('noiDung', payload.noiDung)
  formData.set('hetHanLuc', payload.hetHanLuc)
  formData.set('tep', tep)
  const response = await fetch('/api/thong-bao/chung', {
    method: 'POST',
    headers: {
      ...authorizationHeaders(token),
      'Idempotency-Key': idempotencyKey,
    },
    body: formData,
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể gửi thông báo chung.')
  }

  return response.json() as Promise<ThongTinGuiThongBaoChung>
}

/** FR-MNT-02/FR-MNT-04/FR-INV-08 marks one notification owned by the user as read. */
export async function danhDauThongBaoDaDoc(token: string, maThamChieu: string): Promise<ThongTinThongBao> {
  const response = await fetch(`/api/thong-bao/${encodeURIComponent(maThamChieu)}/da-doc`, {
    method: 'POST',
    headers: authorizationHeaders(token),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể đánh dấu thông báo đã đọc.')
  }

  return response.json() as Promise<ThongTinThongBao>
}

/** FR-MNT-04 moves one assigned repair from allocated to in-progress. */
export async function batDauXuLyViec(token: string, yeuCauId: number): Promise<ThongTinViecCuaToi> {
  const response = await fetch(`/api/yeu-cau-sua-chua/${yeuCauId}/bat-dau-xu-ly`, {
    method: 'POST',
    headers: authorizationHeaders(token),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể bắt đầu xử lý việc.')
  }

  return response.json() as Promise<ThongTinViecCuaToi>
}

/** FR-MNT-04 moves one assigned repair from in-progress to awaiting confirmation. */
export async function hoanThanhViec(token: string, yeuCauId: number): Promise<ThongTinViecCuaToi> {
  const response = await fetch(`/api/yeu-cau-sua-chua/${yeuCauId}/hoan-thanh`, {
    method: 'POST',
    headers: authorizationHeaders(token),
  })

  if (!response.ok) {
    throw await toApiError(response, 'Không thể báo đã sửa xong.')
  }

  return response.json() as Promise<ThongTinViecCuaToi>
}

/** FR-MNT-04 keeps the worker's single completion action as an ordered two-step API call. */
export async function hoanThanhViecCuaToi(token: string, yeuCauId: number): Promise<ThongTinViecCuaToi> {
  try {
    await batDauXuLyViec(token, yeuCauId)
  } catch (reason) {
    if (!(reason instanceof ApiError) || reason.status !== 409) {
      throw reason
    }
  }
  try {
    return await hoanThanhViec(token, yeuCauId)
  } catch (reason) {
    if (!(reason instanceof ApiError) || reason.status !== 409) {
      throw reason
    }

    const danhSach = await fetchViecCuaToi(token)
    const viec = danhSach.find((item) => item.id === yeuCauId)
    if (viec && ['CHO_XAC_NHAN', 'DA_DONG', 'DA_HUY'].includes(viec.trangThai)) {
      return viec
    }
    throw reason
  }
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
