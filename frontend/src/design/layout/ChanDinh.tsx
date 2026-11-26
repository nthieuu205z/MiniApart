import type * as React from 'react'

/** Chỗ đặt nút chính. < 768 hoặc mật độ "thoang": dính đáy, nút giãn ngang (CSS .ma-chandinh). Desktop: hàng nút căn phải. */
export function ChanDinh({ children }: { children: React.ReactNode }): React.ReactElement {
  return <div className="ma-chandinh">{children}</div>
}
