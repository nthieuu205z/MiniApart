import * as React from 'react'

export interface FieldProps {
  label: React.ReactNode
  /** Lỗi hiện ngay dưới ô; điền thì ô con nhận aria-invalid + aria-describedby. */
  error?: React.ReactNode
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>
}

/** Nhãn luôn hiện (không dùng placeholder làm nhãn) + ô + lỗi dưới ô. */
export function Field({ label, error, children }: FieldProps): React.ReactElement {
  const errId = React.useId()
  const control = error
    ? React.cloneElement(children, { 'aria-invalid': true, 'aria-describedby': errId } as React.HTMLAttributes<HTMLElement>)
    : children
  return (
    <label className="field">
      <span className="label">{label}</span>
      {control}
      {error ? (
        <span className="error-text" id={errId} role="alert">
          {error}
        </span>
      ) : null}
    </label>
  )
}

export function Input({ className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>): React.ReactElement {
  return <input className={['input', className].filter(Boolean).join(' ')} {...rest} />
}

export function Select({ className, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>): React.ReactElement {
  return <select className={['select', className].filter(Boolean).join(' ')} {...rest} />
}
