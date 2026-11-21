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
  onLogout?: () => void
}

/** Thanh đầu: bộ chọn toà và kỳ luôn ở đây, mọi vai trò, mọi màn. */
export function TopBar({ building, period, periodStatus, search = 'Tìm nhanh', notifications, notificationHref, onLogout, className, ...rest }: TopBarProps): React.ReactElement {
  const badge = notifications ? (
    <span data-testid="topbar-unread-count" className="tag tag-danger" style={{ height: 22, padding: '0 8px' }}>
      {notifications}
    </span>
  ) : null
  const bell = (
    <>
      <Icon name="bell" />
      <span>Thông báo</span>
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
      <div className="topbar-actions">
        {search && search !== 'Tìm nhanh' ? (
          <span className="t-2 row" style={{ gap: 6 }}>
            <Icon name="search" size="sm" />
            {search}
          </span>
        ) : null}
        {notificationHref ? (
          <a
            className="btn btn-ghost"
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
          <button type="button" className="btn btn-secondary btn-sm" data-testid="topbar-logout" onClick={onLogout}>
            Đăng xuất
          </button>
        ) : null}
      </div>
    </div>
  )
}
