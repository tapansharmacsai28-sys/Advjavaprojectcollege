package com.tradevault.repo;
import com.tradevault.model.TradingFolder;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface TradingFolderRepository extends JpaRepository<TradingFolder,Long>{
 List<TradingFolder> findByOwnerIdAndTypeOrderByNameAsc(Long ownerId,String type);
 Optional<TradingFolder> findByIdAndOwnerId(Long id,Long ownerId);
}
