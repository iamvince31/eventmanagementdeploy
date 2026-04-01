<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\DefaultEvent;
use App\Models\User;
use App\Models\UserSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    /**
     * Determine the current semester based on the date
     */
    private function getCurrentSemester(\DateTime $date): ?string
    {
        $month = (int)$date->format('m');

        if ($month >= 9 || $month <= 1)
            return 'first';
        if ($month >= 2 && $month <= 6)
            return 'second';
        if ($month >= 7 && $month <= 8)
            return 'midyear';

        return null;
    }

    /**
     * Get all dashboard data in a single optimized request
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // School year calculation
        $now = new \DateTime();
        $currentYear = (int)$now->format('Y');
        $currentMonth = (int)$now->format('m');

        $schoolYear = $currentMonth >= 9
            ? "{$currentYear}-" . ($currentYear + 1)
            : ($currentYear - 1) . "-{$currentYear}";

        $nextSchoolYear = $currentMonth >= 9
            ? ($currentYear + 1) . "-" . ($currentYear + 2)
            : "{$currentYear}-" . ($currentYear + 1);

        // ── Events hosted by the user ──────────────────────────────────────
        $events = Event::with([
            'host:id,name,email',
            'members:id,name,email',
            'images:id,event_id,image_path,original_filename,order',
        ])
            ->where('host_id', $user->id)
            ->where('date', '>=', now()->subMonths(3)->format('Y-m-d')) // Only last 3 months
            ->orderBy('date', 'desc')
            ->orderBy('time', 'desc')
            ->limit(100)
            ->get();

        // ── Events where the user is a member (non-personal only) ──────────
        $memberEvents = Event::with([
            'host:id,name,email',
            'members:id,name,email',
            'images:id,event_id,image_path,original_filename,order',
        ])
            ->whereHas('members', fn($q) => $q->where('users.id', $user->id))
            ->where('is_personal', false)
            ->where('date', '>=', now()->subMonths(3)->format('Y-m-d'))
            ->orderBy('date', 'desc')
            ->orderBy('time', 'desc')
            ->limit(100)
            ->get();

        $allEvents = $events->merge($memberEvents)->unique('id');

        // ── Members list (cached) ──────────────────────────────────────────
        $members = Cache::remember('users_list', 600, function () {
            return User::select('id', 'name', 'email', 'role', 'department')
            ->where('is_validated', true)
            ->orderBy('name')
            ->limit(500)
            ->get();
        });

        // ── Default / academic events ──────────────────────────────────────
        // Query from DefaultEventDate table which stores dates per school year
        $defaultEventDates = \App\Models\DefaultEventDate::with('defaultEvent')
            ->whereIn('school_year', [$schoolYear, $nextSchoolYear])
            ->whereNotNull('date')
            ->orderBy('date')
            ->limit(100)
            ->get();
        
        // Also get legacy events from DefaultEvent table (for backward compatibility)
        $legacyDefaultEvents = DefaultEvent::whereNotNull('date')
            ->where(function ($q) use ($schoolYear, $nextSchoolYear) {
            $q->whereIn('school_year', [$schoolYear, $nextSchoolYear])
                ->orWhereNull('school_year');
        })
            ->orderBy('date')
            ->limit(100)
            ->get();

        // ── Transform regular events ───────────────────────────────────────
        $transformedEvents = $allEvents->map(function ($event) {
            $date = $event->date;
            if ($date instanceof \DateTime) {
                $date = $date->format('Y-m-d');
            }
            elseif (is_string($date) && strlen($date) > 10) {
                $date = substr($date, 0, 10);
            }

            return [
            'id' => $event->id,
            'title' => $event->title,
            'description' => $event->description,
            'location' => $event->location,
            'event_type' => $event->event_type ?? 'event',
            'images' => $event->images->map(fn($img) => [
            'url' => asset('storage/' . $img->image_path),
            'original_filename' => $img->original_filename,
            ]),
            'date' => $date,
            'time' => $event->time,
            'school_year' => $event->school_year,
            'host' => [
            'id' => $event->host->id,
            'username' => $event->host->name,
            'email' => $event->host->email,
            ],
            'members' => $event->members->map(fn($m) => [
            'id' => $m->id,
            'username' => $m->name,
            'email' => $m->email,
            'status' => $m->pivot->status,
            ]),
            'is_default_event' => false,
            'is_personal' => $event->is_personal ?? false,
            'personal_color' => $event->personal_color,
            ];
        });

        // ── Transform default events ───────────────────────────────────────
        $transformedDefaultEventDates = $defaultEventDates->map(function ($eventDate) {
            $date = $eventDate->date;
            if ($date instanceof \DateTime) {
                $date = $date->format('Y-m-d');
            } elseif (is_string($date) && strlen($date) > 10) {
                $date = substr($date, 0, 10);
            }
            $endDate = $eventDate->end_date;
            if ($endDate instanceof \DateTime) {
                $endDate = $endDate->format('Y-m-d');
            } elseif (is_string($endDate) && strlen($endDate) > 10) {
                $endDate = substr($endDate, 0, 10);
            }

            return [
                'id' => 'default-date-' . $eventDate->id,
                'name' => $eventDate->defaultEvent->name ?? 'Academic Event',
                'date' => $date,
                'end_date' => $endDate,
                'school_year' => $eventDate->school_year,
            ];
        });

        $transformedLegacyEvents = $legacyDefaultEvents->map(function ($event) {
            $date = $event->date;
            if ($date instanceof \DateTime) {
                $date = $date->format('Y-m-d');
            } elseif (is_string($date) && strlen($date) > 10) {
                $date = substr($date, 0, 10);
            }
            $endDate = $event->end_date;
            if ($endDate instanceof \DateTime) {
                $endDate = $endDate->format('Y-m-d');
            } elseif (is_string($endDate) && strlen($endDate) > 10) {
                $endDate = substr($endDate, 0, 10);
            }

            return [
                'id' => 'default-' . $event->id,
                'name' => $event->name,
                'date' => $date,
                'end_date' => $endDate,
                'school_year' => $event->school_year,
            ];
        });
        
        // Merge both collections
        $transformedDefaultEvents = $transformedDefaultEventDates->merge($transformedLegacyEvents);

        // ── User schedules (current + next school year) ────────────────────
        $currentSemester = $this->getCurrentSemester($now);

        $userSchedules = UserSchedule::where('user_id', $user->id)
            ->whereIn('school_year', [$schoolYear, $nextSchoolYear])
            ->select('id', 'day', 'start_time', 'end_time', 'description', 'color', 'semester', 'school_year')
            ->orderBy('semester')
            ->orderBy('day')
            ->orderBy('start_time')
            ->get();

        $transformedSchedules = $userSchedules->map(function ($schedule) use ($currentSemester) {
            $startTime = substr($schedule->start_time, 0, 5);
            $endTime = substr($schedule->end_time, 0, 5);

            return [
            'id' => 'schedule-' . $schedule->id,
            'title' => $schedule->description ?: 'Class',
            'description' => $schedule->description,
            'day' => $schedule->day,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'time' => $startTime . ' - ' . $endTime,
            'color' => $schedule->color,
            'is_schedule' => true,
            'type' => 'schedule',
            'semester' => $schedule->semester,
            'school_year' => $schedule->school_year,
            ];
        });

        return response()->json([
            'events' => $transformedEvents,
            'defaultEvents' => $transformedDefaultEvents,
            'userSchedules' => $transformedSchedules,
            'members' => $members,
            'schoolYear' => $schoolYear,
            'nextSchoolYear' => $nextSchoolYear,
        ]);
    }
}
