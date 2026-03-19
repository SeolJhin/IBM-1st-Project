package org.myweb.uniplace.domain.user.repository;

import org.myweb.uniplace.domain.user.domain.entity.FaceDescriptor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FaceDescriptorRepository extends JpaRepository<FaceDescriptor, Long> {
    Optional<FaceDescriptor> findByUserId(String userId);
}