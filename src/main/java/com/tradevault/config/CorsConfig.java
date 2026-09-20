package com.tradevault.config;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Allows a separately deployed static frontend (for example Vercel) to call this API. */
@Configuration
public class CorsConfig implements WebMvcConfigurer {
  private final List<String> allowedOrigins;

  public CorsConfig(@Value("${tradevault.cors.allowed-origins:}") String origins) {
    this.allowedOrigins = List.of(origins.split(",")).stream().map(String::trim).filter(value -> !value.isBlank()).toList();
  }

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    if (allowedOrigins.isEmpty()) {
      return;
    }

    registry.addMapping("/api/**")
        .allowedOrigins(allowedOrigins.toArray(String[]::new))
        .allowedMethods("GET", "POST", "OPTIONS")
        .allowedHeaders("Authorization", "Content-Type")
        .maxAge(3600);
  }
}
