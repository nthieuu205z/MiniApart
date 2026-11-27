# y11 — sửa nhỏ V3 (nhánh ui/y11-sua-nho)
1. Thẻ Hợp đồng 390 (/hop-dong, Chủ): grid một bố cục — dòng 1 "Phòng · Toà", dòng 2 người thuê, dòng 3 giá + hạn, dòng 4 tình trạng; ô chọn căn giữa; link phòng đủ vùng chạm 44px. CSS trong HopDongQuanLy.tsx. Ảnh: before/hd-390.png → after/hd-390.png.
2. Nút đỏ phá huỷ: đã đủ từ trước, không cần sửa — thanh lý (HopDongThaoTac:2409), huỷ hoá đơn (InvoiceActions "Xác nhận huỷ hoá đơn", dùng trong HoaDonQuanLy), từ chối báo giá (SuCoQuanLy, QuanLyBaoGiaVaThanhToan) đều là Button variant=danger. ConfirmModal trong HopDongThaoTac chỉ dùng cho "áp dụng mẫu", không phải phá huỷ.
3. Rà 1440/390 (rasoat/): hợp đồng, HĐ #9, hoá đơn, sự cố, toà, báo cáo (+tiêu thụ): không thấy lỗi bố cục cần sửa. /phong cho Chủ là trang "dành cho Quản lý toà" (đúng thiết kế).
Kiểm: tsc -b sạch, vitest 710/710, build OK; qa.json mọi ảnh overflow/belowHit/contrast/textBelowFloor = 0.
