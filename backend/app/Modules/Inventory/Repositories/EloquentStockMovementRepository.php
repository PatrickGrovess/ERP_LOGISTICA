<?php

namespace App\Modules\Inventory\Repositories;

use App\modules\Inventory\Models\StockMovement;
use App\Modules\Inventory\DTOs\StockMovementDTO;
use Illuminate\Support\Facades\DB;

class EloquentStockMovementRepository implements StockMovementRepositoryInterface
{
    public function create(StockMovementDTO $stockMovementDTO): StockMovement
    {
        return StockMovement::create([
            'product_id' => $stockMovementDTO->productId,
            'location_id' => $stockMovementDTO->locationId,
            'user_id'     => $stockMovementDTO->userId,
            'type' => $stockMovementDTO->type,
            'quantity' => $stockMovementDTO->quantity,
        ]);
    }

    public function getCurrentStock(int $productId): int
    {
        return (int) DB::table('stock_movements')
            ->where('product_id', $productId)
            ->sum('quantity');
    }
}
