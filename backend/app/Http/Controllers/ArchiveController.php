<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;

class ArchiveController extends Controller
{
    /**
     * Get all archived events.
     * Only accessible by Admin.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'Admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $archivedEvents = Event::with(['host', 'members', 'images'])
            ->where('is_archived', true)
            ->orderBy('date', 'desc')
            ->get();

        $transformedEvents = $archivedEvents->map(function ($event) {
            return [
            'id' => $event->id,
            'title' => $event->title,
            'description' => $event->description,
            'location' => $event->location,
            'event_type' => $event->event_type ?? 'event',
            'images' => $event->images->map(fn($img) => [
            'url' => $img->cloudinary_url
                ?? (rtrim(config('filesystems.disks.supabase.public_url'), '/') . '/' . config('filesystems.disks.supabase.bucket') . '/' . $img->image_path),
            'original_filename' => $img->original_filename,
            ]),
            'date' => $event->date,
            'time' => $event->time,
            'school_year' => $event->school_year,
            'host' => [
            'id' => $event->host->id,
            'username' => $event->host->name,
            'email' => $event->host->email,
            ],
            'is_default_event' => false,
            'is_archived' => true,
            ];
        });

        return response()->json([
            'events' => $transformedEvents,
        ]);
    }

    /**
     * Archive past events.
     * Accessible by Admin.
     */
    public function archivePastEvents(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'Admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Find all events that are not yet archived, their date is in the past,
        // and they are NOT from the current year.
        $today = new \DateTime();
        $today->setTime(0, 0, 0);
        $currentYear = $today->format('Y');

        $eventsToArchive = Event::where('is_archived', false)
            ->where('date', '<', $today->format('Y-m-d'))
            ->whereYear('date', '<', $currentYear)
            ->get();

        $count = 0;
        foreach ($eventsToArchive as $event) {
            $event->is_archived = true;
            $event->save();
            $count++;
        }

        return response()->json([
            'message' => "Successfully archived {$count} past events.",
            'archived_count' => $count
        ]);
    }
}
