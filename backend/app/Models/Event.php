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
        'end_time',
        'school_year',
        'host_id',
        'is_personal',
        'personal_color',
        'event_type',
        'is_urgent',
        'is_archived',
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
        return $this->hasMany(EventImage::class)->orderBy('order');
    }

    /**
     * Get images with their URLs for API responses
     */
    public function getImagesWithUrlsAttribute()
    {
        return $this->images->map(function ($image) {
            return [
                'id' => $image->id,
                'url' => $image->url, // Uses the accessor from EventImage model
                'original_filename' => $image->original_filename,
                'is_pdf' => $image->is_pdf,
                'order' => $image->order,
            ];
        });
    }
}
