<?php

namespace App\Modules\Inventory\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\InventoryActivity;
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
        $products = Product::where('tenant_id', $tenantId)->with('category')->orderBy('name')->get();

        return response()->json([
            'status' => 'success',
            'data' => $products
        ], 200);
    }

    public function store(Request $request): JsonResponse
    {
        $tenantId = auth('api')->user()->tenant_id;
        $request->merge(['sku' => strtoupper(trim((string) $request->input('sku')))]);
        $request->merge(['storage_condition' => $request->input('storage_condition', 'ambient')]);

        $validated = $request->validate([
            'sku' => [
                'required', 'string', 'max:255',
                Rule::unique('products', 'sku')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category_id' => [
                'required', 'integer',
                Rule::exists('product_categories', 'id')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'unit_of_measure' => 'required|string|max:50',
            'unit_price' => 'required|decimal:0,2|min:0|max:99999999.99',
            'storage_condition' => ['required', Rule::in(['ambient', 'refrigerated', 'frozen', 'special'])],
            'storage_notes' => ['nullable', 'string', 'max:1000', 'required_if:storage_condition,special'],
        ]);

        $actor = $request->user('api');
        $product = DB::transaction(function () use ($tenantId, $validated, $actor) {
            $tenant = Tenant::whereKey($tenantId)->lockForUpdate()->firstOrFail();
            if (Product::where('tenant_id', $tenantId)->count() >= $tenant->max_products) {
                abort(409, 'Se alcanzó el límite de productos de este plan.');
            }

            $product = Product::create($validated + ['tenant_id' => $tenantId]);
            InventoryActivity::create([
                'tenant_id' => $tenantId,
                'user_id' => $actor->id,
                'product_id' => $product->id,
                'action' => 'product_created',
                'details' => $this->productActivityDetails($product, $actor->name),
            ]);

            return $product;
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Producto creado exitosamente',
            'data' => $product
        ], 201);
    }

    public function update(Request $request, int $productId): JsonResponse
    {
        $tenantId = $request->user('api')->tenant_id;
        $product = Product::where('tenant_id', $tenantId)->findOrFail($productId);
        $request->merge(['sku' => strtoupper(trim((string) $request->input('sku')))]);
        $request->merge(['storage_condition' => $request->input('storage_condition', $product->storage_condition ?: 'ambient')]);

        $validated = $request->validate([
            'sku' => [
                'required', 'string', 'max:255',
                Rule::unique('products', 'sku')
                    ->where(fn ($query) => $query->where('tenant_id', $tenantId))
                    ->ignore($product->id),
            ],
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category_id' => [
                'nullable', 'integer',
                Rule::exists('product_categories', 'id')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'unit_of_measure' => 'required|string|max:50',
            'unit_price' => 'required|decimal:0,2|min:0|max:99999999.99',
            'storage_condition' => ['required', Rule::in(['ambient', 'refrigerated', 'frozen', 'special'])],
            'storage_notes' => ['nullable', 'string', 'max:1000', 'required_if:storage_condition,special'],
        ]);

        $actor = $request->user('api');
        $updatedProduct = DB::transaction(function () use ($tenantId, $productId, $validated, $actor) {
            Tenant::whereKey($tenantId)->lockForUpdate()->firstOrFail();
            $product = Product::where('tenant_id', $tenantId)
                ->whereKey($productId)
                ->lockForUpdate()
                ->firstOrFail();
            $before = [
                'sku' => $product->sku,
                'name' => $product->name,
                'description' => $product->description,
                'category_id' => $product->category_id,
                'unit_of_measure' => $product->unit_of_measure,
                'unit_price' => (string) $product->unit_price,
                'storage_condition' => $product->storage_condition,
                'storage_notes' => $product->storage_notes,
            ];
            $product->update($validated);
            $after = [
                'sku' => $product->sku,
                'name' => $product->name,
                'description' => $product->description,
                'category_id' => $product->category_id,
                'unit_of_measure' => $product->unit_of_measure,
                'unit_price' => (string) $product->unit_price,
                'storage_condition' => $product->storage_condition,
                'storage_notes' => $product->storage_notes,
            ];
            $changedFields = array_keys(array_filter(
                $after,
                fn ($value, $field) => $value !== $before[$field],
                ARRAY_FILTER_USE_BOTH
            ));
            if ($changedFields !== []) {
                InventoryActivity::create([
                    'tenant_id' => $tenantId,
                    'user_id' => $actor->id,
                    'product_id' => $product->id,
                    'action' => 'product_updated',
                    'details' => $this->productActivityDetails($product, $actor->name) + [
                        'changed_fields' => $changedFields,
                        'previous_values' => array_intersect_key($before, array_flip($changedFields)),
                        'new_values' => array_intersect_key($after, array_flip($changedFields)),
                    ],
                ]);
            }

            return $product->fresh();
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Producto actualizado exitosamente.',
            'data' => $updatedProduct,
        ]);
    }

    public function destroy(Request $request, int $productId): JsonResponse
    {
        $tenantId = $request->user('api')->tenant_id;

        $actor = $request->user('api');
        $product = DB::transaction(function () use ($tenantId, $productId, $actor) {
            Tenant::whereKey($tenantId)->lockForUpdate()->firstOrFail();
            $product = Product::where('tenant_id', $tenantId)
                ->whereKey($productId)
                ->lockForUpdate()
                ->firstOrFail();

            $currentStock = (float) DB::table('stock_movements')
                ->where('tenant_id', $tenantId)
                ->where('product_id', $product->id)
                ->selectRaw('COALESCE(SUM(CASE WHEN type = ? THEN quantity WHEN type = ? THEN -quantity ELSE 0 END), 0) as current_stock', ['INBOUND', 'OUTBOUND'])
                ->value('current_stock');

            if (abs($currentStock) >= 0.0005) {
                abort(409, 'No se puede eliminar un producto con existencias distintas de cero. Registra el movimiento correspondiente antes de archivarlo.');
            }

            InventoryActivity::create([
                'tenant_id' => $tenantId,
                'user_id' => $actor->id,
                'product_id' => $product->id,
                'action' => 'product_deleted',
                'details' => $this->productActivityDetails($product, $actor->name),
            ]);
            $product->delete();

            return $product;
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Producto eliminado del inventario. Se conservará su historial.',
            'data' => ['id' => $product->id],
        ]);
    }

    private function productActivityDetails(Product $product, string $actorName): array
    {
        return [
            'actor_name' => $actorName,
            'product_name' => $product->name,
            'sku' => $product->sku,
            'category_name' => $product->category?->name,
            'unit_of_measure' => $product->unit_of_measure,
            'unit_price' => (string) $product->unit_price,
            'storage_condition' => $product->storage_condition,
            'storage_notes' => $product->storage_notes,
        ];
    }
}
