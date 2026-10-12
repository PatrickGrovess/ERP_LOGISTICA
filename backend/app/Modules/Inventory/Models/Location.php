<?php

namespace App\Modules\Inventory\Models;

use App\Modules\Inventory\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class Location extends Model
{
    use BelongsToTenant;
    protected $fillable = [
        'tenant_id',
        "name",
        "description",
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
