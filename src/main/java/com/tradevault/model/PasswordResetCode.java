package com.tradevault.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
public class PasswordResetCode {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  @ManyToOne(optional = false) private AppUser user;
  @Column(nullable = false) private String codeHash;
  @Column(nullable = false) private Instant expiresAt;
  private boolean used;
  protected PasswordResetCode() {}
  public PasswordResetCode(AppUser user, String codeHash, Instant expiresAt) { this.user=user; this.codeHash=codeHash; this.expiresAt=expiresAt; }
  public AppUser getUser(){return user;} public String getCodeHash(){return codeHash;} public Instant getExpiresAt(){return expiresAt;} public boolean isUsed(){return used;} public void use(){used=true;}
}
