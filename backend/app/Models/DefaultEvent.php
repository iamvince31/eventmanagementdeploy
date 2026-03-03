<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
