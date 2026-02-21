package org.myweb.uniplace.domain.payment.repository;

import org.myweb.uniplace.domain.payment.domain.entity.ServiceGoods;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ServiceGoodsRepository extends JpaRepository<ServiceGoods, Integer> {

    Optional<ServiceGoods> findByServiceGoodsCd(String serviceGoodsCd);

}