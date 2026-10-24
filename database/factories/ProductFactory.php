<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        $name = fake()->words(3, true);

        return [
            'tenant_id' => Tenant::factory(),
            'category_id' => Category::factory(),
            'brand_id' => null,
            'name' => Str::title($name),
            'slug' => Str::slug($name).'-'.fake()->unique()->numerify('####'),
            'description' => fake()->paragraph(),
            'gender' => fake()->randomElement(['men', 'women', 'kids', 'unisex']),
            'base_price' => fake()->randomFloat(2, 50, 10000),
            'sale_price' => null,
            'rating_avg' => 0,
            'rating_count' => 0,
            'is_active' => true,
        ];
    }
}
