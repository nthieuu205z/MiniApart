import { useEffect, useState } from 'react'
import { ApiError, fetchBangViecVanHanh, fetchToaNha, type ThongTinBangViecVanHanh as BangViecData, type ThongTinToaNha } from './api'
import { EmptyState } from './design/feedback/EmptyState'
import { Icon, type IconName } from './design/core/Icon'
import { StatusTag } from './design/core/StatusTag'
import { Card } from './design/layout/Card'
import { ScreenNotice } from './design/layout/Screen'

type Props = { token: string; mobile?: boolean; toaNhaId?: number | null }

/** FR-NTF-01 shows the server-scoped operational workboard; status text carries urgency beyond color. */
export function BangViecVanHanh({ token, mobile = false, toaNhaId: propToaNhaId }: Props): React.ReactElement {
  const isEmbedded = propToaNhaId !== undefined
  const [toaNha, setToaNha] = useState<ThongTinToaNha[]>([])
  const [toaNhaId, setToaNhaId] = useState<number | null>(() => (isEmbedded ? (propToaNhaId ?? null) : docToaNhaIdTuUrl()))
  const [bangViec, setBangViec] = useState<BangViecData | null>(null)
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    fetchToaNha(token)
      .then((items) => {
        if (!mounted) return
        setToaNha(items)
        if (!isEmbedded) {
          setToaNhaId((current) => current ?? items[0]?.id ?? null)
        } else if (propToaNhaId === null) {
          setToaNhaId((current) => current ?? items[0]?.id ?? null)
        }
      })
      .catch((reason: unknown) => {
        if (mounted) setLoi(reason instanceof ApiError ? reason.message : 'Không thể tải danh sách toà nhà.')
      })
    return () => { mounted = false }
  }, [token, isEmbedded, propToaNhaId])

  useEffect(() => {
    if (isEmbedded) {
      if (propToaNhaId !== null && propToaNhaId !== undefined) {
        setToaNhaId(propToaNhaId)
      } else if (toaNha.length > 0 && (toaNhaId === null || !toaNha.some((t) => t.id === toaNhaId))) {
        setToaNhaId(toaNha[0].id)
      }
    }
  }, [isEmbedded, propToaNhaId, toaNha, toaNhaId])

  useEffect(() => {
    if (toaNhaId === null) {
      setDangTai(false)
      return undefined
    }
    if (!isEmbedded) {
      const query = new URLSearchParams(window.location.search)
      query.set('toaNhaId', String(toaNhaId))
      window.history.replaceState({}, '', `${window.location.pathname}?${query.toString()}`)
    }

    let mounted = true
    setDangTai(true)
    setLoi(null)
    fetchBangViecVanHanh(token, toaNhaId)
      .then((data) => { if (mounted) setBangViec(data) })
      .catch((reason: unknown) => {
        if (mounted) setLoi(reason instanceof ApiError ? reason.message : 'Không thể tải bảng việc vận hành.')
      })
      .finally(() => { if (mounted) setDangTai(false) })
    return () => { mounted = false }
  }, [token, toaNhaId, isEmbedded])

  const nhom = bangViec?.nhomViec ?? []
  const canXuLy = nhom.filter((g) => g.trangThai !== 'DA_XONG' && g.trangThai !== 'CHUA_SAN_SANG').length
  const daXong = nhom.filter((g) => g.trangThai === 'DA_XONG').length

  return (
    <Card
      data-testid="operational-dashboard-screen"
      data-layout-variant={mobile ? 'mobile' : 'desktop'}
      aria-labelledby="operational-dashboard-title"
      style={{ minWidth: 0 }}
    >
      <style>{CSS_VIEC}</style>
      <div className="card-head">
        <h2 className="h2" id="operational-dashboard-title">Việc của toà hôm nay</h2>
        {bangViec ? <span className="t-meta">{canXuLy} việc cần xử lý · {daXong} đã xong</span> : null}
      </div>

      {toaNha.length > 0 && (!isEmbedded || propToaNhaId === null) ? (
        <label className="field" style={{ maxWidth: 420, marginBottom: 12 }}>
          <span className="label">Toà nhà</span>
          <select className="select" value={toaNhaId ?? ''} onChange={(event) => setToaNhaId(Number(event.target.value))}>
            {toaNha.map((item) => <option key={item.id} value={item.id}>{item.ten}</option>)}
          </select>
        </label>
      ) : null}

      {dangTai ? <p aria-live="polite">Đang tải bảng việc vận hành…</p>
        : loi ? <div role="alert"><ScreenNotice tone="urgent">{loi}</ScreenNotice></div>
          : !bangViec ? <EmptyState title="Chưa có toà nhà được phân quyền." body="Bảng việc chỉ hiển thị trong phạm vi được máy chủ cấp quyền." />
            : <div aria-label="Các nhóm việc vận hành">
              {nhom.map((group) => <NhomViec key={group.ma} group={group} toaNhaId={bangViec.toaNhaId} />)}
            </div>}
    </Card>
  )
}

const ICON_THEO_MA: Record<string, IconName> = { NO_QUA_HAN: 'receipt', HOP_DONG_SAP_HET_HAN: 'contract', SU_CO_TON_DONG: 'wrench', THIEU_CHI_SO: 'meter' }
const NHAN_LIEN_KET: Record<string, string> = { NO_QUA_HAN: 'Mở danh sách', HOP_DONG_SAP_HET_HAN: 'Gia hạn', THIEU_CHI_SO: 'Ghi chỉ số', SU_CO_TON_DONG: 'Mở sự cố' }

function NhomViec({ group, toaNhaId }: { group: BangViecData['nhomViec'][number]; toaNhaId: number }): React.ReactElement {
  const daXong = group.trangThai === 'DA_XONG'
  const chuaSanSang = group.trangThai === 'CHUA_SAN_SANG'
  const khan = group.khanCap && !daXong && !chuaSanSang
  const lienKet = chuaSanSang || daXong
    ? null
    : group.ma === 'NO_QUA_HAN'
      ? `/hoa-don?toaNhaId=${toaNhaId}&trangThai=NO_QUA_HAN`
      : group.lienKet
  const tag = chuaSanSang ? <StatusTag tone="neutral">{group.tenTrangThai}</StatusTag>
    : daXong ? <StatusTag tone="done">Đã xong</StatusTag>
      : khan ? <StatusTag tone="urgent">Khẩn</StatusTag>
        : <StatusTag tone="waiting">Cần xử lý</StatusTag>
  return (
    <div data-dashboard-group={group.ma} className={`task${khan ? ' urgent' : ''}${daXong || chuaSanSang ? ' done' : ''}`} aria-label={`${group.tieuDe}: ${group.tenTrangThai}`}>
      <span className="tile"><Icon name={ICON_THEO_MA[group.ma] ?? 'shield'} /></span>
      <div>
        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
          <h3 className="h3" style={{ color: 'inherit' }}>{group.tieuDe}</h3>
          {tag}
        </div>
      </div>
      <span className="count" aria-label={group.soLuong === null ? 'Chưa có nguồn dữ liệu' : `Số lượng ${group.soLuong}`}>{group.soLuong ?? '—'}</span>
      {lienKet ? <a data-dashboard-link className="btn btn-secondary btn-sm" href={lienKet}>{NHAN_LIEN_KET[group.ma] ?? 'Mở danh sách'}</a> : <span />}
    </div>
  )
}

function docToaNhaIdTuUrl(): number | null {
  const value = new URLSearchParams(window.location.search).get('toaNhaId')
  if (!value || !/^\d+$/.test(value)) return null
  return Number(value)
}

const CSS_VIEC = `
.task { display: grid; grid-template-columns: 44px minmax(0, 1fr) auto auto; align-items: center; gap: 16px; padding: 14px 12px; border-radius: 16px; }
.task + .task { border-top: 1px solid var(--ma-line-100); }
.task:hover { background: var(--ma-paper-1); }
.task .tile { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; background: var(--ma-bg-sunken); color: var(--ma-text-secondary); }
.task.urgent .tile { background: var(--ma-urgent-bg); color: var(--ma-urgent); }
.task .count { font: 600 28px/1 var(--ma-font-ui); letter-spacing: -0.02em; min-width: 48px; text-align: right; }
.task.done { color: var(--ma-text-secondary); }
.task.done .count { font-weight: 500; }
@media (max-width: 767px) { .task { grid-template-columns: 44px minmax(0, 1fr) auto; } .task > :last-child { grid-column: 2 / -1; justify-self: start; } .task > span:last-child:empty { display: none; } }
`
