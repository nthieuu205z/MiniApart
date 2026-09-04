import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import {
  ApiError,
  fetchPhong,
  fetchToaNha,
  taoPhong,
  taoPhongHangLoat,
  type ThongTinPhong,
  type ThongTinToaNha,
  type YeuCauPhong,
  type YeuCauPhongHangLoat,
  xemTruocPhongHangLoat,
} from './api'
import { Button } from './design/core/Button'
import { BuildingSection } from './design/building/BuildingSection'
import { ConfirmDialog } from './design/feedback/ConfirmDialog'
import { EmptyState } from './design/feedback/EmptyState'
import { FilterChip } from './design/forms/FilterChip'
import { StatStrip } from './design/shell/StatStrip'

type Props = {
  token: string
}

const TRANG_THAI_PHONG_HIEN_THI: Record<string, { nhan: string; lopCss: string }> = {
  TRONG: { nhan: 'Trống', lopCss: 'room-tile--trong' },
  DA_COC: { nhan: 'Đã đặt cọc', lopCss: 'room-tile--da_coc' },
  DANG_THUE: { nhan: 'Đang thuê', lopCss: 'room-tile--dang_thue' },
  DANG_SUA: { nhan: 'Đang sửa', lopCss: 'room-tile--dang_sua' },
  NGUNG: { nhan: 'Ngừng', lopCss: 'room-tile--ngung' },
}

const TONG_QUAN_TRANG_THAI = [
  { ma: 'TRONG', nhan: 'Trống' },
  { ma: 'DANG_THUE', nhan: 'Đang thuê' },
  { ma: 'DANG_SUA', nhan: 'Đang sửa' },
] as const

type BieuMauPhong = {
  soPhong: string
  tang: string
  dienTich: string
  sucChua: string
  giaThueMacDinh: string
  loaiPhong: string
}

const BIEU_MAU_PHONG_MAC_DINH: BieuMauPhong = {
  soPhong: '',
  tang: '1',
  dienTich: '20.00',
  sucChua: '2',
  giaThueMacDinh: '0.00',
  loaiPhong: '',
}

const styleEyebrow: CSSProperties = {
  margin: '0 0 var(--ma-space-2)',
  color: 'var(--ma-text-secondary)',
  font: 'var(--ma-text-syslabel)',
  letterSpacing: 'var(--ma-tracking-navgroup)',
}

const styleDanhMucPhong: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--ma-space-6)',
  minWidth: 0,
  width: '100%',
  maxWidth: '80rem',
  margin: '0 auto',
  padding: 'clamp(var(--ma-space-4), 3vw, var(--ma-space-8))',
  fontFamily: 'var(--ma-font-ui)',
  color: 'var(--ma-text-primary)',
}

const styleTieuDeManHinh: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 'var(--ma-space-4)',
  minWidth: 0,
  paddingBottom: 'var(--ma-space-5)',
  borderBottom: 'var(--ma-border-width-rule) solid var(--ma-ink-900)',
}

const styleHangBoLoc: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 14rem), 1fr))',
  gap: 'var(--ma-space-4)',
  minWidth: 0,
}

const styleNhanTruong: CSSProperties = {
  display: 'grid',
  gap: 'var(--ma-space-2)',
  minWidth: 0,
  color: 'var(--ma-text-primary)',
  font: 'var(--ma-text-body)',
}

const styleOTruong: CSSProperties = {
  width: '100%',
  minWidth: 0,
  minHeight: 'var(--ma-hit-mobile)',
  padding: 'var(--ma-space-3) var(--ma-space-4)',
  border: 'var(--ma-border-width) solid var(--ma-border-strong)',
  borderRadius: 'var(--ma-radius)',
  background: 'var(--ma-bg-card)',
  color: 'var(--ma-text-primary)',
  font: 'var(--ma-text-body)',
}

const styleBoCucHaiCot: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 30rem), 1fr))',
  gap: 'var(--ma-space-6)',
  minWidth: 0,
  alignItems: 'start',
}

const styleCotDanhSach: CSSProperties = {
  display: 'grid',
  gap: 'var(--ma-space-5)',
  minWidth: 0,
  alignContent: 'start',
}

const styleCotChiTiet: CSSProperties = {
  display: 'grid',
  gap: 'var(--ma-space-5)',
  minWidth: 0,
  alignContent: 'start',
}

const styleTamThe: CSSProperties = {
  display: 'grid',
  gap: 'var(--ma-space-4)',
  minWidth: 0,
  padding: 'var(--ma-space-6)',
  border: 'var(--ma-border-width) solid var(--ma-border-default)',
  background: 'var(--ma-bg-card)',
}

const styleHangBieuMau: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 14rem), 1fr))',
  gap: 'var(--ma-space-4)',
  minWidth: 0,
}

const styleHangHanhDong: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: 'var(--ma-space-3)',
  minWidth: 0,
}

const styleGoiYBieuMau: CSSProperties = {
  flex: '1 1 14rem',
  minWidth: 0,
  margin: 0,
  color: 'var(--ma-text-secondary)',
  font: 'var(--ma-text-caption)',
}

const styleThongBao: CSSProperties = {
  margin: 0,
  minWidth: 0,
  color: 'var(--ma-text-secondary)',
  font: 'var(--ma-text-body)',
  lineHeight: 1.5,
}

const styleSoDoPhong: CSSProperties = {
  display: 'grid',
  gap: 'var(--ma-space-3)',
  minWidth: 0,
  overflow: 'hidden',
  padding: 'var(--ma-space-6)',
  border: 'var(--ma-border-width) solid var(--ma-border-default)',
  background: 'var(--ma-bg-card)',
}

const styleNhomTrangThai: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 9rem), 1fr))',
  gap: 'var(--ma-space-3)',
  minWidth: 0,
}

const styleMucTrangThai: CSSProperties = {
  display: 'grid',
  gap: 'var(--ma-space-2)',
  minWidth: 0,
  padding: 'var(--ma-space-4)',
  border: 'var(--ma-border-width) solid var(--ma-border-default)',
  background: 'var(--ma-bg-sunken)',
  color: 'var(--ma-text-primary)',
}

const styleSuKienPhong: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 'var(--ma-space-3)',
  minWidth: 0,
}

const styleThongTinPhong: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 12rem), 1fr))',
  gap: 'var(--ma-space-4)',
  minWidth: 0,
  margin: 0,
}

const styleDongThongTinPhong: CSSProperties = {
  display: 'grid',
  gap: 'var(--ma-space-1)',
  minWidth: 0,
  paddingTop: 'var(--ma-space-3)',
  borderTop: 'var(--ma-border-width) solid var(--ma-border-subtle)',
}

const styleNhanThongTinPhong: CSSProperties = {
  color: 'var(--ma-text-secondary)',
  font: 'var(--ma-text-caption)',
}

const styleGiaTriThongTinPhong: CSSProperties = {
  minWidth: 0,
  margin: 0,
  color: 'var(--ma-text-primary)',
  font: 'var(--ma-text-body)',
  overflowWrap: 'anywhere',
}

export default function DanhMucPhong({ token }: Props) {
  const [danhSachToa, setDanhSachToa] = useState<ThongTinToaNha[]>([])
  const [toaDangChonId, setToaDangChonId] = useState<number | null>(null)
  const [tangLoc, setTangLoc] = useState('')
  const [danhSachPhong, setDanhSachPhong] = useState<ThongTinPhong[]>([])
  const [dangTai, setDangTai] = useState(true)
  const [dangTaiPhong, setDangTaiPhong] = useState(false)
  const [dangLuu, setDangLuu] = useState(false)
  const [dangXuLyHangLoat, setDangXuLyHangLoat] = useState(false)
  const [loi, setLoi] = useState<string | null>(null)
  const [thongBao, setThongBao] = useState<string | null>(null)
  const [phongDangXemId, setPhongDangXemId] = useState<number | null>(null)
  const [bieuMauPhong, setBieuMauPhong] = useState<BieuMauPhong>(BIEU_MAU_PHONG_MAC_DINH)
  const [hienBieuMauHangLoat, setHienBieuMauHangLoat] = useState(false)
  const [bieuMauHangLoat, setBieuMauHangLoat] = useState({
    soBatDau: '',
    soKetThuc: '',
    tang: '1',
    dienTich: '20.00',
    sucChua: '2',
    giaThueMacDinh: '0.00',
    loaiPhong: '',
  })
  const [xemTruoc, setXemTruoc] = useState<ThongTinPhong[]>([])
  const [yeuCauPhongHangLoatDaXemTruoc, setYeuCauPhongHangLoatDaXemTruoc] = useState<YeuCauPhongHangLoat | null>(null)
  const dangXuLyHangLoatRef = useRef(false)

  const toaDangChon = danhSachToa.find((item) => item.id === toaDangChonId) ?? null
  const nhomPhongTheoTang = taoNhomPhongTheoTang(danhSachPhong)
  const phongDangXem = danhSachPhong.find((phong) => phong.id === phongDangXemId) ?? null
  const floors = nhomPhongTheoTang.map(({ tang, phong }) => ({
    name: `T${tang}`,
    rooms: phong.map((item) => {
      const status = layThongTinTrangThai(item)
      return {
        room: item.soPhong,
        state: layTrangThaiRoomCell(item.trangThai),
        label: status.nhan,
        className: `${status.lopCss} ${phongDangXem?.id === item.id ? 'room-tile--active' : ''}`,
        'aria-pressed': phongDangXem?.id === item.id,
        onClick: () => setPhongDangXemId(item.id),
      }
    }),
  }))

  useEffect(() => {
    let mounted = true
    setDangTai(true)
    setLoi(null)

    fetchToaNha(token)
      .then((toaNha) => {
        if (!mounted) return
        setDanhSachToa(toaNha)
        setToaDangChonId((current) => current ?? toaNha[0]?.id ?? null)
      })
      .catch((reason: unknown) => {
        if (!mounted) return
        setLoi(thongBaoLoi(reason, 'Không thể tải danh sách toà nhà.'))
      })
      .finally(() => {
        if (mounted) setDangTai(false)
      })

    return () => {
      mounted = false
    }
  }, [token])

  useEffect(() => {
    if (!toaDangChonId) {
      setDanhSachPhong([])
      return
    }

    let mounted = true
    setDangTaiPhong(true)
    setLoi(null)

    fetchPhong(token, toaDangChonId, tangLoc ? Number(tangLoc) : undefined)
      .then((phong) => {
        if (mounted) setDanhSachPhong(phong)
      })
      .catch((reason: unknown) => {
        if (!mounted) return
        setLoi(thongBaoLoi(reason, 'Không thể tải danh sách phòng.'))
      })
      .finally(() => {
        if (mounted) setDangTaiPhong(false)
      })

    return () => {
      mounted = false
    }
  }, [token, toaDangChonId, tangLoc])

  useEffect(() => {
    if (phongDangXemId === null) {
      return
    }

    const vanConTrongDanhSach = danhSachPhong.some((phong) => phong.id === phongDangXemId)
    if (!vanConTrongDanhSach) {
      setPhongDangXemId(null)
    }
  }, [danhSachPhong, phongDangXemId])

  async function handleTaoPhong(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!toaDangChonId) return

    setDangLuu(true)
    setLoi(null)
    setThongBao(null)

    try {
      const payload = chuyenThanhYeuCauPhong(bieuMauPhong)
      const phongMoi = await taoPhong(token, toaDangChonId, payload)
      setDanhSachPhong((current) => (
        phongThuocBoLoc(phongMoi, tangLoc) ? [...current, phongMoi].sort(soSanhPhong) : current
      ))
      setBieuMauPhong({ ...BIEU_MAU_PHONG_MAC_DINH, tang: bieuMauPhong.tang })
      setThongBao(`Đã khai báo phòng ${phongMoi.soPhong}.`)
    } catch (reason: unknown) {
      setLoi(thongBaoLoi(reason, 'Không thể lưu phòng.'))
    } finally {
      setDangLuu(false)
    }
  }

  async function handleXemTruocHangLoat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!toaDangChonId) return

    setDangXuLyHangLoat(true)
    setLoi(null)
    setThongBao(null)

    try {
      const payload = chuyenThanhYeuCauPhongHangLoat(bieuMauHangLoat)
      const ketQua = await xemTruocPhongHangLoat(token, toaDangChonId, payload)
      setXemTruoc(ketQua.phong)
      setYeuCauPhongHangLoatDaXemTruoc(payload)
    } catch (reason: unknown) {
      setXemTruoc([])
      setYeuCauPhongHangLoatDaXemTruoc(null)
      setLoi(thongBaoLoi(reason, 'Không thể xem trước dãy phòng.'))
    } finally {
      setDangXuLyHangLoat(false)
    }
  }

  async function handleXacNhanHangLoat() {
    if (!toaDangChonId || xemTruoc.length === 0 || !yeuCauPhongHangLoatDaXemTruoc) return
    if (dangXuLyHangLoatRef.current) return

    dangXuLyHangLoatRef.current = true
    setDangXuLyHangLoat(true)
    setLoi(null)
    setThongBao(null)

    try {
      const payload = yeuCauPhongHangLoatDaXemTruoc
      const ketQua = await taoPhongHangLoat(token, toaDangChonId, payload)
      setDanhSachPhong((current) => (
        [...current, ...ketQua.phong.filter((phong) => phongThuocBoLoc(phong, tangLoc))].sort(soSanhPhong)
      ))
      setThongBao(`Đã tạo dãy phòng ${payload.soBatDau} - ${payload.soKetThuc}.`)
      setXemTruoc([])
      setYeuCauPhongHangLoatDaXemTruoc(null)
      setBieuMauHangLoat((current) => ({
        ...current,
        soBatDau: '',
        soKetThuc: '',
      }))
    } catch (reason: unknown) {
      setLoi(thongBaoLoi(reason, 'Không thể tạo dãy phòng.'))
    } finally {
      dangXuLyHangLoatRef.current = false
      setDangXuLyHangLoat(false)
    }
  }

  return (
    <section className="building-management room-management" data-testid="room-catalog" aria-labelledby="room-management-title" style={styleDanhMucPhong}>
      <div className="building-management__heading" style={styleTieuDeManHinh}>
        <div>
          <p className="eyebrow" style={styleEyebrow}>FR-BLD-02</p>
          <h3 id="room-management-title" style={{ margin: 0, font: 'var(--ma-text-block-title)' }}>Danh mục phòng</h3>
        </div>
        <Button type="button" variant="secondary" onClick={() => setHienBieuMauHangLoat((current) => !current)} style={{ minHeight: 44 }}>
          Xem trước dãy phòng
        </Button>
      </div>
      {tangLoc ? <FilterChip active onRemove={() => setTangLoc('')}>Tầng {tangLoc}</FilterChip> : null}

      <p className="status-message" style={styleThongBao}>
        Trạng thái phòng do hệ thống tự ghi. Bạn chỉ khai báo số phòng, tầng, diện tích, sức chứa, giá thuê mặc định và loại phòng.
      </p>

      {loi ? <p className="status-message status-message--error" role="alert" style={{ ...styleThongBao, color: 'var(--ma-urgent)' }}>{loi}</p> : null}
      {thongBao ? <p className="status-message status-message--success" role="status" style={{ ...styleThongBao, color: 'var(--ma-done-text)' }}>{thongBao}</p> : null}

      <div className="building-form__row" style={styleHangBoLoc}>
        <label className="field" style={styleNhanTruong}>
          <span>Toà nhà</span>
          <select
            name="toaNhaId"
            value={toaDangChonId ?? ''}
            onChange={(event) => {
              setToaDangChonId(Number(event.target.value))
              setXemTruoc([])
              setYeuCauPhongHangLoatDaXemTruoc(null)
            }}
            disabled={dangTai || danhSachToa.length === 0}
            style={styleOTruong}
          >
            {danhSachToa.map((toa) => (
              <option key={toa.id} value={toa.id}>
                {toa.ten}
              </option>
            ))}
          </select>
        </label>

        <label className="field" style={styleNhanTruong}>
          <span>Lọc theo tầng</span>
          <select name="tangLoc" value={tangLoc} onChange={(event) => setTangLoc(event.target.value)} disabled={!toaDangChon} style={styleOTruong}>
            <option value="">Tất cả các tầng</option>
            {taoDanhSachTang(toaDangChon?.soTang ?? 0).map((soTang) => (
              <option key={soTang} value={soTang}>
                Tầng {soTang}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="building-layout" style={styleBoCucHaiCot}>
        <div className="building-list" style={styleCotDanhSach}>
          {dangTai || dangTaiPhong ? (
            <p className="status-message" aria-live="polite" style={styleThongBao}>Đang tải danh sách phòng…</p>
          ) : danhSachPhong.length === 0 ? (
            <EmptyState kind={tangLoc ? "filtered" : "first"} title={tangLoc ? `Không có phòng nào ở tầng ${tangLoc}.` : "Toà này chưa có phòng nào."} filters={tangLoc ? <FilterChip active onRemove={() => setTangLoc('')}>Tầng {tangLoc}</FilterChip> : undefined} />
          ) : (
            <>
              <StatStrip stats={[{ label: 'TỔNG PHÒNG', value: danhSachPhong.length }, { label: 'TRỐNG', value: demPhongTheoTrangThai(danhSachPhong, 'TRONG') }, { label: 'ĐANG THUÊ', value: demPhongTheoTrangThai(danhSachPhong, 'DANG_THUE') }]} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 7rem), 1fr))', minWidth: 0 }} />
              <section className="building-summary room-status-summary" aria-labelledby="room-status-summary-title" style={styleTamThe}>
                <div className="building-summary__heading" style={styleSuKienPhong}>
                  <div>
                    <p className="eyebrow" style={styleEyebrow}>FR-BLD-03</p>
                    <h4 id="room-status-summary-title" style={{ margin: 0, font: 'var(--ma-text-task-name)' }}>Tổng quan sơ đồ phòng</h4>
                  </div>
                  <span className="room-status-summary__total" style={{ color: 'var(--ma-text-secondary)', font: 'var(--ma-text-caption)' }}>{danhSachPhong.length} phòng</span>
                </div>
                <div className="room-status-summary__grid" style={styleNhomTrangThai}>
                  {TONG_QUAN_TRANG_THAI.map((muc) => (
                    <article key={muc.ma} className={`room-status-chip room-status-chip--${muc.ma.toLowerCase()}`} style={{ ...styleMucTrangThai, ...(muc.ma === 'DANG_THUE' ? { background: 'var(--ma-done-bg)', color: 'var(--ma-done-text)' } : muc.ma === 'DANG_SUA' ? { background: 'var(--ma-urgent-bg)', color: 'var(--ma-urgent)' } : {}) }}>
                      <span style={{ font: 'var(--ma-text-caption)' }}>{muc.nhan}</span>
                      <strong style={{ font: 'var(--ma-text-figure-sm)' }}>{demPhongTheoTrangThai(danhSachPhong, muc.ma)}</strong>
                    </article>
                  ))}
                </div>
              </section>

              <section className="room-floor-map" data-testid="room-floor-map" aria-label="Sơ đồ phòng theo tầng" style={styleSoDoPhong}>
                <BuildingSection label={`Mặt cắt ${toaDangChon?.ten ?? ''} · ${danhSachPhong.length} phòng`} columns={3} floors={floors} />
              </section>
            </>
          )}
        </div>

        <div className="building-detail" style={styleCotChiTiet}>
          <section className="building-summary room-detail" data-testid="room-detail" aria-live="polite" style={styleTamThe}>
            {phongDangXem ? (
              <>
                <div className="building-summary__heading" style={styleSuKienPhong}>
                  <div>
                    <p className="eyebrow" style={styleEyebrow}>FR-BLD-03</p>
                    <h4 style={{ margin: 0, font: 'var(--ma-text-task-name)' }}>Chi tiết phòng {phongDangXem.soPhong}</h4>
                  </div>
                  <span className={`room-detail__status ${layThongTinTrangThai(phongDangXem).lopCss.replace('room-tile', 'room-detail__status')}`} style={styleTrangThaiPhong(phongDangXem.trangThai)}>
                    {layThongTinTrangThai(phongDangXem).nhan}
                  </span>
                </div>
                <dl className="building-summary__facts" style={styleThongTinPhong}>
                  <div style={styleDongThongTinPhong}>
                    <dt style={styleNhanThongTinPhong}>Tầng</dt>
                    <dd style={styleGiaTriThongTinPhong}>{phongDangXem.tang}</dd>
                  </div>
                  <div style={styleDongThongTinPhong}>
                    <dt style={styleNhanThongTinPhong}>Loại phòng</dt>
                    <dd style={styleGiaTriThongTinPhong}>{phongDangXem.loaiPhong}</dd>
                  </div>
                  <div style={styleDongThongTinPhong}>
                    <dt style={styleNhanThongTinPhong}>Diện tích</dt>
                    <dd style={styleGiaTriThongTinPhong}>{phongDangXem.dienTich} m²</dd>
                  </div>
                  <div style={styleDongThongTinPhong}>
                    <dt style={styleNhanThongTinPhong}>Sức chứa</dt>
                    <dd style={styleGiaTriThongTinPhong}>{phongDangXem.sucChua} người</dd>
                  </div>
                  <div style={styleDongThongTinPhong}>
                    <dt style={styleNhanThongTinPhong}>Giá thuê mặc định</dt>
                    <dd style={styleGiaTriThongTinPhong}>{phongDangXem.giaThueMacDinh}</dd>
                  </div>
                </dl>
                <p className="status-message" style={styleThongBao}>
                  Chi tiết lấy trực tiếp từ danh sách phòng hiện có.
                </p>
              </>
            ) : (
              <>
                <div>
                  <p className="eyebrow" style={styleEyebrow}>FR-BLD-03</p>
                  <h4 style={{ margin: 0, font: 'var(--ma-text-task-name)' }}>Chi tiết phòng</h4>
                </div>
                <p className="status-message" style={styleThongBao}>Chọn một ô phòng trong sơ đồ để xem chi tiết hiện tại của phòng đó.</p>
              </>
            )}
          </section>

          <form className="building-form" data-testid="room-form" onSubmit={handleTaoPhong} style={styleTamThe}>
            <div>
              <p className="eyebrow" style={styleEyebrow}>FR-BLD-02</p>
              <h4 style={{ margin: 0, font: 'var(--ma-text-task-name)' }}>Khai báo một phòng</h4>
            </div>

            <div className="building-form__row" style={styleHangBieuMau}>
              <label className="field" style={styleNhanTruong}>
                <span>Số phòng</span>
                <input name="soPhong" value={bieuMauPhong.soPhong} onChange={(event) => capNhatBieuMauPhong('soPhong', event.target.value)} required style={styleOTruong} />
              </label>

              <label className="field" style={styleNhanTruong}>
                <span>Tầng</span>
                <input type="number" min="1" name="tang" value={bieuMauPhong.tang} onChange={(event) => capNhatBieuMauPhong('tang', event.target.value)} required style={styleOTruong} />
              </label>
            </div>

            <div className="building-form__row" style={styleHangBieuMau}>
              <label className="field" style={styleNhanTruong}>
                <span>Diện tích</span>
                <input type="number" min="0.01" step="0.01" name="dienTich" value={bieuMauPhong.dienTich} onChange={(event) => capNhatBieuMauPhong('dienTich', event.target.value)} required style={styleOTruong} />
              </label>

              <label className="field" style={styleNhanTruong}>
                <span>Sức chứa</span>
                <input type="number" min="1" name="sucChua" value={bieuMauPhong.sucChua} onChange={(event) => capNhatBieuMauPhong('sucChua', event.target.value)} required style={styleOTruong} />
              </label>
            </div>

            <div className="building-form__row" style={styleHangBieuMau}>
              <label className="field" style={styleNhanTruong}>
                <span>Giá thuê mặc định</span>
                <input type="number" min="0" step="0.01" name="giaThueMacDinh" value={bieuMauPhong.giaThueMacDinh} onChange={(event) => capNhatBieuMauPhong('giaThueMacDinh', event.target.value)} required style={styleOTruong} />
              </label>

              <label className="field" style={styleNhanTruong}>
                <span>Loại phòng</span>
                <input name="loaiPhong" value={bieuMauPhong.loaiPhong} onChange={(event) => capNhatBieuMauPhong('loaiPhong', event.target.value)} required style={styleOTruong} />
              </label>
            </div>

            <div className="building-form__actions" style={styleHangHanhDong}>
              <p className="building-form__hint" style={styleGoiYBieuMau}>Máy chủ sẽ tự gán trạng thái ban đầu là Trống.</p>
              <Button type="submit" blocked={dangLuu || !toaDangChonId} style={{ minHeight: 44 }}>
                {dangLuu ? 'Đang lưu…' : 'Khai báo phòng'}
              </Button>
            </div>
          </form>

          {hienBieuMauHangLoat ? (
            <form className="building-form" data-testid="room-batch-form" onSubmit={handleXemTruocHangLoat} style={styleTamThe}>
              <div>
                <p className="eyebrow" style={styleEyebrow}>FR-BLD-02</p>
                <h4 style={{ margin: 0, font: 'var(--ma-text-task-name)' }}>Tạo nhanh dãy phòng</h4>
              </div>

              <div className="building-form__row" style={styleHangBieuMau}>
                <label className="field" style={styleNhanTruong}>
                  <span>Số bắt đầu</span>
                  <input name="soBatDau" value={bieuMauHangLoat.soBatDau} onChange={(event) => capNhatBieuMauHangLoat('soBatDau', event.target.value)} required style={styleOTruong} />
                </label>

                <label className="field" style={styleNhanTruong}>
                  <span>Số kết thúc</span>
                  <input name="soKetThuc" value={bieuMauHangLoat.soKetThuc} onChange={(event) => capNhatBieuMauHangLoat('soKetThuc', event.target.value)} required style={styleOTruong} />
                </label>
              </div>

              <div className="building-form__row" style={styleHangBieuMau}>
                <label className="field" style={styleNhanTruong}>
                  <span>Tầng</span>
                  <input type="number" min="1" name="tang" value={bieuMauHangLoat.tang} onChange={(event) => capNhatBieuMauHangLoat('tang', event.target.value)} required style={styleOTruong} />
                </label>

                <label className="field" style={styleNhanTruong}>
                  <span>Diện tích</span>
                  <input type="number" min="0.01" step="0.01" name="dienTich" value={bieuMauHangLoat.dienTich} onChange={(event) => capNhatBieuMauHangLoat('dienTich', event.target.value)} required style={styleOTruong} />
                </label>
              </div>

              <div className="building-form__row" style={styleHangBieuMau}>
                <label className="field" style={styleNhanTruong}>
                  <span>Sức chứa</span>
                  <input type="number" min="1" name="sucChua" value={bieuMauHangLoat.sucChua} onChange={(event) => capNhatBieuMauHangLoat('sucChua', event.target.value)} required style={styleOTruong} />
                </label>

                <label className="field" style={styleNhanTruong}>
                  <span>Giá thuê mặc định</span>
                  <input type="number" min="0" step="0.01" name="giaThueMacDinh" value={bieuMauHangLoat.giaThueMacDinh} onChange={(event) => capNhatBieuMauHangLoat('giaThueMacDinh', event.target.value)} required style={styleOTruong} />
                </label>
              </div>

              <label className="field" style={styleNhanTruong}>
                <span>Loại phòng</span>
                <input name="loaiPhong" value={bieuMauHangLoat.loaiPhong} onChange={(event) => capNhatBieuMauHangLoat('loaiPhong', event.target.value)} required style={styleOTruong} />
              </label>

              <div className="building-form__actions" style={styleHangHanhDong}>
                <Button type="submit" variant="secondary" blocked={dangXuLyHangLoat || !toaDangChonId} style={{ minHeight: 44 }}>
                  {dangXuLyHangLoat ? 'Đang xem trước…' : 'Xem trước'}
                </Button>
                {xemTruoc.length > 0 ? (
                  <ConfirmDialog title="Tạo dãy phòng?" consequence={`Sẽ tạo ${xemTruoc.length} phòng, từ số ${yeuCauPhongHangLoatDaXemTruoc?.soBatDau} đến số ${yeuCauPhongHangLoatDaXemTruoc?.soKetThuc}.`} confirmLabel="Xác nhận tạo dãy phòng" onConfirm={handleXacNhanHangLoat} onCancel={() => { setXemTruoc([]); setYeuCauPhongHangLoatDaXemTruoc(null) }} style={{ width: '100%', maxWidth: '100%', minWidth: 0, flex: '1 1 18rem' }} />
                ) : null}
              </div>

              {xemTruoc.length > 0 ? (
                <p className="status-message" style={styleThongBao}>
                  {xemTruoc.map((phong) => phong.soPhong).join(', ')}
                </p>
              ) : null}
            </form>
          ) : null}
        </div>
      </div>
    </section>
  )

  function capNhatBieuMauPhong(tenTruong: keyof BieuMauPhong, giaTri: string) {
    setBieuMauPhong((current) => ({ ...current, [tenTruong]: giaTri }))
  }

  function capNhatBieuMauHangLoat(tenTruong: keyof typeof bieuMauHangLoat, giaTri: string) {
    setBieuMauHangLoat((current) => ({ ...current, [tenTruong]: giaTri }))
  }
}

function taoDanhSachTang(soTang: number) {
  return Array.from({ length: soTang }, (_, index) => index + 1)
}

function chuyenThanhYeuCauPhong(bieuMau: BieuMauPhong): YeuCauPhong {
  return {
    soPhong: bieuMau.soPhong,
    tang: Number(bieuMau.tang),
    dienTich: bieuMau.dienTich,
    sucChua: Number(bieuMau.sucChua),
    giaThueMacDinh: bieuMau.giaThueMacDinh,
    loaiPhong: bieuMau.loaiPhong,
  }
}

function chuyenThanhYeuCauPhongHangLoat(
  bieuMau: {
    soBatDau: string
    soKetThuc: string
    tang: string
    dienTich: string
    sucChua: string
    giaThueMacDinh: string
    loaiPhong: string
  },
): YeuCauPhongHangLoat {
  return {
    soBatDau: bieuMau.soBatDau,
    soKetThuc: bieuMau.soKetThuc,
    tang: Number(bieuMau.tang),
    dienTich: bieuMau.dienTich,
    sucChua: Number(bieuMau.sucChua),
    giaThueMacDinh: bieuMau.giaThueMacDinh,
    loaiPhong: bieuMau.loaiPhong,
  }
}

function thongBaoLoi(reason: unknown, fallbackMessage: string) {
  return reason instanceof ApiError ? reason.message : reason instanceof Error ? reason.message : fallbackMessage
}

function soSanhPhong(a: ThongTinPhong, b: ThongTinPhong) {
  if (a.tang !== b.tang) {
    return a.tang - b.tang
  }
  return a.soPhong.localeCompare(b.soPhong)
}

function phongThuocBoLoc(phong: ThongTinPhong, tangLoc: string) {
  return tangLoc === '' || phong.tang === Number(tangLoc)
}

function taoNhomPhongTheoTang(danhSachPhong: ThongTinPhong[]) {
  const phongTheoTang = new Map<number, ThongTinPhong[]>()

  for (const phong of danhSachPhong) {
    const danhSach = phongTheoTang.get(phong.tang) ?? []
    danhSach.push(phong)
    phongTheoTang.set(phong.tang, danhSach)
  }

  return [...phongTheoTang.entries()]
    .sort(([tangA], [tangB]) => tangB - tangA)
    .map(([tang, phong]) => ({
      tang,
      phong: [...phong].sort(soSanhPhong),
    }))
}

function layThongTinTrangThai(phong: ThongTinPhong) {
  const macDinh = TRANG_THAI_PHONG_HIEN_THI[phong.trangThai] ?? { nhan: phong.tenTrangThai, lopCss: 'room-tile--trong' }
  return {
    nhan: phong.tenTrangThai || macDinh.nhan,
    lopCss: macDinh.lopCss,
  }
}

function layTrangThaiRoomCell(trangThai: string) {
  switch (trangThai) {
    case 'TRONG':
      return 'vacant' as const
    case 'DANG_SUA':
      return 'repair' as const
    case 'DA_COC':
      return 'reserved' as const
    case 'DANG_THUE':
      return 'occupied' as const
    case 'NGUNG':
      return 'stopped' as const
    default:
      return 'recorded' as const
  }
}

function styleTrangThaiPhong(trangThai: string): CSSProperties {
  const styleChung: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'var(--ma-hit-mobile)',
    padding: 'var(--ma-space-2) var(--ma-space-3)',
    border: 'var(--ma-border-width) solid var(--ma-border-default)',
    background: 'var(--ma-bg-sunken)',
    color: 'var(--ma-text-secondary)',
    font: 'var(--ma-text-caption)',
  }

  if (trangThai === 'DANG_THUE') {
    return { ...styleChung, background: 'var(--ma-done-bg)', color: 'var(--ma-done-text)' }
  }
  if (trangThai === 'DANG_SUA') {
    return { ...styleChung, background: 'var(--ma-urgent-bg)', color: 'var(--ma-urgent)' }
  }
  if (trangThai === 'DA_COC') {
    return { ...styleChung, background: 'var(--ma-bg-card)', color: 'var(--ma-waiting)', borderColor: 'var(--ma-waiting-border)' }
  }
  if (trangThai === 'NGUNG') {
    return { ...styleChung, background: 'var(--ma-bg-sunken)', color: 'var(--ma-text-disabled)' }
  }
  return styleChung
}

function demPhongTheoTrangThai(danhSachPhong: ThongTinPhong[], trangThai: string) {
  return danhSachPhong.filter((phong) => phong.trangThai === trangThai).length
}
