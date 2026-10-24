# LAV SMS — online Laravel school demo (Render)

**Source:** The Dockerfile pulls the public Laravel project from
`sairajkoinkar27-hash/lav_sms` (`master`). This branch of
`koinkarsairaj74-droid/school-mangment` contains only a deployment wrapper.
The old GitHub Pages website on `main` is unchanged.

**Status:** Source/configuration prepared. Render service has NOT yet been
created, built or end-to-end browser tested.

## Deploy from your Render account

1. Sign in to https://dashboard.render.com/
2. Select **New > Blueprint** and connect
   `koinkarsairaj74-droid/school-mangment`.
3. Select branch **laravel-render-demo** (NOT `main`). The branch's
   `render.yaml` defines the Docker-based web service.
4. Check Render's current plans/pricing before approving. A free plan is
   requested but may not be available on every account.
5. Render will request a PRIVATE value for
   `DEMO_ADMIN_PASSWORD`: choose your own secret (16+ characters). Do NOT
   share it in screenshots or commit it to GitHub.
6. `APP_KEY_SEED` is privately generated once by Render. The startup script
   derives the required 32-byte Laravel application encryption key.
7. Create/deploy the Blueprint; inspect build/startup logs.
8. Open the Render-provided `https://...` URL and sign in with:
   username: **schooladmin** / password: the private value you chose.
9. In the Web Service Environment, set `APP_URL` to the actual HTTPS URL
   Render issued, then redeploy if needed.

If Blueprint branch selection is unavailable: New > Web Service > connect
`koinkarsairaj74-droid/school-mangment` > choose the
`laravel-render-demo` branch > Docker runtime (root Dockerfile).
Set the environment variables shown in `render.yaml` yourself, especially
private `APP_KEY_SEED` and `DEMO_ADMIN_PASSWORD`.

## What you can demonstrate

The original Laravel backend provides sessions, password authentication,
school classes, students, teachers, subjects, exams and payment records.
This wrapper adds fictional test data. Features are **not verified live**
until Render deploys and login, student workflows and receipts are tested.

## Serious safety limits

- Demo only, not production software. No real student data or real payments.
- PHP 8.1 / Laravel 8.42.1 are unsupported. Dependencies need upgrading and
  auditing before the school uses this for daily records.
- SQLite is stored on the disposable Render container: records may disappear
  after redeploy or restart, so do not rely on persistent attendance/payments.
- Old upstream payment UI uses Nigerian currency. INR/local fee categories,
  attendance and other school-specific modules need backend implementation.
- Only use the generated private password. This deploy does NOT run the
  upstream seeder with published default passwords.
- Production requires durable database/storage, security audit, access-control
  testing, backups and a tested restoration process.

## If the app does not deploy

- Build errors: copy only nonsecret error lines from Render **Logs**.
- Empty login screen or error 500: check `APP_KEY_SEED`,
  `DEMO_ADMIN_PASSWORD`, and migrations in startup logs.
- Error while cloning: ensure the source repository is publicly accessible.
- Missing assets: check Docker uses `/var/www/html/public` and reverse proxy.
- Incorrect HTTPS links: set `APP_URL` to the URL Render actually assigned.

The original source is under its MIT License; preserve its copyright notice.
