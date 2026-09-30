<?php

use App\Modules\Inventory\Controllers\StockController;
use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

Route::prefix("v1/inventory")->group(function() {
    Route::post("/movements", [StockController::class, 'store']);
});

Route::prefix("v1/auth")->group(function(){
    Route::post("/register", [AuthController::class, 'register']);
    Route::post("/login", [AuthController::class, 'login']);

    Route::middleware("auth:api")->get("me", [AuthController::class, 'me']);
});

// Rutas de inventario protegidas por el token jwt
Route::middleware("auth:api")->prefix("inventory")->group(function () {

   // Tanto Admin como Operador pueden consultar
    Route::middleware('role:admin,operator')->group(function () {
        Route::get('/movements', [StockController::class, 'index']);
        Route::get('/stock', [StockController::class, 'currentStock']);
    });

    // Solo Admin puede registrar nuevos movimientos de stock
    Route::middleware('role:admin')->group(function () {
        Route::post('/movements', [StockController::class, 'store']);
    });
});