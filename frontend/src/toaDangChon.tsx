// Bối cảnh toà dùng chung cho cả khung (UX v2): chọn một lần ở sidebar, nhớ trong localStorage, mọi màn đọc từ đây.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchToaNha, type ThongTinToaNha } from './api'

export const KHOA_LUU_TOA = 'ma.toaNhaId'

export type ToaDangChon = {
  /** null = "Tất cả toà" (chỉ Chủ mới có lựa chọn này). */
  toaNhaId: number | null
  danhSach: ThongTinToaNha[]
  /** true khi vai trò chỉ có một toà (Quản lý) → ô chọn toà là ô tĩnh. */
  coDinh: boolean
  dangTai: boolean
  loi: string | null
  chon: (id: number | null) => void
}

const MAC_DINH: ToaDangChon = { toaNhaId: null, danhSach: [], coDinh: true, dangTai: false, loi: null, chon: () => undefined }
const Ctx = createContext<ToaDangChon>(MAC_DINH)

/** true khi component nằm ngoài `ToaDangChonProvider` (vd test màn riêng lẻ): `useBuildings` quay về tự tải danh sách toà. */
export const ngoaiProvider = (t: ToaDangChon) => t === MAC_DINH

function docLuu(): number | null {
  try {
    const v = Number(globalThis.localStorage?.getItem(KHOA_LUU_TOA))
    return Number.isSafeInteger(v) && v > 0 ? v : null
  } catch { return null }
}
function ghiLuu(id: number | null) {
  try {
    if (id === null) globalThis.localStorage?.removeItem(KHOA_LUU_TOA)
    else globalThis.localStorage?.setItem(KHOA_LUU_TOA, String(id))
  } catch { /* trình duyệt chặn storage: vẫn chạy, chỉ không nhớ */ }
}
export function docToaTuUrl(search: string): number | null {
  const raw = new URLSearchParams(search).get('toaNhaId')
  if (raw === null || !/^[1-9]\d*$/.test(raw)) return null
  return Number(raw)
}

type Props = {
  token: string | null
  vaiTro: string | null | undefined
  /** `location.search` hiện tại: link cũ còn `?toaNhaId=` thì khung nhận luôn toà đó. */
  search: string
  children: ReactNode
  taiToa?: (token: string) => Promise<ThongTinToaNha[]>
}

export function ToaDangChonProvider({ token, vaiTro, search, children, taiToa = fetchToaNha }: Props) {
  const canToa = vaiTro === 'CHU' || vaiTro === 'QUAN_LY'
  const [danhSach, setDanhSach] = useState<ThongTinToaNha[]>([])
  const [toaNhaId, setToaNhaId] = useState<number | null>(null)
  const [dangTai, setDangTai] = useState(false)
  const [loi, setLoi] = useState<string | null>(null)

  useEffect(() => {
    setDanhSach([]); setToaNhaId(null); setLoi(null)
    if (!token || !canToa) return undefined
    let active = true
    setDangTai(true)
    taiToa(token)
      .then((ds) => {
        if (!active) return
        setDanhSach(ds)
        const co = (id: number | null) => id !== null && ds.some((t) => t.id === id)
        if (ds.length === 1) { setToaNhaId(ds[0].id); return }
        const tuUrl = docToaTuUrl(search)
        const luu = docLuu()
        // Toà đã lưu không còn trong danh sách (đổi tài khoản, toà bị gỡ) → về "Tất cả", xoá giá trị cũ.
        const id = co(tuUrl) ? tuUrl : co(luu) ? luu : null
        if (luu !== null && !co(luu)) ghiLuu(null)
        if (id !== null && id !== luu) ghiLuu(id)
        setToaNhaId(id)
      })
      .catch((e: unknown) => { if (active) setLoi(e instanceof Error ? e.message : 'Không tải được danh sách toà.') })
      .finally(() => { if (active) setDangTai(false) })
    return () => { active = false }
    // Cố ý không phụ thuộc `search`: chỉ đọc lúc tải; đổi search sau đó do effect dưới lo.
  }, [token, canToa, taiToa])

  const coDinh = !canToa || danhSach.length === 1

  // Điều hướng tới link cũ có ?toaNhaId= (vd từ thông báo) → nhận toà đó, nhớ luôn.
  useEffect(() => {
    if (coDinh) return
    const id = docToaTuUrl(search)
    if (id !== null && id !== toaNhaId && danhSach.some((t) => t.id === id)) { setToaNhaId(id); ghiLuu(id) }
  }, [search, coDinh, danhSach, toaNhaId])

  const chon = useCallback((id: number | null) => {
    if (coDinh) return
    if (id !== null && !danhSach.some((t) => t.id === id)) return
    setToaNhaId(id); ghiLuu(id)
  }, [coDinh, danhSach])

  const giaTri = useMemo<ToaDangChon>(() => ({ toaNhaId, danhSach, coDinh, dangTai, loi, chon }), [toaNhaId, danhSach, coDinh, dangTai, loi, chon])
  return <Ctx.Provider value={giaTri}>{children}</Ctx.Provider>
}

export function useToaDangChon(): ToaDangChon {
  return useContext(Ctx)
}

/**
 * Cho màn chỉ xem được từng toà (Chu kỳ tháng, Ghi chỉ số, Dịch vụ, An toàn…):
 * - đang chọn một toà → dùng toà đó;
 * - đang "Tất cả" (chỉ Chủ) → `toaNhaId = null` và `canChonTaiCho = true`: màn hiện ô chọn toà tại chỗ,
 *   chọn ở đó sẽ đổi luôn toà của khung (nhớ cho các màn sau).
 */
export function useMotToa(opts?: { tuChonDau?: boolean }): { toaNhaId: number | null; canChonTaiCho: boolean; danhSach: ThongTinToaNha[]; chon: (id: number | null) => void } {
  const t = useToaDangChon()
  // Màn cần đúng một toà: Chủ đang ở "Tất cả toà" thì chọn toà đầu (hiện ngay ở ô toà của khung) thay vì để trang trống chờ chọn.
  const { toaNhaId, coDinh, danhSach, chon } = t
  const tuChon = opts?.tuChonDau === true
  useEffect(() => { if (tuChon && toaNhaId === null && !coDinh && danhSach.length > 0) chon(danhSach[0].id) }, [tuChon, toaNhaId, coDinh, danhSach, chon])
  return { toaNhaId: t.toaNhaId, canChonTaiCho: t.toaNhaId === null && !t.coDinh, danhSach: t.danhSach, chon: t.chon }
}

/** Tên ngắn để hiện ở đầu trang ("Tất cả 3 toà" / tên toà). */
export function tenToaDangChon(t: Pick<ToaDangChon, 'toaNhaId' | 'danhSach'>): string {
  if (t.toaNhaId === null) return `Tất cả ${t.danhSach.length} toà`
  return t.danhSach.find((x) => x.id === t.toaNhaId)?.ten ?? ''
}
