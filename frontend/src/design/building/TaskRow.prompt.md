Dòng việc.

```jsx
<TaskRow
  glyph="con-no" glyphColor="var(--ma-urgent)" metaTone="urgent"
  meta="Quá hạn · 108 · 305 · 403 · 406 · +1"
  title={<>5 hoá đơn quá hạn — <span style={{fontFamily:"var(--ma-font-mono)"}}>8.450.000 đ</span></>}
  detail="Lâu nhất: phòng 108, quá hạn 14 ngày"
  actionLabel="Xem công nợ"
/>
```

Việc quan trọng nhất của màn KHÔNG dùng TaskRow — dùng `PrimaryTaskBlock` (khối nền mực).
