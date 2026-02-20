package org.myweb.uniplace.domain.commoncode.repository;

import org.myweb.uniplace.domain.commoncode.domain.entity.GroupCommonCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GroupCommonCodeRepository extends JpaRepository<GroupCommonCode, String> {

    List<GroupCommonCode> findByIsActiveOrderByGroupCodeAsc(Integer isActive);

    boolean existsByGroupCodeName(String groupCodeName);
}