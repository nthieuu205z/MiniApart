import type * as React from 'react'
import { Glyph } from '../core/Glyph'
import { Button } from '../core/Button'
import { SysLabel } from '../core/SysLabel'
import type { GlyphName } from '../core/GlyphName'

export interface TaskRowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  glyph: GlyphName
  glyphColor?: string
  /** Nhãn hệ thống: "QUÁ HẠN · 108 · 305 · +3" — mức trước, phòng sau. */
  meta: string
  metaTone?: 'secondary' | 'primary' | 'urgent' | 'waiting'
  title: React.ReactNode
  detail?: React.ReactNode
  actionLabel?: string
  onAction?: () => void
}

/** Một dòng việc trong cột nhắc việc. Nhãn hệ thống ở trên nói rõ mức và phòng liên quan. */
export function TaskRow({ glyph, glyphColor = 'var(--ma-ink-600)', meta, metaTone = 'secondary', title, detail, actionLabel, onAction, style, ...rest }: TaskRowProps): React.ReactElement {
  return (
    <div
      style={{
        padding: "14px 0",
        borderTop: "1px solid var(--ma-border-default)",
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        gap: 12,
        alignItems: "center",
        fontFamily: "var(--ma-font-ui)",
        ...(style || {}),
      }}
      {...rest}
    >
      <Glyph name={glyph} color={glyphColor} size={17} strokeWidth={1.7} />
      <div style={{ minWidth: 0 }}>
        <SysLabel tone={metaTone} style={{ letterSpacing: "0.09em" }}>{meta}</SysLabel>
        <div style={{ fontSize: 15.5, fontWeight: 600, marginTop: 5 }}>{title}</div>
        {detail ? (
          <div style={{ fontSize: 12.5, color: "var(--ma-text-secondary)", marginTop: 3, lineHeight: 1.45 }}>{detail}</div>
        ) : null}
      </div>
      {actionLabel ? (
        <Button variant="secondary" size="sm" onClick={onAction}>{actionLabel}</Button>
      ) : <span />}
    </div>
  );
}
