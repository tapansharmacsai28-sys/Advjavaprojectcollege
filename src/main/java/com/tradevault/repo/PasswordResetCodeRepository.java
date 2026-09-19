package com.tradevault.repo;

import com.tradevault.model.PasswordResetCode;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetCodeRepository extends JpaRepository<PasswordResetCode, Long> {
  Optional<PasswordResetCode> findTopByUserIdOrderByIdDesc(Long userId);
}
