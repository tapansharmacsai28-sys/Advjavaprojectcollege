package com.tradevault.config;

import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.servlet.server.ServletWebServerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Uses Tomcat's NIO2 connector. On some Windows/JDK installations the default
 * NIO connector cannot create its internal loopback selector, even when port
 * 8080 is free. NIO2 avoids that selector and still serves normal HTTP traffic.
 */
@Configuration
public class TomcatConfig {
  @Bean
  ServletWebServerFactory webServerFactory() {
    TomcatServletWebServerFactory factory = new TomcatServletWebServerFactory();
    factory.setProtocol("org.apache.coyote.http11.Http11Nio2Protocol");
    return factory;
  }
}
