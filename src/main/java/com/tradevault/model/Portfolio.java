package com.tradevault.model;
import jakarta.persistence.*; import java.math.BigDecimal; import java.time.LocalDate;
@Entity public class Portfolio {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id; @ManyToOne(optional=false) private AppUser owner; @Column(nullable=false) private String name; private String description; private BigDecimal initialCapital; private String currency; private LocalDate createdDate=LocalDate.now(); private boolean archived;
 protected Portfolio(){} public Portfolio(AppUser o,String n,String d,BigDecimal c,String cur){owner=o;name=n;description=d;initialCapital=c;currency=cur;}
 public Long getId(){return id;} public String getName(){return name;} public String getDescription(){return description;} public BigDecimal getInitialCapital(){return initialCapital;} public String getCurrency(){return currency;} public LocalDate getCreatedDate(){return createdDate;} public boolean isArchived(){return archived;} public AppUser getOwner(){return owner;}
}
