package org.myweb.uniplace.domain.billing.repository;

import org.myweb.uniplace.domain.billing.domain.entity.BillingOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BillingOrderRepository extends JpaRepository<BillingOrder, Integer> {

    List<BillingOrder> findByContractIdOrderByOrderIdDesc(Integer contractId);

    Optional<BillingOrder> findTopByChargeIdOrderByOrderIdDesc(Integer chargeId);
}
