<?php

namespace App\Modules\Inventory\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function update(Request $request, int $id): JsonResponse
    {
        $actor = $request->user('api');
        $target = User::where('tenant_id', $actor->tenant_id)->findOrFail($id);

        // El usuario responsable no se puede bloquear ni degradar desde gestión de equipo.
        if ($target->id === $actor->id || $target->role === 'staff') {
            return response()->json([
                'status' => 'error',
                'message' => 'No se puede modificar la cuenta responsable ni la sesión actual.',
            ], 403);
        }

        if ($actor->role === 'admin' && $target->role !== 'operator') {
            return response()->json([
                'status' => 'error',
                'message' => 'Un administrador solo puede gestionar operadores.',
            ], 403);
        }

        $validated = $request->validate([
            'status' => ['sometimes', 'string', Rule::in(['active', 'restricted'])],
            'role' => ['sometimes', 'string', Rule::in(['admin', 'operator'])],
        ]);

        if ($validated === []) {
            return response()->json([
                'status' => 'error',
                'message' => 'Indica el estado o el rol que quieres actualizar.',
            ], 422);
        }

        if ($actor->role === 'admin' && ($validated['role'] ?? null) === 'admin') {
            return response()->json([
                'status' => 'error',
                'message' => 'Solo el responsable de la empresa puede asignar el rol de administrador.',
            ], 403);
        }

        $target->fill($validated)->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Usuario actualizado.',
            'data' => $target->fresh(),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $users = User::where('tenant_id', $request->user('api')->tenant_id)
            ->orderBy('name')
            ->get();

        return response()->json(['status' => 'success', 'data' => $users]);
    }
}
