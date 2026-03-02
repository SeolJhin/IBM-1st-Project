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
import org.myweb.uniplace.global.util.StringNormalizer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Transactional
public class AffiliateServiceImpl implements AffiliateService {

    private final AffiliateRepository affiliateRepository;

    // 너무 빡세지 않은 이메일 정규식(실무에서 흔히 쓰는 수준)
    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

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

        // ✅ 정책 A안: "" / "   " 은 null 처리 => 수정 안 함
        Integer buildingId = request.getBuildingId();

        String affiliateNm   = StringNormalizer.trimToNull(request.getAffiliateNm());
        String affiliateCeo  = StringNormalizer.trimToNull(request.getAffiliateCeo());
        String affiliateTel  = StringNormalizer.trimToNull(request.getAffiliateTel());
        String businessNo    = StringNormalizer.trimToNull(request.getBusinessNo());
        String affiliateFax  = StringNormalizer.trimToNull(request.getAffiliateFax());
        String affiliateEmail= StringNormalizer.trimToNull(request.getAffiliateEmail());
        String affiliateAddr = StringNormalizer.trimToNull(request.getAffiliateAddr());

        String code          = StringNormalizer.trimToNull(request.getCode());
        String affiliateDesc = StringNormalizer.trimToNull(request.getAffiliateDesc());

        // ✅ 이메일은 "값이 있을 때만" 형식 검증
        if (affiliateEmail != null && !EMAIL_PATTERN.matcher(affiliateEmail).matches()) {
            // 프로젝트 ErrorCode에 맞는게 있으면 그걸 쓰고, 없으면 아래처럼 INVALID_REQUEST 계열로
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        affiliate.update(
                buildingId,
                affiliateNm,
                affiliateCeo,
                affiliateTel,
                businessNo,
                affiliateFax,
                affiliateEmail,
                affiliateAddr,
                request.getAffiliateStartAt(),
                request.getAffiliateEndAt(),
                code,
                affiliateDesc,
                request.getAffiliateSt()
        );

        // ✅ dirty checking으로 자동 반영
        return AffiliateResponse.from(affiliate);
    }
    
    @Override
    public void delete(Integer affiliateId) {
        if (!affiliateRepository.existsById(affiliateId)) {
            throw new BusinessException(ErrorCode.AFFILIATE_NOT_FOUND);
        }

        affiliateRepository.deleteById(affiliateId);
        affiliateRepository.flush();
    }
}