<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles  <-- RECIBE LOS ROLES PASADOS EN LA RUTA
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = auth("api")->user();

        // Si no hay usuario o su rol NO está dentro del arreglo de roles permitidos
        if (! $user || ! in_array($user->role, $roles)) {
            return response()->json([
                "status" => "error",
                "message" => "Forbidden: You do not have the required permissions to access this resource.",
                "code" => 403
            ], 403);
        }

        return $next($request);
    }
}
