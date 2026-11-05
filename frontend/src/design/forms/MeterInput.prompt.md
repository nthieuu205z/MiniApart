Ô nhập chỉ số công tơ — dùng ở #18 Ghi chỉ số và #19 Thay công tơ.

```jsx
<MeterInput label="Chỉ số mới — phòng 302" value="1298" consumption="58 kWh" state="filled" />
<MeterInput
  label="Chỉ số mới — phòng 203"
  value="1180"
  state="error"
  error="Chỉ số mới (1.180) nhỏ hơn kỳ trước (1.240). Nếu vừa thay công tơ, chọn “Công tơ đã thay”."
/>
```

Câu lỗi nêu cả hai con số và đường ra hợp lệ. Trạng thái `locked` dùng khi kỳ đã chốt — không ẩn ô, chỉ khoá và nói rõ lý do.
