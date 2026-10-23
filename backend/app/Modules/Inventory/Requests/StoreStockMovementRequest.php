<?php
namespace App\Modules\Inventory\Requests;

use App\Modules\Inventory\Models\Location;
use App\Modules\Inventory\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStockMovementRequest extends FormRequest
{
    public function authorize() : bool
    {
        return true;
    }

    public function rules() : array
    {
        $tenantId = $this->user('api')?->tenant_id;

        return [
            'product_id' => [
                'required',
                'integer',
                Rule::exists((new Product())->getTable(), 'id')->where('tenant_id', $tenantId),
            ],
            'location_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists((new Location())->getTable(), 'id')->where('tenant_id', $tenantId),
            ],
            'type' => ['required', 'string', 'in:INBOUND,OUTBOUND'],
            'quantity'    => ['required', 'numeric', 'gt:0', 'decimal:0,3', 'max:999999999.999'],
            'reference_type' => ['nullable', 'string', 'in:ORDER,INVOICE,MANUAL_ADJUSTMENT'],
            'reference_id' => ['nullable', 'string', 'max:255'],
        ];
    }
}
