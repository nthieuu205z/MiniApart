import { FormEvent, useEffect, useState, type ReactNode } from "react";
import {
  ApiError,
  capNhatToaNha,
  fetchToaNha,
  taoToaNha,
  type ThongTinToaNha,
  type YeuCauToaNha,
} from "./api";
import { Button } from "./design/core/Button";
import { EmptyState } from "./design/feedback/EmptyState";
import { StatStrip } from "./design/shell/StatStrip";
type Props = { token: string; vaiTro: string };
type Form = {
  id: number | null;
  maToa: string;
  ten: string;
  diaChi: string;
  soTang: string;
  ngayChotSo: string;
  soNgayHanTt: string;
  tkNganHang: string;
  nguongThatThoat: string;
  batBuocAnhCongTo: boolean;
};
const input = {
  width: "100%",
  boxSizing: "border-box" as const,
  minHeight: 44,
  padding: "9px 10px",
  border: "1px solid var(--ma-border-strong)",
  background: "var(--ma-bg-card)",
  color: "var(--ma-text-primary)",
  font: "inherit",
};
export default function DanhMucToaNha({ token, vaiTro }: Props) {
  const [ds, setDs] = useState<ThongTinToaNha[]>([]),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [chosen, setChosen] = useState<number | null>(null),
    [form, setForm] = useState<Form | null>(null),
    [error, setError] = useState<string | null>(null),
    [notice, setNotice] = useState<string | null>(null);
  const canCreate = ["CHU", "QTHT"].includes(vaiTro),
    toa = ds.find((x) => x.id === chosen) ?? ds[0] ?? null;
  useEffect(() => {
    let ok = true;
    setLoading(true);
    setError(null);
    fetchToaNha(token)
      .then((x) => {
        if (ok) {
          setDs(x);
          setChosen((i) => i ?? x[0]?.id ?? null);
        }
      })
      .catch((e) => ok && setError(msg(e, "Không thể tải danh sách toà nhà.")))
      .finally(() => ok && setLoading(false));
    return () => {
      ok = false;
    };
  }, [token]);
  const open = (x?: ThongTinToaNha) => {
    if (!x && !canCreate) return;
    setError(null);
    setNotice(null);
    setForm(
      x
        ? {
            id: x.id,
            maToa: x.maToa,
            ten: x.ten,
            diaChi: x.diaChi,
            soTang: String(x.soTang),
            ngayChotSo: String(x.ngayChotSo),
            soNgayHanTt: String(x.soNgayHanTt),
            tkNganHang: x.tkNganHang,
            nguongThatThoat: x.nguongThatThoat,
            batBuocAnhCongTo: x.batBuocAnhCongTo,
          }
        : {
            id: null,
            maToa: "",
            ten: "",
            diaChi: "",
            soTang: "1",
            ngayChotSo: "28",
            soNgayHanTt: "7",
            tkNganHang: "",
            nguongThatThoat: "0.00",
            batBuocAnhCongTo: false,
          },
    );
  };
  const update = (k: keyof Form, v: string | boolean) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const p = payload(form),
        x =
          form.id === null
            ? await taoToaNha(token, p)
            : await capNhatToaNha(token, form.id, p);
      setDs((a) =>
        form.id === null ? [...a, x] : a.map((i) => (i.id === x.id ? x : i)),
      );
      setChosen(x.id);
      setForm(null);
      setNotice(
        form.id === null
          ? "Đã khai báo toà nhà mới."
          : "Đã cập nhật thông tin toà nhà.",
      );
    } catch (e) {
      setError(msg(e, "Không thể lưu thông tin toà nhà."));
    } finally {
      setSaving(false);
    }
  }
  return (
    <section
      data-testid="building-catalog"
      aria-labelledby="building-management-title"
      style={{
        display: "grid",
        gap: 18,
        maxWidth: 1280,
        margin: "auto",
        padding: "clamp(12px,3vw,32px)",
        fontFamily: "var(--ma-font-ui)",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          borderBottom: "2px solid var(--ma-ink-900)",
          paddingBottom: 14,
        }}
      >
        <div>
          <small>FR-BLD-01</small>
          <h3 id="building-management-title">Danh mục toà nhà</h3>
        </div>
        {canCreate && (
          <Button onClick={() => open()} style={{ minHeight: 44 }}>
            Khai báo toà mới
          </Button>
        )}
      </header>
      <p style={{ margin: 0, color: "var(--ma-text-secondary)" }}>
        Máy chủ tự giới hạn danh sách theo quyền được xem. Ngày chốt số chỉ nhận
        từ 1 đến 28 để tháng hai vẫn luôn có ngày chốt.
      </p>
      {error && (
        <p role="alert" style={{ color: "var(--ma-urgent)" }}>
          {error}
        </p>
      )}
      {notice && (
        <p role="status" style={{ color: "var(--ma-done-text)" }}>
          {notice}
        </p>
      )}
      {!loading && ds.length > 0 && (
        <StatStrip
          stats={[
            { label: "TOÀ ĐƯỢC XEM", value: ds.length },
            {
              label: "TỔNG SỐ TẦNG",
              value: ds.reduce((n, x) => n + x.soTang, 0),
            },
          ]}
          style={{ gridTemplateColumns: "repeat(2,minmax(0,1fr))" }}
        />
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,310px),1fr))",
          gap: 18,
        }}
      >
        <div style={{ display: "grid", gap: 8 }}>
          {loading ? (
            <p>Đang tải danh sách toà nhà…</p>
          ) : ds.length === 0 ? (
            <EmptyState
              title="Chưa có toà nhà nào."
              body="Khai báo toà đầu tiên để bắt đầu quản lý phòng."
              actionLabel={canCreate ? "Khai báo toà mới" : undefined}
              onAction={() => open()}
            />
          ) : (
            ds.map((x) => (
              <button
                key={x.id}
                type="button"
                onClick={() => setChosen(x.id)}
                aria-pressed={toa?.id === x.id}
                style={{
                  textAlign: "left",
                  minHeight: 44,
                  padding: 14,
                  cursor: "pointer",
                  font: "inherit",
                  color: "var(--ma-text-primary)",
                  background: "var(--ma-bg-card)",
                  border:
                    toa?.id === x.id
                      ? "2px solid var(--ma-ink-900)"
                      : "1px solid var(--ma-border-default)",
                }}
              >
                <strong>{x.ten}</strong> <span>{x.maToa}</span>
                <div>{x.diaChi}</div>
                <small>
                  Số tầng {x.soTang} · Chốt số ngày {x.ngayChotSo} · Ngưỡng{" "}
                  {x.nguongThatThoat}
                </small>
              </button>
            ))
          )}
        </div>
        <div style={{ display: "grid", gap: 16 }}>
          {toa ? (
            <section
              style={{
                padding: 16,
                border: "1px solid var(--ma-border-default)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <h4>Toà {toa.ten}</h4>
                <Button
                  variant="secondary"
                  onClick={() => open(toa)}
                  style={{ minHeight: 44 }}
                >
                  Sửa {toa.ten}
                </Button>
              </div>
              <p>
                Mã toà {toa.maToa} · {toa.diaChi}
              </p>
              <p>
                Hạn thanh toán {toa.soNgayHanTt} ngày · Tài khoản nhận tiền{" "}
                {toa.tkNganHang}
              </p>
            </section>
          ) : (
            <EmptyState title="Chọn một toà nhà để xem chi tiết." />
          )}
          {form && (
            <form
              data-testid="building-form"
              onSubmit={save}
              style={{
                display: "grid",
                gap: 12,
                padding: 16,
                border: "1px solid var(--ma-border-default)",
              }}
            >
              <h4>{form.id === null ? "Khai báo toà nhà" : "Sửa toà nhà"}</h4>
              <Field label="Mã toà">
                <input
                  required
                  name="maToa"
                  value={form.maToa}
                  onChange={(e) => update("maToa", e.target.value)}
                  style={input}
                />
              </Field>
              <Field label="Tên toà">
                <input
                  required
                  name="ten"
                  value={form.ten}
                  onChange={(e) => update("ten", e.target.value)}
                  style={input}
                />
              </Field>
              <Field label="Địa chỉ">
                <textarea
                  required
                  name="diaChi"
                  value={form.diaChi}
                  onChange={(e) => update("diaChi", e.target.value)}
                  style={input}
                />
              </Field>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                  gap: 10,
                }}
              >
                <Field label="Số tầng">
                  <input
                    required
                    type="number"
                    min="1"
                    name="soTang"
                    value={form.soTang}
                    onChange={(e) => update("soTang", e.target.value)}
                    style={input}
                  />
                </Field>
                <Field label="Ngày chốt số">
                  <input
                    required
                    type="number"
                    min="1"
                    max="28"
                    name="ngayChotSo"
                    value={form.ngayChotSo}
                    onChange={(e) => update("ngayChotSo", e.target.value)}
                    style={input}
                  />
                </Field>
                <Field label="Hạn thanh toán">
                  <input
                    required
                    type="number"
                    min="1"
                    name="soNgayHanTt"
                    value={form.soNgayHanTt}
                    onChange={(e) => update("soNgayHanTt", e.target.value)}
                    style={input}
                  />
                </Field>
                <Field label="Ngưỡng thất thoát">
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    name="nguongThatThoat"
                    value={form.nguongThatThoat}
                    onChange={(e) => update("nguongThatThoat", e.target.value)}
                    style={input}
                  />
                </Field>
              </div>
              <Field label="Tài khoản ngân hàng nhận tiền">
                <input
                  required
                  name="tkNganHang"
                  value={form.tkNganHang}
                  onChange={(e) => update("tkNganHang", e.target.value)}
                  style={input}
                />
              </Field>
              <label>
                <input
                  name="batBuocAnhCongTo"
                  type="checkbox"
                  checked={form.batBuocAnhCongTo}
                  onChange={(e) => update("batBuocAnhCongTo", e.target.checked)}
                />{" "}
                Bắt buộc ảnh công tơ khi ghi chỉ số
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setForm(null);
                    setError(null);
                  }}
                >
                  Huỷ
                </Button>
                <Button type="submit" blocked={saving}>
                  {saving
                    ? "Đang lưu…"
                    : form.id === null
                      ? "Lưu toà nhà"
                      : "Lưu thay đổi"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 600 }}>
      <span>{label}</span>
      {children}
    </label>
  );
}
function payload(f: Form): YeuCauToaNha {
  return {
    maToa: f.maToa,
    ten: f.ten,
    diaChi: f.diaChi,
    soTang: Number(f.soTang),
    ngayChotSo: Number(f.ngayChotSo),
    soNgayHanTt: Number(f.soNgayHanTt),
    tkNganHang: f.tkNganHang,
    nguongThatThoat: f.nguongThatThoat,
    batBuocAnhCongTo: f.batBuocAnhCongTo,
  };
}
function msg(e: unknown, f: string) {
  return e instanceof ApiError || e instanceof Error ? e.message : f;
}
