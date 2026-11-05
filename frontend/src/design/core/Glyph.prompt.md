Ký hiệu trạng thái/điều hướng của MiniApart — dùng thay cho mọi bộ icon có sẵn và mọi emoji.

```jsx
<span style={{ display: "flex", alignItems: "center", gap: 8 }}>
  <Glyph name="con-no" color="var(--ma-urgent)" />
  <span style={{ fontFamily: "var(--ma-font-mono)", fontWeight: 700, color: "var(--ma-urgent)" }}>Nợ 1.720.000</span>
</span>
```

Trạng thái nghiệp vụ: `da-ghi`, `thieu-so`, `con-no`, `cho-tho`, `phong-trong`, `bi-chan`, `hop-dong`, `cong-to`.
Điều hướng: `nhac-viec`, `so-do-phong`, `hoa-don`, `cong-no`, `bang-gia`, `sua-chua`, `thong-bao-cu-dan`, `toa-nha`, `tim`, `thong-bao`, `mo-xuong`, `o-vuong`.

Quy tắc: ký hiệu trạng thái luôn đi kèm nhãn chữ; ký hiệu menu dùng màu `--ma-ink-600`; ký hiệu cảnh báo dùng `--ma-urgent`, chờ dùng `--ma-waiting`.
