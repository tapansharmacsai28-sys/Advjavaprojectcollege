package com.tradevault.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class FinancialMathServiceTest {
  private final FinancialMathService service = new FinancialMathService();

  @Test
  void calculatesLongTradeAfterFeesAndRisk() {
    FinancialMathService.TradeMath result = service.calculate(
        new BigDecimal("100"), new BigDecimal("110"), new BigDecimal("2"), BigDecimal.ONE,
        new BigDecimal("0.001"), new BigDecimal("1"), new BigDecimal("10"));

    assertEquals(new BigDecimal("20.00"), result.grossPnl());
    assertEquals(new BigDecimal("1.42"), result.brokerageFee());
    assertEquals(new BigDecimal("18.58"), result.netPnl());
    assertEquals(new BigDecimal("1.8580"), result.rMultiple());
  }

  @Test
  void capsPositionSizeAtLeverageConstrainedNotional() {
    BigDecimal size = service.positionSize(
        new BigDecimal("1000"), new BigDecimal("1"), new BigDecimal("100"), new BigDecimal("98"), new BigDecimal("2"));

    assertEquals(new BigDecimal("5.00000000"), size);
  }
}
