<?php

namespace App\Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Database\Factories\TenantFactory;

class Tenant extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'server_code',
        'plan_type',
        'status',
        'max_products',
        'max_users',
        'max_movements',
        'low_stock_threshold',
        'currency',
        'auto_notifications',
    ];

    protected function casts(): array
    {
        return [
            'low_stock_threshold' => 'integer',
            'auto_notifications' => 'boolean',
        ];
    }

    protected static function newFactory(): TenantFactory
    {
        return TenantFactory::new();
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function locations()
    {
        return $this->hasMany(Location::class);
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }
}
