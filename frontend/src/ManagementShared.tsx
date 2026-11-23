import { useEffect, useState, type CSSProperties, type HTMLAttributes, type ReactElement, type ReactNode } from 'react'
import { fetchToaNha, type ThongTinToaNha } from './api'
import { Button } from './design/core/Button'
import { Icon } from './design/core/Icon'
import { Field as DesignField } from './design/forms/Field'
import { ngoaiProvider, useMotToa, useToaDangChon } from './toaDangChon'

export const fieldStyle: CSSProperties = { minHeight: 44, width: '100%', minWidth: 0, border: '1px solid var(--ma-border-strong)', borderRadius: 'var(--ma-radius)', background: 'var(--ma-bg-card)', color: 'var(--ma-text-primary)', padding: '10px 14px', font: 'var(--ma-text-body)' } // giống .input (inline vì 83 chỗ dùng style=)
export const gridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,230px),1fr))', gap: 14, minWidth: 0, maxWidth: '100%' }
export const panelStyle: CSSProperties = { display: 'grid', gap: 16, padding: 'clamp(16px, 3.5vw, 24px)', borderRadius: 'var(--ma-radius-xl)', background: 'var(--ma-bg-card)', minWidth: 0, overflowWrap: 'anywhere' }
export const rowStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }
export function Field({ title, children }: { title: string; children: ReactNode }) { return <DesignField label={title}>{children as ReactElement<HTMLAttributes<HTMLElement>>}</DesignField> }
export function Feedback({ error, success }: { error?: string | null; success?: string | null }) {
  return (
    <>
      {error ? <p role="alert" className="alert alert-danger"><Icon name="alert" />{error}</p> : null}
      {success ? <p role="status" className="alert alert-success"><Icon name="check-circle" />{success}</p> : null}
    </>
  )
}
export function useAction() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  async function run(action: () => Promise<unknown>, message = 'Đã lưu thay đổi.') {
    setBusy(true); setError(null); setSuccess(null)
    try { await action(); setSuccess(message); return true } catch (e) { setError(e instanceof Error ? e.message : 'Thao tác thất bại.'); return false } finally { setBusy(false) }
  }
  return { busy, error, success, run, setError, setSuccess, setBusy }
}
// Toà lấy từ bối cảnh dùng chung của khung (chọn ở sidebar, nhớ qua lần tải lại). Ngoài khung (test màn riêng lẻ) thì tự tải như cũ.
export function useBuildings(token: string, tuChonDau = false) {
  const chung = useToaDangChon()
  const rieng = ngoaiProvider(chung)
  const [buildings, setBuildings] = useState<ThongTinToaNha[]>([])
  const [buildingId, setBuildingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Màn cần đúng một toà: Chủ đang ở "Tất cả toà" thì chọn toà đầu (hiện ở ô toà của khung) thay vì để trang chờ chọn.
  useEffect(() => { if (tuChonDau && !rieng && chung.toaNhaId === null && !chung.coDinh && chung.danhSach.length > 0) chung.chon(chung.danhSach[0].id) }, [tuChonDau, rieng, chung])
  useEffect(() => { if (!token || !rieng) return; let active = true; fetchToaNha(token).then((rows) => { if (active) { setBuildings(rows); setBuildingId((id) => id ?? rows[0]?.id ?? null) } }).catch((e: Error) => { if (active) setError(e.message) }); return () => { active = false } }, [token, rieng])
  if (rieng) return { buildings, buildingId, setBuildingId, error }
  return { buildings: chung.danhSach, buildingId: chung.toaNhaId, setBuildingId: chung.chon, error: chung.loi }
}
// Ẩn khi khung đã có ô chọn toà (Quản lý một toà; Chủ đã chọn một toà). Chủ đang "Tất cả toà" mà màn cần một toà → hiện ô chọn tại chỗ.
export function BuildingSelect({ buildings, value, onChange }: { buildings: ThongTinToaNha[]; value: number | null; onChange: (id: number | null) => void }) {
  const chung = useToaDangChon()
  const mot = useMotToa()
  if (!ngoaiProvider(chung) && !mot.canChonTaiCho) return null
  return <Field title="Toà nhà"><select style={fieldStyle} value={value ?? ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}><option value="">Chọn toà nhà</option>{buildings.map((b) => <option key={b.id} value={b.id}>{b.ten}</option>)}</select></Field>
}
export function SaveButton({ busy, children = 'Lưu thay đổi' }: { busy: boolean; children?: ReactNode }) { return <Button variant="primary" type="submit" blocked={busy} blockedReason={busy ? 'Đang lưu, vui lòng chờ.' : undefined}>{children}</Button> }
export function today() { return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }) }
