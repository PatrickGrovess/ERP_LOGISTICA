<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->string('warehouse_code', 20); // Ej: 'WH-A'
            $table->string('aisle', 10);          // Pasillo: '01'
            $table->string('shelf', 10);          // Estante: 'B'
            $table->string('level', 10);          // Nivel/Altura: '03'
            $table->unique(['warehouse_code', 'aisle', 'shelf', 'level'], 'location_unique_index');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('locations');
    }
};
