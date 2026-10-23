<?php

namespace App\Modules\Inventory\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TenantSettingsController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $tenant = Tenant::findOrFail($request->user('api')->tenant_id);

        return response()->json(['status' => 'success', 'data' => $tenant]);
    }

    public function update(Request $request): JsonResponse
    {
        $tenant = Tenant::findOrFail($request->user('api')->tenant_id);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'low_stock_threshold' => ['required', 'integer', 'min:0', 'max:1000000'],
            'currency' => ['required', 'string', Rule::in(['USD', 'EUR', 'PAB', 'COP'])],
            'auto_notifications' => ['required', 'boolean'],
        ]);

        $tenant->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Configuración de la empresa actualizada.',
            'data' => $tenant->fresh(),
        ]);
    }
}
