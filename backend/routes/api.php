<?php

use App\Modules\Inventory\Controllers\StockController;
use App\Http\Controllers\Api\AuthController;
use App\Modules\Inventory\Controllers\ProductController;
use App\Modules\Inventory\Controllers\LocationController;
use App\Modules\Inventory\Controllers\UserController;
use App\Modules\Inventory\Controllers\TenantSettingsController;
use Illuminate\Support\Facades\Route;

// Route::prefix("v1/inventory")->group(function() {
//     Route::post("/movements", [StockController::class, 'store']);
// });

Route::prefix("v1/auth")->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

    Route::middleware('auth:api')->group(function () {
        Route::get('/me', [AuthController::class, 'me'])->middleware('role:staff,admin,operator');
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::patch('/profile', [AuthController::class, 'updateProfile'])->middleware('role:staff,admin,operator');

        Route::middleware('role:staff,admin')->group(function () {
            Route::post('/team-members', [AuthController::class, 'createTeamMember'])->middleware('throttle:10,1');
            Route::patch('/users/{id}', [UserController::class, 'update']);
        });
    });
});

Route::middleware(['auth:api', 'role:staff'])->prefix('v1/settings')->group(function () {
    Route::get('/', [TenantSettingsController::class, 'show']);
    Route::put('/', [TenantSettingsController::class, 'update']);
});

// Rutas de inventario protegidas por el token jwt y multi-tenancy automático
Route::middleware("auth:api")->prefix("inventory")->group(function () {

    // Staff, Admin y Operador pueden consultar
    Route::middleware('role:staff,admin,operator')->group(function () {
        Route::get('/movements', [StockController::class, 'index']);
        Route::get('/stock', [StockController::class, 'currentStock']);
        Route::get('/products', [ProductController::class, 'index']);
        Route::get('/locations', [LocationController::class, 'index']);
    });

    // Staff y Admin pueden registrar nuevos productos y movimientos de stock
    Route::middleware('role:staff,admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/products', [ProductController::class, 'store']);
        Route::post('/locations', [LocationController::class, 'store']);
        Route::post('/movements', [StockController::class, 'store']);
        Route::post('/items', [StockController::class, 'storeItem']);
    });
});
