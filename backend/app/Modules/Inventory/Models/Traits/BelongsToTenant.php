<?php

namespace App\Modules\Inventory\Models\Traits;

// Corrección aquí: App\Modules en lugar de App\Models

use App\Modules\Inventory\Models\Scopes\TenantScope;
use Illuminate\Auth\Access\AuthorizationException;
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
            $user = Auth::guard('api')->user() ?? Auth::user();
            if ($user) {
                if (!$user->tenant_id) {
                    throw new AuthorizationException('La cuenta no está asociada a una empresa.');
                }

                if ($model->tenant_id && (int) $model->tenant_id !== (int) $user->tenant_id) {
                    throw new AuthorizationException('No puedes crear registros para otra empresa.');
                }

                $model->tenant_id = $user->tenant_id;
            }
        });
    }

    public function tenant()
    {
        return $this->belongsTo(\App\Modules\Inventory\Models\Tenant::class);
    }
}
