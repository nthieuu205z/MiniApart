# Vertical Slice 3 — Ghi chỉ số dịch vụ

**Nguồn:** `Doc/PRJ1_Ke-hoach-trien-khai.md`, mục 6, Vertical Slice 3.

## Problem Statement

Có hợp đồng và có bảng giá, nhưng chưa có số liệu tiêu thụ. Hoá đơn ở Slice 4 lấy mức tiêu thụ từ chỉ số công tơ đầu kỳ và cuối kỳ — không có chỗ nào ghi những con số đó.

## Solution

Ghi được chỉ số công tơ của từng phòng từng kỳ, kèm ảnh, với đủ phép kiểm để con số sai bị chặn ngay lúc nhập chứ không lọt vào hoá đơn.

## Đóng những yêu cầu nào

FR-MTR-01 [M], FR-MTR-02 [M], FR-MTR-03 [M], FR-MTR-04 [S], FR-MTR-06 [M], FR-MTR-07 [S], FR-MTR-08 [M], FR-MTR-09 [S], FR-MTR-10 [M]

**Áp phiếu thay đổi:** CR-004 (bốn chỉ số khi thay công tơ)

**Ngoài phạm vi slice này:** FR-MTR-05 (giữ dữ liệu khi mất mạng) — mức Should have nhưng phức tạp, kế hoạch đã xếp xuống Slice 12.

## Điều quyết định chất lượng slice này

**Đây là màn hình dùng nhiều nhất, và dùng trên điện thoại.** Người ghi đứng giữa hành lang, có thể thiếu sáng, sóng yếu, một tay cầm điện thoại một tay soi công tơ. Thiết kế giao diện không phải chuyện thẩm mỹ ở đây mà là chuyện **con số có đúng hay không**:

- Ô nhập số **to**, bật bàn phím số
- Chỉ số kỳ trước hiện **ngay cạnh** ô nhập
- Nhập xong hiện **ngay** mức tiêu thụ vừa tính, để người ghi tự phát hiện gõ nhầm
- Tự nhảy sang phòng kế tiếp

Một chữ số gõ thừa mà không ai thấy sẽ thành một hoá đơn sai, và người thuê là người chịu.

## Hoàn thành khi

1. Ghi chỉ số cho 20 phòng **trên điện thoại**, trôi chảy
2. Nhập số nhỏ hơn kỳ trước thì bị chặn, **trừ khi** khai thay công tơ
3. Tiêu thụ bất thường thì cảnh báo
4. Chốt kỳ **bị chặn** khi còn phòng chưa ghi
