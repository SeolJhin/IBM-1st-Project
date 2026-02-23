package org.myweb.uniplace.domain.contract.api.dto.request;

import java.time.LocalDateTime;

import org.myweb.uniplace.domain.contract.domain.enums.ContractStatus;
import org.springframework.web.multipart.MultipartFile;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractUpdateRequest {

    // ✅ 관리자 수정: 계약 상태 변경
    private ContractStatus contractStatus;

    // ✅ 관리자 수정: 실제 입주일(필요 시)
    private LocalDateTime moveinAt;

    // ✅ 관리자 수정: 계약서 PDF 첨부(업로드 시 contractPdfFileId 갱신)
    private MultipartFile pdfFile;
}