<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DefaultEvent extends Model
{
    protected $fillable = [
        'name',
        'month',
        'order',
        'date',
        'end_date',
        'school_year',
    ];

    protected $casts = [
        'month' => 'integer',
        'order' => 'integer',
        'date' => 'date',
        'end_date' => 'date',
    ];

    /**
     * Get all date assignments for this default event across different school years.
     */
    public function eventDates(): HasMany
    {
        return $this->hasMany(DefaultEventDate::class);
    }

    /**
     * Get the date assignment for a specific school year.
     */
    public function getDateForSchoolYear(string $schoolYear): ?DefaultEventDate
    {
        return $this->eventDates()->forSchoolYear($schoolYear)->first();
    }

    /**
     * Scope a query to only include events for a specific month.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $month Month number (1-12)
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeForMonth($query, $month)
    {
        return $query->where('month', $month);
    }

    /**
     * Scope a query to order events by their order field.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order');
    }
}
