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
        Schema::create("tenants", function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Nombre del negocio / empresa
            $table->string('server_code')->unique(); // Ej: JDU73-IEH83-OH382
            // Nullable para obligar al usuario a elegir un plan (basic, pro, enterprise)
            $table->enum('plan_type', ['basic', 'pro', 'enterprise'])->nullable();
            // Estado inicial en 'trial' o 'pending_plan'
            $table->enum('status', ['trial', 'pending_plan', 'active', 'suspended', 'cancelled'])->default('trial');
            // Límites para la prueba gratuita (Trial)
            $table->integer('max_products')->default(3);
            $table->integer('max_users')->default(1);
            $table->integer('max_movements')->default(5);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
