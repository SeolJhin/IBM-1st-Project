package org.myweb.uniplace.domain.system.application;

import org.myweb.uniplace.domain.system.api.dto.request.BannerCreateRequest;
import org.myweb.uniplace.domain.system.api.dto.request.BannerUpdateRequest;
import org.myweb.uniplace.domain.system.api.dto.response.BannerResponse;

import java.util.List;

public interface BannerService {
    List<BannerResponse> getActiveNow();

    BannerResponse create(BannerCreateRequest request);
    BannerResponse update(Integer banId, BannerUpdateRequest request);

    void delete(Integer banId);
}