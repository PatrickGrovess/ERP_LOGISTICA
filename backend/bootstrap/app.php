<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        //
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

        // 3. Capturador General para cualquier otro Error Servidor (HTTP 500)
        $exceptions->render(function (Throwable $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'status' => 'error',
                    'message' => config('app.debug') 
                        ? $e->getMessage() 
                        : 'An internal server error occurred.',
                    'code' => 500
                ], 500);
            }
        });

    })->create();