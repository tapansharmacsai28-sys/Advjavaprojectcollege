package com.tradevault.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.stereotype.Service;

/** Deterministic financial calculations. Never use floating point for money. */
@Service
public class FinancialMathService {
  public record TradeMath(BigDecimal grossPnl, BigDecimal brokerageFee, BigDecimal netPnl, BigDecimal rMultiple) {}
  private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

  public TradeMath calculate(BigDecimal entry, BigDecimal exit, BigDecimal size, BigDecimal directionFactor,
      BigDecimal feeRate, BigDecimal fixedCommission, BigDecimal riskAmount) {
    BigDecimal gross = exit.subtract(entry).multiply(size).multiply(directionFactor);
    BigDecimal turnover = size.multiply(entry).add(size.multiply(exit));
    BigDecimal brokerage = turnover.multiply(feeRate).add(fixedCommission);
    BigDecimal net = gross.subtract(brokerage);
    BigDecimal r = riskAmount.signum() == 0 ? BigDecimal.ZERO : net.divide(riskAmount, 4, RoundingMode.HALF_UP);
    return new TradeMath(scale(gross), scale(brokerage), scale(net), r);
  }
  public BigDecimal positionSize(BigDecimal equity, BigDecimal riskPercent, BigDecimal entry, BigDecimal stop, BigDecimal leverage) {
    BigDecimal riskCapital = equity.multiply(riskPercent).divide(HUNDRED, 8, RoundingMode.HALF_UP);
    BigDecimal perUnitRisk = entry.subtract(stop).abs();
    if (perUnitRisk.signum() == 0 || leverage.compareTo(BigDecimal.ONE) < 0 || leverage.compareTo(BigDecimal.valueOf(100)) > 0) return BigDecimal.ZERO;
    return riskCapital.divide(perUnitRisk, 8, RoundingMode.HALF_UP).min(equity.multiply(leverage).divide(entry, 8, RoundingMode.HALF_UP));
  }
  private BigDecimal scale(BigDecimal value) { return value.setScale(2, RoundingMode.HALF_UP); }
}
