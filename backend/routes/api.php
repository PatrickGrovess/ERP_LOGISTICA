<?php

use App\Modules\Inventory\Controllers\StockController;
use App\Http\Controllers\Api\AuthController;
use App\Modules\Inventory\Controllers\ProductController;
use App\Modules\Inventory\Controllers\LocationController;
use App\Modules\Inventory\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// Route::prefix("v1/inventory")->group(function() {
//     Route::post("/movements", [StockController::class, 'store']);
// });

Route::prefix("v1/auth")->group(function () {
    Route::post("/register", [AuthController::class, 'register']);
    Route::post("/login", [AuthController::class, 'login']);
    Route::patch('/users/{id}', [UserController::class, 'update']);

    Route::middleware("auth:api")->get("me", [AuthController::class, 'me']);
});

// Rutas de inventario protegidas por el token jwt y multi-tenancy automático
Route::middleware("auth:api")->prefix("inventory")->group(function () {

    // Staff, Admin y Operador pueden consultar
    Route::middleware('role:staff,admin,operator')->group(function () {
        Route::get('/movements', [StockController::class, 'index']);
        Route::get('/stock', [StockController::class, 'currentStock']);
        Route::get('/products', [ProductController::class, 'index']);
        Route::get('/locations', [LocationController::class, 'index']);
        Route::get('/users', [UserController::class, 'index']);
    });

    // Staff y Admin pueden registrar nuevos productos y movimientos de stock
    Route::middleware('role:staff,admin')->group(function () {
        Route::post('/products', [ProductController::class, 'store']);
        Route::post('/locations', [LocationController::class, 'store']);
        Route::post('/movements', [StockController::class, 'store']);
    });
});
