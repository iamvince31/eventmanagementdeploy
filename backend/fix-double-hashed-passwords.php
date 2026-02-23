<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\DB;

echo "=== Fix Double-Hashed Passwords ===\n\n";
echo "WARNING: This will reset all user passwords to a temporary password.\n";
echo "Users will need to use the 'Forgot Password' feature to reset their passwords.\n\n";

$tempPassword = 'TempPass123!'; // Temporary password for all users

$users = User::all();
echo "Found {$users->count()} users.\n\n";

if ($users->count() === 0) {
    echo "No users to fix.\n";
    exit;
}

echo "Do you want to continue? This will set all passwords to: {$tempPassword}\n";
echo "Type 'yes' to continue: ";
$handle = fopen("php://stdin", "r");
$line = fgets($handle);
fclose($handle);

if (trim($line) !== 'yes') {
    echo "Aborted.\n";
    exit;
}

echo "\nResetting passwords...\n";

foreach ($users as $user) {
    // Directly update the database to avoid the model cast
    DB::table('users')
        ->where('id', $user->id)
        ->update(['password' => bcrypt($tempPassword)]);
    
    echo "✓ Reset password for: {$user->email}\n";
}

echo "\n✅ All passwords have been reset to: {$tempPassword}\n";
echo "Users should use 'Forgot Password' to set their own passwords.\n";
