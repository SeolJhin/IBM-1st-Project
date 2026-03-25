package org.myweb.uniplace.domain.billing.repository;

import org.myweb.uniplace.domain.billing.domain.entity.MonthlyCharge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MonthlyChargeRepository extends JpaRepository<MonthlyCharge, Integer> {

    List<MonthlyCharge> findByContractIdOrderByBillingDtDesc(Integer contractId);

    Optional<MonthlyCharge> findByContractIdAndBillingDtAndChargeType(
            Integer contractId,
            String billingDt,
            String chargeType
    );

    List<MonthlyCharge> findByChargeSt(String chargeSt);
}
