<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Deterministic Color Assignment ===\n\n";

// Color palette (same as in ScheduleController)
$colorPalette = [
    '#10b981', // Green
    '#3b82f6', // Blue
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#14b8a6', // Teal
    '#6366f1', // Indigo
];

// Sample schedule with repeated classes
$sampleSchedule = [
    'Monday' => [
        ['description' => 'Data Structures', 'time' => '8:00-9:30'],
        ['description' => 'Web Development', 'time' => '10:00-11:30'],
        ['description' => 'Database Systems', 'time' => '1:00-2:30'],
    ],
    'Tuesday' => [
        ['description' => 'Data Structures', 'time' => '8:00-9:30'],  // Same as Monday
        ['description' => 'Software Engineering', 'time' => '2:00-3:30'],
    ],
    'Wednesday' => [
        ['description' => 'Web Development', 'time' => '10:00-11:30'], // Same as Monday
        ['description' => 'Database Systems', 'time' => '1:00-2:30'],  // Same as Monday
        ['description' => 'Operating Systems', 'time' => '3:00-4:30'],
    ],
];

// Simulate the color assignment logic
$classColorMap = [];
$colorIndex = 0;

echo "Simulating color assignment based on class description:\n";
echo str_repeat("=", 80) . "\n\n";

foreach ($sampleSchedule as $day => $classes) {
    echo "📅 $day:\n";
    echo str_repeat("-", 80) . "\n";
    
    foreach ($classes as $class) {
        $description = $class['description'];
        $normalizedDescription = strtolower(trim($description));
        
        // Assign color based on description (same description = same color)
        if (!isset($classColorMap[$normalizedDescription])) {
            $classColorMap[$normalizedDescription] = $colorPalette[$colorIndex % count($colorPalette)];
            $colorIndex++;
            $isNew = " [NEW COLOR ASSIGNED]";
        } else {
            $isNew = " [REUSING EXISTING COLOR]";
        }
        
        $color = $classColorMap[$normalizedDescription];
        
        printf(
            "  %-30s %-15s %s%s\n",
            $description,
            $class['time'],
            $color,
            $isNew
        );
    }
    echo "\n";
}

echo str_repeat("=", 80) . "\n";
echo "\n📊 Color Assignment Summary:\n";
echo str_repeat("-", 80) . "\n";

$colorNames = [
    '#10b981' => 'Green',
    '#3b82f6' => 'Blue',
    '#f59e0b' => 'Amber',
    '#ef4444' => 'Red',
    '#8b5cf6' => 'Purple',
    '#ec4899' => 'Pink',
    '#06b6d4' => 'Cyan',
    '#f97316' => 'Orange',
    '#14b8a6' => 'Teal',
    '#6366f1' => 'Indigo',
];

foreach ($classColorMap as $description => $color) {
    $colorName = $colorNames[$color] ?? 'Unknown';
    printf("%-30s → %s (%s)\n", ucfirst($description), $color, $colorName);
}

echo "\n" . str_repeat("=", 80) . "\n";
echo "\n✅ Key Points:\n";
echo "  • Same class description = Same color across all days\n";
echo "  • 'Data Structures' appears on Monday & Tuesday → Same color\n";
echo "  • 'Web Development' appears on Monday & Wednesday → Same color\n";
echo "  • 'Database Systems' appears on Monday & Wednesday → Same color\n";
echo "  • Each unique class gets a unique color from the palette\n";
echo "  • Colors are assigned in order of first appearance\n";

echo "\n=== Test Complete ===\n";
