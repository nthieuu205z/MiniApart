import type * as React from 'react'
import { Icon } from '../core/Icon'
import { StatusTag } from '../core/StatusTag'

export interface TopBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Tiêu đề trang, chỉ cho bố cục điện thoại không có sidebar (Thợ, Khách thuê). */
  tieuDe?: string
  /** Có thì hiện nút ☰ (chỉ thấy ≤ 767px) mở ngăn menu. */
  onMoMenu?: () => void
  menuDangMo?: boolean
  /** Có thì hiện ô Tìm nhanh (Chủ, Quản lý) và gọi hàm này khi bấm. */
  onTim?: () => void
  /** Khe của ChuongThongBao (x7). Khe trống thì dùng link `notificationHref`. */
  chuong?: React.ReactNode
  notifications?: number
  notificationHref?: string
  /** Chỉ truyền khi không có sidebar (Thợ, Khách thuê): nút Đăng xuất dạng icon. Sidebar/ngăn menu có khối người dùng riêng. */
  onLogout?: () => void
  /** Bản cũ, chỉ GhiChiSo còn dùng: "Toà A — Nguyễn Trãi" + "Kỳ 08/2026" + nhãn trạng thái kỳ. Có `building` là dựng bản cũ. */
  building?: string
  period?: string
  periodStatus?: string
  search?: string
  /** Chỉ bản cũ: chuông chỉ còn icon. */
  compact?: boolean
}

/** Thanh trên: Tìm nhanh + chuông có số. Không còn "Không gian quản lý · ngày" hay breadcrumb lặp tiêu đề. */
export function TopBar({ tieuDe, onMoMenu, menuDangMo = false, onTim, chuong, notifications, notificationHref, onLogout, compact = false, building, period, periodStatus, search = 'Tìm nhanh', className, ...rest }: TopBarProps): React.ReactElement {
  if (building !== undefined) {
    return <TopBarCu building={building} period={period ?? ''} periodStatus={periodStatus} search={search} notifications={notifications} notificationHref={notificationHref} onLogout={onLogout} compact={compact} className={className} {...rest} />
  }

  const chuongLink = notificationHref ? (
    <a className="icon-btn has-n bell-fallback" data-testid="topbar-notifications" href={notificationHref} aria-label={notifications ? `Thông báo, ${notifications} chưa đọc` : 'Thông báo'}>
      <Icon name="bell" />
      {notifications ? <b data-testid="topbar-unread-count">{notifications}</b> : null}
    </a>
  ) : null
  return (
    <div className={['ux-top', className].filter(Boolean).join(' ')} {...rest}>
      {onMoMenu ? (
        <button type="button" className="icon-btn m-only" aria-label="Mở menu" aria-haspopup="dialog" aria-expanded={menuDangMo} onClick={onMoMenu}>
          <Icon name="menu" />
        </button>
      ) : null}
      {tieuDe ? <h1 className="h2" style={{ margin: 0, minWidth: 0 }}>{tieuDe}</h1> : null}
      {onTim ? (
        <button type="button" className="ux-search" aria-label="Tìm nhanh: người thuê, phòng, hợp đồng, hoá đơn (Ctrl K)" onClick={onTim}>
          <Icon name="search" />
          <span className="grow">Tìm người thuê, phòng, hợp đồng, hoá đơn…</span>
          <span className="search-kbd" aria-hidden="true">Ctrl K</span>
        </button>
      ) : null}
      <div className="push row">
        <span className="chuong-slot">{chuong}</span>
        {chuongLink}
        {onLogout ? (
          <button type="button" className="icon-btn" data-testid="topbar-logout" aria-label="Đăng xuất" title="Đăng xuất" onClick={onLogout}>
            <Icon name="logout" />
          </button>
        ) : null}
      </div>
    </div>
  )
}

function TopBarCu({ building, period, periodStatus, search, notifications, notificationHref, onLogout, compact, className, ...rest }: Required<Pick<TopBarProps, 'building' | 'period' | 'search'>> & Omit<TopBarProps, 'building' | 'period' | 'search'>): React.ReactElement {
  const badge = notifications ? (
    <span data-testid="topbar-unread-count" className="tag tag-danger" style={{ height: 22, padding: '0 8px' }}>
      {notifications}
    </span>
  ) : null
  const bell = (
    <>
      <Icon name="bell" />
      {compact ? null : <span>Thông báo</span>}
      {badge}
    </>
  )
  return (
    <div className={['topbar', className].filter(Boolean).join(' ')} {...rest}>
      <div className="title-block">
        <div className="row-wrap">
          <span className="t-strong row" style={{ gap: 6 }}>
            <Icon name="building" size="sm" />
            {building}
          </span>
          <span className="t-2">{period}</span>
          {periodStatus ? <StatusTag tone="done">{periodStatus}</StatusTag> : null}
        </div>
      </div>
      <div className="topbar-actions" style={compact ? { width: 'auto', flexWrap: 'nowrap' } : undefined}>
        {search && search !== 'Tìm nhanh' ? (
          <span className="t-2 row" style={{ gap: 6 }}>
            <Icon name="search" size="sm" />
            {search}
          </span>
        ) : null}
        {notificationHref ? (
          <a
            className={compact ? 'icon-btn' : 'btn btn-ghost'}
            style={compact ? { position: 'relative', width: 'auto', minWidth: 'var(--ma-hit-mobile)', padding: '0 8px', gap: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' } : undefined}
            data-testid="topbar-notifications"
            href={notificationHref}
            aria-label={notifications ? `Thông báo, ${notifications} chưa đọc` : 'Thông báo'}
          >
            {bell}
          </a>
        ) : (
          <span data-testid="topbar-notifications" className="row t-strong" style={{ gap: 6 }}>
            {bell}
          </span>
        )}
        {onLogout ? (
          <button type="button" className="icon-btn" data-testid="topbar-logout" aria-label="Đăng xuất" title="Đăng xuất" onClick={onLogout}>
            <Icon name="logout" />
          </button>
        ) : null}
      </div>
    </div>
  )
}
