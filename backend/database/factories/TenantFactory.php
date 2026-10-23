<?php

namespace Database\Factories;

use App\Modules\Inventory\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Tenant> */
class TenantFactory extends Factory
{
    protected $model = Tenant::class;

    public function definition(): array
    {
        $segment = fn () => Str::upper(Str::random(5));

        return [
            'name' => fake()->company(),
            'server_code' => $segment().'-'.$segment().'-'.$segment(),
            'plan_type' => null,
            'status' => 'trial',
            'max_products' => 10,
            'max_users' => 3,
            'max_movements' => 5,
            'low_stock_threshold' => 10,
            'currency' => 'COP',
            'auto_notifications' => true,
        ];
    }
}
