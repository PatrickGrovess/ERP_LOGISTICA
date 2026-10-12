<?php

namespace App\Modules\Inventory\Models\Traits;

// Corrección aquí: App\Modules en lugar de App\Models

use App\Modules\Inventory\Models\Scopes\TenantScope;
use Illuminate\Support\Facades\Auth;


/**
 * @mixin \Illuminate\Database\Eloquent\Model
 */
trait BelongsToTenant
{
    protected static function bootBelongsToTenant() : void
    {
        static::addGlobalScope(new TenantScope());

        static::creating(function ($model){
            if(Auth::check() && Auth::user()->tenant_id) {
                $model->tenant_id = Auth::user()->tenant_id;
            }
        });
    }

    public function tenant()
    {
        return $this->belongsTo(\App\Modules\Inventory\Models\Tenant::class);
    }
}