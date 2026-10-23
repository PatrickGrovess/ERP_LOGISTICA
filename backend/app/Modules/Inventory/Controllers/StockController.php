<?php
namespace App\Modules\Inventory\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Requests\StoreStockMovementRequest;
use App\Modules\Inventory\DTOs\StockMovementDTO;
use App\Modules\Inventory\Models\StockMovement;
use App\Modules\Inventory\Models\InventoryActivity;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\Location;
use App\Modules\Inventory\Models\Tenant;
use App\Modules\Inventory\Services\StockService;
use App\Modules\Inventory\Services\InsufficientStockException;
use App\Modules\Inventory\Services\MovementLimitReachedException;
use App\Modules\Inventory\Services\InvalidMovementQuantityException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class StockController extends Controller
{
    public function __construct(
        private readonly StockService $stockService
    )
    {}

    public function store(StoreStockMovementRequest $request): JsonResponse
    {
        $user = $request->user('api');
        $data = $request->validated() + [
            'tenant_id' => $user->tenant_id,
            'user_id' => $user->id,
        ];

        try {
            $movement = $this->stockService->registerMovement(StockMovementDTO::fromArray($data));
        } catch (InsufficientStockException $exception) {
            return response()->json([
                'status' => 'error',
                'message' => $exception->getMessage(),
            ], 409);
        } catch (MovementLimitReachedException $exception) {
            return response()->json([
                'status' => 'error',
                'message' => $exception->getMessage(),
            ], 409);
        } catch (InvalidMovementQuantityException $exception) {
            return response()->json([
                'status' => 'error',
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Movimiento de inventario registrado.',
            'data' => $movement->load(['product', 'location', 'user']),
        ], 201);
    }

    public function storeItem(Request $request): JsonResponse
    {
        $tenantId = $request->user('api')->tenant_id;
        $request->merge([
            'sku' => strtoupper(trim((string) $request->input('sku'))),
            'warehouse_code' => strtoupper(trim((string) $request->input('warehouse_code'))),
            'storage_condition' => $request->input('storage_condition', 'ambient'),
        ]);
        $validated = $request->validate([
            'sku' => [
                'required', 'string', 'max:255',
                Rule::unique('products', 'sku')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'name' => ['required', 'string', 'max:255'],
            'category_id' => [
                'required', 'integer',
                Rule::exists('product_categories', 'id')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'unit_of_measure' => ['required', 'string', 'max:50'],
            'unit_price' => ['required', 'decimal:0,2', 'min:0', 'max:99999999.99'],
            'storage_condition' => ['required', Rule::in(['ambient', 'refrigerated', 'frozen', 'special'])],
            'storage_notes' => ['nullable', 'string', 'max:1000', 'required_if:storage_condition,special'],
            'warehouse_code' => ['required', 'string', 'max:20'],
            'aisle' => ['required', 'string', 'max:10'],
            'shelf' => ['required', 'string', 'max:10'],
            'level' => ['required', 'string', 'max:10'],
            'quantity' => ['required', 'numeric', 'gt:0', 'decimal:0,3', 'max:999999999.999'],
            'reference_type' => ['nullable', 'string', 'in:ORDER,INVOICE,MANUAL_ADJUSTMENT'],
        ]);

        try {
            $result = DB::transaction(function () use ($tenantId, $request, $validated) {
                $tenant = Tenant::whereKey($tenantId)->lockForUpdate()->firstOrFail();
                if (Product::where('tenant_id', $tenantId)->count() >= $tenant->max_products) {
                    abort(409, 'Se alcanzó el límite de productos de este plan.');
                }

                $product = Product::create([
                    'tenant_id' => $tenantId,
                    'category_id' => $validated['category_id'] ?? null,
                    'sku' => $validated['sku'],
                    'name' => $validated['name'],
                    'unit_of_measure' => $validated['unit_of_measure'],
                    'unit_price' => $validated['unit_price'],
                    'storage_condition' => $validated['storage_condition'],
                    'storage_notes' => $validated['storage_notes'] ?? null,
                ]);
                InventoryActivity::create([
                    'tenant_id' => $tenantId,
                    'user_id' => $request->user('api')->id,
                    'product_id' => $product->id,
                    'action' => 'product_created',
                    'details' => [
                        'actor_name' => $request->user('api')->name,
                        'product_name' => $product->name,
                        'sku' => $product->sku,
                        'category_name' => $product->category?->name,
                        'unit_of_measure' => $product->unit_of_measure,
                        'unit_price' => (string) $product->unit_price,
                        'storage_condition' => $product->storage_condition,
                        'storage_notes' => $product->storage_notes,
                    ],
                ]);

                $location = Location::firstOrCreate([
                    'tenant_id' => $tenantId,
                    'warehouse_code' => $validated['warehouse_code'],
                    'aisle' => $validated['aisle'],
                    'shelf' => $validated['shelf'],
                    'level' => $validated['level'],
                ]);

                $product->update(['default_location_id' => $location->id]);

                $movement = $this->stockService->registerMovement(new StockMovementDTO(
                    tenantId: $tenantId,
                    productId: $product->id,
                    locationId: $location->id,
                    userId: $request->user('api')->id,
                    type: 'INBOUND',
                    quantity: (float) $validated['quantity'],
                    referenceType: $validated['reference_type'] ?? 'MANUAL_ADJUSTMENT',
                ));

                return compact('product', 'location', 'movement');
            });
        } catch (MovementLimitReachedException $exception) {
            return response()->json([
                'status' => 'error',
                'message' => $exception->getMessage(),
            ], 409);
        } catch (InvalidMovementQuantityException $exception) {
            return response()->json([
                'status' => 'error',
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Producto, ubicación y stock inicial creados.',
            'data' => [
                'product' => $result['product'],
                'location' => $result['location'],
                'movement' => $result['movement'],
            ],
        ], 201);
    }

    public function index(): JsonResponse
    {
        $tenantId = auth('api')->user()->tenant_id;
        $movements = StockMovement::where('tenant_id', $tenantId)
            ->with([
                'product' => fn ($query) => $query->withTrashed()->with('category'),
                'location',
                'user',
            ])
            ->latest()
            ->get();

        return response()->json(['status' => 'success', 'data' => $movements]);
    }

    public function currentStock(): JsonResponse
    {
        $stock = $this->stockService->getCurrentStock(auth('api')->user()->tenant_id);

        return response()->json(['status' => 'success', 'data' => $stock]);
    }

    public function activity(Request $request): JsonResponse
    {
        $activities = InventoryActivity::where('tenant_id', $request->user('api')->tenant_id)
            ->with('user')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(10)
            ->get();

        return response()->json(['status' => 'success', 'data' => $activities]);
    }

}
