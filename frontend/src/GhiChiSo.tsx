import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ApiError,
  chotKyThanhToan,
  fetchChiSoDichVu,
  fetchKyThanhToan,
  fetchPhongChuaGhiChiSo,
  fetchToaNha,
  ghiChiSoDichVu,
  type ThongTinGhiChiSo,
  type ThongTinKyThanhToan,
  type ThongTinPhongChuaGhiChiSo,
  type ThongTinToaNha,
} from './api'
import { Button } from './design/core/Button'
import { Icon } from './design/core/Icon'
import { Figure } from './design/core/Figure'
import { StatusTag } from './design/core/StatusTag'
import { SysLabel } from './design/core/SysLabel'
import { RoomCell } from './design/building/RoomCell'
import { EmptyState } from './design/feedback/EmptyState'
import { MeterInput } from './design/forms/MeterInput'
import { Breadcrumb } from './design/shell/Breadcrumb'
import { TopBar } from './design/shell/TopBar'
import { nenAnhCongTo } from './meterPhoto'
import { managementRequest } from './managementApi'
import { Field, fieldStyle } from './ManagementShared'
import type { ThongTinKetQuaGhiChiSo } from './api'

type Props = {
  token: string
  mobile?: boolean
  vaiTro?: string
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
  fontFamily: 'var(--ma-font-mono)',
  fontSize: 17,
}

const styleThongBao = {
  margin: 0,
  color: 'var(--ma-text-secondary)',
  font: 'var(--ma-text-caption)',
  lineHeight: 1.55,
}

export default function GhiChiSo({ token, mobile = false, vaiTro }: Props) {
  const [danhSachToaNha, setDanhSachToaNha] = useState<ThongTinToaNha[]>([])
  const [danhSachKy, setDanhSachKy] = useState<ThongTinKyThanhToan[]>([])
  const [toaNhaId, setToaNhaId] = useState<number | null>(() => docToaNhaIdTuUrl())
  const [kyId, setKyId] = useState<number | null>(null)
  const [duLieu, setDuLieu] = useState<ThongTinGhiChiSo | null>(null)
  const [danhSachPhongChuaGhiChiSo, setDanhSachPhongChuaGhiChiSo] = useState<ThongTinPhongChuaGhiChiSo[]>([])
  const [pendingValues, setPendingValues] = useState<PendingValues>({})
  const [pendingReplacementFlags, setPendingReplacementFlags] = useState<PendingReplacementFlags>({})
  const [pendingReplacementReadings, setPendingReplacementReadings] = useState<PendingReplacementReadings>({})
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhotos>({})
  const [dangTai, setDangTai] = useState(true)
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

  useEffect(() => {
    let mounted = true
    setDangTai(true)
    setLoi(null)

    fetchToaNha(token)
      .then((data) => {
        if (!mounted) return
        setDanhSachToaNha(data)
        setToaNhaId((current) => current ?? data[0]?.id ?? null)
      })
      .catch((reason: unknown) => {
        if (!mounted) return
        setLoi(chuanHoaLoi(reason, 'Không thể tải danh sách toà nhà.'))
      })
      .finally(() => {
        if (mounted) setDangTai(false)
      })

    return () => {
      mounted = false
    }
  }, [token])

  useEffect(() => {
    if (toaNhaId === null) {
      setDanhSachKy([])
      setKyId(null)
      return
    }

    let mounted = true
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

  const toaNhaDangChon = danhSachToaNha.find((item) => item.id === toaNhaId) ?? null
  const kyDangChon = danhSachKy.find((item) => item.id === kyId) ?? null

  const danhSachTangPhong = useMemo(() => duLieu?.phong ?? [], [duLieu])

  async function luuChiSo(phongId: number, dichVuId: number, xacNhanCanhBao = false) {
    if (toaNhaId === null || kyId === null) return
    if (kyDaChot && (vaiTro !== 'CHU' || !lyDoSua.trim())) { setLoi('Chủ sở hữu cần nhập lý do để sửa chỉ số kỳ đã chốt.'); return }
    const key = khoa(phongId, dichVuId)
    const giaTri = pendingValues[key]?.trim()
    if (!giaTri) return
    const thongTinDichVu = timDichVu(duLieu, phongId, dichVuId)
    if (!thongTinDichVu) return
    const coThayCongTo = pendingReplacementFlags[key] ?? thongTinDichVu.coThayCongTo
    const chiSoThayCongTo = pendingReplacementReadings[key] ?? {
      chiSoCuoiCongToCu: thongTinDichVu.chiSoCuoiCongToCu ?? '',
      chiSoDauCongToMoi: thongTinDichVu.chiSoDauCongToMoi ?? '',
    }
    if (coThayCongTo && (!chiSoThayCongTo.chiSoCuoiCongToCu.trim() || !chiSoThayCongTo.chiSoDauCongToMoi.trim())) return
    if (thongBaoChiSoLui(giaTri, thongTinDichVu.chiSoDau, coThayCongTo)) return
    const mucTieuThu = tinhMucTieuThu(
      giaTri,
      thongTinDichVu.chiSoDau,
      coThayCongTo ? chiSoThayCongTo.chiSoCuoiCongToCu : undefined,
      coThayCongTo ? chiSoThayCongTo.chiSoDauCongToMoi : undefined,
    )
    if (!mucTieuThu || (taoCanhBaoTieuThu(mucTieuThu, thongTinDichVu) && !xacNhanCanhBao)) return
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
      requestAnimationFrame(() => focusTiepTheo(phongId, dichVuId))
    } catch (reason: unknown) {
      setLoi(chuanHoaLoi(reason, 'Không thể lưu chỉ số.'))
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
    setChon({ phongId, dichVuId })
    setYeuCauFocus(key)
  }

  function focusTiepTheo(phongId: number, dichVuId: number) {
    const tiepTheo = timCongToTiepTheo(danhSachTangPhong, phongId, dichVuId)
    if (tiepTheo) focusKhoa(tiepTheo.phong.id, tiepTheo.dichVu.id)
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

  if (dangTai) {
    return (
      <section style={styleTrang} aria-label="Ghi chỉ số" data-layout-variant={mobile ? 'mobile' : 'desktop'}>
        <TopBar
          building="MiniApart"
          period="Đang tải kỳ"
          style={{ padding: '8px 16px', flexWrap: 'wrap', height: 'auto', minHeight: 'var(--ma-topbar-height)' }}
        />
        <p style={{ margin: 0, padding: 'var(--ma-space-7) clamp(16px, 4vw, var(--ma-space-8))' }}>Đang tải toà nhà…</p>
      </section>
    )
  }

  if (mobile) {
    const phongs = duLieu?.phong ?? []
    const phongChon = phongs.find((phong) => phong.id === chon?.phongId)
      ?? phongs.find((phong) => phong.dichVu.some((dichVu) => !dichVu.chiSoCuoi))
      ?? phongs[0]
    const dichVuChon = phongChon
      ? (chon?.phongId === phongChon.id ? phongChon.dichVu.find((dichVu) => dichVu.id === chon.dichVuId) : undefined)
        ?? phongChon.dichVu.find((dichVu) => !dichVu.chiSoCuoi)
        ?? phongChon.dichVu[0]
      : undefined
    const tongCongTo = phongs.reduce((tong, phong) => tong + phong.dichVu.length, 0)
    const daGhiCongTo = phongs.reduce((tong, phong) => tong + phong.dichVu.filter((dichVu) => Boolean(dichVu.chiSoCuoi)).length, 0)
    const phongConThieu = phongs.filter((phong) => phong.dichVu.some((dichVu) => !dichVu.chiSoCuoi))
    const nhanConLai = phongConThieu.length === 0
      ? 'đã đủ'
      : phongConThieu.length === 1
        ? `còn ${phongConThieu[0].soPhong} · ${phongConThieu[0].dichVu.filter((dichVu) => !dichVu.chiSoCuoi).map((dichVu) => dichVu.tenDichVu).join(', ')}`
        : `còn ${phongConThieu.length} phòng`

    const key = phongChon && dichVuChon ? khoa(phongChon.id, dichVuChon.id) : ''
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
      : !tiepTheo
        ? 'Lưu chỉ số'
        : tiepTheo.phong.id === phongChon?.id
          ? `Lưu, sang công tơ ${tiepTheo.dichVu.tenDichVu.toLocaleLowerCase('vi-VN')} ${tiepTheo.phong.soPhong}`
          : `Lưu, sang phòng ${tiepTheo.phong.soPhong}`
    const donVi = dichVuChon?.donVi ?? ''

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
            <div className="h-sub">{nhanToaNha} · {kyDangChon ? `kỳ ${kyDangChon.thang}/${kyDangChon.nam}` : 'chưa chọn kỳ'}</div>
          </div>
          <button
            type="button"
            className="icon-btn touch"
            aria-label="Chọn kỳ và toà"
            aria-expanded={hienBoLoc}
            onClick={() => setHienBoLoc((current) => !current)}
          >
            <Icon name="filter" />
          </button>
        </header>

        <div className="m-body" data-mobile-meter-list="true">
          {hienBoLoc ? (
            <div className="m-card" style={{ display: 'grid', gap: 'var(--ma-space-4)' }}>
              <label style={styleNhanTruong}>
                <span>Toà nhà</span>
                <select
                  value={toaNhaId ?? ''}
                  onChange={(event) => {
                    setToaNhaId(Number(event.target.value))
                    setKyId(null)
                    setDuLieu(null)
                    setChon(null)
                  }}
                  disabled={dangTaiKy || danhSachToaNha.length === 0}
                  style={styleSelect}
                >
                  {danhSachToaNha.map((toa) => <option key={toa.id} value={toa.id}>{toa.ten}</option>)}
                </select>
              </label>
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
          {loi ? <p className="banner banner-danger" role="alert" style={{ margin: 0 }}>{loi}</p> : null}

          {duLieu ? <div aria-label="Tiến độ ghi chỉ số">
            <div className="spread t-sm">
              <span className="t-2">Đã ghi <b className="t-strong" style={{ color: 'var(--ma-text-primary)' }}>{daGhiCongTo}/{tongCongTo}</b> công tơ</span>
              <span className="t-3">{nhanConLai}</span>
            </div>
            <div
              className="progress"
              style={{ marginTop: 8 }}
              role="progressbar"
              aria-valuenow={daGhiCongTo}
              aria-valuemin={0}
              aria-valuemax={tongCongTo}
              aria-label={`Đã ghi ${daGhiCongTo} trên ${tongCongTo} công tơ`}
            >
              <span style={{ width: `${tongCongTo ? (daGhiCongTo / tongCongTo) * 100 : 0}%` }} />
            </div>
          </div> : null}

          {!duLieu ? null : phongs.length === 0 ? (
            <EmptyState
              kind="first"
              title="Không có phòng đủ điều kiện để ghi."
              body="Toà này hiện chưa có phòng có dữ liệu công tơ trong kỳ đã chọn."
            />
          ) : (
            <>
              <nav
                aria-label="Chọn phòng"
                style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '2px 16px 4px', margin: '0 -16px', scrollbarWidth: 'none' }}
              >
                {phongs.map((phong) => {
                  const xong = phong.dichVu.every((dichVu) => Boolean(dichVu.chiSoCuoi))
                  const dangChon = phong.id === phongChon?.id
                  return (
                    <button
                      key={phong.id}
                      type="button"
                      aria-current={dangChon ? 'true' : undefined}
                      aria-label={`Phòng ${phong.soPhong}${xong ? ', đã ghi' : ''}`}
                      data-room-chip={phong.id}
                      className="chip touch"
                      style={{
                        minWidth: 56,
                        justifyContent: 'center',
                        gap: 4,
                        border: 0,
                        borderRadius: 12,
                        fontWeight: 600,
                        background: dangChon ? 'var(--ma-text-primary)' : xong ? 'var(--ma-done-bg)' : 'var(--ma-bg-card)',
                        color: dangChon ? 'var(--ma-bg-card)' : xong ? 'var(--ma-done-text)' : 'var(--ma-text-primary)',
                      }}
                      onClick={() => {
                        const dichVuDau = phong.dichVu.find((dichVu) => !dichVu.chiSoCuoi) ?? phong.dichVu[0]
                        if (dichVuDau) setChon({ phongId: phong.id, dichVuId: dichVuDau.id })
                      }}
                    >
                      {xong && !dangChon ? <Icon name="check" size="sm" /> : null}
                      {phong.soPhong}
                    </button>
                  )
                })}
              </nav>

              {phongChon && dichVuChon ? (
                <section className="m-card" aria-labelledby="meter-room-title">
                  <div className="spread">
                    <div style={{ minWidth: 0 }}>
                      <h2 className="h3" id="meter-room-title" style={{ fontSize: 18, margin: 0 }}>Phòng {phongChon.soPhong}</h2>
                      <p className="t-meta" style={{ margin: 0 }}>Tầng {phongChon.tang}</p>
                    </div>
                    {phongChon.dichVu.length > 1 ? (
                      <div className="seg" role="group" aria-label="Loại công tơ">
                        {phongChon.dichVu.map((dichVu) => (
                          <button
                            key={dichVu.id}
                            type="button"
                            aria-pressed={dichVu.id === dichVuChon.id}
                            onClick={() => setChon({ phongId: phongChon.id, dichVuId: dichVu.id })}
                          >
                            {dichVu.tenDichVu}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <StatusTag tone={dichVuChon.chiSoCuoi ? 'done' : 'neutral'}>{dichVuChon.tenDichVu}</StatusTag>
                    )}
                  </div>

                  <div className="spread t-sm t-2" style={{ margin: '12px 2px 8px' }}>
                    <span>Chỉ số kỳ trước</span>
                    <b className="t-strong" style={{ color: 'var(--ma-text-primary)' }}>{gonSo(dichVuChon.chiSoDau)} {donVi}</b>
                  </div>
                  <label className="sr-only" htmlFor={`chiSoCuoi-${key}`}>{`Chỉ số ${dichVuChon.tenDichVu.toLocaleLowerCase('vi-VN')} mới, phòng ${phongChon.soPhong}`}</label>
                  <div className="meter-wrap">
                    <input
                      ref={(element) => {
                        inputRefs.current[key] = element
                      }}
                      className="meter-input"
                      id={`chiSoCuoi-${key}`}
                      name={`chiSoCuoi-${phongChon.id}-${dichVuChon.id}`}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      value={giaTri}
                      disabled={chiSoBiKhoa}
                      aria-label={`Chỉ số mới phòng ${phongChon.soPhong}`}
                      aria-invalid={Boolean(thongBaoChiSo) || Boolean(canhBaoTieuThu) || undefined}
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
                  {thongBaoChiSo ? <p style={{ ...styleThongBao, color: 'var(--ma-urgent)', marginTop: 8 }} role="alert">{thongBaoChiSo}</p> : null}

                  {mucTieuThu ? (
                    <div className="t-2 t-sm" style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      <span>Tiêu thụ</span>
                      <b className={canhBaoTieuThu ? 't-warm' : undefined} style={{ font: '600 28px/1 var(--ma-font-ui)', letterSpacing: '-0.02em', color: canhBaoTieuThu ? undefined : 'var(--ma-text-primary)' }}>{gonSo(mucTieuThu)}</b>
                      <span>{donVi}{dichVuChon.thongTinCanhBaoTieuThu ? ` · TB 3 kỳ ${gonSo(dichVuChon.thongTinCanhBaoTieuThu.trungBinhBaKyTruoc)} ${donVi}` : ''}</span>
                    </div>
                  ) : null}

                  {canhBaoTieuThu ? (
                    <div className="banner banner-warning" role="alert" style={{ marginTop: 12, padding: 12 }}>
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

                  <label className="hit" style={{ display: 'flex', alignItems: 'center', gap: 'var(--ma-space-3)', marginTop: 8 }}>
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
                    <div style={{ display: 'grid', gap: 'var(--ma-space-4)', marginBottom: 12 }}>
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

                  <label className="btn btn-secondary btn-touch btn-block" style={{ marginTop: 4, cursor: 'pointer', position: 'relative' }}>
                    <Icon name="camera" />
                    Chụp ảnh công tơ
                    <input
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
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
                  {anhDaChon ? <p style={{ ...styleThongBao, marginTop: 8 }}>Đã chọn ảnh: {anhDaChon.name}</p> : null}
                </section>
              ) : null}
            </>
          )}

          {kyDangChon ? (
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

        {phongChon && dichVuChon ? (
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
              {dangLuu === key ? null : <Icon name="arrow-right" />}
            </Button>
          </div>
        ) : null}
      </section>
    )
  }

  return (
    <section style={styleTrang} aria-labelledby="meter-title" data-testid="meter-screen" data-layout-variant={mobile ? 'mobile' : 'desktop'}>
      <TopBar
        building={nhanToaNha}
        period={nhanKy}
        periodStatus={trangThaiKy}
        notifications={danhSachPhongChuaGhiChiSo.length || undefined}
        style={{ padding: '8px 16px', flexWrap: 'wrap', height: 'auto', minHeight: 'var(--ma-topbar-height)' }}
      />
      <Breadcrumb
        items={[nhanToaNha, nhanKy, 'Ghi chỉ số']}
        style={{ padding: '7px 16px', flexWrap: 'wrap' }}
      />

      <main
        style={{
          width: '100%',
          maxWidth: 1400,
          minWidth: 0,
          margin: '0 auto',
          padding: mobile ? 'var(--ma-space-6) 0 calc(var(--ma-space-9) + var(--ma-hit-mobile))' : 'var(--ma-space-7) clamp(16px, 4vw, var(--ma-space-8))',
          display: 'grid',
          gap: 'var(--ma-space-7)',
        }}
      >
        <header
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: mobile ? 'flex-start' : 'flex-end',
            flexDirection: mobile ? 'column' : undefined,
            gap: 'var(--ma-space-6)',
            padding: mobile ? '0 var(--ma-space-4) var(--ma-space-5)' : '0 0 var(--ma-space-5)',
            borderBottom: '2px solid var(--ma-ink-900)',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <SysLabel>GHI CHỈ SỐ ĐIỆN NƯỚC</SysLabel>
            <h1
              id="meter-title"
              style={{
                margin: 'var(--ma-space-2) 0 var(--ma-space-1)',
                color: 'var(--ma-ink-screen-title)',
                font: 'var(--ma-text-screen-title)',
                letterSpacing: 'var(--ma-tracking-title)',
              }}
            >
              Ghi chỉ số
            </h1>
            <p style={{ margin: 0, color: 'var(--ma-text-secondary)', font: 'var(--ma-text-body)' }}>
              Ghi theo thứ tự tầng, lưu xong tự chuyển tới ô kế tiếp.
            </p>
          </div>
          <div style={{ display: 'grid', gap: 'var(--ma-space-1)', textAlign: 'right' }} aria-label="Tiến độ ghi chỉ số">
            <SysLabel>TIẾN ĐỘ</SysLabel>
            <Figure value={tienDo} unit="phòng" size="md" />
          </div>
        </header>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: mobile ? 'minmax(0, 1fr)' : 'repeat(auto-fit, minmax(min(100%, 15rem), 1fr))',
            gap: 'var(--ma-space-4)',
            padding: mobile ? '0 var(--ma-space-4)' : undefined,
          }}
        >
          <label style={styleNhanTruong}>
            <span>Toà nhà</span>
            <select
              value={toaNhaId ?? ''}
              onChange={(event) => {
                setToaNhaId(Number(event.target.value))
                setKyId(null)
                setDuLieu(null)
              }}
              disabled={dangTaiKy || danhSachToaNha.length === 0}
              style={styleSelect}
            >
              {danhSachToaNha.map((toa) => (
                <option key={toa.id} value={toa.id}>
                  {toa.ten}
                </option>
              ))}
            </select>
          </label>

          <label style={styleNhanTruong}>
            <span>Kỳ thanh toán</span>
            <select
              value={kyId ?? ''}
              onChange={(event) => setKyId(Number(event.target.value))}
              disabled={dangTaiChiSo || danhSachKy.length === 0}
              style={styleSelect}
            >
              {danhSachKy.map((ky) => (
                <option key={ky.id} value={ky.id}>
                  {ky.thang}/{ky.nam}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ display: 'grid', gap: 'var(--ma-space-1)' }}>
          {toaNhaDangChon ? <p style={styleThongBao}>Toà: {toaNhaDangChon.ten}</p> : null}
          {kyDangChon ? <p style={styleThongBao}>Kỳ: {kyDangChon.thang}/{kyDangChon.nam}</p> : null}
          {dangTaiKy || dangTaiChiSo ? <p style={styleThongBao}>Đang tải dữ liệu chỉ số…</p> : null}
        </div>

        {kyDangChon ? (
          <section
            aria-labelledby="meter-close-title"
            style={{
              display: 'grid',
              gap: 'var(--ma-space-5)',
              padding: mobile ? 'var(--ma-space-4)' : 'var(--ma-space-6)',
              border: '1px solid var(--ma-border-default)',
              background: 'var(--ma-bg-card)',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 'var(--ma-space-5)',
              }}
            >
              <div>
                <SysLabel>CHỐT SỐ LIỆU KỲ</SysLabel>
                <h2 id="meter-close-title" style={{ margin: 'var(--ma-space-1) 0 0', font: 'var(--ma-text-block-title)', letterSpacing: 'var(--ma-tracking-title)' }}>
                  Chốt kỳ
                </h2>
              </div>
              <Button
                variant="secondary"
                size="md"
                data-close-period
                blocked={dangChotKy || kyDaChot}
                blockedReason={kyDaChot ? 'Kỳ này đã chốt, không thể ghi thêm chỉ số.' : undefined}
                style={{ minHeight: 'var(--ma-hit-mobile)' }}
                onClick={() => void chotKyDangChon()}
              >
                {dangChotKy ? 'Đang chốt…' : 'Chốt kỳ'}
              </Button>
            </div>
            {dangTaiPhongChuaGhiChiSo ? (
              <p style={styleThongBao}>Đang tải phòng còn thiếu…</p>
            ) : danhSachPhongChuaGhiChiSo.length > 0 ? (
              <div style={{ display: 'grid', gap: 'var(--ma-space-2)' }}>
                <StatusTag tone="urgent">PHÒNG CÒN THIẾU</StatusTag>
                <p style={styleThongBao}>Phòng còn thiếu</p>
                <div style={{ display: 'grid', gap: 'var(--ma-space-1)' }}>
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
              </div>
            ) : (
              <p style={styleThongBao}>Không còn phòng nào thiếu chỉ số.</p>
            )}
          </section>
        ) : null}

        {kyDaChot && vaiTro === 'CHU' ? <Field title="Lý do sửa chỉ số kỳ đã chốt (bắt buộc)"><textarea style={fieldStyle} value={lyDoSua} onChange={(event) => setLyDoSua(event.target.value)} /><span>Thay đổi được ghi nhật ký. Hoá đơn đã phát hành giữ nguyên số liệu.</span></Field> : null}

        {loi ? (
          <p style={{ ...styleThongBao, color: 'var(--ma-urgent)' }} role="alert">
            {loi}
          </p>
        ) : null}

        {duLieu ? (
          duLieu.phong.length === 0 ? (
            <EmptyState
              kind="first"
              title="Không có phòng đủ điều kiện để ghi."
              body="Toà này hiện chưa có phòng có dữ liệu công tơ trong kỳ đã chọn."
            />
          ) : (
            <div data-mobile-meter-list={mobile ? 'true' : undefined} style={{ display: 'grid', gap: 'var(--ma-space-6)', minWidth: 0 }}>
              {duLieu.phong.map((phong) => {
                const phongDaGhi = phong.dichVu.every((dichVu) => Boolean(dichVu.chiSoCuoi))
                const soDichVuDaGhi = phong.dichVu.filter((dichVu) => Boolean(dichVu.chiSoCuoi)).length
                return (
                  <article
                    key={phong.id}
                    style={{
                      minWidth: 0,
                      border: '1px solid var(--ma-border-default)',
                      background: 'var(--ma-bg-card)',
                    }}
                  >
                    <header
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 'var(--ma-space-5)',
                        padding: mobile ? 'var(--ma-space-4)' : 'var(--ma-space-6)',
                        borderBottom: '2px solid var(--ma-ink-900)',
                      }}
                    >
                      <div>
                        <SysLabel>TẦNG {phong.tang}</SysLabel>
                        <h2
                          style={{
                            margin: 'var(--ma-space-1) 0 var(--ma-space-2)',
                            fontFamily: 'var(--ma-font-mono)',
                            fontSize: 'clamp(26px, 7vw, 34px)',
                            lineHeight: 1,
                            letterSpacing: 'var(--ma-tracking-figure)',
                          }}
                        >
                          Phòng {phong.soPhong}
                        </h2>
                        <StatusTag tone={phongDaGhi ? 'done' : 'urgent'}>
                          {phongDaGhi ? 'ĐÃ GHI' : 'CHƯA GHI'}
                        </StatusTag>
                      </div>
                      <RoomCell
                        room={phong.soPhong}
                        state={phongDaGhi ? 'recorded' : 'missing'}
                        label={
                          phongDaGhi
                            ? `Đã ghi · ${phong.dichVu.length} dịch vụ`
                            : `Chưa ghi · ${soDichVuDaGhi}/${phong.dichVu.length} dịch vụ`
                        }
                        style={{ minWidth: 128, flex: '0 1 180px' }}
                      />
                    </header>

                    <div style={{ display: 'grid', minWidth: 0 }}>
                      {phong.dichVu.map((dichVu) => {
                        const key = khoa(phong.id, dichVu.id)
                        const giaTri = pendingValues[key] ?? ''
                        const coThayCongTo = pendingReplacementFlags[key] ?? dichVu.coThayCongTo
                        const chiSoThayCongTo = pendingReplacementReadings[key] ?? {
                          chiSoCuoiCongToCu: dichVu.chiSoCuoiCongToCu ?? '',
                          chiSoDauCongToMoi: dichVu.chiSoDauCongToMoi ?? '',
                        }
                        const anhDaChon = pendingPhotos[key]
                        const thongBaoChiSo = thongBaoChiSoLui(giaTri, dichVu.chiSoDau, coThayCongTo)
                        const mucTieuThu = thongBaoChiSo ? '' : tinhMucTieuThu(
                          giaTri,
                          dichVu.chiSoDau,
                          coThayCongTo ? chiSoThayCongTo.chiSoCuoiCongToCu : undefined,
                          coThayCongTo ? chiSoThayCongTo.chiSoDauCongToMoi : undefined,
                        )
                        const canhBaoTieuThu = thongBaoChiSo ? null : taoCanhBaoTieuThu(mucTieuThu, dichVu)
                        const daGhi = Boolean(dichVu.chiSoCuoi)
                        const trangThaiDichVu = thongBaoChiSo || canhBaoTieuThu ? 'urgent' : daGhi ? 'done' : 'neutral'
                        const nhanTrangThaiDichVu = thongBaoChiSo ? 'KIỂM TRA CHỈ SỐ' : canhBaoTieuThu ? 'CAO BẤT THƯỜNG' : daGhi ? 'ĐÃ GHI' : 'CHƯA GHI'
                        const luuBiChan = chiSoBiKhoa || (kyDaChot && !lyDoSua.trim()) || dangLuu === key || !giaTri || (coThayCongTo && (!chiSoThayCongTo.chiSoCuoiCongToCu || !chiSoThayCongTo.chiSoDauCongToMoi)) || Boolean(thongBaoChiSo) || Boolean(canhBaoTieuThu)
                        const lyDoChanLuu = chiSoBiKhoa
                          ? 'Kỳ này đã chốt, không thể sửa chỉ số.'
                          : kyDaChot && !lyDoSua.trim()
                            ? 'Nhập lý do sửa kỳ đã chốt trước khi lưu.'
                          : thongBaoChiSo || (coThayCongTo && (!chiSoThayCongTo.chiSoCuoiCongToCu || !chiSoThayCongTo.chiSoDauCongToMoi)) || !giaTri
                            ? thongBaoChiSo || (coThayCongTo ? 'Cần đủ hai chỉ số của công tơ cũ và mới.' : 'Nhập chỉ số cuối trước khi lưu.')
                            : canhBaoTieuThu
                              ? 'Cần xem lại và xác nhận cảnh báo trước khi lưu.'
                              : undefined

                        return (
                          <section
                            key={key}
                            style={{
                              display: 'grid',
                              gap: 'var(--ma-space-4)',
                              minWidth: 0,
                              padding: mobile ? 'var(--ma-space-4)' : 'var(--ma-space-6)',
                              borderBottom: '1px solid var(--ma-border-default)',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 'var(--ma-space-3)',
                              }}
                            >
                              <div style={{ display: 'grid', gap: 'var(--ma-space-1)', minWidth: 0 }}>
                                <strong style={{ fontSize: 16 }}>{dichVu.tenDichVu}</strong>
                                <span style={{ color: 'var(--ma-text-secondary)', font: 'var(--ma-text-caption)' }}>
                                  Chỉ số đầu: <span style={{ fontFamily: 'var(--ma-font-mono)' }}>{dichVu.chiSoDau}</span>
                                </span>
                              </div>
                              <StatusTag tone={trangThaiDichVu}>{nhanTrangThaiDichVu}</StatusTag>
                            </div>

                            <MeterInput
                              label={`Chỉ số mới — phòng ${phong.soPhong}`}
                              value={giaTri}
                              previous={dichVu.chiSoDau}
                              state={chiSoBiKhoa ? 'locked' : thongBaoChiSo ? 'error' : giaTri ? 'filled' : 'default'}
                              error={thongBaoChiSo || undefined}
                              style={{ width: '100%', minWidth: 0 }}
                            >
                              <input
                                ref={(element) => {
                                  inputRefs.current[key] = element
                                }}
                                id={`chiSoCuoi-${key}`}
                                name={`chiSoCuoi-${phong.id}-${dichVu.id}`}
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                value={giaTri}
                                disabled={chiSoBiKhoa}
                                aria-label={`Chỉ số mới phòng ${phong.soPhong}`}
                                aria-invalid={Boolean(thongBaoChiSo) || undefined}
                                style={styleSoDo}
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
                            </MeterInput>

                            {mucTieuThu ? (
                              <p style={{ margin: 0, fontFamily: 'var(--ma-font-mono)', fontSize: 13, color: 'var(--ma-text-primary)' }}>
                                Mức tiêu thụ: {mucTieuThu} {dichVu.donVi}
                              </p>
                            ) : null}

                            <label
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--ma-space-3)',
                                minHeight: 'var(--ma-hit-mobile)',
                                font: 'var(--ma-text-body)',
                              }}
                            >
                              <input
                                name={`coThayCongTo-${phong.id}-${dichVu.id}`}
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
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: mobile ? 'minmax(0, 1fr)' : 'repeat(auto-fit, minmax(min(100%, 15rem), 1fr))',
                                  gap: 'var(--ma-space-4)',
                                }}
                              >
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
                                      setPendingReplacementReadings((current) => ({
                                        ...current,
                                        [key]: { ...chiSoThayCongTo, chiSoCuoiCongToCu: value },
                                      }))
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
                                      setPendingReplacementReadings((current) => ({
                                        ...current,
                                        [key]: { ...chiSoThayCongTo, chiSoDauCongToMoi: value },
                                      }))
                                    }}
                                  />
                                </label>
                              </div>
                            ) : null}

                            <label style={styleNhanTruong}>
                              <span>Chụp ảnh công tơ</span>
                              <input
                                name={`anhCongTo-${phong.id}-${dichVu.id}`}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                disabled={kyDaChot}
                                style={{ ...styleSoDo, padding: 'var(--ma-space-4) var(--ma-space-3)', fontFamily: 'var(--ma-font-ui)', fontSize: 13 }}
                                onChange={(event) => {
                                  void chonAnhCongTo(key, event.target.files?.[0] ?? null)
                                }}
                              />
                            </label>
                            {anhDaChon ? <p style={styleThongBao}>Đã chọn ảnh: {anhDaChon.name}</p> : null}

                            {canhBaoTieuThu ? (
                              <div
                                role="alert"
                                style={{
                                  display: 'grid',
                                  gap: 'var(--ma-space-3)',
                                  padding: 'var(--ma-space-4)',
                                  border: '1px solid var(--ma-urgent)',
                                  background: 'var(--ma-urgent-bg)',
                                }}
                              >
                                <StatusTag tone="urgent">CAO BẤT THƯỜNG</StatusTag>
                                <p style={{ ...styleThongBao, color: 'var(--ma-urgent)' }}>{canhBaoTieuThu.thongBao}</p>
                                <Button
                                  variant="secondary"
                                  size="md"
                                  data-confirm-warning-key={key}
                                  blocked={dangLuu === key || chiSoBiKhoa}
                                  blockedReason={chiSoBiKhoa ? 'Kỳ này đã chốt, không thể xác nhận lại chỉ số.' : undefined}
                                  style={{ minHeight: 'var(--ma-hit-mobile)', justifySelf: 'start' }}
                                  onClick={() => void luuChiSo(phong.id, dichVu.id, true)}
                                >
                                  {dangLuu === key ? 'Đang lưu…' : 'Xác nhận và lưu'}
                                </Button>
                              </div>
                            ) : null}

                            <div style={{ display: 'flex', flexDirection: mobile ? 'column' : undefined, flexWrap: 'wrap', alignItems: mobile ? 'stretch' : 'flex-start', gap: 'var(--ma-space-3)' }}>
                              <Button
                                variant="primary"
                                size="md"
                                glyph="cong-to"
                                data-save-key={key}
                                blocked={luuBiChan}
                                aria-describedby={luuBiChan && lyDoChanLuu ? `ly-do-luu-${key}` : undefined}
                                style={{ minHeight: 'var(--ma-hit-mobile)', width: mobile ? '100%' : undefined, justifyContent: mobile ? 'center' : undefined }}
                                onClick={() => void luuChiSo(phong.id, dichVu.id)}
                              >
                                {dangLuu === key ? 'Đang lưu…' : 'Lưu chỉ số'}
                              </Button>
                              {luuBiChan && lyDoChanLuu ? (
                                <span id={`ly-do-luu-${key}`} style={{ maxWidth: 360, color: 'var(--ma-text-secondary)', font: 'var(--ma-text-caption)', alignSelf: 'center' }}>
                                  {lyDoChanLuu}
                                </span>
                              ) : null}
                            </div>
                          </section>
                        )
                      })}
                    </div>
                  </article>
                )
              })}
            </div>
          )
        ) : null}
      </main>
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

function timCongToTiepTheo(phongs: ThongTinGhiChiSo['phong'], phongId: number, dichVuId: number) {
  const danhSach = phongs.flatMap((phong) => phong.dichVu.map((dichVu) => ({ phong, dichVu })))
  const viTri = danhSach.findIndex((muc) => muc.phong.id === phongId && muc.dichVu.id === dichVuId)
  return viTri >= 0 ? danhSach[viTri + 1] ?? null : null
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
