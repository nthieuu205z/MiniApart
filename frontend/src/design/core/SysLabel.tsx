import type * as React from 'react'

export interface SysLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'secondary' | 'primary' | 'urgent' | 'waiting' | 'onInverse'
  children?: React.ReactNode
}

/** Nhãn hệ thống: mono, chữ hoa, giãn 0.11em. Dùng cho tiêu đề cột, nhãn cụm số liệu, nhóm menu. */
export function SysLabel({ tone = 'secondary', children, style, ...rest }: SysLabelProps): React.ReactElement {
  const colors: Record<NonNullable<SysLabelProps['tone']>, string> = {
    secondary: 'var(--ma-text-secondary)',
    primary: 'var(--ma-text-primary)',
    urgent: 'var(--ma-urgent)',
    waiting: 'var(--ma-waiting)',
    onInverse: 'var(--ma-text-secondary-on-inverse)',
  }
  return (
    <span
      style={{
        fontFamily: "var(--ma-font-mono)",
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: "var(--ma-tracking-syslabel)",
        textTransform: "uppercase",
        color: colors[tone],
        ...(style || {}),
      }}
      {...rest}
    >
      {children}
    </span>
  )
}
