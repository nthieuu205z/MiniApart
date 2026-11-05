import { useState } from 'react'
import { Button } from './design/core/Button'
import { downloadFinanceFile } from './financeApi'

/** FR-RPT-04 exports the same active filters as the displayed server report. */
export default function ExcelExportButton({ token, report, filters, loading = false }: { token: string; report: string; filters: object; loading?: boolean }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  return <div><Button variant="secondary" blocked={busy || loading} blockedReason="Chờ tải xong dữ liệu báo cáo trước khi xuất." onClick={() => {
    if (busy || loading) return
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(filters)) if (value !== null && value !== undefined && value !== '') query.set(key, String(value))
    setBusy(true); setError(null)
    void downloadFinanceFile(token, `/api/bao-cao/${report}/xuat-excel?${query}`, `bao-cao-${report}.xlsx`)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Không thể xuất báo cáo Excel.')).finally(() => setBusy(false))
  }}>{busy ? 'Đang xuất Excel…' : 'Xuất Excel theo bộ lọc'}</Button>{error ? <p role="alert">{error}</p> : null}</div>
}
