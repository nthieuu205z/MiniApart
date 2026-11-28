import { createContext, createElement, useContext, useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'
import { hasAllAmenities } from '../roomAmenities'
import { fetchPublicPhong, fetchPublicToaNha, type PublicDichVu, type PublicPhong, type PublicToaNha } from '../api'

export const so = (n: number) => new Intl.NumberFormat('vi-VN').format(n)
export const thanhPho = (diaChi?: string) => (diaChi ?? '').split(',').pop()!.trim()
export const laTrong = (p: PublicPhong) => p.trangThai === 'TRONG'
export const noi = (a: string[]) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} và ${a.at(-1)}`)
const CHU_SO = ['Không', 'Một', 'Hai', 'Ba', 'Bốn', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười']
export const chu = (n: number) => CHU_SO[n] ?? String(n)
export const moTaNgan = (p: PublicPhong) => `${p.loaiPhong} · ${so(p.dienTich)} m² · tầng ${p.tang}`
export const NHAN_TT: Record<string, string> = { DANG_THUE: 'Đang có người thuê', DA_COC: 'Đã có người đặt cọc', DANG_SUA: 'Đang sửa chữa', DANG_SUA_CHUA: 'Đang sửa chữa' }
export const nhanTrangThai = (p: PublicPhong) => NHAN_TT[p.trangThai] ?? p.trangThai

export function Tien({ n }: { n: number }) {
  return <>{so(n)}&nbsp;<span className="d">₫</span></>
}

export function DonGia({ dv }: { dv: PublicDichVu }) {
  if (dv.cheDoGia === 'BAC_THANG') return <>theo bậc thang</>
  if (dv.donGia == null) return <>chưa có giá</>
  if (dv.donGia === 0) return <>Miễn phí</>
  return <><Tien n={dv.donGia} />/{dv.donViTinh}</>
}

export const MuiTen = () => <svg className="mt" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" /></svg>

// Ảnh minh hoạ khi API chưa có ảnh đại diện: chọn theo toà và loại phòng (giữ nguyên bảng cũ của KhamPhaPhong).
export function layHinhAnhPhong(tenToaNha = '', loaiPhong = ''): string {
  const toa = tenToaNha.toLowerCase(), loai = loaiPhong.toLowerCase()
  const co = (...k: string[]) => k.some((x) => loai.includes(x))
  if (toa.includes('an nhiên')) return co('ban công') ? '/rooms/annhien_studio_ban_cong.webp' : co('gác') ? '/rooms/annhien_gac_xep.webp' : co('nội thất') ? '/rooms/annhien_studio_noi_that.webp' : '/rooms/annhien_co_ban.webp'
  if (toa.includes('nhà xanh')) return co('gác') ? '/rooms/nhaxanh_phong_gac.webp' : co('studio', 'nội thất') ? '/rooms/nhaxanh_studio_gon.webp' : '/rooms/nhaxanh_co_ban.webp'
  if (toa.includes('mộc lan')) return co('ban công') ? '/rooms/moclan_ban_cong.webp' : co('gác') ? '/rooms/moclan_gac_xep.webp' : co('studio', 'nội thất') ? '/rooms/moclan_studio_go.webp' : '/rooms/moclan_co_ban.webp'
  if (toa.includes('phố nhỏ')) return co('bếp', 'studio') ? '/rooms/phonho_studio_bep.webp' : co('nội thất') ? '/rooms/phonho_studio_gon.webp' : '/rooms/phonho_co_ban.webp'
  if (toa.includes('bình minh')) return co('ban công') ? '/rooms/binhminh_ban_cong.webp' : co('cửa sổ', 'thoáng') ? '/rooms/binhminh_cua_so_lon.webp' : co('studio', 'nội thất') ? '/rooms/binhminh_studio_thoang.webp' : '/rooms/binhminh_co_ban.webp'
  if (toa.includes('vườn nắng')) return co('ban công') ? '/rooms/vuonnang_ban_cong.webp' : co('cây xanh', 'thoáng') ? '/rooms/vuonnang_cay_xanh.webp' : '/rooms/vuonnang_studio_nang.webp'
  return '/rooms/annhien_studio_ban_cong.webp'
}
export const anhPhong = (p: PublicPhong) => p.anhDaiDien?.trim() || layHinhAnhPhong(p.tenToaNha, p.loaiPhong)
const DU_PHONG = '/rooms/annhien_studio_ban_cong.webp'
// Ảnh API lỗi tải thì rơi về ảnh minh hoạ của toà, không để ô trống.
export function Anh({ p, alt, className }: { p: PublicPhong; alt: string; className?: string }) {
  return <img className={className} src={anhPhong(p)} alt={alt} width={960} height={720} loading="lazy"
    onError={(e) => { const du = layHinhAnhPhong(p.tenToaNha, p.loaiPhong) || DU_PHONG; if (!e.currentTarget.src.endsWith(du)) e.currentTarget.src = du }} />
}

/* ---------- tính tiền một tháng từ bảng giá thật ---------- */
// "Khi dùng mới tính" chỉ lấy gửi xe máy; khoản chưa có đơn giá (điện bậc thang) trả về ở chuaTinh.
export function tinhThang(p: Pick<PublicPhong, 'giaThueMacDinh' | 'danhSachDichVu'>, { nguoi, xe, kwh, m3 }: { nguoi: number; xe: number; kwh: number; m3: number }) {
  const dong = [{ ten: 'Tiền phòng', ct: '', tien: p.giaThueMacDinh }]
  const chuaTinh: string[] = []
  for (const dv of p.danhSachDichVu) {
    let sl: number | null = null
    if (dv.loaiThu === 'THEO_CHI_SO') sl = dv.donViTinh === 'kWh' ? kwh : m3
    else if (dv.loaiThu === 'THEO_NGUOI') sl = nguoi
    else if (dv.loaiThu === 'CO_DINH') sl = 1
    else if (/xe máy/i.test(dv.tenDichVu)) sl = xe
    if (sl == null || (sl === 0 && dv.loaiThu !== 'CO_DINH')) continue
    if (dv.donGia == null) { chuaTinh.push(dv.tenDichVu); continue }
    dong.push({ ten: dv.tenDichVu, ct: dv.loaiThu === 'CO_DINH' ? '' : `${so(sl)} ${dv.donViTinh} × ${so(dv.donGia)} ₫`, tien: sl * dv.donGia })
  }
  return { dong, chuaTinh, tong: dong.reduce((s, d) => s + d.tien, 0) }
}

/* ---------- lọc phòng (đúng cách lọc của KhamPhaPhong cũ; mặc định chỉ phòng trống) ---------- */
export type BoLoc = { tatca?: boolean; toa?: string; tp?: string; gia?: string; loai?: string; q?: string; ti?: string[] }
const GIA: Record<string, [number, number]> = { DUOI_3_5: [0, 3500000], '3_5_DEN_5': [3500000, 5000000], TREN_5: [5000000, Infinity] }
export function locPhong(ds: PublicPhong[], b: BoLoc) {
  const q = (b.q ?? '').trim().toLowerCase()
  const [tu, den] = GIA[b.gia ?? ''] ?? [0, Infinity]
  return ds.filter((p) =>
    (b.tatca || laTrong(p))
    && (!b.toa || p.toaNhaId === +b.toa)
    && (!b.tp || thanhPho(p.diaChiToaNha) === b.tp)
    && (!b.loai || p.loaiPhong === b.loai)
    && p.giaThueMacDinh >= tu && p.giaThueMacDinh <= den
    && hasAllAmenities(p.tienIch, b.ti ?? []) // cùng một tiện ích viết khác nhau (hòa/hoà, nóng lạnh) vẫn khớp
    && (!q || [p.soPhong, p.tenToaNha, p.diaChiToaNha, p.moTa].some((s) => (s ?? '').toLowerCase().includes(q))),
  ).sort((a, c) => Number(laTrong(c)) - Number(laTrong(a)) || a.giaThueMacDinh - c.giaThueMacDinh)
}

/* ---------- dữ liệu công khai: một lần tải cho cả khung ---------- */
export type DuLieuCongKhai = { toa: PublicToaNha[]; phong: PublicPhong[]; dangTai: boolean; loi: string | null; taiLai: () => void }
const NguCanh = createContext<DuLieuCongKhai>({ toa: [], phong: [], dangTai: true, loi: null, taiLai: () => {} })
export const useDuLieuCongKhai = () => useContext(NguCanh)
export const NhaCungCapDuLieu = NguCanh.Provider

export function useTaiDuLieuCongKhai(): DuLieuCongKhai {
  const [d, setD] = useState<{ toa: PublicToaNha[]; phong: PublicPhong[] }>({ toa: [], phong: [] })
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)
  const [lan, setLan] = useState(0)
  useEffect(() => {
    let song = true
    setDangTai(true); setLoi(null)
    Promise.all([fetchPublicToaNha(), fetchPublicPhong()])
      .then(([toa, phong]) => { if (song) setD({ phong, toa: toa.filter((t) => phong.some((p) => p.toaNhaId === t.id)) }) }) // toà chưa có phòng công khai thì không hiện
      .catch((e: unknown) => { if (song) setLoi(e instanceof Error ? e.message : 'Không thể tải danh sách phòng công khai.') })
      .finally(() => { if (song) setDangTai(false) })
    return () => { song = false }
  }, [lan])
  return { ...d, dangTai, loi, taiLai: () => setLan((n) => n + 1) }
}

/* ---------- hiện dần khi cuộn tới (CSS tắt hẳn khi người dùng giảm chuyển động) ---------- */
export function Hien({ as = 'div', i, className = '', children }: { as?: ElementType; i?: number; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  const [hien, setHien] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) { setHien(true); return }
    const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { setHien(true); io.disconnect() } }, { rootMargin: '0px 0px -8% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return createElement(as, { ref, className: `${className}${hien ? ' hien' : ''}`.trim(), 'data-hien': '', style: i ? { '--i': i } : undefined }, children)
}
