export type TrangThaiBaoGia = 'NHAP' | 'CHO_DUYET' | 'DA_DUYET' | 'TU_CHOI' | 'BI_THAY_THE'
export type PhuongThucThanhToanTho = 'TIEN_MAT' | 'CHUYEN_KHOAN' | 'KHONG_THU_PHI'

export type DongBaoGia = {
  id?: number
  baoGiaId?: number
  thuTu: number
  tenHangMuc: string
  soLuong: number
  donVi: string
  donGia: number
  thanhTien: number
}

export type BaoGiaSuaChua = {
  id: number
  maBaoGia: string
  yeuCauId: number
  phienBan: number
  trangThai: TrangThaiBaoGia
  tongTien: number
  moTa?: string
  ghiChu?: string
  lyDoTuChoi?: string
  nguoiTaoId: number
  taoLuc: string
  nguoiDuyetId?: number
  duyetLuc?: string
  dongBaoGia: DongBaoGia[]
}

export type ThanhToanTho = {
  id: number
  maThanhToan: string
  yeuCauId: number
  baoGiaId?: number
  soTien: number
  phuongThuc: PhuongThucThanhToanTho
  maThamChieu?: string
  nguoiXacNhanId: number
  xacNhanLuc: string
  ghiChu?: string
}

export type ThongTinViecThoRow = {
  id: number
  maYeuCau: string
  hangMuc: string
  moTa: string
  toaNhaId: number
  toaNha: string
  diaChiToaNha: string
  soPhong: string
  tang: number
  nguoiLienHeHoTen: string
  soDienThoaiLienHe: string
  mucDo: 'THUONG' | 'GAP' | 'KHAN_CAP'
  tenMucDo: string
  trangThai: string
  tenTrangThai: string
  trangThaiHieuLuc: string
  tenTrangThaiHieuLuc: string
  phanCongLuc?: string
  taoLuc: string
  choXacNhanLuc?: string
  dongLuc?: string
  giaTriBaoGia?: number
  trangThaiBaoGia?: TrangThaiBaoGia
  tenTrangThaiBaoGia?: string
  daThanhToan: number
  conPhaiTra: number
}

export type KpiTho = {
  dangXuLy: number
  choXacNhan: number
  tyLeHoanThanh: {
    tyLe: number | null
    daHoanThanh: number
    tongDuocGiao: number
    moTa: string
    coDuLieu: boolean
  }
  giaTriDaChot: number
  daNhan: number
  conPhaiTra: number
}

export type ThongKeTrangThai = {
  trangThai: string
  tenTrangThai: string
  soLuong: number
  mauSac: string
}

export type XuHuongTho = {
  nhan: string
  giaTriDaChot: number
  daNhan: number
  soViecXong: number
}

export type BaoGiaCanXuLy = {
  baoGiaId: number
  yeuCauId: number
  maYeuCau: string
  hangMuc: string
  soPhong: string
  toaNha: string
  phienBan: number
  trangThai: TrangThaiBaoGia
  tenTrangThai: string
  tongTien: number
  lyDoTuChoi?: string
  taoLuc: string
}

export type ToaNhaOption = {
  id: number
  ten: string
}

export type ThoTongQuanData = {
  kpi: KpiTho
  bieuDoTrangThai: ThongKeTrangThai[]
  bieuDoXuHuong: XuHuongTho[]
  viecCanXuLy: ThongTinViecThoRow[]
  baoGiaCanBoSung: BaoGiaCanXuLy[]
  danhSachToa: ToaNhaOption[]
}

export type LichSuThaoTacTho = {
  thoiDiem: string
  hanhDong: string
  tenHanhDong: string
  nguoiThucHien: string
  chiTiet?: string
  laTuDong: boolean
}

export type ChiTietViecTho = {
  id: number
  maYeuCau: string
  hangMuc: string
  moTa: string
  mucDo: 'THUONG' | 'GAP' | 'KHAN_CAP'
  tenMucDo: string
  trangThai: string
  tenTrangThai: string
  trangThaiHieuLuc: string
  tenTrangThaiHieuLuc: string
  toaNhaId: number
  toaNha: string
  diaChiToaNha: string
  soPhong: string
  tang: number
  nguoiBaoId?: number
  nguoiBaoHoTen: string
  nguoiBaoSoDienThoai: string
  nguoiLienHeHoTen: string
  soDienThoaiLienHe: string
  laNguoiDungTenHopDong: boolean
  quanLyPhuTrachId?: number
  quanLyPhuTrachHoTen: string
  quanLyPhuTrachSoDienThoai: string
  taoLuc: string
  tiepNhanLuc?: string
  phanCongLuc?: string
  choXacNhanLuc?: string
  dongLuc?: string
  lyDoHuy?: string
  ghiChuKhaoSat?: string
  ketQuaSuaChua?: string
  anhTruocIds: number[]
  anhSauIds: number[]
  lichSuTrangThai: LichSuThaoTacTho[]
  baoGiaHieuLuc?: BaoGiaSuaChua
  danhSachBaoGia: BaoGiaSuaChua[]
  danhSachThanhToan: ThanhToanTho[]
  tongTienBaoGia: number
  tongDaNhan: number
  tongConLai: number
  trangThaiThanhToan: 'CHUA_CO_BAO_GIA' | 'KHONG_PHAT_SINH_TIEN' | 'CHUA_THANH_TOAN' | 'THANH_TOAN_MOT_PHAN' | 'DA_THANH_TOAN_DU'
}

export type ChungTuThanhToanTho = {
  maChungTu: string
  ngayLap: string
  yeuCauId: number
  maYeuCau: string
  hangMuc: string
  toaNha: string
  diaChiToaNha: string
  soPhong: string
  tang: number
  tenTho: string
  sdtTho: string
  tenQuanLy: string
  sdtQuanLy: string
  tenNguoiBao: string
  sdtNguoiBao: string
  trangThaiYeuCau: string
  baoGiaPhienBan: number
  dongBaoGia: DongBaoGia[]
  tongTienBaoGia: number
  lichSuThanhToan: ThanhToanTho[]
  tongDaTra: number
  conLai: number
  ghiChu?: string
}

async function request<T>(token: string, path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${token}`)
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(path, { ...options, headers })
  if (!response.ok) {
    let message = `Yêu cầu thất bại (${response.status})`
    try {
      const err = await response.json()
      if (err.message) message = err.message
    } catch {
      // keep fallback
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as unknown as T
  }
  return response.json()
}

export async function fetchThoTongQuan(
  token: string,
  tuNgay?: string,
  denNgay?: string,
  toaNhaId?: number
): Promise<ThoTongQuanData> {
  const q = new URLSearchParams()
  if (tuNgay) q.set('tuNgay', tuNgay)
  if (denNgay) q.set('denNgay', denNgay)
  if (toaNhaId) q.set('toaNhaId', String(toaNhaId))
  return request<ThoTongQuanData>(token, `/api/tho/tong-quan?${q}`)
}

export async function fetchThoCongViec(
  token: string,
  boLoc?: {
    toaNhaId?: number
    trangThai?: string
    nhom?: string
    mucDo?: string
    tuNgay?: string
    denNgay?: string
    tuKhoa?: string
  }
): Promise<ThongTinViecThoRow[]> {
  const q = new URLSearchParams()
  if (boLoc?.toaNhaId) q.set('toaNhaId', String(boLoc.toaNhaId))
  if (boLoc?.trangThai) q.set('trangThai', boLoc.trangThai)
  if (boLoc?.nhom) q.set('nhom', boLoc.nhom)
  if (boLoc?.mucDo) q.set('mucDo', boLoc.mucDo)
  if (boLoc?.tuNgay) q.set('tuNgay', boLoc.tuNgay)
  if (boLoc?.denNgay) q.set('denNgay', boLoc.denNgay)
  if (boLoc?.tuKhoa) q.set('tuKhoa', boLoc.tuKhoa)
  return request<ThongTinViecThoRow[]>(token, `/api/tho/cong-viec?${q}`)
}

export async function fetchThoChiTietCongViec(token: string, id: number): Promise<ChiTietViecTho> {
  return request<ChiTietViecTho>(token, `/api/tho/cong-viec/${id}`)
}

export async function capNhatKhaoSat(token: string, id: number, ghiChuKhaoSat: string): Promise<void> {
  await request<void>(token, `/api/tho/cong-viec/${id}/khao-sat`, {
    method: 'POST',
    body: JSON.stringify({ ghiChuKhaoSat }),
  })
}

export async function taoBaoGia(
  token: string,
  id: number,
  data: {
    moTa?: string
    ghiChu?: string
    dongBaoGia: Array<{ tenHangMuc: string; soLuong: number; donVi: string; donGia: number }>
    guiDuyetNgay: boolean
  }
): Promise<BaoGiaSuaChua> {
  return request<BaoGiaSuaChua>(token, `/api/tho/cong-viec/${id}/bao-gia`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function guiDuyetBaoGia(token: string, id: number, baoGiaId: number): Promise<BaoGiaSuaChua> {
  return request<BaoGiaSuaChua>(token, `/api/tho/cong-viec/${id}/bao-gia/${baoGiaId}/gui-duyet`, {
    method: 'POST',
  })
}

export async function baoXongViecTho(token: string, id: number, ketQuaSuaChua: string): Promise<void> {
  await request<void>(token, `/api/tho/cong-viec/${id}/bao-xong`, {
    method: 'POST',
    body: JSON.stringify({ ketQuaSuaChua }),
  })
}

export async function fetchThoChungTu(token: string, id: number): Promise<ChungTuThanhToanTho> {
  return request<ChungTuThanhToanTho>(token, `/api/tho/chung-tu/${id}`)
}

// Manager functions
export async function duyetBaoGia(token: string, yeuCauId: number, baoGiaId: number): Promise<void> {
  await request<void>(token, `/api/yeu-cau-sua-chua/${yeuCauId}/bao-gia/${baoGiaId}/duyet`, {
    method: 'POST',
  })
}

export async function tuChoiBaoGia(token: string, yeuCauId: number, baoGiaId: number, lyDoTuChoi: string): Promise<void> {
  await request<void>(token, `/api/yeu-cau-sua-chua/${yeuCauId}/bao-gia/${baoGiaId}/tu-choi`, {
    method: 'POST',
    body: JSON.stringify({ lyDoTuChoi }),
  })
}

export async function ghiNhanThanhToanTho(
  token: string,
  yeuCauId: number,
  data: {
    soTien: number
    phuongThuc: PhuongThucThanhToanTho
    maThamChieu?: string
    ghiChu?: string
  }
): Promise<ThanhToanTho> {
  return request<ThanhToanTho>(token, `/api/yeu-cau-sua-chua/${yeuCauId}/thanh-toan-tho`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function fetchBaoGiaYeuCau(token: string, yeuCauId: number): Promise<BaoGiaSuaChua[]> {
  return request<BaoGiaSuaChua[]>(token, `/api/yeu-cau-sua-chua/${yeuCauId}/bao-gia`)
}

export async function fetchThanhToanYeuCau(token: string, yeuCauId: number): Promise<ThanhToanTho[]> {
  return request<ThanhToanTho[]>(token, `/api/yeu-cau-sua-chua/${yeuCauId}/thanh-toan-tho`)
}

export async function fetchChungTuThanhToanQuanLy(token: string, yeuCauId: number): Promise<ChungTuThanhToanTho> {
  return request<ChungTuThanhToanTho>(token, `/api/yeu-cau-sua-chua/${yeuCauId}/chung-tu-thanh-toan`)
}
