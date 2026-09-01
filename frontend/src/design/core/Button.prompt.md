Nút hành động. Mỗi màn có tối đa một nút `primary`; mọi nút khác là `secondary` hoặc `text`.

```jsx
<Button variant="primary">Ghi chỉ số 3 phòng</Button>
<Button variant="secondary" size="sm">Xem công nợ</Button>
<Button blocked blockedReason="Cần đủ chỉ số 24/24 phòng. Hiện còn 3 phòng thiếu.">Chốt kỳ 08/2026</Button>
```

Nhãn viết động từ + đối tượng, không "OK"/"Xác nhận" trơ. Không dùng `disabled` — dùng `blocked` + `blockedReason` để người dùng biết phải làm gì.
