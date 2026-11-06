import { useEffect, useState, type CSSProperties } from 'react'
import {
  fetchThoTongQuan,
  type ThoTongQuanData,
  type ThongTinViecThoRow,
} from './workerDashboardApi'
import { dinhDangTien } from './design/core/format'
import { Button } from './design/core/Button'
import { StatusTag } from './design/core/StatusTag'
import { SysLabel } from './design/core/SysLabel'

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
  }, [token, toaNhaId, khoangNgay])

  function handleNavigate(path: string) {
    if (onNavigate) {
      onNavigate(path)
    } else {
      window.history.pushState({}, '', path)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }

  if (dangTai && !data) {
    return (
      <div style={{ padding: '24px 16px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ height: 40, background: 'var(--ma-bg-sunken)', borderRadius: 8, marginBottom: 24, animation: 'pulse 1.5s infinite' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{ height: 110, background: 'var(--ma-bg-sunken)', borderRadius: 8 }} />
          ))}
        </div>
      </div>
    )
  }

  if (loi) {
    return (
      <div style={{ padding: '32px 16px', maxWidth: 600, margin: '40px auto', textAlign: 'center', background: 'var(--ma-bg-card)', border: '1px solid var(--ma-border-default)', borderRadius: 12 }}>
        <h2 style={{ color: 'var(--ma-urgent, #EF4444)', margin: '0 0 12px' }}>Không thể tải bảng tổng quan</h2>
        <p style={{ color: 'var(--ma-text-secondary)', marginBottom: 20 }}>{loi}</p>
        <Button onClick={() => setKhoangNgay((k) => k)}>Thử lại</Button>
      </div>
    )
  }

  if (!data) return <div />

  const { kpi, bieuDoTrangThai, bieuDoXuHuong, viecCanXuLy, baoGiaCanBoSung, danhSachToa } = data

  const tongBieuDoTrangThai = bieuDoTrangThai.reduce((s, x) => s + x.soLuong, 0)
  const maxTrend = Math.max(...bieuDoXuHuong.map((x) => Math.max(x.giaTriDaChot, x.daNhan)), 1)

  return (
    <div style={{ padding: mobile ? '16px 12px' : '24px 20px', maxWidth: 1240, margin: '0 auto', display: 'grid', gap: 24 }} data-testid="worker-overview-screen">
      {/* Top Header & Filter Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderBottom: '1px solid var(--ma-border-default)', paddingBottom: 16 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', font: '700 clamp(22px, 4vw, 28px)/1.2 var(--ma-font-ui)' }}>
            Tổng quan công việc của thợ
          </h1>
          <p style={{ margin: 0, color: 'var(--ma-text-secondary)', fontSize: 14 }}>
            Theo dõi tiến độ sửa chữa, giá trị nghiệm thu và công nợ thanh toán cá nhân.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
          {/* Building Select */}
          <select
            value={toaNhaId ?? ''}
            onChange={(e) => setToaNhaId(e.target.value ? Number(e.target.value) : undefined)}
            aria-label="Chọn toà nhà"
            style={{
              height: 38,
              padding: '0 12px',
              borderRadius: 'var(--ma-radius, 6px)',
              border: '1px solid var(--ma-border-strong, #cbd5e1)',
              background: 'var(--ma-bg-card)',
              color: 'var(--ma-text-primary)',
              fontSize: 14,
            }}
          >
            <option value="">Tất cả toà nhà ({danhSachToa.length})</option>
            {danhSachToa.map((t) => (
              <option key={t.id} value={t.id}>
                {t.ten}
              </option>
            ))}
          </select>

          {/* Time range preset */}
          <div style={{ display: 'inline-flex', borderRadius: 6, border: '1px solid var(--ma-border-strong, #cbd5e1)', overflow: 'hidden' }}>
            {(['30', '60', '90', 'ALL'] as const).map((opt) => {
              const active = khoangNgay === opt
              const label = opt === 'ALL' ? 'Tất cả' : `${opt} ngày`
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setKhoangNgay(opt)}
                  style={{
                    padding: '6px 12px',
                    border: 'none',
                    background: active ? 'var(--ma-ink-900, #0f172a)' : 'var(--ma-bg-card)',
                    color: active ? '#ffffff' : 'var(--ma-text-primary)',
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        {/* KPI 1 */}
        <div
          onClick={() => handleNavigate('/viec-cua-toi?nhom=DANG_LAM')}
          style={styleKpiCard(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleNavigate('/viec-cua-toi?nhom=DANG_LAM')}
          data-testid="kpi-dang-xu-ly"
        >
          <SysLabel>Đang cần xử lý</SysLabel>
          <div style={styleKpiValue}>{kpi.dangXuLy}</div>
          <span style={styleKpiSub}>Việc được phân công / đang làm</span>
        </div>

        {/* KPI 2 */}
        <div
          onClick={() => handleNavigate('/viec-cua-toi?nhom=CHO_XAC_NHAN')}
          style={styleKpiCard(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleNavigate('/viec-cua-toi?nhom=CHO_XAC_NHAN')}
          data-testid="kpi-cho-xac-nhan"
        >
          <SysLabel>Chờ xác nhận</SysLabel>
          <div style={{ ...styleKpiValue, color: '#D97706' }}>{kpi.choXacNhan}</div>
          <span style={styleKpiSub}>Đã báo xong, chờ đóng</span>
        </div>

        {/* KPI 3 */}
        <div style={styleKpiCard(false)} data-testid="kpi-ty-le-hoan-thanh">
          <SysLabel>Tỷ lệ hoàn thành</SysLabel>
          <div style={{ ...styleKpiValue, color: kpi.tyLeHoanThanh.coDuLieu ? '#059669' : 'var(--ma-text-secondary)' }}>
            {kpi.tyLeHoanThanh.tyLe !== null ? `${kpi.tyLeHoanThanh.tyLe}%` : 'Chưa có'}
          </div>
          <span style={styleKpiSub}>{kpi.tyLeHoanThanh.moTa}</span>
        </div>

        {/* KPI 4 */}
        <div
          onClick={() => handleNavigate('/tho/chi-phi')}
          style={styleKpiCard(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleNavigate('/tho/chi-phi')}
          data-testid="kpi-gia-tri-da-chot"
        >
          <SysLabel>Giá trị đã chốt</SysLabel>
          <div style={{ ...styleKpiValue, fontSize: 'clamp(20px, 3vw, 24px)' }}>
            {dinhDangTien(kpi.giaTriDaChot)} đ
          </div>
          <span style={styleKpiSub}>Báo giá có hiệu lực trong kỳ</span>
        </div>

        {/* KPI 5 */}
        <div
          onClick={() => handleNavigate('/tho/chi-phi')}
          style={styleKpiCard(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleNavigate('/tho/chi-phi')}
          data-testid="kpi-da-nhan"
        >
          <SysLabel>Tiền thực nhận</SysLabel>
          <div style={{ ...styleKpiValue, fontSize: 'clamp(20px, 3vw, 24px)', color: '#059669' }}>
            {dinhDangTien(kpi.daNhan)} đ
          </div>
          <span style={styleKpiSub}>Đã xác nhận thanh toán</span>
        </div>

        {/* KPI 6 */}
        <div
          onClick={() => handleNavigate('/tho/chi-phi')}
          style={styleKpiCard(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleNavigate('/tho/chi-phi')}
          data-testid="kpi-con-phai-tra"
        >
          <SysLabel>Còn phải trả</SysLabel>
          <div style={{ ...styleKpiValue, fontSize: 'clamp(20px, 3vw, 24px)', color: kpi.conPhaiTra > 0 ? '#DC2626' : 'var(--ma-text-primary)' }}>
            {dinhDangTien(kpi.conPhaiTra)} đ
          </div>
          <span style={styleKpiSub}>Công nợ đủ điều kiện thanh toán</span>
        </div>
      </div>

      {/* Charts Section: 2 columns on desktop */}
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1.6fr', gap: 20 }}>
        {/* Chart 1: Status Distribution */}
        <div style={stylePanel} data-testid="chart-status-distribution">
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Cơ cấu trạng thái công việc</h3>
          {tongBieuDoTrangThai === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--ma-text-secondary)' }}>Không có công việc nào trong kỳ này.</div>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              {/* Stacked bar visualization */}
              <div style={{ height: 24, display: 'flex', borderRadius: 6, overflow: 'hidden', background: 'var(--ma-bg-sunken)' }} aria-label="Biểu đồ thanh phân bố trạng thái">
                {bieuDoTrangThai.map((item) => {
                  const pct = Math.round((item.soLuong / tongBieuDoTrangThai) * 100)
                  if (item.soLuong === 0) return null
                  return (
                    <div
                      key={item.trangThai}
                      style={{
                        width: `${pct}%`,
                        background: item.mauSac,
                        transition: 'width 0.4s ease',
                      }}
                      title={`${item.tenTrangThai}: ${item.soLuong} (${pct}%)`}
                    />
                  )
                })}
              </div>

              {/* Legend List */}
              <div style={{ display: 'grid', gap: 8 }}>
                {bieuDoTrangThai.map((item) => {
                  const pct = tongBieuDoTrangThai > 0 ? Math.round((item.soLuong / tongBieuDoTrangThai) * 100) : 0
                  return (
                    <div key={item.trangThai} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 12, height: 12, borderRadius: 3, background: item.mauSac }} />
                        <span>{item.tenTrangThai}</span>
                      </div>
                      <div>
                        <strong>{item.soLuong}</strong>
                        <span style={{ color: 'var(--ma-text-secondary)', marginLeft: 6 }}>({pct}%)</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Chart 2: Trend Over Time */}
        <div style={stylePanel} data-testid="chart-trend-over-time">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Xu hướng giá trị chốt & tiền nhận</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, background: '#2563EB', borderRadius: 2 }} /> Giá trị chốt
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, background: '#10B981', borderRadius: 2 }} /> Tiền đã nhận
              </span>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 460, height: 180, display: 'flex', alignItems: 'flex-end', gap: 12, paddingBottom: 24, borderBottom: '1px solid var(--ma-border-default)' }}>
              {bieuDoXuHuong.map((week, idx) => {
                const hChot = Math.round((week.giaTriDaChot / maxTrend) * 140)
                const hNhan = Math.round((week.daNhan / maxTrend) * 140)
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 4, height: 140 }}>
                      <div
                        style={{
                          width: '40%',
                          height: Math.max(hChot, 3),
                          background: '#2563EB',
                          borderRadius: '3px 3px 0 0',
                          transition: 'height 0.3s ease',
                        }}
                        title={`Giá trị chốt: ${dinhDangTien(week.giaTriDaChot)} đ`}
                      />
                      <div
                        style={{
                          width: '40%',
                          height: Math.max(hNhan, 3),
                          background: '#10B981',
                          borderRadius: '3px 3px 0 0',
                          transition: 'height 0.3s ease',
                        }}
                        title={`Tiền nhận: ${dinhDangTien(week.daNhan)} đ`}
                      />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--ma-text-secondary)', whiteSpace: 'nowrap' }}>
                      {week.nhan}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Lists: Actionable items */}
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1.3fr 1fr', gap: 20 }}>
        {/* List 1: Urgent tickets needing attention */}
        <div style={stylePanel}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Việc cần xử lý ngay ({viecCanXuLy.length})</h3>
            <button
              type="button"
              onClick={() => handleNavigate('/viec-cua-toi?nhom=DANG_LAM')}
              style={styleTextLink}
            >
              Xem tất cả →
            </button>
          </div>

          {viecCanXuLy.length === 0 ? (
            <p style={{ color: 'var(--ma-text-secondary)', margin: '16px 0', fontSize: 14 }}>
              Không có việc nào đang tồn đọng cần xử lý ngay.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {viecCanXuLy.slice(0, 5).map((row) => (
                <div
                  key={row.id}
                  onClick={() => handleNavigate(`/viec-cua-toi?yeuCauId=${row.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'var(--ma-bg-sunken)',
                    cursor: 'pointer',
                    gap: 12,
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleNavigate(`/viec-cua-toi?yeuCauId=${row.id}`)}
                >
                  <div style={{ minWidth: 0, display: 'grid', gap: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{row.maYeuCau}</span>
                      <StatusTag tone={row.mucDo === 'KHAN_CAP' ? 'urgent' : row.mucDo === 'GAP' ? 'waiting' : 'neutral'}>
                        {row.tenMucDo}
                      </StatusTag>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ma-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <strong>{row.toaNha} · P.{row.soPhong}:</strong> {row.hangMuc}
                    </div>
                  </div>
                  <Button variant="secondary" style={{ fontSize: 12, padding: '4px 10px', height: 30, flexShrink: 0 }}>
                    Mở
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* List 2: Quotes needing revision or action */}
        <div style={stylePanel}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Báo giá cần theo dõi ({baoGiaCanBoSung.length})</h3>
            <button
              type="button"
              onClick={() => handleNavigate('/tho/chi-phi')}
              style={styleTextLink}
            >
              Xem báo giá →
            </button>
          </div>

          {baoGiaCanBoSung.length === 0 ? (
            <p style={{ color: 'var(--ma-text-secondary)', margin: '16px 0', fontSize: 14 }}>
              Không có báo giá nào bị từ chối hoặc đang chờ duyệt.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {baoGiaCanBoSung.map((bg) => (
                <div
                  key={bg.baoGiaId}
                  onClick={() => handleNavigate(`/viec-cua-toi?yeuCauId=${bg.yeuCauId}`)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: bg.trangThai === 'TU_CHOI' ? 'rgba(239, 68, 68, 0.08)' : 'var(--ma-bg-sunken)',
                    border: bg.trangThai === 'TU_CHOI' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--ma-border-default)',
                    cursor: 'pointer',
                    display: 'grid',
                    gap: 4,
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleNavigate(`/viec-cua-toi?yeuCauId=${bg.yeuCauId}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>
                      {bg.maYeuCau} · P.{bg.soPhong}
                    </span>
                    <StatusTag tone={bg.trangThai === 'TU_CHOI' ? 'urgent' : 'waiting'}>
                      {bg.tenTrangThai} (v{bg.phienBan})
                    </StatusTag>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ma-text-secondary)' }}>
                    {bg.hangMuc} · <strong>{dinhDangTien(bg.tongTien)} đ</strong>
                  </div>
                  {bg.lyDoTuChoi ? (
                    <div style={{ fontSize: 12, color: 'var(--ma-urgent, #EF4444)', fontStyle: 'italic', marginTop: 2 }}>
                      Lý do từ chối: {bg.lyDoTuChoi}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const stylePanel: CSSProperties = {
  background: 'var(--ma-bg-card)',
  border: '1px solid var(--ma-border-default)',
  borderRadius: 12,
  padding: '16px 18px',
  boxShadow: 'var(--ma-shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
}

function styleKpiCard(interactive: boolean): CSSProperties {
  return {
    background: 'var(--ma-bg-card)',
    border: '1px solid var(--ma-border-default)',
    borderRadius: 10,
    padding: '14px 16px',
    display: 'grid',
    gap: 4,
    boxShadow: 'var(--ma-shadow-sm)',
    cursor: interactive ? 'pointer' : 'default',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  }
}

const styleKpiValue: CSSProperties = {
  font: '700 clamp(24px, 3.5vw, 32px)/1.1 var(--ma-font-mono, monospace)',
  letterSpacing: '-0.03em',
  color: 'var(--ma-text-primary)',
}

const styleKpiSub: CSSProperties = {
  fontSize: 12,
  color: 'var(--ma-text-secondary)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const styleTextLink: CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--ma-brand-primary, #2563EB)',
  cursor: 'pointer',
}
