package com.tradevault.service;

import com.tradevault.model.Trade;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class StrategyRankingService {
  public record StrategyPerformance(String name, BigDecimal netPnl, long trades, double winRate) {}
  public List<StrategyPerformance> rank(List<Trade> trades) {
    return trades.stream().collect(Collectors.groupingBy(t -> t.getStrategyName() == null || t.getStrategyName().isBlank() ? "Unassigned" : t.getStrategyName()))
      .entrySet().stream().map(e -> {
        BigDecimal net = e.getValue().stream().map(Trade::getNetPnl).reduce(BigDecimal.ZERO, BigDecimal::add);
        long wins = e.getValue().stream().filter(t -> t.getNetPnl().signum() > 0).count();
        return new StrategyPerformance(e.getKey(), net, e.getValue().size(), e.getValue().isEmpty() ? 0 : wins * 100.0 / e.getValue().size());
      }).sorted(Comparator.comparing(StrategyPerformance::netPnl).reversed()).toList();
  }
}
