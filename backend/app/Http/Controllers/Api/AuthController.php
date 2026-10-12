<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\Tenant;
use App\Modules\Inventory\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'company_name' => 'required|string|max:255',
            'server_code'  => 'required|string|unique:tenants,server_code|max:50', // <-- Ahora el Staff lo envía y es obligatorio/único
            'name'         => 'required|string|max:255',
            'email'        => 'required|string|email|max:255|unique:users',
            'password'     => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // 1. Crear el Tenant usando el server_code que ingresó el Staff
            $tenant = Tenant::create([
                'name'         => $request->company_name,
                'server_code'  => strtoupper($request->server_code), // Lo guardamos en mayúsculas por orden
                'plan_type'    => null,
                'status'       => 'trial',
                'max_products' => 10,
                'max_users'    => 3,
            ]);

            // 2. Crear el usuario principal como 'staff' vinculado al tenant
            $user = User::create([
                'tenant_id' => $tenant->id,
                'name'      => $request->name,
                'email'     => $request->email,
                'password'  => Hash::make($request->password),
                'role'      => 'staff',
            ]);

            DB::commit();

            $token = JWTAuth::fromUser($user);

            return response()->json([
                'status'  => 'success',
                'message' => 'Empresa registrada exitosamente',
                'server_code' => $tenant->server_code,
                'user'    => $user,
                'tenant'  => $tenant,
                'authorisation' => [
                    'token' => $token,
                    'type'  => 'bearer',
                ]
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Error al registrar la empresa',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'server_code' => 'required|string',
            'email'       => 'required|string|email',
            'password'    => 'required|string',
            'role'        => 'required|string|in:staff,admin,operator', // <-- Validamos que envíe el rol seleccionado en la UI
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        // 1. Buscar el tenant por su código de servidor
        $tenant = Tenant::where('server_code', $request->server_code)->first();

        if (!$tenant) {
            return response()->json([
                'status' => 'error',
                'message' => 'El código de servidor (Server Code) es inválido o no existe.',
            ], 404);
        }

        // 2. Preparar credenciales asegurando el aislamiento del tenant
        $credentials = [
            'email'     => $request->email,
            'password'  => $request->password,
            'tenant_id' => $tenant->id
        ];

        if (! $token = JWTAuth::attempt($credentials)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Credenciales inválidas para este servidor.',
            ], 401);
        }

        $user = JWTAuth::user();

        // 3. Verificar que el rol del usuario coincida con el rol seleccionado en el formulario
        if ($user->role !== $request->role) {
            return response()->json([
                'status'  => 'error',
                'message' => 'El rol seleccionado no corresponde a este usuario.',
            ], 403);
        }

        return response()->json([
            'status' => 'success',
            'user'   => $user,
            'tenant' => $tenant,
            'authorisation' => [
                'token' => $token,
                'type'  => 'bearer',
            ]
        ], 200);
    }

    public function me()
    {
        $user = JWTAuth::parseToken()->authenticate();
        $tenant = $user->tenant; // Obtenemos el tenant asociado al usuario

        return response()->json([
            'status' => 'success',
            'user'   => $user,
            'tenant' => $tenant,
        ]);
    }
}
