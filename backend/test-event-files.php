<?php

require_once 'vendor/autoload.php';

// Load environment
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Event;
use App\Models\EventImage;

echo "=== Testing Event Files ===\n\n";

// Get all events with images
$eventsWithImages = Event::with(['images', 'host'])->whereHas('images')->get();

echo "Found " . $eventsWithImages->count() . " events with files:\n\n";

foreach ($eventsWithImages as $event) {
    echo "Event: {$event->title}\n";
    echo "Host: {$event->host->name}\n";
    echo "Date: {$event->date} at {$event->time}\n";
    echo "Files:\n";
    
    foreach ($event->images as $image) {
        echo "  - {$image->original_filename} ({$image->image_path})\n";
        
        // Check if file exists
        $fullPath = storage_path('app/public/' . $image->image_path);
        if (file_exists($fullPath)) {
            $size = filesize($fullPath);
            echo "    ✓ File exists (" . number_format($size / 1024, 2) . " KB)\n";
        } else {
            echo "    ✗ File missing!\n";
        }
    }
    echo "\n";
}

// Test the API response format
echo "=== API Response Format Test ===\n";
if ($eventsWithImages->count() > 0) {
    $testEvent = $eventsWithImages->first();
    $apiFormat = [
        'id' => $testEvent->id,
        'title' => $testEvent->title,
        'images' => $testEvent->images->map(fn($img) => [
            'url' => asset('storage/' . $img->image_path),
            'original_filename' => $img->original_filename,
        ]),
    ];
    
    echo "Sample API response:\n";
    echo json_encode($apiFormat, JSON_PRETTY_PRINT) . "\n";
}

echo "\n=== Summary ===\n";
echo "Total events: " . Event::count() . "\n";
echo "Events with files: " . $eventsWithImages->count() . "\n";
echo "Total files: " . EventImage::count() . "\n";