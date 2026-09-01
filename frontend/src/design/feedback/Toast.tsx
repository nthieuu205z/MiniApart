import type * as React from 'react'

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  undoLabel?: string
  /** Có onUndo thì toast sống lâu hơn và hiện liên kết Hoàn tác. */
  onUndo?: () => void
}

/** Toast xác nhận. Tự tắt sau 4s; có Hoàn tác thì 8–10s. */
export function Toast({ children, undoLabel = 'Hoàn tác', onUndo, style, ...rest }: ToastProps): React.ReactElement {
  return (
    <div
      role="status"
      style={{
        background: "var(--ma-bg-inverse)",
        color: "var(--ma-text-on-inverse)",
        padding: "12px 14px",
        fontFamily: "var(--ma-font-ui)",
        fontSize: 13.5,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        borderRadius: 0,
        ...(style || {}),
      }}
      {...rest}
    >
      <span>{children}</span>
      {onUndo ? (
        <button
          type="button"
          onClick={onUndo}
          style={{
            font: "inherit",
            fontWeight: 700,
            color: "inherit",
            background: "none",
            border: 0,
            padding: 0,
            cursor: "pointer",
            textDecoration: "underline",
            textUnderlineOffset: 3,
            whiteSpace: "nowrap",
          }}
        >
          {undoLabel}
        </button>
      ) : null}
    </div>
  )
}
