<?php

namespace App\Modules\Inventory\Repositories;

use App\Modules\Inventory\Models\StockMovement;
use App\Modules\Inventory\DTOs\StockMovementDTO;
use Illuminate\Support\Facades\DB;

class EloquentStockMovementRepository implements StockMovementRepositoryInterface
{
    public function create(StockMovementDTO $stockMovementDTO): StockMovement
    {
        return StockMovement::create([
            'tenant_id' => $stockMovementDTO->tenantId,
            'product_id' => $stockMovementDTO->productId,
            'location_id' => $stockMovementDTO->locationId,
            'user_id'     => $stockMovementDTO->userId,
            'type' => $stockMovementDTO->type,
            'quantity' => $stockMovementDTO->quantity,
            'reference_type' => $stockMovementDTO->referenceType,
            'reference_id' => $stockMovementDTO->referenceId,
        ]);
    }

    public function getCurrentStock(int $tenantId, int $productId, int $locationId): float
    {
        return (float) DB::table('stock_movements')
            ->where('tenant_id', $tenantId)
            ->where('product_id', $productId)
            ->where('location_id', $locationId)
            ->selectRaw("COALESCE(SUM(CASE WHEN type = 'INBOUND' THEN quantity WHEN type = 'OUTBOUND' THEN -quantity ELSE 0 END), 0) as current_stock")
            ->value('current_stock');
    }
}
