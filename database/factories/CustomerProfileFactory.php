<?php

namespace Database\Factories;

use App\Models\CustomerProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CustomerProfile>
 */
class CustomerProfileFactory extends Factory
{
    protected $model = CustomerProfile::class;

    public function definition(): array
    {
        return [
            'avatar' => null,
            'gender' => fake()->randomElement(['male', 'female', 'other']),
            'date_of_birth' => fake()->dateTimeBetween('-65 years', '-18 years'),
            'bio' => fake()->optional()->sentence(),
            'preferred_language' => fake()->randomElement(['en', 'bn']),
            'newsletter_opt_in' => fake()->boolean(),
        ];
    }
}
