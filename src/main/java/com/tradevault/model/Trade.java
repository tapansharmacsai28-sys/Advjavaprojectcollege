package com.tradevault.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
public class Trade {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  @ManyToOne(optional=false) private AppUser owner;
  private LocalDate tradeDate; private String symbol; private String side; private BigDecimal quantity; private BigDecimal entryPrice; private BigDecimal exitPrice;
  private BigDecimal leverage; private BigDecimal brokerage; private BigDecimal riskPercent; private BigDecimal grossPnl; private BigDecimal netPnl; private BigDecimal rMultiple;
  private String strategyName; private String indicatorsUsed; private String folderPath; private String emotionTag; @Lob private String screenshotData; private String notes;
  protected Trade() {}
  public Trade(AppUser owner, LocalDate date, String symbol, String side, BigDecimal quantity, BigDecimal entry, BigDecimal exit, BigDecimal leverage, BigDecimal brokerage, BigDecimal risk, String notes) {
    this.owner=owner; tradeDate=date; this.symbol=symbol.toUpperCase(); this.side=side.toUpperCase(); this.quantity=quantity; entryPrice=entry; exitPrice=exit; this.leverage=leverage; this.brokerage=brokerage; riskPercent=risk; this.notes=notes;
    grossPnl=exit.subtract(entry).multiply(quantity).multiply("SELL".equals(this.side)?BigDecimal.valueOf(-1):BigDecimal.ONE); netPnl=grossPnl.subtract(brokerage); rMultiple=BigDecimal.ZERO;
  }
  public void applyMath(BigDecimal gross, BigDecimal fee, BigDecimal net, BigDecimal r){grossPnl=gross; brokerage=fee; netPnl=net; rMultiple=r;}
  public void enrich(String strategy,String indicators,String path,String emotion){strategyName=strategy;indicatorsUsed=indicators;folderPath=path;emotionTag=emotion;}
  public void setScreenshotData(String screenshotData){this.screenshotData=screenshotData;}
  public Long getId(){return id;} public LocalDate getTradeDate(){return tradeDate;} public String getSymbol(){return symbol;} public String getSide(){return side;} public BigDecimal getQuantity(){return quantity;} public BigDecimal getEntryPrice(){return entryPrice;} public BigDecimal getExitPrice(){return exitPrice;} public BigDecimal getLeverage(){return leverage;} public BigDecimal getBrokerage(){return brokerage;} public BigDecimal getRiskPercent(){return riskPercent;} public BigDecimal getGrossPnl(){return grossPnl;} public BigDecimal getNetPnl(){return netPnl;} public BigDecimal getRMultiple(){return rMultiple;} public String getStrategyName(){return strategyName;} public String getIndicatorsUsed(){return indicatorsUsed;} public String getFolderPath(){return folderPath;} public String getEmotionTag(){return emotionTag;} public String getScreenshotData(){return screenshotData;} public String getNotes(){return notes;}
}
