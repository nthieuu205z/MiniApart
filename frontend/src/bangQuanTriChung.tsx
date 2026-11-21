import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon } from './design/core/Icon'

/** Phần dùng chung của các màn bảng quản trị (lô B): avatar chữ cái, số điện thoại, menu "⋯". */

export function chuCaiDau(ten: string): string {
  const tu = ten.trim().split(/\s+/).filter(Boolean)
  return tu.slice(-2).map((t) => Array.from(t)[0]).join('').toUpperCase()
}

/** 0999000011 → "0999 000 011" (nhóm 4-3-3); chuỗi lạ giữ nguyên. */
export function nhomSoDienThoai(sdt: string): string {
  const so = sdt.replace(/\D/g, '')
  return so.length === 10 ? `${so.slice(0, 4)} ${so.slice(4, 7)} ${so.slice(7)}` : sdt
}

export function NguoiCoAvatar({ ten, phu, id }: { ten: string; phu?: ReactNode; id: number }) {
  return (
    <div className="td-person">
      <span className={`avatar sm h${(id % 5) + 1}`} aria-hidden="true">{chuCaiDau(ten)}</span>
      <div style={{ minWidth: 0 }}>
        <div className="td-main bq-cat" title={ten}>{ten}</div>
        {phu ? <div className="td-sub">{phu}</div> : null}
      </div>
    </div>
  )
}

/** Menu "⋯" của hàng bảng. Cố định theo toạ độ nút (position: fixed) vì .table-wrap cuộn ngang sẽ cắt menu tuyệt đối. */
export function MenuThaoTac({ nhan, children }: { nhan: string; children: (dong: () => void) => ReactNode }) {
  const [vitri, setViTri] = useState<{ top: number; right: number } | null>(null)
  const nutRef = useRef<HTMLButtonElement>(null)
  const dong = () => setViTri(null)

  useEffect(() => {
    if (!vitri) return
    const khiBam = (e: MouseEvent) => { if (!(e.target instanceof Element) || !e.target.closest('[data-bq-menu]')) dong() }
    const khiPhim = (e: KeyboardEvent) => { if (e.key === 'Escape') { dong(); nutRef.current?.focus() } }
    document.addEventListener('mousedown', khiBam)
    document.addEventListener('keydown', khiPhim)
    window.addEventListener('scroll', dong, true)
    window.addEventListener('resize', dong)
    return () => { document.removeEventListener('mousedown', khiBam); document.removeEventListener('keydown', khiPhim); window.removeEventListener('scroll', dong, true); window.removeEventListener('resize', dong) }
  }, [vitri])

  return (
    <span data-bq-menu>
      <button ref={nutRef} type="button" className="icon-btn sm" aria-label={nhan} aria-haspopup="menu" aria-expanded={vitri !== null}
        onClick={() => { const r = nutRef.current?.getBoundingClientRect(); setViTri(vitri || !r ? null : { top: r.bottom + 4, right: window.innerWidth - r.right }) }}>
        <Icon name="more-h" />
      </button>
      {vitri ? <div role="menu" className="bq-menu" style={{ top: vitri.top, right: vitri.right }}>{children(dong)}</div> : null}
    </span>
  )
}

export function MucMenu({ icon, nguyHiem, onClick, children }: { icon: 'edit' | 'lock' | 'key' | 'send' | 'building' | 'eye'; nguyHiem?: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" role="menuitem" className={nguyHiem ? 'bq-menu-item is-danger' : 'bq-menu-item'} onClick={onClick}><Icon name={icon} />{children}</button>
}

/** CSS cục bộ của lô B (không sửa components.css chung). Chỉ dùng token --ma-*. */
export const CSS_BANG_QUAN_TRI = `
.bq-cat { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
.bq-menu { position: fixed; z-index: 30; min-width: 220px; padding: 8px; border-radius: var(--ma-radius-md); background: var(--ma-bg-card); box-shadow: var(--ma-shadow-lg); display: grid; gap: 2px; }
.bq-menu-item { display: flex; align-items: center; gap: 12px; min-height: 40px; padding: 0 12px; border: 0; border-radius: var(--ma-radius); background: transparent; color: var(--ma-text-primary); font: 500 15px/1.3 var(--ma-font-ui); cursor: pointer; text-align: left; }
.bq-menu-item:hover { background: var(--ma-paper-3); }
.bq-menu-item.is-danger { color: var(--ma-urgent); }
.bq-menu-item.is-danger:hover { background: var(--ma-urgent-bg); }
.bq-tag-vai { display: inline-flex; align-items: center; height: 26px; padding: 0 10px; border-radius: var(--ma-radius-pill); background: var(--ma-status-neutral-light); color: var(--ma-text-secondary); font: var(--ma-text-badge); white-space: nowrap; }
.bq-the-loc { position: relative; }
.bq-toa { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; max-width: 26ch; }
.bq-toolbar-phai { display: flex; justify-content: flex-end; margin-bottom: 12px; }
@media (min-width: 1360px) { .bq-the-loc > .bq-loc-phai { position: absolute; top: 24px; right: 24px; margin: 0; } .bq-the-loc .table-toolbar { padding-right: 164px; } .bq-the-loc .table-toolbar .input-wrap { width: 200px; } }
@media (min-width: 768px) { .table tr.bq-chon td { background: var(--ma-brand-accent-light); } }
@media (max-width: 767px) { .bq-gon .table.table-cards tbody td:not([data-the]) { flex: 0 1 auto; } .bq-gon .table.table-cards tbody td[data-label="Địa chỉ"] { flex: 1 1 100%; } .bq-gon .bq-toa { display: inline; max-width: none; } .table.table-cards tbody tr.bq-chon { background: var(--ma-brand-accent-light); margin: 0 -12px; padding: 14px 12px; border-radius: var(--ma-radius-md); }  .bq-menu { left: 16px; right: 16px !important; } .bq-loc-phai { margin-bottom: 8px; } }
`
