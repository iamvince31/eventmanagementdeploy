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

echo "=== Adding Test File to Event ===\n\n";

// Find the first event
$event = Event::with('host')->first();

if (!$event) {
    echo "No events found. Please create an event first.\n";
    exit;
}

echo "Found event: {$event->title}\n";
echo "Host: {$event->host->name}\n";
echo "Date: {$event->date} at {$event->time}\n\n";

// Create a test file entry (simulating an uploaded file)
$testImage = new EventImage();
$testImage->event_id = $event->id;
$testImage->image_path = 'event_files/test_document.pdf'; // Simulated path
$testImage->original_filename = 'Test Document.pdf';
$testImage->order = 1;
$testImage->save();

echo "✓ Added test file: Test Document.pdf\n";

// Show the event with files
$eventWithFiles = Event::with(['images', 'host'])->find($event->id);
echo "\nEvent now has " . $eventWithFiles->images->count() . " file(s):\n";

foreach ($eventWithFiles->images as $image) {
    echo "  - {$image->original_filename} ({$image->image_path})\n";
}

// Show API format
echo "\n=== API Response Format ===\n";
$apiFormat = [
    'id' => $eventWithFiles->id,
    'title' => $eventWithFiles->title,
    'images' => $eventWithFiles->images->map(fn($img) => [
        'url' => asset('storage/' . $img->image_path),
        'original_filename' => $img->original_filename,
    ]),
];

echo json_encode($apiFormat, JSON_PRETTY_PRINT) . "\n";

echo "\n✓ Test file added successfully!\n";
echo "Now check the event modal in the frontend to see if the file appears.\n";