<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventImage extends Model
{
    protected $fillable = [
        'event_id',
        'image_path',
        'cloudinary_url',
        'original_filename',
        'order',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Get the full URL for the image
     * Environment-aware: Local storage for localhost, Supabase for production
     */
    public function getUrlAttribute()
    {
        return \App\Services\ImageService::getImageUrl($this->image_path, $this->cloudinary_url);
    }

    /**
     * Check if this is a PDF file
     */
    public function getIsPdfAttribute()
    {
        return str_ends_with(strtolower($this->original_filename ?? ''), '.pdf') ||
               str_contains(strtolower($this->image_path ?? ''), '.pdf');
    }
}
