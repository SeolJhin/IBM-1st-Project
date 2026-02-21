package org.myweb.uniplace.domain.commoncode.application;

import org.myweb.uniplace.domain.commoncode.api.dto.request.CommonCodeCreateRequest;
import org.myweb.uniplace.domain.commoncode.api.dto.request.GroupCommonCodeCreateRequest;
import org.myweb.uniplace.domain.commoncode.api.dto.response.CommonCodeResponse;
import org.myweb.uniplace.domain.commoncode.api.dto.response.GroupCommonCodeResponse;

import java.util.List;

public interface CommonCodeService {

    // ✅ admin 전용 조회
    List<GroupCommonCodeResponse> getActiveGroups();
    List<CommonCodeResponse> getActiveCodes(String groupCode);
    List<CommonCodeResponse> getAllCodes(String groupCode);

    // ✅ admin 전용 생성
    void createGroup(GroupCommonCodeCreateRequest request);
    void createCode(CommonCodeCreateRequest request);

    // ✅ admin 전용 활성/비활성
    void changeGroupActive(String groupCode, boolean active);
    void changeCodeActive(String code, boolean active);
}