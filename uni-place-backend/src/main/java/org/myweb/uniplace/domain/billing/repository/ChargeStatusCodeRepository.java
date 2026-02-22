package org.myweb.uniplace.domain.billing.repository;

import org.myweb.uniplace.domain.billing.domain.entity.ChargeStatusCode;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChargeStatusCodeRepository extends JpaRepository<ChargeStatusCode, String> {

}
