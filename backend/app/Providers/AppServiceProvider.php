<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Modules\Inventory\Repositories\StockMovementRepositoryInterface;
use app\Modules\Inventory\Repositories\EloquentStockMovementRepository;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            StockMovementRepositoryInterface::class,
            EloquentStockMovementRepository::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
