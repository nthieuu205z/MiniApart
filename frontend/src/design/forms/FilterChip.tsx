import type * as React from 'react'

export interface FilterChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  active?: boolean
  /** Có onRemove thì chip hiện nút bỏ lọc. */
  onRemove?: () => void
  children?: React.ReactNode
}

/** Chip lọc. Bộ lọc đang bật phải hiện thành chip để trạng thái rỗng-do-lọc giải thích được. */
export function FilterChip({ active = false, onRemove, children, style, ...rest }: FilterChipProps): React.ReactElement {
  return (
    <span
      style={{
        fontFamily: "var(--ma-font-mono)",
        fontSize: 11,
        fontWeight: active ? 700 : 400,
        letterSpacing: '0.06em',
        padding: '3px 8px',
        border: `1px solid ${active ? 'var(--ma-ink-900)' : 'var(--ma-border-dashed)'}`,
        color: active ? 'var(--ma-text-primary)' : 'var(--ma-text-secondary)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        borderRadius: 0,
        ...(style || {}),
      }}
      {...rest}
    >
      {children}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Bỏ lọc"
          style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', font: 'inherit', color: 'inherit', minHeight: 24 }}
        >
          Bỏ
        </button>
      ) : null}
    </span>
  )
}
