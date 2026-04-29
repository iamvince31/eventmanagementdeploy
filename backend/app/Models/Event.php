<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $fillable = [
        'title',
        'description',
        'location',
        'date',
        'time',
        'school_year',
        'host_id',
        'is_personal',
        'personal_color',
        'event_type',
        'is_urgent',
    ];

    protected $casts = [
        'is_personal' => 'boolean',
        'is_urgent' => 'boolean',
    ];

    public function host()
    {
        return $this->belongsTo(User::class, 'host_id');
    }

    public function members()
    {
        return $this->belongsToMany(User::class)->withPivot('status')->withTimestamps();
    }

    public function images()
    {
        return $this->hasMany(EventImage::class);
    }
}
