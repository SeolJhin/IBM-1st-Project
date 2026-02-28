package org.myweb.uniplace.domain.user.repository;

import org.myweb.uniplace.domain.user.domain.entity.User;
import org.myweb.uniplace.domain.user.domain.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByUserEmail(String userEmail);

    boolean existsByUserEmail(String userEmail);

    boolean existsByUserTel(String userTel);
    
    List<User> findAllByUserRole(UserRole userRole);
    
    Page<User> findByUserRole(UserRole userRole, Pageable pageable);
}
