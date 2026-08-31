<?php

use App\Modules\Inventory\Controllers\StockController;
use Illuminate\Support\Facades\Route;

Route::prefix("v1/inventory")->group(function() {
    Route::post("/movements", [StockController::class, 'store']);
});