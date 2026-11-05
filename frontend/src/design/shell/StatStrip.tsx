import type * as React from 'react'
import { SysLabel } from '../core/SysLabel'
import { Figure } from '../core/Figure'

export interface Stat {
  label: string
  value: string | number
  total?: string | number
  unit?: string
  tone?: 'primary' | 'urgent' | 'muted'
}

export interface StatStripProps extends React.HTMLAttributes<HTMLDivElement> {
  stats: Stat[]
  align?: 'left' | 'right'
  rule?: boolean
}

/** Cụm số liệu gạch trên. Tối đa 4 ô; số nào cũng bấm được để xem chi tiết. */
export function StatStrip({ stats, align = 'left', rule = true, style, ...rest }: StatStripProps): React.ReactElement {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
        gap: 16,
        paddingTop: rule ? 12 : 0,
        borderTop: rule ? "2px solid var(--ma-ink-900)" : undefined,
        textAlign: align,
        ...(style || {}),
      }}
      {...rest}
    >
      {stats.map((s) => (
        <div key={s.label}>
          <SysLabel style={{ fontSize: 9.5 }}>{s.label}</SysLabel>
          <div style={{ marginTop: 3 }}>
            <Figure value={s.value} total={s.total} unit={s.unit} tone={s.tone || "primary"} size="sm" />
          </div>
        </div>
      ))}
    </div>
  )
}
