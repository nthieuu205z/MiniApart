import { useEffect, useRef } from 'react'

export interface UseDialogTrapOptions {
  open?: boolean
  dialogRef: React.RefObject<HTMLElement | null>
  onClose?: () => void
}

/**
 * Hook chuẩn hóa accessibility cho mọi dialog / modal trong hệ thống MiniApart:
 * 1. Focus ban đầu vào phần tử tương tác đầu tiên hoặc hộp thoại
 * 2. Bẫy focus Tab / Shift+Tab tuần hoàn bên trong hộp thoại
 * 3. Phím Escape đóng dialog
 * 4. Khóa cuộn nền (body overflow hidden) và đặt inert cho các nhánh ngoài
 * 5. Trả lại focus cho phần tử kích hoạt (opener) khi đóng
 */
export function useDialogTrap({
  open = true,
  dialogRef,
  onClose,
}: UseDialogTrapOptions): void {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const dialog = dialogRef.current
    if (!dialog) return
    const activeDialog = dialog

    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const prevBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const newlyInertElements: HTMLElement[] = []
    let branch: HTMLElement = activeDialog

    while (branch.parentElement) {
      const parent = branch.parentElement
      for (const sibling of Array.from(parent.children)) {
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
      if (element) {
        element.focus()
      } else {
        activeDialog.focus()
      }
    }

    function focusFirstElement() {
      const first = focusableElements()[0]
      focusElement(first)
    }

    function focusLastElement() {
      const focusable = focusableElements()
      focusElement(focusable[focusable.length - 1])
    }

    // Initial focus
    focusFirstElement()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current?.()
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
      if (!activeDialog.contains(event.target as Node)) {
        focusFirstElement()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('focusin', handleFocusIn)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('focusin', handleFocusIn)
      document.body.style.overflow = prevBodyOverflow
      for (const element of newlyInertElements) {
        element.removeAttribute('inert')
      }
      if (opener && opener.isConnected) {
        opener.focus()
      }
    }
  }, [open, dialogRef])
}

