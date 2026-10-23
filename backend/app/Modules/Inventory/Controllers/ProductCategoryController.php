<?php

namespace App\Modules\Inventory\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\ProductCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $categories = ProductCategory::where('tenant_id', $request->user('api')->tenant_id)
            ->orderBy('name')
            ->get();

        return response()->json(['status' => 'success', 'data' => $categories]);
    }

    public function store(Request $request): JsonResponse
    {
        $tenantId = $request->user('api')->tenant_id;
        $request->merge(['name' => trim((string) $request->input('name'))]);
        $validated = $request->validate([
            'name' => [
                'required', 'string', 'max:80',
                Rule::unique('product_categories', 'name')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
        ]);

        $category = ProductCategory::create($validated + ['tenant_id' => $tenantId]);

        return response()->json([
            'status' => 'success',
            'message' => 'Categoría creada.',
            'data' => $category,
        ], 201);
    }
}
