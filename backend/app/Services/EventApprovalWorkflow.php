<?php

namespace App\Services;

use App\Models\Event;
use App\Models\EventApproval;
use App\Models\EventApprover;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class EventApprovalWorkflow
{
    /**
     * Create a pending event approval
     */
    public function createPendingEvent(array $eventData, array $approvers): EventApproval
    {
        return DB::transaction(function () use ($eventData, $approvers) {
            // Create the event approval record
            $eventApproval = EventApproval::create([
                'title' => $eventData['title'],
                'description' => $eventData['description'] ?? '',
                'location' => $eventData['location'],
                'date' => $eventData['date'],
                'time' => $eventData['time'],
                'host_id' => $eventData['host_id'],
                'event_data' => $eventData, // Store complete event data as JSON
                'status' => 'pending',
            ]);

            // Create approver records
            foreach ($approvers as $approverId) {
                EventApprover::create([
                    'event_approval_id' => $eventApproval->id,
                    'approver_id' => $approverId,
                    'status' => 'pending',
                ]);
            }

            return $eventApproval->load(['host', 'approvers.approver']);
        });
    }

    /**
     * Process an approval or rejection decision
     */
    public function processApproval(EventApproval $approval, User $approver, string $decision, ?string $reason = null): void
    {
        DB::transaction(function () use ($approval, $approver, $decision, $reason) {
            // Find the approver record
            $approverRecord = $approval->approvers()
                ->where('approver_id', $approver->id)
                ->where('status', 'pending')
                ->first();

            if (!$approverRecord) {
                throw new \Exception('Approver not found or already decided');
            }

            // Update the approver's decision
            $approverRecord->update([
                'status' => $decision,
                'decision_reason' => $reason,
                'decided_at' => now(),
            ]);

            // Check the overall approval status
            $this->updateApprovalStatus($approval);
        });
    }
    /**
     * Check and update the overall approval status
     */
    private function updateApprovalStatus(EventApproval $approval): void
    {
        // Refresh the approval to get latest approver statuses
        $approval->refresh();

        // If any approver rejected, mark as rejected
        if ($approval->isRejected()) {
            $approval->update(['status' => 'rejected']);
            return;
        }

        // If all approvers have approved, mark as approved and create the event
        if ($approval->isFullyApproved()) {
            $approval->update(['status' => 'approved']);
            $this->finalizeEvent($approval);
        }
    }

    /**
     * Get the current approval status
     */
    public function checkApprovalStatus(EventApproval $approval): string
    {
        $approval->refresh();
        
        if ($approval->isRejected()) {
            return 'rejected';
        }
        
        if ($approval->isFullyApproved()) {
            return 'approved';
        }
        
        return 'pending';
    }

    /**
     * Create the actual event from approved event approval
     */
    public function finalizeEvent(EventApproval $approval): Event
    {
        return DB::transaction(function () use ($approval) {
            $eventData = $approval->event_data;

            // Create the event
            $event = Event::create([
                'title' => $approval->title,
                'description' => $approval->description,
                'location' => $approval->location,
                'date' => $approval->date,
                'time' => $approval->time,
                'host_id' => $approval->host_id,
            ]);

            // Handle images if they exist in event_data
            if (isset($eventData['images']) && !empty($eventData['images'])) {
                foreach ($eventData['images'] as $index => $imageData) {
                    $event->images()->create([
                        'image_path' => $imageData['path'],
                        'original_filename' => $imageData['original_filename'],
                        'order' => $index,
                    ]);
                }
            }

            // Handle member invitations
            if (isset($eventData['member_ids']) && !empty($eventData['member_ids'])) {
                $memberData = collect($eventData['member_ids'])
                    ->filter(fn($id) => $id != $approval->host_id) // Exclude host
                    ->mapWithKeys(fn($id) => [$id => ['status' => 'pending']])
                    ->all();
                
                if (!empty($memberData)) {
                    $event->members()->attach($memberData);
                }
            }

            // Link the created event to the approval
            $approval->update(['created_event_id' => $event->id]);

            return $event->load(['host', 'members', 'images']);
        });
    }
}