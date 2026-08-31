package com.prj1.ccm.toanha;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/toa-nha")
public class ToaNhaController {
    private final PhanQuyenToaService phanQuyenToaService;
    private final DanhMucToaNhaService danhMucToaNhaService;
    private final DanhMucPhongService danhMucPhongService;
    private final DanhMucDichVuService danhMucDichVuService;
    private final KyThanhToanService kyThanhToanService;
    private final ChiSoDichVuService chiSoDichVuService;

    public ToaNhaController(
            PhanQuyenToaService phanQuyenToaService,
            DanhMucToaNhaService danhMucToaNhaService,
            DanhMucPhongService danhMucPhongService,
            DanhMucDichVuService danhMucDichVuService,
            KyThanhToanService kyThanhToanService,
            ChiSoDichVuService chiSoDichVuService
    ) {
        this.phanQuyenToaService = phanQuyenToaService;
        this.danhMucToaNhaService = danhMucToaNhaService;
        this.danhMucPhongService = danhMucPhongService;
        this.danhMucDichVuService = danhMucDichVuService;
        this.kyThanhToanService = kyThanhToanService;
        this.chiSoDichVuService = chiSoDichVuService;
    }

    /**
     * FR-BLD-01 building catalog listing is filtered to only the buildings visible to the authenticated user.
     * FR-AUT-05 enforces that the authenticated user only receives buildings within assigned scope.
     *
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the building list filtered on the server by PHAN_QUYEN_TOA
     */
    @GetMapping
    public List<ThongTinToaNha> danhSachToaNha(HttpServletRequest request) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        return phanQuyenToaService.danhSachToaNhaNguoiDungDuocXem(nguoiDung)
                .stream()
                .map(ThongTinToaNha::tuToaNha)
                .toList();
    }

    /**
     * FR-AUT-05 returns a building detail only when the authenticated user is assigned to it.
     *
     * @param toaNhaId the requested building identifier
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the requested building detail
     */
    @GetMapping("/{toaNhaId}")
    public ThongTinToaNha chiTietToaNha(@PathVariable Long toaNhaId, HttpServletRequest request) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        return ThongTinToaNha.tuToaNha(
                phanQuyenToaService.layToaNhaNeuNguoiDungDuocXem(nguoiDung, toaNhaId)
        );
    }

    /**
     * FR-BLD-01 creates a new building for the owner; QTHT is limited to building-list access.
     *
     * @param yeuCau the submitted building data
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the newly created building
     */
    @PostMapping
    public ResponseEntity<ThongTinToaNha> taoToaNha(
            @RequestBody YeuCauToaNha yeuCau,
            HttpServletRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(danhMucToaNhaService.tao(yeuCau, nguoiDungHienTai(request)));
    }

    /**
     * FR-BLD-01 updates a visible building for the owner or manager; QTHT cannot mutate building business data.
     *
     * @param toaNhaId the building identifier
     * @param yeuCau the submitted building data
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the updated building
     */
    @PutMapping("/{toaNhaId}")
    public ThongTinToaNha capNhatToaNha(
            @PathVariable Long toaNhaId,
            @RequestBody YeuCauToaNha yeuCau,
            HttpServletRequest request
    ) {
        return danhMucToaNhaService.capNhat(toaNhaId, yeuCau, nguoiDungHienTai(request));
    }

    /**
     * FR-BLD-02 lists rooms in one visible building and optionally filters them by floor.
     *
     * @param toaNhaId the building identifier
     * @param tang the optional floor filter
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the room list inside the selected building
     */
    @GetMapping("/{toaNhaId}/phong")
    public List<ThongTinPhong> danhSachPhong(
            @PathVariable Long toaNhaId,
            Integer tang,
            HttpServletRequest request
    ) {
        return danhMucPhongService.danhSachPhong(toaNhaId, tang, nguoiDungHienTai(request));
    }

    /**
     * FR-BLD-02 creates a single room inside one visible building with system-owned initial TRONG status.
     *
     * @param toaNhaId the building identifier
     * @param yeuCau the submitted room data without client-owned status
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the newly created room
     */
    @PostMapping("/{toaNhaId}/phong")
    public ResponseEntity<ThongTinPhong> taoPhong(
            @PathVariable Long toaNhaId,
            @RequestBody YeuCauPhong yeuCau,
            HttpServletRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(danhMucPhongService.taoPhong(toaNhaId, yeuCau, nguoiDungHienTai(request)));
    }

    /**
     * FR-BLD-02 previews a consecutive room range before any persistence.
     *
     * @param toaNhaId the building identifier
     * @param yeuCau the submitted room-range template
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the non-persistent preview list
     */
    @PostMapping("/{toaNhaId}/phong/hang-loat/xem-truoc")
    public KetQuaPhongHangLoat xemTruocPhongHangLoat(
            @PathVariable Long toaNhaId,
            @RequestBody YeuCauPhongHangLoat yeuCau,
            HttpServletRequest request
    ) {
        return danhMucPhongService.xemTruocPhongHangLoat(toaNhaId, yeuCau, nguoiDungHienTai(request));
    }

    /**
     * FR-BLD-02 confirms and creates a previously previewed consecutive room range.
     *
     * @param toaNhaId the building identifier
     * @param yeuCau the submitted room-range template
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the created room list
     */
    @PostMapping("/{toaNhaId}/phong/hang-loat")
    public ResponseEntity<KetQuaPhongHangLoat> taoPhongHangLoat(
            @PathVariable Long toaNhaId,
            @RequestBody YeuCauPhongHangLoat yeuCau,
            HttpServletRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(danhMucPhongService.taoPhongHangLoat(toaNhaId, yeuCau, nguoiDungHienTai(request)));
    }

    /**
     * FR-BLD-04 and CR-012 recompute the system-owned cached room status for one visible building from contract data.
     * NFR-SEC-03 keeps the repair command restricted to the server-side building authorization check.
     *
     * @param toaNhaId the building identifier
     * @param ngay the business date for recomputation, or the configured clock date when omitted
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return no content after the repair-style recomputation finishes
     */
    @PostMapping("/{toaNhaId}/phong/tinh-lai-trang-thai")
    public ResponseEntity<Void> tinhLaiTrangThaiPhong(
            @PathVariable Long toaNhaId,
            @RequestParam(name = "ngay", required = false) LocalDate ngay,
            HttpServletRequest request
    ) {
        danhMucPhongService.tinhLaiTrangThaiPhong(toaNhaId, ngay, nguoiDungHienTai(request));
        return ResponseEntity.noContent().build();
    }

    /**
     * FR-BLD-05 lists services for one visible building with their calculation mode, unit, and active state.
     *
     * @param toaNhaId the building identifier
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the service catalog inside the selected building
     */
    @GetMapping("/{toaNhaId}/dich-vu")
    public List<ThongTinDichVu> danhSachDichVu(@PathVariable Long toaNhaId, HttpServletRequest request) {
        return danhMucDichVuService.danhSachDichVu(toaNhaId, nguoiDungHienTai(request));
    }

    /**
     * FR-BLD-05 creates one service inside a visible building with one of the four approved calculation modes.
     *
     * @param toaNhaId the building identifier
     * @param yeuCau the submitted service data
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the newly created service
     */
    @PostMapping("/{toaNhaId}/dich-vu")
    public ResponseEntity<ThongTinDichVu> taoDichVu(
            @PathVariable Long toaNhaId,
            @RequestBody YeuCauDichVu yeuCau,
            HttpServletRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(danhMucDichVuService.taoDichVu(toaNhaId, yeuCau, nguoiDungHienTai(request)));
    }

    /**
     * FR-BLD-05 updates the catalog fields of an existing service without deleting historical usage.
     *
     * @param toaNhaId the building identifier
     * @param dichVuId the service identifier
     * @param yeuCau the submitted service data
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the updated service
     */
    @PutMapping("/{toaNhaId}/dich-vu/{dichVuId}")
    public ThongTinDichVu capNhatDichVu(
            @PathVariable Long toaNhaId,
            @PathVariable Long dichVuId,
            @RequestBody YeuCauDichVu yeuCau,
            HttpServletRequest request
    ) {
        return danhMucDichVuService.capNhatDichVu(toaNhaId, dichVuId, yeuCau, nguoiDungHienTai(request));
    }

    /**
     * FR-BLD-05 enables or disables one service without deleting it from historical billing data.
     *
     * @param toaNhaId the building identifier
     * @param dichVuId the service identifier
     * @param yeuCau the requested active-state change
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the service after the active-state update
     */
    @PutMapping("/{toaNhaId}/dich-vu/{dichVuId}/trang-thai")
    public ThongTinDichVu capNhatTrangThaiDichVu(
            @PathVariable Long toaNhaId,
            @PathVariable Long dichVuId,
            @RequestBody YeuCauTrangThaiDichVu yeuCau,
            HttpServletRequest request
    ) {
        return danhMucDichVuService.capNhatTrangThai(toaNhaId, dichVuId, yeuCau, nguoiDungHienTai(request));
    }

    /**
     * FR-MTR-01 lists the payment periods of one visible building so metering and later billing can anchor to a period.
     *
     * @param toaNhaId the building identifier
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the payment-period list with open and closed status
     */
    @GetMapping("/{toaNhaId}/ky-thanh-toan")
    public List<ThongTinKyThanhToan> danhSachKyThanhToan(
            @PathVariable Long toaNhaId,
            HttpServletRequest request
    ) {
        return kyThanhToanService.danhSachKyThanhToan(toaNhaId, nguoiDungHienTai(request));
    }

    /**
     * FR-MTR-01 opens one new payment period for a visible building using the building closing day to derive the date range.
     *
     * @param toaNhaId the building identifier
     * @param yeuCau the requested period month and year
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the newly opened payment period
     */
    @PostMapping("/{toaNhaId}/ky-thanh-toan")
    public ResponseEntity<ThongTinKyThanhToan> moKyThanhToan(
            @PathVariable Long toaNhaId,
            @RequestBody YeuCauMoKyThanhToan yeuCau,
            HttpServletRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(kyThanhToanService.moKyThanhToan(toaNhaId, yeuCau, nguoiDungHienTai(request)));
    }

    /**
     * FR-MTR-08 lists the rooms that are still missing meter readings before a payment period can be closed.
     *
     * @param toaNhaId the building identifier
     * @param kyId the payment-period identifier
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the rooms that still need readings
     */
    @GetMapping("/{toaNhaId}/ky-thanh-toan/{kyId}/thieu-chi-so")
    public List<ThongTinPhongChuaGhiChiSo> danhSachPhongChuaGhiChiSo(
            @PathVariable Long toaNhaId,
            @PathVariable Long kyId,
            HttpServletRequest request
    ) {
        return kyThanhToanService.danhSachPhongChuaGhiChiSo(toaNhaId, kyId, nguoiDungHienTai(request));
    }

    /**
     * FR-MTR-08 closes one open payment period only when every eligible metered room already has a persisted reading.
     *
     * @param toaNhaId the building identifier
     * @param kyId the payment-period identifier
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the closed period when successful, or the missing-room list with HTTP 409 when not
     */
    @PostMapping("/{toaNhaId}/ky-thanh-toan/{kyId}/chot")
    public ResponseEntity<?> chotKyThanhToan(
            @PathVariable Long toaNhaId,
            @PathVariable Long kyId,
            HttpServletRequest request
    ) {
        KetQuaChotKy ketQua = kyThanhToanService.chotKyThanhToan(toaNhaId, kyId, nguoiDungHienTai(request));
        if (!ketQua.phongThieuChiSo().isEmpty()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ketQua.phongThieuChiSo());
        }
        return ResponseEntity.ok(ketQua.kyThanhToan());
    }

    /**
     * FR-MTR-01 loads the mobile meter-reading list for one visible building and payment period.
     * FR-MTR-04 includes same-room history and the configured anomaly-warning context for each service.
     *
     * @param toaNhaId the building identifier
     * @param kyId the payment-period identifier
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the room/service reading grid for the selected period
     */
    @GetMapping("/{toaNhaId}/ky-thanh-toan/{kyId}/chi-so")
    public ThongTinGhiChiSo danhSachChiSo(
            @PathVariable Long toaNhaId,
            @PathVariable Long kyId,
            HttpServletRequest request
    ) {
        return chiSoDichVuService.danhSachChiSo(toaNhaId, kyId, nguoiDungHienTai(request));
    }

    /**
     * FR-MTR-02 saves one room/service meter reading for one visible building and payment period.
     * FR-MTR-03 rejects readings lower than the previous reading unless the replacement-meter flag is explicitly declared.
     * FR-MTR-04 requires acknowledgement before saving an anomalously high consumption reading.
     * FR-MTR-09 accepts both replacement-meter readings and calculates the two-segment consumption.
     * FR-MTR-10 blocks new saves from mutating a payment period after that period has been closed.
     *
     * @param toaNhaId the building identifier
     * @param kyId the payment-period identifier
     * @param yeuCau the submitted reading
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the saved reading summary
     */
    @PostMapping(
            value = "/{toaNhaId}/ky-thanh-toan/{kyId}/chi-so",
            consumes = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<ThongTinKetQuaGhiChiSo> ghiChiSo(
            @PathVariable Long toaNhaId,
            @PathVariable Long kyId,
            @RequestBody YeuCauGhiChiSo yeuCau,
            HttpServletRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(chiSoDichVuService.ghiChiSo(toaNhaId, kyId, yeuCau, nguoiDungHienTai(request)));
    }

    /**
     * FR-MTR-06 saves one room/service meter reading together with a meter-face photo using the shared attachment store.
     * FR-MTR-07 rejects photo-less saves on buildings whose policy marks meter photos as mandatory.
     * FR-MTR-04 requires acknowledgement before saving an anomalously high consumption reading.
     * FR-MTR-09 accepts both replacement-meter readings and calculates the two-segment consumption.
     * FR-MTR-10 blocks multipart saves from mutating a payment period after that period has been closed.
     *
     * @param toaNhaId the building identifier
     * @param kyId the payment-period identifier
     * @param phongId the room identifier
     * @param dichVuId the service identifier
     * @param chiSoCuoi the submitted closing reading
     * @param coThayCongTo the optional replacement-meter flag
     * @param chiSoCuoiCongToCu the required closing reading from the replaced meter when applicable
     * @param chiSoDauCongToMoi the required opening reading from the replacement meter when applicable
     * @param xacNhanCanhBao whether the authenticated user explicitly acknowledged an anomaly warning
     * @param tep the optional meter-face photo file
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the saved reading summary with its latest meter-photo attachment id when present
     */
    @PostMapping(
            value = "/{toaNhaId}/ky-thanh-toan/{kyId}/chi-so",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<ThongTinKetQuaGhiChiSo> ghiChiSoKemAnh(
            @PathVariable Long toaNhaId,
            @PathVariable Long kyId,
            @RequestParam Long phongId,
            @RequestParam Long dichVuId,
            @RequestParam java.math.BigDecimal chiSoCuoi,
            @RequestParam(required = false) Boolean coThayCongTo,
            @RequestParam(required = false) java.math.BigDecimal chiSoCuoiCongToCu,
            @RequestParam(required = false) java.math.BigDecimal chiSoDauCongToMoi,
            @RequestParam(required = false) Boolean xacNhanCanhBao,
            @RequestParam(name = "tep", required = false) MultipartFile tep,
            HttpServletRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(chiSoDichVuService.ghiChiSo(
                        toaNhaId,
                        kyId,
                        new YeuCauGhiChiSo(
                                phongId, dichVuId, chiSoCuoi, coThayCongTo,
                                chiSoCuoiCongToCu, chiSoDauCongToMoi, xacNhanCanhBao
                        ),
                        tep,
                        nguoiDungHienTai(request)
                ));
    }

    /**
     * FR-MTR-10 allows only the assigned owner to revise a closed-period meter reading, and each revision must carry a reason.
     * FR-MTR-09 keeps replacement-meter fields available when the owner revises a closed-period reading.
     *
     * @param toaNhaId the building identifier
     * @param kyId the closed payment-period identifier
     * @param yeuCau the submitted closed-period revision
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the revised reading summary
     */
    @PutMapping(
            value = "/{toaNhaId}/ky-thanh-toan/{kyId}/chi-so",
            consumes = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<ThongTinKetQuaGhiChiSo> capNhatChiSoDaChot(
            @PathVariable Long toaNhaId,
            @PathVariable Long kyId,
            @RequestBody YeuCauCapNhatChiSoDaChot yeuCau,
            HttpServletRequest request
    ) {
        return ResponseEntity.ok(
                chiSoDichVuService.capNhatChiSoDaChot(toaNhaId, kyId, yeuCau, nguoiDungHienTai(request))
        );
    }

    private NguoiDung nguoiDungHienTai(HttpServletRequest request) {
        return (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
    }
}
