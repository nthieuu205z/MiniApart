import type * as React from 'react'
import { Glyph } from '../core/Glyph'
import { Button } from '../core/Button'
import { SysLabel } from '../core/SysLabel'

export interface PrimaryTaskBlockProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** "Việc chặn cả kỳ · còn 2 ngày" */
  meta: string
  title: React.ReactNode
  /** Danh sách số phòng liên quan, hiện thành ô viền. */
  chips?: string[]
  body?: React.ReactNode
  primaryAction?: string
  secondaryAction?: string
  onPrimary?: () => void
  onSecondary?: () => void
}

/** Khối việc chính — nền mực, mỗi màn tối đa một khối. Đây là chỗ duy nhất được đảo màu. */
export function PrimaryTaskBlock({ meta, title, chips, body, primaryAction, secondaryAction, onPrimary, onSecondary, style, ...rest }: PrimaryTaskBlockProps): React.ReactElement {
  return (
    <div
      style={{
        background: "var(--ma-bg-inverse)",
        color: "var(--ma-text-on-inverse)",
        padding: "18px 20px",
        fontFamily: "var(--ma-font-ui)",
        borderRadius: 0,
        ...(style || {}),
      }}
      {...rest}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Glyph name="cong-to" size={12} color="var(--ma-text-secondary-on-inverse)" />
        <SysLabel tone="onInverse" style={{ fontSize: 10, letterSpacing: "0.12em" }}>{meta}</SysLabel>
      </div>
      <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-0.025em", marginTop: 9 }}>{title}</div>
      {chips && chips.length ? (
        <div style={{ display: "flex", gap: 7, marginTop: 11 }}>
          {chips.map((c) => (
            <span key={c} style={{ fontFamily: "var(--ma-font-mono)", fontSize: 13, border: "1px solid var(--ma-border-inverse)", padding: "5px 10px" }}>
              {c}
            </span>
          ))}
        </div>
      ) : null}
      {body ? (
        <div style={{ fontSize: 12.5, color: "var(--ma-text-secondary-on-inverse)", marginTop: 11, lineHeight: 1.5 }}>{body}</div>
      ) : null}
      <div style={{ marginTop: 14, display: "flex", gap: 9 }}>
        {primaryAction ? <Button variant="onInverse" onClick={onPrimary}>{primaryAction}</Button> : null}
        {secondaryAction ? <Button variant="onInverseGhost" onClick={onSecondary}>{secondaryAction}</Button> : null}
      </div>
    </div>
  );
}
