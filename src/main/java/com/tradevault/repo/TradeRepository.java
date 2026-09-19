package com.tradevault.repo;
import com.tradevault.model.Trade; import java.util.List; import org.springframework.data.jpa.repository.JpaRepository;
public interface TradeRepository extends JpaRepository<Trade,Long>{ List<Trade> findByOwnerIdOrderByTradeDateDesc(Long id); }
