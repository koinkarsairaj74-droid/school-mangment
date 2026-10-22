# LAV SMS — Liquid Glass 2026 Upgrade

This is an upgrade layer for the existing Laravel 8 school-management application. The project is **not an SMS gateway or bulk texting application** based on the inspected source; it contains school-management modules such as students, teachers, timetables, marks, fees/payments, and parent accounts. Existing Laravel routes and legacy theme assets are retained.

## What's upgraded

- Responsive adaptive light/dark Liquid Glass theme, animated accents, reduced-motion support.
- Refreshed authenticated dashboard with role-aware shortcuts and existing school events calendar.
- LAV AI Assistant with demo mode by default and optional live AI through an OpenAI-compatible Chat Completions API.
- Authenticated AI endpoint with input validation, request throttling, timeout handling, and server-side secret storage.
- New assets are added separately to avoid replacing legacy vendor CSS/JS.

## Requirements

Use the PHP version supported by the original app's Composer dependencies, Composer, Node/npm for the existing legacy frontend if you need to rebuild it, and a MySQL-compatible database configured for this project. This is an older Laravel 8 codebase; test on a staging environment before production.

## Windows local setup

1. Extract the ZIP into a development folder.
2. Open PowerShell in the project directory (the directory containing `artisan`).
3. Install PHP dependencies:

   ```powershell
   composer install
   ```

4. Create the environment file and generate the Laravel key:

   ```powershell
   Copy-Item .env.example .env
   php artisan key:generate
   ```

   If `.env` already exists, preserve its existing credentials and add only the optional AI settings shown below.

5. Edit `.env` with your database name, username, password, `APP_URL`, and other deployment-specific values. Do not commit `.env`.
6. Run migrations only after backing up the database and reviewing the project's migrations:

   ```powershell
   php artisan migrate
   ```

   If you are using an existing installation, point this copy at a **staging database** first; don't run migrations blindly against production.
7. If the `public` directory doesn't contain built-in application assets, retain the included `public/assets/css/liquid-glass-2026.css` and `public/assets/js/liquid-glass-2026.js`. These do not need a build step.
8. Start a local server:

   ```powershell
   php artisan serve
   ```

   Visit the URL printed by Artisan. Sign in using an account already configured in your database.

## Enable live AI (optional)

Add these to `.env` on the server:

```dotenv
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
AI_API_KEY=replace-with-your-provider-key
```

- The endpoint expects an OpenAI-compatible `POST /chat/completions` API. Use your provider's documented base URL and model name if using another compatible provider.
- Keep `AI_API_KEY` server-side. Never put it in a Blade template, JavaScript bundle, or `MIX_` variable.
- Without a key, the assistant returns clearly labeled demo responses and does not call an AI provider.
- The AI endpoint is authenticated and throttled to 12 requests per minute per user/IP route middleware. Review this for your usage and provider quota.
- Generated text is not sent as an SMS by this feature. It is a drafting assistant only. Review generated output before copying it into any school communication.

After changing environment variables on a deployed Laravel instance, clear cached configuration as appropriate:

```bash
php artisan config:clear
php artisan config:cache
```

## Production checklist

- Set `APP_ENV=production`, `APP_DEBUG=false`, and the correct HTTPS `APP_URL`.
- Use a valid, unique `APP_KEY`; never regenerate it casually on an existing installation.
- Configure database, mail, backups, filesystem permissions, HTTPS, monitoring, and log rotation.
- Run `composer install --no-dev --optimize-autoloader` in a controlled deployment process compatible with the legacy lockfile.
- Run the full application in staging first. Review all existing modules, permissions, and migrations.
- Keep secrets out of Git and rotate any credentials that were previously committed.
- Test authentication, CSRF, student records, fees, marks, timetable, printing/PDF generation, and role-based access before launch.

## Important scope note

The repository uses Laravel 8 and a legacy Bootstrap/Limitless-style admin theme. This update modernizes the existing dashboard and adds an AI helper while keeping the current routes and vendor assets. It does not claim to upgrade Laravel itself or replace every individual legacy form/page; a framework upgrade should be planned separately with compatibility tests.
