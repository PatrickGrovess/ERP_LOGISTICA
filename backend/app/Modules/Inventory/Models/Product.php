<?php

namespace App\Modules\Inventory\Models;

use App\Modules\Inventory\Models\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use BelongsToTenant;
    use SoftDeletes;

    protected $casts = [
        'unit_price' => 'decimal:2',
        'category_id' => 'integer',
        'default_location_id' => 'integer',
    ];

    protected $fillable = [
        'tenant_id',
        'category_id',
        "name",
        "sku",
        "description",
        'unit_of_measure',
        'unit_price',
        'storage_condition',
        'storage_notes',
        'default_location_id',
    ];

    public function tenant() {
    return $this->belongsTo(Tenant::class);
}

    public function category()
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    public function defaultLocation()
    {
        return $this->belongsTo(Location::class, 'default_location_id');
    }
}
