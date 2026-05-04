<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    /**
     * Get analytics data for the dashboard
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Calculate current and previous semester dates
        $now = new \DateTime();
        $currentYear = (int)$now->format('Y');
        $currentMonth = (int)$now->format('m');
        
        // Determine current semester
        $currentSemester = $this->getCurrentSemester($now);
        $semesterDates = $this->getSemesterDateRange($currentSemester, $currentYear);
        $previousSemesterDates = $this->getPreviousSemesterDateRange($currentSemester, $currentYear);
        
        // 1. Registered Accounts Metrics
        $currentAccounts = User::where('is_validated', true)
            ->where('created_at', '>=', $semesterDates['start'])
            ->where('created_at', '<=', $semesterDates['end'])
            ->count();
            
        $previousAccounts = User::where('is_validated', true)
            ->where('created_at', '>=', $previousSemesterDates['start'])
            ->where('created_at', '<=', $previousSemesterDates['end'])
            ->count();
            
        $accountsChange = $this->calculatePercentageChange($previousAccounts, $currentAccounts);
        
        // 2. Number of Events (excluding personal events)
        $currentEvents = Event::where('is_personal', false)
            ->where('event_type', 'event')
            ->where('date', '>=', $semesterDates['start'])
            ->where('date', '<=', $semesterDates['end'])
            ->count();
            
        $previousEvents = Event::where('is_personal', false)
            ->where('event_type', 'event')
            ->where('date', '>=', $previousSemesterDates['start'])
            ->where('date', '<=', $previousSemesterDates['end'])
            ->count();
            
        $eventsChange = $this->calculatePercentageChange($previousEvents, $currentEvents);
        
        // 3. Number of Meetings
        $currentMeetings = Event::where('is_personal', false)
            ->where('event_type', 'meeting')
            ->where('date', '>=', $semesterDates['start'])
            ->where('date', '<=', $semesterDates['end'])
            ->count();
            
        $previousMeetings = Event::where('is_personal', false)
            ->where('event_type', 'meeting')
            ->where('date', '>=', $previousSemesterDates['start'])
            ->where('date', '<=', $previousSemesterDates['end'])
            ->count();
            
        $meetingsChange = $this->calculatePercentageChange($previousMeetings, $currentMeetings);
        
        // 4. Users with Personal Events
        $currentPersonalEventUsers = Event::where('is_personal', true)
            ->where('date', '>=', $semesterDates['start'])
            ->where('date', '<=', $semesterDates['end'])
            ->distinct('host_id')
            ->count('host_id');
            
        $previousPersonalEventUsers = Event::where('is_personal', true)
            ->where('date', '>=', $previousSemesterDates['start'])
            ->where('date', '<=', $previousSemesterDates['end'])
            ->distinct('host_id')
            ->count('host_id');
            
        $personalEventsChange = $this->calculatePercentageChange($previousPersonalEventUsers, $currentPersonalEventUsers);
        
        // 5. Events/Meetings by Department (Pie Chart Data)
        // Exclude Administration and System Administration
        $excludedDepartments = ['Administration', 'System Administration'];
        
        $eventsByDepartment = Event::join('users', 'events.host_id', '=', 'users.id')
            ->select('users.department', DB::raw('count(*) as count'))
            ->where('events.is_personal', false)
            ->where('events.event_type', 'event')
            ->where('events.date', '>=', $semesterDates['start'])
            ->where('events.date', '<=', $semesterDates['end'])
            ->whereNotNull('users.department')
            ->whereNotIn('users.department', $excludedDepartments)
            ->groupBy('users.department')
            ->get();
            
        $meetingsByDepartment = Event::join('users', 'events.host_id', '=', 'users.id')
            ->select('users.department', DB::raw('count(*) as count'))
            ->where('events.is_personal', false)
            ->where('events.event_type', 'meeting')
            ->where('events.date', '>=', $semesterDates['start'])
            ->where('events.date', '<=', $semesterDates['end'])
            ->whereNotNull('users.department')
            ->whereNotIn('users.department', $excludedDepartments)
            ->groupBy('users.department')
            ->get();
        
        // 6. Accepted/Rejected Events by Department (Line Chart Data)
        // Exclude Administration and System Administration
        // Focus on meetings only
        $departments = User::select('department')
            ->whereNotNull('department')
            ->whereNotIn('department', $excludedDepartments)
            ->distinct()
            ->pluck('department');
            
        $acceptedRejectedByDepartment = [];
        
        foreach ($departments as $dept) {
            // Get meetings where members from this department responded
            // Exclude Admin designation users
            $accepted = DB::table('event_user')
                ->join('events', 'event_user.event_id', '=', 'events.id')
                ->join('users', 'event_user.user_id', '=', 'users.id')
                ->where('users.department', $dept)
                ->where('users.designation', '!=', 'Admin')
                ->where('event_user.status', 'accepted')
                ->where('events.date', '>=', $semesterDates['start'])
                ->where('events.date', '<=', $semesterDates['end'])
                ->where('events.is_personal', false)
                ->where('events.event_type', 'meeting')
                ->count();
                
            // Check for both 'rejected' and 'declined' status
            // Exclude Admin designation users
            $rejected = DB::table('event_user')
                ->join('events', 'event_user.event_id', '=', 'events.id')
                ->join('users', 'event_user.user_id', '=', 'users.id')
                ->where('users.department', $dept)
                ->where('users.designation', '!=', 'Admin')
                ->whereIn('event_user.status', ['rejected', 'declined'])
                ->where('events.date', '>=', $semesterDates['start'])
                ->where('events.date', '<=', $semesterDates['end'])
                ->where('events.is_personal', false)
                ->where('events.event_type', 'meeting')
                ->count();
            
            // Get yearly breakdown for the last 5 academic years
            $yearlyData = [];
            for ($i = 4; $i >= 0; $i--) {
                $academicYearStart = $currentYear - $i;
                $academicYearEnd = $academicYearStart + 1;
                $yearLabel = "{$academicYearStart}-{$academicYearEnd}";
                
                // Academic year runs from September to August
                $yearStartDate = "{$academicYearStart}-09-01";
                $yearEndDate = "{$academicYearEnd}-08-31";
                
                $yearAccepted = DB::table('event_user')
                    ->join('events', 'event_user.event_id', '=', 'events.id')
                    ->join('users', 'event_user.user_id', '=', 'users.id')
                    ->where('users.department', $dept)
                    ->where('users.designation', '!=', 'Admin')
                    ->where('event_user.status', 'accepted')
                    ->where('events.date', '>=', $yearStartDate)
                    ->where('events.date', '<=', $yearEndDate)
                    ->where('events.is_personal', false)
                    ->where('events.event_type', 'meeting')
                    ->count();
                    
                $yearDeclined = DB::table('event_user')
                    ->join('events', 'event_user.event_id', '=', 'events.id')
                    ->join('users', 'event_user.user_id', '=', 'users.id')
                    ->where('users.department', $dept)
                    ->where('users.designation', '!=', 'Admin')
                    ->whereIn('event_user.status', ['rejected', 'declined'])
                    ->where('events.date', '>=', $yearStartDate)
                    ->where('events.date', '<=', $yearEndDate)
                    ->where('events.is_personal', false)
                    ->where('events.event_type', 'meeting')
                    ->count();
                
                $yearlyData[] = [
                    'year' => $yearLabel,
                    'accepted' => $yearAccepted,
                    'declined' => $yearDeclined,
                ];
            }
                
            $acceptedRejectedByDepartment[] = [
                'department' => $dept,
                'accepted' => $accepted,
                'declined' => $rejected,
                'yearlyData' => $yearlyData,
            ];
        }
        
        return response()->json([
            'metrics' => [
                'registeredAccounts' => [
                    'count' => User::where('is_validated', true)->count(),
                    'change' => $accountsChange,
                ],
                'numberOfEvents' => [
                    'count' => $currentEvents,
                    'change' => $eventsChange,
                ],
                'numberOfMeetings' => [
                    'count' => $currentMeetings,
                    'change' => $meetingsChange,
                ],
                'usersWithPersonalEvents' => [
                    'count' => $currentPersonalEventUsers,
                    'change' => $personalEventsChange,
                ],
            ],
            'charts' => [
                'eventsByDepartment' => $eventsByDepartment,
                'meetingsByDepartment' => $meetingsByDepartment,
                'acceptedRejectedByDepartment' => $acceptedRejectedByDepartment,
            ],
            'semester' => $currentSemester,
        ]);
    }
    
    /**
     * Determine the current semester based on the date
     */
    private function getCurrentSemester(\DateTime $date): string
    {
        $month = (int)$date->format('m');
        
        if ($month >= 9 || $month <= 1) {
            return 'first';
        }
        if ($month >= 2 && $month <= 6) {
            return 'second';
        }
        if ($month >= 7 && $month <= 8) {
            return 'midyear';
        }
        
        return 'first';
    }
    
    /**
     * Get date range for a semester
     */
    private function getSemesterDateRange(string $semester, int $year): array
    {
        switch ($semester) {
            case 'first':
                // September to January
                $month = (int)date('m');
                if ($month >= 9) {
                    return [
                        'start' => "{$year}-09-01",
                        'end' => ($year + 1) . "-01-31",
                    ];
                } else {
                    return [
                        'start' => ($year - 1) . "-09-01",
                        'end' => "{$year}-01-31",
                    ];
                }
            case 'second':
                // February to June
                return [
                    'start' => "{$year}-02-01",
                    'end' => "{$year}-06-30",
                ];
            case 'midyear':
                // July to August
                return [
                    'start' => "{$year}-07-01",
                    'end' => "{$year}-08-31",
                ];
            default:
                return [
                    'start' => "{$year}-01-01",
                    'end' => "{$year}-12-31",
                ];
        }
    }
    
    /**
     * Get date range for the previous semester
     */
    private function getPreviousSemesterDateRange(string $currentSemester, int $year): array
    {
        switch ($currentSemester) {
            case 'first':
                // Previous is midyear of previous year
                return [
                    'start' => ($year - 1) . "-07-01",
                    'end' => ($year - 1) . "-08-31",
                ];
            case 'second':
                // Previous is first semester
                $month = (int)date('m');
                return [
                    'start' => ($year - 1) . "-09-01",
                    'end' => "{$year}-01-31",
                ];
            case 'midyear':
                // Previous is second semester
                return [
                    'start' => "{$year}-02-01",
                    'end' => "{$year}-06-30",
                ];
            default:
                return [
                    'start' => ($year - 1) . "-01-01",
                    'end' => ($year - 1) . "-12-31",
                ];
        }
    }
    
    /**
     * Calculate percentage change
     */
    private function calculatePercentageChange(int $previous, int $current): float
    {
        if ($previous === 0) {
            // If previous was 0 and current is positive, cap at 100%
            return $current > 0 ? 100.0 : 0.0;
        }
        
        $change = (($current - $previous) / $previous) * 100;
        
        // Cap the percentage between -100% and 100% for realistic display
        return round(max(-100, min(100, $change)), 1);
    }
}
