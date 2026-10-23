<?php

namespace App\Modules\Inventory\Models;

use App\Modules\Inventory\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class ProductCategory extends Model
{
    use BelongsToTenant;

    public const DEFAULT_NAMES = [
        'Alimentos',
        'Bebidas',
        'Limpieza',
        'Oficina',
        'Electrónica',
        'Repuestos',
        'Otros',
    ];

    protected $fillable = ['tenant_id', 'name'];

    public function products()
    {
        return $this->hasMany(Product::class, 'category_id');
    }
}
