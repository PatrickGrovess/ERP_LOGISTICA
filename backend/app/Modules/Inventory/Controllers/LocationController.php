<?php

namespace App\Modules\Inventory\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Exception;

class LocationController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            return response()->json([
                'status' => 'success',
                'data' => Location::all()
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Error al obtener las ubicaciones: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'warehouse_code' => 'required|string|max:20',
                'aisle'          => 'required|string|max:10',
                'shelf'          => 'required|string|max:10',
                'level'          => 'required|string|max:10',
            ]);

            // El trait BelongsToTenant asignará el tenant_id automáticamente
            $location = Location::create($validated);

            return response()->json([
                'message' => 'Ubicación creada exitosamente',
                'data'    => $location
            ], 201);

        } catch (Exception $e) {
            return response()->json([
                'message' => 'Error al crear la ubicación: ' . $e->getMessage(),
            ], 400);
        }
    }
}