<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\Tenant;
use App\Modules\Inventory\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->merge([
            'server_code' => strtoupper(trim((string) $request->input('server_code'))),
            'email' => strtolower(trim((string) $request->input('email'))),
        ]);
        $validated = $request->validate([
            'company_name' => ['required', 'string', 'max:255'],
            'server_code' => ['required', 'string', 'max:50', 'regex:/^[A-Z0-9]{5}(?:-[A-Z0-9]{5}){2}$/', Rule::unique('tenants', 'server_code')],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:10', 'max:255', 'confirmed'],
        ]);

        [$tenant, $user] = DB::transaction(function () use ($validated) {
            $tenant = Tenant::create([
                'name' => $validated['company_name'],
                'server_code' => $validated['server_code'],
                'plan_type' => null,
                'status' => 'trial',
                'max_products' => 10,
                'max_users' => 3,
                'low_stock_threshold' => 10,
                'currency' => 'COP',
                'auto_notifications' => true,
            ]);

            $user = User::create([
                'tenant_id' => $tenant->id,
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'staff',
                'status' => 'active',
            ]);

            return [$tenant, $user];
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Empresa registrada exitosamente',
            'server_code' => $tenant->server_code,
            'user' => $user,
            'tenant' => $tenant,
        ], 201);
    }

    public function createTeamMember(Request $request)
    {
        $request->merge(['email' => strtolower(trim((string) $request->input('email')))]);
        $actor = auth('api')->user();
        $validated = $request->validate([
            'fullName' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:10', 'max:255'],
            'role' => ['required', Rule::in(['admin', 'operator'])],
        ]);

        if ($actor->role === 'admin' && $validated['role'] !== 'operator') {
            return response()->json([
                'status' => 'error',
                'message' => 'Solo el responsable de la empresa puede crear administradores.',
            ], 403);
        }

        $user = DB::transaction(function () use ($actor, $validated) {
            $tenant = Tenant::whereKey($actor->tenant_id)->lockForUpdate()->firstOrFail();
            if (User::where('tenant_id', $tenant->id)->count() >= $tenant->max_users) {
                abort(409, 'Se alcanzó el límite de usuarios de este plan.');
            }

            return User::create([
                'tenant_id' => $tenant->id,
                'name' => $validated['fullName'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => $validated['role'],
                'status' => 'active',
            ]);
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Miembro del equipo creado exitosamente.',
            'user' => $user,
        ], 201);
    }

    public function login(Request $request)
    {
        $request->merge([
            'server_code' => strtoupper(trim((string) $request->input('server_code'))),
            'email' => strtolower(trim((string) $request->input('email'))),
        ]);
        $validator = Validator::make($request->all(), [
            'server_code' => ['required', 'string', 'regex:/^[A-Z0-9]{5}(?:-[A-Z0-9]{5}){2}$/'],
            'email'       => 'required|string|email',
            'password'    => 'required|string',
            'role'        => 'required|string|in:staff,admin,operator',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        $tenant = Tenant::where('server_code', $request->server_code)->first();

        if (!$tenant) {
            return response()->json([
                'status' => 'error',
                'message' => 'El código de servidor (Server Code) es inválido o no existe.',
            ], 404);
        }

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

        if ($user->status !== 'active' || in_array($tenant->status, ['suspended', 'cancelled'], true)) {
            JWTAuth::setToken($token)->invalidate();

            return response()->json([
                'status' => 'error',
                'message' => 'La cuenta o la empresa no están habilitadas.',
            ], 403);
        }

        if ($user->role !== $request->role) {
            JWTAuth::setToken($token)->invalidate();
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
        $tenant = $user->tenant;

        return response()->json([
            'status' => 'success',
            'user'   => $user,
            'tenant' => $tenant,
        ]);
    }

    public function logout()
    {
        JWTAuth::parseToken()->invalidate();

        return response()->json(['status' => 'success', 'message' => 'Sesión cerrada.']);
    }

    public function updateProfile(Request $request)
    {
        $user = auth('api')->user();
        $request->merge(['email' => strtolower(trim((string) $request->input('email')))]);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'current_password' => ['required_with:new_password', 'current_password:api'],
            'new_password' => ['nullable', 'string', 'min:10', 'max:255', 'confirmed'],
        ]);

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        if (!empty($validated['new_password'])) {
            $user->password = Hash::make($validated['new_password']);
        }
        $user->save();

        return response()->json([
            'status' => 'success',
            'user' => $user->fresh(),
        ]);
    }
}
