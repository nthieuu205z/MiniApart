Trạng thái rỗng và lỗi.

```jsx
<EmptyState kind="first" title="Toà này chưa có phòng nào."
  body="Tạo dãy phòng theo tầng, hệ thống tự đặt số phòng." actionLabel="Tạo dãy phòng" />

<EmptyState kind="filtered" title="Không có hoá đơn quá hạn ở toà A kỳ 08/2026."
  actionLabel="Bỏ lọc" filters={<><FilterChip>Toà A</FilterChip><FilterChip active>Quá hạn</FilterChip></>} />

<EmptyState kind="error" title="Không tải được danh sách hoá đơn."
  body="Kiểm tra lại mạng rồi thử lại. Việc đang làm không bị mất." actionLabel="Thử lại" errorCode="8F3C" />
```
