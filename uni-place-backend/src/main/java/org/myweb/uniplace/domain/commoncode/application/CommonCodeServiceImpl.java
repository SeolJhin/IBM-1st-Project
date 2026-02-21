package org.myweb.uniplace.domain.commoncode.application;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.commoncode.api.dto.request.CommonCodeCreateRequest;
import org.myweb.uniplace.domain.commoncode.api.dto.request.GroupCommonCodeCreateRequest;
import org.myweb.uniplace.domain.commoncode.api.dto.response.CommonCodeResponse;
import org.myweb.uniplace.domain.commoncode.api.dto.response.GroupCommonCodeResponse;
import org.myweb.uniplace.domain.commoncode.domain.entity.CommonCode;
import org.myweb.uniplace.domain.commoncode.domain.entity.GroupCommonCode;
import org.myweb.uniplace.domain.commoncode.repository.CommonCodeRepository;
import org.myweb.uniplace.domain.commoncode.repository.GroupCommonCodeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommonCodeServiceImpl implements CommonCodeService {

    private static final int ACTIVE = 1;

    private final GroupCommonCodeRepository groupRepo;
    private final CommonCodeRepository codeRepo;

    // =========================
    // 조회 (admin)
    // =========================

    @Override
    public List<GroupCommonCodeResponse> getActiveGroups() {
        return groupRepo.findByIsActiveOrderByGroupCodeAsc(ACTIVE)
                .stream()
                .map(GroupCommonCodeResponse::fromEntity)
                .toList();
    }

    @Override
    public List<CommonCodeResponse> getActiveCodes(String groupCode) {
        requireText(groupCode, "groupCode");

        // 그룹 존재 확인
        groupRepo.findById(groupCode)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 groupCode=" + groupCode));

        return codeRepo.findByGroup_GroupCodeAndIsActiveOrderByDisplayOrderAscCodeAsc(groupCode, ACTIVE)
                .stream()
                .map(CommonCodeResponse::fromEntity)
                .toList();
    }

    @Override
    public List<CommonCodeResponse> getAllCodes(String groupCode) {
        requireText(groupCode, "groupCode");

        groupRepo.findById(groupCode)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 groupCode=" + groupCode));

        return codeRepo.findByGroup_GroupCodeOrderByDisplayOrderAscCodeAsc(groupCode)
                .stream()
                .map(CommonCodeResponse::fromEntity)
                .toList();
    }

    // =========================
    // 생성 (admin)
    // =========================

    @Override
    @Transactional
    public void createGroup(GroupCommonCodeCreateRequest request) {
        if (request == null) throw new IllegalArgumentException("request는 필수입니다.");
        requireText(request.getGroupCode(), "groupCode");
        requireText(request.getGroupCodeName(), "groupCodeName");

        if (groupRepo.existsById(request.getGroupCode())) {
            throw new IllegalArgumentException("이미 존재하는 groupCode=" + request.getGroupCode());
        }
        if (groupRepo.existsByGroupCodeName(request.getGroupCodeName())) {
            throw new IllegalArgumentException("이미 존재하는 groupCodeName=" + request.getGroupCodeName());
        }

        GroupCommonCode e = GroupCommonCode.builder()
                .groupCode(request.getGroupCode())
                .groupCodeName(request.getGroupCodeName())
                .description(request.getDescription())
                .isActive(request.getIsActive() == null ? ACTIVE : request.getIsActive())
                .build();

        groupRepo.save(e);
    }

    @Override
    @Transactional
    public void createCode(CommonCodeCreateRequest request) {
        if (request == null) throw new IllegalArgumentException("request는 필수입니다.");
        requireText(request.getGroupCode(), "groupCode");
        requireText(request.getCode(), "code");
        requireText(request.getCodeValue(), "codeValue");

        if (codeRepo.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("이미 존재하는 code(PK)=" + request.getCode());
        }

        GroupCommonCode group = groupRepo.findById(request.getGroupCode())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 groupCode=" + request.getGroupCode()));

        CommonCode e = CommonCode.builder()
                .code(request.getCode())
                .group(group)
                .codeValue(request.getCodeValue())
                .description(request.getDescription())
                .displayOrder(request.getDisplayOrder())
                .isActive(request.getIsActive() == null ? ACTIVE : request.getIsActive())
                .build();

        codeRepo.save(e);
    }

    // =========================
    // 활성/비활성 (admin)
    // =========================

    @Override
    @Transactional
    public void changeGroupActive(String groupCode, boolean active) {
        requireText(groupCode, "groupCode");

        GroupCommonCode group = groupRepo.findById(groupCode)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 groupCode=" + groupCode));

        group.changeActive(active);
    }

    @Override
    @Transactional
    public void changeCodeActive(String code, boolean active) {
        requireText(code, "code");

        CommonCode cc = codeRepo.findById(code)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 code=" + code));

        cc.changeActive(active);
    }

    private void requireText(String v, String field) {
        if (v == null || v.isBlank()) throw new IllegalArgumentException(field + "는 필수입니다.");
    }
}