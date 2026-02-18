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
        'is_open',
        'host_id',
        'auto_accept_reschedule',
    ];

    protected $casts = [
        'is_open' => 'boolean',
        'auto_accept_reschedule' => 'boolean',
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

    public function rescheduleRequests()
    {
        return $this->hasMany(EventRescheduleRequest::class);
    }
}
