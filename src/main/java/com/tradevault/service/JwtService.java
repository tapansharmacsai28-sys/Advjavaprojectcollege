package com.tradevault.service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
  private final SecretKey key; private final long expiryHours;
  public JwtService(@Value("${tradevault.jwt.secret}") String secret, @Value("${tradevault.jwt.expiry-hours}") long expiryHours) {
    this.key=Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)); this.expiryHours=expiryHours;
  }
  public String issue(Long userId, String email) { Instant now=Instant.now(); return Jwts.builder().subject(userId.toString()).claim("email",email).issuedAt(Date.from(now)).expiration(Date.from(now.plusSeconds(expiryHours*3600))).signWith(key).compact(); }
  public Long userId(String token) { return Long.valueOf(Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload().getSubject()); }
}
