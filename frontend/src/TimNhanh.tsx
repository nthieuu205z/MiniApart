import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchHoaDonQuanLy, fetchHopDongQuanLy, fetchPhong } from './api'
import type { TrangProps } from './dinhTuyen'
import { Icon, type IconName } from './design/core/Icon'
import { EmptyState } from './design/feedback/EmptyState'
import { useDialogTrap } from './design/feedback/useDialogTrap'
import { managementRequest } from './managementApi'
import { catDanhDau, taoChiMuc, timNhanh, type MucTim, type NhomKetQua } from './chiMucTimNhanh'
import { useToaDangChon } from './toaDangChon'

const ICON: Record<NhomKetQua, IconName> = { 'Người thuê': 'user', 'Phòng': 'door', 'Hợp đồng': 'contract', 'Hoá đơn': 'receipt' }
const LENH = [
  { tieuDe: 'Ghi nhận thu tiền', href: '/thu-tien', icon: 'wallet' as IconName },
  { tieuDe: 'Tạo hợp đồng', href: '/hop-dong/moi', icon: 'plus' as IconName },
  { tieuDe: 'Báo sự cố', href: '/su-co?baoMoi=1', icon: 'wrench' as IconName },
]

type Dong = { khoa: string; nhom: string; icon: IconName; tieuDe: string; phu?: string; href: string }
type BoNho = Map<string, MucTim[]>

function Danh({ s, q }: { s: string; q: string }) {
  const [a, b, c] = catDanhDau(s, q)
  return b ? <>{a}<mark>{b}</mark>{c}</> : <>{a}</>
}

/** Hộp Tìm nhanh (Chủ/Quản lý): Ctrl/⌘+K hoặc "/" mở; dữ liệu tải lần đầu mở rồi giữ trong phiên. */
export default function TimNhanh({ token, vaiTro, dieuHuong, mo, datMo }: TrangProps & { mo: boolean; datMo: (mo: boolean) => void }) {
  const duocDung = vaiTro === 'CHU' || vaiTro === 'QUAN_LY'
  const boNho = useRef<BoNho>(new Map())
  useEffect(() => {
    if (!duocDung) return
    function nhanPhim(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); datMo(true); return }
      const el = e.target as HTMLElement | null
      const dangGo = !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !dangGo) { e.preventDefault(); datMo(true) }
    }
    window.addEventListener('keydown', nhanPhim)
    return () => window.removeEventListener('keydown', nhanPhim)
  }, [duocDung, datMo])
  if (!duocDung || !mo) return null
  return <Hop token={token} dieuHuong={dieuHuong} dong={() => datMo(false)} boNho={boNho.current} />
}

function Hop({ token, dieuHuong, dong, boNho }: { token: string; dieuHuong: (href: string) => void; dong: () => void; boNho: BoNho }) {
  const toa = useToaDangChon()
  const dsToa = useMemo(() => toa.danhSach.filter((t) => toa.toaNhaId === null || t.id === toa.toaNhaId).map((t) => ({ id: t.id, ten: t.ten })), [toa.toaNhaId, toa.danhSach])
  const khoa = dsToa.map((t) => t.id).join(',')
  const [chiMuc, setChiMuc] = useState<MucTim[] | null>(boNho.get(khoa) ?? null)
  const [loi, setLoi] = useState(false)
  const [q, setQ] = useState('')
  const [chon, setChon] = useState(0)
  const hopRef = useRef<HTMLDivElement>(null)
  const chonRef = useRef<HTMLDivElement>(null)
  useDialogTrap({ dialogRef: hopRef, onClose: dong })

  const tai = useCallback(async () => {
    setLoi(false)
    try {
      const [nguoiThue, theoToa] = await Promise.all([
        managementRequest<Array<{ id: number; hoTen: string; soDienThoai?: string | null }>>(token, '/api/nguoi-thue'),
        Promise.all(dsToa.map(async (t) => {
          const [phong, hopDong, hoaDon] = await Promise.all([fetchPhong(token, t.id), fetchHopDongQuanLy(token, t.id), fetchHoaDonQuanLy(token, t.id, '')])
          return { id: t.id, ten: t.ten, phong: phong.flatMap((p) => (p.id === null ? [] : [{ id: p.id, soPhong: p.soPhong, tenTrangThai: p.tenTrangThai }])), hopDong, hoaDon }
        })),
      ])
      const moi = taoChiMuc({ nguoiThue, toa: theoToa })
      boNho.set(khoa, moi)
      setChiMuc(moi)
    } catch { setLoi(true) }
  }, [token, dsToa, khoa, boNho])

  useEffect(() => {
    if (toa.dangTai) return
    const co = boNho.get(khoa)
    if (co) setChiMuc(co)
    else { setChiMuc(null); void tai() }
  }, [khoa, toa.dangTai, tai, boNho])

  const nhom = useMemo(() => (chiMuc ? timNhanh(chiMuc, q) : []), [chiMuc, q])
  const dsDong: Dong[] = useMemo(() => [
    ...nhom.flatMap((g) => g.muc.map((m, i) => ({ khoa: `${g.nhom}-${i}`, nhom: g.nhom, icon: ICON[g.nhom], tieuDe: m.tieuDe, phu: m.phu, href: m.href }))),
    ...LENH.map((l) => ({ khoa: `lenh-${l.href}`, nhom: 'Lệnh', icon: l.icon, tieuDe: l.tieuDe, href: l.href })),
  ], [nhom])
  const dangTai = !chiMuc && !loi
  const coChu = q.trim() !== ''

  useEffect(() => { setChon(0) }, [q, chiMuc])
  useEffect(() => { chonRef.current?.scrollIntoView?.({ block: 'nearest' }) }, [chon])

  function moMuc(d: Dong | undefined) {
    if (!d) return
    dong()
    dieuHuong(d.href)
  }
  function phim(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setChon((i) => Math.min(i + 1, dsDong.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setChon((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); moMuc(dsDong[chon]) }
  }

  let nhomTruoc = ''
  return (
    <div className="cmdk-wrap" onMouseDown={(e) => { if (e.target === e.currentTarget) dong() }}>
      <div className="cmdk" role="dialog" aria-modal="true" aria-label="Tìm nhanh" ref={hopRef} tabIndex={-1}>
        <div className="cmdk-in">
          <Icon name="search" />
          <input
            role="combobox" aria-expanded="true" aria-controls="tim-nhanh-ds" aria-autocomplete="list" autoComplete="off"
            aria-activedescendant={dsDong[chon] ? `tn-${dsDong[chon].khoa}` : undefined}
            aria-label="Tìm người thuê, phòng, hợp đồng, hoá đơn" placeholder="Tìm người thuê, phòng, hợp đồng, hoá đơn…"
            value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={phim}
          />
          <span className="search-kbd" aria-hidden="true">Esc</span>
        </div>
        {dangTai ? <div role="status" aria-label="Đang tải dữ liệu tìm nhanh" style={{ display: 'grid', gap: 10, padding: 16 }}><div className="skel skel-line" /><div className="skel skel-line" style={{ width: '80%' }} /><div className="skel skel-line" style={{ width: '60%' }} /></div> : null}
        {loi ? <EmptyState kind="error" title="Không tải được dữ liệu để tìm." body="Dữ liệu chưa bị thay đổi." actionLabel="Thử lại" onAction={() => void tai()} /> : null}
        {!dangTai && !loi && !coChu ? <p className="cmdk-g">Gõ tên, số phòng, mã hợp đồng hoặc mã hoá đơn</p> : null}
        {!dangTai && !loi && coChu && nhom.length === 0 ? <p className="cmdk-g" role="status">Không thấy “{q.trim()}” trong dữ liệu đã tải.</p> : null}
        <div className="cmdk-list" id="tim-nhanh-ds" role="listbox" aria-label="Kết quả tìm nhanh">
          {dsDong.map((d, i) => {
            const dauNhom = d.nhom !== nhomTruoc
            nhomTruoc = d.nhom
            const tong = nhom.find((g) => g.nhom === d.nhom)?.tong
            return (
              <div key={d.khoa} role="presentation">
                {dauNhom ? <div className="cmdk-g" role="presentation">{d.nhom}{tong ? ` · ${tong}` : ''}</div> : null}
                <div
                  id={`tn-${d.khoa}`} role="option" aria-selected={i === chon} ref={i === chon ? chonRef : undefined}
                  className={`cmdk-i${i === chon ? ' on' : ''}`} onMouseMove={() => setChon(i)} onClick={() => moMuc(d)} style={{ cursor: 'pointer' }}
                >
                  <span className="ic" aria-hidden="true"><Icon name={d.icon} /></span>
                  <span className="grow">
                    <span className="t" style={{ display: 'block' }}><Danh s={d.tieuDe} q={d.nhom === 'Lệnh' ? '' : q} /></span>
                    {d.phu ? <span className="s"><Danh s={d.phu} q={q} /></span> : null}
                  </span>
                  {i === chon ? <span className="search-kbd" aria-hidden="true">Enter</span> : null}
                </div>
              </div>
            )
          })}
        </div>
        <div className="cmdk-f"><span>↑ ↓ chọn</span><span>Enter mở</span><span>Esc đóng</span><span className="push">Tìm trên dữ liệu đã tải · {dsToa.length} toà</span></div>
      </div>
    </div>
  )
}
