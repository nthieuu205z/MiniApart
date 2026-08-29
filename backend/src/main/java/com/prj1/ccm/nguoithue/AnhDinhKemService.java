package com.prj1.ccm.nguoithue;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Clock;
import java.util.Base64;
import java.util.Iterator;
import java.util.Locale;
import java.util.UUID;

@Service
public class AnhDinhKemService {
    private static final String DOI_TUONG_NGUOI_THUE = "NGUOI_THUE";
    private static final long KICH_THUOC_TOI_DA = 5L * 1024 * 1024;
    private static final String THONG_BAO_TEP_KHONG_HOP_LE = "Tệp tải lên phải là ảnh PNG hoặc JPEG hợp lệ";
    private static final String THONG_BAO_TEP_QUA_LON = "Tệp tải lên không được vượt quá 5 MB";
    private static final String THONG_BAO_LIEN_KET_KHONG_HOP_LE = "Liên kết ảnh không hợp lệ hoặc đã hết hạn";
    private final AnhDinhKemRepository anhDinhKemRepository;
    private final NguoiThueRepository nguoiThueRepository;
    private final Clock clock;
    private final Path thuMucLuuTru;
    private final byte[] khoaKy;
    private final long thoiHanLienKetGiay;

    public AnhDinhKemService(AnhDinhKemRepository anhDinhKemRepository, NguoiThueRepository nguoiThueRepository, Clock clock,
                              @Value("${app.anh.storage-root:${ANH_STORAGE_ROOT:/var/lib/miniapart/private-attachments}}") String thuMucLuuTru,
                              @Value("${app.anh.link-secret:${ANH_LINK_SECRET:dev-only-image-link-secret-not-for-production}}") String khoaKy,
                              @Value("${app.anh.link-ttl-seconds:900}") long thoiHanLienKetGiay) {
        this.anhDinhKemRepository = anhDinhKemRepository;
        this.nguoiThueRepository = nguoiThueRepository;
        this.clock = clock;
        this.thuMucLuuTru = Path.of(thuMucLuuTru).toAbsolutePath().normalize();
        this.khoaKy = khoaKy.getBytes(StandardCharsets.UTF_8);
        this.thoiHanLienKetGiay = thoiHanLienKetGiay;
    }

    @Transactional
    public ThongTinAnhDinhKem taiLenAnhNguoiThue(Long nguoiThueId, String ghiChu, MultipartFile tep, NguoiDung nguoiDung) {
        kiemTraQuyen(nguoiDung);
        nguoiThueRepository.findById(nguoiThueId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        byte[] duLieu = docVaKiemTra(tep);
        String loaiNoiDung = loaiNoiDungCua(duLieu);
        AnhDinhKem anh = new AnhDinhKem(null, DOI_TUONG_NGUOI_THUE, nguoiThueId, UUID.randomUUID() + phanMoRongCua(loaiNoiDung), ghiChu, loaiNoiDung, duLieu.length);
        ghiTep(anh.khoaLuuTru(), duLieu);
        Long id = anhDinhKemRepository.insert(anh);
        return ThongTinAnhDinhKem.tu(new AnhDinhKem(id, anh.doiTuongLoai(), anh.doiTuongId(), anh.khoaLuuTru(), anh.ghiChu(), anh.loaiNoiDung(), anh.kichThuoc()));
    }

    @Transactional(readOnly = true)
    public LienKetAnhKy taoLienKet(Long anhId, NguoiDung nguoiDung) {
        kiemTraQuyen(nguoiDung);
        layAnhNguoiThue(anhId);
        long hetHan = clock.instant().getEpochSecond() + thoiHanLienKetGiay;
        return new LienKetAnhKy("/api/anh/" + anhId + "/xem?hetHan=" + hetHan + "&chuKy=" + chuKy(anhId, hetHan));
    }

    @Transactional(readOnly = true)
    public AnhDinhKem layAnhDaKy(Long anhId, long hetHan, String chuKy) {
        if (clock.instant().getEpochSecond() >= hetHan || !chuKyHopLe(anhId, hetHan, chuKy)) throw lienKetKhongHopLe();
        return layAnhNguoiThue(anhId);
    }

    public byte[] docTep(AnhDinhKem anh) {
        try {
            Path tep = thuMucLuuTru.resolve(anh.khoaLuuTru()).normalize();
            if (!tep.startsWith(thuMucLuuTru)) throw new IOException("Storage key escaped root");
            return Files.readAllBytes(tep);
        } catch (IOException exception) { throw new ResponseStatusException(HttpStatus.NOT_FOUND); }
    }

    private byte[] docVaKiemTra(MultipartFile tep) {
        if (tep == null || tep.isEmpty()) throw tepKhongHopLe();
        if (tep.getSize() > KICH_THUOC_TOI_DA) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_TEP_QUA_LON);
        try {
            byte[] duLieu = tep.getBytes();
            if (loaiNoiDungCua(duLieu) == null) throw tepKhongHopLe();
            return duLieu;
        } catch (IOException exception) { throw tepKhongHopLe(); }
    }

    private String loaiNoiDungCua(byte[] duLieu) {
        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(duLieu))) {
            if (input == null) return null;
            Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) return null;
            ImageReader reader = readers.next();
            try {
                reader.setInput(input, true, true);
                reader.read(0);
                return switch (reader.getFormatName().toLowerCase(Locale.ROOT)) {
                    case "png" -> "image/png";
                    case "jpeg", "jpg" -> "image/jpeg";
                    default -> null;
                };
            } finally {
                reader.dispose();
            }
        } catch (IOException | RuntimeException exception) {
            return null;
        }
    }

    private String phanMoRongCua(String loaiNoiDung) { return "image/png".equals(loaiNoiDung) ? ".png" : ".jpg"; }
    private void ghiTep(String khoaLuuTru, byte[] duLieu) {
        try { Files.createDirectories(thuMucLuuTru); Files.write(thuMucLuuTru.resolve(khoaLuuTru), duLieu); }
        catch (IOException exception) { throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Không thể lưu ảnh giấy tờ"); }
    }
    private AnhDinhKem layAnhNguoiThue(Long anhId) { return anhDinhKemRepository.findNguoiThueById(anhId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND)); }
    private void kiemTraQuyen(NguoiDung nguoiDung) {
        if (nguoiDung == null || (nguoiDung.vaiTro() != VaiTro.QTHT && nguoiDung.vaiTro() != VaiTro.CHU && nguoiDung.vaiTro() != VaiTro.QUAN_LY)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }
    private String chuKy(Long anhId, long hetHan) {
        try { Mac mac = Mac.getInstance("HmacSHA256"); mac.init(new SecretKeySpec(khoaKy, "HmacSHA256")); return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal((anhId + ":" + hetHan).getBytes(StandardCharsets.UTF_8))); }
        catch (GeneralSecurityException exception) { throw new IllegalStateException("Cannot sign image link", exception); }
    }
    private boolean chuKyHopLe(Long anhId, long hetHan, String chuKy) { return chuKy != null && MessageDigest.isEqual(chuKy(anhId, hetHan).getBytes(StandardCharsets.UTF_8), chuKy.getBytes(StandardCharsets.UTF_8)); }
    private ResponseStatusException tepKhongHopLe() { return new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_TEP_KHONG_HOP_LE); }
    private ResponseStatusException lienKetKhongHopLe() { return new ResponseStatusException(HttpStatus.FORBIDDEN, THONG_BAO_LIEN_KET_KHONG_HOP_LE); }
}
