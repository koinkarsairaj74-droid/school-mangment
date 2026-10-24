# Campus ERP — multi-school backend foundation

**Status:** Backend source foundation only. Not deployed, not audited, not yet client-ready.

An original school ERP implementation informed by typical Eduplus Campus–style workflows, **not** a copy of another vendor's source code, brand, or interface.

## Purpose
Run multiple client schools from one application, without mixing their data:
- A School owns its users, classes, students, timetables, marks, payments and attendance.
- Role-based users: platform admin, school admin, teacher, parent and student.
- Teachers access only assigned class rosters.
- Parents access only linked children; never the entire school register.
- Every API lookup includes school scoping, never just a client-supplied school ID.

## Local development
Requires Python 3.11+ and a database. In `campus_erp/`:

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
export DJANGO_SECRET_KEY="$(python -c 'import secrets; print(secrets.token_urlsafe(48))')"
export DJANGO_DEBUG=true
export DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
python manage.py makemigrations schools
python manage.py migrate
python manage.py createsuperuser
python manage.py test schools
python manage.py runserver
```

**Do not commit** your local `dev.sqlite3`, passwords, `.env` secrets or uploads.

## Before putting school data into production
- Provision a PostgreSQL database, HTTPS, encrypted backups, secure session controls and a production secret.
- The platform operator Django admin has a superuser-only, role-checked gate. The custom user manager now assigns the `platform_admin` role and an empty school to newly created superusers, so `python manage.py createsuperuser` can create a usable operator account. Build a secure first-party client onboarding workflow and role-specific school administration interface before launch.
- Add reviewed Django migrations to version control before deploying. The GitHub Actions development workflow provisionally generates migrations before the test suite; that is not a substitute for reviewed release migrations. The application is not yet launchable with `migrate` alone.
- Enforce tenant scoping on **every new endpoint**, admin action, background job and file access. The vanilla Django admin registered here is **not multi-tenant safe** for client staff. Keep /django-admin/ restricted to trusted platform operators until tenant-aware admin controls are built.
- Implement billing, invoice issuance, signed payment-gateway webhooks, audit logs and refunds before enabling real payments.
- Add test coverage for each school/user role, user input validation, timetable overlaps, transaction handling and concurrency.
- Obtain client approval, publish a privacy policy, perform security testing, assess applicable Indian student-data/privacy requirements, and review authorization at launch.

## Current API endpoints
- `GET /health/`
- `GET /api/v1/me/`
- `GET /api/v1/schools/`
- `GET/POST /api/v1/students/` (only school admin can POST)
- `GET/POST /api/v1/attendance/` (only assigned teachers can POST)
- `GET /api/v1/fee-receipts/` (school admin or linked parent)

Authentication uses Django sessions, password hashing and CSRF protection. Basic original templates now provide `/login/`, `/logout/` (POST), and a school-branded `/` dashboard. The dashboard currently links to JSON API views rather than full editable screens. School onboarding, client billing, full timetable/student/fee UI, report generation, verified migrations and actual production hosting remain to be built. Do not use the old GitHub Pages demo as a login gateway for this backend.
