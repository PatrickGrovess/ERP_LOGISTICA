<?php

namespace App\Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
    ];

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