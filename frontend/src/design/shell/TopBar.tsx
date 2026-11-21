import type * as React from 'react'
import { Icon } from '../core/Icon'
import { StatusTag } from '../core/StatusTag'

export interface TopBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** "Toà A — Nguyễn Trãi" */
  building: string
  /** "Kỳ 08/2026" */
  period: string
  /** "Đang mở · chốt 31/08" — nhãn xanh. Bỏ trống khi kỳ đã chốt. */
  periodStatus?: string
  search?: string
  notifications?: number
  notificationHref?: string
  /** Chỉ truyền khi không có sidebar (mobile): hiện nút Đăng xuất dạng icon. Desktop để khối người dùng của sidebar lo. */
  onLogout?: () => void
  /** Mobile: chuông chỉ còn icon (nhãn nằm ở aria-label) để thanh trên không bị kéo giãn. */
  compact?: boolean
}

/** Thanh đầu: bộ chọn toà và kỳ luôn ở đây, mọi vai trò, mọi màn. */
export function TopBar({ building, period, periodStatus, search = 'Tìm nhanh', notifications, notificationHref, onLogout, compact = false, className, ...rest }: TopBarProps): React.ReactElement {
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
