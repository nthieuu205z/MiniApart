import { useState } from 'react'
import type * as React from 'react'
import { Glyph } from '../core/Glyph'
import type { GlyphName } from '../core/GlyphName'

export interface NavItem {
  label: string
  glyph: GlyphName
  href?: string
  active?: boolean
  /** Số việc tồn. Chỉ hiện khi > 0. */
  count?: number
  /** urgent (đỏ, mặc định) hoặc waiting (cam). */
  countTone?: 'urgent' | 'waiting'
}

export interface NavGroup {
  /** "Hàng ngày" · "Tiền" · "Toà nhà" — giữ đúng ba nhóm và đúng thứ tự này cho vai trò Quản lý. */
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
}

/** Menu dọc chia ba nhóm: Hàng ngày / Tiền / Toà nhà. Thứ tự nhóm phản ánh nhịp công việc thật. */
export function NavPanel({ product = 'MiniApart', subtitle = 'Quản lý toà nhà', groups, user, mobile = false, style, ...rest }: NavPanelProps): React.ReactElement {
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false)
  const allItems = groups.flatMap((group) => group.items)
  const primaryItems = allItems.slice(0, 4)
  const overflowItems = allItems.slice(4)

  const renderMobileItem = (item: NavItem, variant: 'bar' | 'more') => (
    <a
      key={item.label}
      href={item.href || '#'}
      onClick={() => setMobileMoreOpen(false)}
      style={variant === 'bar' ? {
        display: 'grid',
        placeItems: 'center',
        alignContent: 'center',
        gap: 3,
        minWidth: 0,
        minHeight: 'var(--ma-hit-mobile)',
        padding: '5px 3px',
        fontSize: 11,
        lineHeight: 1.1,
        textAlign: 'center',
        textDecoration: 'none',
        fontWeight: item.active ? 700 : 400,
        color: item.active ? 'var(--ma-text-primary)' : 'var(--ma-text-secondary)',
        background: item.active ? 'var(--ma-bg-nav-active)' : 'transparent',
        boxShadow: item.active ? 'var(--ma-nav-active-inset) var(--ma-urgent)' : undefined,
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
        fontWeight: item.active ? 700 : 400,
        color: item.active ? 'var(--ma-text-primary)' : 'var(--ma-text-secondary)',
        background: item.active ? 'var(--ma-bg-nav-active)' : 'transparent',
        boxShadow: item.active ? 'var(--ma-nav-active-inset) var(--ma-urgent)' : undefined,
        overflowWrap: 'anywhere',
      }}
    >
      <Glyph name={item.glyph} size={variant === 'bar' ? 16 : 15} strokeWidth={1.5} />
      <span style={variant === 'bar' ? { minWidth: 0, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : { minWidth: 0 }}>{item.label}</span>
      {item.count ? (
        <span style={{ marginLeft: variant === 'bar' ? 0 : 'auto', fontFamily: 'var(--ma-font-mono)', fontSize: 11, fontWeight: 700, color: item.countTone === 'waiting' ? 'var(--ma-waiting)' : 'var(--ma-urgent)' }}>
          {item.count}
        </span>
      ) : null}
    </a>
  )

  return (
    <nav
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
          borderRight: '1px solid var(--ma-border-default)',
        }),
        background: 'var(--ma-bg-nav)',
        display: 'flex',
        flexDirection: 'column',
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
                  fontSize: 11,
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
        </>
      ) : (
        <>
          <div style={{ padding: "20px 20px 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--ma-border-default)" }}>
            <Glyph name="toa-nha" size={22} color="var(--ma-text-primary)" />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{product}</div>
              <div style={{ fontFamily: "var(--ma-font-mono)", fontSize: 9.5, letterSpacing: "0.12em", color: "var(--ma-text-secondary)", marginTop: 2, textTransform: "uppercase" }}>
                {subtitle}
              </div>
            </div>
          </div>

          <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: 18 }}>
            {groups.map((g) => (
              <div key={g.label}>
                <div style={{ fontFamily: "var(--ma-font-mono)", fontSize: 10, letterSpacing: "var(--ma-tracking-navgroup)", color: "var(--ma-text-secondary)", padding: "0 20px 8px", textTransform: "uppercase" }}>
                  {g.label}
                </div>
                {g.items.map((it) => (
                  <a
                    key={it.label}
                    href={it.href || "#"}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 11,
                      padding: "9px 20px",
                      fontSize: 14.5,
                      minHeight: "var(--ma-hit-mobile)",
                      textDecoration: "none",
                      fontWeight: it.active ? 700 : 400,
                      color: it.active ? "var(--ma-text-primary)" : "var(--ma-text-secondary)",
                      background: it.active ? "var(--ma-bg-nav-active)" : "transparent",
                      boxShadow: it.active ? "var(--ma-nav-active-inset) var(--ma-urgent)" : undefined,
                    }}
                  >
                    <Glyph name={it.glyph} size={16} strokeWidth={1.5} />
                    <span>{it.label}</span>
                    {it.count ? (
                      <span style={{ marginLeft: "auto", fontFamily: "var(--ma-font-mono)", fontSize: 12, fontWeight: 700, color: it.countTone === "waiting" ? "var(--ma-waiting)" : "var(--ma-urgent)" }}>
                        {it.count}
                      </span>
                    ) : null}
                  </a>
                ))}
              </div>
            ))}
          </div>

          {user ? (
            <div style={{ marginTop: "auto", padding: "14px 20px", borderTop: "1px solid var(--ma-border-default)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, border: "1px solid var(--ma-border-strong)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--ma-font-mono)", fontSize: 12, fontWeight: 700, flex: "none" }}>
                {user.initials}
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.35 }}>
                <span style={{ fontWeight: 700 }}>{user.name}</span>
                <br />
                <span style={{ color: "var(--ma-text-secondary)" }}>{user.role}</span>
              </div>
            </div>
          ) : null}
        </>
      )}
    </nav>
  )
}
