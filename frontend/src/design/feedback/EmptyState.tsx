import type * as React from 'react'
import { Button } from '../core/Button'

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  kind?: 'first' | 'filtered' | 'error'
  title: string
  body?: React.ReactNode
  actionLabel?: string
  onAction?: () => void
  /** Các <FilterChip> đang bật — chỉ dùng với kind="filtered". */
  filters?: React.ReactNode
  /** Mã tra cứu ngắn cho người hỗ trợ, ví dụ "8F3C". Không bao giờ hiện stack trace. */
  errorCode?: string
}

/** Trạng thái rỗng. Rỗng-lần-đầu, rỗng-do-lọc và lỗi là BA màn khác nhau — không gộp. */
export function EmptyState({ kind = 'first', title, body, actionLabel, onAction, filters, errorCode, style, ...rest }: EmptyStateProps): React.ReactElement {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        fontFamily: "var(--ma-font-ui)",
        padding: "22px 16px",
        ...(style || {}),
      }}
      {...rest}
    >
      {kind === "filtered" && filters ? (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{filters}</div>
      ) : null}
      <div style={{ fontSize: kind === "filtered" ? 15 : 15.5, fontWeight: 700 }}>{title}</div>
      {body ? <div style={{ fontSize: 13, color: "var(--ma-text-secondary)", lineHeight: 1.55 }}>{body}</div> : null}
      <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
        {actionLabel ? (
          <Button variant={kind === "filtered" ? "secondary" : "primary"} size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
        {kind === "error" && errorCode ? (
          <span style={{ fontFamily: "var(--ma-font-mono)", fontSize: 10.5, letterSpacing: "0.11em", color: "var(--ma-text-disabled)" }}>
            MÃ TRA CỨU {errorCode}
          </span>
        ) : null}
      </div>
    </div>
  );
}
