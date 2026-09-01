import type * as React from 'react'
import { Glyph } from '../core/Glyph'
import type { GlyphName } from '../core/GlyphName'

export interface TopBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** "Toà A — Nguyễn Trãi" */
  building: string
  /** "Kỳ 08/2026" */
  period: string
  /** "Đang mở · chốt 31/08" — nhãn xanh. Bỏ trống khi kỳ đã chốt. */
  periodStatus?: string
  search?: string
  notifications?: number
}

/** Thanh đầu: bộ chọn toà và kỳ luôn ở đây, mọi vai trò, mọi màn. */
export function TopBar({ building, period, periodStatus, search = 'Tìm nhanh', notifications, style, ...rest }: TopBarProps): React.ReactElement {
  const pick = (glyph: GlyphName | null, text: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14.5, fontWeight: 700, letterSpacing: "-0.01em", minHeight: "var(--ma-hit-desktop)" }}>
      {glyph ? <Glyph name={glyph} size={14} color="var(--ma-text-secondary)" strokeWidth={1.5} /> : null}
      {text}
      <Glyph name="mo-xuong" size={9} color="var(--ma-text-secondary)" strokeWidth={1.4} />
    </div>
  );
  return (
    <div
      style={{
        height: "var(--ma-topbar-height)",
        display: "flex",
        alignItems: "center",
        gap: 13,
        padding: "0 30px",
        borderBottom: "1px solid var(--ma-border-default)",
        background: 'var(--ma-bg-nav-active)',
        fontFamily: "var(--ma-font-ui)",
        ...(style || {}),
      }}
      {...rest}
    >
      {pick("toa-nha", building)}
      <div style={{ width: 1, height: 18, background: "var(--ma-border-default)" }} />
      {pick(null, period)}
      {periodStatus ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--ma-font-mono)", fontSize: 10.5, letterSpacing: "0.1em", padding: "4px 9px", background: "var(--ma-done-bg)", color: "var(--ma-done-text)", textTransform: "uppercase" }}>
          <Glyph name="cong-to" size={11} />
          {periodStatus}
        </div>
      ) : null}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 20, fontSize: 13, color: "var(--ma-text-secondary)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Glyph name="tim" size={14} strokeWidth={1.5} />
          {search}
          <span style={{ fontFamily: "var(--ma-font-mono)", fontSize: 11, border: "1px solid var(--ma-border-default)", padding: "1px 5px" }}>/</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 600, color: "var(--ma-text-primary)" }}>
          <Glyph name="thong-bao" size={15} strokeWidth={1.5} />
          Thông báo
          {notifications ? (
            <span style={{ fontFamily: "var(--ma-font-mono)", fontSize: 11.5, fontWeight: 700, color: "var(--ma-text-on-inverse)", background: "var(--ma-urgent)", padding: "1px 6px" }}>
              {notifications}
            </span>
          ) : null}
        </span>
      </div>
    </div>
  )
}
