import { useEffect, useMemo, useState } from 'react'
import { ApiError, fetchTieuThuCuaNguoiThue, type ThongTinBieuDoTieuThu, type ThongTinTieuThu } from './api'
import { Button } from './design/core/Button'
import { Icon, type IconName } from './design/core/Icon'
import { EmptyState } from './design/feedback/EmptyState'
import { BieuDoCotChon } from './design/charts/BieuDoCotChon'
import { Card } from './design/layout/Card'
import { Tieu } from './CanTra'
import { dinhDangSo } from './design/core/format'

type Props = {
  token: string
  mobile?: boolean
}

type LoaiTieuThu = 'electricity' | 'water'

type CauHinhBieuDo = {
  tieuDe: string
  donViMacDinh: string
  mau: string
  icon: IconName
}

const CAU_HINH: Record<LoaiTieuThu, CauHinhBieuDo> = {
  electricity: { tieuDe: 'Điện', donViMacDinh: 'kWh', mau: 'var(--ma-chart-2)', icon: 'bolt' },
  water: { tieuDe: 'Nước', donViMacDinh: 'm3', mau: 'var(--ma-status-info)', icon: 'droplet' },
}

export default function BieuDoTieuThu({ token, mobile = false }: Props) {
  const [duLieu, setDuLieu] = useState<ThongTinBieuDoTieuThu>({ dien: [], nuoc: [] })
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)
  const [soLanTaiLai, setSoLanTaiLai] = useState(0)
  const variant = mobile ? 'mobile' : 'desktop'

  useEffect(() => {
    let mounted = true
    setDangTai(true)
    setLoi(null)

    fetchTieuThuCuaNguoiThue(token)
      .then((data) => {
        if (mounted) setDuLieu(data)
      })
      .catch((reason: unknown) => {
        if (mounted) setLoi(reason instanceof ApiError ? reason.message : 'Không thể tải dữ liệu tiêu thụ.')
      })
      .finally(() => {
        if (mounted) setDangTai(false)
      })

    return () => {
      mounted = false
    }
  }, [soLanTaiLai, token])

  const khung = { 'data-testid': 'consumption-screen', 'data-layout-variant': variant }

  if (dangTai) {
    return <div {...khung}><EmptyState kind="loading" title="Đang tải dữ liệu tiêu thụ" /></div>
  }

  if (loi) {
    return (
      <div {...khung} role="alert">
        <Card>
          <EmptyState kind="error" title="Không thể tải dữ liệu tiêu thụ" body={loi} />
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Button data-retry-consumption variant="secondary" onClick={() => setSoLanTaiLai((count) => count + 1)}>
              Thử lại
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const tieuDe = (
    <Tieu mobile={mobile} id="consumption-title" className={mobile ? 'sr-only' : undefined} style={{ margin: 0, font: 'var(--ma-text-screen-title)' }}>Tiêu thụ điện và nước</Tieu>
  )

  if (duLieu.dien.length === 0 && duLieu.nuoc.length === 0) {
    return (
      <section {...khung} aria-labelledby="consumption-title" style={{ display: 'grid', gap: 12 }}>
        {tieuDe}
        <Card>
          <EmptyState
            data-consumption-empty
            title="Chưa có dữ liệu tiêu thụ"
            body="Dữ liệu sẽ xuất hiện sau khi có hoá đơn đã phát hành kèm chỉ số điện hoặc nước của bạn. Đây không phải lỗi kết nối."
          />
        </Card>
      </section>
    )
  }

  return (
    <section {...khung} aria-labelledby="consumption-title" style={{ display: 'grid', gap: 12, minWidth: 0 }}>
      <div>
        {tieuDe}
        <div style={{ font: 'var(--ma-text-caption)', color: 'var(--ma-text-muted)', marginTop: 2 }}>
          {Math.max(duLieu.dien.length, duLieu.nuoc.length)} tháng gần nhất có dữ liệu của bạn. Điện và nước được hiển thị riêng theo đúng đơn vị.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'minmax(0, 1fr)' : 'repeat(auto-fit, minmax(420px, 1fr))', gap: mobile ? 12 : 16, alignItems: 'start', minWidth: 0 }}>
        <BieuDoSeries loai="electricity" points={duLieu.dien} />
        <BieuDoSeries loai="water" points={duLieu.nuoc} />
      </div>
    </section>
  )
}

function BieuDoSeries({ loai, points }: { loai: LoaiTieuThu; points: ThongTinTieuThu[] }) {
  const config = CAU_HINH[loai]
  const [chonKhoa, setChonKhoa] = useState<string | null>(null)
  const donVi = points[0]?.donVi || config.donViMacDinh
  const khoaCua = (p: ThongTinTieuThu) => `${p.kyId}`
  // Trục thời gian tăng dần; tháng mới nhất (cuối) được chọn sẵn để thấy số ngay.
  const theoThoiGian = useMemo(() => [...points].sort((a, b) => a.nam - b.nam || a.thang - b.thang || a.kyId - b.kyId), [points])
  const khoaDangChon = chonKhoa ?? (theoThoiGian.length > 0 ? khoaCua(theoThoiGian[theoThoiGian.length - 1]) : null)
  const diemDangChon = theoThoiGian.find((p) => khoaCua(p) === khoaDangChon) ?? null

  const tieuDeThe = (
    <div className="card-head">
      <h2 className="h2" id={`${loai}-chart-title`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: 36, height: 36, borderRadius: 12, background: 'var(--ma-bg-sunken)', color: config.mau }}><Icon name={config.icon} /></span>
        {points.length === 0 ? `${config.tieuDe} chưa có dữ liệu` : config.tieuDe}
      </h2>
      <span className="tag tag-neutral">{donVi}</span>
    </div>
  )

  if (points.length === 0) {
    return (
      <Card data-consumption-chart={loai} aria-labelledby={`${loai}-chart-title`}>
        {tieuDeThe}
        <p className="t-sm t-2" style={{ margin: 0 }}>Chưa có tháng nào có số {config.tieuDe.toLowerCase()} để hiển thị.</p>
      </Card>
    )
  }

  return (
    <Card data-consumption-chart={loai} aria-labelledby={`${loai}-chart-title`} style={{ gap: 12 }}>
      {tieuDeThe}

      <BieuDoCotChon
        cot={theoThoiGian.map((p) => ({ khoa: khoaCua(p), nhan: nhanNgan(p), giaTri: giaTriSo(p.mucTieuThu), hienThi: p.mucTieuThu === null ? '—' : dinhDangSo(p.mucTieuThu), moTa: moTaDiem(p, donVi) }))}
        chonKhoa={khoaDangChon}
        onChon={setChonKhoa}
        mau={config.mau}
        ariaLabel={`Biểu đồ ${config.tieuDe.toLowerCase()} theo tháng, đơn vị ${donVi}`}
        cotProps={(c) => ({ 'data-consumption-bar': `${loai}-${c.khoa}`, 'data-consumption-selected': c.khoa === khoaDangChon ? 'true' : 'false' })}
      />

      <div className="card-sunken" role="status" aria-live="polite" style={{ display: 'grid', gap: 2 }}>
        <span className="t-meta">{chonKhoa === null ? 'Tháng gần nhất' : 'Tháng đang chọn'}</span>
        <b style={{ font: 'var(--ma-text-figure-sm)' }}>{diemDangChon ? moTaDiem(diemDangChon, donVi) : ''}</b>
        <span className="t-meta">Chạm một cột để xem số chính xác của tháng đó.</span>
      </div>

      <div data-consumption-table style={{ overflowX: 'auto' }}>
        <table className="table" aria-label={`Bảng ${config.tieuDe.toLowerCase()} theo tháng`}>
          <caption className="sr-only">Bảng số liệu {config.tieuDe.toLowerCase()} theo tháng</caption>
          <thead>
            <tr>
              <th scope="col">Tháng / phòng</th>
              <th scope="col" className="num">Tiêu thụ ({donVi}) · chỉ số</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point, index) => (
              <tr key={`${point.kyId}-${index}`}>
                <th scope="row" style={{ ...cellText, borderBottom: index === points.length - 1 ? 0 : undefined }}>
                  <span style={{ display: 'block', fontWeight: 600 }}>{nhanKy(point)}</span>
                  <span className="t-meta">Phòng {point.soPhong}</span>
                </th>
                <td className="num" style={cellText}>
                  <strong style={{ display: 'block', whiteSpace: 'nowrap' }}>{hienThiGiaTri(point, donVi)}</strong>
                  <span className="t-meta">Đầu {point.chiSoDau === null ? '—' : dinhDangSo(point.chiSoDau)} · cuối {point.chiSoCuoi === null ? '—' : dinhDangSo(point.chiSoCuoi)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// .table mặc định cao 60px / nowrap ở mobile; ô ở đây có hai dòng nên cho tự giãn.
const cellText = { height: 'auto', padding: '12px', whiteSpace: 'normal', textAlign: 'left', font: 'inherit', color: 'inherit' } as const

function giaTriSo(value: string | null) {
  const parsed = Number.parseFloat(value ?? '0')
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function hienThiGiaTri(point: ThongTinTieuThu, donVi: string) {
  return `${point.mucTieuThu === null ? '—' : dinhDangSo(point.mucTieuThu)} ${donVi}`
}

function nhanKy(point: ThongTinTieuThu) {
  return `Tháng ${point.thang}/${point.nam}`
}

function nhanNgan(point: ThongTinTieuThu) {
  return `${String(point.thang).padStart(2, '0')}/${String(point.nam).slice(-2)}`
}

function moTaDiem(point: ThongTinTieuThu, donVi: string) {
  return `${nhanKy(point)} · Phòng ${point.soPhong}: ${hienThiGiaTri(point, donVi)}`
}
