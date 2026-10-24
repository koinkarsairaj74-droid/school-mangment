#!/usr/bin/env bash
set -euo pipefail
python -m pip install -r requirements.txt
python manage.py check --deploy
# Intentional fail-safe: deployment must fail if there are unapplied model changes.
# Never invent or silently write migrations on a live environment.
python manage.py makemigrations schools --check --dry-run
python manage.py collectstatic --noinput
