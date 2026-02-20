package org.myweb.uniplace.domain.system.application;

import org.myweb.uniplace.domain.system.api.dto.response.BannerResponse;

import java.time.LocalDateTime;
import java.util.List;

public interface BannerService {
    List<BannerResponse> getActive(LocalDateTime now);

    BannerResponse create(LocalDateTime startAt, LocalDateTime endAt, String title, String url, Integer order);
    BannerResponse update(Integer banId, LocalDateTime startAt, LocalDateTime endAt, String title, String url, Integer order, String status);
    void delete(Integer banId);
}