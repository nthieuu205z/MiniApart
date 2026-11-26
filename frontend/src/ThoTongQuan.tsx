import { useEffect, useState, type CSSProperties } from 'react'
import {
  fetchThoTongQuan,
  type ThoTongQuanData,
} from './workerDashboardApi'
import { dinhDangTien } from './design/core/format'
import { Button } from './design/core/Button'
import { Icon } from './design/core/Icon'
import { StatusTag } from './design/core/StatusTag'
import { Card } from './design/layout/Card'
import { FilterChip } from './design/forms/FilterChip'
import { EmptyState } from './design/feedback/EmptyState'

export type ThoTongQuanProps = {
  token: string
  mobile?: boolean
  onNavigate?: (path: string) => void
}

export function ThoTongQuan({ token, mobile = false, onNavigate }: ThoTongQuanProps): React.ReactElement {
  const [data, setData] = useState<ThoTongQuanData | null>(null)
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)

  const [toaNhaId, setToaNhaId] = useState<number | undefined>(undefined)
  const [khoangNgay, setKhoangNgay] = useState<'30' | '60' | '90' | 'ALL'>('90')
  const [lanThuLai, setLanThuLai] = useState(0)

  useEffect(() => {
    let active = true
    setDangTai(true)
    setLoi(null)

    let tuNgay: string | undefined = undefined
    let denNgay: string | undefined = undefined

    if (khoangNgay !== 'ALL') {
      const days = Number(khoangNgay)
      const now = new Date()
      denNgay = now.toISOString().slice(0, 10)
      const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      tuNgay = past.toISOString().slice(0, 10)
    }

    fetchThoTongQuan(token, tuNgay, denNgay, toaNhaId)
      .then((res) => {
        if (active) {
          setData(res)
          setDangTai(false)
        }
      })
      .catch((err: Error) => {
        if (active) {
          setLoi(err.message)
          setDangTai(false)
        }
      })

    return () => {
      active = false
    }
  }, [token, toaNhaId, khoangNgay, lanThuLai])

  function handleNavigate(path: string) {
    if (onNavigate) {
      onNavigate(path)
    } else {
      window.history.pushState({}, '', path)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }

  const bam = (path: string) => ({
    role: 'button' as const,
    tabIndex: 0,
    onClick: () => handleNavigate(path),
    onKeyDown: (e: React.KeyboardEvent) => e.key === 'Enter' && handleNavigate(path),
  })

  if (dangTai && !data) {
    return (
      <div style={styleTrang(mobile)}>
        <EmptyState kind="loading" title="Đang tải tổng quan công việc" />
      </div>
    )
  }

  if (loi) {
    return (
      <div style={styleTrang(mobile)}>
        <Card>
          <EmptyState
            kind="error"
            title="Không thể tải bảng tổng quan"
            body={loi}
            actionLabel="Thử lại"
            actionSize="md"
            onAction={() => setLanThuLai((n) => n + 1)}
          />
        </Card>
      </div>
    )
  }

  if (!data) return <div />

  const { kpi, bieuDoTrangThai, bieuDoXuHuong, viecCanXuLy, baoGiaCanBoSung, danhSachToa } = data

  const tongBieuDoTrangThai = bieuDoTrangThai.reduce((s, x) => s + x.soLuong, 0)
  const maxTrend = Math.max(...bieuDoXuHuong.map((x) => Math.max(x.giaTriDaChot, x.daNhan)), 1)

  return (
    <div style={styleTrang(mobile)} data-testid="worker-overview-screen">
      <div style={{ display: 'grid', gap: 4 }}>
        <h1 style={{ margin: 0, font: '600 24px/1.2 var(--ma-font-ui)', letterSpacing: '-0.01em' }}>Tổng quan công việc của thợ</h1>
        <div style={{ font: 'var(--ma-text-caption)', color: 'var(--ma-text-muted)' }}>
          Tiến độ sửa chữa, giá trị nghiệm thu và công nợ thanh toán của bạn.
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <select
          className="select"
          value={toaNhaId ?? ''}
          onChange={(e) => setToaNhaId(e.target.value ? Number(e.target.value) : undefined)}
          aria-label="Chọn toà nhà"
          style={{ flex: mobile ? '1 1 100%' : '0 1 240px', minWidth: 0 }}
        >
          <option value="">Tất cả toà nhà ({danhSachToa.length})</option>
          {danhSachToa.map((t) => (
            <option key={t.id} value={t.id}>
              {t.ten}
            </option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', maxWidth: '100%' }}>
          {(['30', '60', '90', 'ALL'] as const).map((opt) => (
            <FilterChip key={opt} active={khoangNgay === opt} onClick={() => setKhoangNgay(opt)}>
              {opt === 'ALL' ? 'Tất cả' : `${opt} ngày`}
            </FilterChip>
          ))}
        </div>
      </div>

      <div style={styleBaO}>
        <div {...bam('/viec-cua-toi?nhom=DANG_LAM')} style={styleO} data-testid="kpi-dang-xu-ly">
          <b style={styleSo}>{kpi.dangXuLy}</b>
          <span style={styleNhan}>Đang cần xử lý</span>
          <span style={styleMoTa}>Việc được giao / đang làm</span>
        </div>
        <div {...bam('/viec-cua-toi?nhom=CHO_XAC_NHAN')} style={styleO} data-testid="kpi-cho-xac-nhan">
          <b style={{ ...styleSo, color: 'var(--ma-waiting)' }}>{kpi.choXacNhan}</b>
          <span style={styleNhan}>Chờ xác nhận</span>
          <span style={styleMoTa}>Đã báo xong, chờ đóng</span>
        </div>
        <div style={{ ...styleO, ...(mobile ? { gridColumn: '1 / -1' } : {}) }} data-testid="kpi-ty-le-hoan-thanh">
          <b style={{ ...styleSo, color: kpi.tyLeHoanThanh.coDuLieu ? 'var(--ma-done-text)' : 'var(--ma-text-secondary)' }}>
            {kpi.tyLeHoanThanh.tyLe !== null ? `${kpi.tyLeHoanThanh.tyLe}%` : 'Chưa có'}
          </b>
          <span style={styleNhan}>Tỷ lệ hoàn thành</span>
          <span style={styleMoTa}>{kpi.tyLeHoanThanh.moTa}</span>
        </div>
      </div>

      <div style={styleLuoi(mobile)}>
        <Card title={`Việc cần xử lý ngay (${viecCanXuLy.length})`}>
          {viecCanXuLy.length === 0 ? (
            <p className="t-sm t-2">Không có việc nào đang tồn đọng cần xử lý ngay.</p>
          ) : (
            <div style={{ display: 'grid', gap: 4 }}>
              {viecCanXuLy.slice(0, 5).map((row) => (
                <div key={row.id} {...bam(`/viec-cua-toi?yeuCauId=${row.id}`)} style={styleDong}>
                  <div style={{ minWidth: 0, display: 'grid', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600 }}>{row.maYeuCau}</span>
                      <StatusTag tone={row.mucDo === 'KHAN_CAP' ? 'urgent' : row.mucDo === 'GAP' ? 'waiting' : 'neutral'}>
                        {row.tenMucDo}
                      </StatusTag>
                    </div>
                    <div className="t-sm" style={styleCat} title={`${row.toaNha} · P.${row.soPhong}: ${row.hangMuc}`}>
                      {row.toaNha} · P.{row.soPhong}: {row.hangMuc}
                    </div>
                  </div>
                  <Icon name="chevron-right" />
                </div>
              ))}
            </div>
          )}
          <div className="card-foot">
            <Button className={mobile ? 'btn-block' : undefined} onClick={() => handleNavigate('/viec-cua-toi?nhom=DANG_LAM')}>
              Xem việc đang làm
            </Button>
          </div>
        </Card>

        <Card title="Tiền công" data-testid="tien-cong">
          <div style={{ display: 'grid', gap: 4 }}>
            <div {...bam('/tho/chi-phi')} style={styleDong} data-testid="kpi-gia-tri-da-chot">
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 500 }}>Giá trị đã chốt</div>
                <div className="t-meta">Báo giá có hiệu lực trong tháng</div>
              </div>
              <b style={styleTien}>{dinhDangTien(kpi.giaTriDaChot)} đ</b>
            </div>
            <div {...bam('/tho/chi-phi')} style={styleDong} data-testid="kpi-da-nhan">
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 500 }}>Tiền thực nhận</div>
                <div className="t-meta">Đã xác nhận thanh toán</div>
              </div>
              <b style={{ ...styleTien, color: 'var(--ma-done-text)' }}>{dinhDangTien(kpi.daNhan)} đ</b>
            </div>
            <div {...bam('/tho/chi-phi')} style={styleDong} data-testid="kpi-con-phai-tra">
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 500 }}>Còn phải trả</div>
                <div className="t-meta">Còn nợ đủ điều kiện thanh toán</div>
              </div>
              <b style={{ ...styleTien, color: kpi.conPhaiTra > 0 ? 'var(--ma-urgent)' : 'var(--ma-text-primary)' }}>{dinhDangTien(kpi.conPhaiTra)} đ</b>
            </div>
          </div>
        </Card>

        <Card
          title={`Báo giá cần theo dõi (${baoGiaCanBoSung.length})`}
          action={
            <Button variant="text" size="sm" onClick={() => handleNavigate('/tho/chi-phi')}>
              Xem báo giá
            </Button>
          }
        >
          {baoGiaCanBoSung.length === 0 ? (
            <p className="t-sm t-2">Không có báo giá nào bị từ chối hoặc đang chờ duyệt.</p>
          ) : (
            <div style={{ display: 'grid', gap: 4 }}>
              {baoGiaCanBoSung.map((bg) => (
                <div key={bg.baoGiaId} {...bam(`/viec-cua-toi?yeuCauId=${bg.yeuCauId}`)} style={{ ...styleDong, alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0, display: 'grid', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600 }}>{bg.maYeuCau} · P.{bg.soPhong}</span>
                      <StatusTag tone={bg.trangThai === 'TU_CHOI' ? 'urgent' : 'waiting'}>
                        {bg.tenTrangThai} (v{bg.phienBan})
                      </StatusTag>
                    </div>
                    <div className="t-sm t-2" style={styleCat} title={bg.hangMuc}>
                      {bg.hangMuc} · <b>{dinhDangTien(bg.tongTien)} đ</b>
                    </div>
                    {bg.lyDoTuChoi ? (
                      <div className="t-sm" style={{ color: 'var(--ma-urgent)' }}>Lý do từ chối: {bg.lyDoTuChoi}</div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Cơ cấu trạng thái công việc" data-testid="chart-status-distribution">
          {tongBieuDoTrangThai === 0 ? (
            <p className="t-sm t-2">Không có công việc nào trong tháng này.</p>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ height: 16, display: 'flex', borderRadius: 8, overflow: 'hidden', background: 'var(--ma-chart-track)' }} aria-label="Biểu đồ thanh phân bố trạng thái">
                {bieuDoTrangThai.map((item) => {
                  const pct = Math.round((item.soLuong / tongBieuDoTrangThai) * 100)
                  if (item.soLuong === 0) return null
                  return <div key={item.trangThai} style={{ width: `${pct}%`, background: item.mauSac }} title={`${item.tenTrangThai}: ${item.soLuong} (${pct}%)`} />
                })}
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {bieuDoTrangThai.map((item) => {
                  const pct = tongBieuDoTrangThai > 0 ? Math.round((item.soLuong / tongBieuDoTrangThai) * 100) : 0
                  return (
                    <div key={item.trangThai} className="t-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 4, background: item.mauSac }} />
                        {item.tenTrangThai}
                      </span>
                      <span>
                        <b>{item.soLuong}</b>
                        <span className="t-2" style={{ marginLeft: 6 }}>({pct}%)</span>
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </Card>

        <Card
          title="Xu hướng giá trị chốt & tiền nhận"
          data-testid="chart-trend-over-time"
          style={mobile ? undefined : { gridColumn: '1 / -1' }}
        >
          <div className="legend" style={{ marginBottom: 12 }}>
            <span style={styleChuThich}><span aria-hidden="true" style={{ ...styleOMau, background: 'var(--ma-chart-1)' }} /> Giá trị chốt</span>
            <span style={styleChuThich}><span aria-hidden="true" style={{ ...styleOMau, background: 'var(--ma-chart-2)' }} /> Tiền đã nhận</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: mobile ? 460 : undefined, height: 180, display: 'flex', alignItems: 'flex-end', gap: 12, paddingBottom: 28, borderBottom: '1px solid var(--ma-line-200)' }}>
              {bieuDoXuHuong.map((week, idx) => {
                const hChot = Math.round((week.giaTriDaChot / maxTrend) * 140)
                const hNhan = Math.round((week.daNhan / maxTrend) * 140)
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 4, height: 140 }}>
                      <div style={{ width: '40%', height: Math.max(hChot, 3), background: 'var(--ma-chart-1)', borderRadius: '4px 4px 0 0' }} title={`Giá trị chốt: ${dinhDangTien(week.giaTriDaChot)} đ`} />
                      <div style={{ width: '40%', height: Math.max(hNhan, 3), background: 'var(--ma-chart-2)', borderRadius: '4px 4px 0 0' }} title={`Tiền nhận: ${dinhDangTien(week.daNhan)} đ`} />
                    </div>
                    <span className="t-meta" style={{ whiteSpace: 'nowrap' }}>{week.nhan}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

const styleTrang = (mobile: boolean): CSSProperties => ({ padding: mobile ? 0 : '24px 20px', maxWidth: 1240, margin: '0 auto', display: 'grid', gap: 16 })
const styleLuoi = (mobile: boolean): CSSProperties => ({ display: 'grid', gridTemplateColumns: mobile ? 'minmax(0, 1fr)' : 'repeat(auto-fit, minmax(340px, 1fr))', gap: mobile ? 12 : 16, alignItems: 'start' })
const styleBaO: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }
const styleO: CSSProperties = { background: 'var(--ma-bg-card)', borderRadius: 16, padding: 14, display: 'grid', gap: 2, alignContent: 'start', cursor: 'pointer', minWidth: 0 }
const styleSo: CSSProperties = { display: 'block', font: '600 28px/1.1 var(--ma-font-ui)', letterSpacing: '-0.02em' }
const styleNhan: CSSProperties = { font: '500 14px/1.3 var(--ma-font-ui)', color: 'var(--ma-text-primary)' }
const styleMoTa: CSSProperties = { font: 'var(--ma-text-caption)', color: 'var(--ma-text-secondary)' }
const styleDong: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 56, padding: '8px 4px', borderBottom: '1px solid var(--ma-line-100)', cursor: 'pointer' }
const styleCat: CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
const styleTien: CSSProperties = { font: '600 17px/1.2 var(--ma-font-ui)', whiteSpace: 'nowrap' }
const styleChuThich: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6 }
const styleOMau: CSSProperties = { width: 10, height: 10, borderRadius: 3, display: 'inline-block' }
