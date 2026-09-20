package com.tradevault.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity @Table(name = "app_users")
public class AppUser {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  @Column(nullable=false) private String name;
  @Column(nullable=false, unique=true) private String email;
  @Column(nullable=false) private String passwordHash;
  private BigDecimal accountEquity = BigDecimal.valueOf(100000);
  protected AppUser() {}
  public AppUser(String name, String email, String passwordHash) { this.name=name; this.email=email.toLowerCase(); this.passwordHash=passwordHash; }
  public Long getId(){return id;} public String getName(){return name;} public String getEmail(){return email;} public String getPasswordHash(){return passwordHash;}
  public void setPasswordHash(String passwordHash){this.passwordHash=passwordHash;}
  public BigDecimal getAccountEquity(){return accountEquity==null?BigDecimal.valueOf(100000):accountEquity;}
  public void setAccountEquity(BigDecimal accountEquity){this.accountEquity=accountEquity;}
}
