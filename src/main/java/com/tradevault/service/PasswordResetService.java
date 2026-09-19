package com.tradevault.service;

import com.tradevault.model.*;
import com.tradevault.repo.*;
import java.security.SecureRandom;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class PasswordResetService {
  private final PasswordResetCodeRepository resets; private final PasswordEncoder encoder; private final JavaMailSender mail; private final String from; private final String host;
  private final SecureRandom random = new SecureRandom();
  public PasswordResetService(PasswordResetCodeRepository resets, PasswordEncoder encoder, JavaMailSender mail, @Value("${tradevault.mail.from:}") String from, @Value("${spring.mail.host:}") String host) { this.resets=resets; this.encoder=encoder; this.mail=mail; this.from=from; this.host=host; }
  public void sendCode(AppUser user) {
    if (host.isBlank()) throw new IllegalStateException("Email delivery is not configured. Set the TradeVault SMTP environment variables first.");
    String code = String.format("%06d", random.nextInt(1_000_000));
    resets.save(new PasswordResetCode(user, encoder.encode(code), Instant.now().plusSeconds(900)));
    SimpleMailMessage message = new SimpleMailMessage();
    if (!from.isBlank()) message.setFrom(from);
    message.setTo(user.getEmail()); message.setSubject("Your TradeVault password reset code");
    message.setText("Use this code to reset your TradeVault password: " + code + "\n\nIt expires in 15 minutes. If you did not request it, you can safely ignore this email.");
    mail.send(message);
  }
  public boolean reset(AppUser user, String code, String newPassword) {
    PasswordResetCode reset = resets.findTopByUserIdOrderByIdDesc(user.getId()).orElse(null);
    if (reset == null || reset.isUsed() || Instant.now().isAfter(reset.getExpiresAt()) || !encoder.matches(code, reset.getCodeHash())) return false;
    user.setPasswordHash(encoder.encode(newPassword)); reset.use(); return true;
  }
}
