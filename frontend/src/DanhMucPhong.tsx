import { useEffect, useRef, useState, type FormEvent } from 'react'
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
import { Icon } from './design/core/Icon'
import { StatusTag, type StatusTagProps } from './design/core/StatusTag'
import { dinhDangTien } from './design/core/format'
import { BuildingSection } from './design/building/BuildingSection'
import { RoomCell } from './design/building/RoomCell'
import { ConfirmDialog } from './design/feedback/ConfirmDialog'
import { EmptyState } from './design/feedback/EmptyState'
import { Field } from './design/forms/Field'
import { FilterChip } from './design/forms/FilterChip'
import { Card } from './design/layout/Card'
import { DataTable, type DataTableChip, type DataTableColumn } from './design/table/DataTable'
import QuanLyLichHen from './QuanLyLichHen'
import QuanLyTaiSanPhong from './QuanLyTaiSanPhong'
import { CSS_BANG_QUAN_TRI } from './bangQuanTriChung'

type Props = {
  token: string
  mobile?: boolean
}

const TRANG_THAI_PHONG_HIEN_THI: Record<string, { nhan: string; lopCss: string }> = {
  TRONG: { nhan: 'Trống', lopCss: 'room-tile--trong' },
  DA_COC: { nhan: 'Đã đặt cọc', lopCss: 'room-tile--da_coc' },
  DANG_THUE: { nhan: 'Đang thuê', lopCss: 'room-tile--dang_thue' },
  DANG_SUA: { nhan: 'Đang sửa', lopCss: 'room-tile--dang_sua' },
  NGUNG: { nhan: 'Ngừng', lopCss: 'room-tile--ngung' },
}

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


type TruongForm = { ten: string; nhan: string; kieu?: string; min?: string; step?: string }
const TRUONG_PHONG: readonly TruongForm[] = [
  { ten: 'soPhong', nhan: 'Số phòng' },
  { ten: 'tang', nhan: 'Tầng', kieu: 'number', min: '1' },
  { ten: 'dienTich', nhan: 'Diện tích', kieu: 'number', min: '0.01', step: '0.01' },
  { ten: 'sucChua', nhan: 'Sức chứa', kieu: 'number', min: '1' },
  { ten: 'giaThueMacDinh', nhan: 'Giá thuê mặc định', kieu: 'number', min: '0', step: '0.01' },
  { ten: 'loaiPhong', nhan: 'Loại phòng' },
]
const TRUONG_HANG_LOAT: readonly TruongForm[] = [
  { ten: 'soBatDau', nhan: 'Số bắt đầu' },
  { ten: 'soKetThuc', nhan: 'Số kết thúc' },
  ...TRUONG_PHONG.filter((t) => t.ten !== 'soPhong'),
]
const SAC_THAI_PHONG: Record<string, NonNullable<StatusTagProps['tone']>> = { TRONG: 'neutral', DA_COC: 'waiting', DANG_THUE: 'done', DANG_SUA: 'urgent', NGUNG: 'closed' }
const CSS_PHONG = `.dp-hang-loc { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px; }
.dp-hang-loc .field { min-width: 220px; }
@media (max-width: 767px) { .dp-hang-loc .field { min-width: 0; flex: 1 1 100%; } }
@media (min-width: 1100px) { .building-layout { grid-template-columns: minmax(0, 1fr) !important; } }
.dp-bang .bq-toa { max-width: 22ch; }`

const MAU_PHONG_GOI_Y = [
  { nhan: 'Mẫu Studio (22m² · 4tr)', dienTich: '22.00', sucChua: '2', giaThue: '4000000', loai: 'Phòng Studio khép kín' },
  { nhan: 'Mẫu 1 Phòng ngủ (32m² · 5.5tr)', dienTich: '32.00', sucChua: '2', giaThue: '5500000', loai: '1 Phòng ngủ riêng' },
  { nhan: 'Mẫu Gác lửng (26m² · 4.8tr)', dienTich: '26.00', sucChua: '3', giaThue: '4800000', loai: 'Gác lửng Duplex' },
  { nhan: 'Mẫu Căn 2PN (45m² · 7.5tr)', dienTich: '45.00', sucChua: '4', giaThue: '7500000', loai: 'Căn hộ 2PN' },
] as const

const DAY_PHONG_GOI_Y = [
  { nhan: 'Dãy T1 (6 phòng)', tang: '1', soBatDau: '101', soKetThuc: '106' },
  { nhan: 'Dãy T2 (6 phòng)', tang: '2', soBatDau: '201', soKetThuc: '206' },
  { nhan: 'Dãy T3 (6 phòng)', tang: '3', soBatDau: '301', soKetThuc: '306' },
  { nhan: 'Dãy T4 (6 phòng)', tang: '4', soBatDau: '401', soKetThuc: '406' },
] as const

export default function DanhMucPhong({ token, mobile = false }: Props) {
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
  const [tabXem, setTabXem] = useState<'PHONG' | 'LICH_HEN'>('PHONG')
  const dangXuLyHangLoatRef = useRef(false)
  const [kieuXem, setKieuXem] = useState<'bang' | 'so-do'>('bang')
  const formPhongRef = useRef<HTMLFormElement>(null)

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

  const cotPhong: DataTableColumn<ThongTinPhong>[] = [
    { key: 'phong', label: 'Phòng', sortable: true, sortValue: (item) => item.tang * 100000 + (Number.parseInt(item.soPhong, 10) || 0), render: (item) => <div><div className="td-main">{item.soPhong}</div><div className="td-sub">Tầng {item.tang}</div></div> },
    { key: 'loai', label: 'Loại phòng', sortable: true, sortValue: (item) => item.loaiPhong, render: (item) => <span className="bq-toa" title={item.loaiPhong}>{item.loaiPhong}</span> },
    { key: 'dienTich', label: 'Diện tích', align: 'num', sortable: true, sortValue: (item) => Number(item.dienTich), render: (item) => `${item.dienTich} m²` },
    { key: 'sucChua', label: 'Sức chứa', align: 'num', sortable: true, sortValue: (item) => item.sucChua, render: (item) => `${item.sucChua} người` },
    { key: 'gia', label: 'Giá thuê mặc định', align: 'num', sortable: true, sortValue: (item) => Number(item.giaThueMacDinh), render: (item) => <span className="t-money">{dinhDangTien(item.giaThueMacDinh)} ₫</span> },
    { key: 'trangThai', label: 'Trạng thái', render: (item) => <StatusTag tone={SAC_THAI_PHONG[item.trangThai] ?? 'neutral'}>{layThongTinTrangThai(item).nhan}</StatusTag> },
    { key: 'thaoTac', label: 'Thao tác', align: 'num', the: 'hanh-dong', render: (item) => <div className="td-acts"><button type="button" className="btn btn-ghost btn-sm" aria-pressed={phongDangXemId === item.id} onClick={() => setPhongDangXemId(item.id)}>Xem chi tiết<span className="sr-only"> phòng {item.soPhong}</span></button></div> },
  ]
  const chipPhong: DataTableChip<ThongTinPhong>[] = [
    { key: 'TAT_CA', label: 'Tất cả', match: () => true },
    ...Object.entries(TRANG_THAI_PHONG_HIEN_THI)
      .map(([ma, hienThi]) => ({ key: ma, label: hienThi.nhan, match: (item: ThongTinPhong) => item.trangThai === ma }))
      .filter((chip) => danhSachPhong.some(chip.match)),
  ]
  const demTrong = demPhongTheoTrangThai(danhSachPhong, 'TRONG')
  const demDangThue = demPhongTheoTrangThai(danhSachPhong, 'DANG_THUE')
  const demDangSua = demPhongTheoTrangThai(danhSachPhong, 'DANG_SUA')
  const lenFormKhaiBao = () => {
    formPhongRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
    formPhongRef.current?.querySelector<HTMLInputElement>('input[name="soPhong"]')?.focus()
  }
  const truongPhong = (bieuMau: Record<string, string>, capNhat: (ten: never, giaTri: string) => void, truong: readonly TruongForm[]) => truong.map((t) => (
    <Field key={t.ten} label={t.nhan}>
      <input className="input" name={t.ten} type={t.kieu} min={t.min} step={t.step} value={bieuMau[t.ten]} onChange={(event) => capNhat(t.ten as never, event.target.value)} required />
    </Field>
  ))

  return (
    <section
      className={`building-management room-management room-management--${mobile ? 'mobile' : 'desktop'}`}
      data-testid="room-catalog"
      data-layout-variant={mobile ? 'mobile' : 'desktop'}
      aria-labelledby="room-management-title"
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ma-space-6)', minWidth: 0 }}
    >
      <style>{CSS_BANG_QUAN_TRI + CSS_PHONG}</style>
      <header className="topbar">
        <div className="title-block">
          <h1 className="h1" id="room-management-title">Phòng</h1>
          <p className="sub">{tabXem === 'PHONG' ? `${danhSachPhong.length} phòng${toaDangChon ? ` · ${toaDangChon.ten}` : ''} · ${demTrong} trống · ${demDangThue} đang thuê · ${demDangSua} đang sửa` : 'Lịch hẹn khách xem phòng'}</p>
        </div>
        {tabXem === 'PHONG' && (
          <div className="topbar-actions">
            <Button type="button" variant="secondary" onClick={() => setHienBieuMauHangLoat((current) => !current)}>Xem trước dãy phòng</Button>
            <Button type="button" onClick={lenFormKhaiBao}><Icon name="plus" />Khai báo phòng mới</Button>
          </div>
        )}
      </header>

      <div className="row-wrap">
        <button type="button" className="chip" aria-pressed={tabXem === 'PHONG'} onClick={() => setTabXem('PHONG')}><Icon name="door" />Sơ đồ phòng</button>
        <button type="button" className="chip" aria-pressed={tabXem === 'LICH_HEN'} onClick={() => setTabXem('LICH_HEN')} data-testid="tab-lich-hen-xem-phong"><Icon name="calendar" />Lịch hẹn xem phòng</button>
        {tabXem === 'PHONG' && !mobile && (
          <>
            <span className="push" style={{ flex: 1 }} />
            <button type="button" className="chip" aria-pressed={kieuXem === 'bang'} onClick={() => setKieuXem('bang')}>Dạng bảng</button>
            <button type="button" className="chip" aria-pressed={kieuXem === 'so-do'} onClick={() => setKieuXem('so-do')}>Sơ đồ tầng</button>
          </>
        )}
      </div>

      {tabXem === 'LICH_HEN' ? (
        <QuanLyLichHen token={token} mobile={mobile} />
      ) : (
        <>
          {loi ? <p className="alert alert-danger" role="alert"><Icon name="alert" />{loi}</p> : null}
          {thongBao ? <p className="alert alert-success" role="status"><Icon name="check-circle" />{thongBao}</p> : null}

          <div className="dp-hang-loc">
            <Field label="Toà nhà">
              <select
                className="select"
                name="toaNhaId"
                value={toaDangChonId ?? ''}
                onChange={(event) => {
                  setToaDangChonId(Number(event.target.value))
                  setXemTruoc([])
                  setYeuCauPhongHangLoatDaXemTruoc(null)
                }}
                disabled={dangTai || danhSachToa.length === 0}
              >
                {danhSachToa.map((toa) => (
                  <option key={toa.id} value={toa.id}>
                    {toa.ten}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Lọc theo tầng">
              <select className="select" name="tangLoc" value={tangLoc} onChange={(event) => setTangLoc(event.target.value)} disabled={!toaDangChon}>
                <option value="">Tất cả các tầng</option>
                {taoDanhSachTang(toaDangChon?.soTang ?? 0).map((soTang) => (
                  <option key={soTang} value={soTang}>
                    Tầng {soTang}
                  </option>
                ))}
              </select>
            </Field>
            {tangLoc ? <FilterChip active onRemove={() => setTangLoc('')}>Tầng {tangLoc}</FilterChip> : null}
          </div>
          <p className="t-sm" style={{ margin: 0 }}>Trạng thái phòng do hệ thống tự ghi. Bạn chỉ khai báo số phòng, tầng, diện tích, sức chứa, giá thuê mặc định và loại phòng.</p>

          <div className="building-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 30rem), 1fr))', gap: 'var(--ma-space-6)', minWidth: 0 }}>
            <div className="building-list" style={{ display: 'grid', gap: 'var(--ma-space-5)', minWidth: 0, alignContent: 'start' }}>
              {dangTai || dangTaiPhong ? (
                <EmptyState kind="loading" title="Đang tải danh sách phòng…" />
              ) : danhSachPhong.length === 0 ? (
                <EmptyState kind={tangLoc ? 'filtered' : 'first'} title={tangLoc ? `Không có phòng nào ở tầng ${tangLoc}.` : 'Toà này chưa có phòng nào.'} filters={tangLoc ? <FilterChip active onRemove={() => setTangLoc('')}>Tầng {tangLoc}</FilterChip> : undefined} />
              ) : mobile ? (
                <div data-mobile-room-list style={{ display: 'grid', gap: 'var(--ma-space-5)', minWidth: 0 }}>
                  <Card>
                    <div className="row-wrap" aria-label="Tổng quan phòng">
                      <StatusTag tone="neutral">{danhSachPhong.length} phòng</StatusTag>
                      <StatusTag tone="neutral">{demTrong} trống</StatusTag>
                      <StatusTag tone="done">{demDangThue} đang thuê</StatusTag>
                      {demDangSua > 0 ? <StatusTag tone="urgent">{demDangSua} đang sửa</StatusTag> : null}
                    </div>
                    <section aria-label="Danh sách phòng theo tầng" style={{ display: 'grid', gap: 14, minWidth: 0 }}>
                      {nhomPhongTheoTang.map(({ tang, phong }) => (
                        <div key={tang} style={{ display: 'grid', gap: 8, minWidth: 0 }}>
                          <h3 className="h3">Tầng {tang}</h3>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, minWidth: 0 }}>
                            {phong.map((item) => {
                              const status = layThongTinTrangThai(item)
                              return (
                                <RoomCell
                                  key={item.id}
                                  data-testid="room-tile"
                                  data-mobile-room-card="true"
                                  role="button"
                                  tabIndex={0}
                                  room={item.soPhong}
                                  state={layTrangThaiRoomCell(item.trangThai)}
                                  label={status.nhan}
                                  aria-label={`Phòng ${item.soPhong}, ${status.nhan}`}
                                  aria-pressed={phongDangXem?.id === item.id}
                                  className={`${status.lopCss} ${phongDangXem?.id === item.id ? 'room-tile--active' : ''}`}
                                  onClick={() => setPhongDangXemId(item.id)}
                                  onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                      event.preventDefault()
                                      setPhongDangXemId(item.id)
                                    }
                                  }}
                                  style={{ minWidth: 0, minHeight: 72 }}
                                />
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </section>
                  </Card>
                </div>
              ) : kieuXem === 'bang' ? (
                <Card className="dp-bang">
                  <DataTable
                    rows={danhSachPhong}
                    columns={cotPhong}
                    getRowId={(item) => item.id ?? item.soPhong}
                    chips={chipPhong}
                    defaultChip="TAT_CA"
                    timTheo={(item) => `${item.soPhong} ${item.loaiPhong}`}
                    searchLabel="Tìm số phòng, loại phòng"
                    noun="phòng"
                    pageSize={12}
                    rowProps={(item) => ({ 'data-room-row': String(item.id), className: phongDangXemId === item.id ? 'bq-chon' : '' })}
                  />
                </Card>
              ) : (
                <section className="room-floor-map card" data-testid="room-floor-map" aria-label="Sơ đồ phòng theo tầng" style={{ overflow: 'hidden' }}>
                  <BuildingSection label={`Mặt cắt ${toaDangChon?.ten ?? ''} · ${danhSachPhong.length} phòng`} columns={3} floors={floors} />
                </section>
              )}
            </div>

            <div className="building-detail" style={{ display: 'grid', gap: 'var(--ma-space-5)', minWidth: 0, alignContent: 'start' }}>
              <section className="card room-detail" data-testid="room-detail" aria-live="polite">
                {phongDangXem ? (
                  <>
                    <div className="card-head">
                      <h2 className="h2">Chi tiết phòng {phongDangXem.soPhong}</h2>
                      <StatusTag tone={SAC_THAI_PHONG[phongDangXem.trangThai] ?? 'neutral'}>{layThongTinTrangThai(phongDangXem).nhan}</StatusTag>
                    </div>
                    <dl className="building-summary__facts bq-dl" style={{ display: 'grid', minWidth: 0 }}>
                      <div><dt>Tầng</dt><dd>{phongDangXem.tang}</dd></div>
                      <div><dt>Loại phòng</dt><dd>{phongDangXem.loaiPhong}</dd></div>
                      <div><dt>Diện tích</dt><dd>{phongDangXem.dienTich} m²</dd></div>
                      <div><dt>Sức chứa</dt><dd>{phongDangXem.sucChua} người</dd></div>
                      <div><dt>Giá thuê mặc định</dt><dd>{dinhDangTien(phongDangXem.giaThueMacDinh)} ₫</dd></div>
                    </dl>
                    {phongDangXem.id ? (
                      <div style={{ marginTop: 'var(--ma-space-4)' }}>
                        <QuanLyTaiSanPhong
                          token={token}
                          phongId={phongDangXem.id}
                          soPhong={phongDangXem.soPhong}
                          mobile={mobile}
                        />
                      </div>
                    ) : null}
                  </>
                ) : (
                  <EmptyState title="Chưa chọn phòng nào" body={mobile ? 'Chọn một ô phòng để xem chi tiết hiện tại của phòng đó.' : 'Chọn một phòng trong bảng hoặc sơ đồ để xem chi tiết hiện tại của phòng đó.'} />
                )}
              </section>

              <form ref={formPhongRef} className="building-form card" data-testid="room-form" onSubmit={handleTaoPhong} style={{ display: 'grid', gap: 'var(--ma-space-4)' }}>
                <div>
                  <h2 className="h2">Khai báo một phòng</h2>
                  <p className="t-sm">Chọn mẫu phòng chuẩn 1-chạm hoặc tự nhập thông số:</p>
                </div>
                <div className="row-wrap" aria-label="Chọn nhanh theo mẫu">
                  {MAU_PHONG_GOI_Y.map((m) => (
                    <button
                      key={m.nhan}
                      type="button"
                      className="chip"
                      onClick={() => {
                        capNhatBieuMauPhong('dienTich', m.dienTich)
                        capNhatBieuMauPhong('sucChua', m.sucChua)
                        capNhatBieuMauPhong('giaThueMacDinh', m.giaThue)
                        capNhatBieuMauPhong('loaiPhong', m.loai)
                      }}
                    >
                      <Icon name="bolt" />{m.nhan}
                    </button>
                  ))}
                </div>
                <div className="building-form__row dp-luoi-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 14rem), 1fr))', gap: 'var(--ma-space-4)', minWidth: 0 }}>
                  {truongPhong(bieuMauPhong, capNhatBieuMauPhong, TRUONG_PHONG)}
                </div>
                <div className="building-form__actions" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--ma-space-3)', minWidth: 0 }}>
                  <p className="building-form__hint t-sm" style={{ flex: '1 1 14rem', margin: 0 }}>Máy chủ sẽ tự gán trạng thái ban đầu là Trống.</p>
                  <Button type="submit" variant="secondary" blocked={dangLuu || !toaDangChonId}>
                    {dangLuu ? 'Đang lưu…' : 'Khai báo phòng'}
                  </Button>
                </div>
              </form>

              {hienBieuMauHangLoat ? (
                <form className="building-form card" data-testid="room-batch-form" onSubmit={handleXemTruocHangLoat} style={{ display: 'grid', gap: 'var(--ma-space-4)' }}>
                  <div>
                    <h2 className="h2">Tạo nhanh dãy phòng</h2>
                    <p className="t-sm">Khởi tạo nhanh toàn bộ các phòng theo dãy tầng:</p>
                  </div>
                  <div className="row-wrap" aria-label="Chọn nhanh dãy tầng">
                    {DAY_PHONG_GOI_Y.map((day) => (
                      <button
                        key={day.nhan}
                        type="button"
                        className="chip"
                        onClick={() => {
                          capNhatBieuMauHangLoat('tang', day.tang)
                          capNhatBieuMauHangLoat('soBatDau', day.soBatDau)
                          capNhatBieuMauHangLoat('soKetThuc', day.soKetThuc)
                        }}
                      >
                        <Icon name="bolt" />{day.nhan}
                      </button>
                    ))}
                  </div>
                  <div className="building-form__row dp-luoi-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 14rem), 1fr))', gap: 'var(--ma-space-4)', minWidth: 0 }}>
                    {truongPhong(bieuMauHangLoat, capNhatBieuMauHangLoat, TRUONG_HANG_LOAT)}
                  </div>
                  <div className="building-form__actions" style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--ma-space-3)', minWidth: 0 }}>
                    <Button type="submit" variant="secondary" blocked={dangXuLyHangLoat || !toaDangChonId}>
                      {dangXuLyHangLoat ? 'Đang xem trước…' : 'Xem trước'}
                    </Button>
                    {xemTruoc.length > 0 ? (
                      <ConfirmDialog title="Tạo dãy phòng?" consequence={`Sẽ tạo ${xemTruoc.length} phòng, từ số ${yeuCauPhongHangLoatDaXemTruoc?.soBatDau} đến số ${yeuCauPhongHangLoatDaXemTruoc?.soKetThuc}.`} confirmLabel="Xác nhận tạo dãy phòng" onConfirm={handleXacNhanHangLoat} onCancel={() => { setXemTruoc([]); setYeuCauPhongHangLoatDaXemTruoc(null) }} style={{ width: '100%', maxWidth: '100%', minWidth: 0, flex: '1 1 18rem' }} />
                    ) : null}
                  </div>
                  {xemTruoc.length > 0 ? <p className="t-sm">{xemTruoc.map((phong) => phong.soPhong).join(', ')}</p> : null}
                </form>
              ) : null}
            </div>
          </div>
        </>
      )}
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
function demPhongTheoTrangThai(danhSachPhong: ThongTinPhong[], trangThai: string) {
  return danhSachPhong.filter((phong) => phong.trangThai === trangThai).length
}
