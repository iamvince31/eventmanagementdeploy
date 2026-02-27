<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventApprover extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_approval_id',
        'approver_id',
        'status',
        'decision_reason',
        'decided_at',
    ];

    protected $casts = [
        'decided_at' => 'datetime',
    ];

    /**
     * Get the event approval this approver belongs to
     */
    public function eventApproval(): BelongsTo
    {
        return $this->belongsTo(EventApproval::class);
    }

    /**
     * Get the user who is the approver
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}