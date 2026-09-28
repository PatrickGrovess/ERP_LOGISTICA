<?php

namespace App\Modules\Inventory\Services;

use App\Modules\Inventory\DTOs\StockMovementDTO;
use App\Modules\Inventory\Models\StockMovement;
use App\Modules\Inventory\Repositories\StockMovementRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Exception;

class StockService
{
    public function  __construct(
        private readonly StockMovementRepositoryInterface $repository
    ) {}

    public function registerMovement(stockMovementDTO $dto): StockMovement
    {
        if ($dto->type === "OUTBOUND") {
            $currentStock = $this->repository->getCurrentStock($dto->productId);

            if ($currentStock < $dto->quantity) {
                throw new Exception("Stock insuficiente. Stock actual: {$currentStock}, intentas retirar: {$dto->quantity}");
            }
        }

        return $this->repository->create($dto);
    }

    public function getCurrentStock()
    {
        return StockMovement::with(["product", "location"])
        ->select(
            "product_id",
            "location_id",
                DB::raw("SUM(CASE WHEN type = 'INBOUND' THEN quantity ELSE 0 END) as total_inbound"),
                DB::raw("SUM(CASE WHEN type = 'OUTBOUND' THEN quantity ELSE 0 END) as total_outbound"),
                DB::raw("SUM(CASE WHEN type = 'INBOUND' THEN quantity WHEN type = 'OUTBOUND' THEN -quantity ELSE 0 END) as current_stock")
        )
        ->groupBy("product_id", "location_id")
        ->get();
    }
}
