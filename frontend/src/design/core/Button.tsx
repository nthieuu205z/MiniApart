import type * as React from 'react'
import { Glyph } from './Glyph'
import type { GlyphName } from './GlyphName'

/**
 * Nút của MiniApart: bo 6px, không bóng đổ, nhãn là động từ + đối tượng.
 * Nút bị chặn KHÔNG bị ẩn — vẫn hiện, kèm câu nói rõ điều kiện còn thiếu.
 * @startingPoint section="Core" subtitle="Bốn cấp nút, có trạng thái bị chặn kèm lý do" viewport="700x260"
 */
export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  /** primary = việc chính của màn (tối đa một cái). onInverse* dùng khi nằm trên khối nền mực. */
  variant?: 'primary' | 'secondary' | 'text' | 'danger' | 'onInverse' | 'onInverseGhost'
  size?: 'md' | 'sm'
  glyph?: GlyphName
  /** Chặn thay cho disabled: nút vẫn thấy, vẫn đọc được, chỉ không bấm được. */
  blocked?: boolean
  /** Câu giải thích thiếu điều kiện gì. Bắt buộc khi blocked ở màn thật. */
  blockedReason?: string
  children?: React.ReactNode
}

const CLASS: Record<'primary' | 'secondary' | 'text' | 'danger', string> = {
  primary: 'btn btn-primary',
  secondary: 'btn btn-secondary',
  text: 'btn btn-ghost',
  danger: 'btn btn-danger',
}

// Chỉ dùng trên nền tối: giữ inline như cũ, lớp .btn lo kích thước.
const INVERSE: Record<'onInverse' | 'onInverseGhost', React.CSSProperties> = {
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
  className,
  onClick,
  onKeyDown,
  ...rest
}: ButtonProps): React.ReactElement {
  const cls = [variant in CLASS ? CLASS[variant as keyof typeof CLASS] : 'btn', size === 'sm' ? 'btn-sm' : '', className].filter(Boolean).join(' ')
  // Cao theo mật độ: 36 desktop · 44 chu-m · 52 thoang (token --ma-control-h*).
  const s: React.CSSProperties = { minHeight: size === 'sm' ? 'var(--ma-control-h-sm)' : 'var(--ma-control-h)', ...(INVERSE[variant as keyof typeof INVERSE] ?? {}), ...(style || {}) }
  const btn = (
    <button
      type="button"
      className={cls}
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
