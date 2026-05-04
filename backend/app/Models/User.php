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
        'designations',
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
            'designations' => 'array',
            'ceit_officer_type' => 'array',
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

    // Get all designations as array (falls back to single designation for backward compat)
    public function getDesignationsArray(): array
    {
        if (!empty($this->designations)) {
            return $this->designations;
        }
        return $this->designation ? [$this->designation] : [];
    }

    public function hasDesignation(string $designation): bool
    {
        return in_array($designation, $this->getDesignationsArray());
    }

    // Helper methods for designation checking
    public function isAdmin()
    {
        return $this->hasDesignation('Admin');
    }

    public function isDean()
    {
        return $this->hasDesignation('Dean');
    }

    public function isChairperson()
    {
        return $this->hasDesignation('Chairperson');
    }

    public function isCoordinator()
    {
        $designations = $this->getDesignationsArray();
        foreach ($designations as $desig) {
            if (str_contains(strtolower($desig), 'coordinator')) {
                return true;
            }
        }
        return false;
    }

    public function isFaculty()
    {
        return $this->hasDesignation('Faculty Member');
    }

    public function isCEITOfficial()
    {
        return !empty(array_intersect($this->getDesignationsArray(), ['Dean', 'CEIT Official']));
    }

    public function canCreateEvents()
    {
        // By default, everyone with a designation can create events unless they are just empty
        // For security, maybe explicitly block specific low-level roles if any, but in this system
        // basically all designations (Dean, Chairperson, Coordinator, Faculty, Staff) can create events.
        $designations = $this->getDesignationsArray();
        return !empty($designations);
    }

    public function needsApprovalForEvents()
    {
        // Anyone except Admin, Dean, and CEIT Official needs approval
        $designations = $this->getDesignationsArray();
        $exempt = ['Admin', 'Dean', 'CEIT Official'];
        return empty(array_intersect($designations, $exempt));
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