#!/usr/bin/env bash
# Render.com build script — runs on every deploy
set -e

echo "==> Installing Composer dependencies..."
composer install --no-dev --optimize-autoloader

echo "==> Running database migrations..."
php artisan migrate --force

echo "==> Seeding database (if needed)..."
# Only seed if this is a fresh database or if FORCE_SEED is set
if [ "$FORCE_SEED" = "true" ]; then
    echo "    FORCE_SEED is enabled - running all seeders..."
    php artisan db:seed --force
elif [ "$SEED_ON_DEPLOY" = "true" ]; then
    echo "    SEED_ON_DEPLOY is enabled - running seeders..."
    php artisan db:seed --force
else
    echo "    Checking if database needs seeding..."
    # Check if admin exists, if not, seed
    ADMIN_COUNT=$(php artisan tinker --execute="echo App\Models\User::where('designation', 'Admin')->count();")
    if [ "$ADMIN_COUNT" = "0" ]; then
        echo "    No admin found - seeding database..."
        php artisan db:seed --force
    else
        echo "    Database already seeded - skipping"
    fi
fi

echo "==> Clearing and caching routes and views (NOT config — CORS patterns need runtime evaluation)..."
php artisan config:clear
php artisan route:cache
php artisan view:cache

echo "==> Creating storage symlink..."
php artisan storage:link

echo "==> Build complete!"
