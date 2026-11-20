# Figma

- File: MiniApart UI Redesign
- URL: https://www.figma.com/design/TmeM2tYjtvMc0L3osPC0ab
- file_key: TmeM2tYjtvMc0L3osPC0ab (team "hieu231230777's team", tài khoản nthieuu)
- Tạo ngày 2026-11-21; hiện là file rỗng, chờ bản thiết kế tổng quan được duyệt rồi mới dựng.
- Mẫu tham chiếu: https://www.figma.com/community/file/1292982580121452290 (Giliard Gomes, CC BY 4.0)

## Trạng thái dựng (21/11/2026)
- Trang `Tổng quan v1`: 9 màn khung (6 desktop 1440 px, 3 mobile 390 px) import từ `figma/*.svg`, xếp lưới, có tiêu đề.
- Trang `Nền tảng (token)`: trống, chưa dựng bảng mẫu token.
- Variables: `MiniApart/Colors` (46 màu) và `MiniApart/Numbers` (20 số: space, control, radius). Mới là biến trong file, chưa gán vào layer của màn (layer import là SVG nên dùng màu cố định).
- Text style `MiniApart/*` (12, Archivo) và effect style (Shadow md/lg).
- Gauge ở màn 03 đã thay bằng ellipse arc gốc vì SVG làm vỡ nét. Ảnh chụp từ Figma: `figma/from-figma/`.
- Chưa có: component, Auto Layout (SVG không mang theo).
