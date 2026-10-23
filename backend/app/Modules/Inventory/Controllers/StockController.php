<?php
namespace App\Modules\Inventory\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Requests\StoreStockMovementRequest;
use App\Modules\Inventory\DTOs\StockMovementDTO;
use App\Modules\Inventory\Models\StockMovement;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\Location;
use App\Modules\Inventory\Models\Tenant;
use App\Modules\Inventory\Services\StockService;
use App\Modules\Inventory\Services\InsufficientStockException;
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
        ]);
        $validated = $request->validate([
            'sku' => [
                'required', 'string', 'max:255',
                Rule::unique('products', 'sku')->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'name' => ['required', 'string', 'max:255'],
            'unit_of_measure' => ['required', 'string', 'max:50'],
            'unit_price' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'warehouse_code' => ['required', 'string', 'max:20'],
            'aisle' => ['required', 'string', 'max:10'],
            'shelf' => ['required', 'string', 'max:10'],
            'level' => ['required', 'string', 'max:10'],
            'quantity' => ['required', 'integer', 'min:1', 'max:2147483647'],
            'reference_type' => ['nullable', 'string', 'in:ORDER,INVOICE,MANUAL_ADJUSTMENT'],
        ]);

        $result = DB::transaction(function () use ($tenantId, $request, $validated) {
            $tenant = Tenant::whereKey($tenantId)->lockForUpdate()->firstOrFail();
            if (Product::where('tenant_id', $tenantId)->count() >= $tenant->max_products) {
                abort(409, 'Se alcanzó el límite de productos de este plan.');
            }

            $product = Product::create([
                'tenant_id' => $tenantId,
                'sku' => $validated['sku'],
                'name' => $validated['name'],
                'unit_of_measure' => $validated['unit_of_measure'],
                'unit_price' => $validated['unit_price'],
            ]);

            $location = Location::firstOrCreate([
                'tenant_id' => $tenantId,
                'warehouse_code' => $validated['warehouse_code'],
                'aisle' => $validated['aisle'],
                'shelf' => $validated['shelf'],
                'level' => $validated['level'],
            ]);

            $movement = $this->stockService->registerMovement(new StockMovementDTO(
                tenantId: $tenantId,
                productId: $product->id,
                locationId: $location->id,
                userId: $request->user('api')->id,
                type: 'INBOUND',
                quantity: (int) $validated['quantity'],
                referenceType: $validated['reference_type'] ?? 'MANUAL_ADJUSTMENT',
            ));

            return compact('product', 'location', 'movement');
        });

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
            ->with(['product', 'location', 'user'])
            ->latest()
            ->get();

        return response()->json(['status' => 'success', 'data' => $movements]);
    }

    public function currentStock(): JsonResponse
    {
        $stock = $this->stockService->getCurrentStock(auth('api')->user()->tenant_id);

        return response()->json(['status' => 'success', 'data' => $stock]);
    }

}
