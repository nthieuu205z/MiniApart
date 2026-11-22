import { useEffect, useMemo, useRef, useState } from 'react'
import { ApiError, fetchHoaDonQuanLy, fetchKyThanhToan, type ThongTinHoaDonQuanLy, type ThongTinKyThanhToan } from './api'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { StatusTag } from './design/core/StatusTag'
import { EmptyState } from './design/feedback/EmptyState'
import { useDialogTrap } from './design/feedback/useDialogTrap'
import { Button } from './design/core/Button'
import { Icon } from './design/core/Icon'
import { Card } from './design/layout/Card'
import { DataTable, type DataTableChip, type DataTableColumn } from './design/table/DataTable'
import { bulkInvoice, type BulkResult } from './financeApi'
import { BuildingSelect, useBuildings } from './ManagementShared'
import { ngoaiProvider, useToaDangChon } from './toaDangChon'

type Props = { token: string; mobile?: boolean; vaiTro?: string }

export type BoLocHoaDonQuanLy = {
  toaNhaId: number | null
  trangThai: string
}

export function mapTrangThaiHoaDon(trangThai: string): { nhan: string; tone: 'neutral' | 'waiting' | 'done' | 'urgent' | 'strong' } {
  switch (trangThai) {
    case 'NHAP':
      return { nhan: 'Bản nháp', tone: 'neutral' }
    case 'DA_PHAT_HANH':
      return { nhan: 'Đã phát hành', tone: 'waiting' }
    case 'DA_THU_MOT_PHAN':
      return { nhan: 'Thu một phần', tone: 'waiting' }
    case 'DA_THANH_TOAN':
      return { nhan: 'Đã thanh toán', tone: 'done' }
    case 'QUA_HAN':
      return { nhan: 'Quá hạn', tone: 'urgent' }
    case 'DA_HUY':
      return { nhan: 'Đã huỷ', tone: 'neutral' }
    default:
      return { nhan: trangThai, tone: 'neutral' }
  }
}

/** FR-INV-02 keeps the manager invoice worklist query shareable from the operational dashboard. */
export function layBoLocHoaDonQuanLyTuUrl(url: string | URL): BoLocHoaDonQuanLy {
  const searchParams = new URL(url, 'http://miniapart.local').searchParams
  return {
    toaNhaId: soNguyenDuong(searchParams.get('toaNhaId')),
    trangThai: searchParams.get('trangThai') || 'NO_QUA_HAN',
  }
}

export default function HoaDonQuanLy({ token, mobile = false }: Props): React.ReactElement {
  const chung = useToaDangChon()
  const { buildings, buildingId, setBuildingId } = useBuildings(token)
  const [boLoc, setBoLoc] = useState<BoLocHoaDonQuanLy>(() => (
    typeof window === 'undefined' ? { toaNhaId: null, trangThai: 'NO_QUA_HAN' } : layBoLocHoaDonQuanLyTuUrl(window.location.href)
  ))
  const [hoaDons, setHoaDons] = useState<ThongTinHoaDonQuanLy[]>([])
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)
  const [loiKy, setLoiKy] = useState<string | null>(null)
  const [ky, setKy] = useState<ThongTinKyThanhToan[]>([])
  const [kyId, setKyId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<BulkResult | null>(null)
  const [xacNhanPhatHanh, setXacNhanPhatHanh] = useState(false)
  const [reload, setReload] = useState(0)
  const variant = mobile ? 'mobile' : 'desktop'

  // Toà do khung chọn (Chủ đang "Tất cả toà" thì chọn tại chỗ); ngoài khung (test) lấy toà trên URL, thiếu thì toà đầu.
  useEffect(() => {
    if (ngoaiProvider(chung)) setBoLoc((current) => ({ ...current, toaNhaId: current.toaNhaId ?? buildingId }))
    else setBoLoc((current) => (current.toaNhaId === buildingId ? current : { ...current, toaNhaId: buildingId }))
  }, [chung, buildingId])

  useEffect(() => {
    if (boLoc.toaNhaId === null) { setKy([]); setKyId(null); return }
    let active = true
    setKy([]); setKyId(null); setResult(null); setLoiKy(null)
    fetchKyThanhToan(token, boLoc.toaNhaId).then((data) => {
      if (!active) return
      setKy(data); setKyId(null)
    }).catch((cause: unknown) => { if (active) setLoiKy(cause instanceof Error ? cause.message : 'Không thể tải kỳ thanh toán.') })
    return () => { active = false }
  }, [token, boLoc.toaNhaId])

  useEffect(() => {
    if (typeof window === 'undefined' || boLoc.toaNhaId === null) return
    const query = new URLSearchParams({ toaNhaId: String(boLoc.toaNhaId), trangThai: boLoc.trangThai })
    window.history.replaceState({}, '', `/hoa-don?${query.toString()}`)
  }, [boLoc])

  useEffect(() => {
    if (boLoc.toaNhaId === null) {
      setHoaDons([])
      setDangTai(false)
      return undefined
    }
    let mounted = true
    setDangTai(true)
    setLoi(null)
    fetchHoaDonQuanLy(token, boLoc.toaNhaId, boLoc.trangThai)
      .then((data) => { if (mounted) setHoaDons(data) })
      .catch((reason: unknown) => {
        if (mounted) setLoi(reason instanceof ApiError ? reason.message : 'Không thể tải danh sách hoá đơn.')
      })
      .finally(() => { if (mounted) setDangTai(false) })
    return () => { mounted = false }
  }, [boLoc.toaNhaId, boLoc.trangThai, token, reload])

  async function runBulk(action: 'tao-hang-loat' | 'phat-hanh-hang-loat') {
    if (busy || boLoc.toaNhaId === null || kyId === null) return
    setBusy(true); setLoi(null); setResult(null)
    try { setResult(await bulkInvoice(token, boLoc.toaNhaId, kyId, action)); setBoLoc((value) => ({ ...value, trangThai: action === 'tao-hang-loat' ? 'NHAP' : '' })); setReload((value) => value + 1) }
    catch (cause) { setLoi(cause instanceof Error ? cause.message : 'Không thể xử lý hoá đơn hàng loạt.') }
    finally { setBusy(false) }
  }

  const visible = kyId === null ? hoaDons : hoaDons.filter((value) => value.kyId === kyId)

  const tieuDeBoLoc = useMemo(() => {
    if (boLoc.trangThai === 'NO_QUA_HAN') return 'Nợ quá hạn'
    if (!boLoc.trangThai) return 'Tất cả trạng thái'
    return mapTrangThaiHoaDon(boLoc.trangThai).nhan
  }, [boLoc.trangThai])

  const tongConLai = visible.reduce((t, h) => t + Number(h.conLai), 0)
  const kyChon = ky.find((k) => k.id === kyId)
  const cot = useMemo(() => cotHoaDon(boLoc.toaNhaId), [boLoc.toaNhaId])

  return (
    <section data-testid="manager-invoice-screen" data-layout-variant={variant} aria-labelledby="manager-invoice-title" style={{ display: 'grid', gap: 16, minWidth: 0 }}>
      <div className="ph">
        <div className="grow">
          <h1 className="h1" id="manager-invoice-title">Thu tiền</h1>
          <p className="sub" data-invoice-active-filter>Đang lọc: {tieuDeBoLoc} · {visible.length} hoá đơn · còn phải thu {dinhDangTien(tongConLai)} ₫</p>
        </div>
        <div className="ph-acts">
          <BuildingSelect buildings={buildings} value={boLoc.toaNhaId} onChange={(id) => { setBuildingId(id); setBoLoc((current) => ({ ...current, toaNhaId: id })) }} />
        </div>
      </div>

      <Card>
        <div className="row-wrap" style={{ alignItems: 'flex-end', gap: 12 }}>
          <label className="field" style={{ flex: '1 1 180px', maxWidth: 260 }}><span className="label">Kỳ thanh toán</span>
            <select aria-label="Lọc kỳ hoá đơn" className="select" value={kyId ?? ''} onChange={(event) => { setKyId(event.target.value ? Number(event.target.value) : null); setResult(null) }}>
              <option value="">Tất cả kỳ</option>
              {ky.map((value) => <option key={value.id} value={value.id}>{value.thang}/{value.nam} · {value.trangThai}</option>)}
            </select>
          </label>
          <label className="field" style={{ flex: '1 1 180px', maxWidth: 260 }}><span className="label">Trạng thái</span>
            <select aria-label="Lọc trạng thái hoá đơn" className="select" value={boLoc.trangThai} onChange={(event) => setBoLoc((value) => ({ ...value, trangThai: event.target.value }))}>
              <option value="">Tất cả trạng thái</option>
              <option value="NO_QUA_HAN">Nợ quá hạn</option>
              <option value="NHAP">Bản nháp</option>
              <option value="DA_PHAT_HANH">Đã phát hành</option>
              <option value="DA_THU_MOT_PHAN">Đã thu một phần</option>
              <option value="DA_THANH_TOAN">Đã thanh toán</option>
              <option value="QUA_HAN">Quá hạn</option>
              <option value="DA_HUY">Đã huỷ</option>
            </select>
          </label>
          <span className="push" />
          <a className="link-more brand" href="/chu-ky">Phát hành hoá đơn kỳ mới ở Chu kỳ tháng <Icon name="arrow-right" size="sm" /></a>
          <Button variant="secondary" blocked={busy || kyId === null} onClick={() => setXacNhanPhatHanh(true)}>
            Phát hành hoá đơn trong kỳ
          </Button>
          <Button blocked={busy || kyId === null} onClick={() => void runBulk('tao-hang-loat')}>
            <Icon name="plus" />Tạo hoá đơn nháp hàng loạt
          </Button>
        </div>
        {busy ? <p className="t-sm" style={{ margin: '10px 0 0' }}><Icon name="clock" size="sm" /> Hệ thống đang xử lý hoá đơn hàng loạt, vui lòng chờ…</p>
          : kyId === null && boLoc.toaNhaId !== null ? <p className="t-sm" style={{ margin: '10px 0 0' }}><Icon name="info" size="sm" /> Chọn một kỳ thanh toán cụ thể để tạo nháp hoặc phát hành hoá đơn hàng loạt.</p> : null}
      </Card>

      {loiKy ? <p role="status" className="alert alert-danger"><Icon name="alert" />{loiKy}</p> : null}

      {xacNhanPhatHanh && (
        <XacNhanPhatHanhModal
          kyTen={kyChon ? `${kyChon.thang}/${kyChon.nam}` : ''}
          onClose={() => setXacNhanPhatHanh(false)}
          onConfirm={() => {
            setXacNhanPhatHanh(false)
            void runBulk('phat-hanh-hang-loat')
          }}
        />
      )}

      {result ? (
        <div role="status" className="alert alert-success" style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontWeight: 600 }}>
            <Icon name="check-circle" /> Đã xử lý: Tạo mới {result.soHoaDonTaoMoi ?? 0} hoá đơn · Phát hành {result.soHoaDonDaPhatHanh ?? 0} hoá đơn · Đã có sẵn: {result.soHoaDonDaTonTai ?? result.soHoaDonDaOTrangThaiKhac ?? 0}
          </div>
          {result.lyDoBoQua && result.lyDoBoQua.length > 0 && (
            <details>
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                Xem chi tiết {result.lyDoBoQua.length} phòng được bỏ qua
              </summary>
              <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
                {result.lyDoBoQua.map((item, index) => (
                  <li key={`${item.phongId}-${index}`} style={{ marginTop: 3 }}>
                    Phòng #{item.phongId}: {item.moTa}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      ) : null}

      {dangTai ? <EmptyState kind="loading" title="Đang tải danh sách hoá đơn…" />
        : loi ? <div role="alert"><EmptyState kind="error" title={loi} /></div>
          : boLoc.toaNhaId === null ? <EmptyState title="Chọn một toà nhà để xem hoá đơn." />
            : visible.length === 0 ? <EmptyState title="Không có hoá đơn phù hợp bộ lọc." />
              : (
                <Card data-invoice-list={variant}>
                  <DataTable
                    rows={visible}
                    columns={cot}
                    getRowId={(h) => h.hoaDonId}
                    chips={CHIP.filter((c) => visible.some(c.match))}
                    timTheo={(h) => `${h.maHoaDon} ${h.soPhong} ${h.nguoiThue}`}
                    searchLabel="Tìm mã hoá đơn, phòng, người thuê"
                    noun="hoá đơn"
                    pageSize={20}
                    rowProps={(h) => ({ 'data-invoice-row': String(h.hoaDonId) })}
                  />
                </Card>
              )}
    </section>
  )
}

const CHIP: DataTableChip<ThongTinHoaDonQuanLy>[] = ['NHAP', 'DA_PHAT_HANH', 'DA_THU_MOT_PHAN', 'QUA_HAN', 'DA_THANH_TOAN', 'DA_HUY']
  .map((ma) => ({ key: ma, label: mapTrangThaiHoaDon(ma).nhan, match: (h: ThongTinHoaDonQuanLy) => h.trangThai === ma }))

function cotHoaDon(toaNhaId: number | null): DataTableColumn<ThongTinHoaDonQuanLy>[] {
  const duongDan = (h: ThongTinHoaDonQuanLy) => (h.kyId === null || toaNhaId === null ? null : `/hoa-don?toaNhaId=${toaNhaId}&kyId=${h.kyId}&hoaDonId=${h.hoaDonId}`)
  return [
    {
      key: 'ma', label: 'Hoá đơn', sortable: true, sortValue: (h) => h.maHoaDon,
      render: (h) => {
        const href = duongDan(h)
        return <>
          {href ? <a data-invoice-detail-link href={href} className="td-main" style={{ color: 'var(--ma-brand-accent)', textDecoration: 'none' }}>{h.maHoaDon}</a> : <strong className="td-main" data-invoice-without-period>{h.maHoaDon}</strong>}
          {href ? null : <div className="td-sub">Hoá đơn quyết toán không thuộc kỳ thanh toán.</div>}
        </>
      },
    },
    { key: 'phong', label: 'Phòng', sortable: true, sortValue: (h) => h.soPhong, render: (h) => <span className="td-main">{h.soPhong}</span> },
    { key: 'nguoiThue', label: 'Người thuê', the: 'tieu-de', sortable: true, sortValue: (h) => h.nguoiThue, render: (h) => <span title={h.nguoiThue}>{h.nguoiThue}</span> },
    { key: 'han', label: 'Hạn thanh toán', sortable: true, sortValue: (h) => h.hanThanhToan, render: (h) => dinhDangNgayIso(h.hanThanhToan) },
    { key: 'tong', label: 'Tổng', align: 'num', sortable: true, sortValue: (h) => Number(h.tongTien), render: (h) => <>{dinhDangTien(h.tongTien)} ₫</> },
    {
      key: 'conLai', label: 'Còn lại', align: 'num', sortable: true, sortValue: (h) => Number(h.conLai),
      render: (h) => <span className="t-money" style={{ color: Number(h.conLai) > 0 ? 'var(--ma-urgent)' : 'var(--ma-done-text)' }}>{dinhDangTien(h.conLai)} ₫</span>,
    },
    { key: 'trangThai', label: 'Trạng thái', render: (h) => { const t = mapTrangThaiHoaDon(h.trangThai); return <StatusTag tone={t.tone}>{t.nhan}</StatusTag> } },
    {
      key: 'thaoTac', label: 'Thao tác', align: 'num', the: 'hanh-dong',
      render: (h) => { const href = duongDan(h); return href ? <div className="td-acts"><a className="btn btn-ghost btn-sm" href={href}>Chi tiết</a></div> : null },
    },
  ]
}

function soNguyenDuong(value: string | null): number | null {
  if (value === null || !/^[1-9]\d*$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : null
}

function XacNhanPhatHanhModal({
  kyTen,
  onClose,
  onConfirm,
}: {
  kyTen: string
  onClose: () => void
  onConfirm: () => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  useDialogTrap({ open: true, dialogRef, onClose })

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-phat-hanh-title"
        tabIndex={-1}
        style={{
          background: 'var(--ma-bg-card)',
          borderRadius: 'var(--ma-radius-md)',
          border: '1px solid var(--ma-border-default)',
          boxShadow: 'var(--ma-shadow-lg)',
          padding: '24px 28px',
          maxWidth: 480,
          width: '100%',
          display: 'grid',
          gap: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h4 id="confirm-phat-hanh-title" style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
          Xác nhận phát hành hoá đơn kỳ {kyTen}?
        </h4>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ma-text-secondary)', lineHeight: 1.55 }}>
          Toàn bộ hoá đơn dự thảo trong kỳ của toà nhà sẽ được chuyển sang trạng thái <strong>Đã phát hành</strong>. Khách thuê sẽ nhìn thấy hoá đơn và có thể tiến hành thanh toán.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="secondary" onClick={onClose} style={{ minHeight: 40 }}>
            Để sau
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            style={{ minHeight: 40 }}
          >
            Xác nhận phát hành
          </Button>
        </div>
      </div>
    </div>
  )
}
