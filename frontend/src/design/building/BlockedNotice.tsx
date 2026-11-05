import type * as React from 'react'
import { Glyph } from '../core/Glyph'

export interface BlockedNoticeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** "Chốt kỳ 08/2026 — chưa mở được" */
  title: string
  /** "Cần đủ chỉ số 24/24 phòng. Hiện còn 3 phòng thiếu." — luôn có con số. */
  reason: React.ReactNode
}

/** Dải "bị chặn": bước chưa mở được. Luôn nói rõ thiếu gì, bằng con số. */
export function BlockedNotice({ title, reason, style, ...rest }: BlockedNoticeProps): React.ReactElement {
  return (
    <div
      style={{
        border: "1px dashed var(--ma-border-dashed)",
        background: "var(--ma-bg-sunken)",
        padding: "13px 16px",
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: 12,
        alignItems: "center",
        fontFamily: "var(--ma-font-ui)",
        borderRadius: 0,
        ...(style || {}),
      }}
      {...rest}
    >
      <Glyph name="bi-chan" size={20} color="var(--ma-ink-600)" strokeWidth={1.5} />
      <div>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: "var(--ma-text-secondary)", marginTop: 3, lineHeight: 1.45 }}>{reason}</div>
      </div>
    </div>
  );
}
