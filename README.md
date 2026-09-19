# TradeVault — Advanced Java Lab Project

TradeVault is a full-stack trading portfolio journal built in Java 17 with Spring Boot, Spring Data JPA, H2, BCrypt password hashing, token-authenticated API endpoints, and a responsive HTML/CSS/JavaScript frontend.

## Run

```powershell
mvn spring-boot:run
```

Open `http://localhost:8080`. Create an account, then add trades to see journal, brokerage, leverage, P/L, analytics and risk metrics update.

## Features

- Sign-up, sign-in, password visibility control, sign-out
- Forgot-password email verification code and secure password reset (10-minute expiry, one-time use)
- BCrypt password hashing and per-user bearer-token sessions
- Persistent H2 database at `data/tradevault.mv.db`
- Buy/sell journal, leverage, brokerage, risk percentage and automatic gross/net P&L
- Dashboard, journal, analytics, risk center, profile dropdown, mobile/tablet/desktop layouts

The H2 console is available at `http://localhost:8080/h2-console` while running.

## Enable password-reset email

Set these environment variables with the credentials for an SMTP account (for Gmail, use an App Password, not your normal password), then start the project in a new terminal:

```powershell
$env:TRADEVAULT_SMTP_HOST="smtp.gmail.com"
$env:TRADEVAULT_SMTP_PORT="587"
$env:TRADEVAULT_SMTP_USERNAME="your-email@gmail.com"
$env:TRADEVAULT_SMTP_PASSWORD="your-16-character-app-password"
$env:TRADEVAULT_MAIL_FROM="your-email@gmail.com"
mvn spring-boot:run
```
