<?php

/**
 * Reset schedule_initialized flags for all users
 * This will prompt users to re-enter their schedules
 * Run this with: php reset-schedule-flags.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

echo "🔄 Resetting Schedule Flags...\n\n";

$usersWithFlag = User::where('schedule_initialized', true)->count();

if ($usersWithFlag === 0) {
    echo "✅ No users have schedule_initialized flag set.\n";
    echo "   Nothing to reset.\n";
    exit(0);
}

echo "Found {$usersWithFlag} users with schedule_initialized = true\n";
echo "This will reset their flags and prompt them to re-enter schedules.\n\n";

echo "Resetting flags...\n";

$updated = User::where('schedule_initialized', true)
    ->update(['schedule_initialized' => false]);

echo "\n✅ Successfully reset {$updated} user flags!\n\n";
echo "Users will now be prompted to set their class schedules again.\n";
