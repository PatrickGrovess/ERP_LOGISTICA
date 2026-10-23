<?php

namespace App\Modules\Inventory\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    public function index(): JsonResponse
    {
        $tenantId = auth('api')->user()->tenant_id;

        return response()->json([
            'status' => 'success',
            'data' => Location::where('tenant_id', $tenantId)
                ->orderBy('warehouse_code')->orderBy('aisle')->orderBy('shelf')->orderBy('level')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $tenantId = auth('api')->user()->tenant_id;
        $request->merge([
            'warehouse_code' => strtoupper(trim((string) $request->input('warehouse_code'))),
            'aisle' => strtoupper(trim((string) $request->input('aisle'))),
            'shelf' => strtoupper(trim((string) $request->input('shelf'))),
            'level' => strtoupper(trim((string) $request->input('level'))),
        ]);
        $validated = $request->validate([
            'warehouse_code' => ['required', 'string', 'max:20'],
            'aisle' => ['required', 'string', 'max:10'],
            'shelf' => ['required', 'string', 'max:10'],
            'level' => ['required', 'string', 'max:10'],
        ]);

        $location = Location::firstOrCreate($validated + ['tenant_id' => $tenantId]);

        return response()->json([
            'status' => 'success',
            'message' => 'Ubicación disponible.',
            'data' => $location,
        ], 201);
    }
}
