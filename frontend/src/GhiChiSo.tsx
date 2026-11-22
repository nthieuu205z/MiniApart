import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ApiError,
  chotKyThanhToan,
  fetchChiSoDichVu,
  fetchKyThanhToan,
  fetchPhongChuaGhiChiSo,
  ghiChiSoDichVu,
  type ThongTinGhiChiSo,
  type ThongTinKyThanhToan,
  type ThongTinPhongChuaGhiChiSo,
} from './api'
import { Button } from './design/core/Button'
import { Icon } from './design/core/Icon'
import { StatusTag } from './design/core/StatusTag'
import { EmptyState } from './design/feedback/EmptyState'
import { MeterInput } from './design/forms/MeterInput'
import { nenAnhCongTo } from './meterPhoto'
import { managementRequest } from './managementApi'
import { BuildingSelect, Field, fieldStyle, useBuildings } from './ManagementShared'
import { useToaDangChon } from './toaDangChon'
import './GhiChiSo.css'
import type { ThongTinKetQuaGhiChiSo } from './api'

type Props = {
  token: string
  mobile?: boolean
  vaiTro?: string
  /** Ẩn nút chốt kỳ (Chu kỳ tháng có bước chốt riêng). Mặc định giữ nút như cũ. */
  anNutChot?: boolean
}

type PendingValues = Record<string, string>
type PendingReplacementFlags = Record<string, boolean>
type PendingReplacementReadings = Record<string, { chiSoCuoiCongToCu: string, chiSoDauCongToMoi: string }>
type PendingPhotos = Record<string, File | null>
const styleNhanTruong = {
  display: 'grid',
  gap: 'var(--ma-space-2)',
  minWidth: 0,
  color: 'var(--ma-text-primary)',
  font: 'var(--ma-text-body)',
}

const styleSelect = {
  width: '100%',
  minHeight: 'var(--ma-hit-mobile)',
  minWidth: 0,
  padding: 'var(--ma-space-3) var(--ma-space-4)',
  border: '1px solid var(--ma-border-strong)',
  borderRadius: 'var(--ma-radius)',
  background: 'var(--ma-bg-card)',
  color: 'var(--ma-text-primary)',
}

const styleSoDo = {
  width: '100%',
  minWidth: 0,
  minHeight: 'var(--ma-hit-mobile)',
  padding: 'var(--ma-space-3) var(--ma-space-4)',
  border: '1px solid var(--ma-border-strong)',
  borderRadius: 'var(--ma-radius)',
  background: 'var(--ma-bg-card)',
  color: 'var(--ma-text-primary)',
  fontSize: 17,
}

const styleThongBao = {
  margin: 0,
  color: 'var(--ma-text-secondary)',
  font: 'var(--ma-text-caption)',
  lineHeight: 1.55,
}

export default function GhiChiSo({ token, mobile = false, vaiTro, anNutChot = false }: Props) {
  const ctx = useToaDangChon()
  const { buildings: danhSachToaNha, buildingId: toaNhaId, setBuildingId: setToaNhaId } = useBuildings(token)
  const [danhSachKy, setDanhSachKy] = useState<ThongTinKyThanhToan[]>([])
  const [kyId, setKyId] = useState<number | null>(null)
  const [duLieu, setDuLieu] = useState<ThongTinGhiChiSo | null>(null)
  const [danhSachPhongChuaGhiChiSo, setDanhSachPhongChuaGhiChiSo] = useState<ThongTinPhongChuaGhiChiSo[]>([])
  const [pendingValues, setPendingValues] = useState<PendingValues>({})
  const [pendingReplacementFlags, setPendingReplacementFlags] = useState<PendingReplacementFlags>({})
  const [pendingReplacementReadings, setPendingReplacementReadings] = useState<PendingReplacementReadings>({})
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhotos>({})
  const [dangTaiKy, setDangTaiKy] = useState(false)
  const [dangTaiChiSo, setDangTaiChiSo] = useState(false)
  const [dangTaiPhongChuaGhiChiSo, setDangTaiPhongChuaGhiChiSo] = useState(false)
  const [dangLuu, setDangLuu] = useState<string | null>(null)
  const [dangChotKy, setDangChotKy] = useState(false)
  const [loi, setLoi] = useState<string | null>(null)
  const [lyDoSua, setLyDoSua] = useState('')
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [chon, setChon] = useState<{ phongId: number, dichVuId: number } | null>(null)
  const [yeuCauFocus, setYeuCauFocus] = useState<string | null>(null)
  const [hienBoLoc, setHienBoLoc] = useState(false)
  const [dangSua, setDangSua] = useState<string[]>([])

  const phongDangChonId = chon?.phongId
  useEffect(() => {
    document.querySelector('[data-room-chip][aria-current]')?.scrollIntoView?.({ inline: 'center', block: 'nearest' })
  }, [phongDangChonId, duLieu])

  // Mobile chỉ render ô của công tơ đang chọn: focus phải chờ ô đó được mount.
  useEffect(() => {
    if (!yeuCauFocus) return
    inputRefs.current[yeuCauFocus]?.focus()
    setYeuCauFocus(null)
  }, [yeuCauFocus, chon])

  // Link cũ có ?toaNhaId= (và màn chạy riêng, ngoài khung): nhận toà đó thay vì toà đầu tiên.
  useEffect(() => {
    const tuUrl = docToaNhaIdTuUrl()
    if (tuUrl !== null) setToaNhaId(tuUrl)
  }, [setToaNhaId])

  useEffect(() => {
    if (toaNhaId === null) {
      setDanhSachKy([])
      setKyId(null)
      return
    }

    let mounted = true
    setKyId(null)
    setDuLieu(null)
    setDangTaiKy(true)
    setLoi(null)

    fetchKyThanhToan(token, toaNhaId)
      .then((data) => {
        if (!mounted) return
        setDanhSachKy(data)
        setKyId((current) => current ?? data[0]?.id ?? null)
      })
      .catch((reason: unknown) => {
        if (!mounted) return
        setLoi(chuanHoaLoi(reason, 'Không thể tải danh sách kỳ thanh toán.'))
      })
      .finally(() => {
        if (mounted) setDangTaiKy(false)
      })

    return () => {
      mounted = false
    }
  }, [token, toaNhaId])

  useEffect(() => {
    if (toaNhaId === null || kyId === null) {
      setDuLieu(null)
      return
    }

    let mounted = true
    setDangTaiChiSo(true)
    setLoi(null)

    fetchChiSoDichVu(token, toaNhaId, kyId)
      .then((data) => {
        if (!mounted) return
        setDuLieu(data)
      })
      .catch((reason: unknown) => {
        if (!mounted) return
        setLoi(chuanHoaLoi(reason, 'Không thể tải danh sách ghi chỉ số.'))
      })
      .finally(() => {
        if (mounted) setDangTaiChiSo(false)
      })

    return () => {
      mounted = false
    }
  }, [token, toaNhaId, kyId])

  useEffect(() => {
    if (toaNhaId === null || kyId === null) {
      setDanhSachPhongChuaGhiChiSo([])
      return
    }

    let mounted = true
    setDangTaiPhongChuaGhiChiSo(true)

    fetchPhongChuaGhiChiSo(token, toaNhaId, kyId)
      .then((data) => {
        if (mounted) {
          setDanhSachPhongChuaGhiChiSo(data)
        }
      })
      .catch((reason: unknown) => {
        if (!mounted) return
        setLoi(chuanHoaLoi(reason, 'Không thể tải danh sách phòng còn thiếu chỉ số.'))
      })
      .finally(() => {
        if (mounted) setDangTaiPhongChuaGhiChiSo(false)
      })

    return () => {
      mounted = false
    }
  }, [token, toaNhaId, kyId])

  useEffect(() => {
    const moi = taoGiaTriBanDau(duLieu)
    setPendingValues(moi)
  }, [duLieu])

  useEffect(() => {
    const moi = taoTrangThaiThayCongToBanDau(duLieu)
    setPendingReplacementFlags(moi)
  }, [duLieu])

  useEffect(() => {
    setPendingReplacementReadings(taoChiSoThayCongToBanDau(duLieu))
  }, [duLieu])

  useEffect(() => {
    setPendingPhotos({})
  }, [duLieu])

  const phongs = duLieu?.phong ?? []
  const congTos = phongs.flatMap((phong) => phong.dichVu.map((dichVu) => ({ phong, dichVu, key: khoa(phong.id, dichVu.id) })))
  const toaNhaDangChon = danhSachToaNha.find((item) => item.id === toaNhaId) ?? null
  const kyDangChon = danhSachKy.find((item) => item.id === kyId) ?? null
  const nhanKyThang = kyDangChon ? `${String(kyDangChon.thang).padStart(2, '0')}/${kyDangChon.nam}` : ''

  const danhSachTangPhong = useMemo(() => duLieu?.phong ?? [], [duLieu])

  async function luuChiSo(phongId: number, dichVuId: number, xacNhanCanhBao = false, chuyenFocus = true): Promise<boolean> {
    if (toaNhaId === null || kyId === null) return false
    if (kyDaChot && (vaiTro !== 'CHU' || !lyDoSua.trim())) { setLoi('Chủ sở hữu cần nhập lý do để sửa chỉ số kỳ đã chốt.'); return false }
    const key = khoa(phongId, dichVuId)
    const giaTri = pendingValues[key]?.trim()
    if (!giaTri) return false
    const thongTinDichVu = timDichVu(duLieu, phongId, dichVuId)
    if (!thongTinDichVu) return false
    const coThayCongTo = pendingReplacementFlags[key] ?? thongTinDichVu.coThayCongTo
    const chiSoThayCongTo = pendingReplacementReadings[key] ?? {
      chiSoCuoiCongToCu: thongTinDichVu.chiSoCuoiCongToCu ?? '',
      chiSoDauCongToMoi: thongTinDichVu.chiSoDauCongToMoi ?? '',
    }
    if (coThayCongTo && (!chiSoThayCongTo.chiSoCuoiCongToCu.trim() || !chiSoThayCongTo.chiSoDauCongToMoi.trim())) return false
    if (thongBaoChiSoLui(giaTri, thongTinDichVu.chiSoDau, coThayCongTo)) return false
    const mucTieuThu = tinhMucTieuThu(
      giaTri,
      thongTinDichVu.chiSoDau,
      coThayCongTo ? chiSoThayCongTo.chiSoCuoiCongToCu : undefined,
      coThayCongTo ? chiSoThayCongTo.chiSoDauCongToMoi : undefined,
    )
    if (!mucTieuThu || (taoCanhBaoTieuThu(mucTieuThu, thongTinDichVu) && !xacNhanCanhBao)) return false
    const tep = pendingPhotos[key] ?? undefined

    setDangLuu(key)
    setLoi(null)

    try {
      const payload = {
        phongId,
        dichVuId,
        chiSoCuoi: giaTri,
        coThayCongTo,
        chiSoCuoiCongToCu: coThayCongTo ? chiSoThayCongTo.chiSoCuoiCongToCu : undefined,
        chiSoDauCongToMoi: coThayCongTo ? chiSoThayCongTo.chiSoDauCongToMoi : undefined,
        xacNhanCanhBao: xacNhanCanhBao || undefined,
        tep,
      }
      const ketQua = kyDaChot
        ? await managementRequest<ThongTinKetQuaGhiChiSo>(token, `/api/toa-nha/${toaNhaId}/ky-thanh-toan/${kyId}/chi-so`, 'PUT', { ...payload, tep: undefined, lyDo: lyDoSua.trim() })
        : await ghiChiSoDichVu(token, toaNhaId, kyId, payload)

      setDuLieu((current) => capNhatDuLieu(current, phongId, dichVuId, ketQua))
      setPendingPhotos((current) => boAnhDaChon(current, key))
      setDangSua((current) => current.filter((k) => k !== key))
      if (chuyenFocus) requestAnimationFrame(() => focusTiepTheo(phongId, dichVuId))
      return true
    } catch (reason: unknown) {
      setLoi(chuanHoaLoi(reason, 'Không thể lưu chỉ số.'))
      return false
    } finally {
      setDangLuu(null)
    }
  }

  async function chonAnhCongTo(key: string, tep: File | null) {
    if (!tep) {
      setPendingPhotos((current) => boAnhDaChon(current, key))
      return
    }

    try {
      const tepDaNen = await nenAnhCongTo(tep)
      setPendingPhotos((current) => ({ ...current, [key]: tepDaNen }))
    } catch (reason: unknown) {
      setLoi(chuanHoaLoi(reason, 'Không thể chuẩn bị ảnh công tơ.'))
    }
  }

  async function chotKyDangChon() {
    if (toaNhaId === null || kyId === null) return

    setDangChotKy(true)
    setLoi(null)

    try {
      const ketQua = await chotKyThanhToan(token, toaNhaId, kyId)
      if ('phongThieuChiSo' in ketQua) {
        setDanhSachPhongChuaGhiChiSo(ketQua.phongThieuChiSo)
        setLoi('Còn phòng chưa ghi chỉ số.')
        return
      }

      const danhSachKyMoi = await fetchKyThanhToan(token, toaNhaId)
      setDanhSachKy(danhSachKyMoi)
      setKyId(danhSachKyMoi.find((item) => item.trangThai === 'DANG_MO')?.id ?? danhSachKyMoi[0]?.id ?? null)
    } catch (reason: unknown) {
      setLoi(chuanHoaLoi(reason, 'Không thể chốt kỳ thanh toán.'))
    } finally {
      setDangChotKy(false)
    }
  }

  function focusPhong(phongId: number) {
    const phong = duLieu?.phong.find((item) => item.id === phongId)
    const dichVuDauTien = phong?.dichVu.find((dichVu) => !dichVu.chiSoCuoi) ?? phong?.dichVu[0]
    if (!phong || !dichVuDauTien) return
    focusKhoa(phong.id, dichVuDauTien.id)
  }

  function focusKhoa(phongId: number, dichVuId: number) {
    const key = khoa(phongId, dichVuId)
    if (!mobile) {
      inputRefs.current[key]?.focus()
      return
    }
    setLoi(null)
    setChon({ phongId, dichVuId })
    setYeuCauFocus(key)
  }

  function focusTiepTheo(phongId: number, dichVuId: number) {
    const tiepTheo = timCongToTiepTheo(danhSachTangPhong, phongId, dichVuId)
    if (tiepTheo) focusKhoa(tiepTheo.phong.id, tiepTheo.dichVu.id)
    else if (mobile) setChon(null)
  }

  const kyDaChot = kyDangChon?.trangThai === 'DA_CHOT'
  const chiSoBiKhoa = kyDaChot && vaiTro !== 'CHU'
  const nhanToaNha = toaNhaDangChon?.ten ?? 'Chưa chọn toà'
  const nhanKy = kyDangChon ? `Kỳ ${kyDangChon.thang}/${kyDangChon.nam}` : 'Chưa chọn kỳ'
  const tienDo = `${duLieu?.daGhi ?? 0} / ${duLieu?.tongPhong ?? 0}`
  const trangThaiKy = kyDangChon && !kyDaChot ? 'Đang mở' : undefined
  const styleTrang = {
    width: '100%',
    minWidth: 0,
    minHeight: '100vh',
    background: 'var(--ma-bg-page)',
    color: 'var(--ma-text-primary)',
    fontFamily: 'var(--ma-font-ui)',
  }

  if (ctx.dangTai) {
    return (
      <section className="ghi-cs" aria-label="Ghi chỉ số" aria-busy="true" data-layout-variant={mobile ? 'mobile' : 'desktop'}>
        <div className="skel skel-line" style={{ width: '40%' }} />
        <div className="skel" style={{ height: 160 }} />
      </section>
    )
  }

  if (mobile) {
    const phongChon = phongs.find((phong) => phong.id === chon?.phongId)
      ?? phongs.find((phong) => phong.dichVu.some((dichVu) => !dichVu.chiSoCuoi))
      ?? phongs[0]
    const dichVuChon = phongChon
      ? (chon?.phongId === phongChon.id ? phongChon.dichVu.find((dichVu) => dichVu.id === chon.dichVuId) : undefined)
        ?? phongChon.dichVu.find((dichVu) => !dichVu.chiSoCuoi)
        ?? phongChon.dichVu[0]
      : undefined
    const tongCongTo = congTos.length
    const daGhiCongTo = congTos.filter((c) => c.dichVu.chiSoCuoi).length

    const key = phongChon && dichVuChon ? khoa(phongChon.id, dichVuChon.id) : ''
    const conLai = congTos.filter((c) => !c.dichVu.chiSoCuoi && c.key !== key)
    const giaTri = pendingValues[key] ?? ''
    const coThayCongTo = dichVuChon ? (pendingReplacementFlags[key] ?? dichVuChon.coThayCongTo) : false
    const chiSoThayCongTo = dichVuChon ? (pendingReplacementReadings[key] ?? {
      chiSoCuoiCongToCu: dichVuChon.chiSoCuoiCongToCu ?? '',
      chiSoDauCongToMoi: dichVuChon.chiSoDauCongToMoi ?? '',
    }) : { chiSoCuoiCongToCu: '', chiSoDauCongToMoi: '' }
    const anhDaChon = pendingPhotos[key]
    const thongBaoChiSo = dichVuChon ? thongBaoChiSoLui(giaTri, dichVuChon.chiSoDau, coThayCongTo) : ''
    const mucTieuThu = dichVuChon && !thongBaoChiSo ? tinhMucTieuThu(
      giaTri,
      dichVuChon.chiSoDau,
      coThayCongTo ? chiSoThayCongTo.chiSoCuoiCongToCu : undefined,
      coThayCongTo ? chiSoThayCongTo.chiSoDauCongToMoi : undefined,
    ) : ''
    const canhBaoTieuThu = dichVuChon && !thongBaoChiSo ? taoCanhBaoTieuThu(mucTieuThu, dichVuChon) : null
    const luuBiChan = !dichVuChon || chiSoBiKhoa || (kyDaChot && !lyDoSua.trim()) || dangLuu === key || !giaTri
      || (coThayCongTo && (!chiSoThayCongTo.chiSoCuoiCongToCu || !chiSoThayCongTo.chiSoDauCongToMoi)) || Boolean(thongBaoChiSo) || Boolean(canhBaoTieuThu)
    const lyDoChanLuu = chiSoBiKhoa
      ? 'Kỳ này đã chốt, không thể sửa chỉ số.'
      : kyDaChot && !lyDoSua.trim()
        ? 'Nhập lý do sửa kỳ đã chốt trước khi lưu.'
        : canhBaoTieuThu
          ? 'Cần xem lại và xác nhận cảnh báo trước khi lưu.'
          : undefined
    const tiepTheo = phongChon && dichVuChon ? timCongToTiepTheo(phongs, phongChon.id, dichVuChon.id) : null
    const nhanLuu = dangLuu === key
      ? 'Đang lưu…'
      : tiepTheo
        ? `Lưu, sang ${tiepTheo.phong.soPhong} · ${tiepTheo.dichVu.tenDichVu}`
        : 'Lưu và xong'
    const donVi = dichVuChon?.donVi ?? ''
    const loiTaiTrang = !(phongChon && dichVuChon)
    const xongHet = tongCongTo > 0 && daGhiCongTo === tongCongTo && chon === null

    return (
      <section
        className="m-app"
        style={{ ...styleTrang, paddingBottom: 'calc(var(--ma-bottom-nav-height) + 96px)' }}
        aria-labelledby="meter-title"
        data-testid="meter-screen"
        data-layout-variant="mobile"
      >
        <header className="m-top">
          <button
            type="button"
            className="icon-btn touch"
            aria-label="Quay lại Nhắc việc"
            onClick={() => {
              window.history.pushState({}, '', '/nhac-viec')
              window.dispatchEvent(new PopStateEvent('popstate'))
            }}
          >
            <Icon name="chevron-left" />
          </button>
          <div className="h-title" style={{ fontSize: 18 }}>
            <span id="meter-title">Ghi chỉ số</span>
            <div className="h-sub">{nhanToaNha} · {tongCongTo - daGhiCongTo > 0 ? `còn ${tongCongTo - daGhiCongTo} công tơ` : 'đã đủ'}</div>
          </div>
          {danhSachKy.length > 1 ? (
            <button
              type="button"
              className="icon-btn touch"
              aria-label="Chọn kỳ"
              aria-expanded={hienBoLoc}
              onClick={() => setHienBoLoc((current) => !current)}
            >
              <Icon name="filter" />
            </button>
          ) : null}
        </header>

        <div className="m-body" data-mobile-meter-list="true">
          <BuildingSelect buildings={danhSachToaNha} value={toaNhaId} onChange={setToaNhaId} />
          {hienBoLoc ? (
            <div className="m-card">
              <label style={styleNhanTruong}>
                <span>Kỳ thanh toán</span>
                <select
                  value={kyId ?? ''}
                  onChange={(event) => {
                    setKyId(Number(event.target.value))
                    setChon(null)
                  }}
                  disabled={dangTaiChiSo || danhSachKy.length === 0}
                  style={styleSelect}
                >
                  {danhSachKy.map((ky) => <option key={ky.id} value={ky.id}>{ky.thang}/{ky.nam}</option>)}
                </select>
              </label>
            </div>
          ) : null}

          {dangTaiKy || dangTaiChiSo ? <p style={styleThongBao}>Đang tải dữ liệu chỉ số…</p> : null}
          {loi && loiTaiTrang ? <p className="banner banner-danger" role="alert" style={{ margin: 0 }}>{loi}</p> : null}

          {duLieu ? <div aria-label="Tiến độ ghi chỉ số">
            <div className="mstep" role="img" aria-label="Chu kỳ tháng, bước 1 trên 4"><span className="on" /><span /><span /><span /></div>
            <p className="t-sm t-2" style={{ margin: '8px 0 0' }}>Chu kỳ {nhanKyThang} · Bước 1/4 Ghi chỉ số · {daGhiCongTo}/{tongCongTo}</p>
          </div> : null}

          {!duLieu ? null : phongs.length === 0 ? (
            <EmptyState
              kind="first"
              title="Không có phòng đủ điều kiện để ghi."
              body="Toà này hiện chưa có phòng có dữ liệu công tơ trong kỳ đã chọn."
            />
          ) : xongHet ? (
            <section className="m-card" style={{ display: 'grid', gap: 8 }}>
              <StatusTag tone="done">Đã ghi đủ</StatusTag>
              <h2 className="h3" style={{ margin: 0 }}>Đã ghi đủ {tongCongTo} công tơ</h2>
              <p className="t-meta" style={{ margin: 0 }}>Sang bước chốt kỳ khi sẵn sàng. Muốn sửa số đã ghi, mở trang trên máy tính.</p>
            </section>
          ) : phongChon && dichVuChon ? (
            <section className="m-card" aria-labelledby="meter-room-title" style={{ display: 'grid', gap: 12 }}>
              <div className="spread" style={{ alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <h2 className="h3" id="meter-room-title" style={{ fontSize: 18, margin: 0 }}>Phòng {phongChon.soPhong} · {dichVuChon.tenDichVu}</h2>
                  <p className="t-meta" style={{ margin: 0 }}>Tầng {phongChon.tang} · kỳ trước {gonSo(dichVuChon.chiSoDau)} {donVi}</p>
                </div>
                <StatusTag tone={dichVuChon.chiSoCuoi ? 'done' : 'waiting'}>{dichVuChon.chiSoCuoi ? 'Đã ghi' : 'Chưa ghi'}</StatusTag>
              </div>

              <div>
                <label className="label" htmlFor={`chiSoCuoi-${key}`}>Chỉ số mới</label>
                <div className="meter-wrap" style={{ marginTop: 6 }}>
                  <input
                    ref={(element) => {
                      inputRefs.current[key] = element
                    }}
                    className="meter-input"
                    id={`chiSoCuoi-${key}`}
                    name={`chiSoCuoi-${phongChon.id}-${dichVuChon.id}`}
                    type="number"
                    inputMode="numeric"
                    step="0.01"
                    value={giaTri}
                    disabled={chiSoBiKhoa}
                    aria-label={`Chỉ số mới phòng ${phongChon.soPhong}`}
                    aria-invalid={Boolean(thongBaoChiSo) || Boolean(canhBaoTieuThu) || Boolean(loi) || undefined}
                    onChange={(event) => {
                      const value = event.target.value
                      setPendingValues((current) => ({ ...current, [key]: value }))
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter') return
                      event.preventDefault()
                      void luuChiSo(phongChon.id, dichVuChon.id)
                    }}
                  />
                  <span className="unit-tag">{donVi}</span>
                </div>
                {thongBaoChiSo ? <p className="ghi-m-loi" role="alert">{thongBaoChiSo}</p> : null}
                {loi && !loiTaiTrang ? <p className="ghi-m-loi" role="alert">{loi}</p> : null}
              </div>

              {mucTieuThu ? (
                <div className="t-2 t-sm" style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span>Tiêu thụ</span>
                  <b className={canhBaoTieuThu ? 't-warm' : undefined} style={{ font: '600 28px/1 var(--ma-font-ui)', letterSpacing: '-0.02em', color: canhBaoTieuThu ? undefined : 'var(--ma-text-primary)' }}>{gonSo(mucTieuThu)}</b>
                  <span>{donVi}{dichVuChon.thongTinCanhBaoTieuThu ? ` · TB 3 kỳ ${gonSo(dichVuChon.thongTinCanhBaoTieuThu.trungBinhBaKyTruoc)} ${donVi}` : ''}</span>
                </div>
              ) : null}

              {canhBaoTieuThu ? (
                <div className="banner banner-warning" role="alert" style={{ padding: 12 }}>
                  <Icon name="alert" />
                  <div style={{ display: 'grid', gap: 8, minWidth: 0 }}>
                    <div><b>Cao gấp {gonSo(canhBaoTieuThu.gapLan, 1)} lần trung bình.</b> Kiểm tra lại số hoặc chụp ảnh công tơ để lưu kèm.</div>
                    <Button
                      variant="secondary"
                      data-confirm-warning-key={key}
                      blocked={dangLuu === key || chiSoBiKhoa}
                      blockedReason={chiSoBiKhoa ? 'Kỳ này đã chốt, không thể xác nhận lại chỉ số.' : undefined}
                      style={{ justifySelf: 'start' }}
                      onClick={() => void luuChiSo(phongChon.id, dichVuChon.id, true)}
                    >
                      {dangLuu === key ? 'Đang lưu…' : 'Xác nhận và lưu'}
                    </Button>
                  </div>
                </div>
              ) : null}

              <label className="hit" style={{ display: 'flex', alignItems: 'center', gap: 'var(--ma-space-3)' }}>
                <input
                  name={`coThayCongTo-${phongChon.id}-${dichVuChon.id}`}
                  type="checkbox"
                  checked={coThayCongTo}
                  disabled={chiSoBiKhoa}
                  style={{ width: 20, height: 20, flex: 'none' }}
                  onChange={(event) => {
                    const checked = event.target.checked
                    setPendingReplacementFlags((current) => ({ ...current, [key]: checked }))
                  }}
                />
                <span>Công tơ đã thay</span>
              </label>
              {coThayCongTo ? (
                <div style={{ display: 'grid', gap: 'var(--ma-space-4)' }}>
                  <label style={styleNhanTruong}>
                    <span>Chỉ số cuối công tơ cũ</span>
                    <input
                      name={`chiSoCuoiCongToCu-${phongChon.id}-${dichVuChon.id}`}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      value={chiSoThayCongTo.chiSoCuoiCongToCu}
                      disabled={chiSoBiKhoa}
                      style={styleSoDo}
                      onChange={(event) => {
                        const value = event.target.value
                        setPendingReplacementReadings((current) => ({ ...current, [key]: { ...chiSoThayCongTo, chiSoCuoiCongToCu: value } }))
                      }}
                    />
                  </label>
                  <label style={styleNhanTruong}>
                    <span>Chỉ số đầu công tơ mới</span>
                    <input
                      name={`chiSoDauCongToMoi-${phongChon.id}-${dichVuChon.id}`}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      value={chiSoThayCongTo.chiSoDauCongToMoi}
                      disabled={chiSoBiKhoa}
                      style={styleSoDo}
                      onChange={(event) => {
                        const value = event.target.value
                        setPendingReplacementReadings((current) => ({ ...current, [key]: { ...chiSoThayCongTo, chiSoDauCongToMoi: value } }))
                      }}
                    />
                  </label>
                </div>
              ) : null}

              <label className="btn btn-secondary btn-touch btn-block ghi-anh">
                <Icon name="camera" />
                Chụp ảnh công tơ
                <input
                  name={`anhCongTo-${phongChon.id}-${dichVuChon.id}`}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  disabled={kyDaChot}
                  onChange={(event) => {
                    void chonAnhCongTo(key, event.target.files?.[0] ?? null)
                  }}
                />
              </label>
              {anhDaChon ? <p style={styleThongBao}>Đã chọn ảnh: {anhDaChon.name}</p> : null}
              {tiepTheo ? (
                <Button variant="text" className="btn-touch" data-skip-meter onClick={() => focusKhoa(tiepTheo.phong.id, tiepTheo.dichVu.id)}>
                  Bỏ qua, ghi sau
                </Button>
              ) : null}
            </section>
          ) : null}

          {duLieu && conLai.length > 0 ? (
            <>
              <h2 className="m-h">Còn lại</h2>
              <div className="m-list" style={{ padding: 0 }}>
                {conLai.map((c) => (
                  <button key={c.key} type="button" className="ghi-m-lai" onClick={() => focusKhoa(c.phong.id, c.dichVu.id)}>
                    <span className="tile"><Icon name={c.dichVu.donVi === 'kWh' ? 'bolt' : 'droplet'} /></span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', font: '500 15px/1.35 var(--ma-font-ui)' }}>Phòng {c.phong.soPhong} · {c.dichVu.tenDichVu}</span>
                      <span className="s">Tầng {c.phong.tang} · kỳ trước {gonSo(c.dichVu.chiSoDau)} {c.dichVu.donVi}</span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {kyDangChon && !anNutChot ? (
            <section className="m-card" aria-labelledby="meter-close-title" style={{ display: 'grid', gap: 'var(--ma-space-4)' }}>
              <div className="spread">
                <h2 className="h3" id="meter-close-title" style={{ margin: 0 }}>Chốt kỳ</h2>
                <Button
                  variant="secondary"
                  data-close-period
                  blocked={dangChotKy || kyDaChot}
                  blockedReason={kyDaChot ? 'Kỳ này đã chốt, không thể ghi thêm chỉ số.' : undefined}
                  onClick={() => void chotKyDangChon()}
                >
                  {dangChotKy ? 'Đang chốt…' : 'Chốt kỳ'}
                </Button>
              </div>
              {dangTaiPhongChuaGhiChiSo ? (
                <p style={styleThongBao}>Đang tải phòng còn thiếu…</p>
              ) : danhSachPhongChuaGhiChiSo.length > 0 ? (
                <div style={{ display: 'grid', gap: 'var(--ma-space-1)' }}>
                  <p style={styleThongBao}>Phòng còn thiếu</p>
                  {danhSachPhongChuaGhiChiSo.map((phong) => (
                    <Button
                      key={phong.id}
                      variant="text"
                      size="sm"
                      data-missing-room-key={phong.id}
                      style={{ minHeight: 'var(--ma-hit-mobile)', justifyContent: 'flex-start' }}
                      onClick={() => focusPhong(phong.id)}
                    >
                      Phòng {phong.soPhong} tầng {phong.tang}
                    </Button>
                  ))}
                </div>
              ) : (
                <p style={styleThongBao}>Không còn phòng nào thiếu chỉ số.</p>
              )}
            </section>
          ) : null}

          {kyDaChot && vaiTro === 'CHU' ? <Field title="Lý do sửa chỉ số kỳ đã chốt (bắt buộc)"><textarea style={fieldStyle} value={lyDoSua} onChange={(event) => setLyDoSua(event.target.value)} /><span>Thay đổi được ghi nhật ký. Hoá đơn đã phát hành giữ nguyên số liệu.</span></Field> : null}
        </div>

        {phongChon && dichVuChon && !xongHet ? (
          <div className="sticky-act">
            {luuBiChan && lyDoChanLuu ? <p id={`ly-do-luu-${key}`} style={{ ...styleThongBao, marginBottom: 8 }}>{lyDoChanLuu}</p> : null}
            <Button
              variant="primary"
              className="btn-touch btn-block"
              data-save-key={key}
              blocked={luuBiChan}
              aria-describedby={luuBiChan && lyDoChanLuu ? `ly-do-luu-${key}` : undefined}
              style={{ minHeight: 'var(--ma-control-h-touch)' }}
              onClick={() => void luuChiSo(phongChon.id, dichVuChon.id)}
            >
              {nhanLuu}
            </Button>
          </div>
        ) : null}
      </section>
    )
  }

  const chuaGhi = congTos.filter((c) => !c.dichVu.chiSoCuoi)
  const phongDaGhi = phongs.filter((phong) => phong.dichVu.some((dichVu) => dichVu.chiSoCuoi))
  const cotDichVu = Array.from(new Set(phongDaGhi.flatMap((phong) => phong.dichVu.map((dichVu) => dichVu.tenDichVu))))
  const dangMoSua = (key: string) => dangSua.includes(key)
  const trongPhamVi = congTos.filter((c) => !c.dichVu.chiSoCuoi || dangMoSua(c.key))
  const sanSang = trongPhamVi.filter((c) => {
    const t = tinhCongTo(c.phong.id, c.dichVu)
    return !t.luuBiChan && (!c.dichVu.chiSoCuoi || t.giaTri !== c.dichVu.chiSoCuoi)
  })

  // Lưu lần lượt từng ô đã nhập qua cùng luuChiSo (cùng API, cùng validate); dừng ở lỗi đầu tiên.
  async function luuTatCa() {
    for (const c of sanSang) {
      if (!(await luuChiSo(c.phong.id, c.dichVu.id, false, false))) break
    }
  }

  function tinhCongTo(phongId: number, dichVu: ThongTinGhiChiSo['phong'][number]['dichVu'][number]) {
    const key = khoa(phongId, dichVu.id)
    const giaTri = pendingValues[key] ?? ''
    const coThayCongTo = pendingReplacementFlags[key] ?? dichVu.coThayCongTo
    const chiSoThayCongTo = pendingReplacementReadings[key] ?? {
      chiSoCuoiCongToCu: dichVu.chiSoCuoiCongToCu ?? '',
      chiSoDauCongToMoi: dichVu.chiSoDauCongToMoi ?? '',
    }
    const thongBaoChiSo = thongBaoChiSoLui(giaTri, dichVu.chiSoDau, coThayCongTo)
    const mucTieuThu = thongBaoChiSo ? '' : tinhMucTieuThu(
      giaTri,
      dichVu.chiSoDau,
      coThayCongTo ? chiSoThayCongTo.chiSoCuoiCongToCu : undefined,
      coThayCongTo ? chiSoThayCongTo.chiSoDauCongToMoi : undefined,
    )
    const canhBaoTieuThu = thongBaoChiSo ? null : taoCanhBaoTieuThu(mucTieuThu, dichVu)
    const thieuThayCongTo = coThayCongTo && (!chiSoThayCongTo.chiSoCuoiCongToCu || !chiSoThayCongTo.chiSoDauCongToMoi)
    const luuBiChan = chiSoBiKhoa || (kyDaChot && !lyDoSua.trim()) || dangLuu !== null || !giaTri || thieuThayCongTo || Boolean(thongBaoChiSo) || Boolean(canhBaoTieuThu)
    const lyDoChanLuu = chiSoBiKhoa
      ? 'Kỳ này đã chốt, không thể sửa chỉ số.'
      : kyDaChot && !lyDoSua.trim()
        ? 'Nhập lý do sửa kỳ đã chốt trước khi lưu.'
        : thongBaoChiSo || (giaTri && thieuThayCongTo ? 'Cần đủ hai chỉ số của công tơ cũ và mới.' : canhBaoTieuThu ? 'Cần xem lại và xác nhận cảnh báo trước khi lưu.' : undefined)
    return { key, giaTri, coThayCongTo, chiSoThayCongTo, thongBaoChiSo, mucTieuThu, canhBaoTieuThu, luuBiChan, lyDoChanLuu }
  }

  function renderCongTo(phong: ThongTinGhiChiSo['phong'][number], dichVu: ThongTinGhiChiSo['phong'][number]['dichVu'][number]) {
    const { key, giaTri, coThayCongTo, chiSoThayCongTo, thongBaoChiSo, mucTieuThu, canhBaoTieuThu, luuBiChan, lyDoChanLuu } = tinhCongTo(phong.id, dichVu)
    const anhDaChon = pendingPhotos[key]
    return (
      <div className="ghi-cong-to" id={`cong-to-${phong.id}-${dichVu.id}`} key={key}>
        <div className="ghi-ten">
          <strong>Phòng {phong.soPhong} · {dichVu.tenDichVu}</strong>
          <span className="t-meta">Tầng {phong.tang} · kỳ trước {gonSo(dichVu.chiSoDau)} {dichVu.donVi}</span>
        </div>
        <MeterInput
          label={`Chỉ số mới — phòng ${phong.soPhong}`}
          value={giaTri}
          state={chiSoBiKhoa ? 'locked' : thongBaoChiSo ? 'error' : giaTri ? 'filled' : 'default'}
          error={thongBaoChiSo || undefined}
          style={{ minWidth: 0 }}
        >
          <div className="ghi-o-in">
            <input
              ref={(element) => { inputRefs.current[key] = element }}
              id={`chiSoCuoi-${key}`}
              name={`chiSoCuoi-${phong.id}-${dichVu.id}`}
              type="number"
              inputMode="decimal"
              step="0.01"
              value={giaTri}
              disabled={chiSoBiKhoa}
              aria-label={`Chỉ số mới phòng ${phong.soPhong}`}
              aria-invalid={Boolean(thongBaoChiSo) || undefined}
              onChange={(event) => {
                const value = event.target.value
                setPendingValues((current) => ({ ...current, [key]: value }))
              }}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return
                event.preventDefault()
                void luuChiSo(phong.id, dichVu.id)
              }}
            />
            <span className="t-meta">{dichVu.donVi}</span>
          </div>
        </MeterInput>
        <div className="ghi-hanh-dong">
          <label className="btn btn-secondary ghi-anh">
            <Icon name="camera" />
            Chụp ảnh
            <input
              name={`anhCongTo-${phong.id}-${dichVu.id}`}
              type="file"
              accept="image/*"
              capture="environment"
              disabled={kyDaChot}
              onChange={(event) => { void chonAnhCongTo(key, event.target.files?.[0] ?? null) }}
            />
          </label>
          <Button
            variant="secondary"
            data-save-key={key}
            blocked={luuBiChan}
            aria-describedby={luuBiChan && lyDoChanLuu ? `ly-do-luu-${key}` : undefined}
            onClick={() => void luuChiSo(phong.id, dichVu.id)}
          >
            {dangLuu === key ? 'Đang lưu…' : 'Lưu'}
          </Button>
        </div>
        <div className="ghi-them">
          {mucTieuThu ? <span>Mức tiêu thụ: {mucTieuThu} {dichVu.donVi}</span> : null}
          <label className="ghi-thay">
            <input
              name={`coThayCongTo-${phong.id}-${dichVu.id}`}
              type="checkbox"
              checked={coThayCongTo}
              disabled={chiSoBiKhoa}
              onChange={(event) => {
                const checked = event.target.checked
                setPendingReplacementFlags((current) => ({ ...current, [key]: checked }))
              }}
            />
            <span>Công tơ đã thay</span>
          </label>
          {anhDaChon ? <span>Đã chọn ảnh: {anhDaChon.name}</span> : null}
          {luuBiChan && lyDoChanLuu ? <span id={`ly-do-luu-${key}`}>{lyDoChanLuu}</span> : null}
        </div>
        {coThayCongTo ? (
          <div className="ghi-thay-so">
            <label style={styleNhanTruong}>
              <span>Chỉ số cuối công tơ cũ</span>
              <input
                name={`chiSoCuoiCongToCu-${phong.id}-${dichVu.id}`}
                type="number"
                inputMode="decimal"
                step="0.01"
                value={chiSoThayCongTo.chiSoCuoiCongToCu}
                disabled={chiSoBiKhoa}
                style={styleSoDo}
                onChange={(event) => {
                  const value = event.target.value
                  setPendingReplacementReadings((current) => ({ ...current, [key]: { ...chiSoThayCongTo, chiSoCuoiCongToCu: value } }))
                }}
              />
            </label>
            <label style={styleNhanTruong}>
              <span>Chỉ số đầu công tơ mới</span>
              <input
                name={`chiSoDauCongToMoi-${phong.id}-${dichVu.id}`}
                type="number"
                inputMode="decimal"
                step="0.01"
                value={chiSoThayCongTo.chiSoDauCongToMoi}
                disabled={chiSoBiKhoa}
                style={styleSoDo}
                onChange={(event) => {
                  const value = event.target.value
                  setPendingReplacementReadings((current) => ({ ...current, [key]: { ...chiSoThayCongTo, chiSoDauCongToMoi: value } }))
                }}
              />
            </label>
          </div>
        ) : null}
        {canhBaoTieuThu ? (
          <div className="banner banner-warning" role="alert" style={{ gridColumn: '1 / -1' }}>
            <Icon name="alert" />
            <div style={{ display: 'grid', gap: 8, minWidth: 0 }}>
              <div>{canhBaoTieuThu.thongBao}</div>
              <Button
                variant="secondary"
                data-confirm-warning-key={key}
                blocked={dangLuu === key || chiSoBiKhoa}
                blockedReason={chiSoBiKhoa ? 'Kỳ này đã chốt, không thể xác nhận lại chỉ số.' : undefined}
                style={{ justifySelf: 'start' }}
                onClick={() => void luuChiSo(phong.id, dichVu.id, true)}
              >
                {dangLuu === key ? 'Đang lưu…' : 'Xác nhận và lưu'}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <section className="ghi-cs" aria-labelledby="meter-title" data-testid="meter-screen" data-layout-variant="desktop">
      <header className="ghi-cs-dau">
        <div style={{ minWidth: 0 }}>
          <h2 id="meter-title" className="h2" style={{ margin: 0 }}>Bước 1 · Ghi chỉ số{nhanKyThang ? ` kỳ ${nhanKyThang}` : ''}</h2>
          <p className="t-meta" style={{ margin: '4px 0 0' }}>{nhanToaNha} · {nhanKy} · {tienDo} phòng đã ghi đủ</p>
        </div>
        <div className="ghi-loc">
          <BuildingSelect buildings={danhSachToaNha} value={toaNhaId} onChange={setToaNhaId} />
          {danhSachKy.length > 1 ? (
            <label style={styleNhanTruong}>
              <span>Kỳ thanh toán</span>
              <select value={kyId ?? ''} onChange={(event) => setKyId(Number(event.target.value))} disabled={dangTaiChiSo} style={styleSelect}>
                {danhSachKy.map((ky) => <option key={ky.id} value={ky.id}>{ky.thang}/{ky.nam}</option>)}
              </select>
            </label>
          ) : null}
        </div>
      </header>

      {dangTaiKy || dangTaiChiSo ? <p style={styleThongBao}>Đang tải dữ liệu chỉ số…</p> : null}
      {loi ? <p className="banner banner-danger" role="alert" style={{ margin: 0 }}>{loi}</p> : null}
      {kyDaChot && vaiTro === 'CHU' ? <Field title="Lý do sửa chỉ số kỳ đã chốt (bắt buộc)"><textarea style={fieldStyle} value={lyDoSua} onChange={(event) => setLyDoSua(event.target.value)} /><span>Thay đổi được ghi nhật ký. Hoá đơn đã phát hành giữ nguyên số liệu.</span></Field> : null}

      {!duLieu ? null : phongs.length === 0 ? (
        <EmptyState kind="first" title="Không có phòng đủ điều kiện để ghi." body="Toà này hiện chưa có phòng có dữ liệu công tơ trong kỳ đã chọn." />
      ) : (
        <div style={{ display: 'grid', gap: 'var(--ma-space-5)', minWidth: 0 }}>
          <section aria-labelledby="meter-chua-ghi" className="ghi-nhom">
            <div className="spread ghi-nhom-dau">
              <h3 id="meter-chua-ghi" className="h3" style={{ margin: 0 }}>Chưa ghi ({chuaGhi.length})</h3>
              <Button variant="primary" data-save-all blocked={sanSang.length === 0 || dangLuu !== null} onClick={() => void luuTatCa()}>
                {dangLuu !== null ? 'Đang lưu…' : sanSang.length ? `Lưu ${sanSang.length} chỉ số` : 'Lưu chỉ số'}
              </Button>
            </div>
            {chuaGhi.length === 0
              ? <p style={styleThongBao}>Đã ghi đủ công tơ của kỳ này.</p>
              : chuaGhi.map((c) => renderCongTo(c.phong, c.dichVu))}
          </section>

          {phongDaGhi.length > 0 ? (
            <section aria-labelledby="meter-da-ghi" className="ghi-nhom">
              <h3 id="meter-da-ghi" className="h3" style={{ margin: 0 }}>Đã ghi ({phongDaGhi.length})</h3>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Phòng</th>
                      {cotDichVu.flatMap((ten) => [<th scope="col" key={ten}>{ten} đầu → cuối</th>, <th scope="col" className="num" key={`${ten}-dung`}>Dùng</th>])}
                      <th scope="col">Trạng thái</th>
                      <th scope="col"><span className="sr-only">Sửa</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {phongDaGhi.flatMap((phong) => {
                      const daGhiHet = phong.dichVu.every((dichVu) => dichVu.chiSoCuoi)
                      const daGhi = phong.dichVu.filter((dichVu) => dichVu.chiSoCuoi)
                      return [
                        <tr key={phong.id}>
                          <th scope="row">{phong.soPhong}</th>
                          {cotDichVu.flatMap((ten) => {
                            const dichVu = phong.dichVu.find((d) => d.tenDichVu === ten)
                            return dichVu?.chiSoCuoi
                              ? [<td key={ten}>{gonSo(dichVu.chiSoDau)} → {gonSo(dichVu.chiSoCuoi)}</td>, <td className="num" key={`${ten}-dung`}><b>{gonSo(dichVu.mucTieuThu ?? '')}</b></td>]
                              : [<td key={ten}>—</td>, <td className="num" key={`${ten}-dung`}>—</td>]
                          })}
                          <td><StatusTag tone={daGhiHet ? 'done' : 'waiting'}>{daGhiHet ? 'Đã ghi' : 'Còn thiếu'}</StatusTag></td>
                          <td>
                            {daGhi.map((dichVu) => {
                              const key = khoa(phong.id, dichVu.id)
                              return (
                                <Button
                                  key={key}
                                  variant="text"
                                  size="sm"
                                  aria-expanded={dangMoSua(key)}
                                  aria-label={`Sửa ${dichVu.tenDichVu.toLocaleLowerCase('vi-VN')} phòng ${phong.soPhong}`}
                                  onClick={() => setDangSua((current) => (current.includes(key) ? current.filter((k) => k !== key) : [...current, key]))}
                                >
                                  {daGhi.length > 1 ? `Sửa ${dichVu.tenDichVu.toLocaleLowerCase('vi-VN')}` : 'Sửa'}
                                </Button>
                              )
                            })}
                          </td>
                        </tr>,
                        ...daGhi.filter((dichVu) => dangMoSua(khoa(phong.id, dichVu.id))).map((dichVu) => (
                          <tr key={`sua-${phong.id}-${dichVu.id}`}><td colSpan={cotDichVu.length * 2 + 3}>{renderCongTo(phong, dichVu)}</td></tr>
                        )),
                      ]
                    })}
                  </tbody>
                </table>
              </div>
              <p className="t-meta" style={{ margin: 0 }}>{phongDaGhi.length} trong {phongs.length} phòng</p>
            </section>
          ) : null}
        </div>
      )}

      {kyDangChon && !anNutChot ? (
        <section aria-labelledby="meter-close-title" className="ghi-nhom">
          <div className="spread">
            <h3 id="meter-close-title" className="h3" style={{ margin: 0 }}>Chốt kỳ</h3>
            <Button
              variant="secondary"
              data-close-period
              blocked={dangChotKy || kyDaChot}
              blockedReason={kyDaChot ? 'Kỳ này đã chốt, không thể ghi thêm chỉ số.' : undefined}
              onClick={() => void chotKyDangChon()}
            >
              {dangChotKy ? 'Đang chốt…' : 'Chốt kỳ'}
            </Button>
          </div>
          {dangTaiPhongChuaGhiChiSo ? (
            <p style={styleThongBao}>Đang tải phòng còn thiếu…</p>
          ) : danhSachPhongChuaGhiChiSo.length > 0 ? (
            <div style={{ display: 'grid', gap: 'var(--ma-space-1)' }}>
              <p style={styleThongBao}>Phòng còn thiếu</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ma-space-2)' }}>
                {danhSachPhongChuaGhiChiSo.map((phong) => (
                  <Button key={phong.id} variant="text" size="sm" data-missing-room-key={phong.id} onClick={() => focusPhong(phong.id)}>
                    Phòng {phong.soPhong} tầng {phong.tang}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <p style={styleThongBao}>Không còn phòng nào thiếu chỉ số.</p>
          )}
        </section>
      ) : null}
    </section>
  )
}

function docToaNhaIdTuUrl(): number | null {
  if (typeof window === 'undefined') return null
  const value = new URLSearchParams(window.location.search).get('toaNhaId')
  if (!value || !/^\d+$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

function khoa(phongId: number, dichVuId: number) {
  return `${phongId}-${dichVuId}`
}

function chuanHoaLoi(reason: unknown, fallback: string) {
  if (reason instanceof ApiError) {
    return reason.message
  }
  return reason instanceof Error ? reason.message : fallback
}

function taoGiaTriBanDau(duLieu: ThongTinGhiChiSo | null): PendingValues {
  const ketQua: PendingValues = {}
  duLieu?.phong.forEach((phong) => {
    phong.dichVu.forEach((dichVu) => {
      ketQua[khoa(phong.id, dichVu.id)] = dichVu.chiSoCuoi ?? ''
    })
  })
  return ketQua
}

function taoTrangThaiThayCongToBanDau(duLieu: ThongTinGhiChiSo | null): PendingReplacementFlags {
  const ketQua: PendingReplacementFlags = {}
  duLieu?.phong.forEach((phong) => {
    phong.dichVu.forEach((dichVu) => {
      ketQua[khoa(phong.id, dichVu.id)] = dichVu.coThayCongTo
    })
  })
  return ketQua
}

function taoChiSoThayCongToBanDau(duLieu: ThongTinGhiChiSo | null): PendingReplacementReadings {
  const ketQua: PendingReplacementReadings = {}
  duLieu?.phong.forEach((phong) => {
    phong.dichVu.forEach((dichVu) => {
      ketQua[khoa(phong.id, dichVu.id)] = {
        chiSoCuoiCongToCu: dichVu.chiSoCuoiCongToCu ?? '',
        chiSoDauCongToMoi: dichVu.chiSoDauCongToMoi ?? '',
      }
    })
  })
  return ketQua
}

function tinhMucTieuThu(
  chiSoCuoi: string,
  chiSoDau: string,
  chiSoCuoiCongToCu?: string,
  chiSoDauCongToMoi?: string,
) {
  if (!chiSoCuoi) return ''
  const soCuoi = Number(chiSoCuoi)
  const soDau = Number(chiSoDau)
  if (Number.isNaN(soCuoi) || Number.isNaN(soDau)) return ''
  if (chiSoCuoiCongToCu !== undefined || chiSoDauCongToMoi !== undefined) {
    const soCuoiCongToCu = Number(chiSoCuoiCongToCu)
    const soDauCongToMoi = Number(chiSoDauCongToMoi)
    if (!chiSoCuoiCongToCu || !chiSoDauCongToMoi || Number.isNaN(soCuoiCongToCu) || Number.isNaN(soDauCongToMoi)) return ''
    return ((soCuoiCongToCu - soDau) + (soCuoi - soDauCongToMoi)).toFixed(2)
  }
  return (soCuoi - soDau).toFixed(2)
}

function thongBaoChiSoLui(chiSoCuoi: string, chiSoDau: string, coThayCongTo: boolean) {
  if (!chiSoCuoi || coThayCongTo) return ''
  const soCuoi = Number(chiSoCuoi)
  const soDau = Number(chiSoDau)
  if (Number.isNaN(soCuoi) || Number.isNaN(soDau) || soCuoi >= soDau) return ''
  return `Chỉ số mới không được nhỏ hơn chỉ số cũ (${chiSoDau}). Nếu vừa thay công tơ, hãy chọn 'Thay công tơ'.`
}

function taoCanhBaoTieuThu(
  mucTieuThu: string,
  dichVu: ThongTinGhiChiSo['phong'][number]['dichVu'][number],
) {
  const thongTinCanhBao = dichVu.thongTinCanhBaoTieuThu
  if (!thongTinCanhBao || (dichVu.daXacNhanCanhBao && dichVu.mucTieuThu === mucTieuThu)) return null

  const mucTieuThuKyNay = Number(mucTieuThu)
  const trungBinhBaKyTruoc = Number(thongTinCanhBao.trungBinhBaKyTruoc)
  const nguongCanhBao = Number(thongTinCanhBao.nguongCanhBao)
  if (!mucTieuThu || Number.isNaN(mucTieuThuKyNay) || Number.isNaN(trungBinhBaKyTruoc) || Number.isNaN(nguongCanhBao)
    || trungBinhBaKyTruoc <= 0 || mucTieuThuKyNay <= trungBinhBaKyTruoc * nguongCanhBao) {
    return null
  }

  const gapTrungBinh = (mucTieuThuKyNay / trungBinhBaKyTruoc).toFixed(2)
  return {
    gapLan: gapTrungBinh,
    thongBao: `Mức tiêu thụ kỳ này là ${mucTieuThu}, trung bình ba kỳ trước là ${thongTinCanhBao.trungBinhBaKyTruoc}, gấp ${gapTrungBinh} lần.`,
  }
}

// Công tơ chưa ghi kế tiếp sau công tơ hiện tại (vòng lại đầu danh sách); null khi không còn công tơ nào khác chưa ghi.
function timCongToTiepTheo(phongs: ThongTinGhiChiSo['phong'], phongId: number, dichVuId: number) {
  const danhSach = phongs.flatMap((phong) => phong.dichVu.map((dichVu) => ({ phong, dichVu })))
  const viTri = danhSach.findIndex((muc) => muc.phong.id === phongId && muc.dichVu.id === dichVuId)
  const conThieu = (muc: (typeof danhSach)[number]) => !muc.dichVu.chiSoCuoi && !(muc.phong.id === phongId && muc.dichVu.id === dichVuId)
  return danhSach.slice(viTri + 1).find(conThieu) ?? danhSach.slice(0, Math.max(viTri, 0)).find(conThieu) ?? null
}

// "174.00" -> "174", "1.74" -> "1,7" (số kiểu Việt, bỏ đuôi 0 thừa)
function gonSo(giaTri: string, toiDa = 2) {
  const so = Number(giaTri)
  return Number.isNaN(so) ? giaTri : so.toLocaleString('vi-VN', { maximumFractionDigits: toiDa })
}

function timDichVu(duLieu: ThongTinGhiChiSo | null, phongId: number, dichVuId: number) {
  return duLieu?.phong.find((phong) => phong.id === phongId)?.dichVu.find((dichVu) => dichVu.id === dichVuId) ?? null
}

function capNhatDuLieu(
  duLieu: ThongTinGhiChiSo | null,
  phongId: number,
  dichVuId: number,
  ketQua: {
    chiSoDau: string
    chiSoCuoi: string
    mucTieuThu: string
    coThayCongTo: boolean
    chiSoCuoiCongToCu?: string | null
    chiSoDauCongToMoi?: string | null
    anhCongToId?: number | null
    canhBaoTieuThuBatThuong?: { coCanhBao: boolean } | null
  },
) {
  if (!duLieu) return duLieu
  return {
    ...duLieu,
    daGhi: duLieu.phong.filter((phong) => phong.dichVu.every((dichVu) => dichVu.chiSoCuoi || (phong.id === phongId && dichVu.id === dichVuId))).length,
    phong: duLieu.phong.map((phong) => ({
      ...phong,
      dichVu: phong.dichVu.map((dichVu) => (
        phong.id === phongId && dichVu.id === dichVuId
          ? {
              ...dichVu,
              chiSoDau: ketQua.chiSoDau,
              chiSoCuoi: ketQua.chiSoCuoi,
              mucTieuThu: ketQua.mucTieuThu,
              coThayCongTo: ketQua.coThayCongTo,
              chiSoCuoiCongToCu: ketQua.chiSoCuoiCongToCu ?? null,
              chiSoDauCongToMoi: ketQua.chiSoDauCongToMoi ?? null,
              anhCongToId: ketQua.anhCongToId ?? dichVu.anhCongToId ?? null,
              daXacNhanCanhBao: ketQua.canhBaoTieuThuBatThuong?.coCanhBao ?? dichVu.daXacNhanCanhBao,
            }
          : dichVu
      )),
    })),
  }
}

function boAnhDaChon(current: PendingPhotos, key: string): PendingPhotos {
  if (!(key in current)) return current
  const next = { ...current }
  delete next[key]
  return next
}
