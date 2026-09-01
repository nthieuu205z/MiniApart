import type * as React from 'react'

export interface MeterInputProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Ví dụ "Chỉ số mới — phòng 302". Luôn ghi rõ phòng nào. */
  label: string
  value: string | number
  /** Chỉ số kỳ trước, hiện làm gợi ý dưới ô khi chưa gõ. */
  previous?: string
  /** Mức tiêu thụ tính được, ví dụ "58 kWh" — hiện ngay khi người dùng gõ. */
  consumption?: string
  /** default = chưa gõ · filled = đã gõ hợp lệ · error = sai · locked = kỳ đã chốt */
  state?: 'default' | 'filled' | 'error' | 'locked'
  /** Câu lỗi phải nêu cả con số và cách sửa. */
  error?: string
  hint?: string
  /** Ô nhập thật của màn nghiệp vụ; nếu bỏ trống, component hiển thị value như specimen. */
  children?: React.ReactNode
}

/** Ô nhập chỉ số công tơ — thành phần khó nhất của hệ thống (màn #18). Bốn trạng thái. */
export function MeterInput({
  label,
  value,
  previous,
  consumption,
  state = "default",
  error,
  hint,
  children,
  style,
  ...rest
}: MeterInputProps): React.ReactElement {
  const boxes: Record<NonNullable<MeterInputProps['state']>, React.CSSProperties> = {
    default: { border: "1px solid var(--ma-border-strong)", padding: "10px 12px", color: "var(--ma-text-disabled)" },
    filled: { border: "2px solid var(--ma-ink-900)", padding: "9px 11px", color: "var(--ma-text-primary)" },
    error: { border: "2px solid var(--ma-urgent)", padding: "9px 11px", color: "var(--ma-text-primary)" },
    locked: { border: "1px solid var(--ma-border-default)", padding: "10px 12px", color: "var(--ma-text-disabled)", background: "var(--ma-bg-sunken)" },
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, ...(style || {}) }}>
      <label style={{ fontSize: 12, fontWeight: 600, fontFamily: "var(--ma-font-ui)" }}>{label}</label>
      <div
        style={{
          fontFamily: "var(--ma-font-mono)",
          fontSize: 17,
          background: "var(--ma-bg-card)",
          borderRadius: 0,
          ...boxes[state],
        }}
        {...rest}
      >
        {children ?? value}
      </div>
      {state === "error" && error ? (
        <div style={{ fontSize: 11.5, lineHeight: 1.45, color: "var(--ma-urgent)" }}>{error}</div>
      ) : consumption ? (
        <div style={{ fontSize: 11.5 }}>
          <b>= {consumption}</b>{" "}
          <span style={{ color: "var(--ma-text-secondary)" }}>· hiện ngay khi gõ</span>
        </div>
      ) : (
        <div style={{ fontSize: 11.5, color: "var(--ma-text-secondary)" }}>
          {hint || (previous ? `Kỳ trước ${previous}` : null)}
        </div>
      )}
    </div>
  )
}
