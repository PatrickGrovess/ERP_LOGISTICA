<?php
namespace App\Modules\Inventory\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStockMovementRequest extends FormRequest
{
    public function authorize() : bool
    {
        return true;
    }

    public function rules() : array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'product_id'  => ['required', 'integer'],
            'location_id' => ['required', 'integer'],
            'type'        => ['required', 'string', 'in:INBOUND,OUTBOUND,ADJUSTMENT'],
            'quantity'    => ['required', 'integer', 'min:1'],
        ];
    }
}