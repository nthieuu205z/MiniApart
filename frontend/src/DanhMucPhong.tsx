import { FormEvent, useEffect, useState } from 'react'
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

  const toaDangChon = danhSachToa.find((item) => item.id === toaDangChonId) ?? null
  const nhomPhongTheoTang = taoNhomPhongTheoTang(danhSachPhong)
  const phongDangXem = danhSachPhong.find((phong) => phong.id === phongDangXemId) ?? null

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
      setDangXuLyHangLoat(false)
    }
  }

  return (
    <section className="building-management room-management" data-testid="room-catalog" aria-labelledby="room-management-title">
      <div className="building-management__heading">
        <div>
          <p className="eyebrow">FR-BLD-02</p>
          <h3 id="room-management-title">Danh mục phòng</h3>
        </div>
        <button type="button" className="ghost-button" onClick={() => setHienBieuMauHangLoat((current) => !current)}>
          Xem trước dãy phòng
        </button>
      </div>

      <p className="status-message">
        Trạng thái phòng do hệ thống tự ghi. Bạn chỉ khai báo số phòng, tầng, diện tích, sức chứa, giá thuê mặc định và loại phòng.
      </p>

      {loi ? <p className="status-message status-message--error" role="alert">{loi}</p> : null}
      {thongBao ? <p className="status-message status-message--success" role="status">{thongBao}</p> : null}

      <div className="building-form__row">
        <label className="field">
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
          >
            {danhSachToa.map((toa) => (
              <option key={toa.id} value={toa.id}>
                {toa.ten}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Lọc theo tầng</span>
          <select name="tangLoc" value={tangLoc} onChange={(event) => setTangLoc(event.target.value)} disabled={!toaDangChon}>
            <option value="">Tất cả các tầng</option>
            {taoDanhSachTang(toaDangChon?.soTang ?? 0).map((soTang) => (
              <option key={soTang} value={soTang}>
                Tầng {soTang}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="building-layout">
        <div className="building-list">
          {dangTai || dangTaiPhong ? (
            <p className="status-message" aria-live="polite">Đang tải danh sách phòng…</p>
          ) : danhSachPhong.length === 0 ? (
            <p className="status-message">Chưa có phòng nào trong bộ lọc hiện tại.</p>
          ) : (
            <>
              <section className="building-summary room-status-summary" aria-labelledby="room-status-summary-title">
                <div className="building-summary__heading">
                  <div>
                    <p className="eyebrow">FR-BLD-03</p>
                    <h4 id="room-status-summary-title">Tổng quan sơ đồ phòng</h4>
                  </div>
                  <span className="room-status-summary__total">{danhSachPhong.length} phòng</span>
                </div>
                <div className="room-status-summary__grid">
                  {TONG_QUAN_TRANG_THAI.map((muc) => (
                    <article key={muc.ma} className={`room-status-chip room-status-chip--${muc.ma.toLowerCase()}`}>
                      <span>{muc.nhan}</span>
                      <strong>{demPhongTheoTrangThai(danhSachPhong, muc.ma)}</strong>
                    </article>
                  ))}
                </div>
              </section>

              <section className="room-floor-map" data-testid="room-floor-map" aria-label="Sơ đồ phòng theo tầng">
                {nhomPhongTheoTang.map(({ tang, phong }) => (
                  <section key={tang} className="room-floor-section" data-testid="room-floor-section" aria-labelledby={`floor-title-${tang}`}>
                    <div className="room-floor-section__header">
                      <h4 id={`floor-title-${tang}`}>Tầng {tang}</h4>
                      <span>{phong.length} phòng</span>
                    </div>
                    <div className="room-floor-grid" data-testid="room-floor-grid" data-compact-layout="true">
                      {phong.map((phongItem) => {
                        const trangThai = layThongTinTrangThai(phongItem)
                        const dangChon = phongDangXem?.id === phongItem.id

                        return (
                          <button
                            key={phongItem.id ?? `${phongItem.tang}-${phongItem.soPhong}`}
                            type="button"
                            className={`room-tile ${trangThai.lopCss} ${dangChon ? 'room-tile--active' : ''}`}
                            data-testid="room-tile"
                            aria-pressed={dangChon}
                            onClick={() => setPhongDangXemId(phongItem.id)}
                          >
                            <strong className="room-tile__number">{phongItem.soPhong}</strong>
                            <span className="room-tile__status">{trangThai.nhan}</span>
                          </button>
                        )
                      })}
                    </div>
                  </section>
                ))}
              </section>
            </>
          )}
        </div>

        <div className="building-detail">
          <section className="building-summary room-detail" data-testid="room-detail" aria-live="polite">
            {phongDangXem ? (
              <>
                <div className="building-summary__heading">
                  <div>
                    <p className="eyebrow">FR-BLD-03</p>
                    <h4>Chi tiết phòng {phongDangXem.soPhong}</h4>
                  </div>
                  <span className={`room-detail__status ${layThongTinTrangThai(phongDangXem).lopCss.replace('room-tile', 'room-detail__status')}`}>
                    {layThongTinTrangThai(phongDangXem).nhan}
                  </span>
                </div>
                <dl className="building-summary__facts">
                  <div>
                    <dt>Tầng</dt>
                    <dd>{phongDangXem.tang}</dd>
                  </div>
                  <div>
                    <dt>Loại phòng</dt>
                    <dd>{phongDangXem.loaiPhong}</dd>
                  </div>
                  <div>
                    <dt>Diện tích</dt>
                    <dd>{phongDangXem.dienTich} m²</dd>
                  </div>
                  <div>
                    <dt>Sức chứa</dt>
                    <dd>{phongDangXem.sucChua} người</dd>
                  </div>
                  <div>
                    <dt>Giá thuê mặc định</dt>
                    <dd>{phongDangXem.giaThueMacDinh}</dd>
                  </div>
                </dl>
                <p className="status-message">
                  Chi tiết lấy trực tiếp từ danh sách phòng hiện có.
                </p>
              </>
            ) : (
              <>
                <div>
                  <p className="eyebrow">FR-BLD-03</p>
                  <h4>Chi tiết phòng</h4>
                </div>
                <p className="status-message">Chọn một ô phòng trong sơ đồ để xem chi tiết hiện tại của phòng đó.</p>
              </>
            )}
          </section>

          <form className="building-form" data-testid="room-form" onSubmit={handleTaoPhong}>
            <div>
              <p className="eyebrow">FR-BLD-02</p>
              <h4>Khai báo một phòng</h4>
            </div>

            <div className="building-form__row">
              <label className="field">
                <span>Số phòng</span>
                <input name="soPhong" value={bieuMauPhong.soPhong} onChange={(event) => capNhatBieuMauPhong('soPhong', event.target.value)} required />
              </label>

              <label className="field">
                <span>Tầng</span>
                <input type="number" min="1" name="tang" value={bieuMauPhong.tang} onChange={(event) => capNhatBieuMauPhong('tang', event.target.value)} required />
              </label>
            </div>

            <div className="building-form__row">
              <label className="field">
                <span>Diện tích</span>
                <input type="number" min="0.01" step="0.01" name="dienTich" value={bieuMauPhong.dienTich} onChange={(event) => capNhatBieuMauPhong('dienTich', event.target.value)} required />
              </label>

              <label className="field">
                <span>Sức chứa</span>
                <input type="number" min="1" name="sucChua" value={bieuMauPhong.sucChua} onChange={(event) => capNhatBieuMauPhong('sucChua', event.target.value)} required />
              </label>
            </div>

            <div className="building-form__row">
              <label className="field">
                <span>Giá thuê mặc định</span>
                <input type="number" min="0" step="0.01" name="giaThueMacDinh" value={bieuMauPhong.giaThueMacDinh} onChange={(event) => capNhatBieuMauPhong('giaThueMacDinh', event.target.value)} required />
              </label>

              <label className="field">
                <span>Loại phòng</span>
                <input name="loaiPhong" value={bieuMauPhong.loaiPhong} onChange={(event) => capNhatBieuMauPhong('loaiPhong', event.target.value)} required />
              </label>
            </div>

            <div className="building-form__actions">
              <p className="building-form__hint">Máy chủ sẽ tự gán trạng thái ban đầu là Trống.</p>
              <button type="submit" className="primary-button" disabled={dangLuu || !toaDangChonId}>
                {dangLuu ? 'Đang lưu…' : 'Khai báo phòng'}
              </button>
            </div>
          </form>

          {hienBieuMauHangLoat ? (
            <form className="building-form" data-testid="room-batch-form" onSubmit={handleXemTruocHangLoat}>
              <div>
                <p className="eyebrow">FR-BLD-02</p>
                <h4>Tạo nhanh dãy phòng</h4>
              </div>

              <div className="building-form__row">
                <label className="field">
                  <span>Số bắt đầu</span>
                  <input name="soBatDau" value={bieuMauHangLoat.soBatDau} onChange={(event) => capNhatBieuMauHangLoat('soBatDau', event.target.value)} required />
                </label>

                <label className="field">
                  <span>Số kết thúc</span>
                  <input name="soKetThuc" value={bieuMauHangLoat.soKetThuc} onChange={(event) => capNhatBieuMauHangLoat('soKetThuc', event.target.value)} required />
                </label>
              </div>

              <div className="building-form__row">
                <label className="field">
                  <span>Tầng</span>
                  <input type="number" min="1" name="tang" value={bieuMauHangLoat.tang} onChange={(event) => capNhatBieuMauHangLoat('tang', event.target.value)} required />
                </label>

                <label className="field">
                  <span>Diện tích</span>
                  <input type="number" min="0.01" step="0.01" name="dienTich" value={bieuMauHangLoat.dienTich} onChange={(event) => capNhatBieuMauHangLoat('dienTich', event.target.value)} required />
                </label>
              </div>

              <div className="building-form__row">
                <label className="field">
                  <span>Sức chứa</span>
                  <input type="number" min="1" name="sucChua" value={bieuMauHangLoat.sucChua} onChange={(event) => capNhatBieuMauHangLoat('sucChua', event.target.value)} required />
                </label>

                <label className="field">
                  <span>Giá thuê mặc định</span>
                  <input type="number" min="0" step="0.01" name="giaThueMacDinh" value={bieuMauHangLoat.giaThueMacDinh} onChange={(event) => capNhatBieuMauHangLoat('giaThueMacDinh', event.target.value)} required />
                </label>
              </div>

              <label className="field">
                <span>Loại phòng</span>
                <input name="loaiPhong" value={bieuMauHangLoat.loaiPhong} onChange={(event) => capNhatBieuMauHangLoat('loaiPhong', event.target.value)} required />
              </label>

              <div className="building-form__actions">
                <button type="submit" className="ghost-button" disabled={dangXuLyHangLoat || !toaDangChonId}>
                  {dangXuLyHangLoat ? 'Đang xem trước…' : 'Xem trước'}
                </button>
                {xemTruoc.length > 0 ? (
                  <button type="button" className="primary-button" onClick={handleXacNhanHangLoat} disabled={dangXuLyHangLoat}>
                    Xác nhận tạo dãy phòng
                  </button>
                ) : null}
              </div>

              {xemTruoc.length > 0 ? (
                <p className="status-message">
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

function demPhongTheoTrangThai(danhSachPhong: ThongTinPhong[], trangThai: string) {
  return danhSachPhong.filter((phong) => phong.trangThai === trangThai).length
}
