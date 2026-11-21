import { useState } from 'react'
import type * as React from 'react'
import { Glyph } from '../core/Glyph'
import type { GlyphName } from '../core/GlyphName'
import { Icon, type IconName } from '../core/Icon'

export interface NavItem {
  label: string
  glyph: GlyphName
  /** Icon của bộ giao diện (sprite ui-icons); có thì dùng thay cho glyph. */
  icon?: IconName
  /** Nhãn ngắn cho bottom-nav; `label` vẫn là nhãn đầy đủ (aria-label). */
  shortLabel?: string
  /** Mục con thụt lề trong sidebar. */
  depth?: 0 | 1
  href?: string
  active?: boolean
  /** Số việc tồn. Chỉ hiện khi > 0. */
  count?: number
  /** urgent (đỏ, mặc định) hoặc waiting (cam). */
  countTone?: 'urgent' | 'waiting'
}

export interface NavGroup {
  /** "Hàng ngày" · "Tiền" · "Toà nhà" — giữ đúng ba nhóm và đúng thứ tự này cho vai trò Quản lý. Chuỗi rỗng = nhóm không nhãn. */
  label: string
  items: NavItem[]
}

/**
 * Menu dọc của khung ứng dụng. Chia nhóm theo nhịp công việc, không theo cấu trúc dữ liệu.
 * @startingPoint section="Shell" subtitle="Menu dọc chia nhóm Hàng ngày / Tiền / Toà nhà" viewport="240x620"
 */
export interface NavPanelProps extends React.HTMLAttributes<HTMLElement> {
  product?: string
  subtitle?: string
  groups: NavGroup[]
  user?: { initials: string; name: string; role: string }
  mobile?: boolean
  /** Sidebar thu gọn còn icon (≥768 và <1280). */
  collapsed?: boolean
  onLogout?: () => void
}

/** Menu dọc chia ba nhóm: Hàng ngày / Tiền / Toà nhà. Thứ tự nhóm phản ánh nhịp công việc thật. */
export function NavPanel({ product = 'MiniApart', subtitle = 'Quản lý toà nhà', groups, user, mobile = false, collapsed = false, onLogout, className, style, ...rest }: NavPanelProps): React.ReactElement {
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false)
  const allItems = groups.flatMap((group) => group.items)
  // ≤ 5 mục: hiện hết, không có "Thêm"; nhiều hơn: 4 mục + "Thêm".
  const barLimit = allItems.length <= 5 ? 5 : 4
  const primaryItems = allItems.slice(0, barLimit)
  const overflowItems = allItems.slice(barLimit)

  const renderMobileItem = (item: NavItem, variant: 'bar' | 'more') => (
    <a
      key={item.label}
      href={item.href || '#'}
      aria-current={item.active ? 'page' : undefined}
      aria-label={item.shortLabel ? item.label : undefined}
      onClick={() => setMobileMoreOpen(false)}
      style={variant === 'bar' ? {
        display: 'grid',
        placeItems: 'center',
        alignContent: 'center',
        gap: 3,
        minWidth: 0,
        minHeight: 'var(--ma-bottom-nav-height)',
        padding: '5px 3px',
        fontSize: 12,
        lineHeight: 1.1,
        textAlign: 'center',
        textDecoration: 'none',
        fontWeight: item.active ? 700 : 500,
        color: item.active ? 'var(--ma-brand-accent)' : 'var(--ma-text-secondary)',
        background: item.active ? 'var(--ma-brand-accent-light)' : 'transparent',
        boxShadow: item.active ? 'var(--ma-nav-active-inset) var(--ma-brand-accent)' : undefined,
        overflow: 'hidden',
      } : {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minWidth: 0,
        minHeight: 'var(--ma-hit-mobile)',
        padding: '8px 10px',
        fontSize: 13,
        lineHeight: 1.25,
        textDecoration: 'none',
        fontWeight: item.active ? 700 : 500,
        color: item.active ? 'var(--ma-brand-accent)' : 'var(--ma-text-primary)',
        background: item.active ? 'var(--ma-brand-accent-light)' : 'transparent',
        boxShadow: item.active ? 'var(--ma-nav-active-inset) var(--ma-brand-accent)' : undefined,
        overflowWrap: 'anywhere',
      }}
    >
      {item.icon ? <Icon name={item.icon} /> : <Glyph name={item.glyph} size={variant === 'bar' ? 16 : 15} strokeWidth={1.5} color={item.active ? 'var(--ma-brand-accent)' : 'var(--ma-text-secondary)'} />}
      <span style={variant === 'bar' ? { minWidth: 0, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : { minWidth: 0 }}>{variant === 'bar' ? item.shortLabel ?? item.label : item.label}</span>
      {item.count ? (
        <span style={{ marginLeft: variant === 'bar' ? 0 : 'auto', fontFamily: 'var(--ma-font-mono)', fontSize: 11, fontWeight: 700, color: item.countTone === 'waiting' ? 'var(--ma-waiting)' : 'var(--ma-urgent)' }}>
          {item.count}
        </span>
      ) : null}
    </a>
  )

  return (
    <nav
      className={[mobile ? '' : 'sidebar', !mobile && collapsed ? 'is-collapsed' : '', className].filter(Boolean).join(' ') || undefined}
      data-navigation-layout={mobile ? 'bottom' : 'side'}
      style={{
        ...(mobile ? {
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 20,
          width: '100%',
          maxWidth: '100vw',
          minWidth: 0,
          overflowX: 'hidden',
          borderTop: '1px solid var(--ma-border-default)',
        } : {
          width: 'var(--ma-nav-width)',
          overflow: 'hidden',
        }),
        ...(mobile ? { background: 'var(--ma-bg-nav)', display: 'flex', flexDirection: 'column' } : {}),
        fontFamily: 'var(--ma-font-ui)',
        ...(style || {}),
      }}
      {...rest}
    >
      {mobile ? (
        <>
          <div
            data-testid="mobile-nav-bar"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${primaryItems.length + (overflowItems.length ? 1 : 0)}, minmax(0, 1fr))`,
              width: '100%',
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            {primaryItems.map((item) => renderMobileItem(item, 'bar'))}
            {overflowItems.length ? (
              <button
                type="button"
                aria-expanded={mobileMoreOpen}
                aria-controls="mobile-nav-more"
                onClick={() => setMobileMoreOpen((current) => !current)}
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  alignContent: 'center',
                  gap: 3,
                  minWidth: 0,
                  minHeight: 'var(--ma-hit-mobile)',
                  padding: '5px 3px',
                  border: 0,
                  borderRadius: 0,
                  background: 'transparent',
                  color: 'var(--ma-text-secondary)',
                  fontFamily: 'var(--ma-font-ui)',
                  fontSize: 12,
                  lineHeight: 1.1,
                  textAlign: 'center',
                  overflow: 'hidden',
                }}
              >
                <Glyph name="mo-xuong" size={15} strokeWidth={1.5} />
                <span style={{ minWidth: 0, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Thêm</span>
              </button>
              ) : null}
          </div>
          {overflowItems.length ? (
            <div
              id="mobile-nav-more"
              data-testid="mobile-nav-more"
              hidden={!mobileMoreOpen}
              style={{
                display: mobileMoreOpen ? 'grid' : 'none',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 10rem), 1fr))',
                gap: 6,
                padding: 6,
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: '100%',
                maxHeight: '70vh',
                overflowY: 'auto',
                overflowX: 'hidden',
                minWidth: 0,
                background: 'var(--ma-bg-nav)',
                border: '1px solid var(--ma-border-default)',
                boxShadow: '0 -4px 12px rgba(22, 19, 16, 0.08)',
              }}
            >
              {overflowItems.map((item) => renderMobileItem(item, 'more'))}
            </div>
          ) : null}
        </>
      ) : (
        <>
          <div className="sb-brand">
            <div className="logo" aria-hidden="true">M</div>
            <div>
              <div className="sb-name">{product}</div>
              <div className="sb-scope">{subtitle}</div>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'grid', gap: 2, alignContent: 'start' }}>
            {groups.map((g) => (
              <div key={g.label || 'chung'} style={{ display: 'grid', gap: 2 }}>
                {g.label ? <div className="sb-label">{g.label}</div> : null}
                {g.items.map((it) => (
                  <a
                    key={it.label}
                    className="nav-item"
                    href={it.href || '#'}
                    aria-current={it.active ? 'page' : undefined}
                    aria-label={collapsed ? it.label : undefined}
                    title={collapsed ? it.label : undefined}
                    style={{ minHeight: collapsed ? 'var(--ma-hit-mobile)' : undefined, marginLeft: it.depth === 1 ? 32 : undefined }}
                  >
                    {it.depth === 1 ? null : it.icon ? <Icon name={it.icon} /> : <Glyph name={it.glyph} size={16} strokeWidth={it.active ? 2 : 1.6} />}
                    <span>{it.label}</span>
                    {it.count ? (
                      <b
                        className="count"
                        aria-label={`${it.count} việc cần xử lý`}
                        style={it.countTone === 'waiting' ? { background: 'var(--ma-waiting-bg)', color: 'var(--ma-waiting)' } : undefined}
                      >
                        {it.count}
                      </b>
                    ) : null}
                  </a>
                ))}
              </div>
            ))}
          </div>

          {user ? (
            <>
              <div className="sb-user" style={{ marginTop: 8, flex: 'none' }}>
                {collapsed ? null : <span className="avatar sm h4" aria-hidden="true">{user.initials}</span>}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="name" title={user.name}>{user.name}</div>
                  <div className="t-meta" title={user.role}>{user.role}</div>
                </div>
                {onLogout ? (
                  <button type="button" className="icon-btn sm" data-testid="nav-logout" aria-label="Đăng xuất" title="Đăng xuất" onClick={onLogout}>
                    <Icon name="logout" />
                  </button>
                ) : null}
              </div>
            </>
          ) : null}
        </>
      )}
    </nav>
  )
}
