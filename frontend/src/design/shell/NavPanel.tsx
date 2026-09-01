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
}

/** Menu dọc chia ba nhóm: Hàng ngày / Tiền / Toà nhà. Thứ tự nhóm phản ánh nhịp công việc thật. */
export function NavPanel({ product = 'MiniApart', subtitle = 'Quản lý toà nhà', groups, user, style, ...rest }: NavPanelProps): React.ReactElement {
  return (
    <nav
      style={{
        width: "var(--ma-nav-width)",
        background: "var(--ma-bg-nav)",
        borderRight: "1px solid var(--ma-border-default)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--ma-font-ui)",
        ...(style || {}),
      }}
      {...rest}
    >
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
                  minHeight: "var(--ma-hit-desktop)",
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
    </nav>
  )
}
