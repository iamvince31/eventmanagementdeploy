<?php

namespace Database\Factories;

use App\Models\EventApproval;
use App\Models\EventApprover;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\EventApprover>
 */
class EventApproverFactory extends Factory
{
    protected $model = EventApprover::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'event_approval_id' => EventApproval::factory(),
            'approver_id' => User::factory(),
            'status' => 'pending',
            'decision_reason' => null,
            'decided_at' => null,
        ];
    }

    /**
     * Indicate that the approver has approved.
     */
    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
            'decided_at' => now(),
        ]);
    }

    /**
     * Indicate that the approver has rejected.
     */
    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'rejected',
            'decision_reason' => $this->faker->sentence(),
            'decided_at' => now(),
        ]);
    }
}