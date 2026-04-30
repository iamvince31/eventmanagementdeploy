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
        $mapping = [
            'Department of Agricultural and Food Engineering' => 'Department of Agriculture and Food Engineering',
            'Department of Civil and Environmental Engineering and Energy' => 'Department of Civil Engineering',
            'Department of Computer Engineering and Architecture' => 'Department of Computer, Electronics, and Electrical Engineering',
            'Department of Industrial and Electrical Technology' => 'Department of Industrial Engineering and Technology',
            'Department of Computer and Electronics Engineering' => 'Department of Computer, Electronics, and Electrical Engineering',
        ];

        foreach ($mapping as $old => $new) {
            DB::table('users')
                ->where('department', $old)
                ->update(['department' => $new]);
        }
    }

    public function down(): void
    {
        $mapping = [
            'Department of Agriculture and Food Engineering' => 'Department of Agricultural and Food Engineering',
            'Department of Civil Engineering' => 'Department of Civil and Environmental Engineering and Energy',
            'Department of Computer, Electronics, and Electrical Engineering' => 'Department of Computer Engineering and Architecture',
            'Department of Industrial Engineering and Technology' => 'Department of Industrial and Electrical Technology',
        ];

        foreach ($mapping as $new => $old) {
            DB::table('users')
                ->where('department', $new)
                ->update(['department' => $old]);
        }
    }
};
