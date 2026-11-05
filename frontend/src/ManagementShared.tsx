import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { fetchToaNha, type ThongTinToaNha } from './api'
import { Button } from './design/core/Button'

export const fieldStyle: CSSProperties = { minHeight: 44, width: '100%', minWidth: 0, border: '1px solid var(--ma-border-strong)', borderRadius: 'var(--ma-radius)', background: 'var(--ma-bg-card)', color: 'var(--ma-text-primary)', padding: '10px 14px', font: 'inherit', boxShadow: 'var(--ma-shadow-sm)' }
export const gridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,230px),1fr))', gap: 14 }
export const panelStyle: CSSProperties = { display: 'grid', gap: 16, padding: 22, border: '1px solid var(--ma-border-default)', borderRadius: 'var(--ma-radius-md)', boxShadow: 'var(--ma-shadow-sm)', background: 'var(--ma-bg-card)', minWidth: 0, overflowWrap: 'anywhere' }
export const rowStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }
export function Field({ title, children }: { title: string; children: ReactNode }) { return <label style={{ display: 'grid', gap: 6, minWidth: 0 }}>{title}{children}</label> }
export function Feedback({ error, success }: { error?: string | null; success?: string | null }) { return <>{error ? <p role="alert" style={{ color: 'var(--ma-urgent)' }}>{error}</p> : null}{success ? <p role="status" style={{ color: 'var(--ma-done-text)' }}>{success}</p> : null}</> }
export function useAction() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  async function run(action: () => Promise<unknown>, message = 'Đã lưu thay đổi.') {
    setBusy(true); setError(null); setSuccess(null)
    try { await action(); setSuccess(message); return true } catch (e) { setError(e instanceof Error ? e.message : 'Thao tác thất bại.'); return false } finally { setBusy(false) }
  }
  return { busy, error, success, run, setError }
}
export function useBuildings(token: string) {
  const [buildings, setBuildings] = useState<ThongTinToaNha[]>([])
  const [buildingId, setBuildingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { if (!token) return; let active = true; fetchToaNha(token).then((rows) => { if (active) { setBuildings(rows); setBuildingId((id) => id ?? rows[0]?.id ?? null) } }).catch((e: Error) => { if (active) setError(e.message) }); return () => { active = false } }, [token])
  return { buildings, buildingId, setBuildingId, error }
}
export function BuildingSelect({ buildings, value, onChange }: { buildings: ThongTinToaNha[]; value: number | null; onChange: (id: number | null) => void }) { return <Field title="Toà nhà"><select style={fieldStyle} value={value ?? ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}><option value="">Chọn toà nhà</option>{buildings.map((b) => <option key={b.id} value={b.id}>{b.ten}</option>)}</select></Field> }
export function SaveButton({ busy, children = 'Lưu thay đổi' }: { busy: boolean; children?: ReactNode }) { return <Button type="submit" blocked={busy} blockedReason={busy ? 'Đang lưu, vui lòng chờ.' : undefined}>{children}</Button> }
export function today() { return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }) }
