<?php

namespace App\Modules\Inventory\DTOs;

class StockMovementDTO
{
    public function __construct(
        public readonly int $tenantId,
        public readonly int $productId,
        public readonly ?int $locationId,
        public readonly int $userId,
        public readonly string $type, 
        public readonly float $quantity,
        public readonly ?string $referenceType = null,
        public readonly ?string $referenceId = null,
    ) {}

    public static function fromArray(array $data) : self
    {
        return new self(
            tenantId: $data['tenant_id'],
            productId: $data['product_id'],
            locationId: isset($data['location_id']) ? (int) $data['location_id'] : null,
            userId: $data['user_id'],
            type: $data['type'],
            quantity: (float) $data['quantity'],
            referenceType: $data['reference_type'] ?? null,
            referenceId: $data['reference_id'] ?? null,
        );
    }
}
