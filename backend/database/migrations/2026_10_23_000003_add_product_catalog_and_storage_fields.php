<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const DEFAULT_CATEGORIES = [
        'Alimentos',
        'Bebidas',
        'Limpieza',
        'Oficina',
        'Electrónica',
        'Repuestos',
        'Otros',
    ];

    public function up(): void
    {
        Schema::create('product_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name', 80);
            $table->timestamps();
            $table->unique(['tenant_id', 'name'], 'product_categories_tenant_name_unique');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('category_id')->nullable()->after('tenant_id')
                ->constrained('product_categories')->nullOnDelete();
            $table->string('storage_condition', 20)->default('ambient')->after('unit_price');
            $table->text('storage_notes')->nullable()->after('storage_condition');
            $table->foreignId('default_location_id')->nullable()->after('storage_notes')
                ->constrained('locations')->nullOnDelete();
        });

        // Kilograms and liters can be fractional, so inventory quantities need
        // three decimal places while retaining existing whole-number values.
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->decimal('quantity', 12, 3)->change();
        });

        $now = now();
        DB::table('tenants')->select('id')->orderBy('id')->chunkById(500, function ($tenants) use ($now): void {
            $rows = [];
            foreach ($tenants as $tenant) {
                foreach (self::DEFAULT_CATEGORIES as $name) {
                    $rows[] = [
                        'tenant_id' => $tenant->id,
                        'name' => $name,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }

            if ($rows !== []) {
                DB::table('product_categories')->insertOrIgnore($rows);
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropForeign(['default_location_id']);
            $table->dropColumn(['category_id', 'storage_condition', 'storage_notes', 'default_location_id']);
        });

        // Rolling back this migration converts fractional quantities to whole
        // numbers and can truncate them. Back up data before rolling it back.
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->integer('quantity')->change();
        });

        Schema::dropIfExists('product_categories');
    }
};
