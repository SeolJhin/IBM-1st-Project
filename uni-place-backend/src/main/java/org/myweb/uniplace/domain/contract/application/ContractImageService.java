package org.myweb.uniplace.domain.contract.application;

import org.myweb.uniplace.domain.contract.domain.entity.Contract;

public interface ContractImageService {

    /**
     * 계약서 이미지 생성 후 FileService에 저장
     * @param contract 계약 엔티티 (room/building 정보 포함)
     * @return 저장된 fileId (실패 시 null)
     */
    Integer generateAndSave(Contract contract);
}