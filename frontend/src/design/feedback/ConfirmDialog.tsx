import type * as React from 'react'
import { Button } from '../core/Button'

export interface ConfirmDialogProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Câu hỏi có đối tượng cụ thể: "Chốt kỳ 08/2026 toà A?" */
  title: string
  /** Hậu quả kèm con số: "không sửa được chỉ số của 24 phòng". Bắt buộc. */
  consequence: React.ReactNode
  /** Nhãn nút xác nhận = động từ của việc đó, không phải "OK". */
  confirmLabel: string
  cancelLabel?: string
  onConfirm?: () => void
  onCancel?: () => void
}

/** Hộp thoại xác nhận — chỉ dùng cho thao tác không đảo ngược được, và phải nêu hậu quả bằng con số. */
export function ConfirmDialog({ title, consequence, confirmLabel, cancelLabel = 'Để sau', onConfirm, onCancel, style, ...rest }: ConfirmDialogProps): React.ReactElement {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        border: "1px solid var(--ma-ink-900)",
        background: "var(--ma-bg-card)",
        padding: 16,
        width: '100%',
        maxWidth: 420,
        fontFamily: "var(--ma-font-ui)",
        borderRadius: 0,
        ...(style || {}),
      }}
      {...rest}
    >
      <div style={{ fontSize: 15.5, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--ma-text-secondary)", marginTop: 7, lineHeight: 1.55 }}>{consequence}</div>
      <div style={{ display: "flex", gap: 9, marginTop: 14 }}>
        <Button variant="primary" size="sm" onClick={onConfirm} style={{ minHeight: 44 }}>{confirmLabel}</Button>
        <Button variant="secondary" size="sm" onClick={onCancel} style={{ minHeight: 44 }}>{cancelLabel}</Button>
      </div>
    </div>
  );
}
