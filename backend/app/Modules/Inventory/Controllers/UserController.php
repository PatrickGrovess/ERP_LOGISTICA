<?php

namespace App\Modules\Inventory\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Exception;

class UserController extends Controller
{
    public function update(Request $request, $id): JsonResponse
    {
        try {
            // Autenticar que el usuario que hace la petición sea admin o staff
            $authUser = JWTAuth::parseToken()->authenticate();
            if (!in_array(strtolower($authUser->role), ['staff', 'admin'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No tienes permisos para modificar usuarios.'
                ], 403);
            }

            // Buscar el usuario dentro del mismo tenant para mantener la seguridad multi-tenant
            $targetUser = User::where('id', $id)
                ->where('tenant_id', $authUser->tenant_id)
                ->first();

            if (!$targetUser) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Usuario no encontrado.'
                ], 404);
            }

            // Validar y actualizar los campos enviados (status o role)
            $validated = $request->validate([
                'status' => 'sometimes|string|in:Active,Restricted,active,restricted',
                'role'   => 'sometimes|string|in:staff,admin,operator',
            ]);

            if (isset($validated['status'])) {
                // Si guardas el estado tal cual o normalizado (ej: 'Active' / 'Restricted')
                $targetUser->status = ucfirst(strtolower($validated['status']));
            }

            if (isset($validated['role'])) {
                $targetUser->role = strtolower($validated['role']);
            }

            $targetUser->save();

            return response()->json([
                'status' => 'success',
                'message' => 'Usuario actualizado exitosamente',
                'data' => $targetUser
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al actualizar el usuario: ' . $e->getMessage()
            ], 400);
        }
    }

    public function index(): JsonResponse
    {
        try {
            $authUser = JWTAuth::parseToken()->authenticate();

            // Traer todos los usuarios del mismo tenant
            $users = User::where('tenant_id', $authUser->tenant_id)->get();

            return response()->json([
                'status' => 'success',
                'data' => $users
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener los usuarios: ' . $e->getMessage()
            ], 500);
        }
    }
}
