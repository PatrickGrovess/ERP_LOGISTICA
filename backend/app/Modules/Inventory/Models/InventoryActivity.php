<?php

namespace App\Modules\Inventory\Models;

use App\Modules\Inventory\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class InventoryActivity extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'product_id',
        'action',
        'details',
    ];

    protected function casts(): array
    {
        return [
            'details' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
