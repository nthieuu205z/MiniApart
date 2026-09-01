Ô phòng trên mặt cắt toà nhà.

```jsx
<RoomCell room="402" state="recorded" label="Đã ghi · 58 kWh" />
<RoomCell room="205" state="missing" label="Chưa ghi số" />
<RoomCell room="403" state="debt" label="Nợ 1.720.000" />
<RoomCell room="104" state="repair" label="Chờ phân công" />
<RoomCell room="405" state="vacant" label="Trống 12 ngày" />
<RoomCell room="302" state="multi" taskCount={3} multiSummary="Chưa ghi · rò nước · HĐ 12 ngày" />
```

Không bao giờ xếp hai ký hiệu cạnh nhau trong một ô — phòng nhiều việc dùng `multi`.
