<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EventApproval extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'location',
        'date',
        'time',
        'host_id',
        'event_data',
        'status',
        'created_event_id',
    ];

    protected $casts = [
        'event_data' => 'array',
        'date' => 'date',
        'time' => 'datetime:H:i',
    ];

    /**
     * Get the host of the event approval
     */
    public function host(): BelongsTo
    {
        return $this->belongsTo(User::class, 'host_id');
    }

    /**
     * Get all approvers for this event approval
     */
    public function approvers(): HasMany
    {
        return $this->hasMany(EventApprover::class);
    }

    /**
     * Get the created event if approved
     */
    public function createdEvent(): BelongsTo
    {
        return $this->belongsTo(Event::class, 'created_event_id');
    }

    /**
     * Check if all required approvers have approved
     */
    public function isFullyApproved(): bool
    {
        return $this->approvers()->where('status', 'pending')->count() === 0 &&
               $this->approvers()->where('status', 'approved')->count() > 0;
    }

    /**
     * Check if any approver has rejected
     */
    public function isRejected(): bool
    {
        return $this->approvers()->where('status', 'rejected')->exists();
    }

    /**
     * Get pending approvers
     */
    public function pendingApprovers()
    {
        return $this->approvers()->where('status', 'pending')->with('approver');
    }
}