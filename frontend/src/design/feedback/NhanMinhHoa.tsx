import type * as React from 'react'

/** Nhãn trung thực cho phần còn thiếu backend. */
export function NhanMinhHoa({ children = 'minh hoạ' }: { children?: React.ReactNode }): React.ReactElement {
  return <span className="ma-nhanmh">{children}</span>
}
