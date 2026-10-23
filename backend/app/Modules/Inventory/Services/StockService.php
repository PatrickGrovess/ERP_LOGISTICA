<?php

namespace App\Modules\Inventory\Services;

use App\Modules\Inventory\DTOs\StockMovementDTO;
use App\Modules\Inventory\Models\StockMovement;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\Location;
use App\Modules\Inventory\Models\InventoryActivity;
use App\Modules\Inventory\Models\Tenant;
use App\Modules\Inventory\Models\User;
use App\Modules\Inventory\Repositories\StockMovementRepositoryInterface;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class StockService
{
    public function  __construct(
        private readonly StockMovementRepositoryInterface $repository
    ) {}

    public function registerMovement(StockMovementDTO $dto): StockMovement
    {
        return DB::transaction(function () use ($dto) {
            $tenant = Tenant::whereKey($dto->tenantId)->lockForUpdate()->firstOrFail();
            $monthStart = CarbonImmutable::now()->startOfMonth();
            $nextMonthStart = $monthStart->addMonth();
            $monthlyMovementCount = StockMovement::where('tenant_id', $dto->tenantId)
                ->where('created_at', '>=', $monthStart)
                ->where('created_at', '<', $nextMonthStart)
                ->count();

            if ($monthlyMovementCount >= $tenant->max_movements) {
                throw new MovementLimitReachedException(
                    'Se alcanzó el límite de movimientos de inventario de este plan para el mes actual.'
                );
            }

            $product = Product::query()
                ->where('tenant_id', $dto->tenantId)
                ->whereKey($dto->productId)
                ->lockForUpdate()
                ->firstOrFail();

            if (
                in_array($product->unit_of_measure, ['unit', 'units', 'unidades', 'box', 'caja', 'package', 'paquete'], true)
                && abs($dto->quantity - round($dto->quantity)) >= 0.0005
            ) {
                throw new InvalidMovementQuantityException(
                    'Los productos medidos por unidades, cajas o paquetes requieren una cantidad entera.'
                );
            }

            $location = $dto->locationId === null
                ? $this->resolveAutomaticLocation($dto, $product)
                : Location::where('tenant_id', $dto->tenantId)->findOrFail($dto->locationId);

            if ($dto->type === 'OUTBOUND') {
                $currentStock = $this->repository->getCurrentStock(
                    $dto->tenantId,
                    $dto->productId,
                    $location->id,
                );

                if ($currentStock < $dto->quantity) {
                    throw new InsufficientStockException(
                        "Stock insuficiente en esta ubicación. Disponible: {$currentStock}; solicitado: {$dto->quantity}."
                    );
                }
            }

            $movement = $this->repository->create(new StockMovementDTO(
                tenantId: $dto->tenantId,
                productId: $dto->productId,
                locationId: $location->id,
                userId: $dto->userId,
                type: $dto->type,
                quantity: $dto->quantity,
                referenceType: $dto->referenceType,
                referenceId: $dto->referenceId,
            ));
            $actor = User::where('tenant_id', $dto->tenantId)->findOrFail($dto->userId);

            InventoryActivity::create([
                'tenant_id' => $dto->tenantId,
                'user_id' => $dto->userId,
                'product_id' => $product->id,
                'action' => $dto->type === 'INBOUND' ? 'stock_in' : 'stock_out',
                'details' => [
                    'actor_name' => $actor->name,
                    'product_name' => $product->name,
                    'sku' => $product->sku,
                    'unit_of_measure' => $product->unit_of_measure,
                    'quantity' => $dto->quantity,
                    'location' => $location->warehouse_code,
                    'reference_type' => $dto->referenceType,
                ],
            ]);

            return $movement;
        });
    }

    private function resolveAutomaticLocation(StockMovementDTO $dto, Product $product): Location
    {
        if ($dto->type === 'OUTBOUND') {
            $stockAtLocation = DB::table('stock_movements')
                ->where('tenant_id', $dto->tenantId)
                ->where('product_id', $dto->productId)
                ->selectRaw(
                    "location_id, SUM(CASE WHEN type = 'INBOUND' THEN quantity WHEN type = 'OUTBOUND' THEN -quantity ELSE 0 END) as available_stock"
                )
                ->groupBy('location_id')
                ->havingRaw(
                    "SUM(CASE WHEN type = 'INBOUND' THEN quantity WHEN type = 'OUTBOUND' THEN -quantity ELSE 0 END) >= ?",
                    [$dto->quantity]
                )
                ->orderByDesc('available_stock')
                ->orderBy('location_id')
                ->first();

            if ($stockAtLocation) {
                return Location::where('tenant_id', $dto->tenantId)->findOrFail($stockAtLocation->location_id);
            }

            $totalAvailable = (float) DB::table('stock_movements')
                ->where('tenant_id', $dto->tenantId)
                ->where('product_id', $dto->productId)
                ->selectRaw(
                    "COALESCE(SUM(CASE WHEN type = 'INBOUND' THEN quantity WHEN type = 'OUTBOUND' THEN -quantity ELSE 0 END), 0) as available_stock"
                )
                ->value('available_stock');

            throw new InsufficientStockException(
                "No hay una ubicación con {$dto->quantity} unidades disponibles. Stock total registrado: {$totalAvailable}."
            );
        }

        if ($product->default_location_id) {
            $defaultLocation = Location::where('tenant_id', $dto->tenantId)->find($product->default_location_id);
            if ($defaultLocation) {
                return $defaultLocation;
            }
        }

        $mostRecentLocationId = StockMovement::where('tenant_id', $dto->tenantId)
            ->where('product_id', $dto->productId)
            ->latest('id')
            ->value('location_id');
        if ($mostRecentLocationId) {
            $recentLocation = Location::where('tenant_id', $dto->tenantId)->find($mostRecentLocationId);
            if ($recentLocation) {
                return $recentLocation;
            }
        }

        return Location::where('tenant_id', $dto->tenantId)->orderBy('id')->first()
            ?? Location::firstOrCreate([
                'tenant_id' => $dto->tenantId,
                'warehouse_code' => 'GENERAL',
                'aisle' => '01',
                'shelf' => 'A',
                'level' => '01',
            ]);
    }

    public function getCurrentStock(int $tenantId)
    {
        return StockMovement::with(["product.category", "location"])
        ->where('tenant_id', $tenantId)
        ->whereHas('product')
        ->select(
            'tenant_id',
            "product_id",
            "location_id",
                DB::raw("SUM(CASE WHEN type = 'INBOUND' THEN quantity ELSE 0 END) as total_inbound"),
                DB::raw("SUM(CASE WHEN type = 'OUTBOUND' THEN quantity ELSE 0 END) as total_outbound"),
                DB::raw("SUM(CASE WHEN type = 'INBOUND' THEN quantity WHEN type = 'OUTBOUND' THEN -quantity ELSE 0 END) as current_stock")
        )
        ->groupBy('tenant_id', "product_id", "location_id")
        ->get();
    }
}
