<?php

namespace App\Modules\Inventory\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use App\Modules\Inventory\Models\Tenant;

class ProductController extends Controller
{
    public function index(): JsonResponse
    {
        $tenantId = auth('api')->user()->tenant_id;
        $products = Product::where('tenant_id', $tenantId)->orderBy('name')->get();

        return response()->json([
            'status' => 'success',
            'data' => $products
        ], 200);
    }

    public function store(Request $request): JsonResponse
    {
        $tenantId = auth('api')->user()->tenant_id;
        $request->merge(['sku' => strtoupper(trim((string) $request->input('sku')))]);

        $validated = $request->validate([
            'sku' => [
                'required', 'string', 'max:255',
                Rule::unique('products', 'sku')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'unit_of_measure' => 'required|string|max:50',
            'unit_price' => 'required|numeric|min:0|max:99999999.99',
        ]);

        $product = DB::transaction(function () use ($tenantId, $validated) {
            $tenant = Tenant::whereKey($tenantId)->lockForUpdate()->firstOrFail();
            if (Product::where('tenant_id', $tenantId)->count() >= $tenant->max_products) {
                abort(409, 'Se alcanzó el límite de productos de este plan.');
            }

            return Product::create($validated + ['tenant_id' => $tenantId]);
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Producto creado exitosamente',
            'data' => $product
        ], 201);
    }
}
