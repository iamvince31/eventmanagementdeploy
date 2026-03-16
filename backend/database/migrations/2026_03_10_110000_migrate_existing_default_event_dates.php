<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Migrate existing date data from default_events table (where school_year is set)
     * to the new default_event_dates table.
     */
    public function up(): void
    {
        // Get all default events that have school_year set (these are the dated versions)
        $schoolYearEvents = DB::table('default_events')
            ->whereNotNull('school_year')
            ->whereNotNull('date')
            ->get();

        foreach ($schoolYearEvents as $event) {
            // Find the corresponding base event (same name and original month, no school_year)
            $baseEvent = DB::table('default_events')
                ->whereNull('school_year')
                ->where('name', $event->name)
                ->first();

            if ($baseEvent) {
                // Create entry in default_event_dates table
                DB::table('default_event_dates')->insert([
                    'default_event_id' => $baseEvent->id,
                    'school_year' => $event->school_year,
                    'date' => $event->date,
                    'end_date' => $event->end_date,
                    'month' => $event->month,
                    'created_by' => null, // We don't have this info in old structure
                    'created_at' => $event->created_at ?? now(),
                    'updated_at' => $event->updated_at ?? now(),
                ]);

                echo "Migrated: {$event->name} for {$event->school_year}\n";
            } else {
                echo "Warning: No base event found for {$event->name}\n";
            }
        }

        echo "Migration complete. Migrated " . count($schoolYearEvents) . " event dates.\n";
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Clear the default_event_dates table
        DB::table('default_event_dates')->truncate();
        
        echo "Rolled back: Cleared default_event_dates table.\n";
    }
};
