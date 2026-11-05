import { useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import {
  ApiError,
  danhDauThongBaoDaDoc,
  fetchAnhThongBao,
  fetchPhong,
  fetchThongBao,
  fetchThongBaoLuuTru,
  fetchToaNha,
  guiThongBaoChung,
  guiThongBaoChungCoAnh,
  xemTruocThongBaoChung,
  type ThongTinGuiThongBaoChung,
  type ThongTinHopThongBao,
  type ThongTinPhong,
  type ThongTinToaNha,
  type ThongTinThongBao,
  type YeuCauThongBaoChung,
} from './api'
import { Button } from './design/core/Button'
import { StatusTag } from './design/core/StatusTag'
import { SysLabel } from './design/core/SysLabel'
import { EmptyState } from './design/feedback/EmptyState'

export type ThongBaoProps = {
  token: string
  mobile?: boolean
  vaiTro?: string
  onUnreadCountChange?: (count: number) => void
}

/** FR-MNT-02/FR-MNT-04/FR-INV-08/FR-NTF-02/FR-NTF-07: inbox, archive and common-notification composer. */
export function ThongBao({ token, mobile = false, vaiTro, onUnreadCountChange }: ThongBaoProps): React.ReactElement {
  const [hopThongBao, setHopThongBao] = useState<ThongTinHopThongBao | null>(null)
  const hopThongBaoRef = useRef<ThongTinHopThongBao | null>(null)
  const [dangXemLuuTru, setDangXemLuuTru] = useState(false)
  const [dangTai, setDangTai] = useState(true)
  const [loiTai, setLoiTai] = useState(false)
  const [dangDanhDau, setDangDanhDau] = useState<Set<string>>(() => new Set())
  const [loiHanhDong, setLoiHanhDong] = useState<string | null>(null)
  const [anhUrls, setAnhUrls] = useState<Record<number, string>>({})
  const anhUrlsRef = useRef<Record<number, string>>({})

  const taiHopThongBao = useCallback(async () => {
    setDangTai(true)
    setLoiTai(false)
    try {
      const data = dangXemLuuTru ? await fetchThongBaoLuuTru(token) : await fetchThongBao(token)
      hopThongBaoRef.current = data
      setHopThongBao(data)
      if (!dangXemLuuTru) onUnreadCountChange?.(data.soChuaDoc)
    } catch {
      setLoiTai(true)
    } finally {
      setDangTai(false)
    }
  }, [dangXemLuuTru, onUnreadCountChange, token])

  useEffect(() => {
    void taiHopThongBao()
  }, [taiHopThongBao])

  useEffect(() => {
    let mounted = true
    setAnhUrls({})
    anhUrlsRef.current = {}
    const ids = (hopThongBao?.thongBao ?? []).flatMap((item) => (item.anh ?? []).map((image) => image.id))
    if (ids.length === 0) return () => { mounted = false }
    void Promise.all(ids.map(async (id) => {
      try {
        const url = await fetchAnhThongBao(token, id)
        if (mounted) {
          anhUrlsRef.current[id] = url
          setAnhUrls((current) => ({ ...current, [id]: url }))
        } else URL.revokeObjectURL(url)
      } catch {
        // A private image may be inaccessible after its short-lived link expires.
      }
    }))
    return () => {
      mounted = false
      Object.values(anhUrlsRef.current).forEach((url) => URL.revokeObjectURL(url))
      anhUrlsRef.current = {}
    }
  }, [hopThongBao, token])

  async function xuLyDanhDauDaDoc(thongBao: ThongTinThongBao) {
    if (dangXemLuuTru || thongBao.daDoc || dangDanhDau.has(thongBao.maThamChieu)) return
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
            <h1 style={{ margin: 0, font: 'var(--ma-text-screen-title)', letterSpacing: 'var(--ma-tracking-title)' }}>{dangXemLuuTru ? 'Kho lưu trữ' : 'Thông báo'}</h1>
            <p style={{ margin: 0, color: 'var(--ma-text-secondary)', font: 'var(--ma-text-body)' }}>
              {dangXemLuuTru ? 'Lịch sử được giữ lại sau khi thông báo hết hạn.' : 'Cập nhật về việc sửa chữa, hoá đơn và vận hành toà nhà.'}
            </p>
          </div>
          {hopThongBao && !dangXemLuuTru ? (
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
        <div style={{ display: 'flex', gap: 'var(--ma-space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <Button variant={dangXemLuuTru ? 'secondary' : 'primary'} size="sm" onClick={() => setDangXemLuuTru(false)}>
            Hộp thư
          </Button>
          <Button variant={dangXemLuuTru ? 'primary' : 'secondary'} size="sm" onClick={() => setDangXemLuuTru(true)}>
            Kho lưu trữ
          </Button>
          {!dangXemLuuTru && (vaiTro === 'CHU' || vaiTro === 'QUAN_LY') ? <ThongBaoChungForm token={token} mobile={mobile} /> : null}
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
          title={dangXemLuuTru ? 'Chưa có lịch sử lưu trữ.' : 'Chưa có thông báo nào.'}
          body={dangXemLuuTru ? 'Thông báo hết hạn sẽ được giữ lại tại đây.' : 'Các cập nhật mới sẽ xuất hiện ở đây.'}
        />
      ) : (
        <section aria-label={dangXemLuuTru ? 'Danh sách thông báo lưu trữ' : 'Danh sách thông báo'} className="ma-notification-list" style={{ display: 'grid', gap: 'var(--ma-space-4)' }}>
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
                borderLeft: `4px solid ${dangXemLuuTru ? 'var(--ma-border-strong)' : thongBao.daDoc ? 'var(--ma-border-default)' : 'var(--ma-urgent)'}`,
                background: 'var(--ma-bg-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--ma-space-4)', flexWrap: 'wrap' }}>
                <div style={{ display: 'grid', gap: 'var(--ma-space-2)', minWidth: 0 }}>
                  <StatusTag tone={dangXemLuuTru ? 'neutral' : thongBao.daDoc ? 'neutral' : 'urgent'}>
                    {dangXemLuuTru ? 'Đã lưu trữ' : thongBao.daDoc ? 'Đã đọc' : 'Chưa đọc'}
                  </StatusTag>
                  <h2 style={{ margin: 0, font: 'var(--ma-text-block-title)', overflowWrap: 'anywhere' }}>{thongBao.tieuDe}</h2>
                </div>
                <div style={{ display: 'grid', gap: 'var(--ma-space-1)', justifyItems: 'end', color: 'var(--ma-text-secondary)', font: 'var(--ma-text-caption)', whiteSpace: 'nowrap' }}>
                  <time dateTime={thongBao.taoLuc}>{dinhDangThoiGian(thongBao.taoLuc)}</time>
                  {thongBao.hetHanLuc ? <time dateTime={thongBao.hetHanLuc}>Hết hạn: {dinhDangThoiGian(thongBao.hetHanLuc)}</time> : null}
                </div>
              </div>

              <p style={{ margin: 0, color: 'var(--ma-text-primary)', font: 'var(--ma-text-body)', lineHeight: 1.6, overflowWrap: 'anywhere' }}>
                {thongBao.noiDung}
              </p>

              {thongBao.anh?.length ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 'var(--ma-space-3)' }} aria-label="Ảnh đính kèm">
                  {thongBao.anh.map((image) => anhUrls[image.id] ? (
                    <img key={image.id} src={anhUrls[image.id]} alt="Đính kèm thông báo" style={{ display: 'block', width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', border: '1px solid var(--ma-border-default)' }} />
                  ) : <span key={image.id} style={{ color: 'var(--ma-text-secondary)', font: 'var(--ma-text-caption)' }}>Ảnh không còn khả dụng</span>)}
                </div>
              ) : null}

              {!dangXemLuuTru && !thongBao.daDoc ? (
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

function ThongBaoChungForm({ token, mobile }: { token: string; mobile: boolean }) {
  const [mo, setMo] = useState(false)
  const [toaNha, setToaNha] = useState<ThongTinToaNha[]>([])
  const [phong, setPhong] = useState<ThongTinPhong[]>([])
  const [toaNhaId, setToaNhaId] = useState('')
  const [phamVi, setPhamVi] = useState<'TOA_NHA' | 'TANG' | 'PHONG'>('TOA_NHA')
  const [tang, setTang] = useState('')
  const [phongIds, setPhongIds] = useState<number[]>([])
  const [tieuDe, setTieuDe] = useState('')
  const [noiDung, setNoiDung] = useState('')
  const [hetHan, setHetHan] = useState(() => macDinhHetHan())
  const [tep, setTep] = useState<File | null>(null)
  const [xemTruoc, setXemTruoc] = useState<ThongTinGuiThongBaoChung | null>(null)
  const [dangTai, setDangTai] = useState(false)
  const [loi, setLoi] = useState<string | null>(null)
  const [thanhCong, setThanhCong] = useState<string | null>(null)
  const khoaChongLapRef = useRef<string | null>(null)

  useEffect(() => {
    if (!mo) return
    let mounted = true
    void fetchToaNha(token).then((items) => {
      if (!mounted) return
      setToaNha(items)
      setToaNhaId((current) => current || String(items[0]?.id ?? ''))
    }).catch((reason: unknown) => {
      if (mounted) setLoi(reason instanceof Error ? reason.message : 'Không thể tải toà nhà.')
    })
    return () => { mounted = false }
  }, [mo, token])

  useEffect(() => {
    if (!mo || !toaNhaId || phamVi !== 'PHONG') return
    let mounted = true
    void fetchPhong(token, Number(toaNhaId)).then((items) => {
      if (mounted) setPhong(items.filter((item) => item.id !== null))
    }).catch((reason: unknown) => {
      if (mounted) setLoi(reason instanceof Error ? reason.message : 'Không thể tải danh sách phòng.')
    })
    return () => { mounted = false }
  }, [mo, phamVi, toaNhaId, token])

  useEffect(() => {
    setXemTruoc(null)
    setThanhCong(null)
    khoaChongLapRef.current = null
  }, [hetHan, noiDung, phongIds, phamVi, tang, tieuDe, toaNhaId, tep])

  if (!mo) {
    return <Button data-testid="open-common-notification" variant="secondary" size="sm" onClick={() => setMo(true)}>Soạn thông báo chung</Button>
  }

  const payload = (): YeuCauThongBaoChung => ({
    toaNhaId: Number(toaNhaId),
    phamVi,
    ...(phamVi === 'TANG' && tang ? { tang: Number(tang) } : {}),
    ...(phamVi === 'PHONG' ? { phongIds } : {}),
    tieuDe,
    noiDung,
    hetHanLuc: new Date(hetHan).toISOString(),
  })

  async function xemTruocForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoi(null)
    setThanhCong(null)
    setDangTai(true)
    try {
      const result = await xemTruocThongBaoChung(token, payload())
      setXemTruoc({ ...result, maThamChieu: '' })
    } catch (reason: unknown) {
      setLoi(reason instanceof ApiError ? reason.message : 'Không thể xem trước người nhận.')
    } finally {
      setDangTai(false)
    }
  }

  async function guiForm() {
    setLoi(null)
    setThanhCong(null)
    setDangTai(true)
    try {
      const khoaChongLap = khoaChongLapRef.current ?? taoKhoaIdempotency()
      khoaChongLapRef.current = khoaChongLap
      const result = tep
        ? await guiThongBaoChungCoAnh(token, payload(), khoaChongLap, tep)
        : await guiThongBaoChung(token, payload(), khoaChongLap)
      setXemTruoc(result)
      setThanhCong(`Đã gửi tới ${result.soNguoiNhan} tài khoản trong ${result.soPhongNhan} phòng.`)
    } catch (reason: unknown) {
      setLoi(reason instanceof ApiError ? reason.message : 'Không thể gửi thông báo chung.')
    } finally {
      setDangTai(false)
    }
  }

  return (
    <section aria-label="Soạn thông báo chung" style={{ gridColumn: '1 / -1', display: 'grid', gap: 'var(--ma-space-5)', padding: 'var(--ma-space-5)', border: '1px solid var(--ma-border-strong)', background: 'var(--ma-bg-sunken)', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 'var(--ma-space-3)', flexWrap: 'wrap' }}>
        <div style={{ display: 'grid', gap: 'var(--ma-space-2)' }}>
          <SysLabel tone="primary">FR-NTF-02</SysLabel>
          <h2 style={{ margin: 0, font: 'var(--ma-text-block-title)' }}>Soạn thông báo chung</h2>
          <p style={{ margin: 0, color: 'var(--ma-text-secondary)', font: 'var(--ma-text-body)' }}>Xem trước số phòng nhận trước khi gửi. Người nhận được chụp tại thời điểm gửi.</p>
        </div>
        <Button variant="text" size="sm" onClick={() => setMo(false)}>Đóng</Button>
      </div>
      <form onSubmit={xemTruocForm} style={{ display: 'grid', gap: 'var(--ma-space-4)', gridTemplateColumns: mobile ? '1fr' : 'repeat(2, minmax(0, 1fr))' }}>
        <label style={styleNhanTruong}>Toà nhà
          <select value={toaNhaId} onChange={(event) => setToaNhaId(event.target.value)} style={styleOTruong} required>
            <option value="">Chọn toà nhà</option>
            {toaNha.map((item) => <option key={item.id} value={item.id}>{item.ten}</option>)}
          </select>
        </label>
        <label style={styleNhanTruong}>Phạm vi
          <select value={phamVi} onChange={(event) => { setPhamVi(event.target.value as typeof phamVi); setPhongIds([]) }} style={styleOTruong}>
            <option value="TOA_NHA">Toàn toà</option>
            <option value="TANG">Theo tầng</option>
            <option value="PHONG">Chọn phòng</option>
          </select>
        </label>
        {phamVi === 'TANG' ? <label style={styleNhanTruong}>Tầng
          <input type="number" min="1" value={tang} onChange={(event) => setTang(event.target.value)} style={styleOTruong} required />
        </label> : null}
        {phamVi === 'PHONG' ? <fieldset style={{ ...styleNhanTruong, border: 0, padding: 0, margin: 0, gridColumn: mobile ? undefined : '1 / -1' }}>
          <legend style={{ fontWeight: 700 }}>Phòng nhận thông báo</legend>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(9rem, 1fr))', gap: 'var(--ma-space-2)' }}>
            {phong.map((item) => item.id === null ? null : <label key={item.id} style={{ display: 'flex', gap: 'var(--ma-space-2)', alignItems: 'center', minHeight: 'var(--ma-hit-mobile)' }}>
              <input type="checkbox" checked={phongIds.includes(item.id)} onChange={() => setPhongIds((current) => current.includes(item.id!) ? current.filter((id) => id !== item.id) : [...current, item.id!])} />
              Phòng {item.soPhong}
            </label>)}
          </div>
        </fieldset> : null}
        <label style={{ ...styleNhanTruong, gridColumn: mobile ? undefined : '1 / -1' }}>Tiêu đề
          <input value={tieuDe} onChange={(event) => setTieuDe(event.target.value)} style={styleOTruong} required maxLength={255} />
        </label>
        <label style={{ ...styleNhanTruong, gridColumn: mobile ? undefined : '1 / -1' }}>Nội dung
          <textarea value={noiDung} onChange={(event) => setNoiDung(event.target.value)} style={{ ...styleOTruong, minHeight: 120, resize: 'vertical' }} required />
        </label>
        <label style={styleNhanTruong}>Hạn kết thúc
          <input type="datetime-local" value={hetHan} onChange={(event) => setHetHan(event.target.value)} style={styleOTruong} required />
        </label>
        <label style={styleNhanTruong}>Ảnh đính kèm <span style={{ color: 'var(--ma-text-secondary)', font: 'var(--ma-text-caption)' }}>(tuỳ chọn)</span>
          <input type="file" accept="image/png,image/jpeg" onChange={(event) => setTep(event.target.files?.[0] ?? null)} style={{ ...styleOTruong, padding: 'var(--ma-space-2)' }} />
        </label>
        <div style={{ display: 'flex', gap: 'var(--ma-space-3)', flexWrap: 'wrap', gridColumn: mobile ? undefined : '1 / -1' }}>
          <Button type="submit" variant="secondary" blocked={dangTai}>{dangTai ? 'Đang xử lý…' : 'Xem trước người nhận'}</Button>
          {xemTruoc ? <Button type="button" variant="primary" blocked={dangTai || xemTruoc.soNguoiNhan === 0} onClick={() => void guiForm()}>Gửi thông báo</Button> : null}
        </div>
      </form>
      {xemTruoc ? <div role="status" style={{ display: 'grid', gap: 'var(--ma-space-2)', padding: 'var(--ma-space-4)', border: '1px solid var(--ma-border-default)', background: 'var(--ma-bg-card)' }}>
        <strong>Đối tượng nhận</strong>
        <span>{xemTruoc.soNguoiNhan} tài khoản · {xemTruoc.soPhongNhan} phòng</span>
        <span style={{ color: 'var(--ma-text-secondary)' }}>{xemTruoc.soPhongKhongCoTaiKhoan} phòng chưa có tài khoản hoạt động</span>
      </div> : null}
      {loi ? <span role="alert" style={{ color: 'var(--ma-urgent)', font: 'var(--ma-text-caption)' }}>{loi}</span> : null}
      {thanhCong ? <span role="status" style={{ color: 'var(--ma-done-text)', font: 'var(--ma-text-caption)' }}>{thanhCong}</span> : null}
    </section>
  )
}

const styleNhanTruong: CSSProperties = {
  display: 'grid',
  gap: 'var(--ma-space-2)',
  minWidth: 0,
  font: 'var(--ma-text-body)',
  color: 'var(--ma-text-primary)',
}

const styleOTruong: CSSProperties = {
  width: '100%',
  minWidth: 0,
  minHeight: 'var(--ma-hit-mobile)',
  padding: 'var(--ma-space-3) var(--ma-space-4)',
  border: '1px solid var(--ma-border-strong)',
  borderRadius: 'var(--ma-radius)',
  background: 'var(--ma-bg-card)',
  color: 'var(--ma-text-primary)',
  font: 'var(--ma-text-body)',
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

function macDinhHetHan() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000)
  date.setSeconds(0, 0)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function taoKhoaIdempotency() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}
