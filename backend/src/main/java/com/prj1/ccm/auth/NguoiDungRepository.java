package com.prj1.ccm.auth;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface NguoiDungRepository extends JpaRepository<NguoiDung, Long> {

	Optional<NguoiDung> findBySoDienThoai(String soDienThoai);
}
