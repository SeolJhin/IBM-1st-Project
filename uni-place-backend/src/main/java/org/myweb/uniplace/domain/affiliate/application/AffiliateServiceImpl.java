package org.myweb.uniplace.domain.affiliate.application;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.affiliate.api.dto.request.AffiliateCreateRequest;
import org.myweb.uniplace.domain.affiliate.api.dto.request.AffiliateSearchRequest;
import org.myweb.uniplace.domain.affiliate.api.dto.request.AffiliateUpdateRequest;
import org.myweb.uniplace.domain.affiliate.api.dto.response.AffiliateResponse;
import org.myweb.uniplace.domain.affiliate.api.dto.response.AffiliateSummaryResponse;
import org.myweb.uniplace.domain.affiliate.domain.entity.Affiliate;
import org.myweb.uniplace.domain.affiliate.repository.AffiliateRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.response.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AffiliateServiceImpl implements AffiliateService {

    private final AffiliateRepository affiliateRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AffiliateSummaryResponse> search(AffiliateSearchRequest request, Pageable pageable) {

        Page<Affiliate> page = affiliateRepository.search(
                request.getBuildingId(),
                request.getCode(),
                request.getKeyword(),
                request.getAffiliateSt(),
                pageable
        );

        return PageResponse.of(page.map(AffiliateSummaryResponse::from));
    }

    @Override
    @Transactional(readOnly = true)
    public AffiliateResponse get(Integer affiliateId) {
        Affiliate affiliate = affiliateRepository.findById(affiliateId)
                .orElseThrow(() -> new BusinessException(ErrorCode.AFFILIATE_NOT_FOUND));
        return AffiliateResponse.from(affiliate);
    }

    @Override
    public AffiliateResponse create(AffiliateCreateRequest request) {

        if (affiliateRepository.existsByBuildingIdAndAffiliateNmIgnoreCase(
                request.getBuildingId(),
                request.getAffiliateNm()
        )) {
            throw new BusinessException(ErrorCode.AFFILIATE_DUPLICATE);
        }

        Affiliate affiliate = Affiliate.builder()
                .buildingId(request.getBuildingId())
                .affiliateNm(request.getAffiliateNm())
                .affiliateCeo(request.getAffiliateCeo())
                .affiliateTel(request.getAffiliateTel())
                .businessNo(request.getBusinessNo())
                .affiliateFax(request.getAffiliateFax())
                .affiliateEmail(request.getAffiliateEmail())
                .affiliateAddr(request.getAffiliateAddr())
                .affiliateStartAt(request.getAffiliateStartAt())
                .affiliateEndAt(request.getAffiliateEndAt())
                .code(request.getCode())
                .affiliateDesc(request.getAffiliateDesc())
                .affiliateSt(request.getAffiliateSt())
                .build();

        return AffiliateResponse.from(affiliateRepository.save(affiliate));
    }

    @Override
    public AffiliateResponse update(Integer affiliateId, AffiliateUpdateRequest request) {

        Affiliate affiliate = affiliateRepository.findById(affiliateId)
                .orElseThrow(() -> new BusinessException(ErrorCode.AFFILIATE_NOT_FOUND));

        affiliate.update(
                request.getBuildingId(),
                request.getAffiliateNm(),
                request.getAffiliateCeo(),
                request.getAffiliateTel(),
                request.getBusinessNo(),
                request.getAffiliateFax(),
                request.getAffiliateEmail(),
                request.getAffiliateAddr(),
                request.getAffiliateStartAt(),
                request.getAffiliateEndAt(),
                request.getCode(),
                request.getAffiliateDesc(),
                request.getAffiliateSt()
        );

        return AffiliateResponse.from(affiliate);
    }
}
