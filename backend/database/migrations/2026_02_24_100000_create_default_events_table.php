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
        Schema::create('default_events', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->tinyInteger('month'); // 1-12
            $table->integer('order')->default(0);
            $table->timestamps();
            
            // Index for query performance when filtering by month and ordering
            $table->index(['month', 'order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('default_events');
    }
};
