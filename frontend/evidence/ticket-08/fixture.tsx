import { createRoot } from 'react-dom/client'
import App from '../../src/App'
import '../../src/tokens/index.css'
import fixtureConfig from './fixture-config.json'

const buildings = [
  { id: 1, maToa: 'TN-A', ten: 'MiniApart Hai Bà Trưng', diaChi: '18 phố Minh Khai, Hà Nội', soTang: 5, ngayChotSo: 28, soNgayHanTt: 7, tkNganHang: 'Vietcombank 0123456789', nguongThatThoat: '10.00', batBuocAnhCongTo: true },
  { id: 2, maToa: 'TN-B', ten: 'MiniApart Cầu Giấy', diaChi: '25 phố Trần Quốc Vượng, Hà Nội', soTang: 6, ngayChotSo: 27, soNgayHanTt: 5, tkNganHang: 'Vietcombank 0123456789', nguongThatThoat: '8.50', batBuocAnhCongTo: false },
]

const rooms = [
  { id: 11, toaNhaId: 1, soPhong: '101', tang: 1, dienTich: '24.00', sucChua: 3, giaThueMacDinh: '4200000.00', loaiPhong: 'Studio', trangThai: 'DANG_THUE', tenTrangThai: 'Đang thuê' },
  { id: 12, toaNhaId: 1, soPhong: '102', tang: 1, dienTich: '22.00', sucChua: 2, giaThueMacDinh: '3900000.00', loaiPhong: 'Studio', trangThai: 'TRONG', tenTrangThai: 'Trống' },
  { id: 21, toaNhaId: 1, soPhong: '201', tang: 2, dienTich: '28.00', sucChua: 4, giaThueMacDinh: '4800000.00', loaiPhong: 'Một phòng ngủ', trangThai: 'DA_COC', tenTrangThai: 'Đã đặt cọc' },
  { id: 22, toaNhaId: 1, soPhong: '202', tang: 2, dienTich: '28.00', sucChua: 4, giaThueMacDinh: '4800000.00', loaiPhong: 'Một phòng ngủ', trangThai: 'DANG_SUA', tenTrangThai: 'Đang sửa' },
  { id: 31, toaNhaId: 1, soPhong: '301', tang: 3, dienTich: '24.00', sucChua: 3, giaThueMacDinh: '4300000.00', loaiPhong: 'Studio', trangThai: 'DANG_THUE', tenTrangThai: 'Đang thuê' },
  { id: 32, toaNhaId: 1, soPhong: '302', tang: 3, dienTich: '24.00', sucChua: 3, giaThueMacDinh: '4300000.00', loaiPhong: 'Studio', trangThai: 'NGUNG', tenTrangThai: 'Ngừng khai thác' },
]

const periods = [
  { id: 8, nam: 2026, thang: 8, ngayBatDau: '2026-08-01', ngayKetThuc: '2026-08-31', trangThai: 'DANG_MO' },
]

const meterData = {
  tongPhong: 24,
  daGhi: 12,
  phong: rooms.slice(0, 3).map((room, roomIndex) => ({
    id: room.id,
    soPhong: room.soPhong,
    tang: room.tang,
    dichVu: [
      { id: 21, tenDichVu: 'Điện', donVi: 'kWh', chiSoDau: String(1240 + roomIndex * 100), chiSoCuoi: roomIndex === 0 ? '1350.00' : null, mucTieuThu: roomIndex === 0 ? '110.00' : null, coThayCongTo: false, chiSoCuoiCongToCu: null, chiSoDauCongToMoi: null, anhCongToId: roomIndex === 0 ? 77 : null, daXacNhanCanhBao: false, thongTinCanhBaoTieuThu: null },
      { id: 22, tenDichVu: 'Nước', donVi: 'm³', chiSoDau: String(45 + roomIndex * 10), chiSoCuoi: roomIndex === 0 ? '51.25' : null, mucTieuThu: roomIndex === 0 ? '6.25' : null, coThayCongTo: false, chiSoCuoiCongToCu: null, chiSoDauCongToMoi: null, anhCongToId: null, daXacNhanCanhBao: false, thongTinCanhBaoTieuThu: null },
    ],
  })),
}

const invoice = {
  hoaDonId: 10, maHoaDon: 'TN-A-101-202608', kyId: 8, hopDongId: 11, soPhong: '101', nguoiThue: 'Lê Người Thuê', ngayPhatHanh: '2026-08-31', hanThanhToan: '2026-09-07', trangThai: 'DA_PHAT_HANH', tongTien: '3889500.00', daThu: '1500000.00', conLai: '2389500.00', soNguoiO: 5, soHoQuyDoi: 2, giaiThichSoHo: 'Một hộ quy đổi cho mỗi bốn người ở.',
  cacDong: [
    { tenKhoan: 'Tiền phòng', soLuong: '1.00', donGia: '3400000.00', thanhTien: '3400000.00', loaiKhoan: 'TIEN_PHONG', dienGiai: 'Tiền thuê phòng tháng 08/2026', cacBac: [] },
    { tenKhoan: 'Tiền điện', chiSoDau: '1240.00', chiSoCuoi: '1350.00', soLuong: '110.00', thanhTien: '390000.00', loaiKhoan: 'DICH_VU', dienGiai: '(1350.00 - 1240.00) = 110.00; xem chi tiết từng bậc', anhCongToId: 77, cacBac: [
      { bac: 1, tuSoLuong: '0.00', denSoLuong: '50.00', dinhMucQuyDoi: '100.00', soLuong: '100.00', donGia: '3500.00', thanhTien: '350000.00', dienGiai: 'Bậc 1' },
      { bac: 2, tuSoLuong: '51.00', denSoLuong: '100.00', dinhMucQuyDoi: '100.00', soLuong: '10.00', donGia: '4000.00', thanhTien: '40000.00', dienGiai: 'Bậc 2' },
    ] },
    { tenKhoan: 'Tiền nước', chiSoDau: '45.00', chiSoCuoi: '51.25', soLuong: '6.25', donGia: '16000.00', thanhTien: '100000.00', loaiKhoan: 'DICH_VU', dienGiai: '(51.25 - 45.00) × 16.000', cacBac: [] },
    { tenKhoan: 'Làm tròn', thanhTien: '-500.00', loaiKhoan: 'LAM_TRON', dienGiai: 'Làm tròn xuống 500 đồng', cacBac: [] },
  ],
}

const accounts = [
  { id: 4, hoTen: 'Phạm Quản Trị', soDienThoai: '0900000004', vaiTro: 'QTHT', tenVaiTro: 'Quản trị hệ thống', trangThai: 'HOAT_DONG', tenTrangThai: 'Hoạt động', toaNhaIds: [1, 2] },
  { id: 2, hoTen: 'Trần Quản Lý', soDienThoai: '0900000002', vaiTro: 'QUAN_LY', tenVaiTro: 'Quản lý toà nhà', trangThai: 'HOAT_DONG', tenTrangThai: 'Hoạt động', toaNhaIds: [1] },
  { id: 5, hoTen: 'Vũ Kỹ Thuật', soDienThoai: '0900000005', vaiTro: 'THO', tenVaiTro: 'Thợ sửa chữa', trangThai: 'BI_KHOA', tenTrangThai: 'Bị khoá', toaNhaIds: [1] },
]

const roles = [
  { vaiTro: 'QTHT', tenVaiTro: 'Quản trị hệ thống' },
  { vaiTro: 'CHU', tenVaiTro: 'Chủ sở hữu' },
  { vaiTro: 'QUAN_LY', tenVaiTro: 'Quản lý toà nhà' },
  { vaiTro: 'THO', tenVaiTro: 'Thợ sửa chữa' },
  { vaiTro: 'NGUOI_THUE', tenVaiTro: 'Người thuê' },
]

const params = new URLSearchParams(window.location.search)
const screenId = params.get('screen')
const variant = params.get('variant')
const screen = fixtureConfig.screens.find((candidate) => candidate.id === screenId)
const unexpectedRequests: string[] = []

function markInvalid(reason: unknown) {
  document.documentElement.dataset.ticket08Invalid = reason instanceof Error ? reason.message : String(reason)
}

window.addEventListener('error', (event) => markInvalid(event.error ?? event.message))
window.addEventListener('unhandledrejection', (event) => markInvalid(event.reason))

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

async function deterministicFetch(input: RequestInfo | URL, init?: RequestInit) {
  const url = String(input)
  const method = init?.method ?? 'GET'
  if (url === '/api/health' && method === 'GET') return json({ status: 'UP', database: 'UP' })
  if (url === '/api/auth/me' && method === 'GET') return json(screen?.user ?? {})
  if (url === '/api/toa-nha' && method === 'GET') return json(buildings)
  if (url === '/api/toa-nha/1/phong' && method === 'GET') return json(rooms)
  if (url === '/api/toa-nha/1/ky-thanh-toan' && method === 'GET') return json(periods)
  if (url === '/api/toa-nha/1/ky-thanh-toan/8/chi-so' && method === 'GET') return json(meterData)
  if (url === '/api/toa-nha/1/ky-thanh-toan/8/thieu-chi-so' && method === 'GET') return json([{ id: 12, soPhong: '102', tang: 1 }])
  if (url === '/api/toa-nha/1/ky-thanh-toan/8/hoa-don/10' && method === 'GET') return json(invoice)
  if (url === '/api/nguoi-dung' && method === 'GET') return json(accounts)
  if (url === '/api/nguoi-dung/vai-tro' && method === 'GET') return json(roles)
  unexpectedRequests.push(`${method} ${url}`)
  return json({ thongBao: `Unexpected fixture request: ${method} ${url}` }, 500)
}

async function installTicketStyles(selectedVariant: string) {
  await new Promise<void>((resolvePromise, rejectPromise) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.dataset.ticket08Styles = selectedVariant
    link.href = `/__ticket08_styles.css?variant=${encodeURIComponent(selectedVariant)}`
    link.addEventListener('load', () => resolvePromise())
    link.addEventListener('error', () => rejectPromise(new Error(`could not load ${selectedVariant} ticket stylesheet`)))
    document.head.append(link)
  })
}

async function waitForSettledScreen() {
  if (!screen) throw new Error(`unknown screen: ${screenId}`)
  const deadline = performance.now() + 8000
  while (performance.now() < deadline) {
    const text = document.body.textContent ?? ''
    const surface = document.querySelector(`[data-testid="${screen.testId}"]`)
    const stillLoading = /Đang (tải|khôi phục|kiểm tra)/.test(text)
    const routeMatches = window.location.pathname === screen.route
    if (surface && text.includes(screen.readyText) && !stillLoading && routeMatches && unexpectedRequests.length === 0) {
      await document.fonts.ready
      await new Promise<void>((resolvePromise) => requestAnimationFrame(() => requestAnimationFrame(() => resolvePromise())))
      document.documentElement.dataset.ticket08Renderer = 'App'
      document.documentElement.dataset.ticket08Screen = screen.id
      document.documentElement.dataset.ticket08Route = screen.route
      document.documentElement.dataset.ticket08ApiRequests = 'deterministic-mock'
      document.documentElement.dataset.ticket08UnexpectedRequestCount = String(unexpectedRequests.length)
      document.documentElement.dataset.ticket08Ready = 'true'
      return
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 25))
  }
  throw new Error(`screen ${screen.id} did not settle; unexpected requests: ${unexpectedRequests.join(', ') || 'none'}`)
}

async function runFixture() {
  if (!screen || !['before', 'after'].includes(variant ?? '')) throw new Error('screen and variant query parameters are required')
  window.localStorage.setItem('miniapart.auth.token', 'ticket-08-deterministic-token')
  window.history.replaceState({}, '', screen.url)
  window.fetch = deterministicFetch
  await installTicketStyles(variant!)
  const root = document.getElementById('root')
  if (!root) throw new Error('fixture root is missing')
  createRoot(root).render(<App />)
  await waitForSettledScreen()
}

runFixture().catch(markInvalid)
