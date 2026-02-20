package org.myweb.uniplace.domain.commoncode.repository;

import org.myweb.uniplace.domain.commoncode.domain.entity.CommonCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommonCodeRepository extends JpaRepository<CommonCode, String> {

    // 활성만
    List<CommonCode> findByGroup_GroupCodeAndIsActiveOrderByDisplayOrderAscCodeAsc(String groupCode, Integer isActive);

    // 전체(관리자용)
    List<CommonCode> findByGroup_GroupCodeOrderByDisplayOrderAscCodeAsc(String groupCode);

    boolean existsByCode(String code);
}