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