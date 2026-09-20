# TradeVault — Advanced Java Lab Project

TradeVault is a full-stack trading portfolio journal built in Java 17 with Spring Boot, Spring Data JPA, PostgreSQL-ready production configuration, BCrypt password hashing, signed JWT authentication, and a responsive HTML/CSS/JavaScript frontend.

## Run

```powershell
$env:TRADEVAULT_JWT_SECRET="replace-with-a-random-32-byte-minimum-secret"
$env:TRADEVAULT_CORS_ORIGINS="http://localhost:8080"
mvn spring-boot:run
```

Open `http://localhost:8080`. Create an account, then add trades to see journal, brokerage, leverage, P/L, analytics and risk metrics update.

## Features

- Sign-up, sign-in, password visibility control, sign-out
- Forgot-password email verification code and secure password reset (15-minute expiry, one-time use)
- BCrypt password hashing and signed JWT sessions
- Persistent H2 database at `data/tradevault.mv.db`
- Buy/sell journal, leverage, brokerage, risk percentage and automatic gross/net P&L
- Dashboard, journal, analytics, risk center, profile dropdown, mobile/tablet/desktop layouts

The H2 console is available at `http://localhost:8080/h2-console` while running.

## Deployment architecture

TradeVault has two deployable parts:

- **Frontend:** Vercel builds the static UI into `dist/`; `vercel.json` defines the build and output directory.
- **Backend:** Deploy the Java 17 Spring Boot service to a JVM host such as Render, Railway, Fly.io, or a container host. Vercel is ideal for the static frontend, but it is not a persistent JVM application host or database host.

For a split deployment, set `TRADEVAULT_CORS_ORIGINS` on the backend to the exact Vercel site origin. In Vercel Project Settings, set the non-secret build variable `TRADEVAULT_API_BASE` to the public HTTPS URL of the backend (for example, `https://tradevault-api.example.com`). The Vercel build writes that URL into the deployed frontend only; local Spring Boot use remains unchanged.

## Production deployment

`render.yaml` and the Java 17 `Dockerfile` define the Render web service. Create a Render PostgreSQL database in the same region, then add these **Render environment variables** to the API service. Do not commit their values.

```text
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=jdbc:postgresql://<host>:5432/<database>
SPRING_DATASOURCE_USERNAME=<database-user>
SPRING_DATASOURCE_PASSWORD=<database-password>
TRADEVAULT_JWT_SECRET=<random-secret-at-least-32-bytes>
TRADEVAULT_CORS_ORIGINS=https://<your-vercel-project>.vercel.app
```

Render supplies `PORT`; TradeVault reads it automatically. Add SMTP variables from the next section only if password-reset emails are required. In Vercel, deploy the repository as an **Other** project and set `TRADEVAULT_API_BASE` in Project Settings before deploying.

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
