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
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            // Restricciones de llaves foráneas estrictas
            $table->foreignId('product_id')->constrained()->onDelete('restrict');
            $table->foreignId('location_id')->constrained()->onDelete('restrict');

            // Tipo de movimiento restringido por base de datos (Enum o String validado)
            $table->string('type'); // 'INBOUND', 'OUTBOUND', 'ADJUSTMENT'
            $table->integer('quantity'); // Puede ser positivo (entrada) o negativo (salida)

            $table->string('reference_type')->nullable(); // 'ORDER', 'INVOICE', 'MANUAL_ADJUSTMENT'
            $table->string('reference_id')->nullable();   // ID del documento que generó esto

            $table->foreignId('user_id')->constrained(); // Quién lo hizo (Auditoría)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
