<?php

namespace Database\Factories;

use App\Models\EventApproval;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\EventApproval>
 */
class EventApprovalFactory extends Factory
{
    protected $model = EventApproval::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $date = $this->faker->dateTimeBetween('now', '+1 year');
        $time = $this->faker->time('H:i');
        
        return [
            'title' => $this->faker->sentence(3),
            'description' => $this->faker->paragraph(),
            'location' => $this->faker->address(),
            'date' => $date->format('Y-m-d'),
            'time' => $time,
            'host_id' => User::factory(),
            'event_data' => [
                'title' => $this->faker->sentence(3),
                'description' => $this->faker->paragraph(),
                'location' => $this->faker->address(),
                'date' => $date->format('Y-m-d'),
                'time' => $time,
                'member_ids' => [],
                'images' => [],
            ],
            'status' => 'pending',
        ];
    }

    /**
     * Indicate that the event approval is approved.
     */
    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
        ]);
    }

    /**
     * Indicate that the event approval is rejected.
     */
    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'rejected',
        ]);
    }
}