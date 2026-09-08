import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchLienKetAnh,
  fetchViecCuaToi,
  hoanThanhViecCuaToi,
  type ThongTinViecCuaToi,
} from './api'
import { Button } from './design/core/Button'
import { StatusTag } from './design/core/StatusTag'
import { SysLabel } from './design/core/SysLabel'
import { EmptyState } from './design/feedback/EmptyState'
import { Toast } from './design/feedback/Toast'

const THOI_GIAN_HOAN_TAC_MS = 10_000
const TRANG_THAI_DA_XONG = new Set(['CHO_XAC_NHAN', 'DA_DONG', 'DA_HUY'])

export type ViecCuaToiProps = {
  token: string
}

/** FR-MNT-04/NFR-USA-03: the worker's complete mobile work surface, with no secondary navigation. */
export function ViecCuaToi({ token }: ViecCuaToiProps): React.ReactElement {
  const [danhSach, setDanhSach] = useState<ThongTinViecCuaToi[]>([])
  const [dangTai, setDangTai] = useState(true)
  const [loiTai, setLoiTai] = useState(false)
  const [loiHanhDong, setLoiHanhDong] = useState<number | null>(null)
  const [dangHoanTac, setDangHoanTac] = useState<Set<number>>(() => new Set())
  const [yeuCauHoanTac, setYeuCauHoanTac] = useState<Set<number>>(() => new Set())
  const [lienKetAnh, setLienKetAnh] = useState<Record<number, string>>({})
  const [anhLoi, setAnhLoi] = useState<Set<number>>(() => new Set())
  const [lanTaiAnh, setLanTaiAnh] = useState(0)
  const boHenGio = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const taiDanhSach = useCallback(async () => {
    setDangTai(true)
    setLoiTai(false)
    try {
      const danhSachTuMayChu = await fetchViecCuaToi(token)
      setDanhSach(sapXepViec(danhSachTuMayChu.filter((viec) => !TRANG_THAI_DA_XONG.has(viec.trangThai))))
    } catch {
      setLoiTai(true)
    } finally {
      setDangTai(false)
    }
  }, [token])

  useEffect(() => {
    void taiDanhSach()
  }, [taiDanhSach])

  useEffect(() => {
    let conHieuLuc = true
    const ids = [...new Set(danhSach.flatMap((viec) => viec.anh.map((anh) => anh.id)))]
    if (ids.length === 0) {
      setLienKetAnh({})
      setAnhLoi(new Set())
      return () => {
        conHieuLuc = false
      }
    }

    void Promise.all(ids.map(async (id) => {
      try {
        return { id, url: await fetchLienKetAnh(token, id), error: false }
      } catch {
        return { id, url: null, error: true }
      }
    })).then((ketQua) => {
      if (!conHieuLuc) return
      const urls: Record<number, string> = {}
      const errors = new Set<number>()
      for (const item of ketQua) {
        if (item.url) urls[item.id] = item.url
        if (item.error) errors.add(item.id)
      }
      setLienKetAnh(urls)
      setAnhLoi(errors)
    })

    return () => {
      conHieuLuc = false
    }
  }, [danhSach, token, lanTaiAnh])

  useEffect(() => () => {
    for (const timer of boHenGio.current.values()) clearTimeout(timer)
    boHenGio.current.clear()
  }, [])

  const danhSachSapXep = useMemo(() => sapXepViec(danhSach), [danhSach])

  function xuLyHoanTac(id: number) {
    const timer = boHenGio.current.get(id)
    if (timer) clearTimeout(timer)
    boHenGio.current.delete(id)
    setDangHoanTac((current) => xoaKhoiTapHop(current, id))
    setYeuCauHoanTac((current) => xoaKhoiTapHop(current, id))
    setLoiHanhDong((current) => (current === id ? null : current))
  }

  function xuLyBaoDaSuaXong(id: number) {
    if (dangHoanTac.has(id)) return
    setLoiHanhDong(null)
    setDangHoanTac((current) => new Set(current).add(id))
    setYeuCauHoanTac((current) => new Set(current).add(id))

    const timer = setTimeout(async () => {
      try {
        await hoanThanhViecCuaToi(token, id)
        setDanhSach((current) => current.filter((viec) => viec.id !== id))
        setDangHoanTac((current) => xoaKhoiTapHop(current, id))
        setYeuCauHoanTac((current) => xoaKhoiTapHop(current, id))
      } catch {
        setDangHoanTac((current) => xoaKhoiTapHop(current, id))
        setYeuCauHoanTac((current) => xoaKhoiTapHop(current, id))
        setLoiHanhDong(id)
      } finally {
        boHenGio.current.delete(id)
      }
    }, THOI_GIAN_HOAN_TAC_MS)
    boHenGio.current.set(id, timer)
  }

  function xuLyTaiLaiAnh(id: number) {
    setAnhLoi((current) => xoaKhoiTapHop(current, id))
    setLanTaiAnh((current) => current + 1)
  }

  return (
    <main className="ma-worker-screen" data-testid="worker-screen" aria-busy={dangTai || undefined}>
      <div className="ma-worker-content">
        <header className="ma-worker-header">
          <SysLabel tone="primary">THỢ SỬA CHỮA</SysLabel>
          <h1>Việc của tôi</h1>
          <p>Việc được giao hôm nay</p>
        </header>

        {dangTai ? (
          <section className="ma-worker-loading" data-testid="worker-loading" aria-label="Đang tải danh sách việc">
            <div className="ma-worker-skeleton" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <p className="ma-worker-feedback" aria-live="polite">Đang tải việc…</p>
          </section>
        ) : loiTai ? (
          <EmptyState
            kind="error"
            data-testid="worker-error"
            title="Không tải được danh sách việc. "
            actionLabel="Thử lại"
            actionSize="md"
            onAction={() => void taiDanhSach()}
          />
        ) : danhSachSapXep.length === 0 ? (
          <EmptyState
            data-testid="worker-empty"
            title="Hôm nay không có việc nào."
          />
        ) : (
          <section className="ma-worker-list" aria-label="Danh sách việc được giao">
            {danhSachSapXep.map((viec) => (
              <ViecCard
                key={viec.id}
                viec={viec}
                lienKetAnh={lienKetAnh}
                anhLoi={anhLoi}
                dangHoanTac={dangHoanTac.has(viec.id)}
                onComplete={() => xuLyBaoDaSuaXong(viec.id)}
                onRetryImage={xuLyTaiLaiAnh}
              />
            ))}
          </section>
        )}

        {loiHanhDong !== null ? (
          <div className="ma-worker-action-error" role="alert">
            <span>Không thể báo đã sửa xong. Việc vẫn còn trong danh sách, thử lại khi có mạng.</span>
            <Button
              variant="secondary"
              size="md"
              onClick={() => xuLyBaoDaSuaXong(loiHanhDong)}
              style={{ minHeight: 'var(--ma-hit-mobile)' }}
            >
              Thử lại
            </Button>
          </div>
        ) : null}
      </div>

      {[...yeuCauHoanTac].map((id, index) => (
        <Toast
          key={id}
          data-testid={`undo-${id}`}
          aria-live="polite"
          onUndo={() => xuLyHoanTac(id)}
          style={{
            position: 'fixed',
            zIndex: 20,
            right: 'max(16px, env(safe-area-inset-right))',
            bottom: `calc(max(16px, env(safe-area-inset-bottom)) + ${index * 60}px)`,
            left: 'max(16px, env(safe-area-inset-left))',
            maxWidth: 520,
            margin: '0 auto',
          }}
        >
          Đã báo xong —{' '}
        </Toast>
      ))}
    </main>
  )
}

type ViecCardProps = {
  viec: ThongTinViecCuaToi
  lienKetAnh: Record<number, string>
  anhLoi: Set<number>
  dangHoanTac: boolean
  onComplete: () => void
  onRetryImage: (id: number) => void
}

function ViecCard({ viec, lienKetAnh, anhLoi, dangHoanTac, onComplete, onRetryImage }: ViecCardProps): React.ReactElement {
  const anhHienThi = viec.anh
    .map((anh) => ({ ...anh, url: lienKetAnh[anh.id] }))
    .filter((anh): anh is typeof anh & { url: string } => Boolean(anh.url))

  return (
    <article
      className="ma-worker-task"
      data-testid="repair-task"
      data-task-id={viec.id}
      data-pending={dangHoanTac ? 'true' : undefined}
      aria-busy={dangHoanTac || undefined}
    >
      <div className="ma-worker-task-heading">
        <div>
          <h2>Phòng {viec.soPhong}</h2>
          <p>{viec.toaNha} · Tầng {viec.tang}</p>
        </div>
        <StatusTag tone={layToneMucDo(viec.mucDo)}>{viec.tenMucDo}</StatusTag>
      </div>

      <p className="ma-worker-description">{viec.moTa}</p>

      {anhHienThi.length > 0 ? (
        <div className="ma-worker-images" aria-label={`Ảnh hiện trạng phòng ${viec.soPhong}`}>
          {anhHienThi.map((anh, index) => (
            <img
              key={anh.id}
              src={anh.url}
              width="480"
              height="360"
              loading="lazy"
              alt={`Ảnh hiện trạng phòng ${viec.soPhong} ${index + 1}`}
            />
          ))}
        </div>
      ) : null}

      {viec.anh.some((anh) => anhLoi.has(anh.id)) ? (
        <div className="ma-worker-image-error" role="status">
          <span>Không thể tải ảnh hiện trạng.</span>
          <Button
            variant="secondary"
            size="md"
            onClick={() => viec.anh.filter((anh) => anhLoi.has(anh.id)).forEach((anh) => onRetryImage(anh.id))}
            style={{ minHeight: 'var(--ma-hit-mobile)' }}
          >
            Thử tải ảnh lại
          </Button>
        </div>
      ) : null}

      {viec.soDienThoaiLienHe ? (
        <a className="ma-worker-phone" href={`tel:${viec.soDienThoaiLienHe}`}>
          <span>Gọi người thuê</span>
          <strong>{viec.soDienThoaiLienHe}</strong>
        </a>
      ) : null}

      <Button
        data-testid="complete-work"
        variant="primary"
        blocked={dangHoanTac}
        onClick={onComplete}
        style={{ width: '100%', minHeight: 48, justifyContent: 'center' }}
      >
        {dangHoanTac ? 'Đang chờ hoàn tác…' : 'Đã sửa xong'}
      </Button>
    </article>
  )
}

function sapXepViec(danhSach: ThongTinViecCuaToi[]) {
  const mucDoUuTien: Record<string, number> = {
    KHAN_CAP: 0,
    GAP: 1,
    THUONG: 2,
  }
  return danhSach
    .map((viec, index) => ({ viec, index }))
    .sort((a, b) => (mucDoUuTien[a.viec.mucDo] ?? 3) - (mucDoUuTien[b.viec.mucDo] ?? 3) || a.index - b.index)
    .map(({ viec }) => viec)
}

function xoaKhoiTapHop(current: Set<number>, id: number) {
  const next = new Set(current)
  next.delete(id)
  return next
}

function layToneMucDo(mucDo: string): 'urgent' | 'waiting' | 'neutral' {
  if (mucDo === 'KHAN_CAP') return 'urgent'
  if (mucDo === 'GAP') return 'waiting'
  return 'neutral'
}
