<?php

namespace App\Modules\Inventory\Services;

use App\Modules\Inventory\DTOs\StockMovementDTO;
use App\Modules\Inventory\Models\StockMovement;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Repositories\StockMovementRepositoryInterface;
use Illuminate\Support\Facades\DB;

class StockService
{
    public function  __construct(
        private readonly StockMovementRepositoryInterface $repository
    ) {}

    public function registerMovement(StockMovementDTO $dto): StockMovement
    {
        return DB::transaction(function () use ($dto) {
            Product::query()
                ->where('tenant_id', $dto->tenantId)
                ->whereKey($dto->productId)
                ->lockForUpdate()
                ->firstOrFail();

            if ($dto->type === 'OUTBOUND') {
                $currentStock = $this->repository->getCurrentStock(
                    $dto->tenantId,
                    $dto->productId,
                    $dto->locationId,
                );

                if ($currentStock < $dto->quantity) {
                    throw new InsufficientStockException(
                        "Stock insuficiente en esta ubicación. Disponible: {$currentStock}; solicitado: {$dto->quantity}."
                    );
                }
            }

            return $this->repository->create($dto);
        });
    }

    public function getCurrentStock(int $tenantId)
    {
        return StockMovement::with(["product", "location"])
        ->where('tenant_id', $tenantId)
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
