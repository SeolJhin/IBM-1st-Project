// 경로: org/myweb/uniplace/domain/property/api/dto/request/SpaceUpdateRequest.java
package org.myweb.uniplace.domain.property.api.dto.request;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import lombok.*;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpaceUpdateRequest {

    private String buildingNm;

    private String spaceNm;
    private Integer spaceFloor;
    private Integer spaceCapacity;
    private String spaceOptions;
    private String spaceDesc;

    // 새 파일 추가
    private List<MultipartFile> files;

    // 기존 파일 삭제(soft delete)
    private List<Integer> deleteFileIds;

    // ✅ 기존 파일 순서 (fileId 배열, 인덱스가 곧 sort_order)
    private List<Integer> fileOrder;
}