<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('event_approvers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_approval_id')->constrained('event_approvals')->onDelete('cascade');
            $table->foreignId('approver_id')->constrained('users')->onDelete('cascade');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('decision_reason')->nullable();
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();
            
            // Ensure unique combination of approval and approver
            $table->unique(['event_approval_id', 'approver_id'], 'unique_approval_approver');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_approvers');
    }
};