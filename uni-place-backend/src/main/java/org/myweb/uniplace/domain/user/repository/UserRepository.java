package org.myweb.uniplace.domain.user.repository;

import org.myweb.uniplace.domain.user.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    boolean existsByUserEmail(String userEmail);
    boolean existsByUserTel(String userTel);
    Optional<User> findByUserEmail(String userEmail);
}
