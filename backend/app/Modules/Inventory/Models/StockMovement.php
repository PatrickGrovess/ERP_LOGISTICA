<?php

namespace App\Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Modules\Inventory\Models\User;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\Location;


class StockMovement extends Model
{
    use HasFactory;

    protected $table = 'stock_movements';

    protected $fillable = [
        'product_id',
        'location_id',
        'user_id',
        'type',
        'quantity'
    ];

    // Relacion con el producto
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    // Relacion con la ubicación
    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    // Relacion con el usuario
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}