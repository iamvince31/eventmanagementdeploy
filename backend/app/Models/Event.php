<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $fillable = [
        'title',
        'description',
        'department',
        'date',
        'time',
        'is_open',
        'host_id',
    ];

    protected $casts = [
        'is_open' => 'boolean',
    ];

    public function host()
    {
        return $this->belongsTo(User::class, 'host_id');
    }

    public function members()
    {
        return $this->belongsToMany(User::class)->withTimestamps();
    }
}
