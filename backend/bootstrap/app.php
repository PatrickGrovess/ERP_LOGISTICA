<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        //
        $middleware->alias([
            "role" => \App\Http\Middleware\CheckRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        
        // 1. Manejo de Errores de Autenticación / JWT (HTTP 401)
        $exceptions->render(function (AuthenticationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthenticated or invalid token.',
                    'code' => 401
                ], 401);
            }
        });

        // 2. Rutas o Recursos No Encontrados (HTTP 404)
        $exceptions->render(function (NotFoundHttpException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'The requested resource or endpoint was not found.',
                    'code' => 404
                ], 404);
            }
        });

        // Conservar los códigos esperados de validación y autorización en la API.
        $exceptions->render(function (Throwable $e, $request) {
            if (!$request->is('api/*')) {
                return null;
            }

            if ($e instanceof ValidationException) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Los datos enviados no son válidos.',
                    'errors' => $e->errors(),
                    'code' => 422,
                ], 422);
            }

            if ($e instanceof AuthorizationException) {
                return response()->json(['status' => 'error', 'message' => 'No tienes permisos.', 'code' => 403], 403);
            }

            if ($e instanceof ModelNotFoundException) {
                return response()->json(['status' => 'error', 'message' => 'El recurso solicitado no existe.', 'code' => 404], 404);
            }

            if ($e instanceof HttpExceptionInterface) {
                $status = $e->getStatusCode();
                return response()->json([
                    'status' => 'error',
                    'message' => $e->getMessage() ?: 'La solicitud no se pudo completar.',
                    'code' => $status,
                ], $status);
            }

            report($e);
            return response()->json([
                'status' => 'error',
                'message' => 'Ocurrió un error interno. Inténtalo de nuevo.',
                'code' => 500,
            ], 500);
        });

    })->create();
