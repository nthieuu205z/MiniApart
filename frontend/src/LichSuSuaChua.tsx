import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  ApiError,
  fetchChiTietSuaChua,
  fetchLichSuSuaChua,
  fetchPhong,
  fetchToaNha,
  type BoLocLichSuSuaChua,
  type ThongTinLichSuSuaChua,
  type ThongTinYeuCauSuaChua,
  type ThongTinPhong,
  type ThongTinToaNha,
} from './api'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { EmptyState } from './design/feedback/EmptyState'
import { StatusTag } from './design/core/StatusTag'
import { Field } from './design/forms/Field'
import { Card } from './design/layout/Card'
import { Feedback } from './ManagementShared'

type Props = { token: string; mobile?: boolean }

type BoLocTrang = {
  toaNhaId: string
  phongId: string
  hangMuc: string
  hienThiDaHuy: boolean
  boLocVanHanh: '' | 'TON_DONG_QUA_48_GIO'
}

const BO_LOC_TRONG: BoLocTrang = { toaNhaId: '', phongId: '', hangMuc: '', hienThiDaHuy: false, boLocVanHanh: '' }

/** FR-MNT-08: owner and manager operational repair lookup, separate from Slice 09 reporting. */
export function LichSuSuaChua({ token, mobile = false }: Props): React.ReactElement {
  const [boLoc, setBoLoc] = useState<BoLocTrang>(() => docBoLocTuUrl())
  const [toaNha, setToaNha] = useState<ThongTinToaNha[]>([])
  const [phong, setPhong] = useState<ThongTinPhong[]>([])
  const [ketQua, setKetQua] = useState<ThongTinLichSuSuaChua | null>(null)
  const [chiTiet, setChiTiet] = useState<ThongTinYeuCauSuaChua | null>(null)
  const [dangTai, setDangTai] = useState(false)
  const [dangTaiChiTiet, setDangTaiChiTiet] = useState(false)
  const [loi, setLoi] = useState<string | null>(null)
  const [loiChiTiet, setLoiChiTiet] = useState<string | null>(null)

  const coBoLoc = Boolean(boLoc.toaNhaId || boLoc.phongId || boLoc.hangMuc.trim() || boLoc.hienThiDaHuy || boLoc.boLocVanHanh)
  const boLocApi = useMemo(() => taoBoLocApi(boLoc), [boLoc])
  const yeuCauId = docYeuCauIdTuUrl()

  useEffect(() => {
    let mounted = true
    fetchToaNha(token)
      .then((data) => { if (mounted) setToaNha(data) })
      .catch(() => { if (mounted) setToaNha([]) })
    return () => { mounted = false }
  }, [token])

  useEffect(() => {
    if (!boLoc.toaNhaId) {
      setPhong([])
      return undefined
    }
    let mounted = true
    fetchPhong(token, Number(boLoc.toaNhaId))
      .then((data) => { if (mounted) setPhong(data) })
      .catch(() => { if (mounted) setPhong([]) })
    return () => { mounted = false }
  }, [boLoc.toaNhaId, token])

  useEffect(() => {
    dongBoBoLocVaoUrl(boLoc)
    if (!coBoLoc) {
      setKetQua(null)
      setLoi(null)
      setDangTai(false)
      return undefined
    }
    let mounted = true
    setDangTai(true)
    setLoi(null)
    fetchLichSuSuaChua(token, boLocApi)
      .then((data) => { if (mounted) setKetQua(data) })
      .catch((reason: unknown) => {
        if (mounted) setLoi(reason instanceof ApiError ? reason.message : 'Không thể tải lịch sử sửa chữa.')
      })
      .finally(() => { if (mounted) setDangTai(false) })
    return () => { mounted = false }
  }, [boLoc, boLocApi, coBoLoc, token])

  useEffect(() => {
    if (yeuCauId === undefined) {
      setChiTiet(null)
      setLoiChiTiet(null)
      setDangTaiChiTiet(false)
      return undefined
    }

    let mounted = true
    setDangTaiChiTiet(true)
    setLoiChiTiet(null)
    fetchChiTietSuaChua(token, yeuCauId)
      .then((data) => { if (mounted) setChiTiet(data) })
      .catch((reason: unknown) => {
        if (mounted) {
          setChiTiet(null)
          setLoiChiTiet(reason instanceof ApiError ? reason.message : 'Không thể tải chi tiết yêu cầu sửa chữa.')
        }
      })
      .finally(() => { if (mounted) setDangTaiChiTiet(false) })
    return () => { mounted = false }
  }, [token, yeuCauId])

  function capNhatBoLoc(thayDoi: Partial<BoLocTrang>) {
    setBoLoc((hienTai) => ({ ...hienTai, ...thayDoi }))
  }

  return (
    <Card data-testid="repair-history-screen" data-layout-variant={mobile ? 'mobile' : 'desktop'} aria-labelledby="repair-history-title">
      <div className="stack">
        <div>
          <h2 className="h2" id="repair-history-title">Lịch sử sửa chữa</h2>
          <p className="t-sm" style={{ color: 'var(--ma-text-secondary)', marginTop: 4 }}>Tra cứu theo toà, phòng hoặc hạng mục. Không phải báo cáo theo kỳ.</p>
        </div>

        <section aria-label="Bộ lọc lịch sử sửa chữa" style={styleBoLoc}>
          <Field label="Toà nhà">
            <select className="select" name="toaNhaId" value={boLoc.toaNhaId} onChange={(event) => capNhatBoLoc({ toaNhaId: event.target.value, phongId: '' })}>
              <option value="">Tất cả toà được phân quyền</option>
              {toaNha.map((item) => <option key={item.id} value={item.id}>{item.ten}</option>)}
            </select>
          </Field>
          <Field label="Phòng">
            <select className="select" name="phongId" value={boLoc.phongId} disabled={!boLoc.toaNhaId} onChange={(event) => capNhatBoLoc({ phongId: event.target.value })}>
              <option value="">Tất cả phòng</option>
              {phong.map((item) => <option key={item.id} value={item.id ?? ''}>Phòng {item.soPhong}</option>)}
            </select>
          </Field>
          <Field label="Hạng mục">
            <input className="input" name="hangMuc" value={boLoc.hangMuc} onChange={(event) => capNhatBoLoc({ hangMuc: event.target.value })} placeholder="Ví dụ: Điện" />
          </Field>
          <div style={styleCheckboxes}>
            <label className="check" style={styleCheckbox}><input type="checkbox" checked={boLoc.hienThiDaHuy} onChange={(event) => capNhatBoLoc({ hienThiDaHuy: event.target.checked })} /> Hiện yêu cầu đã huỷ</label>
            <label className="check" style={styleCheckbox}>
              <input
                data-repair-filter-over-48-hours
                type="checkbox"
                checked={boLoc.boLocVanHanh === 'TON_DONG_QUA_48_GIO'}
                onChange={(event) => capNhatBoLoc({ boLocVanHanh: event.target.checked ? 'TON_DONG_QUA_48_GIO' : '' })}
              />
              Chỉ hiện tồn đọng quá 48 giờ
            </label>
          </div>
        </section>

        {boLoc.boLocVanHanh === 'TON_DONG_QUA_48_GIO' ? (
          <p data-active-repair-filter className="row-wrap"><StatusTag tone="waiting">Đang lọc: Tồn đọng quá 48 giờ</StatusTag></p>
        ) : null}

        {yeuCauId !== undefined
          ? dangTaiChiTiet ? <EmptyState kind="loading" title="Đang tải chi tiết yêu cầu sửa chữa" />
            : loiChiTiet ? <Feedback error={loiChiTiet} />
              : chiTiet ? <ChiTietSuaChua yeuCau={chiTiet} mobile={mobile} /> : null
          : !coBoLoc ? <EmptyState data-repair-history-first-empty title="Chọn ít nhất một bộ lọc để tra cứu lịch sử sửa chữa." body="Kết quả sẽ chỉ hiển thị trong phạm vi toà nhà bạn được phân quyền." />
          : dangTai ? <EmptyState kind="loading" title="Đang tải lịch sử sửa chữa" />
            : loi ? <EmptyState kind="error" title={loi} />
                : ketQua?.yeuCau.length === 0 ? <EmptyState kind="filtered" data-repair-history-filter-empty title="Không có yêu cầu sửa chữa phù hợp bộ lọc." body="Hãy đổi toà, phòng hoặc hạng mục để tra cứu lại." />
                  : ketQua ? <KetQuaLichSu ketQua={ketQua} mobile={mobile} /> : null}
      </div>
    </Card>
  )
}

function KetQuaLichSu({ ketQua, mobile }: { ketQua: ThongTinLichSuSuaChua; mobile: boolean }) {
  return <section className="stack">
    <div className="row-wrap card-sunken" style={{ gap: 24 }} aria-label="Tổng chi phí sửa chữa">
      <strong>Chủ nhà chịu: {dinhDangTien(ketQua.tongChiPhiChuNha)} ₫</strong>
      <strong>Người thuê chịu: {dinhDangTien(ketQua.tongChiPhiNguoiThue)} ₫</strong>
    </div>
    <div>
      {ketQua.yeuCau.map((item) => <article key={item.id} data-repair-history-item={item.id} style={mobile ? styleDongMobile : styleDong}>
        <div style={styleDongChinh}>
          <strong>Phòng {item.soPhong} · {item.hangMuc}</strong>
          <span className="t-sm" style={{ color: 'var(--ma-text-secondary)' }}>{item.moTa}</span>
        </div>
        <span className="t-sm">{item.toaNha} · {dinhDangNgayIso(ngayDiaPhuongTuInstant(item.taoLuc))}</span>
        <span><StatusTag tone={item.trangThai === 'DA_DONG' ? 'done' : item.trangThai === 'DA_HUY' ? 'closed' : 'waiting'}>{item.tenTrangThai}</StatusTag></span>
        <span className="t-sm">{item.chiPhi === null ? 'Chưa ghi chi phí' : `${dinhDangTien(item.chiPhi)} ₫`}{item.benChiuChiPhi ? ` · ${item.benChiuChiPhi === 'CHU_NHA' ? 'Chủ nhà chịu' : 'Người thuê chịu'}` : ''}</span>
      </article>)}
    </div>
  </section>
}

function ChiTietSuaChua({ yeuCau, mobile }: { yeuCau: ThongTinYeuCauSuaChua; mobile: boolean }): React.ReactElement {
  return (
    <section data-repair-detail={yeuCau.id} aria-label={`Chi tiết yêu cầu sửa chữa ${yeuCau.id}`} className="card-sunken" style={{ display: 'grid', gap: 10, gridTemplateColumns: mobile ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))' }}>
      <div style={{ display: 'grid', gap: 5 }}>
        <h3 className="h3">Yêu cầu #{yeuCau.id} · {yeuCau.hangMuc}</h3>
        <strong>{yeuCau.moTa}</strong>
      </div>
      <div style={{ display: 'grid', gap: 5 }}>
        <span>{yeuCau.toaNha} · Phòng {yeuCau.soPhong}</span>
        <span>{yeuCau.tenTrangThai}</span>
        <span>{yeuCau.chiPhi === null ? 'Chưa ghi chi phí' : `Chi phí: ${dinhDangTien(String(yeuCau.chiPhi))} ₫`}</span>
      </div>
    </section>
  )
}

function ngayDiaPhuongTuInstant(value: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value))
  const theoTen = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  if (!theoTen.year || !theoTen.month || !theoTen.day) return value.slice(0, 10)
  return `${theoTen.year}-${theoTen.month}-${theoTen.day}`
}

function docBoLocTuUrl(): BoLocTrang {
  if (typeof window === 'undefined') return BO_LOC_TRONG
  const query = new URLSearchParams(window.location.search)
  return {
    toaNhaId: query.get('toaNhaId') ?? '',
    phongId: query.get('phongId') ?? '',
    hangMuc: query.get('hangMuc') ?? '',
    hienThiDaHuy: query.get('hienThiDaHuy') === 'true',
    boLocVanHanh: query.get('boLoc') === 'TON_DONG_QUA_48_GIO' ? 'TON_DONG_QUA_48_GIO' : '',
  }
}

function docYeuCauIdTuUrl(): number | undefined {
  if (typeof window === 'undefined') return undefined
  const value = new URLSearchParams(window.location.search).get('yeuCauId')
  if (value === null || !/^[1-9]\d*$/.test(value)) return undefined
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : undefined
}

function taoBoLocApi(boLoc: BoLocTrang): BoLocLichSuSuaChua {
  return {
    toaNhaId: soNguyen(boLoc.toaNhaId),
    phongId: soNguyen(boLoc.phongId),
    hangMuc: boLoc.hangMuc,
    hienThiDaHuy: boLoc.hienThiDaHuy,
    boLoc: boLoc.boLocVanHanh || undefined,
  }
}

function soNguyen(value: string): number | undefined {
  return /^\d+$/.test(value) ? Number(value) : undefined
}

function dongBoBoLocVaoUrl(boLoc: BoLocTrang) {
  if (typeof window === 'undefined') return
  const query = new URLSearchParams()
  if (boLoc.toaNhaId) query.set('toaNhaId', boLoc.toaNhaId)
  if (boLoc.phongId) query.set('phongId', boLoc.phongId)
  if (boLoc.hangMuc.trim()) query.set('hangMuc', boLoc.hangMuc.trim())
  if (boLoc.hienThiDaHuy) query.set('hienThiDaHuy', 'true')
  if (boLoc.boLocVanHanh) query.set('boLoc', boLoc.boLocVanHanh)
  const yeuCauId = docYeuCauIdTuUrl()
  if (yeuCauId !== undefined) query.set('yeuCauId', String(yeuCauId))
  window.history.replaceState({}, '', `/su-co${query.toString() ? `?${query}` : ''}`)
}

const styleBoLoc: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 12rem), 1fr))', gap: 12, alignItems: 'end' }
const styleCheckboxes: CSSProperties = { display: 'grid', gap: 4, gridColumn: '1 / -1' }
const styleCheckbox: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, minHeight: 'var(--ma-hit-mobile)', font: 'var(--ma-text-body)' }
const styleDong: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(12rem, 1fr) repeat(3, minmax(8rem, auto))', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--ma-line-100)', alignItems: 'center', minWidth: 0 }
const styleDongMobile: CSSProperties = { ...styleDong, gridTemplateColumns: 'minmax(0, 1fr)', gap: 8, overflowWrap: 'anywhere' }
const styleDongChinh: CSSProperties = { display: 'grid', gap: 4, minWidth: 0, overflowWrap: 'anywhere' }
