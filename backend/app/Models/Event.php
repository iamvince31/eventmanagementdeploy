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
        'host_id',
    ];

    protected $casts = [
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
