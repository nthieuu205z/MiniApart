import type * as React from 'react'

export interface StatusTagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** draft=Nháp · neutral=trung tính · strong=đã phát hành · urgent=quá hạn/mới · waiting=đang xử lý · done=hoàn tất · closed=đã huỷ */
  tone?: 'draft' | 'neutral' | 'strong' | 'urgent' | 'waiting' | 'done' | 'closed'
  children?: React.ReactNode
}

const TONES: Record<NonNullable<StatusTagProps['tone']>, React.CSSProperties> = {
  draft: { border: "1px dashed var(--ma-border-dashed)", color: "var(--ma-text-secondary)", background: "transparent" },
  neutral: { border: "1px solid var(--ma-border-dashed)", color: "var(--ma-text-secondary)", background: "var(--ma-bg-sunken)" },
  strong: { border: "1px solid var(--ma-ink-900)", color: "var(--ma-text-primary)", background: "transparent" },
  urgent: { border: "1px solid transparent", color: "var(--ma-urgent)", background: "var(--ma-urgent-bg)" },
  waiting: { border: "1px solid var(--ma-waiting-border)", color: "var(--ma-waiting)", background: "var(--ma-bg-sunken)" },
  done: { border: "1px solid transparent", color: "var(--ma-done-text)", background: "var(--ma-done-bg)" },
  closed: { border: "1px solid var(--ma-ink-900)", color: "var(--ma-text-on-inverse)", background: "var(--ma-bg-inverse)" },
};

/** Nhãn trạng thái. Chữ hoa mono — máy chủ trả nhãn tiếng Việt, giao diện không tự dịch mã. */
export function StatusTag({ tone = 'neutral', children, style, ...rest }: StatusTagProps): React.ReactElement {
  return (
    <span
      style={{
        fontFamily: "var(--ma-font-mono)",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.08em",
        padding: "3px 8px",
        borderRadius: 0,
        display: "inline-block",
        ...TONES[tone],
        ...(style || {}),
      }}
      {...rest}
    >
      {children}
    </span>
  )
}
