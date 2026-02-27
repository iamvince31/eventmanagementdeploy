<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'date',
        'time',
        'location',
        'justification',
        'expected_attendees',
        'budget',
        'resources',
        'requested_by',
        'status',
        'rejection_reason',
        'reviewed_by',
        'reviewed_at'
    ];

    protected $casts = [
        'date' => 'date',
        'time' => 'datetime:H:i',
        'reviewed_at' => 'datetime'
    ];

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}