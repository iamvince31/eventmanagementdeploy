#!/usr/bin/env bash
# Render.com build script — runs on every deploy
set -e

echo "==> Installing Composer dependencies..."
composer install --no-dev --optimize-autoloader

echo "==> Running database migrations..."
php artisan migrate --force

echo "==> Clearing and caching routes and views (NOT config — CORS patterns need runtime evaluation)..."
php artisan config:clear
php artisan route:cache
php artisan view:cache

echo "==> Creating storage symlink..."
php artisan storage:link

echo "==> Build complete!"
