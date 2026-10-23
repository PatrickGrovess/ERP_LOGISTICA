<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('stock_movements as movements')
            ->leftJoin('products as products', 'products.id', '=', 'movements.product_id')
            ->leftJoin('locations as locations', 'locations.id', '=', 'movements.location_id')
            ->leftJoin('users as users', 'users.id', '=', 'movements.user_id')
            ->whereNotNull('movements.tenant_id')
            ->orderBy('movements.id')
            ->select([
                'movements.id as movement_id',
                'movements.tenant_id',
                'movements.user_id',
                'movements.product_id',
                'movements.type',
                'movements.quantity',
                'movements.reference_type',
                'movements.created_at',
                'products.name as product_name',
                'products.sku',
                'products.unit_of_measure',
                'locations.warehouse_code',
                'users.name as actor_name',
            ])
            ->chunkById(500, function ($movements): void {
                $activities = [];

                foreach ($movements as $movement) {
                    $activities[] = [
                        'tenant_id' => $movement->tenant_id,
                        'user_id' => $movement->user_id,
                        'product_id' => $movement->product_id,
                        'action' => $movement->type === 'INBOUND' ? 'stock_in' : 'stock_out',
                        'details' => json_encode([
                            'legacy_movement_id' => $movement->movement_id,
                            'actor_name' => $movement->actor_name,
                            'product_name' => $movement->product_name,
                            'sku' => $movement->sku,
                            'unit_of_measure' => $movement->unit_of_measure,
                            'quantity' => $movement->quantity,
                            'location' => $movement->warehouse_code,
                            'reference_type' => $movement->reference_type,
                        ], JSON_THROW_ON_ERROR),
                        'created_at' => $movement->created_at,
                        'updated_at' => $movement->created_at,
                    ];
                }

                if ($activities !== []) {
                    DB::table('inventory_activities')->insert($activities);
                }
            }, 'movements.id', 'movement_id');
    }

    public function down(): void
    {
        DB::table('inventory_activities')
            ->whereIn('action', ['stock_in', 'stock_out'])
            ->whereRaw("JSON_EXTRACT(details, '$.legacy_movement_id') IS NOT NULL")
            ->delete();
    }
};
