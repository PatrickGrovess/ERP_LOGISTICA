<?php
namespace App\Modules\Inventory\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Requests\StoreStockMovementRequest;
use App\Modules\Inventory\DTOs\StockMovementDTO;
use App\Modules\Inventory\Services\StockService;
use Illuminate\Http\JsonResponse;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Exception;

class StockController extends Controller
{
    public function __construct(
        private readonly StockService $stockService
    )
    {}

    public function store(storeStockMovementRequest $request) : jsonResponse
    {
        try{
            $data = $request->validated();

            $data['user_id'] = JWTAuth::parseToken()->authenticate()->id;
            
            
            $dto = StockMovementDTO::fromArray($data);  

            $movement = $this->stockService->registerMovement($dto);

            return response()->json([
                'message' => 'Stock movement registered successfully',
                'data' => $movement
            ], 201);
        }catch(Exception $e){
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);

        }
    }


}