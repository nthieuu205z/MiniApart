import { useCallback, useEffect, useRef, useState } from 'react'
import {
  danhDauThongBaoDaDoc,
  fetchThongBao,
  type ThongTinHopThongBao,
  type ThongTinThongBao,
} from './api'
import { Button } from './design/core/Button'
import { StatusTag } from './design/core/StatusTag'
import { SysLabel } from './design/core/SysLabel'
import { EmptyState } from './design/feedback/EmptyState'

export type ThongBaoProps = {
  token: string
  mobile?: boolean
  onUnreadCountChange?: (count: number) => void
}

/** FR-MNT-02/FR-MNT-04/FR-INV-08: shared notification inbox for authenticated users. */
export function ThongBao({ token, mobile = false, onUnreadCountChange }: ThongBaoProps): React.ReactElement {
  const [hopThongBao, setHopThongBao] = useState<ThongTinHopThongBao | null>(null)
  const hopThongBaoRef = useRef<ThongTinHopThongBao | null>(null)
  const [dangTai, setDangTai] = useState(true)
  const [loiTai, setLoiTai] = useState(false)
  const [dangDanhDau, setDangDanhDau] = useState<Set<string>>(() => new Set())
  const [loiHanhDong, setLoiHanhDong] = useState<string | null>(null)

  const taiHopThongBao = useCallback(async () => {
    setDangTai(true)
    setLoiTai(false)
    try {
      const data = await fetchThongBao(token)
      hopThongBaoRef.current = data
      setHopThongBao(data)
      onUnreadCountChange?.(data.soChuaDoc)
    } catch {
      setLoiTai(true)
    } finally {
      setDangTai(false)
    }
  }, [onUnreadCountChange, token])

  useEffect(() => {
    void taiHopThongBao()
  }, [taiHopThongBao])

  async function xuLyDanhDauDaDoc(thongBao: ThongTinThongBao) {
    if (thongBao.daDoc || dangDanhDau.has(thongBao.maThamChieu)) return
    setLoiHanhDong(null)
    setDangDanhDau((current) => new Set(current).add(thongBao.maThamChieu))
    try {
      const daCapNhat = await danhDauThongBaoDaDoc(token, thongBao.maThamChieu)
      const current = hopThongBaoRef.current
      if (!current) return
      const thongBaoHienTai = current.thongBao.find((item) => item.maThamChieu === daCapNhat.maThamChieu)
      const next = {
        soChuaDoc: Math.max(0, current.soChuaDoc - (thongBaoHienTai?.daDoc ? 0 : 1)),
        thongBao: current.thongBao.map((item) => item.maThamChieu === daCapNhat.maThamChieu ? daCapNhat : item),
      }
      hopThongBaoRef.current = next
      setHopThongBao(next)
      onUnreadCountChange?.(next.soChuaDoc)
    } catch {
      setLoiHanhDong(thongBao.maThamChieu)
    } finally {
      setDangDanhDau((current) => xoaKhoiTapHop(current, thongBao.maThamChieu))
    }
  }

  const soChuaDoc = hopThongBao?.soChuaDoc ?? 0

  return (
    <div
      className="ma-notification-screen"
      data-testid="notification-screen"
      aria-busy={dangTai || undefined}
      style={{
        minHeight: '100%',
        minWidth: 0,
        display: 'grid',
        gap: 'var(--ma-space-7)',
        alignContent: 'start',
        ...(mobile ? { paddingBottom: 'var(--ma-space-8)' } : {}),
      }}
    >
      <header className="ma-notification-header" style={{ display: 'grid', gap: 'var(--ma-space-3)', paddingBottom: 'var(--ma-space-5)', borderBottom: '2px solid var(--ma-ink-900)' }}>
        <SysLabel tone="primary">TRUNG TÂM THÔNG BÁO</SysLabel>
        <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: 'var(--ma-space-5)', flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gap: 'var(--ma-space-2)' }}>
            <h1 style={{ margin: 0, font: 'var(--ma-text-screen-title)', letterSpacing: 'var(--ma-tracking-title)' }}>Thông báo</h1>
            <p style={{ margin: 0, color: 'var(--ma-text-secondary)', font: 'var(--ma-text-body)' }}>
              Cập nhật về việc sửa chữa và hoá đơn của bạn.
            </p>
          </div>
          {hopThongBao ? (
            <span
              data-testid="notification-unread-count"
              role="status"
              aria-live="polite"
              aria-atomic="true"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                minHeight: 'var(--ma-hit-mobile)',
                padding: '0 var(--ma-space-4)',
                border: '1px solid',
                borderColor: soChuaDoc > 0 ? 'var(--ma-urgent)' : 'var(--ma-border-default)',
                background: soChuaDoc > 0 ? 'var(--ma-urgent-bg)' : 'var(--ma-bg-sunken)',
                color: soChuaDoc > 0 ? 'var(--ma-urgent)' : 'var(--ma-text-secondary)',
                font: 'var(--ma-text-caption)',
                fontWeight: 700,
              }}
            >
              {soChuaDoc} chưa đọc
            </span>
          ) : null}
        </div>
      </header>

      {dangTai ? (
        <section data-testid="notification-loading" aria-label="Đang tải hộp thông báo" style={{ display: 'grid', gap: 'var(--ma-space-4)' }}>
          <div aria-hidden="true" style={{ height: 96, border: '1px solid var(--ma-border-default)', background: 'var(--ma-bg-card)' }} />
          <p style={{ margin: 0, color: 'var(--ma-text-secondary)', font: 'var(--ma-text-body)' }} aria-live="polite">Đang tải thông báo…</p>
        </section>
      ) : loiTai ? (
        <EmptyState
          kind="error"
          data-testid="notification-error"
          role="alert"
          title="Không tải được hộp thông báo."
          body="Kiểm tra kết nối rồi thử tải lại danh sách."
          actionLabel="Thử lại"
          actionSize="md"
          onAction={() => void taiHopThongBao()}
        />
      ) : !hopThongBao || hopThongBao.thongBao.length === 0 ? (
        <EmptyState
          data-testid="notification-empty"
          title="Chưa có thông báo nào."
          body="Các cập nhật mới về sửa chữa và hoá đơn sẽ xuất hiện ở đây."
        />
      ) : (
        <section aria-label="Danh sách thông báo" className="ma-notification-list" style={{ display: 'grid', gap: 'var(--ma-space-4)' }}>
          {hopThongBao.thongBao.map((thongBao) => (
            <article
              key={thongBao.maThamChieu}
              data-testid="notification-item"
              data-read={thongBao.daDoc ? 'true' : 'false'}
              style={{
                display: 'grid',
                gap: 'var(--ma-space-4)',
                minWidth: 0,
                padding: 'var(--ma-space-6)',
                border: '1px solid var(--ma-border-default)',
                borderLeft: `4px solid ${thongBao.daDoc ? 'var(--ma-border-default)' : 'var(--ma-urgent)'}`,
                background: 'var(--ma-bg-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--ma-space-4)', flexWrap: 'wrap' }}>
                <div style={{ display: 'grid', gap: 'var(--ma-space-2)', minWidth: 0 }}>
                  <StatusTag tone={thongBao.daDoc ? 'neutral' : 'urgent'}>
                    {thongBao.daDoc ? 'Đã đọc' : 'Chưa đọc'}
                  </StatusTag>
                  <h2 style={{ margin: 0, font: 'var(--ma-text-block-title)', overflowWrap: 'anywhere' }}>{thongBao.tieuDe}</h2>
                </div>
                <time dateTime={thongBao.taoLuc} style={{ color: 'var(--ma-text-secondary)', font: 'var(--ma-text-caption)', whiteSpace: 'nowrap' }}>
                  {dinhDangThoiGian(thongBao.taoLuc)}
                </time>
              </div>

              <p style={{ margin: 0, color: 'var(--ma-text-primary)', font: 'var(--ma-text-body)', lineHeight: 1.6, overflowWrap: 'anywhere' }}>
                {thongBao.noiDung}
              </p>

              {!thongBao.daDoc ? (
                <div style={{ display: 'grid', gap: 'var(--ma-space-3)', justifyItems: 'start' }}>
                  <Button
                    data-testid="mark-read"
                    variant="secondary"
                    size="sm"
                    blocked={dangDanhDau.has(thongBao.maThamChieu)}
                    onClick={() => void xuLyDanhDauDaDoc(thongBao)}
                    style={{ minHeight: 'var(--ma-hit-mobile)' }}
                  >
                    {dangDanhDau.has(thongBao.maThamChieu) ? 'Đang cập nhật…' : 'Đánh dấu đã đọc'}
                  </Button>
                  {loiHanhDong === thongBao.maThamChieu ? (
                    <span role="alert" style={{ color: 'var(--ma-urgent)', font: 'var(--ma-text-caption)' }}>
                      Không thể cập nhật thông báo. Thử lại sau.
                    </span>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
        </section>
      )}
    </div>
  )
}

function dinhDangThoiGian(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Vừa cập nhật'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function xoaKhoiTapHop(current: Set<string>, id: string) {
  const next = new Set(current)
  next.delete(id)
  return next
}
