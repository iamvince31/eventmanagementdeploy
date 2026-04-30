<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Notifications\ResetPasswordNotification;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, \Laravel\Sanctum\HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'password',
        'department',
        'designation',
        'ceit_officer_type',
        'profile_picture',
        'is_validated',
        'email_verified_at',
        'schedule_initialized',
        'is_bootstrap',
        'has_changed_credentials',
        'has_changed_email',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'is_validated' => 'boolean',
            'is_bootstrap' => 'boolean',
        ];
    }

    // Automatically validate admins when created/updated
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($user) {
            if ($user->designation === 'Admin') {
                $user->is_validated = true;
                $user->schedule_initialized = true;
            }
        });

        static::updating(function ($user) {
            if ($user->designation === 'Admin') {
                $user->is_validated = true;
                $user->schedule_initialized = true;
            }
        });
    }

    // Helper methods for designation checking
    public function isAdmin()
    {
        return $this->designation === 'Admin';
    }

    public function isDean()
    {
        return $this->designation === 'Dean';
    }

    public function isChairperson()
    {
        return $this->designation === 'Chairperson';
    }

    public function isCoordinator()
    {
        return in_array($this->role, [
            'Department Research Coordinator',
            'Department Extension Coordinator',
        ]);
    }

    public function isFaculty()
    {
        return $this->designation === 'Faculty Member';
    }

    public function isCEITOfficial()
    {
        return in_array($this->designation, [
            'Dean',
            'CEIT Official'
        ]);
    }

    public function isDeptLevel()
    {
        return in_array($this->designation, [
            'Chairperson',
            'Coordinator',
            'Program Coordinator',
            'Research Coordinator',
            'Extension Coordinator',
            'GAD Coordinator'
        ]);
    }

    public function canCreateEvents()
    {
        return in_array($this->role, [
            'Admin', 'Dean', 'Chairperson',
            'Department Research Coordinator', 'Department Extension Coordinator',
            'CEIT Official', 'Faculty Member',
        ]);
    }

    public function needsApprovalForEvents()
    {
        return in_array($this->designation, [
            'Chairperson',
            'Coordinator',
            'Research Coordinator',
            'Extension Coordinator',
            'GAD Coordinator',
        ]);
    }
    public function events()
    {
        return $this->belongsToMany(Event::class)->withTimestamps();
    }

    public function hostedEvents()
    {
        return $this->hasMany(Event::class, 'host_id');
    }

    public function schedules()
    {
        return $this->hasMany(UserSchedule::class);
    }

    public function sendPasswordResetNotification($token)
    {
        $this->notify(new ResetPasswordNotification($token));
    }
}