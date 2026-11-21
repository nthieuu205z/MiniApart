import type * as React from 'react'

export interface FilterChipProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onClick'> {
  active?: boolean
  /** Số kết quả hiện cạnh nhãn. */
  count?: number
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  /** Có onRemove thì chip chỉ để hiển thị bộ lọc đang bật, kèm nút bỏ lọc. */
  onRemove?: () => void
  children?: React.ReactNode
}

const ACTIVE: React.CSSProperties = {
  background: 'var(--ma-brand-accent-light)',
  borderColor: 'var(--ma-brand-primary)',
  color: 'var(--ma-brand-primary-hover)',
}

/** Chip lọc. Bộ lọc đang bật phải hiện thành chip để trạng thái rỗng-do-lọc giải thích được. */
export function FilterChip({ active = false, count, onClick, onRemove, children, className, style, ...rest }: FilterChipProps): React.ReactElement {
  const cls = ['chip', className].filter(Boolean).join(' ')
  const n = count === undefined ? null : <span className="n">{count}</span>
  if (onRemove) {
    return (
      <span className={cls} style={{ ...(active ? ACTIVE : {}), ...(style || {}) }} {...rest}>
        {children}
        {n}
        <button
          type="button"
          onClick={onRemove}
          aria-label="Bỏ lọc"
          style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', font: 'inherit', color: 'inherit', minHeight: 24 }}
        >
          Bỏ
        </button>
      </span>
    )
  }
  return (
    <button type="button" className={cls} aria-pressed={active} onClick={onClick} style={style} {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
      {n}
    </button>
  )
}
