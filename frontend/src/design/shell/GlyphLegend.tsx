import type * as React from 'react'
import { Glyph } from '../core/Glyph'
import type { GlyphName } from '../core/GlyphName'

export interface LegendItem {
  glyph: GlyphName
  label: string
  color?: string
  /** Số phòng đang ở trạng thái đó. */
  count?: number
}

export interface GlyphLegendProps extends React.HTMLAttributes<HTMLDivElement> {
  items: LegendItem[]
}

/** Chú giải ký hiệu. Bắt buộc có ở mọi màn dùng mặt cắt toà nhà hoặc sơ đồ phòng. */
export function GlyphLegend({ items, style, ...rest }: GlyphLegendProps): React.ReactElement {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 18,
        fontFamily: "var(--ma-font-ui)",
        fontSize: 11.5,
        color: "var(--ma-text-secondary)",
        ...(style || {}),
      }}
      {...rest}
    >
      {items.map((it) => (
        <span key={it.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Glyph name={it.glyph} color={it.color || "var(--ma-ink-600)"} size={13} strokeWidth={1.7} />
          {it.label}
          {it.count != null ? ` · ${it.count}` : ""}
        </span>
      ))}
    </div>
  )
}
