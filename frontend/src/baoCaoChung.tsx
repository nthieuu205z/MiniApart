import type * as React from 'react'
import { EmptyState } from './design/feedback/EmptyState'
import { DauTrang } from './design/layout/DauTrang'

/** Khung chung các màn báo cáo: đầu trang V3 (DauTrang), các thẻ xếp lưới 12 cột. */
export function DauBaoCao({ tieuDe, moTa, action }: { id?: string; tieuDe: string; moTa: string; action: React.ReactNode }): React.ReactElement {
  return <DauTrang tieuDe={tieuDe} phu={moTa} hanhDong={action} />
}

/** Thẻ bộ lọc: các `Field` xếp lưới tự co, 1 cột ở điện thoại. */
export function ThanhLoc({ nhan, children }: { nhan: string; children: React.ReactNode }): React.ReactElement {
  return (
    <section aria-label={nhan} className="card" style={{ padding: 16, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))' }}>
      {children}
    </section>
  )
}

/** Màn đang tải: EmptyState + chữ ẩn để đọc màn hình đọc được tên màn. */
export function BaoCaoDangTai({ testid, variant, nhan }: { testid: string; variant: string; nhan: string }): React.ReactElement {
  return (
    <div data-testid={testid} data-layout-variant={variant} aria-busy="true" aria-live="polite">
      <span className="sr-only">{nhan}</span>
      <EmptyState kind="loading" title={nhan} />
    </div>
  )
}

export function BaoCaoLoi({ testid, variant, loi }: { testid: string; variant: string; loi: string }): React.ReactElement {
  return (
    <div data-testid={testid} data-layout-variant={variant} role="alert">
      <EmptyState kind="error" title={loi} />
    </div>
  )
}

/** "2026-11-21T23:06:44.092962779+07:00" → bỏ phần lẻ giây. */
export const gioTinh = (iso: string): string => iso.replace(/\.\d+/, '')
