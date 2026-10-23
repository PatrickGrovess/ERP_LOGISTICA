<?php

namespace App\Modules\Inventory\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class ProductController extends Controller
{
    public function index(): JsonResponse
    {
        $authUser = JWTAuth::parseToken()->authenticate();
        
        // Filtrar estrictamente por el tenant del usuario actual por seguridad
        $products = Product::where('tenant_id', $authUser->tenant_id)->get();

        return response()->json([
            'status' => 'success',
            'data' => $products
        ], 200);
    }

    public function store(Request $request): JsonResponse
    {
        $authUser = JWTAuth::parseToken()->authenticate();

        $validated = $request->validate([
            'sku' => 'required|string|unique:products,sku',
            'name' => 'required|string',
            'description' => 'nullable|string',
            'unit_of_measure' => 'required|string',
            'unit_price' => 'required|numeric|min:0',
        ]);

        $validated['tenant_id'] = $authUser->tenant_id;

        $product = Product::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Producto creado exitosamente',
            'data' => $product
        ], 201);
    }
}