package org.myweb.uniplace.domain.system.repository;

import org.myweb.uniplace.domain.system.domain.entity.CompanyInfo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CompanyInfoRepository extends JpaRepository<CompanyInfo, Integer> {
    Optional<CompanyInfo> findTopByOrderByCompanyIdDesc(); // 가장 최신 1개
}