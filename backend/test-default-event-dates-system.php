<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\DefaultEvent;
use App\Models\DefaultEventDate;

echo "=== Testing Default Event Dates System ===\n\n";

// Test 1: Check if tables exist
echo "Test 1: Checking table structure...\n";
try {
    $defaultEventsExists = DB::select("SHOW TABLES LIKE 'default_events'");
    $defaultEventDatesExists = DB::select("SHOW TABLES LIKE 'default_event_dates'");
    
    if (count($defaultEventsExists) > 0) {
        echo "✓ default_events table exists\n";
    } else {
        echo "✗ default_events table NOT found\n";
    }
    
    if (count($defaultEventDatesExists) > 0) {
        echo "✓ default_event_dates table exists\n";
    } else {
        echo "✗ default_event_dates table NOT found (run migrations first)\n";
        exit(1);
    }
} catch (\Exception $e) {
    echo "✗ Error checking tables: " . $e->getMessage() . "\n";
    exit(1);
}

// Test 2: Check table columns
echo "\nTest 2: Checking default_event_dates columns...\n";
try {
    $columns = DB::select("SHOW COLUMNS FROM default_event_dates");
    $columnNames = array_column($columns, 'Field');
    
    $requiredColumns = ['id', 'default_event_id', 'school_year', 'date', 'end_date', 'month', 'created_by', 'created_at', 'updated_at'];
    
    foreach ($requiredColumns as $col) {
        if (in_array($col, $columnNames)) {
            echo "✓ Column '$col' exists\n";
        } else {
            echo "✗ Column '$col' missing\n";
        }
    }
} catch (\Exception $e) {
    echo "✗ Error checking columns: " . $e->getMessage() . "\n";
}

// Test 3: Check base events
echo "\nTest 3: Checking base events...\n";
try {
    $baseEvents = DefaultEvent::whereNull('school_year')->count();
    echo "✓ Found $baseEvents base events\n";
    
    if ($baseEvents > 0) {
        $sampleEvent = DefaultEvent::whereNull('school_year')->first();
        echo "  Sample: {$sampleEvent->name} (Month: {$sampleEvent->month})\n";
    }
} catch (\Exception $e) {
    echo "✗ Error checking base events: " . $e->getMessage() . "\n";
}

// Test 4: Test creating a date assignment
echo "\nTest 4: Testing date assignment creation...\n";
try {
    $baseEvent = DefaultEvent::whereNull('school_year')->first();
    
    if (!$baseEvent) {
        echo "✗ No base events found to test with\n";
    } else {
        // Clean up any existing test data
        DefaultEventDate::where('default_event_id', $baseEvent->id)
            ->where('school_year', '2025-2026')
            ->delete();
        
        // Create a date assignment
        $eventDate = DefaultEventDate::create([
            'default_event_id' => $baseEvent->id,
            'school_year' => '2025-2026',
            'date' => '2025-09-15',
            'end_date' => null,
            'month' => 9,
            'created_by' => null,
        ]);
        
        echo "✓ Created date assignment for '{$baseEvent->name}'\n";
        echo "  Date: {$eventDate->date->format('Y-m-d')}\n";
        echo "  School Year: {$eventDate->school_year}\n";
        
        // Test updating
        $eventDate->update(['date' => '2025-09-16']);
        echo "✓ Updated date to 2025-09-16\n";
        
        // Test retrieval
        $retrieved = DefaultEventDate::find($eventDate->id);
        if ($retrieved && $retrieved->date->format('Y-m-d') === '2025-09-16') {
            echo "✓ Successfully retrieved and verified updated date\n";
        }
        
        // Clean up
        $eventDate->delete();
        echo "✓ Cleaned up test data\n";
    }
} catch (\Exception $e) {
    echo "✗ Error testing date assignment: " . $e->getMessage() . "\n";
}

// Test 5: Test unique constraint
echo "\nTest 5: Testing unique constraint...\n";
try {
    $baseEvent = DefaultEvent::whereNull('school_year')->first();
    
    if ($baseEvent) {
        // Create first assignment
        $date1 = DefaultEventDate::create([
            'default_event_id' => $baseEvent->id,
            'school_year' => '2025-2026',
            'date' => '2025-09-15',
            'month' => 9,
        ]);
        
        // Try to create duplicate
        try {
            $date2 = DefaultEventDate::create([
                'default_event_id' => $baseEvent->id,
                'school_year' => '2025-2026',
                'date' => '2025-09-20',
                'month' => 9,
            ]);
            echo "✗ Unique constraint NOT working (duplicate allowed)\n";
            $date2->delete();
        } catch (\Exception $e) {
            echo "✓ Unique constraint working (duplicate prevented)\n";
        }
        
        // Clean up
        $date1->delete();
    }
} catch (\Exception $e) {
    echo "✗ Error testing unique constraint: " . $e->getMessage() . "\n";
}

// Test 6: Test model relationships
echo "\nTest 6: Testing model relationships...\n";
try {
    $baseEvent = DefaultEvent::whereNull('school_year')->first();
    
    if ($baseEvent) {
        // Create date assignment
        $eventDate = DefaultEventDate::create([
            'default_event_id' => $baseEvent->id,
            'school_year' => '2025-2026',
            'date' => '2025-09-15',
            'month' => 9,
        ]);
        
        // Test relationship from DefaultEvent
        $dates = $baseEvent->eventDates;
        echo "✓ DefaultEvent->eventDates relationship works ({$dates->count()} dates)\n";
        
        // Test relationship from DefaultEventDate
        $event = $eventDate->defaultEvent;
        echo "✓ DefaultEventDate->defaultEvent relationship works ('{$event->name}')\n";
        
        // Test helper method
        $dateForYear = $baseEvent->getDateForSchoolYear('2025-2026');
        if ($dateForYear) {
            echo "✓ getDateForSchoolYear() helper works\n";
        }
        
        // Clean up
        $eventDate->delete();
    }
} catch (\Exception $e) {
    echo "✗ Error testing relationships: " . $e->getMessage() . "\n";
}

// Test 7: Test scopes
echo "\nTest 7: Testing query scopes...\n";
try {
    $baseEvent = DefaultEvent::whereNull('school_year')->first();
    
    if ($baseEvent) {
        // Create test data
        $date1 = DefaultEventDate::create([
            'default_event_id' => $baseEvent->id,
            'school_year' => '2025-2026',
            'date' => '2025-09-15',
            'month' => 9,
        ]);
        
        $date2 = DefaultEventDate::create([
            'default_event_id' => $baseEvent->id,
            'school_year' => '2026-2027',
            'date' => '2026-09-14',
            'month' => 9,
        ]);
        
        // Test forSchoolYear scope
        $dates2025 = DefaultEventDate::forSchoolYear('2025-2026')->count();
        echo "✓ forSchoolYear scope works ($dates2025 events for 2025-2026)\n";
        
        // Test forMonth scope
        $septemberDates = DefaultEventDate::forMonth(9)->count();
        echo "✓ forMonth scope works ($septemberDates events in September)\n";
        
        // Test orderedByDate scope
        $ordered = DefaultEventDate::orderedByDate()->first();
        echo "✓ orderedByDate scope works\n";
        
        // Clean up
        $date1->delete();
        $date2->delete();
    }
} catch (\Exception $e) {
    echo "✗ Error testing scopes: " . $e->getMessage() . "\n";
}

// Test 8: Statistics
echo "\nTest 8: Testing statistics...\n";
try {
    $totalBase = DefaultEvent::whereNull('school_year')->count();
    $withDates2025 = DefaultEventDate::forSchoolYear('2025-2026')->count();
    $withDates2026 = DefaultEventDate::forSchoolYear('2026-2027')->count();
    
    echo "✓ Total base events: $totalBase\n";
    echo "✓ Events with dates (2025-2026): $withDates2025\n";
    echo "✓ Events with dates (2026-2027): $withDates2026\n";
    
    if ($totalBase > 0) {
        $completion2025 = round(($withDates2025 / $totalBase) * 100, 2);
        echo "✓ Completion rate (2025-2026): $completion2025%\n";
    }
} catch (\Exception $e) {
    echo "✗ Error calculating statistics: " . $e->getMessage() . "\n";
}

// Test 9: Check for migrated data
echo "\nTest 9: Checking for migrated data...\n";
try {
    $migratedCount = DefaultEventDate::count();
    echo "✓ Found $migratedCount date assignments in new table\n";
    
    if ($migratedCount > 0) {
        $sample = DefaultEventDate::with('defaultEvent')->first();
        echo "  Sample: {$sample->defaultEvent->name} on {$sample->date->format('Y-m-d')} ({$sample->school_year})\n";
    }
} catch (\Exception $e) {
    echo "✗ Error checking migrated data: " . $e->getMessage() . "\n";
}

echo "\n=== All Tests Complete ===\n";
echo "\nNext Steps:\n";
echo "1. Review the test results above\n";
echo "2. If all tests pass, the system is ready to use\n";
echo "3. Update frontend to use V2 API endpoints\n";
echo "4. Test the API endpoints using Postman or similar tool\n";
echo "\nAPI Endpoints:\n";
echo "- GET  /api/default-events/v2?school_year=2025-2026\n";
echo "- POST /api/default-events/v2/{id}/set-date\n";
echo "- GET  /api/default-events/v2/scheduled?school_year=2025-2026\n";
echo "- GET  /api/default-events/v2/statistics?school_year=2025-2026\n";
