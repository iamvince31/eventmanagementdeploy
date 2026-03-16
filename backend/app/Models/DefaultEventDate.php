<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DefaultEventDate extends Model
{
    protected $fillable = [
        'default_event_id',
        'school_year',
        'date',
        'end_date',
        'month',
        'created_by',
    ];

    protected $casts = [
        'date' => 'date',
        'end_date' => 'date',
        'month' => 'integer',
    ];

    /**
     * Get the default event this date belongs to.
     */
    public function defaultEvent(): BelongsTo
    {
        return $this->belongsTo(DefaultEvent::class);
    }

    /**
     * Get the user who created this date entry.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope a query to only include dates for a specific school year.
     */
    public function scopeForSchoolYear($query, string $schoolYear)
    {
        return $query->where('school_year', $schoolYear);
    }

    /**
     * Scope a query to only include dates for a specific month.
     */
    public function scopeForMonth($query, int $month)
    {
        return $query->where('month', $month);
    }

    /**
     * Scope a query to order by date.
     */
    public function scopeOrderedByDate($query)
    {
        return $query->orderBy('date');
    }
}
