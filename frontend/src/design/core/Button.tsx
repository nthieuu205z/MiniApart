import type * as React from 'react'
import { Glyph } from './Glyph'
import type { GlyphName } from './GlyphName'

/**
 * Nút của MiniApart: góc vuông, không bóng đổ, nhãn là động từ + đối tượng.
 * Nút bị chặn KHÔNG bị ẩn — vẫn hiện, kèm câu nói rõ điều kiện còn thiếu.
 * @startingPoint section="Core" subtitle="Bốn cấp nút, có trạng thái bị chặn kèm lý do" viewport="700x260"
 */
export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  /** primary = việc chính của màn (tối đa một cái). onInverse* dùng khi nằm trên khối nền mực. */
  variant?: 'primary' | 'secondary' | 'text' | 'onInverse' | 'onInverseGhost'
  size?: 'md' | 'sm'
  glyph?: GlyphName
  /** Chặn thay cho disabled: nút vẫn thấy, vẫn đọc được, chỉ không bấm được. */
  blocked?: boolean
  /** Câu giải thích thiếu điều kiện gì. Bắt buộc khi blocked ở màn thật. */
  blockedReason?: string
  children?: React.ReactNode
}

const BASE: React.CSSProperties = {
  fontFamily: 'var(--ma-font-ui)',
  border: '1px solid transparent',
  borderRadius: 0,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  whiteSpace: 'nowrap',
  transition: 'transform var(--ma-dur-press) linear',
}

const SIZES: Record<NonNullable<ButtonProps['size']>, React.CSSProperties> = {
  md: { fontSize: 14, fontWeight: 700, padding: "11px 17px", minHeight: 42 },
  sm: { fontSize: 13.5, fontWeight: 600, padding: "9px 14px", minHeight: 36 },
}

const VARIANTS: Record<NonNullable<ButtonProps['variant']>, React.CSSProperties> = {
  primary: { background: "var(--ma-bg-inverse)", color: "var(--ma-text-on-inverse)", borderColor: "var(--ma-bg-inverse)" },
  secondary: { background: "transparent", color: "var(--ma-text-primary)", borderColor: "var(--ma-border-strong)" },
  text: { background: "transparent", color: "var(--ma-text-primary)", borderColor: "transparent", padding: "9px 4px", textDecoration: "underline", textUnderlineOffset: 3 },
  onInverse: { background: "var(--ma-text-on-inverse)", color: "var(--ma-ink-900)", borderColor: "var(--ma-text-on-inverse)" },
  onInverseGhost: { background: "transparent", color: "var(--ma-text-on-inverse)", borderColor: "var(--ma-border-inverse)" },
}

/** Nút của MiniApart. Nhãn luôn là động từ + đối tượng ("Chốt kỳ 08/2026"), không bao giờ "OK". */
export function Button({
  variant = "primary",
  size = "md",
  glyph,
  blocked = false,
  blockedReason,
  children,
  style,
  onClick,
  onKeyDown,
  ...rest
}: ButtonProps): React.ReactElement {
  const s: React.CSSProperties = { ...BASE, ...SIZES[size], ...VARIANTS[variant], ...(style || {}) }
  if (blocked) {
    Object.assign(s, {
      background: "transparent",
      color: "var(--ma-text-disabled)",
      borderColor: "var(--ma-border-default)",
      cursor: "not-allowed",
    })
  }
  const btn = (
    <button
      type="button"
      style={s}
      {...rest}
      aria-disabled={blocked || undefined}
      onClick={(event) => {
        if (blocked) {
          event.preventDefault()
          return
        }
        onClick?.(event)
      }}
      onKeyDown={(event) => {
        if (blocked && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          return
        }
        onKeyDown?.(event)
      }}
    >
      {glyph ? <Glyph name={glyph} size={15} /> : null}
      {children}
    </button>
  )
  if (blocked && blockedReason) {
    return (
      <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 5 }}>
        {btn}
        <span style={{ font: 'var(--ma-text-caption)', color: 'var(--ma-text-secondary)', maxWidth: 320 }}>
          {blockedReason}
        </span>
      </span>
    );
  }
  return btn
}
