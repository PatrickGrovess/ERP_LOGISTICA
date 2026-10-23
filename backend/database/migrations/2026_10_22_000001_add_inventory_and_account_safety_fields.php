<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->prepareExistingIdentityValues();

        if (!Schema::hasColumn('products', 'unit_price')) {
            Schema::table('products', function (Blueprint $table) {
                $table->decimal('unit_price', 10, 2)->default(0)->after('unit_of_measure');
            });
        }

        if (!Schema::hasColumn('users', 'status')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('status', 20)->default('active')->after('role');
            });
        }

        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique('products_sku_unique');
            $table->unique(['tenant_id', 'sku'], 'products_tenant_sku_unique');
        });

        DB::table('products')->update(['sku' => DB::raw('UPPER(TRIM(sku))')]);

        Schema::table('locations', function (Blueprint $table) {
            $table->dropUnique('location_unique_index');
            $table->unique(
                ['tenant_id', 'warehouse_code', 'aisle', 'shelf', 'level'],
                'locations_tenant_position_unique'
            );
        });

        DB::transaction(fn () => $this->backfillLegacyMovements());

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->index(
                ['tenant_id', 'product_id', 'location_id'],
                'stock_movements_tenant_stock_index'
            );
            $table->index(
                ['tenant_id', 'created_at'],
                'stock_movements_tenant_created_index'
            );
        });

        if (!Schema::hasColumn('tenants', 'low_stock_threshold')) {
            Schema::table('tenants', function (Blueprint $table) {
                $table->unsignedInteger('low_stock_threshold')->default(10);
            });
        }

        if (!Schema::hasColumn('tenants', 'currency')) {
            Schema::table('tenants', function (Blueprint $table) {
                $table->string('currency', 3)->default('COP');
            });
        }

        if (!Schema::hasColumn('tenants', 'auto_notifications')) {
            Schema::table('tenants', function (Blueprint $table) {
                $table->boolean('auto_notifications')->default(true);
            });
        }
    }

    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropIndex('stock_movements_tenant_stock_index');
            $table->dropIndex('stock_movements_tenant_created_index');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique('products_tenant_sku_unique');
            $table->unique('sku');
        });

        Schema::table('locations', function (Blueprint $table) {
            $table->dropUnique('locations_tenant_position_unique');
            $table->unique(
                ['warehouse_code', 'aisle', 'shelf', 'level'],
                'location_unique_index'
            );
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['low_stock_threshold', 'currency', 'auto_notifications']);
        });
    }

    /**
     * Older movement records did not consistently save a tenant ID. Assign
     * them only when the product and actor belong to the same tenant, and
     * ensure each tenant has its own location row before exposing the ledger.
     * Inconsistent historical rows remain unassigned and are excluded from
     * tenant inventory totals until they can be reviewed manually.
     */
    private function backfillLegacyMovements(): void
    {
        DB::table('stock_movements')->update(['tenant_id' => null]);

        DB::table('stock_movements')
            ->join('products', 'products.id', '=', 'stock_movements.product_id')
            ->join('users', 'users.id', '=', 'stock_movements.user_id')
            ->join('locations', 'locations.id', '=', 'stock_movements.location_id')
            ->whereColumn('products.tenant_id', 'users.tenant_id')
            ->select([
                'stock_movements.id as id',
                'products.tenant_id as tenant_id',
                'locations.warehouse_code as warehouse_code',
                'locations.aisle as aisle',
                'locations.shelf as shelf',
                'locations.level as level',
            ])
            ->chunkById(500, function ($movements): void {
                foreach ($movements as $movement) {
                    $tenantId = (int) $movement->tenant_id;
                    $locationId = DB::table('locations')
                        ->where('tenant_id', $tenantId)
                        ->where('warehouse_code', $movement->warehouse_code)
                        ->where('aisle', $movement->aisle)
                        ->where('shelf', $movement->shelf)
                        ->where('level', $movement->level)
                        ->value('id');

                    if (!$locationId) {
                        $locationId = DB::table('locations')->insertGetId([
                            'tenant_id' => $tenantId,
                            'warehouse_code' => $movement->warehouse_code,
                            'aisle' => $movement->aisle,
                            'shelf' => $movement->shelf,
                            'level' => $movement->level,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }

                    DB::table('stock_movements')->where('id', $movement->id)->update([
                        'tenant_id' => $tenantId,
                        'location_id' => $locationId,
                    ]);
                }
            }, 'stock_movements.id', 'id');
    }

    private function prepareExistingIdentityValues(): void
    {
        $duplicateEmails = DB::table('users')
            ->selectRaw('LOWER(TRIM(email)) as normalized_email')
            ->groupBy('normalized_email')
            ->havingRaw('COUNT(*) > 1')
            ->exists();

        if ($duplicateEmails) {
            throw new RuntimeException(
                'Hay correos que solo se diferencian por mayúsculas o espacios. Corrígelos antes de migrar.'
            );
        }

        $duplicateSkus = DB::table('products')
            ->selectRaw('tenant_id, UPPER(TRIM(sku)) as normalized_sku')
            ->groupBy('tenant_id', 'normalized_sku')
            ->havingRaw('COUNT(*) > 1')
            ->exists();

        if ($duplicateSkus) {
            throw new RuntimeException(
                'Hay SKU duplicados dentro de una empresa al ignorar mayúsculas y espacios. Corrígelos antes de migrar.'
            );
        }

        DB::table('users')->update(['email' => DB::raw('LOWER(TRIM(email))')]);
    }
};
