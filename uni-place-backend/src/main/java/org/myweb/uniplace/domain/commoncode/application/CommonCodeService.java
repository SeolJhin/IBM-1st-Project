package org.myweb.uniplace.domain.commoncode.application;

import org.myweb.uniplace.domain.commoncode.api.dto.request.CommonCodeCreateRequest;
import org.myweb.uniplace.domain.commoncode.api.dto.request.GroupCommonCodeCreateRequest;
import org.myweb.uniplace.domain.commoncode.api.dto.response.CommonCodeResponse;
import org.myweb.uniplace.domain.commoncode.api.dto.response.GroupCommonCodeResponse;

import java.util.List;

public interface CommonCodeService {

    // public
    List<GroupCommonCodeResponse> getActiveGroups();
    List<CommonCodeResponse> getActiveCodes(String groupCode);

    // admin
    void createGroup(GroupCommonCodeCreateRequest request);
    void createCode(CommonCodeCreateRequest request);

    void changeGroupActive(String groupCode, boolean active);
    void changeCodeActive(String code, boolean active);
}