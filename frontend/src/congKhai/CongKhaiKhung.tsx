import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import type { ThongTinNguoiDung } from '../api'
import { useDialogTrap } from '../design/feedback/useDialogTrap'
import { NhaCungCapDuLieu, thanhPho, useTaiDuLieuCongKhai } from './dungChung'
import './congKhai.css'

type Props = {
  nguoiDung: ThongTinNguoiDung | null
  /** Trang đầu theo vai của người đã đăng nhập (TRANG_DAU), null khi là khách. */
  trangDau: string | null
  duongDan: string
  search: string
  onClick: (e: MouseEvent<HTMLElement>) => void
  children: ReactNode
}

const chuCaiDau = (hoTen: string) => hoTen.trim().split(/\s+/).slice(-2).map((t) => t[0]?.toUpperCase() ?? '').join('')

/** Khung chung của phần công khai: menu trên, menu điện thoại, chân trang; tải dữ liệu API công khai một lần cho mọi màn con. */
export default function CongKhaiKhung({ nguoiDung, trangDau, duongDan, search, onClick, children }: Props) {
  const du = useTaiDuLieuCongKhai()
  const [moMenu, setMoMenu] = useState(false)
  const [trong, setTrong] = useState(false)
  const nutMenu = useRef<HTMLButtonElement>(null)
  const laChu = duongDan === '/'
  const dangNhap = duongDan === '/dang-nhap'

  // Sang trang khác thì đóng menu; có neo (#vi-sao) thì cuộn tới đó, không thì lên đầu trang.
  useEffect(() => {
    setMoMenu(false)
    const neo = window.location.hash.slice(1)
    const el = neo ? document.getElementById(neo) : null
    if (el) el.scrollIntoView(); else window.scrollTo(0, 0)
  }, [duongDan, search, du.dangTai])

  useEffect(() => {
    const mq = window.matchMedia?.('(min-width: 900px)')
    const dong = (e: MediaQueryListEvent) => { if (e.matches) setMoMenu(false) }
    mq?.addEventListener?.('change', dong)
    return () => mq?.removeEventListener?.('change', dong)
  }, [])

  // Thanh menu trong suốt khi còn nằm trên ảnh hero của trang chủ.
  useEffect(() => {
    const doi = () => {
      const h = document.querySelector<HTMLElement>('.cong .hero')
      setTrong(!!h && window.scrollY < h.offsetHeight - 80)
    }
    doi()
    window.addEventListener('scroll', doi, { passive: true })
    return () => window.removeEventListener('scroll', doi)
  }, [duongDan, du.dangTai])

  const thanhPhoDs = [...new Set(du.toa.map((t) => thanhPho(t.diaChi)))]
  const cong = nguoiDung && trangDau
    ? { href: trangDau, nhan: 'Vào trang của tôi', phu: nguoiDung.hoTen }
    : { href: '/dang-nhap', nhan: 'Cổng cư dân', phu: 'Người đang thuê, chủ nhà, quản lý, thợ' }
  const dongMenu = () => { setMoMenu(false); nutMenu.current?.focus() }

  return (
    <div className="cong" data-man={duongDan.startsWith('/phong-trong/') ? 'phong' : laChu ? 'chu' : duongDan.slice(1)} onClick={onClick}>
      <a className="bo-qua" href="#man">Tới nội dung chính</a>

      <header className={`dau${laChu && trong ? ' trong' : ''}`} id="dau">
        <a className="logo-cong" href="/" aria-label="MiniApart, về trang chủ">MiniApart</a>
        <nav className="dau-nav" aria-label="Điều hướng chính">
          <a href="/tim-phong" aria-current={duongDan === '/tim-phong' || duongDan.startsWith('/phong-trong/') ? 'page' : undefined}>Tìm phòng</a>
          <a href="/#vi-sao">Vì sao MiniApart</a>
        </nav>
        <a className="dau-cong" href={cong.href} aria-current={dangNhap ? 'page' : undefined} aria-label={nguoiDung ? `Vào trang của tôi (${nguoiDung.hoTen})` : undefined}>
          {nguoiDung ? <span className="av" aria-hidden="true">{chuCaiDau(nguoiDung.hoTen)}</span> : null}{cong.nhan}
        </a>
        <button className="dau-menu" type="button" ref={nutMenu} aria-expanded={moMenu} aria-controls="thuc-don" onClick={() => setMoMenu(true)}>Menu</button>
      </header>

      {moMenu ? <MenuDienThoai cong={cong} onDong={dongMenu} /> : null}

      <main id="man" tabIndex={-1}>
        <NhaCungCapDuLieu value={du}>{children}</NhaCungCapDuLieu>
      </main>

      <footer className="chan" id="chan">
        <div className="khung chan-luoi">
          <div className="chan-ve">
            <a className="logo-cong" href="/">MiniApart</a>
            <p>Chỗ ở cho thuê do MiniApart trực tiếp quản lý: phòng, giá điện nước và từng khoản phí đều ghi sẵn.</p>
            <div className="chan-dn"><a className="nut nut-trang nut-nho" href={cong.href}>{cong.nhan}</a></div>
          </div>
          <nav aria-label="Tìm phòng theo thành phố">
            <h2>Tìm phòng</h2>
            <ul>
              {thanhPhoDs.map((tp) => <li key={tp}><a href={`/tim-phong?tp=${encodeURIComponent(tp)}`}>{tp}</a></li>)}
              <li><a href="/tim-phong">Tất cả phòng trống</a></li>
            </ul>
          </nav>
          <nav aria-label="Toà nhà">
            <h2>Toà nhà</h2>
            <ul>{du.toa.map((t) => <li key={t.id}><a href={`/tim-phong?toa=${t.id}`}>{t.ten}</a></li>)}</ul>
          </nav>
          <nav aria-label="Về MiniApart">
            <h2>MiniApart</h2>
            <ul><li><a href="/#vi-sao">Vì sao MiniApart</a></li><li><a href={cong.href}>{nguoiDung ? cong.nhan : 'Đăng nhập'}</a></li></ul>
          </nav>
        </div>
        <p className="khung chan-day">© 2026 MiniApart <span>Phòng và giá lấy trực tiếp từ hệ thống.</span></p>
      </footer>
    </div>
  )
}

function MenuDienThoai({ cong, onDong }: { cong: { href: string; nhan: string; phu: string }; onDong: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useDialogTrap({ open: true, dialogRef: ref, onClose: onDong })
  useEffect(() => { ref.current?.querySelector('button')?.focus() }, []) // mở menu thì tiêu điểm vào nút Đóng, không rơi vào logo
  return (
    <div className="thuc-don" id="thuc-don" ref={ref} role="dialog" aria-modal="true" aria-label="Menu" tabIndex={-1} onClick={(e) => { if ((e.target as HTMLElement).closest('a')) onDong() }}>
      <div className="td-dau">
        <a className="logo-cong" href="/">MiniApart</a>
        <button className="dau-menu" type="button" onClick={onDong}>Đóng</button>
      </div>
      <nav className="td-nav" aria-label="Điều hướng chính trên điện thoại">
        <a href="/tim-phong">Tìm phòng</a>
        <a href="/#vi-sao">Vì sao MiniApart</a>
      </nav>
      <div className="td-chan">
        <a className="td-cong" href={cong.href}>{cong.nhan} <span>{cong.phu}</span></a>
        <a className="nut nut-muc" href="/tim-phong">Tìm phòng</a>
      </div>
    </div>
  )
}
