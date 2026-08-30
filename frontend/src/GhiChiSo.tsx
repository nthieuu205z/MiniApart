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
import { nenAnhCongTo } from './meterPhoto'

type Props = {
  token: string
}

type PendingValues = Record<string, string>
type PendingReplacementFlags = Record<string, boolean>
type PendingReplacementReadings = Record<string, { chiSoCuoiCongToCu: string, chiSoDauCongToMoi: string }>
type PendingPhotos = Record<string, File | null>

export default function GhiChiSo({ token }: Props) {
  const [danhSachToaNha, setDanhSachToaNha] = useState<ThongTinToaNha[]>([])
  const [danhSachKy, setDanhSachKy] = useState<ThongTinKyThanhToan[]>([])
  const [toaNhaId, setToaNhaId] = useState<number | null>(null)
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
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

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
      const ketQua = await ghiChiSoDichVu(token, toaNhaId, kyId, {
        phongId,
        dichVuId,
        chiSoCuoi: giaTri,
        coThayCongTo,
        chiSoCuoiCongToCu: coThayCongTo ? chiSoThayCongTo.chiSoCuoiCongToCu : undefined,
        chiSoDauCongToMoi: coThayCongTo ? chiSoThayCongTo.chiSoDauCongToMoi : undefined,
        xacNhanCanhBao: xacNhanCanhBao || undefined,
        tep,
      })

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
    const dichVuDauTien = phong?.dichVu[0]
    if (!phong || !dichVuDauTien) return
    inputRefs.current[khoa(phong.id, dichVuDauTien.id)]?.focus()
  }

  function focusTiepTheo(phongId: number, dichVuId: number) {
    const danhSachKhoa = danhSachTangPhong.flatMap((phong) => phong.dichVu.map((dichVu) => khoa(phong.id, dichVu.id)))
    const viTriHienTai = danhSachKhoa.indexOf(khoa(phongId, dichVuId))
    const khoaTiepTheo = danhSachKhoa[viTriHienTai + 1]
    if (!khoaTiepTheo) return
    inputRefs.current[khoaTiepTheo]?.focus()
  }

  if (dangTai) {
    return <section className="meter-screen" aria-label="Ghi chỉ số">Đang tải toà nhà…</section>
  }

  return (
    <section className="meter-screen" aria-labelledby="meter-title" data-testid="meter-screen">
      <div className="meter-header">
        <div>
          <p className="eyebrow">FR-MTR-01 / FR-MTR-02 / FR-MTR-03 / FR-MTR-04</p>
          <h3 id="meter-title">Ghi chỉ số</h3>
        </div>
        <p className="meter-progress">{duLieu ? `${duLieu.daGhi} / ${duLieu.tongPhong} phòng` : '0 / 0 phòng'}</p>
      </div>

      <div className="meter-toolbar">
        <label className="field">
          <span>Toà nhà</span>
          <select
            value={toaNhaId ?? ''}
            onChange={(event) => {
              setToaNhaId(Number(event.target.value))
              setKyId(null)
              setDuLieu(null)
            }}
            disabled={dangTaiKy || danhSachToaNha.length === 0}
          >
            {danhSachToaNha.map((toa) => (
              <option key={toa.id} value={toa.id}>
                {toa.ten}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Kỳ thanh toán</span>
          <select
            value={kyId ?? ''}
            onChange={(event) => setKyId(Number(event.target.value))}
            disabled={dangTaiChiSo || danhSachKy.length === 0}
          >
            {danhSachKy.map((ky) => (
              <option key={ky.id} value={ky.id}>
                {ky.thang}/{ky.nam}
              </option>
            ))}
          </select>
        </label>
      </div>

      {toaNhaDangChon ? <p className="status-message">Toà: {toaNhaDangChon.ten}</p> : null}
      {kyDangChon ? <p className="status-message">Kỳ: {kyDangChon.thang}/{kyDangChon.nam}</p> : null}
      {dangTaiKy || dangTaiChiSo ? <p className="status-message">Đang tải dữ liệu chỉ số…</p> : null}
      {kyDangChon ? (
        <section className="meter-close-panel" aria-labelledby="meter-close-title">
          <div className="status-card__heading">
            <div>
              <p className="eyebrow">FR-MTR-08</p>
              <h4 id="meter-close-title">Chốt kỳ</h4>
            </div>
            <button
              type="button"
              className="ghost-button"
              data-close-period
              disabled={dangChotKy || kyDangChon.trangThai === 'DA_CHOT'}
              onClick={() => void chotKyDangChon()}
            >
              {dangChotKy ? 'Đang chốt…' : 'Chốt kỳ'}
            </button>
          </div>
          {dangTaiPhongChuaGhiChiSo ? (
            <p className="status-message">Đang tải phòng còn thiếu…</p>
          ) : danhSachPhongChuaGhiChiSo.length > 0 ? (
            <div className="meter-missing-list">
              <p className="status-message">Phòng còn thiếu</p>
              {danhSachPhongChuaGhiChiSo.map((phong) => (
                <button
                  key={phong.id}
                  type="button"
                  className="meter-missing-list__item"
                  data-missing-room-key={phong.id}
                  onClick={() => focusPhong(phong.id)}
                >
                  Phòng {phong.soPhong} tầng {phong.tang}
                </button>
              ))}
            </div>
          ) : (
            <p className="status-message">Không còn phòng nào thiếu chỉ số.</p>
          )}
        </section>
      ) : null}
      {loi ? <p className="status-message status-message--error" role="alert">{loi}</p> : null}

      {duLieu ? (
        duLieu.phong.length === 0 ? (
          <p className="status-message">Không có phòng đủ điều kiện để ghi.</p>
        ) : (
          <div className="meter-list">
            {duLieu.phong.map((phong) => (
              <article key={phong.id} className="meter-room">
                <header className="meter-room__header">
                  <div>
                    <p className="eyebrow">TẦNG {phong.tang}</p>
                    <h4>Phòng {phong.soPhong}</h4>
                  </div>
                </header>
                <div className="meter-services">
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

                    return (
                      <div key={key} className="meter-service">
                        <div className="meter-service__meta">
                          <strong>{dichVu.tenDichVu}</strong>
                          <span>Chỉ số đầu: {dichVu.chiSoDau}</span>
                        </div>
                        <input
                          ref={(element) => {
                            inputRefs.current[key] = element
                          }}
                          className="meter-input"
                          name={`chiSoCuoi-${phong.id}-${dichVu.id}`}
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          value={giaTri}
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
                        <label className="meter-service__toggle">
                          <input
                            name={`coThayCongTo-${phong.id}-${dichVu.id}`}
                            type="checkbox"
                            checked={coThayCongTo}
                            onChange={(event) => {
                              const checked = event.target.checked
                              setPendingReplacementFlags((current) => ({ ...current, [key]: checked }))
                            }}
                          />
                          <span>Thay công tơ</span>
                        </label>
                        {coThayCongTo ? (
                          <>
                            <label className="field">
                              <span>Chỉ số cuối công tơ cũ</span>
                              <input
                                name={`chiSoCuoiCongToCu-${phong.id}-${dichVu.id}`}
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                value={chiSoThayCongTo.chiSoCuoiCongToCu}
                                onChange={(event) => {
                                  const value = event.target.value
                                  setPendingReplacementReadings((current) => ({
                                    ...current,
                                    [key]: { ...chiSoThayCongTo, chiSoCuoiCongToCu: value },
                                  }))
                                }}
                              />
                            </label>
                            <label className="field">
                              <span>Chỉ số đầu công tơ mới</span>
                              <input
                                name={`chiSoDauCongToMoi-${phong.id}-${dichVu.id}`}
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                value={chiSoThayCongTo.chiSoDauCongToMoi}
                                onChange={(event) => {
                                  const value = event.target.value
                                  setPendingReplacementReadings((current) => ({
                                    ...current,
                                    [key]: { ...chiSoThayCongTo, chiSoDauCongToMoi: value },
                                  }))
                                }}
                              />
                            </label>
                          </>
                        ) : null}
                        <label className="field field--file">
                          <span>Ảnh công tơ</span>
                          <input
                            name={`anhCongTo-${phong.id}-${dichVu.id}`}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(event) => {
                              void chonAnhCongTo(key, event.target.files?.[0] ?? null)
                            }}
                          />
                        </label>
                        {anhDaChon ? <p className="status-message">Đã chọn ảnh: {anhDaChon.name}</p> : null}
                        {thongBaoChiSo ? (
                          <p className="status-message status-message--error" role="alert">{thongBaoChiSo}</p>
                        ) : null}
                        {canhBaoTieuThu ? (
                          <div className="meter-service__warning" role="alert">
                            <p className="status-message status-message--warning">{canhBaoTieuThu.thongBao}</p>
                            <button
                              type="button"
                              className="ghost-button"
                              data-confirm-warning-key={key}
                              disabled={dangLuu === key}
                              onClick={() => void luuChiSo(phong.id, dichVu.id, true)}
                            >
                              {dangLuu === key ? 'Đang lưu…' : 'Xác nhận và lưu'}
                            </button>
                          </div>
                        ) : null}
                        {mucTieuThu ? (
                          <p className="meter-service__consumption">Mức tiêu thụ: {mucTieuThu} {dichVu.donVi}</p>
                        ) : null}
                        <div className="meter-service__actions">
                          <button
                            type="button"
                            className="ghost-button"
                            data-save-key={key}
                            disabled={dangLuu === key || !giaTri || (coThayCongTo && (!chiSoThayCongTo.chiSoCuoiCongToCu || !chiSoThayCongTo.chiSoDauCongToMoi)) || Boolean(thongBaoChiSo) || Boolean(canhBaoTieuThu)}
                            onClick={() => void luuChiSo(phong.id, dichVu.id)}
                          >
                            {dangLuu === key ? 'Đang lưu…' : 'Lưu'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </article>
            ))}
          </div>
        )
      ) : null}
    </section>
  )
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
    thongBao: `Mức tiêu thụ kỳ này là ${mucTieuThu}, trung bình ba kỳ trước là ${thongTinCanhBao.trungBinhBaKyTruoc}, gấp ${gapTrungBinh} lần.`,
  }
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
