<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop approved_request_id from events table if it exists
        if (Schema::hasColumn('events', 'approved_request_id')) {
            Schema::table('events', function (Blueprint $table) {
                $table->dropColumn('approved_request_id');
            });
        }

        // Drop event_requests table if it exists
        Schema::dropIfExists('event_requests');
    }

    public function down(): void
    {
        // Recreate event_requests table (minimal schema for rollback)
        Schema::create('event_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('location')->nullable();
            $table->date('date');
            $table->time('time');
            $table->string('status')->default('pending');
            $table->timestamps();
        });

        Schema::table('events', function (Blueprint $table) {
            $table->unsignedBigInteger('approved_request_id')->nullable();
        });
    }
};
