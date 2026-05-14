<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update all existing Dean-created events to have 'accepted' status for all members
        DB::statement("
            UPDATE event_user 
            SET status = 'accepted' 
            WHERE event_id IN (
                SELECT e.id 
                FROM events e 
                INNER JOIN users u ON e.host_id = u.id 
                WHERE u.designation = 'Dean' OR JSON_CONTAINS(u.designations, '\"Dean\"')
            )
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration is not reversible as we don't know the original status
        // If needed, you would need to manually restore the original statuses
    }
};