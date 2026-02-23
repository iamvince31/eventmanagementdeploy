<?php

/**
 * Check the status of class schedule data
 * Run this with: php check-schedule-status.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\UserSchedule;
use Illuminate\Support\Facades\Schema;

echo "🔍 Checking Class Schedule Status...\n\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

// Check if tables exist
echo "📊 Database Tables:\n";
echo "  - users table: " . (Schema::hasTable('users') ? '✅ EXISTS' : '❌ MISSING') . "\n";
echo "  - user_schedules table: " . (Schema::hasTable('user_schedules') ? '✅ EXISTS' : '❌ MISSING') . "\n";
echo "\n";

if (!Schema::hasTable('user_schedules')) {
    echo "❌ ERROR: user_schedules table is missing!\n";
    echo "   Run: php artisan migrate\n\n";
    exit(1);
}

// Check data
echo "📈 Data Status:\n";

$totalUsers = User::count();
$usersWithSchedule = User::where('schedule_initialized', true)->count();
$totalSchedules = UserSchedule::count();

echo "  - Total Users: {$totalUsers}\n";
echo "  - Users with schedule_initialized flag: {$usersWithSchedule}\n";
echo "  - Total Schedule Records: {$totalSchedules}\n";
echo "\n";

// Analyze the situation
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

if ($totalSchedules === 0 && $usersWithSchedule === 0) {
    echo "📝 Status: NO SCHEDULES FOUND\n\n";
    echo "This means:\n";
    echo "  • No users have set up their class schedules yet\n";
    echo "  • OR schedule data was lost (database reset)\n\n";
    
    echo "What to do:\n";
    echo "  1. Check if there's a database backup\n";
    echo "  2. If no backup, users need to re-enter schedules\n";
    echo "  3. Schedule system is functional - just needs data\n\n";
    
} elseif ($totalSchedules === 0 && $usersWithSchedule > 0) {
    echo "⚠️  Status: INCONSISTENT STATE\n\n";
    echo "This means:\n";
    echo "  • {$usersWithSchedule} users have schedule_initialized = true\n";
    echo "  • But no schedule records exist in user_schedules table\n";
    echo "  • Schedule data was likely deleted\n\n";
    
    echo "What to do:\n";
    echo "  1. Reset the schedule_initialized flags:\n";
    echo "     php artisan tinker\n";
    echo "     \\App\\Models\\User::where('schedule_initialized', true)->update(['schedule_initialized' => false]);\n";
    echo "     exit\n\n";
    echo "  2. Users will be prompted to set schedules again\n\n";
    
} elseif ($totalSchedules > 0 && $usersWithSchedule === 0) {
    echo "⚠️  Status: FLAG MISMATCH\n\n";
    echo "This means:\n";
    echo "  • Schedule records exist ({$totalSchedules} records)\n";
    echo "  • But no users have schedule_initialized flag set\n";
    echo "  • Flags need to be updated\n\n";
    
    echo "What to do:\n";
    echo "  1. Update the flags based on existing schedules:\n";
    echo "     php artisan tinker\n";
    echo "     \$userIds = \\App\\Models\\UserSchedule::distinct('user_id')->pluck('user_id');\n";
    echo "     \\App\\Models\\User::whereIn('id', \$userIds)->update(['schedule_initialized' => true]);\n";
    echo "     exit\n\n";
    
} else {
    echo "✅ Status: SCHEDULES EXIST\n\n";
    echo "Schedule data is present:\n";
    echo "  • {$usersWithSchedule} users have schedules\n";
    echo "  • {$totalSchedules} schedule records in database\n\n";
    
    // Show schedule breakdown by user
    echo "Schedule breakdown:\n";
    $schedulesByUser = UserSchedule::selectRaw('user_id, COUNT(*) as count')
        ->groupBy('user_id')
        ->get();
    
    foreach ($schedulesByUser as $schedule) {
        $user = User::find($schedule->user_id);
        $username = $user ? $user->name : "Unknown User";
        echo "  • {$username}: {$schedule->count} schedule entries\n";
    }
    echo "\n";
    
    echo "✅ Everything looks good!\n\n";
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

// Check for backups
echo "💾 Backup Check:\n";
$backupDirs = ['backups', 'database/backups', '../backups'];
$foundBackups = false;

foreach ($backupDirs as $dir) {
    if (is_dir($dir)) {
        $files = glob($dir . '/*.sql');
        if (!empty($files)) {
            $foundBackups = true;
            echo "  Found backups in {$dir}:\n";
            foreach ($files as $file) {
                $size = filesize($file);
                $date = date('Y-m-d H:i:s', filemtime($file));
                echo "    • " . basename($file) . " ({$size} bytes, {$date})\n";
            }
        }
    }
}

if (!$foundBackups) {
    echo "  ⚠️  No backups found\n";
    echo "  Consider creating backups regularly:\n";
    echo "    mysqldump -u root -p event_management > backup.sql\n";
}

echo "\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "✅ Check complete!\n";
