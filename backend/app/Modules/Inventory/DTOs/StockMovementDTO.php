<?php

namespace App\Modules\Inventory\DTOs;

class StockMovementDTO
{
    public function __construct(
        public readonly int $productId,
        public readonly int $locationId,
        public readonly int $userId,
        public readonly string $type, 
        public readonly int $quantity
    ) {}

    public static function fromArray(array $data) : self
    {
        return new self(
            productId: $data['product_id'],
            locationId: $data['location_id'],
            userId: $data['user_id'] ?? auth()->id() ?? 1,
            type: $data['type'],
            quantity: $data['quantity']
        );
    }
}