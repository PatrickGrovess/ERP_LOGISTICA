<?php

namespace App\Modules\Inventory\DTOs;

class stockMovementDTO
{
    public function __construct(
        public readonly int $productId,
        public readonly int $locationId,
        public readonly string $type, 
        public readonly int $quantity
    ) {}

    public static function fromArray(array $data) : self
    {
        return new self(
            productId: $data['product_id'],
            locationId: $data['location_id'],
            type: $data['type'],
            quantity: $data['quantity']
        );
    }
}