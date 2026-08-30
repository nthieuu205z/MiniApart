import { FormEvent, useEffect, useState } from 'react'
import {
  ApiError,
  capNhatToaNha,
  fetchToaNha,
  taoToaNha,
  type ThongTinToaNha,
  type YeuCauToaNha,
} from './api'

type Props = {
  token: string
  vaiTro: string
}

type BieuMauToaNha = {
  id: number | null
  maToa: string
  ten: string
  diaChi: string
  soTang: string
  ngayChotSo: string
  soNgayHanTt: string
  tkNganHang: string
  nguongThatThoat: string
  batBuocAnhCongTo: boolean
}

export default function DanhMucToaNha({ token, vaiTro }: Props) {
  const [danhSach, setDanhSach] = useState<ThongTinToaNha[]>([])
  const [dangTai, setDangTai] = useState(true)
  const [dangLuu, setDangLuu] = useState(false)
  const [toaDangChonId, setToaDangChonId] = useState<number | null>(null)
  const [bieuMau, setBieuMau] = useState<BieuMauToaNha | null>(null)
  const [loi, setLoi] = useState<string | null>(null)
  const [thongBao, setThongBao] = useState<string | null>(null)

  const coTheTao = vaiTro === 'CHU' || vaiTro === 'QTHT'
  const toaDangChon = danhSach.find((item) => item.id === toaDangChonId) ?? danhSach[0] ?? null

  useEffect(() => {
    let mounted = true
    setDangTai(true)
    setLoi(null)

    fetchToaNha(token)
      .then((toaNha) => {
        if (!mounted) return
        setDanhSach(toaNha)
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

  function batDauTao() {
    if (!coTheTao) return
    setThongBao(null)
    setLoi(null)
    setBieuMau({
      id: null,
      maToa: '',
      ten: '',
      diaChi: '',
      soTang: '1',
      ngayChotSo: '28',
      soNgayHanTt: '7',
      tkNganHang: '',
      nguongThatThoat: '0.00',
      batBuocAnhCongTo: false,
    })
  }

  function batDauSua(toaNha: ThongTinToaNha) {
    setThongBao(null)
    setLoi(null)
    setBieuMau({
      id: toaNha.id,
      maToa: toaNha.maToa,
      ten: toaNha.ten,
      diaChi: toaNha.diaChi,
      soTang: String(toaNha.soTang),
      ngayChotSo: String(toaNha.ngayChotSo),
      soNgayHanTt: String(toaNha.soNgayHanTt),
      tkNganHang: toaNha.tkNganHang,
      nguongThatThoat: toaNha.nguongThatThoat,
      batBuocAnhCongTo: toaNha.batBuocAnhCongTo,
    })
    setToaDangChonId(toaNha.id)
  }

  function huyBieuMau() {
    setBieuMau(null)
    setLoi(null)
  }

  async function luuToaNha(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!bieuMau) return

    setDangLuu(true)
    setLoi(null)
    setThongBao(null)

    try {
      const payload = chuyenThanhPayload(bieuMau)
      const toaNha = bieuMau.id === null
        ? await taoToaNha(token, payload)
        : await capNhatToaNha(token, bieuMau.id, payload)

      setDanhSach((current) => {
        if (bieuMau.id === null) {
          return [...current, toaNha]
        }
        return current.map((item) => item.id === toaNha.id ? toaNha : item)
      })
      setToaDangChonId(toaNha.id)
      setBieuMau(null)
      setThongBao(bieuMau.id === null ? 'Đã khai báo toà nhà mới.' : 'Đã cập nhật thông tin toà nhà.')
    } catch (reason: unknown) {
      setLoi(thongBaoLoi(reason, 'Không thể lưu thông tin toà nhà.'))
    } finally {
      setDangLuu(false)
    }
  }

  function capNhatTruong(tenTruong: keyof BieuMauToaNha, giaTri: string | boolean) {
    setBieuMau((current) => current ? { ...current, [tenTruong]: giaTri } : current)
  }

  return (
    <section className="building-management" data-testid="building-catalog" aria-labelledby="building-management-title">
      <div className="building-management__heading">
        <div>
          <p className="eyebrow">FR-BLD-01</p>
          <h3 id="building-management-title">Danh mục toà nhà</h3>
        </div>
        {coTheTao ? (
          <button type="button" className="primary-button" onClick={batDauTao}>
            Khai báo toà mới
          </button>
        ) : null}
      </div>

      <p className="status-message">
        Máy chủ tự giới hạn danh sách theo quyền được xem. Ngày chốt số chỉ nhận từ 1 đến 28 để tháng hai vẫn luôn có ngày chốt.
      </p>

      {loi ? <p className="status-message status-message--error" role="alert">{loi}</p> : null}
      {thongBao ? <p className="status-message status-message--success" role="status">{thongBao}</p> : null}

      <div className="building-layout">
        <div className="building-list">
          {dangTai ? (
            <p className="status-message" aria-live="polite">Đang tải danh sách toà nhà…</p>
          ) : danhSach.length === 0 ? (
            <p className="status-message">Chưa có toà nhà nào.</p>
          ) : (
            danhSach.map((toaNha) => {
              const dangChon = toaDangChon?.id === toaNha.id

              return (
                <button
                  key={toaNha.id}
                  type="button"
                  className={`building-card ${dangChon ? 'building-card--active' : ''}`}
                  onClick={() => setToaDangChonId(toaNha.id)}
                >
                  <div className="building-card__topline">
                    <strong>{toaNha.ten}</strong>
                    <span>{toaNha.maToa}</span>
                  </div>
                  <p>{toaNha.diaChi}</p>
                  <dl className="building-card__facts">
                    <div>
                      <dt>Số tầng</dt>
                      <dd>{toaNha.soTang}</dd>
                    </div>
                    <div>
                      <dt>Ngày chốt số</dt>
                      <dd>{toaNha.ngayChotSo}</dd>
                    </div>
                    <div>
                      <dt>Ngưỡng thất thoát</dt>
                      <dd>{toaNha.nguongThatThoat}</dd>
                    </div>
                  </dl>
                </button>
              )
            })
          )}
        </div>

        <div className="building-detail">
          {toaDangChon ? (
            <div className="building-summary">
              <div className="building-summary__heading">
                <div>
                  <p className="eyebrow">TOÀ ĐANG CHỌN</p>
                  <h4>{toaDangChon.ten}</h4>
                </div>
                <button type="button" className="ghost-button" onClick={() => batDauSua(toaDangChon)}>
                  Sửa {toaDangChon.ten}
                </button>
              </div>

              <dl className="building-summary__facts">
                <div>
                  <dt>Mã toà</dt>
                  <dd>{toaDangChon.maToa}</dd>
                </div>
                <div>
                  <dt>Địa chỉ</dt>
                  <dd>{toaDangChon.diaChi}</dd>
                </div>
                <div>
                  <dt>Hạn thanh toán</dt>
                  <dd>{toaDangChon.soNgayHanTt} ngày</dd>
                </div>
                <div>
                  <dt>Tài khoản nhận tiền</dt>
                  <dd>{toaDangChon.tkNganHang}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <p className="status-message">Chọn một toà nhà để xem chi tiết.</p>
          )}

          {bieuMau ? (
            <form className="building-form" data-testid="building-form" onSubmit={luuToaNha}>
              <div>
                <p className="eyebrow">FR-BLD-01</p>
                <h4>{bieuMau.id === null ? 'Khai báo toà nhà' : 'Sửa toà nhà'}</h4>
              </div>

              <label className="field">
                <span>Mã toà</span>
                <input
                  name="maToa"
                  value={bieuMau.maToa}
                  onChange={(event) => capNhatTruong('maToa', event.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>Tên toà</span>
                <input
                  name="ten"
                  value={bieuMau.ten}
                  onChange={(event) => capNhatTruong('ten', event.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>Địa chỉ</span>
                <textarea
                  name="diaChi"
                  value={bieuMau.diaChi}
                  onChange={(event) => capNhatTruong('diaChi', event.target.value)}
                  rows={3}
                  required
                />
              </label>

              <div className="building-form__row">
                <label className="field">
                  <span>Số tầng</span>
                  <input
                    type="number"
                    name="soTang"
                    min="1"
                    value={bieuMau.soTang}
                    onChange={(event) => capNhatTruong('soTang', event.target.value)}
                    required
                  />
                </label>

                <label className="field">
                  <span>Ngày chốt số</span>
                  <input
                    type="number"
                    name="ngayChotSo"
                    min="1"
                    max="28"
                    value={bieuMau.ngayChotSo}
                    onChange={(event) => capNhatTruong('ngayChotSo', event.target.value)}
                    required
                  />
                </label>
              </div>

              <p className="building-form__hint">
                Chỉ dùng giá trị từ 1 đến 28 để tháng hai cũng luôn có ngày chốt số hợp lệ.
              </p>

              <div className="building-form__row">
                <label className="field">
                  <span>Hạn thanh toán</span>
                  <input
                    type="number"
                    name="soNgayHanTt"
                    min="1"
                    value={bieuMau.soNgayHanTt}
                    onChange={(event) => capNhatTruong('soNgayHanTt', event.target.value)}
                    required
                  />
                </label>

                <label className="field">
                  <span>Ngưỡng thất thoát</span>
                  <input
                    type="number"
                    name="nguongThatThoat"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={bieuMau.nguongThatThoat}
                    onChange={(event) => capNhatTruong('nguongThatThoat', event.target.value)}
                    required
                  />
                </label>
              </div>

              <label className="field">
                <span>Tài khoản ngân hàng nhận tiền</span>
                <input
                  name="tkNganHang"
                  value={bieuMau.tkNganHang}
                  onChange={(event) => capNhatTruong('tkNganHang', event.target.value)}
                  required
                />
              </label>

              <label className="field field--checkbox">
                <input
                  name="batBuocAnhCongTo"
                  type="checkbox"
                  checked={bieuMau.batBuocAnhCongTo}
                  onChange={(event) => capNhatTruong('batBuocAnhCongTo', event.target.checked)}
                />
                <span>Bắt buộc ảnh công tơ khi ghi chỉ số</span>
              </label>

              <div className="building-form__actions">
                <button type="button" className="ghost-button" onClick={huyBieuMau}>
                  Huỷ
                </button>
                <button type="submit" className="primary-button" disabled={dangLuu}>
                  {dangLuu ? 'Đang lưu…' : bieuMau.id === null ? 'Lưu toà nhà' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function chuyenThanhPayload(bieuMau: BieuMauToaNha): YeuCauToaNha {
  return {
    maToa: bieuMau.maToa,
    ten: bieuMau.ten,
    diaChi: bieuMau.diaChi,
    soTang: Number(bieuMau.soTang),
    ngayChotSo: Number(bieuMau.ngayChotSo),
    soNgayHanTt: Number(bieuMau.soNgayHanTt),
    tkNganHang: bieuMau.tkNganHang,
    nguongThatThoat: bieuMau.nguongThatThoat,
    batBuocAnhCongTo: bieuMau.batBuocAnhCongTo,
  }
}

function thongBaoLoi(reason: unknown, fallback: string) {
  if (reason instanceof ApiError) {
    return reason.message
  }
  if (reason instanceof Error) {
    return reason.message
  }
  return fallback
}
