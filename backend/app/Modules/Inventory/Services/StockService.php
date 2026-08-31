<?php

namespace App\Modules\Inventory\Services;

use App\Modules\Inventory\DTOs\StockMovementDTO;
use App\Modules\Inventory\Models\StockMovement;
use App\Modules\Inventory\Repositories\StockMovementRepositoryInterface;
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
}
