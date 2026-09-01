import type * as React from 'react'

export interface FigureProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Chuỗi đã định dạng sẵn, ví dụ "8.450.000". Không truyền số thô chưa tách nghìn. */
  value: string | number
  /** "đ", "kWh", "phòng"… hiện nhỏ hơn và nhạt hơn. */
  unit?: string
  /** Mẫu số cho tỉ lệ: value=21, total=24 → 21/24. */
  total?: string | number
  tone?: 'primary' | 'urgent' | 'muted' | 'onInverse'
  size?: 'lg' | 'md' | 'sm' | 'xs'
}

/** Con số: tiền, chỉ số công tơ, tỉ lệ. Luôn mono, luôn thẳng cột phải trong bảng. */
export function Figure({ value, unit, total, tone = 'primary', size = 'md', style, ...rest }: FigureProps): React.ReactElement {
  const sizes: Record<NonNullable<FigureProps['size']>, number> = { lg: 24, md: 19, sm: 16, xs: 13.5 }
  const colors: Record<NonNullable<FigureProps['tone']>, string> = {
    primary: 'var(--ma-text-primary)',
    urgent: 'var(--ma-urgent)',
    muted: 'var(--ma-text-secondary)',
    onInverse: 'var(--ma-text-on-inverse)',
  }
  return (
    <span
      style={{
        fontFamily: 'var(--ma-font-mono)',
        fontSize: sizes[size],
        fontWeight: 600,
        letterSpacing: 'var(--ma-tracking-figure)',
        fontVariantNumeric: 'tabular-nums',
        color: colors[tone],
        ...(style || {}),
      }}
      {...rest}
    >
      {value}
      {total !== undefined ? <span style={{ color: 'var(--ma-text-muted)' }}>/{total}</span> : null}
      {unit ? (
        <span style={{ fontSize: Math.round(sizes[size] * 0.63), fontWeight: 400, color: 'var(--ma-text-secondary)' }}>
          {' '}
          {unit}
        </span>
      ) : null}
    </span>
  )
}
