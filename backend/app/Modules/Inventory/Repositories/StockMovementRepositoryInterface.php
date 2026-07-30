<?php

namespace App\Modules\Inventory\Repositories;

use App\Modules\Inventory\Models\StockMovement;
use App\Modules\Inventory\DTOs\StockMovementDTO;

interface StockMovementRepositoryInterface
{
    public function create(StockMovementDTO $stockMovementDTO): StockMovement;

    public function getCurrentStock(int $productId): int;
}