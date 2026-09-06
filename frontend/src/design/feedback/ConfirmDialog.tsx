import { useEffect, useId, useRef, type HTMLAttributes, type ReactElement, type ReactNode } from 'react'
import { Button } from '../core/Button'

export interface ConfirmDialogProps extends HTMLAttributes<HTMLDivElement> {
  /** Câu hỏi có đối tượng cụ thể: "Chốt kỳ 08/2026 toà A?" */
  title: string
  /** Hậu quả kèm con số: "không sửa được chỉ số của 24 phòng". Bắt buộc. */
  consequence: ReactNode
  /** Nhãn nút xác nhận = động từ của việc đó, không phải "OK". */
  confirmLabel: string
  cancelLabel?: string
  onConfirm?: () => void
  onCancel?: () => void
}

/** Hộp thoại xác nhận — chỉ dùng cho thao tác không đảo ngược được, và phải nêu hậu quả bằng con số. */
export function ConfirmDialog({ title, consequence, confirmLabel, cancelLabel = 'Để sau', onConfirm, onCancel, style, tabIndex = -1, role = 'dialog', 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, 'aria-modal': ariaModal = true, ...rest }: ConfirmDialogProps): ReactElement {
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCancelRef = useRef(onCancel)
  const titleId = useId()
  onCancelRef.current = onCancel

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const activeDialog = dialog

    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const newlyInertElements: HTMLElement[] = []
    let branch: HTMLElement = activeDialog

    while (branch.parentElement) {
      const parent = branch.parentElement
      for (const sibling of parent.children) {
        if (sibling === branch || !(sibling instanceof HTMLElement) || sibling.hasAttribute('inert')) continue
        sibling.setAttribute('inert', '')
        newlyInertElements.push(sibling)
      }
      if (parent === document.body) break
      branch = parent
    }

    const focusableElements = () => [...activeDialog.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )].filter((element) => {
      if (element.tabIndex < 0 || (element instanceof HTMLInputElement && element.type === 'hidden')) return false
      for (let ancestor: HTMLElement | null = element; ancestor; ancestor = ancestor.parentElement) {
        if (ancestor.hidden || ancestor.hasAttribute('inert') || ancestor.getAttribute('aria-hidden') === 'true') return false
        const computedStyle = window.getComputedStyle(ancestor)
        if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') return false
      }
      return true
    })

    function focusElement(element?: HTMLElement) {
      element?.focus()
      if (document.activeElement !== element) activeDialog.focus()
    }

    function focusFirstElement() {
      focusElement(focusableElements()[0])
    }

    function focusLastElement() {
      const focusable = focusableElements()
      focusElement(focusable[focusable.length - 1])
    }

    focusFirstElement()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancelRef.current?.()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = focusableElements()
      if (focusable.length === 0) {
        event.preventDefault()
        focusFirstElement()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && (document.activeElement === first || !activeDialog.contains(document.activeElement))) {
        event.preventDefault()
        focusLastElement()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        focusFirstElement()
      }
    }

    function handleFocusIn(event: FocusEvent) {
      if (!activeDialog.contains(event.target as Node)) focusFirstElement()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('focusin', handleFocusIn)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('focusin', handleFocusIn)
      for (const element of newlyInertElements) element.removeAttribute('inert')
      if (opener?.isConnected) opener.focus()
    }
  }, [])

  return (
    <div
      {...rest}
      ref={dialogRef}
      role={role}
      aria-modal={ariaModal}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy ?? (ariaLabel !== undefined ? undefined : titleId)}
      tabIndex={tabIndex}
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
    >
      <div id={titleId} style={{ fontSize: 15.5, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--ma-text-secondary)", marginTop: 7, lineHeight: 1.55 }}>{consequence}</div>
      <div style={{ display: "flex", gap: 9, marginTop: 14 }}>
        <Button variant="primary" size="sm" onClick={onConfirm} style={{ minHeight: 44 }}>{confirmLabel}</Button>
        <Button variant="secondary" size="sm" onClick={onCancel} style={{ minHeight: 44 }}>{cancelLabel}</Button>
      </div>
    </div>
  );
}
