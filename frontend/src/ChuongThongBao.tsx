import { useCallback, useEffect, useRef, useState } from 'react'
import { danhDauThongBaoDaDoc, fetchThongBao, type ThongTinHopThongBao } from './api'
import './ChuongThongBao.css'
import { Button } from './design/core/Button'
import { Icon } from './design/core/Icon'
import type { TrangProps } from './dinhTuyen'
import { SU_KIEN_CHUA_DOC } from './ThongBao'

function truocDay(iso: string): string {
  const phut = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (phut < 1) return 'Vừa xong'
  if (phut < 60) return `${phut} phút trước`
  if (phut < 1440) return `${Math.floor(phut / 60)} giờ trước`
  return new Date(iso).toLocaleDateString('vi-VN')
}

/** Chuông trên thanh trên: số chưa đọc + hộp 5 tin mới nhất. Số đếm lấy từ `fetchThongBao` như màn /thong-bao. */
export default function ChuongThongBao({ token, dieuHuong }: TrangProps) {
  const [hop, setHop] = useState<ThongTinHopThongBao | null>(null)
  const [mo, setMo] = useState(false)
  const [loi, setLoi] = useState(false)
  const [dangDanhDau, setDangDanhDau] = useState(false)
  const goc = useRef<HTMLDivElement>(null)
  const nutRef = useRef<HTMLButtonElement>(null)

  const tai = useCallback(async () => {
    try { setHop(await fetchThongBao(token)); setLoi(false) } catch { setLoi(true) }
  }, [token])

  useEffect(() => { void tai() }, [tai])
  // Màn /thong-bao đổi số chưa đọc thì chuông theo ngay, không gọi lại API.
  useEffect(() => {
    const nghe = (e: Event) => setHop((h) => (h ? { ...h, soChuaDoc: (e as CustomEvent<number>).detail } : h))
    window.addEventListener(SU_KIEN_CHUA_DOC, nghe)
    return () => window.removeEventListener(SU_KIEN_CHUA_DOC, nghe)
  }, [])

  const dong = useCallback((traFocus: boolean) => {
    setMo(false)
    void tai()
    if (traFocus) nutRef.current?.focus()
  }, [tai])

  useEffect(() => {
    if (!mo) return
    const phim = (e: KeyboardEvent) => { if (e.key === 'Escape') dong(true) }
    const ngoai = (e: MouseEvent) => { if (goc.current && !goc.current.contains(e.target as Node)) dong(false) }
    document.addEventListener('keydown', phim)
    document.addEventListener('mousedown', ngoai)
    return () => { document.removeEventListener('keydown', phim); document.removeEventListener('mousedown', ngoai) }
  }, [mo, dong])

  const soChuaDoc = hop?.soChuaDoc ?? 0
  const tin = (hop?.thongBao ?? []).slice(0, 5)

  async function danhDauTatCa() {
    setDangDanhDau(true)
    try {
      await Promise.all((hop?.thongBao ?? []).filter((t) => !t.daDoc).map((t) => danhDauThongBaoDaDoc(token, t.maThamChieu)))
      setLoi(false)
    } catch { setLoi(true) }
    await tai()
    setDangDanhDau(false)
  }

  return (
    <div className="chuong" ref={goc}>
      <button
        type="button" ref={nutRef} className="icon-btn" data-testid="chuong-nut"
        aria-label={soChuaDoc ? `Thông báo, ${soChuaDoc} chưa đọc` : 'Thông báo'} aria-haspopup="dialog" aria-expanded={mo}
        onClick={() => (mo ? dong(true) : setMo(true))}
      >
        <Icon name="bell" />
        {soChuaDoc ? <span className="chuong-n" data-testid="chuong-so" aria-hidden="true">{soChuaDoc > 99 ? '99+' : soChuaDoc}</span> : null}
      </button>
      {mo ? (
        <div className="pop" role="dialog" aria-label="Thông báo">
          <div className="pop-h">
            <h2 className="h3">Thông báo</h2>
            <span className="t-meta">{soChuaDoc} chưa đọc</span>
            <Button variant="text" size="sm" className="push" blocked={dangDanhDau || soChuaDoc === 0} blockedReason={soChuaDoc === 0 ? 'Không có thông báo chưa đọc.' : 'Đang cập nhật…'} onClick={() => void danhDauTatCa()}>Đánh dấu đã đọc</Button>
          </div>
          {loi ? <p className="note" role="alert">Không tải được thông báo. Dữ liệu chưa bị thay đổi.</p> : null}
          {tin.map((t) => (
            <a key={t.maThamChieu} className="irow" href="/thong-bao" onClick={(e) => { e.preventDefault(); setMo(false); dieuHuong('/thong-bao') }}>
              {t.daDoc ? <span style={{ width: 8 }} /> : <span className="unread" aria-label="Chưa đọc" />}
              <div className="body"><div className="t">{t.tieuDe}</div><div className="s">{t.noiDung}</div></div>
              <span className="t-meta">{truocDay(t.taoLuc)}</span>
            </a>
          ))}
          {!loi && tin.length === 0 ? <p className="note">Không có thông báo mới.</p> : null}
          <a className="note" style={{ color: 'var(--ma-text-link)' }} href="/thong-bao" onClick={(e) => { e.preventDefault(); setMo(false); dieuHuong('/thong-bao') }}>Xem tất cả</a>
        </div>
      ) : null}
    </div>
  )
}
