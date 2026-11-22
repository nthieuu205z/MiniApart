import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import {
  ApiError,
  danhDauThongBaoDaDoc,
  fetchAnhThongBao,
  fetchPhong,
  fetchThongBao,
  fetchThongBaoLuuTru,
  guiThongBaoChung,
  guiThongBaoChungCoAnh,
  xemTruocThongBaoChung,
  type ThongTinGuiThongBaoChung,
  type ThongTinHopThongBao,
  type ThongTinPhong,
  type ThongTinThongBao,
  type YeuCauThongBaoChung,
} from './api'
import { Button } from './design/core/Button'
import { Icon } from './design/core/Icon'
import { StatusTag } from './design/core/StatusTag'
import { EmptyState } from './design/feedback/EmptyState'
import { Field } from './design/forms/Field'
import { Card } from './design/layout/Card'
import { BuildingSelect, Feedback, useBuildings } from './ManagementShared'

/** Màn /thong-bao báo số chưa đọc mới để chuông trên thanh trên cập nhật theo, không cần App nối thêm. */
export const SU_KIEN_CHUA_DOC = 'ma:thong-bao-chua-doc'

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
  const [moSoan, setMoSoan] = useState(false)
  const [xemHet, setXemHet] = useState(false)
  const anhUrlsRef = useRef<Record<number, string>>({})
  const baoDoi = useCallback((n: number) => {
    onUnreadCountChange?.(n)
    window.dispatchEvent(new CustomEvent(SU_KIEN_CHUA_DOC, { detail: n }))
  }, [onUnreadCountChange])

  const taiHopThongBao = useCallback(async () => {
    setDangTai(true)
    setLoiTai(false)
    try {
      const data = dangXemLuuTru ? await fetchThongBaoLuuTru(token) : await fetchThongBao(token)
      hopThongBaoRef.current = data
      setHopThongBao(data)
      if (!dangXemLuuTru) baoDoi(data.soChuaDoc)
    } catch {
      setLoiTai(true)
    } finally {
      setDangTai(false)
    }
  }, [dangXemLuuTru, baoDoi, token])

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
      baoDoi(next.soChuaDoc)
    } catch {
      setLoiHanhDong(thongBao.maThamChieu)
    } finally {
      setDangDanhDau((current) => xoaKhoiTapHop(current, thongBao.maThamChieu))
    }
  }

  const soChuaDoc = hopThongBao?.soChuaDoc ?? 0
  const coQuyenSoan = vaiTro === 'CHU' || vaiTro === 'QUAN_LY'
  // Chủ/Quản lý đọc nhanh ở chuông nên hộp thư ở đây thu gọn 5 tin; Thợ/Khách thấy đủ.
  const thuGon = coQuyenSoan && !dangXemLuuTru && !xemHet && (hopThongBao?.thongBao.length ?? 0) > 5
  const dsHien = thuGon ? hopThongBao!.thongBao.slice(0, 5) : (hopThongBao?.thongBao ?? [])

  return (
    <div
      className="ma-notification-screen"
      data-testid="notification-screen"
      aria-busy={dangTai || undefined}
      style={{ minHeight: '100%', minWidth: 0, display: 'grid', gap: 16, alignContent: 'start' }}
    >
      <header className="topbar ma-notification-header">
        <div className="title-block">
          <h1 className="h1">{dangXemLuuTru ? 'Kho lưu trữ' : 'Thông báo'}</h1>
          <p className="sub">{dangXemLuuTru ? 'Lịch sử được giữ lại sau khi thông báo hết hạn.' : 'Cập nhật về việc sửa chữa, hoá đơn và vận hành toà nhà.'}</p>
        </div>
        <div className="topbar-actions">
          {hopThongBao && !dangXemLuuTru ? (
            <StatusTag data-testid="notification-unread-count" role="status" aria-live="polite" aria-atomic="true" tone={soChuaDoc > 0 ? 'urgent' : 'neutral'} icon="bell">
              {soChuaDoc} chưa đọc
            </StatusTag>
          ) : null}
          {!dangXemLuuTru && coQuyenSoan && !moSoan ? <Button data-testid="open-common-notification" variant="primary" onClick={() => setMoSoan(true)}><Icon name="megaphone" />Soạn thông báo chung</Button> : null}
        </div>
      </header>

      <div className="table-toolbar" role="group" aria-label="Hộp thông báo" style={{ marginBottom: 0 }}>
        <button type="button" className="chip" aria-pressed={!dangXemLuuTru} onClick={() => setDangXemLuuTru(false)}>Hộp thư</button>
        <button type="button" className="chip" aria-pressed={dangXemLuuTru} onClick={() => setDangXemLuuTru(true)}>Kho lưu trữ</button>
      </div>

      {!dangXemLuuTru && coQuyenSoan && moSoan ? <ThongBaoChungForm token={token} mobile={mobile} onDong={() => setMoSoan(false)} /> : null}

      {dangTai ? (
        <section data-testid="notification-loading" aria-label="Đang tải hộp thông báo">
          <EmptyState kind="loading" title="Đang tải thông báo" />
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
        <Card>
          <section aria-label={dangXemLuuTru ? 'Danh sách thông báo lưu trữ' : 'Danh sách thông báo'} className="ma-notification-list stack" style={{ gap: 0 }}>
            {dsHien.map((thongBao) => {
              const chuaDoc = !dangXemLuuTru && !thongBao.daDoc
              return (
                <article
                  key={thongBao.maThamChieu}
                  data-testid="notification-item"
                  data-read={thongBao.daDoc ? 'true' : 'false'}
                  className="list-row"
                  style={{ alignItems: 'flex-start', padding: '16px 8px', borderRadius: 0, borderBottom: '1px solid var(--ma-line-100)' }}
                >
                  <span className={`avatar ${chuaDoc ? 'h1' : 'h4'}`} aria-hidden="true"><Icon name={dangXemLuuTru ? 'history' : 'bell'} /></span>
                  <div className="body" style={{ display: 'grid', gap: 8 }}>
                    <div className="row-wrap" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className="row-wrap" style={{ minWidth: 0 }}>
                        <h2 className="h3" style={{ overflowWrap: 'anywhere', fontWeight: chuaDoc ? 700 : 500 }}>{thongBao.tieuDe}</h2>
                        <StatusTag tone={dangXemLuuTru ? 'closed' : thongBao.daDoc ? 'done' : 'urgent'} icon={dangXemLuuTru ? 'history' : thongBao.daDoc ? 'check' : 'bell'}>
                          {dangXemLuuTru ? 'Đã lưu trữ' : thongBao.daDoc ? 'Đã đọc' : 'Chưa đọc'}
                        </StatusTag>
                      </div>
                      <div className="t-meta" style={{ display: 'grid', justifyItems: 'end' }}>
                        <time dateTime={thongBao.taoLuc}>{dinhDangThoiGian(thongBao.taoLuc)}</time>
                        {thongBao.hetHanLuc ? <time dateTime={thongBao.hetHanLuc}>Hết hạn: {dinhDangThoiGian(thongBao.hetHanLuc)}</time> : null}
                      </div>
                    </div>

                    <p style={{ overflowWrap: 'anywhere', lineHeight: 1.6 }}>{thongBao.noiDung}</p>

                    {thongBao.anh?.length ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 220px))', gap: 12 }} aria-label="Ảnh đính kèm">
                        {thongBao.anh.map((image) => anhUrls[image.id] ? (
                          <img key={image.id} src={anhUrls[image.id]} alt="Đính kèm thông báo" style={{ display: 'block', width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 'var(--ma-radius-md)' }} />
                        ) : <span key={image.id} className="t-meta">Ảnh không còn khả dụng</span>)}
                      </div>
                    ) : null}

                    {chuaDoc ? (
                      <div className="row-wrap">
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
                        {loiHanhDong === thongBao.maThamChieu ? <Feedback error="Không thể cập nhật thông báo. Thử lại sau." /> : null}
                      </div>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </section>
          {thuGon ? <div className="row-wrap" style={{ paddingTop: 12 }}><Button variant="text" size="sm" onClick={() => setXemHet(true)}>Xem cả {hopThongBao!.thongBao.length} thông báo</Button></div> : null}
        </Card>
      )}
    </div>
  )
}

function ThongBaoChungForm({ token, mobile, onDong }: { token: string; mobile: boolean; onDong: () => void }) {
  const { buildings, buildingId, setBuildingId } = useBuildings(token)
  const [phong, setPhong] = useState<ThongTinPhong[]>([])
  const toaNhaId = buildingId === null ? '' : String(buildingId)
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
    if (!toaNhaId || phamVi !== 'PHONG') return
    let mounted = true
    void fetchPhong(token, Number(toaNhaId)).then((items) => {
      if (mounted) setPhong(items.filter((item) => item.id !== null))
    }).catch((reason: unknown) => {
      if (mounted) setLoi(reason instanceof Error ? reason.message : 'Không thể tải danh sách phòng.')
    })
    return () => { mounted = false }
  }, [phamVi, toaNhaId, token])

  useEffect(() => {
    setXemTruoc(null)
    setThanhCong(null)
    khoaChongLapRef.current = null
  }, [hetHan, noiDung, phongIds, phamVi, tang, tieuDe, toaNhaId, tep])

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

  const cot2 = (rong = false) => (rong && !mobile ? { gridColumn: '1 / -1' } : undefined)

  return (
    <Card title="Soạn thông báo chung" aria-label="Soạn thông báo chung" action={<Button variant="text" size="sm" onClick={onDong}><Icon name="x" />Đóng</Button>}>
      <p className="t-sm" style={{ color: 'var(--ma-text-secondary)', marginBottom: 16 }}>Xem trước số phòng nhận trước khi gửi. Người nhận được chụp tại thời điểm gửi.</p>
      <form onSubmit={xemTruocForm} style={{ display: 'grid', gap: 16, gridTemplateColumns: mobile ? '1fr' : 'repeat(2, minmax(0, 1fr))' }}>
        <BuildingSelect buildings={buildings} value={buildingId} onChange={setBuildingId} />
        <Field label="Phạm vi">
          <select className="select" value={phamVi} onChange={(event) => { setPhamVi(event.target.value as typeof phamVi); setPhongIds([]) }}>
            <option value="TOA_NHA">Toàn toà</option>
            <option value="TANG">Theo tầng</option>
            <option value="PHONG">Chọn phòng</option>
          </select>
        </Field>
        {phamVi === 'TANG' ? <Field label="Tầng">
          <input className="input" type="number" min="1" value={tang} onChange={(event) => setTang(event.target.value)} required />
        </Field> : null}
        {phamVi === 'PHONG' ? <fieldset className="field" style={{ border: 0, padding: 0, margin: 0, ...cot2(true) }}>
          <legend className="label" style={{ padding: 0, marginBottom: 6 }}>Phòng nhận thông báo</legend>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(9rem, 1fr))', gap: 4 }}>
            {phong.map((item) => item.id === null ? null : <label key={item.id} className="check" style={{ display: 'flex', gap: 8, alignItems: 'center', minHeight: 'var(--ma-hit-mobile)' }}>
              <input type="checkbox" checked={phongIds.includes(item.id)} onChange={() => setPhongIds((current) => current.includes(item.id!) ? current.filter((id) => id !== item.id) : [...current, item.id!])} />
              Phòng {item.soPhong}
            </label>)}
          </div>
        </fieldset> : null}
        <div style={cot2(true)}><Field label="Tiêu đề">
          <input className="input" value={tieuDe} onChange={(event) => setTieuDe(event.target.value)} required maxLength={255} />
        </Field></div>
        <div style={cot2(true)}><Field label="Nội dung">
          <textarea className="input" style={{ height: 'auto', minHeight: 120, resize: 'vertical' }} value={noiDung} onChange={(event) => setNoiDung(event.target.value)} required />
        </Field></div>
        <Field label="Hạn kết thúc">
          <input className="input" type="datetime-local" value={hetHan} onChange={(event) => setHetHan(event.target.value)} required />
        </Field>
        <Field label="Ảnh đính kèm (tuỳ chọn)">
          <input className="input" type="file" accept="image/png,image/jpeg" onChange={(event) => setTep(event.target.files?.[0] ?? null)} />
        </Field>
        <div className="row-wrap" style={cot2(true)}>
          <Button type="submit" variant={xemTruoc ? 'secondary' : 'primary'} blocked={dangTai || !toaNhaId} blockedReason={!toaNhaId ? 'Chọn toà nhà trước khi xem trước người nhận.' : undefined}>{dangTai ? 'Đang xử lý…' : 'Xem trước người nhận'}</Button>
          {xemTruoc ? <Button type="button" variant="primary" blocked={dangTai || xemTruoc.soNguoiNhan === 0} blockedReason={xemTruoc.soNguoiNhan === 0 ? 'Chưa có tài khoản nào nhận được thông báo này.' : undefined} onClick={() => void guiForm()}>Gửi thông báo</Button> : null}
        </div>
      </form>
      {xemTruoc ? <div role="status" className="card-sunken stack" style={{ gap: 4, marginTop: 16 }}>
        <strong>Đối tượng nhận</strong>
        <span>{xemTruoc.soNguoiNhan} tài khoản · {xemTruoc.soPhongNhan} phòng</span>
        <span className="t-sm" style={{ color: 'var(--ma-text-secondary)' }}>{xemTruoc.soPhongKhongCoTaiKhoan} phòng chưa có tài khoản hoạt động</span>
      </div> : null}
      <Feedback error={loi} success={thanhCong} />
    </Card>
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

function macDinhHetHan() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000)
  date.setSeconds(0, 0)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function taoKhoaIdempotency() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}
