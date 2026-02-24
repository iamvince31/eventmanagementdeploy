<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\DefaultEvent;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if base events for February are missing
        $registrationPeriodBase = DefaultEvent::where('name', 'Registration Period')
            ->where('month', 2)
            ->whereNull('school_year')
            ->first();
            
        $lastDayAddingBase = DefaultEvent::where('name', 'Last Day of Adding/Changing Subjects')
            ->where('month', 2)
            ->whereNull('school_year')
            ->first();
        
        // Restore Registration Period base event if missing
        if (!$registrationPeriodBase) {
            DefaultEvent::create([
                'name' => 'Registration Period',
                'month' => 2,
                'order' => 1,
                'date' => null,
                'school_year' => null,
            ]);
            echo "Restored base event: Registration Period (February)\n";
        }
        
        // Restore Last Day of Adding/Changing Subjects base event if missing
        if (!$lastDayAddingBase) {
            DefaultEvent::create([
                'name' => 'Last Day of Adding/Changing Subjects',
                'month' => 2,
                'order' => 3,
                'date' => null,
                'school_year' => null,
            ]);
            echo "Restored base event: Last Day of Adding/Changing Subjects (February)\n";
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove the restored base events
        DefaultEvent::where('name', 'Registration Period')
            ->where('month', 2)
            ->whereNull('school_year')
            ->delete();
            
        DefaultEvent::where('name', 'Last Day of Adding/Changing Subjects')
            ->where('month', 2)
            ->whereNull('school_year')
            ->delete();
    }
};
