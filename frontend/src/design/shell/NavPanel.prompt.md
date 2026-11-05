Menu dọc, rộng 214px, chia ba nhóm.

```jsx
<NavPanel
  groups={[
    { label: "Hàng ngày", items: [
      { label: "Nhắc việc", glyph: "nhac-viec", active: true, count: 4 },
      { label: "Sơ đồ phòng", glyph: "so-do-phong" },
      { label: "Ghi chỉ số", glyph: "cong-to", count: 3 },
    ]},
    { label: "Tiền", items: [
      { label: "Hoá đơn", glyph: "hoa-don" },
      { label: "Công nợ", glyph: "cong-no", count: 5 },
      { label: "Bảng giá & dịch vụ", glyph: "bang-gia" },
    ]},
    { label: "Toà nhà", items: [
      { label: "Người thuê & hợp đồng", glyph: "hop-dong" },
      { label: "Sửa chữa", glyph: "sua-chua", count: 2, countTone: "waiting" },
      { label: "Thông báo cư dân", glyph: "thong-bao-cu-dan" },
    ]},
  ]}
  user={{ initials: "LN", name: "Lan Nguyễn", role: "Quản lý toà A" }}
/>
```

Mục đang chọn: nền sáng hơn + vạch đỏ 3px bên trái + chữ đậm. Ba dấu hiệu, không chỉ màu.
