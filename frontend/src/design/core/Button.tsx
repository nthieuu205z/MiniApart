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
  borderRadius: 'var(--ma-radius)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  whiteSpace: 'nowrap',
  transition: 'all 0.15s ease',
  boxShadow: 'var(--ma-shadow-sm)',
}

const SIZES: Record<NonNullable<ButtonProps['size']>, React.CSSProperties> = {
  md: { fontSize: 14, fontWeight: 600, padding: "10px 18px", minHeight: 44 },
  sm: { fontSize: 13, fontWeight: 500, padding: "7px 14px", minHeight: 36 },
}

const VARIANTS: Record<NonNullable<ButtonProps['variant']>, React.CSSProperties> = {
  primary: { background: "var(--ma-brand-primary)", color: "#FFFFFF", borderColor: "var(--ma-brand-primary)" },
  secondary: { background: "var(--ma-bg-card)", color: "var(--ma-text-primary)", borderColor: "var(--ma-border-default)" },
  text: { background: "transparent", color: "var(--ma-brand-blue)", borderColor: "transparent", padding: "9px 4px", textDecoration: "none", boxShadow: "none" },
  onInverse: { background: "#FFFFFF", color: "var(--ma-brand-primary)", borderColor: "#FFFFFF" },
  onInverseGhost: { background: "rgba(255, 255, 255, 0.1)", color: "#FFFFFF", borderColor: "rgba(255, 255, 255, 0.2)" },
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
