<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\User;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Ensure all admin users are validated and have schedule initialized
        User::where('role', 'Admin')
            ->update([
                'is_validated' => true,
                'schedule_initialized' => true
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration is not reversible as it's a data fix
    }
};