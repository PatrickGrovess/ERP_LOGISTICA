<?php

namespace App\Modules\Inventory\Models;

use App\Modules\Inventory\Models\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use BelongsToTenant;
    protected $fillable = [
        'tenant_id',
        "name",
        "sku",
        "description",
        'unit_of_measure',
        'unit_price',
    ];

    public function tenant() {
    return $this->belongsTo(Tenant::class);
}
}
