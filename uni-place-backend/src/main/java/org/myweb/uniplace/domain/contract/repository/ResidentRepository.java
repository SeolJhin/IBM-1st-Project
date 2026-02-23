package org.myweb.uniplace.domain.contract.repository;

import org.myweb.uniplace.domain.contract.domain.entity.Resident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ResidentRepository extends JpaRepository<Resident, Integer> {
}