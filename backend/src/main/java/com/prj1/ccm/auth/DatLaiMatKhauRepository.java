package com.prj1.ccm.auth;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;

@Repository
public class DatLaiMatKhauRepository {
    private final JdbcTemplate jdbc;
    public DatLaiMatKhauRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public Optional<MaDatLai> khoa(Long nguoiDungId) {
        return jdbc.query("SELECT * FROM DAT_LAI_MAT_KHAU WHERE nguoi_dung_id = ? FOR UPDATE", (rs, row) -> new MaDatLai(
                rs.getString("ma_bi_mat_hash"), rs.getTimestamp("het_han").toInstant(), rs.getInt("so_lan_thu"),
                rs.getTimestamp("gui_luc").toInstant(), rs.getTimestamp("cua_so_gui_luc").toInstant(),
                rs.getInt("so_lan_gui"), rs.getBoolean("da_dung")), nguoiDungId).stream().findFirst();
    }

    public void luu(Long id, String hash, Instant hetHan, Instant guiLuc, Instant cuaSo, int soLanGui) {
        jdbc.update("""
                INSERT INTO DAT_LAI_MAT_KHAU(nguoi_dung_id, ma_bi_mat_hash, het_han, so_lan_thu, gui_luc, cua_so_gui_luc, so_lan_gui, da_dung)
                VALUES (?, ?, ?, 0, ?, ?, ?, FALSE)
                ON CONFLICT(nguoi_dung_id) DO UPDATE SET ma_bi_mat_hash = EXCLUDED.ma_bi_mat_hash,
                    het_han = EXCLUDED.het_han, so_lan_thu = 0, gui_luc = EXCLUDED.gui_luc,
                    cua_so_gui_luc = EXCLUDED.cua_so_gui_luc, so_lan_gui = EXCLUDED.so_lan_gui, da_dung = FALSE
                """, id, hash, Timestamp.from(hetHan), Timestamp.from(guiLuc), Timestamp.from(cuaSo), soLanGui);
    }

    public void ghiSai(Long id) { jdbc.update("UPDATE DAT_LAI_MAT_KHAU SET so_lan_thu = LEAST(so_lan_thu + 1, 5) WHERE nguoi_dung_id = ?", id); }
    public void dung(Long id) { jdbc.update("UPDATE DAT_LAI_MAT_KHAU SET da_dung = TRUE WHERE nguoi_dung_id = ?", id); }

    public record MaDatLai(String hash, Instant hetHan, int soLanThu, Instant guiLuc, Instant cuaSoGuiLuc, int soLanGui, boolean daDung) {}
}
